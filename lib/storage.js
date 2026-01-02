// Общее хранилище для логов (работает в Next.js)
// Используем глобальный объект Node.js для хранения между запросами
if (typeof global.logsStorage === 'undefined') {
  global.logsStorage = [];
}

export async function getLogs() {
  // Пытаемся использовать Vercel KV, если доступен
  try {
    const { kv } = await import('@vercel/kv');
    const kvLogs = await kv.get('site_logs');
    if (kvLogs) {
      return kvLogs;
    }
  } catch (error) {
    // Fallback на in-memory хранилище для локальной разработки
    console.log('Using in-memory storage for logs (local development)');
  }
  
  return global.logsStorage || [];
}

export async function setLogs(logs) {
  // Пытаемся использовать Vercel KV, если доступен
  try {
    const { kv } = await import('@vercel/kv');
    await kv.set('site_logs', logs);
    return;
  } catch (error) {
    // Fallback на in-memory хранилище для локальной разработки
    global.logsStorage = logs;
  }
}
