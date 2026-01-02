// Интернационализация (i18n) скрипт

// Объект с переводами для всех языков
const translations = {
  ru: {
    // Навигация
    nav_home: "Главная",
    nav_services: "Услуги",
    nav_reviews: "Отзывы",
    nav_faq: "FAQ",
    language_label: "Язык",
    
    // Категории услуг
    category_personal_documents: "Личные документы",
    category_financial_documents: "Финансовые документы",
    category_certificates: "Справки и подтверждения",
    
    // Hero секция
    hero_title: "Private Digital Services",
    hero_subtitle: "Профессиональные цифровые услуги с гарантией конфиденциальности и качества",
    trust_no_registration: "Без регистрации",
    trust_direct_contact: "Прямое взаимодействие",
    trust_private_data: "Приватная обработка данных",
    
    // Блок репутации
    reputation_title: "На рынке уже более двух лет",
    reputation_text_1: "Мы специализируемся на создании цифровых документов и сопутствующих услуг с упором на конфиденциальность, точность и ручную работу.",
    reputation_text_2: "За это время мы выстроили стабильный процесс взаимодействия с клиентами, исключающий автоматические генераторы и шаблонные решения.",
    reputation_text_3: "Каждый заказ обрабатывается индивидуально, с прямым контактом с исполнителем и строгим контролем качества на всех этапах.",
    
    // Блок преимуществ (trust-block)
    trust_item_privacy: "Конфиденциальность данных",
    trust_item_handmade: "Ручная работа (без генераторов)",
    trust_item_speed: "Быстрые сроки выполнения",
    trust_item_contact: "Прямой контакт с исполнителем",
    
    // Услуги - Личные документы
    service_id_card: "Цифровое удостоверение личности",
    service_id_card_desc: "Официальный документ с вашими данными",
    service_id_card_details: "Фон для документа после оплаты заказа можно будет выбрать другой",
    
    service_drivers_license: "Цифровые водительские права",
    service_drivers_license_desc: "Водительское удостоверение с персональными данными",
    service_drivers_license_details: "Фон для документа после оплаты заказа можно будет выбрать другой",
    
    service_passport: "Цифровой паспорт",
    service_passport_desc: "Паспорт с указанными вами данными",
    service_passport_details: "Фон для документа после оплаты заказа можно будет выбрать другой",
    
    // Услуги - Финансовые документы
    service_salary_1month: "Расчетная заработной платы (1 месяц)",
    service_salary_1month_desc: "Официальная справка о заработной плате за месяц",
    service_salary_1month_details: "Документ будет предоставлен в PDF формате с вашими данными",
    
    service_invoice_mediamarkt: "Счет-фактура MediaMarkt",
    service_invoice_mediamarkt_desc: "Официальный счет-фактура от MediaMarkt",
    service_invoice_mediamarkt_details: "Документ будет предоставлен в PDF формате с вашими данными",
    
    service_invoice_saturn: "Счет-фактура Saturn",
    service_invoice_saturn_desc: "Официальный счет-фактура от Saturn",
    service_invoice_saturn_details: "Документ будет предоставлен в PDF формате с вашими данными",
    
    service_invoice_apple: "Счет-фактура Apple",
    service_invoice_apple_desc: "Официальный счет-фактура от Apple",
    service_invoice_apple_details: "Документ будет предоставлен в PDF формате с вашими данными",
    
    // Услуги - Справки
    service_criminal_record_extended: "Расширенная справка о не судимости",
    service_criminal_record_extended_desc: "Подробная справка об отсутствии судимости",
    service_criminal_record_extended_details: "Документ будет предоставлен в PDF формате с вашими данными",
    
    service_criminal_record: "Справка о не судимости",
    service_criminal_record_desc: "Официальная справка об отсутствии судимости",
    service_criminal_record_details: "Документ будет предоставлен в PDF формате с вашими данными",
    
    // Кнопки
    btn_preview: "Предосмотр",
    btn_order: "Оформить запрос",
    btn_details: "Подробнее",
    btn_pay: "Перейти к оплате",
    btn_contact: "Связаться с исполнителем",
    
    // Карточки услуг
    card_contact_direct: "Контакт с исполнителем напрямую",
    
    // Модальное окно
    modal_trust_text: "Без автоматических генераторов. Каждый документ создаётся вручную в Photoshop и Adobe Acrobat.",
    modal_steps_title: "Следующие шаги:",
    modal_step1: "После оплаты отправьте TXID или скриншот платежа исполнителю",
    modal_step2: "Укажите название услуги, которую вы выбрали",
    modal_step3: "Предоставьте желаемые данные для документа",
    
    // FAQ
    faq_title: "Часто задаваемые вопросы",
    faq_question1: "Как оформить заказ?",
    faq_answer1: "Нажмите кнопку \"Оформить запрос\" на карточке интересующей вас услуги, затем следуйте инструкциям в модальном окне.",
    faq_question2: "Как происходит оплата?",
    faq_answer2: "Оплата производится через Nowpayments. После оплаты необходимо отправить TXID или скриншот платежа исполнителю.",
    faq_question3: "Сколько времени занимает изготовление документа?",
    faq_answer3: "В среднем каждый документ занимает от 5–30 минут, в зависимости от загрузки заказов у продавца. Точное время вашего заказа можно уточнить у продавца.",
    faq_question4: "Какие данные нужно предоставить?",
    faq_answer4: "После оплаты отправьте исполнителю ваши желаемые данные для документа через Telegram или Threema.",
    
    // Footer
    footer_not_found: "Если вы не нашли нужный вам документ, пожалуйста, свяжитесь с нами.",
    footer_trust: "Все документы создаются вручную в Photoshop и Adobe Acrobat. Без автоматических генераторов, только качественная работа.",
    footer_telegram: "Телеграмм",
    footer_threema: "Threema",
    footer_channel: "Телеграмм канал",
    footer_reviews: "Отзывы"
  },
  
  en: {
    // Navigation
    nav_home: "Home",
    nav_services: "Services",
    nav_reviews: "Reviews",
    nav_faq: "FAQ",
    language_label: "Language",
    
    // Service categories
    category_personal_documents: "Personal Documents",
    category_financial_documents: "Financial Documents",
    category_certificates: "Certificates",
    
    // Hero section
    hero_title: "Private Digital Services",
    hero_subtitle: "Professional digital services with privacy and quality guarantee",
    trust_no_registration: "No registration",
    trust_direct_contact: "Direct interaction",
    trust_private_data: "Private data processing",
    
    // Reputation block
    reputation_title: "Over 2 years in the market",
    reputation_text_1: "We specialize in creating digital documents and related services with a focus on confidentiality, accuracy, and manual work.",
    reputation_text_2: "Over this time, we have built a stable client interaction process that excludes automatic generators and template solutions.",
    reputation_text_3: "Each order is processed individually, with direct contact with the executor and strict quality control at all stages.",
    
    // Trust block (advantages)
    trust_item_privacy: "Data confidentiality",
    trust_item_handmade: "Manual work (no generators)",
    trust_item_speed: "Fast delivery times",
    trust_item_contact: "Direct contact with executor",
    
    // Services - Personal Documents
    service_id_card: "Digital ID Card",
    service_id_card_desc: "Official document with your data",
    service_id_card_details: "Document background can be changed after order payment",
    
    service_drivers_license: "Digital Driver's License",
    service_drivers_license_desc: "Driver's license with personal data",
    service_drivers_license_details: "Document background can be changed after order payment",
    
    service_passport: "Digital Passport",
    service_passport_desc: "Passport with your specified data",
    service_passport_details: "Document background can be changed after order payment",
    
    // Services - Financial Documents
    service_salary_1month: "Salary Statement (1 month)",
    service_salary_1month_desc: "Official salary certificate for one month",
    service_salary_1month_details: "Document will be provided in PDF format with your data",
    
    service_invoice_mediamarkt: "MediaMarkt Invoice",
    service_invoice_mediamarkt_desc: "Official invoice from MediaMarkt",
    service_invoice_mediamarkt_details: "Document will be provided in PDF format with your data",
    
    service_invoice_saturn: "Saturn Invoice",
    service_invoice_saturn_desc: "Official invoice from Saturn",
    service_invoice_saturn_details: "Document will be provided in PDF format with your data",
    
    service_invoice_apple: "Apple Invoice",
    service_invoice_apple_desc: "Official invoice from Apple",
    service_invoice_apple_details: "Document will be provided in PDF format with your data",
    
    // Services - Certificates
    service_criminal_record_extended: "Extended Criminal Record Certificate",
    service_criminal_record_extended_desc: "Detailed certificate of no criminal record",
    service_criminal_record_extended_details: "Document will be provided in PDF format with your data",
    
    service_criminal_record: "Criminal Record Certificate",
    service_criminal_record_desc: "Official certificate of no criminal record",
    service_criminal_record_details: "Document will be provided in PDF format with your data",
    
    // Buttons
    btn_preview: "Preview",
    btn_order: "Place Order",
    btn_details: "Details",
    btn_pay: "Go to Payment",
    btn_contact: "Contact Executor",
    
    // Service cards
    card_contact_direct: "Direct contact with executor",
    
    // Modal window
    modal_trust_text: "No automatic generators. Each document is created manually in Photoshop and Adobe Acrobat.",
    modal_steps_title: "Next steps:",
    modal_step1: "After payment, send TXID or payment screenshot to the executor",
    modal_step2: "Specify the name of the service you selected",
    modal_step3: "Provide desired data for the document",
    
    // FAQ
    faq_title: "Frequently Asked Questions",
    faq_question1: "How to place an order?",
    faq_answer1: "Click the \"Place Order\" button on the card of the service you are interested in, then follow the instructions in the modal window.",
    faq_question2: "How does payment work?",
    faq_answer2: "Payment is made through Nowpayments. After payment, you must send TXID or payment screenshot to the executor.",
    faq_question3: "How long does it take to create a document?",
    faq_answer3: "On average, each document takes 5-30 minutes, depending on the seller's order load. The exact time of your order can be checked with the seller.",
    faq_question4: "What data needs to be provided?",
    faq_answer4: "After payment, send your desired data for the document to the executor via Telegram or Threema.",
    
    // Footer
    footer_not_found: "If you did not find the document you need, please contact us.",
    footer_trust: "All documents are created manually in Photoshop and Adobe Acrobat. No automatic generators, only quality work.",
    footer_telegram: "Telegram",
    footer_threema: "Threema",
    footer_channel: "Telegram Channel",
    footer_reviews: "Reviews"
  },
  
  de: {
    // Navigation
    nav_home: "Startseite",
    nav_services: "Dienstleistungen",
    nav_reviews: "Bewertungen",
    nav_faq: "FAQ",
    language_label: "Sprache",
    
    // Dienstleistungskategorien
    category_personal_documents: "Persönliche Dokumente",
    category_financial_documents: "Finanzdokumente",
    category_certificates: "Bescheinigungen",
    
    // Hero-Bereich
    hero_title: "Private Digital Services",
    hero_subtitle: "Professionelle digitale Dienstleistungen mit Datenschutz- und Qualitätsgarantie",
    trust_no_registration: "Keine Registrierung",
    trust_direct_contact: "Direkter Kontakt",
    trust_private_data: "Private Datenverarbeitung",
    
    // Reputations-Block
    reputation_title: "Über 2 Jahre Markterfahrung",
    reputation_text_1: "Wir sind spezialisiert auf die Erstellung digitaler Dokumente und begleitender Dienstleistungen mit Fokus auf Vertraulichkeit, Genauigkeit und manuelle Arbeit.",
    reputation_text_2: "In dieser Zeit haben wir einen stabilen Kundeninteraktionsprozess aufgebaut, der automatische Generatoren und Vorlagenlösungen ausschließt.",
    reputation_text_3: "Jede Bestellung wird individuell bearbeitet, mit direktem Kontakt zum Ausführenden und strenger Qualitätskontrolle auf allen Stufen.",
    
    // Vertrauens-Block (Vorteile)
    trust_item_privacy: "Datenschutz",
    trust_item_handmade: "Manuelle Arbeit (ohne Generatoren)",
    trust_item_speed: "Schnelle Lieferzeiten",
    trust_item_contact: "Direkter Kontakt mit dem Ausführenden",
    
    // Dienstleistungen - Persönliche Dokumente
    service_id_card: "Digitale Ausweiskarte",
    service_id_card_desc: "Offizielles Dokument mit Ihren Daten",
    service_id_card_details: "Der Dokumentenhintergrund kann nach der Bestellzahlung geändert werden",
    
    service_drivers_license: "Digitaler Führerschein",
    service_drivers_license_desc: "Führerschein mit persönlichen Daten",
    service_drivers_license_details: "Der Dokumentenhintergrund kann nach der Bestellzahlung geändert werden",
    
    service_passport: "Digitaler Reisepass",
    service_passport_desc: "Reisepass mit Ihren angegebenen Daten",
    service_passport_details: "Der Dokumentenhintergrund kann nach der Bestellzahlung geändert werden",
    
    // Dienstleistungen - Finanzdokumente
    service_salary_1month: "Gehaltsabrechnung (1 Monat)",
    service_salary_1month_desc: "Offizielle Gehaltsbescheinigung für einen Monat",
    service_salary_1month_details: "Das Dokument wird im PDF-Format mit Ihren Daten bereitgestellt",
    
    service_invoice_mediamarkt: "MediaMarkt Rechnung",
    service_invoice_mediamarkt_desc: "Offizielle Rechnung von MediaMarkt",
    service_invoice_mediamarkt_details: "Das Dokument wird im PDF-Format mit Ihren Daten bereitgestellt",
    
    service_invoice_saturn: "Saturn Rechnung",
    service_invoice_saturn_desc: "Offizielle Rechnung von Saturn",
    service_invoice_saturn_details: "Das Dokument wird im PDF-Format mit Ihren Daten bereitgestellt",
    
    service_invoice_apple: "Apple Rechnung",
    service_invoice_apple_desc: "Offizielle Rechnung von Apple",
    service_invoice_apple_details: "Das Dokument wird im PDF-Format mit Ihren Daten bereitgestellt",
    
    // Dienstleistungen - Bescheinigungen
    service_criminal_record_extended: "Erweiterte Führungszeugnis",
    service_criminal_record_extended_desc: "Detaillierte Bescheinigung über keine Vorstrafen",
    service_criminal_record_extended_details: "Das Dokument wird im PDF-Format mit Ihren Daten bereitgestellt",
    
    service_criminal_record: "Führungszeugnis",
    service_criminal_record_desc: "Offizielle Bescheinigung über keine Vorstrafen",
    service_criminal_record_details: "Das Dokument wird im PDF-Format mit Ihren Daten bereitgestellt",
    
    // Buttons
    btn_preview: "Vorschau",
    btn_order: "Bestellung aufgeben",
    btn_details: "Details",
    btn_pay: "Zur Zahlung",
    btn_contact: "Ausführenden kontaktieren",
    
    // Dienstleistungskarten
    card_contact_direct: "Direkter Kontakt mit dem Ausführenden",
    
    // Modal-Fenster
    modal_trust_text: "Keine automatischen Generatoren. Jedes Dokument wird manuell in Photoshop und Adobe Acrobat erstellt.",
    modal_steps_title: "Nächste Schritte:",
    modal_step1: "Nach der Zahlung senden Sie TXID oder Zahlungsscreenshot an den Ausführenden",
    modal_step2: "Geben Sie den Namen der von Ihnen gewählten Dienstleistung an",
    modal_step3: "Geben Sie die gewünschten Daten für das Dokument an",
    
    // FAQ
    faq_title: "Häufig gestellte Fragen",
    faq_question1: "Wie bestelle ich?",
    faq_answer1: "Klicken Sie auf die Schaltfläche \"Bestellung aufgeben\" auf der Karte der gewünschten Dienstleistung, dann folgen Sie den Anweisungen im Modal-Fenster.",
    faq_question2: "Wie funktioniert die Zahlung?",
    faq_answer2: "Die Zahlung erfolgt über Nowpayments. Nach der Zahlung müssen Sie TXID oder Zahlungsscreenshot an den Ausführenden senden.",
    faq_question3: "Wie lange dauert die Erstellung eines Dokuments?",
    faq_answer3: "Im Durchschnitt dauert jedes Dokument 5-30 Minuten, abhängig von der Bestellauslastung des Verkäufers. Die genaue Zeit Ihrer Bestellung können Sie beim Verkäufer erfragen.",
    faq_question4: "Welche Daten müssen bereitgestellt werden?",
    faq_answer4: "Nach der Zahlung senden Sie Ihre gewünschten Daten für das Dokument an den Ausführenden über Telegram oder Threema.",
    
    // Footer
    footer_not_found: "Wenn Sie das benötigte Dokument nicht gefunden haben, kontaktieren Sie uns bitte.",
    footer_trust: "Alle Dokumente werden manuell in Photoshop und Adobe Acrobat erstellt. Keine automatischen Generatoren, nur qualitativ hochwertige Arbeit.",
    footer_telegram: "Telegram",
    footer_threema: "Threema",
    footer_channel: "Telegram Kanal",
    footer_reviews: "Bewertungen"
  }
};

// Текущий язык (по умолчанию 'de')
let currentLanguage = 'de';

// Маппинг языков для отображения
const langDisplay = {
  ru: 'RU',
  en: 'EN',
  de: 'DE'
};

/**
 * Устанавливает язык интерфейса
 * @param {string} lang - Код языка ('ru', 'en', 'de')
 */
function setLanguage(lang) {
  // Проверяем, что язык поддерживается
  if (!translations[lang]) {
    console.warn(`Language "${lang}" is not supported. Using default "de".`);
    lang = 'de';
  }
  
  const previousLang = currentLanguage;
  currentLanguage = lang;
  
  // Сохраняем выбор в localStorage
  localStorage.setItem('preferredLanguage', lang);
  
  // Обновляем атрибут lang у html элемента
  document.documentElement.lang = lang;
  
  // Логируем смену языка, если язык действительно изменился
  if (previousLang && previousLang !== lang && typeof window.trackUserAction === 'function') {
    const langNames = {
      'ru': 'Russian',
      'en': 'English',
      'de': 'German'
    };
    const fromLang = langNames[previousLang] || previousLang.toUpperCase();
    const toLang = langNames[lang] || lang.toUpperCase();
    const details = `Language changed from ${fromLang} (${previousLang}) to ${toLang} (${lang})`;
    window.trackUserAction('Language Change', details);
  }
  
  // Обновляем все элементы с data-i18n
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      // Для элементов с вложенным контентом (например, кнопки со span)
      if (element.children.length > 0 && element.querySelector('span')) {
        const span = element.querySelector('span');
        if (span && span.hasAttribute('data-i18n')) {
          // Если span имеет свой data-i18n, он обработается отдельно
          return;
        }
        // Иначе обновляем первый текстовый узел
        const textNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) {
          textNode.textContent = translations[lang][key];
        } else {
          element.textContent = translations[lang][key];
        }
      } else {
        element.textContent = translations[lang][key];
      }
    }
  });
  
  // Обновляем отображение текущего языка в кнопках
  const currentLangElement = document.getElementById('currentLang');
  if (currentLangElement) {
    currentLangElement.textContent = langDisplay[lang] || lang.toUpperCase();
  }
  
  // Обновляем активные классы для кнопок языков (desktop)
  const desktopLangOptions = document.querySelectorAll('.lang-option');
  desktopLangOptions.forEach(option => {
    if (option.getAttribute('data-lang') === lang) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
  
  // Обновляем активные классы для кнопок языков (mobile)
  const mobileLangOptions = document.querySelectorAll('.mobile-lang-option');
  mobileLangOptions.forEach(option => {
    if (option.getAttribute('data-lang') === lang) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
  
  // Логируем смену языка (если функция logEvent доступна)
  if (typeof logEvent === 'function') {
    logEvent('Change Lang', langDisplay[lang] || lang.toUpperCase());
  }
  
  // Отправляем на сервер (если функция trackUserAction доступна)
  if (typeof trackUserAction === 'function') {
    trackUserAction('Change Lang', langDisplay[lang] || lang.toUpperCase());
  }
}

/**
 * Инициализация i18n при загрузке страницы
 */
function initI18n() {
  // Проверяем сохраненный язык в localStorage
  const savedLang = localStorage.getItem('preferredLanguage');
  
  // Используем сохраненный язык или 'de' по умолчанию
  const lang = savedLang || 'de';
  
  // Устанавливаем язык
  setLanguage(lang);
  
  // Добавляем обработчики для кнопок переключения языка (desktop)
  const desktopLangOptions = document.querySelectorAll('.lang-option');
  desktopLangOptions.forEach(option => {
    option.addEventListener('click', function() {
      const lang = this.getAttribute('data-lang');
      if (lang) {
        setLanguage(lang);
      }
    });
  });
  
  // Добавляем обработчики для кнопок переключения языка (mobile)
  const mobileLangOptions = document.querySelectorAll('.mobile-lang-option');
  mobileLangOptions.forEach(option => {
    option.addEventListener('click', function() {
      const lang = this.getAttribute('data-lang');
      if (lang) {
        setLanguage(lang);
        // Закрываем мобильное меню после выбора языка (опционально)
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
          mobileMenu.classList.remove('active');
        }
      }
    });
  });
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  // DOM уже загружен
  initI18n();
}

// Экспорт для использования в других скриптах (если нужно)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setLanguage, translations, currentLanguage };
}
