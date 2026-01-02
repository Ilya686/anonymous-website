import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import crypto from 'crypto';

export async function POST(request) {
  try {
    // Получаем IPN secret из переменных окружения
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    if (!ipnSecret) {
      console.error('NOWPAYMENTS_IPN_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    // Получаем тело запроса
    const body = await request.text();
    
    // Получаем подпись из заголовка
    const signature = request.headers.get('x-nowpayments-sig');
    
    if (!signature) {
      console.error('Missing x-nowpayments-sig header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Проверяем подпись
    // NowPayments использует HMAC-SHA512 для подписи webhook
    const hmac = crypto.createHmac('sha512', ipnSecret);
    hmac.update(body);
    const calculatedSignature = hmac.digest('hex');

    // Сравниваем подписи (используем безопасное сравнение)
    if (signature !== calculatedSignature) {
      console.error('Invalid webhook signature');
      console.error('Received signature:', signature);
      console.error('Calculated signature:', calculatedSignature);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Парсим JSON тело запроса
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (e) {
      console.error('Invalid JSON in webhook body:', e);
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    console.log('Webhook received:', JSON.stringify(webhookData, null, 2));

    // Проверяем статус платежа
    const paymentStatus = webhookData.payment_status;
    const invoiceStatus = webhookData.invoice_status;

    // Обрабатываем только завершенные или подтвержденные платежи
    if (paymentStatus === 'finished' || paymentStatus === 'confirmed' || 
        invoiceStatus === 'paid' || invoiceStatus === 'finished') {
      
      // Извлекаем данные о платеже
      const amount = parseFloat(webhookData.price_amount || webhookData.pay_amount || 0);
      const currency = webhookData.price_currency || webhookData.pay_currency || 'eur';
      const orderDescription = webhookData.order_description || webhookData.order_id || 'Unknown service';
      const invoiceId = webhookData.invoice_id || webhookData.id || '';
      const paymentId = webhookData.payment_id || '';

      // Создаем запись о реальной покупке
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
        action: 'REAL_PURCHASE',
        details: JSON.stringify({
          service: orderDescription,
          amount: amount,
          currency: currency,
          invoice_id: invoiceId,
          payment_id: paymentId,
          payment_status: paymentStatus,
          invoice_status: invoiceStatus
        }),
        purchase: {
          service: orderDescription,
          amount: amount,
          currency: currency,
          invoice_id: invoiceId,
          payment_id: paymentId
        }
      };

      // Получаем существующие логи из Vercel KV
      const existingLogs = await kv.get('site_logs') || [];
      
      // Добавляем новую запись в начало массива
      const updatedLogs = [logEntry, ...existingLogs];
      
      // Ограничиваем количество логов (храним последние 1000 записей)
      const limitedLogs = updatedLogs.slice(0, 1000);
      
      // Сохраняем обратно в Vercel KV
      await kv.set('site_logs', limitedLogs);

      console.log('Real purchase saved:', {
        service: orderDescription,
        amount: amount,
        currency: currency
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      // Для других статусов просто подтверждаем получение
      console.log('Webhook received with status:', paymentStatus || invoiceStatus);
      return NextResponse.json({ success: true, message: 'Webhook received but payment not completed' }, { status: 200 });
    }

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
