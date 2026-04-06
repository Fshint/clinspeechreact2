import React from 'react';
import { useLocale } from '../context/LocaleContext';

export default function LocaleSwitcher({ className = '' }) {
  const { locale, setLocale, t } = useLocale();
  const languageLabel = t('common.language', 'Язык');

  return (
    <div className={`locale-switcher ${className}`.trim()} role="group" aria-label={languageLabel}>
      <div className="locale-switcher__group" role="group" aria-label={languageLabel}>
        <button
          type="button"
          className={`locale-switcher__button ${locale === 'ru' ? 'active' : ''}`}
          onClick={() => setLocale('ru')}
          aria-pressed={locale === 'ru'}
          title="Русский"
        >
          RU
        </button>
        <button
          type="button"
          className={`locale-switcher__button ${locale === 'kk' ? 'active' : ''}`}
          onClick={() => setLocale('kk')}
          aria-pressed={locale === 'kk'}
          title="Қазақша"
        >
          KZ
        </button>
      </div>
    </div>
  );
}
