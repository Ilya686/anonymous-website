import { NextResponse } from 'next/server';

// CORS заголовки для всех ответов
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };
}

// Rate limiting: хранилище для IP-адресов и их запросов
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута в миллисекундах
const RATE_LIMIT_MAX_REQUESTS = 3; // Максимум 3 запроса в минуту

// Функция для получения IP-адреса клиента
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}

// Функция для проверки rate limit
function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Удаляем старые запросы (старше 1 минуты)
  const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: recentRequests[0] + RATE_LIMIT_WINDOW
    };
  }
  
  // Добавляем текущий запрос
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  // Очистка старых записей (каждые 100 запросов)
  if (rateLimitMap.size > 1000) {
    const cutoff = now - RATE_LIMIT_WINDOW;
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const filtered = timestamps.filter(t => t > cutoff);
      if (filtered.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, filtered);
      }
    }
  }
  
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - recentRequests.length,
    resetAt: recentRequests[0] + RATE_LIMIT_WINDOW
  };
}

// Функция для проверки Turnstile токена
async function verifyTurnstileToken(token, ip) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('[Turnstile] TURNSTILE_SECRET_KEY is not set in environment variables');
    return { success: false, error: 'Turnstile not configured' };
  }
  
  if (!token) {
    return { success: false, error: 'Turnstile token is missing' };
  }
  
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: ip
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('[Turnstile] Verification successful for IP:', ip);
      return { success: true };
    } else {
      console.error('[Turnstile] Verification failed:', data['error-codes']);
      return { success: false, error: data['error-codes']?.join(', ') || 'Verification failed' };
    }
  } catch (error) {
    console.error('[Turnstile] Error verifying token:', error);
    return { success: false, error: error.message };
  }
}

// Обработка OPTIONS (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function POST(request) {
  // Проверяем метод запроса
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { 
        status: 405,
        headers: corsHeaders()
      }
    );
  }
  
  // Получаем IP-адрес клиента
  const clientIP = getClientIP(request);
  
  // Проверка rate limit
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    console.warn('[Rate Limit] Too many requests from IP:', clientIP);
    return NextResponse.json(
      { 
        error: 'Too many requests',
        message: `Превышен лимит запросов. Попробуйте снова через ${resetIn} секунд.`,
        retryAfter: resetIn
      },
      { 
        status: 429,
        headers: {
          ...corsHeaders(),
          'Retry-After': resetIn.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString()
        }
      }
    );
  }
  
  try {
    const body = await request.json();
    console.log('[Create Payment] Received request body:', JSON.stringify(body, null, 2));
    
    const { price_amount, price_currency = 'eur', pay_currency = 'btc', order_description, turnstile_token } = body;
    
    // Проверка Turnstile токена
    const turnstileVerification = await verifyTurnstileToken(turnstile_token, clientIP);
    if (!turnstileVerification.success) {
      console.error('[Create Payment] Turnstile verification failed:', turnstileVerification.error);
      return NextResponse.json(
        { 
          error: 'Security verification failed',
          details: turnstileVerification.error || 'Please complete the security check'
        },
        { status: 403, headers: corsHeaders() }
      );
    }

    // Проверяем обязательные параметры
    if (!price_amount || !order_description) {
      console.error('[Create Payment] Missing required parameters:', { price_amount, order_description });
    return NextResponse.json(
      { error: 'price_amount and order_description are required' },
      { status: 400, headers: corsHeaders() }
    );
    }

    // Получаем API ключ из переменных окружения
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      console.error('[Create Payment] NOWPAYMENTS_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Payment service configuration error: API key not configured' },
        { status: 500, headers: corsHeaders() }
      );
    }
    
    console.log('[Create Payment] API key found:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

    // Получаем базовый URL из заголовков запроса или переменных окружения
    const headers = request.headers;
    const host = headers.get('host') || '';
    const protocol = headers.get('x-forwarded-proto') || 'https';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `${protocol}://${host}` : 'https://your-domain.vercel.app');
    
    console.log('[Create Payment] Base URL:', baseUrl);


    // Убеждаемся, что price_amount - число
    const numericAmount = Number(price_amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.error('[Create Payment] Invalid price_amount:', price_amount);
      return NextResponse.json(
        { error: 'Invalid price_amount: must be a positive number' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Подготавливаем данные для запроса к NowPayments API
    // Важно: price_amount должен быть числом, price_currency должен быть 'eur'
    const invoiceData = {
      price_amount: numericAmount,
      price_currency: 'eur', // Всегда используем 'eur' как строку
      pay_currency: pay_currency.toLowerCase(),
      order_description: order_description,
      ipn_callback_url: `${baseUrl}/api/webhook`,
      success_url: `${baseUrl}`,
      cancel_url: `${baseUrl}`
    };

    console.log('[Create Payment] Prepared invoice data:', JSON.stringify(invoiceData, null, 2));
    console.log('[Create Payment] Sending request to NowPayments API: https://api.nowpayments.io/v1/invoice');
    console.log('[Create Payment] Using API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('[Create Payment] Request headers: x-api-key present:', !!apiKey);

    // Отправляем запрос к NowPayments API с обработкой ошибок
    let response;
    try {
      response = await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(invoiceData)
      });

      console.log('[Create Payment] NowPayments API response status:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('[Create Payment] Network error when calling NowPayments API:', fetchError);
      return NextResponse.json(
        { 
          error: 'Network error when contacting payment service',
          details: fetchError.message
        },
        { status: 500, headers: corsHeaders() }
      );
    }

    // Читаем тело ответа один раз
    const responseText = await response.text();
    console.log('[Create Payment] NowPayments API response body (raw):', responseText);

    if (!response.ok) {
      console.error('[Create Payment] NowPayments API error response:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: responseText
      });
      
      // Пытаемся распарсить JSON ошибку, если возможно
      let errorMessage = 'Failed to create payment';
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorJson.error || errorJson.detail || errorMessage;
        errorDetails = responseText;
      } catch (e) {
        // Если не JSON, используем текст как есть
        errorMessage = responseText || response.statusText || errorMessage;
        errorDetails = responseText;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          statusCode: response.status
        },
        { status: response.status, headers: corsHeaders() }
      );
    }

    // Парсим успешный ответ
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[Create Payment] NowPayments API success response:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('[Create Payment] Failed to parse NowPayments API response as JSON:', parseError);
      console.error('[Create Payment] Response text:', responseText);
      return NextResponse.json(
        { error: 'Invalid response format from payment service' },
        { status: 500, headers: corsHeaders() }
      );
    }

    // Проверяем наличие invoice_url в ответе
    if (!data.invoice_url) {
      console.error('[Create Payment] NowPayments API response missing invoice_url. Full response:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: 'Invalid response from payment service: invoice_url not found' },
        { status: 500, headers: corsHeaders() }
      );
    }

    console.log('[Create Payment] Payment created successfully. Invoice URL:', data.invoice_url);

    // Возвращаем URL инвойса с заголовками rate limit
    return NextResponse.json({
      invoice_url: data.invoice_url,
      invoice_id: data.id || null
    }, { 
      status: 200, 
      headers: {
        ...corsHeaders(),
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString()
      }
    });

  } catch (error) {
    console.error('[Create Payment] Unexpected error:', error);
    console.error('[Create Payment] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
