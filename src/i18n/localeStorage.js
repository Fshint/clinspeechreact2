export const LOCALE_STORAGE_KEY = 'app_locale';
export const SUPPORTED_LOCALES = ['ru', 'kk'];

export function normalizeLocale(value) {
  return value === 'kk' ? 'kk' : 'ru';
}

export function getStoredLocale() {
  try {
    return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return 'ru';
  }
}

export function getLocaleCode(locale) {
  return normalizeLocale(locale);
}

export function setStoredLocale(locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale));
  } catch {
    // Ignore storage failures; locale still works in-memory.
  }
}
