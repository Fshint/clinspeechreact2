import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api/apiClient';
import { useLocale } from '../../context/LocaleContext';

export default function AuditLogPage() {
  const { t, formatDateTime } = useLocale();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (actionFilter) params.action = actionFilter;
      const { data } = await adminAPI.getAuditLog(params);
      if (data?.results) {
        setLogs(data.results);
        setHasNext(!!data.next);
      } else {
        setLogs(Array.isArray(data) ? data : []);
        setHasNext(false);
      }
    } catch {} finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const actionColors = {
    create: 'badge-success', update: 'badge-info', delete: 'badge-danger',
    login: 'badge-neutral', view: 'badge-neutral', download: 'badge-warning'
  };
  const actionLabels = {
    create: t('adminAudit.create', 'Создание'),
    update: t('adminAudit.update', 'Обновление'),
    delete: t('adminAudit.delete', 'Удаление'),
    login: t('adminAudit.login', 'Вход'),
    view: t('adminAudit.view', 'Просмотр'),
    download: t('adminAudit.download', 'Скачивание'),
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">{t('adminAudit.title', 'Журнал аудита')}</h1><p className="page-subtitle">{t('adminAudit.subtitle', 'Действия пользователей')}</p></div>
      </div>

      <div className="filter-bar">
        <select className="input" style={{ width: 180 }} value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">{t('adminAudit.allActions', 'Все действия')}</option>
          <option value="create">{t('adminAudit.create', 'Создание')}</option>
          <option value="update">{t('adminAudit.update', 'Обновление')}</option>
          <option value="delete">{t('adminAudit.delete', 'Удаление')}</option>
          <option value="login">{t('adminAudit.login', 'Вход')}</option>
          <option value="view">{t('adminAudit.view', 'Просмотр')}</option>
          <option value="download">{t('adminAudit.download', 'Скачивание')}</option>
        </select>
      </div>

      {loading ? <div className="loading-spinner" /> : logs.length === 0 ? (
        <div className="card empty-state"><h3>{t('adminAudit.empty', 'Нет записей')}</h3></div>
      ) : (
        <>
          <div className="card table-wrapper">
            <table>
              <thead>
                <tr><th>{t('adminAudit.date', 'Дата')}</th><th>{t('adminAudit.user', 'Пользователь')}</th><th>{t('adminAudit.action', 'Действие')}</th><th>{t('adminAudit.object', 'Объект')}</th><th>{t('adminAudit.details', 'Детали')}</th></tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{formatDateTime(l.created_at || l.timestamp)}</td>
                    <td style={{ fontWeight: 500 }}>{l.user_name || l.user || '—'}</td>
                    <td><span className={`badge ${actionColors[l.action] || 'badge-neutral'}`}>{actionLabels[l.action] || l.action}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{l.object_type}{l.object_id ? ` #${l.object_id}` : ''}</td>
                    <td style={{ fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('adminAudit.back', '← Назад')}</button>
            <span style={{ padding: '6px 12px', fontSize: 14 }}>{t('adminAudit.page', 'Страница {{page}}', { page })}</span>
            <button className="btn btn-secondary btn-sm" disabled={!hasNext} onClick={() => setPage(p => p + 1)}>{t('adminAudit.next', 'Далее →')}</button>
          </div>
        </>
      )}
    </div>
  );
}
