import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request) {
  try {
    // Получаем пароль из query параметров
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // Проверяем пароль
    if (password !== 'admin777') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем все логи из Vercel KV
    const logs = await kv.get('site_logs') || [];
    
    // Фильтруем только события REAL_PURCHASE (подтвержденные платежи через webhook)
    const purchases = logs.filter(log => log.action === 'REAL_PURCHASE');
    
    // Получаем текущую дату
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Начало недели (понедельник)
    const weekStart = new Date(todayStart);
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    
    // Начало месяца
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    
    // Функция для получения суммы покупок за период
    function getRevenueForPeriod(purchases, startTime, endTime) {
      return purchases
        .filter(p => {
          const purchaseTime = new Date(p.timestamp);
          return purchaseTime >= startTime && purchaseTime <= endTime;
        })
        .reduce((sum, p) => {
          const amount = p.purchase?.amount || 0;
          return sum + amount;
        }, 0);
    }
    
    // Вычисляем выручку за разные периоды
    const revenueToday = getRevenueForPeriod(purchases, todayStart, todayEnd);
    const revenueWeek = getRevenueForPeriod(purchases, weekStart, now);
    const revenueMonth = getRevenueForPeriod(purchases, monthStart, now);
    const revenueTotal = purchases.reduce((sum, p) => {
      const amount = p.purchase?.amount || 0;
      return sum + amount;
    }, 0);
    
    // Получаем последние продажи (до 50)
    // Сначала сортируем по времени (новые сверху), затем берем первые 50
    const recentPurchases = purchases
      .map(p => ({
        time: p.time || new Date(p.timestamp).toLocaleString('ru-RU'),
        service: p.purchase?.service || 'Unknown',
        amount: p.purchase?.amount || 0,
        timestamp: p.timestamp || 0
      }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) // Сортируем по времени (новые сверху)
      .slice(0, 50); // Берем первые 50 записей
    
    return NextResponse.json({
      revenue: {
        today: revenueToday,
        week: revenueWeek,
        month: revenueMonth,
        total: revenueTotal
      },
      recentPurchases: recentPurchases
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
