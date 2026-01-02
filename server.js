// Простой dev сервер для локальной разработки
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Для локальной разработки используем простой in-memory хранилище вместо Vercel KV
let logs = [];

// Middleware для парсинга JSON
app.use(express.json());

// API: Сохранение лога
app.post('/api/log', (req, res) => {
  try {
    const { action, details } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
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

    // Добавляем новую запись в начало массива
    logs.unshift(logEntry);
    
    // Ограничиваем количество логов (храним последние 1000 записей)
    if (logs.length > 1000) {
      logs = logs.slice(0, 1000);
    }

    res.json({ success: true, message: 'Log saved successfully' });
  } catch (error) {
    console.error('Error saving log:', error);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

// API: Получение логов
app.get('/api/get-logs', (req, res) => {
  try {
    const password = req.query.password;

    // Проверяем пароль
    if (password !== 'admin777') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Возвращаем последние 50 записей
    const recentLogs = logs.slice(0, 50);

    res.json({ logs: recentLogs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// API: Получение статистики
app.get('/api/get-stats', (req, res) => {
  try {
    const password = req.query.password;

    // Проверяем пароль
    if (password !== 'admin777') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Фильтруем только события PURCHASE
    const purchases = logs.filter(log => log.action === 'PURCHASE');
    
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
    const recentPurchases = purchases
      .slice(0, 50)
      .map(p => ({
        time: p.time || new Date(p.timestamp).toLocaleString('ru-RU'),
        service: p.purchase?.service || 'Unknown',
        amount: p.purchase?.amount || 0,
        timestamp: p.timestamp
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Сортируем по времени (новые сверху)
    
    res.json({
      revenue: {
        today: revenueToday,
        week: revenueWeek,
        month: revenueMonth,
        total: revenueTotal
      },
      recentPurchases: recentPurchases
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Статические файлы из корня (включая _next)
app.use(express.static(__dirname, {
  // Не отдаем index.html для файлов, которые существуют
  index: false
}));

// Все остальные запросы (кроме API) - отдаем index.html
app.get('*', (req, res, next) => {
  // Пропускаем API запросы
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Пропускаем запросы к существующим файлам
  const requestedPath = path.join(__dirname, req.path);
  if (fs.existsSync(requestedPath) && !fs.statSync(requestedPath).isDirectory()) {
    return next();
  }
  
  // Для всех остальных - отдаем index.html
  const filePath = path.join(__dirname, 'index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not found');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    return;
  }
  console.log(`> Server ready on http://localhost:${port}`);
  console.log(`> API endpoints:`);
  console.log(`>   POST /api/log`);
  console.log(`>   GET  /api/get-logs?password=admin777`);
  console.log(`>   GET  /api/get-stats?password=admin777`);
});
