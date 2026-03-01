import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultationsAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = { created: 'badge-neutral', processing: 'badge-info', generating: 'badge-warning', ready: 'badge-success', error: 'badge-danger' };
const STATUS_LABELS = { created: 'Создано', processing: 'Обработка', generating: 'Генерация', ready: 'Готово', error: 'Ошибка' };
const STATUSES = ['', 'created', 'processing', 'generating', 'ready', 'error'];

export default function ConsultationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const { data } = await consultationsAPI.getAll(params);
      const list = Array.isArray(data) ? data : (data?.results || []);
      setItems(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const pName = `${c.patient_info?.last_name || ''} ${c.patient_info?.first_name || ''}`.toLowerCase();
    return pName.includes(q) || String(c.id).includes(q);
  });

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isPatient ? 'Мои консультации' : 'Консультации'}</h1>
          <p className="page-subtitle">{items.length} записей</p>
        </div>
        {!isPatient && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => navigate('/record')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
              Новый приём
            </button>
          </div>
        )}
      </div>

      {/* Filter bar — only for doctor/admin */}
      {!isPatient && (
        <div className="filter-bar">
          <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input className="input" placeholder="Поиск по пациенту или ID..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
          </div>
          {STATUSES.map((s) => (
            <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s ? STATUS_LABELS[s] : 'Все'}
            </button>
          ))}
        </div>
      )}

      {loading ? <div className="loading-spinner" /> : filtered.length === 0 ? (
        <div className="card empty-state">
          <h3>Нет консультаций</h3>
          <p>{isPatient ? 'У вас пока нет записей о консультациях' : 'Создайте новый приём для начала работы'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((c) => (
            <div key={c.id} className="card consult-card" onClick={() => navigate(`/consultations/${c.id}`)}>
              <div className="consult-card-header">
                <div>
                  <span className="consult-card-patient">{c.patient_info?.last_name} {c.patient_info?.first_name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>#{c.id}</span>
                </div>
                <span className={`badge ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status] || c.status}</span>
              </div>
              <div className="consult-card-meta">
                <span className="consult-card-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  {new Date(c.created_at).toLocaleDateString('ru-RU')}
                </span>
                <span className="consult-card-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {c.doctor_name || '—'}
                </span>
                {c.images_count > 0 && (
                  <span className="consult-card-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    {c.images_count} снимков
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
