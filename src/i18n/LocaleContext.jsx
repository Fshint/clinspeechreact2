import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALES, getStoredLocale, setStoredLocale, translate } from './locales';

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale);

  useEffect(() => {
    setStoredLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (nextLocale) => {
    setLocaleState(nextLocale === LOCALES.kk ? LOCALES.kk : LOCALES.ru);
  };

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (text, vars) => translate(locale, text, vars),
    isKk: locale === LOCALES.kk,
    formatDate: (date, options) => new Intl.DateTimeFormat(locale === LOCALES.kk ? 'kk-KZ' : 'ru-RU', options).format(date),
    formatTime: (date, options) => new Intl.DateTimeFormat(locale === LOCALES.kk ? 'kk-KZ' : 'ru-RU', options).format(date),
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

export function LocaleToggle({ className = '' }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={`locale-toggle ${className}`.trim()}>
      <button
        type="button"
        className={`locale-toggle-btn ${locale === LOCALES.ru ? 'active' : ''}`}
        onClick={() => setLocale(LOCALES.ru)}
      >
        RU
      </button>
      <button
        type="button"
        className={`locale-toggle-btn ${locale === LOCALES.kk ? 'active' : ''}`}
        onClick={() => setLocale(LOCALES.kk)}
      >
        KZ
      </button>
    </div>
  );
}

