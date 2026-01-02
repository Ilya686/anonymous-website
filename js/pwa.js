// PWA (Progressive Web App) скрипт

(function() {
  'use strict';

  // ВРЕМЕННО ОТКЛЮЧЕНО: Раскомментируйте код ниже, чтобы включить Service Worker
  // Для принудительного обновления кэша измените CACHE_VERSION в sw.js
  
  // Раскомментируйте этот блок, чтобы включить Service Worker:
  /*
  // Проверяем поддержку Service Worker в браузере
  if ('serviceWorker' in navigator) {
    // Дожидаемся полной загрузки страницы
    window.addEventListener('load', function() {
      // Регистрируем Service Worker
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('Service Worker успешно зарегистрирован:', registration.scope);
          
          // Проверяем обновления Service Worker
          registration.addEventListener('updatefound', function() {
            const newWorker = registration.installing;
            console.log('Найден новый Service Worker');
            
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Доступна новая версия PWA. Перезагрузите страницу для обновления.');
                // Принудительно перезагружаем страницу при обновлении
                window.location.reload();
              }
            });
          });
          
          // Проверяем обновления каждые 60 секунд
          setInterval(function() {
            registration.update();
          }, 60000);
        })
        .catch(function(error) {
          console.error('Ошибка регистрации Service Worker:', error);
        });
    
      // Обработка готовности Service Worker
      navigator.serviceWorker.ready.then(function(registration) {
        console.log('Service Worker готов к работе');
      });
      
      // Обработка изменений контроллера - принудительная перезагрузка
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        console.log('Service Worker контроллер изменен, перезагружаем страницу...');
        window.location.reload();
      });
    });
  } else {
    console.warn('Service Worker не поддерживается в этом браузере');
  }
  */
  
  // Временное отключение: удаляем все существующие Service Workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.unregister().then(function(success) {
          if (success) {
            console.log('Service Worker отключен для актуального контента');
          }
        });
      }
    });
  }
})();
