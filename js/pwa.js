// PWA (Progressive Web App) скрипт

(function() {
  'use strict';

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
              }
            });
          });
        })
        .catch(function(error) {
          console.error('Ошибка регистрации Service Worker:', error);
        });
      
      // Обработка готовности Service Worker
      navigator.serviceWorker.ready.then(function(registration) {
        console.log('Service Worker готов к работе');
      });
      
      // Обработка ошибок Service Worker
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        console.log('Service Worker контроллер изменен');
      });
    });
  } else {
    console.warn('Service Worker не поддерживается в этом браузере');
  }
})();
