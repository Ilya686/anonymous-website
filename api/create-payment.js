module.exports = async (req, res) => {
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  
  // Обработка OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body;
    console.log('[Create Payment] Received request body:', JSON.stringify(body, null, 2));
    
    const { price_amount, price_currency = 'eur', pay_currency = 'btc', order_description } = body;

    // Проверяем обязательные параметры
    if (!price_amount || !order_description) {
      console.error('[Create Payment] Missing required parameters:', { price_amount, order_description });
      return res.status(400).json({ error: 'price_amount and order_description are required' });
    }

    // Получаем API ключ из переменных окружения
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      console.error('[Create Payment] NOWPAYMENTS_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'Payment service configuration error: API key not configured' });
    }
    
    console.log('[Create Payment] API key found:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

    // Получаем базовый URL из заголовков запроса или переменных окружения
    const host = req.headers.host || '';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `${protocol}://${host}` : 'https://your-domain.vercel.app');
    
    console.log('[Create Payment] Base URL:', baseUrl);

    // Убеждаемся, что price_amount - число
    const numericAmount = Number(price_amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.error('[Create Payment] Invalid price_amount:', price_amount);
      return res.status(400).json({ error: 'Invalid price_amount: must be a positive number' });
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
      return res.status(500).json({ 
        error: 'Network error when contacting payment service',
        details: fetchError.message
      });
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
      
      return res.status(response.status).json({ 
        error: errorMessage,
        details: errorDetails,
        statusCode: response.status
      });
    }

    // Парсим успешный ответ
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[Create Payment] NowPayments API success response:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('[Create Payment] Failed to parse NowPayments API response as JSON:', parseError);
      console.error('[Create Payment] Response text:', responseText);
      return res.status(500).json({ error: 'Invalid response format from payment service' });
    }

    // Проверяем наличие invoice_url в ответе
    if (!data.invoice_url) {
      console.error('[Create Payment] NowPayments API response missing invoice_url. Full response:', JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'Invalid response from payment service: invoice_url not found' });
    }

    console.log('[Create Payment] Payment created successfully. Invoice URL:', data.invoice_url);

    // Возвращаем URL инвойса
    return res.status(200).json({
      invoice_url: data.invoice_url,
      invoice_id: data.id || null
    });

  } catch (error) {
    console.error('[Create Payment] Unexpected error:', error);
    console.error('[Create Payment] Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
