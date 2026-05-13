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
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateError, setCandidateError] = useState('');
  const [candidateSaving, setCandidateSaving] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [orgs, setOrgs] = useState([]);

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

  const loadCandidates = useCallback(async (value = '') => {
    setCandidatesLoading(true);
    setCandidateError('');
    try {
      const { data } = await patientsAPI.searchCandidates({ search: value || undefined });
      setCandidates(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || t('patients.candidatesError', 'Не удалось загрузить пациентов');
      setCandidateError(String(msg));
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!showCreate) return undefined;
    const timer = setTimeout(() => loadCandidates(candidateSearch), 250);
    return () => clearTimeout(timer);
  }, [showCreate, candidateSearch, loadCandidates]);

  const openAddPatientSearch = () => {
    setShowCreate(true);
    setCandidateSearch('');
    setCandidateError('');
    setCandidates([]);
  };

  const closeAddPatientSearch = () => {
    setShowCreate(false);
    setCandidateSearch('');
    setCandidateError('');
    setCandidates([]);
    setCandidateSaving(null);
  };

  const candidateName = (candidate) => {
    const fullName = `${candidate.last_name || ''} ${candidate.first_name || ''} ${candidate.middle_name || ''}`.trim();
    return fullName || candidate.username || candidate.email || t('patients.unknownPatient', 'Пациент');
  };

  const handleAddCandidate = async (candidate) => {
    if (candidate.status === 'other_organization') {
      window.alert(t(
        'patients.otherOrganizationAlert',
        'Пациент находится в другой организации: {{org}}',
        { org: candidate.organization_name || '—' }
      ));
      return;
    }
    if (candidate.status === 'same_organization') {
      window.alert(t('patients.sameOrganizationAlert', 'Пациент уже находится в вашей организации'));
      return;
    }
    if (!candidate.can_add) {
      window.alert(candidate.message || t('patients.cannotAddPatient', 'Пациента нельзя добавить'));
      return;
    }

    const savingKey = String(candidate.id || candidate.user_id);
    setCandidateSaving(savingKey);
    try {
      if (candidate.type === 'user_without_profile') {
        await patientsAPI.fromUser({ user_id: candidate.user_id });
      } else {
        await patientsAPI.attach(candidate.patient_id || candidate.id);
      }
      closeAddPatientSearch();
      loadPatients(search);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || t('patients.addError', 'Ошибка добавления');
      window.alert(String(msg));
    } finally {
      setCandidateSaving(null);
    }
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
            <button className="btn btn-primary" onClick={openAddPatientSearch}>
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
                          {t('patients.appointmentAction', 'Записать')}
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
        <div className="modal-overlay" onClick={closeAddPatientSearch}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('patients.addSearchTitle', 'Добавить пациента')}</h3>
              <button className="btn btn-ghost btn-icon" onClick={closeAddPatientSearch}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">{t('patients.searchByName', 'Поиск пациента по ФИО')}</label>
                <input
                  className="input"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder={t('patients.searchPlaceholder', 'Поиск по ФИО...')}
                  autoFocus
                />
              </div>
              {candidateError && <div className="auth-error">{candidateError}</div>}
              {candidatesLoading ? (
                <div className="loading-spinner" style={{ margin: '16px auto' }} />
              ) : candidates.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <h3>{t('patients.notFound', 'Пациенты не найдены')}</h3>
                  <p>{t('patients.searchHint', 'Попробуйте изменить ФИО или проверьте, зарегистрирован ли пациент')}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 430, overflowY: 'auto' }}>
                  {candidates.map((candidate) => {
                    const key = String(candidate.id || candidate.user_id);
                    const isOtherOrg = candidate.status === 'other_organization';
                    const isSameOrg = candidate.status === 'same_organization';
                    const isFree = candidate.status === 'free';
                    return (
                      <div
                        key={`${candidate.type}-${key}`}
                        className="card"
                        style={{
                          padding: 14,
                          border: `1px solid ${isOtherOrg ? 'rgba(239,68,68,.35)' : isFree ? 'rgba(46,196,182,.35)' : 'var(--border-light)'}`,
                          background: isOtherOrg ? 'rgba(254,242,242,.75)' : isFree ? 'rgba(240,253,250,.75)' : 'rgba(255,255,255,.9)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                              {candidateName(candidate)}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                              {candidate.email || candidate.username || '—'}
                            </div>
                            <div style={{ fontSize: 13, color: isOtherOrg ? 'var(--danger)' : 'var(--text-secondary)', marginTop: 6 }}>
                              {isOtherOrg
                                ? t('patients.otherOrganizationAlert', 'Пациент находится в другой организации: {{org}}', { org: candidate.organization_name || '—' })
                                : isSameOrg
                                ? t('patients.sameOrganizationAlert', 'Пациент уже находится в вашей организации')
                                : t('patients.freePatient', 'Свободный пациент, можно добавить')}
                            </div>
                          </div>
                          <button
                            className={`btn ${isFree ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            disabled={candidateSaving === key}
                            onClick={() => handleAddCandidate(candidate)}
                          >
                            {candidateSaving === key
                              ? t('patients.adding', 'Добавление...')
                              : isFree
                              ? t('common.add', 'Добавить')
                              : t('common.view', 'Проверить')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" type="button" onClick={closeAddPatientSearch}>{t('common.cancel', 'Отмена')}</button>
            </div>
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
