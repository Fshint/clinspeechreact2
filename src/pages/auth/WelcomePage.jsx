import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../assets/Logo.png';
import { useLocale } from '../../context/LocaleContext';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { t } = useLocale();

  return (
      <div className="welcome-page">
        <div className="animated-bg">
          <span className="blob blob1"></span>
          <span className="blob blob2"></span>
          <span className="blob blob3"></span>
          <span className="blob blob4"></span>
        </div>

        <img src={logoImg} alt="ClinSpeech Logo" className="welcome-page-logo-img" />
        <div className="welcome-logo">
          Clin<span>Speech</span>
        </div>

        <p className="welcome-desc" style={{ whiteSpace: 'pre-line' }}>
          {t('welcome.description', 'ИИ-платформа для медицинского документооборота.\nЗапишите приём — получите готовый отчёт за минуту.')}
        </p>

        <div className="welcome-btns">
          <button className="welcome-btn welcome-btn-primary" onClick={() => navigate('/login')}>
            {t('welcome.login', 'Войти в систему')}
          </button>
          <button className="welcome-btn welcome-btn-secondary" onClick={() => navigate('/register')}>
            {t('welcome.register', 'Регистрация')}
          </button>
        </div>

        <div className="welcome-features">
        <div className="welcome-feature">
          <div className="welcome-feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </div>
          <h4>{t('welcome.recordingTitle', 'Запись приёма')}</h4>
          <p>{t('welcome.recordingDescription', 'Запишите аудио консультации прямо в браузере')}</p>
        </div>
        <div className="welcome-feature">
          <div className="welcome-feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <h4>{t('welcome.aiTitle', 'ИИ-анализ')}</h4>
          <p>{t('welcome.aiDescription', 'Gemini AI транскрибирует и структурирует отчёт')}</p>
        </div>
        <div className="welcome-feature">
          <div className="welcome-feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
          </div>
          <h4>{t('welcome.pdfTitle', 'PDF-отчёты')}</h4>
          <p>{t('welcome.pdfDescription', 'Готовые медицинские заключения в формате PDF')}</p>
        </div>
      </div>
    </div>
  );
}
