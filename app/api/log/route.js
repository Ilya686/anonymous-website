import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// CORS заголовки для всех ответов
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
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
  try {
    const body = await request.json();
    const { action, details } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Парсим details, если это JSON строка (для событий типа PURCHASE)
    let parsedDetails = details || '';
    let purchaseData = null;
    
    if (action === 'PURCHASE' && typeof details === 'string') {
      try {
        purchaseData = JSON.parse(details);
        parsedDetails = details; // Сохраняем как строку для совместимости
      } catch (e) {
        // Если не JSON, оставляем как есть
      }
    }
    
    // Создаем запись лога с меткой времени
    const logEntry = {
      timestamp: Date.now(),
      time: new Date().toLocaleString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      action: action,
      details: parsedDetails,
      // Добавляем структурированные данные для покупок
      ...(purchaseData && {
        purchase: {
          service: purchaseData.service || '',
          amount: purchaseData.amount || 0
        }
      })
    };

    // Получаем существующие логи из Vercel KV
    const existingLogs = await kv.get('site_logs') || [];
    
    // Добавляем новую запись в начало массива
    const updatedLogs = [logEntry, ...existingLogs];
    
    // Ограничиваем количество логов (храним последние 1000 записей)
    const limitedLogs = updatedLogs.slice(0, 1000);
    
    // Сохраняем обратно в Vercel KV
    await kv.set('site_logs', limitedLogs);

    return NextResponse.json(
      { success: true, message: 'Log saved successfully' },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Error saving log:', error);
    return NextResponse.json(
      { error: 'Failed to save log' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
