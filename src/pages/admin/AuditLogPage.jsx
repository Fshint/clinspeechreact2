import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/apiClient';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  useEffect(() => { loadLogs(); }, [page, actionFilter]);

  const loadLogs = async () => {
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
  };

  const actionColors = {
    create: 'badge-success', update: 'badge-info', delete: 'badge-danger',
    login: 'badge-neutral', view: 'badge-neutral', download: 'badge-warning'
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">Журнал аудита</h1><p className="page-subtitle">Действия пользователей</p></div>
      </div>

      <div className="filter-bar">
        <select className="input" style={{ width: 180 }} value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">Все действия</option>
          <option value="create">Создание</option>
          <option value="update">Обновление</option>
          <option value="delete">Удаление</option>
          <option value="login">Вход</option>
          <option value="view">Просмотр</option>
          <option value="download">Скачивание</option>
        </select>
      </div>

      {loading ? <div className="loading-spinner" /> : logs.length === 0 ? (
        <div className="card empty-state"><h3>Нет записей</h3></div>
      ) : (
        <>
          <div className="card table-wrapper">
            <table>
              <thead>
                <tr><th>Дата</th><th>Пользователь</th><th>Действие</th><th>Объект</th><th>Детали</th></tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{new Date(l.created_at || l.timestamp).toLocaleString('ru-RU')}</td>
                    <td style={{ fontWeight: 500 }}>{l.user_name || l.user || '—'}</td>
                    <td><span className={`badge ${actionColors[l.action] || 'badge-neutral'}`}>{l.action}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{l.object_type}{l.object_id ? ` #${l.object_id}` : ''}</td>
                    <td style={{ fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Назад</button>
            <span style={{ padding: '6px 12px', fontSize: 14 }}>Страница {page}</span>
            <button className="btn btn-secondary btn-sm" disabled={!hasNext} onClick={() => setPage(p => p + 1)}>Далее →</button>
          </div>
        </>
      )}
    </div>
  );
}
