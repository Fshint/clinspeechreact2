import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { kkMessages } from '../i18n/kkMessages';
import { TRANSLATIONS as legacyTranslations } from '../i18n/locales';
import { getLocaleCode, getStoredLocale, LOCALE_STORAGE_KEY, normalizeLocale } from '../i18n/localeStorage';

const LocaleContext = createContext(null);

const interpolate = (template, params = {}) => {
  if (typeof template !== 'string') return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
};

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale);

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // ignore storage errors
    }

    const localeCode = getLocaleCode(locale);
    axios.defaults.headers.common['Accept-Language'] = localeCode;

    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'kk' ? 'kk' : 'ru';
    }
  }, [locale]);

  const setLocale = useCallback((nextLocale) => {
    setLocaleState(normalizeLocale(nextLocale));
  }, []);

  const t = useCallback((key, fallback = key, params = {}) => {
    const legacyKkMessages = legacyTranslations?.kk || {};
    const translation = locale === 'kk'
      ? kkMessages[fallback] ?? kkMessages[fallback?.trim?.()] ?? legacyKkMessages[fallback] ?? kkMessages[key]
      : undefined;
    const value = translation ?? fallback;
    return interpolate(value, params);
  }, [locale]);

  const dateLocale = getLocaleCode(locale);

  const formatDate = useCallback((value, options = {}) => {
    if (!value) return '';
    return new Intl.DateTimeFormat(dateLocale, { year: 'numeric', month: '2-digit', day: '2-digit', ...options }).format(new Date(value));
  }, [dateLocale]);

  const formatTime = useCallback((value, options = {}) => {
    if (!value) return '';
    return new Intl.DateTimeFormat(dateLocale, { hour: '2-digit', minute: '2-digit', ...options }).format(new Date(value));
  }, [dateLocale]);

  const formatDateTime = useCallback((value, options = {}) => {
    if (!value) return '';
    return new Intl.DateTimeFormat(dateLocale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', ...options }).format(new Date(value));
  }, [dateLocale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    dateLocale,
    formatDate,
    formatTime,
    formatDateTime,
    isRussian: locale === 'ru',
    isKazakh: locale === 'kk',
  }), [locale, setLocale, t, dateLocale, formatDate, formatTime, formatDateTime]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
