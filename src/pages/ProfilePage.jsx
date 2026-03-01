import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, authAPI } from '../api/apiClient';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', new_password2: '' });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data } = await userAPI.getMe();
      setProfile(data);
      setForm({ first_name: data.first_name, last_name: data.last_name, middle_name: data.middle_name || '', phone: data.phone || '' });
    } catch {} finally { setLoading(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      await userAPI.updateMe(form);
      await loadProfile();
      setEditing(false);
      setSuccess('Профиль обновлён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join('; ') : 'Ошибка');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (pwdForm.new_password !== pwdForm.new_password2) { setError('Пароли не совпадают'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword(pwdForm.old_password, pwdForm.new_password);
      setShowPwd(false);
      setPwdForm({ old_password: '', new_password: '', new_password2: '' });
      setSuccess('Пароль изменён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join('; ') : 'Неверный текущий пароль');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading-spinner" />;

  const roleLabel = { admin: 'Администратор', doctor: 'Врач', patient: 'Пациент' }[profile?.role] || profile?.role;

  return (
    <div className="animate-fade" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header"><div><h1 className="page-title">Профиль</h1></div></div>

      {success && <div style={{ background: 'rgba(34,197,94,.1)', color: '#16a34a', padding: '10px 16px', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 14 }}>{success}</div>}
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Profile card */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#fff'
          }}>
            {(profile?.first_name?.[0] || '').toUpperCase()}{(profile?.last_name?.[0] || '').toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{profile?.last_name} {profile?.first_name} {profile?.middle_name || ''}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span className="badge badge-info">{roleLabel}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{profile?.email}</span>
            </div>
          </div>
        </div>

        {!editing ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Фамилия', val: profile?.last_name },
                { label: 'Имя', val: profile?.first_name },
                { label: 'Отчество', val: profile?.middle_name || '—' },
                { label: 'Телефон', val: profile?.phone || '—' },
                { label: 'Email', val: profile?.email },
                { label: 'Организация', val: profile?.organization_name || '—' },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => setEditing(true)}>Редактировать</button>
              <button className="btn btn-secondary" onClick={() => setShowPwd(true)}>Сменить пароль</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Фамилия</label>
                <input className="input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Имя</label>
                <input className="input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
              </div>
            </div>
            <div className="input-group" style={{ marginTop: 12 }}>
              <label className="input-label">Отчество</label>
              <input className="input" value={form.middle_name} onChange={e => setForm({ ...form, middle_name: e.target.value })} />
            </div>
            <div className="input-group" style={{ marginTop: 12 }}>
              <label className="input-label">Телефон</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
              <button className="btn btn-secondary" type="button" onClick={() => { setEditing(false); setError(''); }}>Отмена</button>
            </div>
          </form>
        )}
      </div>

      {/* Logout */}
      <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Выход из системы</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Завершить текущую сессию</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { if (window.confirm('Выйти из аккаунта?')) logout(); }}>Выйти</button>
      </div>

      {/* Password modal */}
      {showPwd && (
        <div className="modal-overlay" onClick={() => setShowPwd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Смена пароля</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowPwd(false)}>✕</button></div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Текущий пароль *</label>
                  <input className="input" type="password" value={pwdForm.old_password} onChange={e => setPwdForm({ ...pwdForm, old_password: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Новый пароль *</label>
                  <input className="input" type="password" value={pwdForm.new_password} onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })} required minLength={8} />
                </div>
                <div className="input-group">
                  <label className="input-label">Подтвердите новый пароль *</label>
                  <input className="input" type="password" value={pwdForm.new_password2} onChange={e => setPwdForm({ ...pwdForm, new_password2: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowPwd(false)}>Отмена</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? '...' : 'Сменить'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
