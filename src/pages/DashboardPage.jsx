import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, consultationsAPI, appointmentsAPI } from '../api/apiClient';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useLocale } from '../context/LocaleContext';

const STATUS_COLORS = { created: 'badge-neutral', processing: 'badge-info', generating: 'badge-warning', ready: 'badge-success', error: 'badge-danger' };
export default function DashboardPage() {
  const { user } = useAuth();
  const { t, formatDate, formatTime } = useLocale();
  const navigate = useNavigate();
  const isPatient = user?.role === 'patient';
  const [stats, setStats] = useState(null);
  const [recentConsults, setRecentConsults] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const promises = [
      consultationsAPI.getAll({ page_size: 5 }).catch(() => ({ data: { results: [] } })),
    ];
    if (!isPatient) {
      promises.push(userAPI.getStats().catch(() => ({ data: null })));
      promises.push(appointmentsAPI.getToday().catch(() => ({ data: [] })));
    }
    Promise.all(promises).then((results) => {
      const c = results[0];
      const items = Array.isArray(c.data) ? c.data : (c.data?.results || []);
      setRecentConsults(items.slice(0, 5));
      if (!isPatient) {
        setStats(results[1]?.data || null);
        setTodayAppts(Array.isArray(results[2]?.data) ? results[2].data : (results[2]?.data?.results || []));
      }
    }).finally(() => setLoading(false));
  }, [isPatient]);

  if (loading) return <div className="loading-spinner" />;

  const displayName = user?.first_name || user?.full_name || user?.username || t('roles.doctor', 'Врач');
  const statusData = stats?.consultations_by_status || {};
  const activityData = stats?.activity_by_day || [];
  const statusLabels = {
    created: t('statuses.created', 'Создано'),
    processing: t('statuses.processing', 'Обработка'),
    generating: t('statuses.generating', 'Генерация'),
    ready: t('statuses.ready', 'Готово'),
    error: t('statuses.error', 'Ошибка'),
  };
  const appointmentStatusLabels = {
    scheduled: t('dashboard.awaiting', 'Ожидается'),
    completed: t('dashboard.finished', 'Завершено'),
  };

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.welcome', 'Добро пожаловать, {{name}}!', { name: displayName })}</h1>
          <p className="page-subtitle">{t('dashboard.subtitle', 'Обзор активности и статистики')}</p>
        </div>
        {(user?.role === 'doctor' || user?.role === 'admin') && (
          <button className="btn btn-primary" onClick={() => navigate('/record')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            {t('dashboard.newConsultation', 'Новый приём')}
          </button>
        )}
      </div>

      {/* Stat Cards — only for doctor/admin */}
      {!isPatient && stats && (
        <div className="stat-grid">
          <div className="card stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            </div>
            <div className="stat-card-value">{stats.total_consultations}</div>
            <div className="stat-card-label">{t('dashboard.totalConsultations', 'Всего консультаций')}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="stat-card-value">{statusData.ready || 0}</div>
            <div className="stat-card-label">{t('dashboard.completed', 'Завершённых')}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <div className="stat-card-value">{stats.consultations_this_month}</div>
            <div className="stat-card-label">{t('dashboard.thisMonth', 'В этом месяце')}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-card-icon" style={{ background: '#fae8ff', color: '#a855f7' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <div className="stat-card-value">{stats.total_patients}</div>
            <div className="stat-card-label">{t('dashboard.patients', 'Пациентов')}</div>
          </div>
        </div>
      )}

      {/* Charts Row — only for doctor/admin */}
      {!isPatient && (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{t('dashboard.activityTitle', 'Активность за 14 дней')}</h3>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="gradActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2EC4B6FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2EC4B6FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2EC4B6FF" fill="url(#gradActivity)" strokeWidth={2} name={t('dashboard.consultationsSeries', 'Консультаций')} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>{t('dashboard.noDataPeriod', 'Нет данных за период')}</p></div>
          )}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{t('dashboard.statusTitle', 'По статусам')}</h3>
          {stats && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={Object.entries(statusData).map(([k, v]) => ({ name: statusLabels[k] || k, value: v }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2EC4B6FF" radius={[4, 4, 0, 0]} name={t('dashboard.count', 'Кол-во')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      )}

      {/* Recent consultations + Today appointments */}
      <div style={{ display: 'grid', gridTemplateColumns: isPatient ? '1fr' : '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>{t('dashboard.recentConsultations', 'Последние консультации')}</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/consultations')}>{t('dashboard.all', 'Все →')}</button>
          </div>
          {recentConsults.length === 0 ? (
            <div className="empty-state"><p>{t('dashboard.noConsultations', 'Нет консультаций')}</p></div>
          ) : (
            recentConsults.map((c) => (
              <div key={c.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => navigate(`/consultations/${c.id}`)}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{c.patient_info?.last_name} {c.patient_info?.first_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(c.created_at)}</div>
                </div>
                <span className={`badge ${STATUS_COLORS[c.status] || 'badge-neutral'}`}>{statusLabels[c.status] || c.status}</span>
              </div>
            ))
          )}
        </div>

        {!isPatient && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>{t('dashboard.todayAppointments', 'Приёмы на сегодня')}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/appointments')}>{t('dashboard.all', 'Все →')}</button>
            </div>
            {todayAppts.length === 0 ? (
              <div className="empty-state"><p>{t('dashboard.noAppointmentsToday', 'На сегодня приёмов нет')}</p></div>
            ) : (
              todayAppts.map((a) => (
                <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{a.patient_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatTime(a.scheduled_at)} · {a.reason || t('dashboard.appointmentDefaultReason', 'Приём')}</div>
                  </div>
                  <span className={`badge ${a.status === 'scheduled' ? 'badge-info' : a.status === 'completed' ? 'badge-success' : 'badge-neutral'}`}>{appointmentStatusLabels[a.status] || a.status}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
