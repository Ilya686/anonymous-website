// Минимальный JS для работы модалок, FAQ и мобильного меню (необходимо для стилей)

document.addEventListener('DOMContentLoaded', function() {
  // Модалки
  const orderModal = document.getElementById('orderModal');
  const paymentSuccessModal = document.getElementById('paymentSuccessModal');
  const cryptoSelectModal = document.getElementById('cryptoSelectModal');
  const cryptoPayModal = document.getElementById('cryptoPayModal');
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

    if (modal && modal.id === 'cryptoPayModal') {
      stopPaymentPolling();
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
  [orderModal, paymentSuccessModal, cryptoSelectModal, cryptoPayModal].forEach(modal => {
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
      [orderModal, paymentSuccessModal, cryptoSelectModal, cryptoPayModal, physicalDetailsModal].forEach(modal => {
        if (modal && modal.classList.contains('active')) {
          closeModal(modal);
        }
      });
    }
  });

  // ================================
  // Кнопки "Оформить запрос" открывают модалку заказа
  // ================================
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

  // ================================
  // Крипто-оплата
  // ================================
  function tr(key, fallback) {
    const lang = (typeof currentLanguage !== 'undefined')
      ? currentLanguage
      : (localStorage.getItem('preferredLanguage') || 'ru');
    if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    return fallback;
  }
  const CURRENCY_LABEL = {
    btc:  { name: 'Bitcoin',  ticker: 'BTC' },
    ltc:  { name: 'Litecoin', ticker: 'LTC' },
    usdt: { name: 'Tether',   ticker: 'USDT (TRC-20)' },
    eth:  { name: 'Ethereum', ticker: 'ETH' },
    sol:  { name: 'Solana',   ticker: 'SOL' },
  };
  const ADDRESSES = {
    btc:  '1AAYys3UZ5DXbwVxXVSYm2Ata4QKb3tBpY',
    ltc:  'LWwunDJj4orQHcof3p3QRotaYAePy2LxKp',
    usdt: 'TDiqxyUUhwPaAFLCFoF7AuLoUMgHpsTbpp',
    eth:  '0x4da96c26e9c25b02761bd12273c6512df661af02',
    sol:  'G3e5W5PaziGFjnJTSqHpqD19BNa18gizFtGbP9mrnTgj',
  };
  const QR_URI = {
    btc:  (addr, amount) => `bitcoin:${addr}?amount=${amount}`,
    ltc:  (addr, amount) => `litecoin:${addr}?amount=${amount}`,
    eth:  (addr, amount) => `ethereum:${addr}?value=${amount}`,
    usdt: (addr) => addr,
    sol:  (addr, amount) => `solana:${addr}?amount=${amount}`,
  };

  let pollTimer = null;
  let pollStartedAt = 0;
  let currentPayment = null;

  function stopPaymentPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    currentPayment = null;
  }

  function getServiceAndPrice() {
    const serviceName = document.getElementById('modalServiceName')?.textContent?.trim() || '';
    const priceText = document.getElementById('modalPrice')?.textContent?.trim() || '';
    const priceMatch = priceText.replace(/[€\s]/g, '').trim().match(/[\d,]+\.?[\d]*|[\d]+/);
    const priceValue = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
    return { serviceName, priceValue, priceText };
  }

  // Кнопки "Перейти к оплате" → открыть модалку выбора крипты
  const payButtons = document.querySelectorAll('.btn-pay');
  payButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const modal = this.closest('.modal');
      if (!modal || modal.id !== 'orderModal') return;
      const { serviceName, priceValue } = getServiceAndPrice();
      if (!serviceName || !(priceValue > 0)) {
        alert('Ошибка: не удалось определить услугу или цену.');
        return;
      }
      if (modal) closeModal(modal);
      if (cryptoSelectModal) openModal(cryptoSelectModal);
    });
  });

  // Клики по вариантам крипты
  const cryptoOptions = document.querySelectorAll('.crypto-option');
  cryptoOptions.forEach(opt => {
    opt.addEventListener('click', async function() {
      const currency = this.getAttribute('data-currency');
      if (!currency || !ADDRESSES[currency]) return;
      const { serviceName, priceValue, priceText } = getServiceAndPrice();
      if (!serviceName || !(priceValue > 0)) return;

      if (cryptoSelectModal) closeModal(cryptoSelectModal);
      await openCryptoPayModal(currency, serviceName, priceValue, priceText);
    });
  });

  // Кнопка "Назад" в модалке оплаты
  const cryptoPayBack = document.getElementById('cryptoPayBack');
  if (cryptoPayBack) {
    cryptoPayBack.addEventListener('click', function() {
      if (cryptoPayModal) closeModal(cryptoPayModal);
      if (cryptoSelectModal) openModal(cryptoSelectModal);
    });
  }

  // Копирование
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.crypto-copy-btn');
    if (!btn) return;
    const targetId = btn.getAttribute('data-copy-target');
    const el = targetId ? document.getElementById(targetId) : null;
    const text = el ? el.textContent.trim() : '';
    if (!text) return;
    const done = () => {
      const orig = btn.textContent;
      btn.classList.add('copied');
      btn.textContent = '✓';
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('copied');
      }, 1200);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
    }
  });

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
  }

  async function openCryptoPayModal(currency, serviceName, priceEur, priceText) {
    const address = ADDRESSES[currency];
    const label = CURRENCY_LABEL[currency];

    const titleEl = document.getElementById('cryptoPayTitle');
    const serviceEl = document.getElementById('cryptoPayService');
    const priceEl = document.getElementById('cryptoPayPrice');
    const amountEl = document.getElementById('cryptoPayAmount');
    const addressEl = document.getElementById('cryptoPayAddress');
    const qrEl = document.getElementById('cryptoPayQr');
    const statusEl = document.getElementById('cryptoPayStatus');

    const titleTpl = tr('crypto_pay_title_currency', 'Оплата в {name} ({ticker})');
    if (titleEl) titleEl.textContent = titleTpl.replace('{name}', label.name).replace('{ticker}', label.ticker);
    if (serviceEl) serviceEl.textContent = serviceName;
    if (priceEl) priceEl.textContent = priceText || `${priceEur} €`;
    if (addressEl) addressEl.textContent = address;
    if (amountEl) amountEl.textContent = '…';
    if (qrEl) qrEl.innerHTML = '';
    setStatus('loading', tr('crypto_status_loading_rate', 'Загружаем курс…'));

    if (cryptoPayModal) openModal(cryptoPayModal);

    // Получаем котировку с ретраями
    let quote = await fetchQuote(currency, priceEur);
    if (!quote) {
      setStatus('error', tr('crypto_status_rate_error', 'Не удалось получить курс. Попробуйте позже или свяжитесь с продавцом.'));
      return;
    }

    const amountStr = Number(quote.amount).toFixed(quote.decimals);
    const tickerShort = label.ticker.split(' ')[0];
    if (amountEl) amountEl.textContent = `${amountStr} ${tickerShort}`;

    // QR
    if (qrEl) {
      const uriBuilder = QR_URI[currency];
      const uri = uriBuilder ? uriBuilder(address, amountStr) : address;
      const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(uri)}`;
      qrEl.innerHTML = `<img alt="QR" width="180" height="180" src="${src}">`;
    }

    setStatus('waiting', tr('crypto_status_waiting', 'Ожидание подтверждения в блокчейне…'));

    currentPayment = {
      currency,
      address,
      amount: Number(quote.amount),
      since: quote.createdAt || Math.floor(Date.now() / 1000),
    };
    pollStartedAt = Date.now();
    schedulePoll(3000);
  }

  function setStatus(kind, text) {
    const statusEl = document.getElementById('cryptoPayStatus');
    if (!statusEl) return;
    statusEl.classList.remove('confirmed', 'error');
    if (kind === 'confirmed') statusEl.classList.add('confirmed');
    else if (kind === 'error') statusEl.classList.add('error');
    const t = statusEl.querySelector('.crypto-pay-status-text');
    if (t && typeof text === 'string') t.textContent = text;
  }

  async function fetchQuote(currency, priceEur) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(`/api/crypto-quote?currency=${currency}&eur=${encodeURIComponent(priceEur)}`);
        if (r.ok) return await r.json();
      } catch (err) {
        console.warn('[Crypto] quote attempt failed:', err);
      }
      if (attempt === 0) await new Promise(res => setTimeout(res, 1000));
    }
    return null;
  }

  const POLL_INTERVAL_MS = 15000;

  function schedulePoll(delayMs) {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = setTimeout(runPoll, delayMs);
  }

  async function runPoll(manual) {
    if (!currentPayment) return false;
    const payment = currentPayment;
    let confirmed = false;
    try {
      const r = await fetch('/api/check-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: payment.currency,
          expectedAmount: payment.amount,
          since: payment.since,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (data && data.confirmed) {
        onPaymentConfirmed(data);
        return true;
      }
    } catch (err) {
      console.warn('[Crypto] poll error:', err);
    }
    if (!manual) schedulePoll(POLL_INTERVAL_MS);
    return confirmed;
  }

  function onPaymentConfirmed(data) {
    stopPaymentPolling();
    setStatus('confirmed', tr('crypto_status_confirmed', 'Транзакция подтверждена'));
    if (cryptoPayModal) closeModal(cryptoPayModal);
    if (paymentSuccessModal) {
      paymentSuccessModal.style.display = '';
      paymentSuccessModal.style.opacity = '';
      openModal(paymentSuccessModal);
    }
    console.log('[Crypto] payment confirmed:', data);
  }

  // Ручная кнопка "Проверить оплату"
  const cryptoCheckNow = document.getElementById('cryptoCheckNow');
  if (cryptoCheckNow) {
    cryptoCheckNow.addEventListener('click', async function() {
      if (!currentPayment) return;
      const btn = this;
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = tr('crypto_checking', 'Проверяем…');
      // Сбрасываем расписание, чтобы не гонять два запроса подряд
      if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
      const found = await runPoll(true);
      if (!found) {
        setStatus('waiting', tr('crypto_status_not_yet', 'Транзакция ещё не найдена или не подтверждена в блокчейне. Продолжаем следить…'));
        schedulePoll(POLL_INTERVAL_MS);
      }
      btn.disabled = false;
      btn.textContent = origText;
    });
  }
  
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
