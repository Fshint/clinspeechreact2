import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/apiClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithCode } = useAuth();
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
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверные учётные данные');
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
      setError(err.response?.data?.error || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithCode(email, code);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код');
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
          <p>Вход в систему</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          <button
            className={`tab ${mode === 'password' ? 'active' : ''}`}
            onClick={() => { setMode('password'); setError(''); }}
            style={{ flex: 1 }}
          >
            По паролю
          </button>
          <button
            className={`tab ${mode === 'otp' ? 'active' : ''}`}
            onClick={() => { setMode('otp'); setError(''); }}
            style={{ flex: 1 }}
          >
            По email-коду
          </button>
        </div>

        {mode === 'password' ? (
          <form className="auth-form" onSubmit={handlePasswordLogin}>
            <div className="input-group">
              <label className="input-label">Имя пользователя</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" required />
            </div>
            <div className="input-group">
              <label className="input-label">Пароль</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleOtpLogin}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@clinic.com" required />
            </div>
            {!codeSent ? (
              <button className="btn btn-primary btn-lg" type="button" onClick={handleSendCode} disabled={loading || !email} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Отправка...' : 'Отправить код'}
              </button>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">6-значный код</label>
                  <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} required />
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Вход...' : 'Подтвердить'}
                </button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setCodeSent(false)} style={{ alignSelf: 'center' }}>
                  Отправить код заново
                </button>
              </>
            )}
          </form>
        )}

        <div className="auth-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  );
}
