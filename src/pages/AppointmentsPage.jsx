import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsAPI, patientsAPI } from '../api/apiClient';
import { useLocale } from '../context/LocaleContext';

const STATUS_BADGE = { scheduled: 'badge-info', completed: 'badge-success', cancelled: 'badge-neutral' };

export default function AppointmentsPage() {
  const { t, formatDate, formatTime } = useLocale();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [showCreate, setShowCreate] = useState(false);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient: '', date: '', time: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const statusMap = {
    scheduled: t('appointments.statusScheduled', 'Запланировано'),
    completed: t('appointments.statusCompleted', 'Завершено'),
    cancelled: t('appointments.statusCancelled', 'Отменено'),
  };

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (tab === 'today') {
        data = (await appointmentsAPI.getToday()).data;
      } else if (tab === 'upcoming') {
        data = (await appointmentsAPI.getUpcoming()).data;
      } else {
        data = (await appointmentsAPI.getAll()).data;
      }
      setAppointments(Array.isArray(data) ? data : (data?.results || []));
    } catch {} finally { setLoading(false); }
  }, [tab]);

  useEffect(() => {
    patientsAPI.getAll().then(({ data }) => setPatients(Array.isArray(data) ? data : (data?.results || []))).catch(() => {});
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const datetime = `${form.date}T${form.time}:00`;
      await appointmentsAPI.create({ patient: form.patient, scheduled_at: datetime, notes: form.notes });
      setShowCreate(false);
      setForm({ patient: '', date: '', time: '', notes: '' });
      loadAppointments();
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join('; ') : t('appointments.createError', 'Ошибка'));
    } finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(t('appointments.cancelConfirm', 'Отменить приём?'))) return;
    setActionError('');
    try {
      await appointmentsAPI.cancel(id);
      loadAppointments();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || `Ошибка ${err.response?.status || ''}`;
      setActionError(msg || t('appointments.cancelError', 'Ошибка'));
    }
  };

  const handleComplete = async (id) => {
    setActionError('');
    try {
      await appointmentsAPI.complete(id);
      loadAppointments();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || `Ошибка ${err.response?.status || ''}`;
      setActionError(msg || t('appointments.cancelError', 'Ошибка'));
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">{t('appointments.title', 'Расписание')}</h1><p className="page-subtitle">{t('appointments.subtitle', 'Приёмы и записи')}</p></div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          {t('appointments.newAppointment', 'Новый приём')}
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>{t('appointments.upcoming', 'Предстоящие')}</button>
        <button className={`tab ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>{t('appointments.today', 'Сегодня')}</button>
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>{t('appointments.all', 'Все')}</button>
      </div>

      {actionError && (
        <div className="auth-error" style={{ marginBottom: 12 }}>
          {actionError}
          <button onClick={() => setActionError('')} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>✕</button>
        </div>
      )}

      {loading ? <div className="loading-spinner" /> : appointments.length === 0 ? (
        <div className="card empty-state"><h3>{t('appointments.emptyTitle', 'Нет приёмов')}</h3><p>{t('appointments.emptySubtitle', 'Запланируйте новый приём')}</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {appointments.map(a => (
            <div key={a.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{a.patient_name || t('appointments.appointmentLabel', 'Пациент #{{id}}', { id: a.patient })}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {formatDate(a.scheduled_at)} {t('common.at', 'в')} {formatTime(a.scheduled_at)}
                  {a.notes && <span> · {a.notes}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${STATUS_BADGE[a.status] || 'badge-neutral'}`}>{statusMap[a.status] || a.status}</span>
                {a.status === 'scheduled' && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={() => handleComplete(a.id)}>✓</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleCancel(a.id)} style={{ color: 'var(--danger)' }}>✕</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{t('appointments.titleModal', 'Новый приём')}</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div className="auth-error">{error}</div>}
                <div className="input-group">
                  <label className="input-label">{t('appointments.patient', 'Пациент *')}</label>
                  <select className="input" value={form.patient} onChange={e => setForm({ ...form, patient: e.target.value })} required>
                    <option value="">{t('appointments.choose', 'Выберите...')}</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">{t('appointments.date', 'Дата *')}</label>
                    <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('appointments.time', 'Время *')}</label>
                    <input className="input" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">{t('appointments.notes', 'Заметки')}</label>
                  <textarea className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowCreate(false)}>{t('common.cancel', 'Отмена')}</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? t('appointments.createLoading', 'Создание...') : t('appointments.createAction', 'Создать')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
