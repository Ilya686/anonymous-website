// Service Worker для Anonymous Services PWA

const CACHE_NAME = 'anonymous-services-v1';
const urlsToCache = [
  '/style.css',
  '/script.js',
  '/js/i18n.js',
  '/admin.html'
];

// Событие установки Service Worker
self.addEventListener('install', (event) => {
  console.log('Anonymous PWA Installed');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Открыт кеш:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Файлы успешно добавлены в кеш');
        // Принудительно активируем новый Service Worker
        return self.skipWaiting();
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
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Если файл найден в кеше, возвращаем его
        if (response) {
          return response;
        }
        
        // Иначе загружаем из сети
        return fetch(event.request).then((response) => {
          // Проверяем валидность ответа
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Клонируем ответ, так как он может быть использован только один раз
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // В случае ошибки можно вернуть fallback страницу
        // Для простоты просто возвращаем ошибку сети
        return new Response('Офлайн режим', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
