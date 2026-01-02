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
      [orderModal, paymentSuccessModal].forEach(modal => {
        if (modal && modal.classList.contains('active')) {
          closeModal(modal);
        }
      });
    }
  });
  
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
                order_description: serviceName
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
  
  // Кнопки "Предосмотр"
  const previewButtons = document.querySelectorAll('.btn-preview');
  previewButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Кнопка предосмотра (можно добавить функционал позже)
    });
  });
  
  // Кнопки "Подробнее"
  const moreButtons = document.querySelectorAll('.btn-more');
  moreButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.service-card');
      if (card) {
        const detailsDiv = card.querySelector('.card-details');
        if (detailsDiv) {
          const isHidden = detailsDiv.style.display === 'none' || !detailsDiv.style.display;
          if (isHidden) {
            detailsDiv.style.display = 'block';
          } else {
            detailsDiv.style.display = 'none';
          }
        }
      }
    });
  });
  
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

  // Sticky header эффект при прокрутке
  const siteHeader = document.getElementById('site-header');
  if (siteHeader) {
    let lastScrollTop = 0;
    const scrollThreshold = 10;
    
    function handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > scrollThreshold) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
      
      lastScrollTop = scrollTop;
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
