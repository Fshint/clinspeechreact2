import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api/apiClient';

/* Inline SVG icons to avoid dependency issues */
const icons = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  mic: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  template: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>,
  log: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/><path d="m16 12 5 3-5 3v-6Z"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
};

const ROLE_LABELS = { admin: 'Администратор', doctor: 'Врач', patient: 'Пациент' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsAPI.getUnreadCount()
      .then(({ data }) => setUnreadCount(data.unread_count || 0))
      .catch(() => {});
    const interval = setInterval(() => {
      notificationsAPI.getUnreadCount()
        .then(({ data }) => setUnreadCount(data.unread_count || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const initials = user
    ? (user.first_name?.[0] || '') + (user.last_name?.[0] || '') || user.username?.[0]?.toUpperCase()
    : '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">CS</div>
          <div className="sidebar-logo-text">Clin<span>Speech</span></div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Основное</div>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {icons.dashboard} Дашборд
          </NavLink>
          {(isDoctor || isAdmin) && (
            <NavLink to="/record" className="sidebar-link" style={{ color: '#a78bfa' }}>
              {icons.mic} Новый приём
            </NavLink>
          )}
          <NavLink to="/consultations" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {icons.file} {isPatient ? 'Мои консультации' : 'Консультации'}
          </NavLink>
          {!isPatient && (
            <NavLink to="/patients" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              {icons.users} Пациенты
            </NavLink>
          )}
        </div>

        {!isPatient && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Планирование</div>
            <NavLink to="/appointments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              {icons.calendar} Расписание
            </NavLink>
          </div>
        )}

        <div className="sidebar-section">
          <div className="sidebar-section-label">{isPatient ? 'Прочее' : 'Коммуникации'}</div>
          <NavLink to="/notifications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {icons.bell} Уведомления
            {unreadCount > 0 && <span className="sidebar-badge">{unreadCount}</span>}
          </NavLink>
        </div>

        {(isDoctor || isAdmin) && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Инструменты</div>
            <NavLink to="/templates" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              {icons.template} Шаблоны
            </NavLink>
          </div>
        )}

        {isAdmin && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Администрирование</div>
            <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              {icons.shield} Пользователи
            </NavLink>
            <NavLink to="/admin/audit" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              {icons.log} Журнал аудита
            </NavLink>
          </div>
        )}

        <div className="sidebar-footer">
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {icons.user} Профиль
          </NavLink>
          <button className="sidebar-link" onClick={handleLogout} style={{ color: '#f87171' }}>
            {icons.logout} Выйти
          </button>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.full_name || user?.username}</div>
              <div className="sidebar-user-role">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
