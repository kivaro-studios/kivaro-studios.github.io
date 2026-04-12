(() => {
  const translations = window.__KIVARO_TRANSLATIONS__ || {};
  const storageKeys = {
    theme: 'kivaro-theme',
    language: 'kivaro-language'
  };

  const getNestedValue = (obj, path) => path.split('.').reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), obj);

  const interpolate = (template, vars = {}) => String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars ? vars[key] : ''));

  let currentLanguage = 'it';
  let currentTheme = document.documentElement.dataset.theme || 'dark';

  const t = (key, vars = {}) => {
    const activeSet = translations[currentLanguage] || translations.it || {};
    const fallbackSet = translations.it || {};
    const value = getNestedValue(activeSet, key) ?? getNestedValue(fallbackSet, key) ?? key;
    return interpolate(value, vars);
  };

  const applyTheme = (theme, persist = true) => {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = currentTheme;
    if (persist) {
      try { localStorage.setItem(storageKeys.theme, currentTheme); } catch (error) {}
    }
    document.querySelectorAll('[data-theme-option]').forEach((button) => {
      button.classList.toggle('active', button.dataset.themeOption === currentTheme);
    });
  };

  const applyLanguage = (language, persist = true) => {
    currentLanguage = language === 'en' ? 'en' : 'it';
    document.documentElement.lang = currentLanguage;
    if (persist) {
      try { localStorage.setItem(storageKeys.language, currentLanguage); } catch (error) {}
    }

    document.querySelectorAll('[data-lang-option]').forEach((button) => {
      button.classList.toggle('active', button.dataset.langOption === currentLanguage);
    });

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });

    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
      element.setAttribute('title', t(element.dataset.i18nTitle));
    });

    const page = document.body.dataset.page;
    const pageTitle = getNestedValue(translations[currentLanguage], `meta.${page}.title`) || getNestedValue(translations.it || {}, `meta.${page}.title`);
    const pageDescription = getNestedValue(translations[currentLanguage], `meta.${page}.description`) || getNestedValue(translations.it || {}, `meta.${page}.description`);

    if (pageTitle) document.title = pageTitle;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && pageDescription) metaDescription.setAttribute('content', pageDescription);

    document.dispatchEvent(new CustomEvent('kivaro:languagechange', {
      detail: { language: currentLanguage }
    }));
  };

  const setupNavigation = () => {
    const navToggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');

    if (navToggle && nav) {
      navToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        document.body.classList.toggle('menu-open', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });

      nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          nav.classList.remove('open');
          document.body.classList.remove('menu-open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    const normalizePath = (pathname) => pathname.replace(/index\.html$/, '').replace(/\/$/, '');
    const currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll('[data-nav] a').forEach((link) => {
      const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
      const isProjectsSection = currentPath.includes('/projects/') && linkPath.endsWith('/projects');
      if (linkPath === currentPath || isProjectsSection) {
        link.classList.add('active');
      }
    });
  };

  const setupControls = () => {
    document.querySelectorAll('[data-theme-option]').forEach((button) => {
      button.addEventListener('click', () => applyTheme(button.dataset.themeOption));
    });

    document.querySelectorAll('[data-lang-option]').forEach((button) => {
      button.addEventListener('click', () => applyLanguage(button.dataset.langOption));
    });
  };

  const setupYear = () => {
    document.querySelectorAll('[data-current-year]').forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
  };

  const initializePreferences = () => {
    let savedTheme = currentTheme;
    let savedLanguage = 'it';

    try {
      savedTheme = localStorage.getItem(storageKeys.theme) || currentTheme;
      savedLanguage = localStorage.getItem(storageKeys.language) || 'it';
    } catch (error) {}

    applyTheme(savedTheme, false);
    applyLanguage(savedLanguage, false);
  };

  window.kivaroSite = {
    t,
    interpolate,
    getLanguage: () => currentLanguage,
    getTheme: () => currentTheme,
    onLanguageChange: (callback) => document.addEventListener('kivaro:languagechange', (event) => callback(event.detail.language))
  };

  setupNavigation();
  setupControls();
  setupYear();
  initializePreferences();
})();
