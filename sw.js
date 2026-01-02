// Service Worker для Anonymous Services PWA

// Версия кэша - обновляйте при каждом изменении для принудительного обновления
const CACHE_VERSION = 'v2';
const CACHE_NAME = `anonymous-services-${CACHE_VERSION}`;
const urlsToCache = [
  '/style.css',
  '/script.js',
  '/js/i18n.js',
  '/admin.html'
];

// Событие установки Service Worker
self.addEventListener('install', (event) => {
  console.log('Anonymous PWA Installed, version:', CACHE_VERSION);
  
  // Принудительно активируем новый Service Worker немедленно
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Открыт кеш:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Файлы успешно добавлены в кеш');
      })
      .catch((error) => {
        console.error('Ошибка при кешировании файлов:', error);
      })
  );
});

// Событие активации Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем старые кеши, если они есть
          if (cacheName !== CACHE_NAME) {
            console.log('Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Берем контроль над всеми открытыми страницами
      return self.clients.claim();
    })
  );
});

// Событие запроса ресурсов
// Стратегия: Network First - всегда проверяем сеть сначала для актуального контента
self.addEventListener('fetch', (event) => {
  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // Не кэшируем иконки и манифесты - всегда получаем свежие версии
  const isIcon = url.pathname.match(/\.(png|ico|svg|webmanifest)$/i) || 
                 url.pathname.includes('favicon') ||
                 url.pathname.includes('icon') ||
                 url.pathname.includes('apple-touch-icon') ||
                 url.pathname.includes('android-chrome') ||
                 url.pathname.includes('site.webmanifest') ||
                 url.pathname.includes('manifest.json');
  
  if (isIcon) {
    // Для иконок и манифестов - только сеть, без кэширования
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Проверяем валидность ответа
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Клонируем ответ для кэширования
        const responseToCache = response.clone();
        
        // Обновляем кэш в фоне
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пробуем кэш
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Если и кэша нет, возвращаем ошибку
          return new Response('Офлайн режим', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
