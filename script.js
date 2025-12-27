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
