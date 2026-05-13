import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/apiClient';
import { useLocale } from '../../context/LocaleContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useLocale();
  const [step, setStep] = useState(1); // 1=email, 2=code, 3=form
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [form, setForm] = useState({ username: '', password: '', first_name: '', last_name: '', middle_name: '', role: 'doctor', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.sendCode(email);
      setStep(2);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || t('auth.emailSendError', 'Не удалось отправить код. Проверьте email.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) { setError(t('auth.enterSixDigitCode', 'Введите 6-значный код')); return; }
    setStep(3);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
      try {
        await register({ ...form, email });
        navigate('/login', { state: { registered: true } });
      } catch (err) {
        const data = err.response?.data;
        if (typeof data === 'object') {
          const messages = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ');
          setError(messages);
        } else {
          setError(t('auth.registrationError', 'Ошибка регистрации'));
        }
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
      <div className="auth-card animate-slideup" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <h1>ClinSpeech</h1>
          <p>{step === 1 ? t('auth.confirmEmail', 'Подтвердите email') : step === 2 ? t('auth.enterCode', 'Введите код') : t('auth.createAccount', 'Создать аккаунт')}</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              width: 32, height: 4, borderRadius: 2,
              background: s <= step ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* Step 1: Email */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendCode}>
            <div className="input-group">
              <label className="input-label">{t('auth.email', 'Email')} *</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder', 'почта@пример.kz')} required />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {t('auth.codeSentHint', 'На указанный адрес будет отправлен 6-значный код подтверждения')}
            </p>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? t('auth.sending', 'Отправка...') : t('auth.sendCode', 'Отправить код')}
            </button>
          </form>
        )}

        {/* Step 2: OTP Code */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyCode}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, textAlign: 'center' }}>
              {t('auth.codeSentTo', 'Код отправлен на')} <strong>{email}</strong>
            </p>
            <div className="input-group">
              <label className="input-label">{t('auth.verificationCode', 'Код подтверждения')} *</label>
              <input
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('auth.codePlaceholder', '000000')}
                maxLength={6}
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 600 }}
                required
              />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%', justifyContent: 'center' }}>
              {t('auth.confirm', 'Подтвердить')}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => { setStep(1); setError(''); }} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {t('auth.changeEmail', 'Изменить email')}
            </button>
          </form>
        )}

        {/* Step 3: Registration form */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>
              Email: <strong>{email}</strong>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">{t('profile.lastName', 'Фамилия')} *</label>
                <input className="input" name="last_name" value={form.last_name} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">{t('profile.firstName', 'Имя')} *</label>
                <input className="input" name="first_name" value={form.first_name} onChange={handleChange} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">{t('profile.middleName', 'Отчество')}</label>
              <input className="input" name="middle_name" value={form.middle_name} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('auth.username', 'Имя пользователя')} *</label>
              <input className="input" name="username" value={form.username} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label className="input-label">{t('profile.phone', 'Телефон')}</label>
              <input className="input" name="phone" value={form.phone} onChange={handleChange} placeholder={t('auth.phonePlaceholder', '+7 (___) ___-____')} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('auth.role', 'Роль')}</label>
              <select className="input" name="role" value={form.role} onChange={handleChange}>
                <option value="doctor">{t('auth.roleDoctor', 'Врач')}</option>
                <option value="patient">{t('auth.rolePatient', 'Пациент')}</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">{t('auth.password', 'Пароль')} *</label>
              <input className="input" type="password" name="password" value={form.password} onChange={handleChange} minLength={8} required />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? t('auth.registerLoading', 'Регистрация...') : t('auth.registerAction', 'Зарегистрироваться')}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => { setStep(1); setError(''); }} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {t('auth.back', 'Назад')}
            </button>
          </form>
        )}

        <div className="auth-footer">
          {t('auth.haveAccount', 'Уже есть аккаунт?')} <Link to="/login">{t('auth.signIn', 'Войти')}</Link>
        </div>
      </div>
    </div>
  );
}
