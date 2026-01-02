// Минимальный JS для работы модалок, FAQ и мобильного меню (необходимо для стилей)

document.addEventListener('DOMContentLoaded', function() {
  // Модалки
  const orderModal = document.getElementById('orderModal');
  const paymentSuccessModal = document.getElementById('paymentSuccessModal');
  const modalCloses = document.querySelectorAll('.modal .close');
  
  // Блокировка скролла при открытой модалке
  function toggleBodyScroll(lock) {
    if (lock) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }
  
  function openModal(modal) {
    modal.classList.add('active');
    toggleBodyScroll(true);
  }
  
  function closeModal(modal) {
    modal.classList.remove('active');
    toggleBodyScroll(false);
    
    // Очищаем Turnstile при закрытии модального окна заказа
    if (modal && modal.id === 'orderModal') {
      resetTurnstile();
    }
  }
  
  // Закрытие модалок
  modalCloses.forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) closeModal(modal);
    });
  });
  
  // Кнопка "Закрыть" в модалке успешной оплаты
  const closeSuccessButton = paymentSuccessModal?.querySelector('.btn-secondary');
  if (closeSuccessButton) {
    closeSuccessButton.addEventListener('click', function() {
      closeModal(paymentSuccessModal);
    });
  }
  
  // Закрытие по клику на overlay
  [orderModal, paymentSuccessModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          closeModal(this);
        }
      });
    }
  });
  
  // Закрытие по ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      [orderModal, paymentSuccessModal, physicalDetailsModal].forEach(modal => {
        if (modal && modal.classList.contains('active')) {
          closeModal(modal);
        }
      });
    }
  });
  
  // Cloudflare Turnstile интеграция
  const TURNSTILE_SITE_KEY = '0x4AAAAAACKNrNi3V_612mZZ';
  let turnstileWidgetId = null;
  const turnstileContainer = document.getElementById('turnstile-container');
  
  // Инициализация Turnstile при открытии модального окна
  function initTurnstile() {
    if (!turnstileContainer) return;
    
    // Очищаем предыдущий виджет, если есть
    if (turnstileWidgetId !== null && window.turnstile) {
      try {
        window.turnstile.remove(turnstileWidgetId);
      } catch (e) {
        console.warn('[Turnstile] Error removing widget:', e);
      }
      turnstileWidgetId = null;
    }
    
    // Ждем загрузки Turnstile API
    if (typeof window.turnstile === 'undefined') {
      console.warn('[Turnstile] Turnstile API not loaded yet');
      return;
    }
    
    // Инициализируем новый виджет
    try {
      turnstileWidgetId = window.turnstile.render(turnstileContainer, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        size: 'normal',
        callback: function(token) {
          console.log('[Turnstile] Verification successful');
        },
        'error-callback': function() {
          console.error('[Turnstile] Verification failed');
        }
      });
      console.log('[Turnstile] Widget initialized:', turnstileWidgetId);
    } catch (e) {
      console.error('[Turnstile] Error initializing widget:', e);
    }
  }
  
  // Очистка Turnstile при закрытии модального окна
  function resetTurnstile() {
    if (turnstileWidgetId !== null && window.turnstile) {
      try {
        window.turnstile.remove(turnstileWidgetId);
        turnstileWidgetId = null;
        console.log('[Turnstile] Widget removed');
      } catch (e) {
        console.warn('[Turnstile] Error removing widget:', e);
      }
    }
    if (turnstileContainer) {
      turnstileContainer.innerHTML = '';
    }
  }
  
  // Получение токена Turnstile
  function getTurnstileToken() {
    if (!window.turnstile || turnstileWidgetId === null) {
      return null;
    }
    try {
      return window.turnstile.getResponse(turnstileWidgetId);
    } catch (e) {
      console.error('[Turnstile] Error getting token:', e);
      return null;
    }
  }
  
  // Кнопки "Оформить запрос" открывают модалку заказа
  const orderButtons = document.querySelectorAll('.btn-order');
  orderButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.service-card');
      if (card && orderModal) {
        const serviceName = card.querySelector('h3')?.textContent?.trim() || '';
        const price = card.querySelector('.price')?.textContent?.trim() || '';
        const modalServiceName = document.getElementById('modalServiceName');
        const modalPrice = document.getElementById('modalPrice');
        if (modalServiceName) modalServiceName.textContent = serviceName;
        if (modalPrice) modalPrice.textContent = price;
        openModal(orderModal);
        
        // Инициализируем Turnstile после открытия модального окна
        setTimeout(() => {
          initTurnstile();
        }, 100);
      }
    });
  });
  
  // Кнопки "Перейти к оплате" - создаем платеж через NowPayments
  const payButtons = document.querySelectorAll('.btn-pay');
  payButtons.forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      const modal = this.closest('.modal');
      if (modal && modal.id === 'orderModal') {
        const serviceName = document.getElementById('modalServiceName')?.textContent?.trim() || '';
        const priceText = document.getElementById('modalPrice')?.textContent?.trim() || '';
        
        // Извлекаем число из цены (убираем символы валюты и пробелы)
        const priceTextClean = priceText.replace(/[€\s]/g, '').trim();
        const priceMatch = priceTextClean.match(/[\d,]+\.?[\d]*|[\d]+/);
        const priceValue = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
        
        if (serviceName && priceValue > 0) {
          // Проверка на localhost - оплата работает только на деплое (Vercel)
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            alert('⚠️ Оплата работает только на деплое (Vercel).\n\nДля тестирования оплаты используйте развернутую версию сайта.');
            return;
          }
          
          // Проверка Turnstile токена
          const turnstileToken = getTurnstileToken();
          if (!turnstileToken) {
            alert('⚠️ Пожалуйста, пройдите проверку безопасности перед оплатой.');
            return;
          }
          
          // Отключаем кнопку, чтобы предотвратить двойной клик
          const originalText = this.textContent;
          this.disabled = true;
          this.textContent = 'Загрузка...';
          
          try {
            // Отправляем запрос на создание платежа
            console.log('[Payment] Creating payment request:', {
              price_amount: priceValue,
              price_currency: 'eur',
              pay_currency: 'btc',
              order_description: serviceName
            });
            
            const response = await fetch('/api/create-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                price_amount: priceValue,
                price_currency: 'eur',
                pay_currency: 'btc',
                order_description: serviceName,
                turnstile_token: turnstileToken
              })
            });

            // Читаем тело ответа один раз
            const responseText = await response.text();
            
            if (!response.ok) {
              let errorMessage = 'Ошибка при создании платежа';
              let errorDetails = '';
              
              // Пытаемся распарсить JSON ошибку
              try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
                errorDetails = errorData.details || errorData.message || '';
                
                console.error('[Payment] API error response:', errorData);
              } catch (parseError) {
                // Если не JSON, используем текст как есть
                errorMessage = responseText || response.statusText || errorMessage;
                errorDetails = responseText;
                console.error('[Payment] Failed to parse error response as JSON:', parseError);
                console.error('[Payment] Response text:', responseText);
              }
              
              // Формируем сообщение об ошибке
              let alertMessage = errorMessage;
              if (errorDetails && errorDetails !== errorMessage) {
                // Добавляем детали, если они есть и отличаются от основного сообщения
                const truncatedDetails = errorDetails.length > 200 ? errorDetails.substring(0, 200) + '...' : errorDetails;
                alertMessage += '\n\nДетали: ' + truncatedDetails;
              }
              
              throw new Error(alertMessage);
            }

            // Парсим успешный ответ
            let data;
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              console.error('[Payment] Failed to parse success response as JSON:', parseError);
              console.error('[Payment] Response text:', responseText);
              throw new Error('Неверный формат ответа от сервера');
            }
            console.log('[Payment] Payment created successfully:', data);
            
            if (data.invoice_url) {
              // Закрываем модалку перед переходом на страницу оплаты
              if (modal) {
                closeModal(modal);
              }
              
              // Перенаправляем на страницу оплаты
              window.location.href = data.invoice_url;
            } else {
              throw new Error('Invoice URL not received from server');
            }
          } catch (error) {
            console.error('[Payment] Ошибка при создании платежа:', error);
            
            // Показываем детальное сообщение об ошибке
            const errorMessage = error.message || 'Неизвестная ошибка';
            alert(errorMessage);
            
            // Восстанавливаем кнопку
            this.disabled = false;
            this.textContent = originalText;
          }
        } else {
          console.warn('[Payment] Не удалось извлечь данные платежа:', { serviceName, priceValue });
          alert('Ошибка: не удалось определить услугу или цену.');
        }
      }
    });
  });
  
  // Маппинг услуг на изображения (поддержка массивов для нескольких изображений)
  const serviceImageMap = {
    'service_id_card': ['previews/id-card.jpg', 'previews/id-card_2.jpg'],
    'service_drivers_license': ['previews/driver-license.jpg', 'previews/driver-license_2.jpg'],
    'service_passport': 'previews/passport.jpg',
    'service_physical_id_card': 'previews/Physical ID card.mp4',
    'service_physical_drivers_license': 'previews/Physical driver\'s license.mp4',
    'service_physical_passport': 'previews/Physical passport.mp4',
    'service_salary_1month': 'previews/salary-statement.png',
    'service_invoice_mediamarkt': 'previews/mediamarkt-invoice.png',
    'service_invoice_saturn': 'previews/saturn-invoice.png',
    'service_invoice_apple': 'previews/apple-invoice.jpg',
    'service_criminal_record_extended': 'previews/Erweiterte Führungszeugnis.jpg',
    'service_criminal_record': 'previews/Führungszeugnis.jpg'
  };

  // Модальное окно просмотра
  const previewModal = document.getElementById('previewModal');
  const previewModalImage = document.getElementById('previewModalImage');
  const previewModalVideo = document.getElementById('modal-video');
  const previewModalClose = document.getElementById('previewModalClose');
  const previewModalBackdrop = previewModal?.querySelector('.preview-modal-backdrop');
  const previewModalPrev = document.getElementById('previewModalPrev');
  const previewModalNext = document.getElementById('previewModalNext');
  
  // Состояние галереи
  let currentImages = [];
  let currentImageIndex = 0;

  // Нормализация: преобразует строку в массив, массив оставляет как есть
  function normalizeImages(images) {
    return Array.isArray(images) ? images : [images];
  }

  function showImage(index) {
    if (currentImages.length === 0) return;
    
    const newIndex = (index + currentImages.length) % currentImages.length;
    currentImageIndex = newIndex;
    
    const currentMedia = currentImages[currentImageIndex];
    const isVideo = currentMedia && (currentMedia.endsWith('.mp4') || currentMedia.endsWith('.webm') || currentMedia.endsWith('.mov'));
    const isImage = currentMedia && (currentMedia.endsWith('.jpg') || currentMedia.endsWith('.jpeg') || currentMedia.endsWith('.png') || currentMedia.endsWith('.gif'));
    
    if (!previewModalImage || !previewModalVideo) return;
    
    if (isVideo) {
      // Скрываем изображение и показываем видео
      previewModalImage.style.display = 'none';
      previewModalVideo.style.display = 'block';
      previewModalVideo.src = currentMedia;
      previewModalVideo.load(); // Перезагружаем видео
      
      // Применяем защиту к видео
      protectVideo();
    } else if (isImage) {
      // Скрываем видео и показываем изображение
      previewModalVideo.style.display = 'none';
      previewModalVideo.pause();
      previewModalVideo.src = ''; // Очищаем src видео
      
      previewModalImage.style.display = 'block';
      
      // Плавное переключение через opacity
      previewModalImage.style.opacity = '0';
      
      setTimeout(() => {
        if (previewModalImage) {
          previewModalImage.src = currentMedia;
          previewModalImage.style.opacity = '1';
          // Применяем защиту после загрузки изображения
          protectCurrentImage();
        }
      }, 150);
    }
    
    // Показываем/скрываем кнопки навигации (только для изображений)
    const hasMultipleImages = currentImages.length > 1 && !isVideo;
    if (previewModalPrev) {
      previewModalPrev.style.display = hasMultipleImages ? 'flex' : 'none';
    }
    if (previewModalNext) {
      previewModalNext.style.display = hasMultipleImages ? 'flex' : 'none';
    }
  }

  function openPreviewModal(images) {
    if (!previewModal || !previewModalImage || !previewModalVideo) return;
    
    // Нормализуем входные данные
    currentImages = normalizeImages(images);
    currentImageIndex = 0;
    
    if (currentImages.length === 0) return;
    
    // Проверяем, является ли первый элемент видео или изображением
    const firstMedia = currentImages[0];
    const isVideo = firstMedia && (firstMedia.endsWith('.mp4') || firstMedia.endsWith('.webm') || firstMedia.endsWith('.mov'));
    const isImage = firstMedia && (firstMedia.endsWith('.jpg') || firstMedia.endsWith('.jpeg') || firstMedia.endsWith('.png') || firstMedia.endsWith('.gif'));
    
    if (isVideo) {
      // Скрываем изображение и показываем видео
      previewModalImage.style.display = 'none';
      previewModalVideo.style.display = 'block';
      previewModalVideo.src = firstMedia;
      previewModalVideo.load(); // Перезагружаем видео
      
      // Применяем защиту к видео
      protectVideo();
    } else if (isImage) {
      // Скрываем видео и показываем изображение
      previewModalVideo.style.display = 'none';
      previewModalVideo.pause();
      previewModalVideo.src = ''; // Очищаем src видео
      
      previewModalImage.style.display = 'block';
      previewModalImage.src = firstMedia;
      previewModalImage.style.opacity = '1';
      
      // Применяем защиту после небольшой задержки, чтобы изображение загрузилось
      setTimeout(() => {
        protectCurrentImage();
      }, 100);
    }
    
    previewModal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    // Показываем/скрываем кнопки навигации (только для изображений)
    const hasMultipleImages = currentImages.length > 1 && !isVideo;
    if (previewModalPrev) {
      previewModalPrev.style.display = hasMultipleImages ? 'flex' : 'none';
    }
    if (previewModalNext) {
      previewModalNext.style.display = hasMultipleImages ? 'flex' : 'none';
    }
  }

  function closePreviewModal() {
    if (previewModal) {
      // Останавливаем и очищаем видео при закрытии
      if (previewModalVideo) {
        previewModalVideo.pause();
        previewModalVideo.src = '';
        previewModalVideo.style.display = 'none';
      }
      
      // Скрываем изображение
      if (previewModalImage) {
        previewModalImage.style.display = 'none';
        previewModalImage.src = '';
      }
      
      previewModal.style.display = 'none';
      document.body.classList.remove('modal-open');
      currentImages = [];
      currentImageIndex = 0;
    }
  }

  // Навигация по изображениям
  if (previewModalPrev) {
    previewModalPrev.addEventListener('click', function(e) {
      e.stopPropagation();
      showImage(currentImageIndex - 1);
    });
  }

  if (previewModalNext) {
    previewModalNext.addEventListener('click', function(e) {
      e.stopPropagation();
      showImage(currentImageIndex + 1);
    });
  }

  // Навигация клавиатурой и блокировка опасных комбинаций
  function handlePreviewModalKeyboard(e) {
    if (previewModal && previewModal.style.display !== 'none') {
      // Блокировка сохранения (Ctrl+S / Cmd+S)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        return false;
      }
      
      // Блокировка просмотра исходного кода (Ctrl+U / Cmd+U)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        return false;
      }
      
      // Блокировка F12 (инструменты разработчика)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Блокировка Ctrl+Shift+I / Cmd+Option+I (инструменты разработчика)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Блокировка Ctrl+Shift+J / Cmd+Option+J (консоль)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      
      // Блокировка Ctrl+Shift+C / Cmd+Option+C (инспектор)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      
      // Навигация
      if (e.key === 'Escape') {
        closePreviewModal();
      } else if (e.key === 'ArrowLeft' && currentImages.length > 1) {
        e.preventDefault();
        showImage(currentImageIndex - 1);
      } else if (e.key === 'ArrowRight' && currentImages.length > 1) {
        e.preventDefault();
        showImage(currentImageIndex + 1);
      }
    }
  }
  
  document.addEventListener('keydown', handlePreviewModalKeyboard);

  // Кнопки "Предосмотр"
  const previewButtons = document.querySelectorAll('.btn-preview');
  previewButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const serviceKey = this.getAttribute('data-service');
      if (serviceKey && serviceImageMap[serviceKey]) {
        openPreviewModal(serviceImageMap[serviceKey]);
      }
    });
  });

  // Закрытие модального окна просмотра
  if (previewModalClose) {
    previewModalClose.addEventListener('click', closePreviewModal);
  }

  if (previewModalBackdrop) {
    previewModalBackdrop.addEventListener('click', closePreviewModal);
  }

  
  // Защита текущего изображения в модальном окне
  function protectCurrentImage() {
    const image = document.getElementById('previewModalImage');
    if (image) {
      image.ondragstart = () => false;
      image.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
      }, { once: false });
    }
  }
  
  // Защита видео в модальном окне
  function protectVideo() {
    if (previewModalVideo) {
      // Блокировка правой кнопки мыши
      previewModalVideo.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
      }, { once: false });
      
      // Блокировка перетаскивания
      previewModalVideo.ondragstart = () => false;
      
      // Блокировка сохранения через Ctrl+S
      previewModalVideo.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          return false;
        }
      }, { once: false });
      
      // Блокировка сохранения через Ctrl+U (просмотр исходного кода)
      previewModalVideo.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
          e.preventDefault();
          return false;
        }
      }, { once: false });
      
      // Блокировка F12
      previewModalVideo.addEventListener('keydown', function(e) {
        if (e.key === 'F12') {
          e.preventDefault();
          return false;
        }
      }, { once: false });
      
      // Блокировка инструментов разработчика
      previewModalVideo.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
          e.preventDefault();
          return false;
        }
      }, { once: false });
    }
  }
  
  // Блокировка правой кнопки мыши и перетаскивания для всех изображений в галерее
  function protectGalleryImages() {
    // Защита всех изображений с путями к previews
    const allImages = document.querySelectorAll('img[src*="previews/"], img[src*="img/"]');
    allImages.forEach(img => {
      img.ondragstart = () => false;
      img.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
      });
    });
  }
  
  // Применяем защиту при загрузке страницы
  protectGalleryImages();
  
  // Модальное окно для всех карточек "Подробнее" (используем то же, что и для физических документов)
  const physicalDetailsModal = document.getElementById('physicalDetailsModal');
  const physicalModalTitle = document.getElementById('physicalModalTitle');
  const physicalModalText = document.getElementById('physicalModalText');
  
  // Сохраняем текущую карточку для обновления при смене языка
  let currentServiceCard = null;
  
  // Кнопки "Подробнее" - теперь открывают модальное окно для всех карточек
  const moreButtons = document.querySelectorAll('.btn-more');
  moreButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.service-card');
      currentServiceCard = card; // Сохраняем карточку для обновления при смене языка
      
      if (card) {
        const detailsDiv = card.querySelector('.card-details');
        const serviceName = card.querySelector('h3')?.textContent?.trim() || '';
        const detailsText = detailsDiv?.querySelector('p')?.textContent?.trim() || '';
        
        if (detailsText && physicalDetailsModal && physicalModalTitle && physicalModalText) {
          physicalModalTitle.textContent = serviceName;
          physicalModalText.textContent = detailsText;
          openModal(physicalDetailsModal);
        }
      }
    });
  });
  
  // Функция для обновления модального окна при смене языка (для обычных карточек)
  function updateDetailsModalLanguage() {
    if (physicalDetailsModal && physicalDetailsModal.classList.contains('active') && currentServiceCard) {
      const detailsDiv = currentServiceCard.querySelector('.card-details');
      const serviceName = currentServiceCard.querySelector('h3')?.textContent?.trim() || '';
      const detailsText = detailsDiv?.querySelector('p')?.textContent?.trim() || '';
      
      if (physicalModalTitle) physicalModalTitle.textContent = serviceName;
      if (physicalModalText) physicalModalText.textContent = detailsText;
    }
  }
  
  // Кнопки "Подробнее" для физических документов
  // Маппинг типов физических документов на ключи переводов
  const physicalTypeToKey = {
    'id_card': 'service_physical_id_card',
    'drivers_license': 'service_physical_drivers_license',
    'passport': 'service_physical_passport'
  };
  
  // Сохраняем текущий тип физического документа для обновления при смене языка
  let currentPhysicalType = null;
  
  // Функция для получения текущего языка (используем из i18n.js)
  function getCurrentLanguage() {
    if (typeof currentLanguage !== 'undefined') {
      return currentLanguage;
    }
    return localStorage.getItem('preferredLanguage') || 'ru';
  }
  
  // Функция для получения перевода
  function getTranslation(key) {
    const lang = getCurrentLanguage();
    if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    return '';
  }
  
  const physicalMoreButtons = document.querySelectorAll('.btn-more-physical');
  physicalMoreButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const physicalType = this.getAttribute('data-physical-type');
      currentPhysicalType = physicalType; // Сохраняем тип для обновления при смене языка
      
      if (physicalType && physicalDetailsModal && physicalModalTitle && physicalModalText) {
        const serviceKey = physicalTypeToKey[physicalType];
        if (serviceKey) {
          // Получаем переводы для названия и описания
          const serviceName = getTranslation(serviceKey);
          const serviceDetails = getTranslation(serviceKey + '_details');
          
          physicalModalTitle.textContent = serviceName || 'Физический документ';
          physicalModalText.textContent = serviceDetails || '';
          openModal(physicalDetailsModal);
        }
      }
    });
  });
  
  // Обновление модального окна при смене языка
  function updatePhysicalModalLanguage() {
    // Если модальное окно открыто, обновляем его содержимое
    if (physicalDetailsModal && physicalDetailsModal.classList.contains('active') && currentPhysicalType) {
      const serviceKey = physicalTypeToKey[currentPhysicalType];
      if (serviceKey) {
        const serviceName = getTranslation(serviceKey);
        const serviceDetails = getTranslation(serviceKey + '_details');
        
        if (physicalModalTitle) physicalModalTitle.textContent = serviceName || '';
        if (physicalModalText) physicalModalText.textContent = serviceDetails || '';
      }
    }
  }
  
  // Перехватываем смену языка через setLanguage
  if (typeof setLanguage !== 'undefined') {
    const originalSetLanguage = setLanguage;
    window.setLanguage = function(lang) {
      originalSetLanguage(lang);
      updatePhysicalModalLanguage();
      updateDetailsModalLanguage();
    };
  }
  
  // Закрытие модального окна физических документов
  const physicalModalClose = physicalDetailsModal?.querySelector('.close');
  if (physicalModalClose) {
    physicalModalClose.addEventListener('click', function() {
      closeModal(physicalDetailsModal);
    });
  }
  
  const physicalModalSecondaryBtn = physicalDetailsModal?.querySelector('.btn-secondary');
  if (physicalModalSecondaryBtn) {
    physicalModalSecondaryBtn.addEventListener('click', function() {
      closeModal(physicalDetailsModal);
    });
  }
  
  // Закрытие по клику на overlay
  if (physicalDetailsModal) {
    physicalDetailsModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal(this);
      }
    });
  }
  
  // FAQ Аккордеон
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(question => {
    question.addEventListener('click', function() {
      const faqItem = this.closest('.faq-item');
      const isActive = faqItem.classList.contains('active');
      
      // Закрываем все остальные
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Открываем текущий, если он был закрыт
      if (!isActive) {
        faqItem.classList.add('active');
      }
    });
  });
  
  // Мобильное меню
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', function() {
      mobileMenu.classList.add('active');
    });
  }
  
  if (mobileMenuClose && mobileMenu) {
    mobileMenuClose.addEventListener('click', function() {
      mobileMenu.classList.remove('active');
    });
  }
  
  // Мобильный язык dropdown
  const mobileLangToggle = document.getElementById('mobileLangToggle');
  const mobileLangDropdown = document.getElementById('mobileLangDropdown');
  
  if (mobileLangToggle && mobileLangDropdown) {
    mobileLangToggle.addEventListener('click', function() {
      mobileLangDropdown.classList.toggle('active');
    });
  }
  
  // Desktop dropdowns (services nav)
  const servicesNav = document.querySelector('.services-nav');
  if (servicesNav) {
    servicesNav.addEventListener('mouseenter', function() {
      this.classList.add('active');
    });
    servicesNav.addEventListener('mouseleave', function() {
      this.classList.remove('active');
    });
  }

  // Динамическое поведение header: скрытие при скролле вниз, показ при скролле вверх
  const siteHeader = document.getElementById('site-header');
  if (siteHeader) {
    let lastScrollY = window.scrollY;
    const scrollThreshold = 10;
    const hideThreshold = 100; // Порог для скрытия панели
    
    function handleScroll() {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      // Эффект изменения фона при прокрутке
      if (currentScrollY > scrollThreshold) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
      
      // Логика скрытия/показа панели
      if (currentScrollY > hideThreshold) {
        if (currentScrollY > lastScrollY) {
          // Скролл вниз - скрываем панель
          siteHeader.classList.add('nav-hidden');
        } else {
          // Скролл вверх - показываем панель
          siteHeader.classList.remove('nav-hidden');
        }
      } else {
        // В верхней части страницы всегда показываем панель
        siteHeader.classList.remove('nav-hidden');
      }
      
      lastScrollY = currentScrollY;
    }
    
    // Проверяем начальное состояние
    handleScroll();
    
    // Оптимизированный обработчик прокрутки с throttle
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
  
});
