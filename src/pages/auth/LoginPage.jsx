import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/apiClient';
import { useLocale } from '../../context/LocaleContext';
import { getHomeRoute } from '../../utils/navigation';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithCode } = useAuth();
  const { t } = useLocale();
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
      try {
        const data = await login(username, password);
        navigate(getHomeRoute(data.role), { replace: true });
      } catch (err) {
        setError(err.response?.data?.detail || t('auth.invalidCredentials', 'Неверные учётные данные'));
      } finally {
        setLoading(false);
      }
  };

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
      try {
        await authAPI.sendCode(email);
        setCodeSent(true);
      } catch (err) {
        setError(err.response?.data?.error || t('auth.sendCodeError', 'Ошибка отправки кода'));
      } finally {
        setLoading(false);
      }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
      try {
        const data = await loginWithCode(email, code);
        navigate(getHomeRoute(data.role), { replace: true });
      } catch (err) {
        setError(err.response?.data?.error || t('auth.wrongCode', 'Неверный код'));
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="auth-page">
      <div className="animated-bg">
        <span className="blob blob1"></span>
        <span className="blob blob2"></span>
        <span className="blob blob3"></span>
        <span className="blob blob4"></span>
      </div>
      <div className="auth-card animate-slideup">
        <div className="auth-logo">
          <h1>ClinSpeech</h1>
          <p>{t('auth.loginTitle', 'Вход в систему')}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          <button
            className={`tab ${mode === 'password' ? 'active' : ''}`}
            onClick={() => { setMode('password'); setError(''); }}
            style={{ flex: 1 }}
          >
            {t('auth.loginPasswordTab', 'По паролю')}
          </button>
          <button
            className={`tab ${mode === 'otp' ? 'active' : ''}`}
            onClick={() => { setMode('otp'); setError(''); }}
            style={{ flex: 1 }}
          >
            {t('auth.loginCodeTab', 'По email-коду')}
          </button>
        </div>

        {mode === 'password' ? (
          <form className="auth-form" onSubmit={handlePasswordLogin}>
            <div className="input-group">
              <label className="input-label">{t('auth.username', 'Имя пользователя')}</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('auth.usernamePlaceholder', 'Имя пользователя')} required />
            </div>
            <div className="input-group">
              <label className="input-label">{t('auth.password', 'Пароль')}</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder', '••••••••')} required />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? t('auth.signingIn', 'Вход...') : t('auth.signIn', 'Войти')}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleOtpLogin}>
            <div className="input-group">
              <label className="input-label">{t('auth.email', 'Email')}</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.doctorEmailPlaceholder', 'doctor@clinic.kz')} required />
            </div>
            {!codeSent ? (
              <button className="btn btn-primary btn-lg" type="button" onClick={handleSendCode} disabled={loading || !email} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? t('auth.sendingCode', 'Отправка...') : t('auth.sendCode', 'Отправить код')}
              </button>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">{t('auth.code', '6-значный код')}</label>
                  <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} required />
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? t('auth.signingIn', 'Вход...') : t('auth.confirm', 'Подтвердить')}
                </button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setCodeSent(false)} style={{ alignSelf: 'center' }}>
                  {t('auth.resendCode', 'Отправить код заново')}
                </button>
              </>
            )}
          </form>
        )}

        <div className="auth-footer">
          {t('auth.noAccount', 'Нет аккаунта?')} <Link to="/register">{t('auth.registerAction', 'Зарегистрироваться')}</Link>
        </div>
      </div>
    </div>
  );
}
