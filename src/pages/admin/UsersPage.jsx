import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/apiClient';
import { useLocale } from '../../context/LocaleContext';

export default function UsersPage() {
  const { t } = useLocale();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers();
      setUsers(Array.isArray(data) ? data : (data?.results || []));
    } catch {} finally { setLoading(false); }
  };

  const handleActivate = async (id) => {
    try { await adminAPI.activateUser(id); loadUsers(); } catch { alert(t('adminUsers.error', 'Ошибка')); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm(t('adminUsers.deleteConfirm', 'Деактивировать пользователя?'))) return;
    try { await adminAPI.deactivateUser(id); loadUsers(); } catch { alert(t('adminUsers.error', 'Ошибка')); }
  };

  const roleLabel = { admin: t('adminUsers.roleAdmin', 'Админ'), doctor: t('adminUsers.roleDoctor', 'Врач'), patient: t('adminUsers.rolePatient', 'Пациент') };

  const filtered = users.filter(u => {
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchSearch = !search || `${u.last_name} ${u.first_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">{t('adminUsers.title', 'Управление пользователями')}</h1><p className="page-subtitle">{t('adminUsers.subtitle', '{{count}} пользователей', { count: users.length })}</p></div>
      </div>

      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input className="input" placeholder={t('adminUsers.searchPlaceholder', 'Поиск...')} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>
        <select className="input" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">{t('adminUsers.allRoles', 'Все роли')}</option>
          <option value="admin">{t('adminUsers.roleAdmin', 'Админ')}</option>
          <option value="doctor">{t('adminUsers.roleDoctor', 'Врач')}</option>
          <option value="patient">{t('adminUsers.rolePatient', 'Пациент')}</option>
        </select>
      </div>

      {loading ? <div className="loading-spinner" /> : (
        <div className="card table-wrapper">
          <table>
            <thead><tr><th>{t('adminUsers.name', 'ФИО')}</th><th>{t('adminUsers.email', 'Email')}</th><th>{t('adminUsers.role', 'Роль')}</th><th>{t('adminUsers.status', 'Статус')}</th><th>{t('adminUsers.actions', 'Действия')}</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.last_name} {u.first_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'doctor' ? 'badge-info' : 'badge-neutral'}`}>{roleLabel[u.role] || u.role}</span></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {u.is_active ? t('adminUsers.active', 'Активен') : t('adminUsers.inactive', 'Неактивен')}
                    </span>
                  </td>
                  <td>
                    {u.is_active ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivate(u.id)} style={{ color: 'var(--danger)' }}>{t('adminUsers.deactivate', 'Деактивировать')}</button>
                    ) : (
                      <button className="btn btn-success btn-sm" onClick={() => handleActivate(u.id)}>{t('adminUsers.activate', 'Активировать')}</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>{t('adminUsers.empty', 'Нет пользователей')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
