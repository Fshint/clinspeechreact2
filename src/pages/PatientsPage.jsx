import React, { useState, useEffect, useCallback } from 'react';
import { patientsAPI, organizationsAPI, appointmentsAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

export default function PatientsPage() {
  const { user } = useAuth();
  const { t, formatDate } = useLocale();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showFromUser, setShowFromUser] = useState(false);
  const [showHistory, setShowHistory] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [form, setForm] = useState({ first_name: '', last_name: '', middle_name: '', birth_date: '', organization: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // From-user modal state
  const [patientUsers, setPatientUsers] = useState([]);
  const [patientUsersLoading, setPatientUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fromUserForm, setFromUserForm] = useState({ birth_date: '', organization: '' });
  const [fromUserSaving, setFromUserSaving] = useState(false);
  const [fromUserError, setFromUserError] = useState('');

  // Schedule appointment modal state
  const [showSchedule, setShowSchedule] = useState(null); // patient object
  const [scheduleForm, setScheduleForm] = useState({ date: '', time: '', reason: '', notes: '' });
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const titleCount = t('patients.subtitle', '{{count}} записей', { count: patients.length });

  const loadPatients = useCallback(async (searchValue) => {
    setLoading(true);
    try {
      const { data } = await patientsAPI.getAll({ search: searchValue || undefined });
      setPatients(Array.isArray(data) ? data : (data?.results || []));
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    organizationsAPI.getAll().then(({ data }) => {
      const items = Array.isArray(data) ? data : (data?.results || []);
      setOrgs(items);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadPatients(search), 300);
    return () => clearTimeout(timer);
  }, [search, loadPatients]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await patientsAPI.create(form);
      setShowCreate(false);
      setForm({ first_name: '', last_name: '', middle_name: '', birth_date: '', organization: '' });
      loadPatients(search);
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join('; ') : t('patients.createError', 'Ошибка создания'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('patients.deleteConfirm', 'Удалить пациента?'))) return;
    try {
      await patientsAPI.delete(id);
      loadPatients(search);
    } catch { alert(t('patients.deleteError', 'Ошибка удаления')); }
  };

  const loadHistory = async (patientId) => {
    setHistoryLoading(true);
    setHistoryError('');
    setHistory(null);
    setShowHistory(patientId);
    try {
      const { data } = await patientsAPI.getHistory(patientId);
      setHistory(data);
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.response?.data?.detail;
      const httpCode = err.response?.status;
      const msg = serverMsg
        ? `${serverMsg}`
        : httpCode
        ? `${t('common.error', 'Ошибка')} ${httpCode}: ${t('patients.loadHistoryError', 'не удалось загрузить историю')}`
        : t('patients.loadHistoryError', 'Сервер недоступен. Проверьте подключение.');
      setHistoryError(msg);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openFromUserModal = async () => {
    setShowFromUser(true);
    setSelectedUser(null);
    setFromUserForm({ birth_date: '', organization: '' });
    setFromUserError('');
    setPatientUsersLoading(true);
    try {
      const { data } = await patientsAPI.getPatientUsers();
      setPatientUsers(Array.isArray(data) ? data : []);
    } catch {
      setFromUserError(t('patients.addFromUsersError', 'Не удалось загрузить список пользователей'));
    } finally {
      setPatientUsersLoading(false);
    }
  };

  const handleFromUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFromUserError('');
    setFromUserSaving(true);
    try {
      await patientsAPI.fromUser({
        user_id: selectedUser.id,
        birth_date: fromUserForm.birth_date,
        organization: fromUserForm.organization || undefined,
      });
      setShowFromUser(false);
      loadPatients(search);
    } catch (err) {
      const d = err.response?.data;
      setFromUserError(typeof d === 'object' ? Object.values(d).flat().join('; ') : t('patients.addError', 'Ошибка добавления'));
    } finally {
      setFromUserSaving(false);
    }
  };

  const openSchedule = (patient) => {
    setShowSchedule(patient);
    setScheduleForm({ date: '', time: '', reason: '', notes: '' });
    setScheduleError('');
    setScheduleSuccess(false);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setScheduleError('');
    setScheduleSaving(true);
    try {
      const scheduled_at = `${scheduleForm.date}T${scheduleForm.time}:00`;
      await appointmentsAPI.create({
        patient: showSchedule.id,
        scheduled_at,
        reason: scheduleForm.reason,
        notes: scheduleForm.notes,
      });
      setScheduleSuccess(true);
      setTimeout(() => setShowSchedule(null), 1200);
    } catch (err) {
      const d = err.response?.data;
      setScheduleError(typeof d === 'object' ? Object.values(d).flat().join('; ') : t('patients.scheduleError', 'Ошибка записи'));
    } finally {
      setScheduleSaving(false);
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('patients.title', 'Пациенты')}</h1>
          <p className="page-subtitle">{titleCount}</p>
        </div>
        {(user?.role === 'doctor' || user?.role === 'admin') && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={openFromUserModal}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {t('patients.fromUsers', 'Из пользователей')}
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
              {t('patients.newPatient', 'Добавить пациента')}
            </button>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input className="input" placeholder={t('patients.searchPlaceholder', 'Поиск по ФИО...')} value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>
      </div>

      {loading ? <div className="loading-spinner" /> : patients.length === 0 ? (
        <div className="card empty-state"><h3>{t('patients.emptyTitle', 'Нет пациентов')}</h3><p>{t('patients.emptySubtitle', 'Добавьте первого пациента')}</p></div>
      ) : (
        <div className="card table-wrapper">
          <table>
            <thead>
              <tr><th>{t('patients.tableName', 'ФИО')}</th><th>{t('patients.tableBirthDate', 'Дата рождения')}</th><th>{t('patients.tableOrganization', 'Организация')}</th><th>{t('patients.tableActions', 'Действия')}</th></tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.last_name} {p.first_name} {p.middle_name || ''}</td>
                  <td>{p.birth_date || '—'}</td>
                  <td>{orgs.find(o => o.id === p.organization)?.name || p.organization || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(user?.role === 'doctor' || user?.role === 'admin') && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--primary)' }}
                          onClick={() => openSchedule(p)}
                          title={t('patients.addToAppointment', 'Записать на приём')}
                        >
                          {t('patients.appointmentAction', '📅 Записать')}
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => loadHistory(p.id)}>{t('patients.history', 'История')}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)' }}>{t('patients.delete', 'Удалить')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>{t('patients.createTitle', 'Новый пациент')}</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div className="auth-error">{error}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">{t('profile.lastName', 'Фамилия')} *</label>
                    <input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('profile.firstName', 'Имя')} *</label>
                    <input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">{t('profile.middleName', 'Отчество')}</label>
                  <input className="input" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('patients.birthDate', 'Дата рождения *')}</label>
                  <input className="input" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('patients.organization', 'Организация *')}</label>
                  <select className="input" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} required>
                    <option value="">{t('appointments.choose', 'Выберите...')}</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowCreate(false)}>{t('common.cancel', 'Отмена')}</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? t('patients.createLoading', 'Создание...') : t('common.create', 'Создать')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* From-user modal */}
      {showFromUser && (
        <div className="modal-overlay" onClick={() => setShowFromUser(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('patients.fromUserTitle', 'Добавить пациента из пользователей')}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowFromUser(false)}>✕</button>
            </div>
            <form onSubmit={handleFromUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {fromUserError && <div className="auth-error">{fromUserError}</div>}
                <div className="input-group">
                  <label className="input-label">{t('patients.chooseDoctorPatient', 'Выберите пользователя с ролью «Пациент» *')}</label>
                  {patientUsersLoading ? (
                    <div className="loading-spinner" style={{ margin: '8px 0' }} />
                  ) : patientUsers.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {t('patients.noUsersWithoutProfile', 'Нет пользователей с ролью «Пациент» без профиля')}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                      {patientUsers.map((u) => (
                        <label
                          key={u.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            border: selectedUser?.id === u.id
                              ? '2px solid var(--primary)'
                              : '1px solid var(--border)',
                            background: selectedUser?.id === u.id ? 'var(--primary-light, #eef2ff)' : 'transparent',
                          }}
                        >
                          <input
                            type="radio"
                            name="patient_user"
                            value={u.id}
                            checked={selectedUser?.id === u.id}
                            onChange={() => setSelectedUser(u)}
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 14 }}>
                              {u.last_name} {u.first_name} {u.middle_name || ''}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              {u.username} · {u.email}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('patients.birthDate', 'Дата рождения *')}</label>
                  <input
                    className="input"
                    type="date"
                    value={fromUserForm.birth_date}
                    onChange={(e) => setFromUserForm({ ...fromUserForm, birth_date: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('patients.organization', 'Организация')}</label>
                  <select
                    className="input"
                    value={fromUserForm.organization}
                    onChange={(e) => setFromUserForm({ ...fromUserForm, organization: e.target.value })}
                  >
                    <option value="">{t('patients.organizationDefault', 'Организация врача (по умолчанию)')}</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowFromUser(false)}>{t('common.cancel', 'Отмена')}</button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={fromUserSaving || !selectedUser || !fromUserForm.birth_date}
                >
                  {fromUserSaving ? t('patients.addLoading', 'Добавление...') : t('common.add', 'Добавить')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule appointment modal */}
      {showSchedule && (
        <div className="modal-overlay" onClick={() => setShowSchedule(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('patients.scheduleTitle', 'Записать на приём')}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowSchedule(null)}>✕</button>
            </div>
            <form onSubmit={handleSchedule}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {scheduleError && <div className="auth-error">{scheduleError}</div>}
                {scheduleSuccess && (
                  <div style={{ background: 'var(--success-bg, #f0fdf4)', color: 'var(--success, #16a34a)', padding: '10px 14px', borderRadius: 8, fontWeight: 500 }}>
                    {t('patients.scheduleSuccess', '✓ Приём успешно записан!')}
                  </div>
                )}
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary, #f8fafc)', borderRadius: 8, fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{t('patients.patientLabel', 'Пациент:')}</span>{' '}
                  {showSchedule.last_name} {showSchedule.first_name} {showSchedule.middle_name || ''}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">{t('appointments.date', 'Дата *')}</label>
                    <input
                      className="input"
                      type="date"
                      value={scheduleForm.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('appointments.time', 'Время *')}</label>
                    <input
                      className="input"
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">{t('patients.reason', 'Причина визита')}</label>
                  <input
                    className="input"
                    placeholder={t('patients.reasonPlaceholder', 'Например: первичный осмотр, жалобы на головные боли...')}
                    value={scheduleForm.reason}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, reason: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('patients.notes', 'Заметки')}</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowSchedule(null)}>{t('common.cancel', 'Отмена')}</button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={scheduleSaving || !scheduleForm.date || !scheduleForm.time || scheduleSuccess}
                >
                  {scheduleSaving ? t('patients.scheduleLoading', 'Запись...') : t('patients.addToAppointment', '📅 Записать на приём')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('patients.historyTitle', 'История болезни{{name}}', { name: history ? `: ${history.patient_name}` : '' })}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowHistory(null)}>✕</button>
            </div>
            <div className="modal-body">
              {historyLoading && <div className="loading-spinner" />}
              {historyError && (
                <div className="auth-error" style={{ marginBottom: 12 }}>{historyError}</div>
              )}
              {history && (
                <>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                    {t('patients.historyBirthDate', 'Дата рождения')}: {history.birth_date || t('common.none', '—')} · {t('patients.historyTotalConsultations', 'Всего консультаций')}: {history.total_consultations}
                  </p>
                  {history.consultations?.length === 0 ? (
                    <div className="empty-state"><p>{t('patients.historyNoConsultations', 'Нет консультаций')}</p></div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {history.consultations?.map((c) => (
                        <div key={c.id} className="card" style={{ padding: 12, cursor: 'pointer' }} onClick={() => { setShowHistory(null); window.location.href = `/consultations/${c.id}`; }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 500 }}>{formatDate(c.created_at)}</div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.doctor_name} · {c.diagnosis || t('patients.diagnosisEmpty', 'Без диагноза')}</div>
                            </div>
                            <span className={`badge ${c.status === 'ready' ? 'badge-success' : 'badge-neutral'}`}>{c.has_pdf ? t('patients.historyPdf', '📄 PDF') : c.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
