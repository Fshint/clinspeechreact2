import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { consultationsAPI, imagesAPI, feedbackAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = { created: 'badge-neutral', processing: 'badge-info', generating: 'badge-warning', ready: 'badge-success', error: 'badge-danger' };
const STATUS_LABELS = { created: 'Создано', processing: 'Обработка', generating: 'Генерация', ready: 'Готово', error: 'Ошибка' };

export default function ConsultationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('report');

  const load = useCallback(async () => {
    try {
      const { data: c } = await consultationsAPI.getById(id);
      setData(c);
      if (c.final_report) {
        try { setEditForm(JSON.parse(c.final_report)); } catch { setEditForm({}); }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Poll for status updates
  useEffect(() => {
    if (!data || !['processing', 'generating'].includes(data.status)) return;
    const interval = setInterval(async () => {
      try {
        const { data: c } = await consultationsAPI.getById(id);
        setData(c);
        if (!['processing', 'generating'].includes(c.status)) clearInterval(interval);
        if (c.final_report) try { setEditForm(JSON.parse(c.final_report)); } catch {}
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [data?.status, id]);

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      await consultationsAPI.editReport(id, editForm);
      await load();
      setEditing(false);
    } catch (err) {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { data: blob } = await consultationsAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Ошибка скачивания PDF'); }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Перегенерировать отчёт? Текущий будет сохранён в истории.')) return;
    try {
      await consultationsAPI.regenerate(id);
      await load();
    } catch (err) { alert('Ошибка перегенерации'); }
  };

  const handleStartProcessing = async () => {
    try {
      await consultationsAPI.startProcessing(id);
      await load();
    } catch (err) { alert(err.response?.data?.error || 'Ошибка запуска'); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await imagesAPI.upload(id, file);
      await load();
    } catch { alert('Ошибка загрузки снимка'); }
  };

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('Удалить снимок?')) return;
    try {
      await imagesAPI.delete(imgId);
      await load();
    } catch { alert('Ошибка удаления'); }
  };

  if (loading) return <div className="loading-spinner" />;
  if (!data) return <div className="empty-state"><h3>Консультация не найдена</h3></div>;

  let report = {};
  try { report = JSON.parse(data.final_report || '{}'); } catch {}

  const isProcessing = ['processing', 'generating'].includes(data.status);

  return (
    <div className="animate-fade">
      <button className="btn btn-ghost" onClick={() => navigate('/consultations')} style={{ marginBottom: 16 }}>
        ← Назад к списку
      </button>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-top">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Консультация #{data.id}</h1>
            <span className={`badge ${STATUS_COLORS[data.status]}`} style={{ marginTop: 8 }}>{STATUS_LABELS[data.status]}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {data.status === 'created' && (user?.role === 'doctor' || user?.role === 'admin') && (
              <button className="btn btn-success btn-sm" onClick={handleStartProcessing}>▶ Запустить обработку</button>
            )}
            {data.status === 'ready' && (
              <>
                <button className="btn btn-sm" onClick={handleDownloadPDF} style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>Скачать PDF</button>
                {(user?.role === 'doctor' || user?.role === 'admin') && (
                  <button className="btn btn-sm" onClick={handleRegenerate} style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>Перегенерировать</button>
                )}
              </>
            )}
            {data.status === 'error' && (user?.role === 'doctor' || user?.role === 'admin') && (
              <button className="btn btn-warning btn-sm" onClick={handleStartProcessing}>Повторить</button>
            )}
          </div>
        </div>
        <div className="detail-info-grid">
          <div className="detail-info-item"><label>Пациент</label><span>{data.patient_info?.last_name} {data.patient_info?.first_name}</span></div>
          <div className="detail-info-item"><label>Врач</label><span>{data.doctor_name || '—'}</span></div>
          <div className="detail-info-item"><label>Дата</label><span>{new Date(data.created_at).toLocaleDateString('ru-RU')}</span></div>
          <div className="detail-info-item"><label>Снимков</label><span>{data.images_count || 0}</span></div>
        </div>
      </div>

      {/* Processing animation */}
      {isProcessing && (
        <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 16 }}>
          <div className="loading-spinner" style={{ padding: 0, marginBottom: 16 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            {data.status === 'processing' ? 'Транскрибация аудио...' : 'Генерация ИИ-отчёта...'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Пожалуйста, подождите. Обновление происходит автоматически.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>Отчёт</button>
        <button className={`tab ${tab === 'transcription' ? 'active' : ''}`} onClick={() => setTab('transcription')}>Транскрипция</button>
        <button className={`tab ${tab === 'images' ? 'active' : ''}`} onClick={() => setTab('images')}>Снимки ({data.analysis_images?.length || 0})</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>История версий</button>
      </div>

      {/* Tab content */}
      {tab === 'report' && (
        <div>
          {editing ? (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Редактирование отчёта</h3>
              {['complaints', 'anamnesis', 'diagnosis', 'recommendations'].map((field) => (
                <div className="input-group" key={field} style={{ marginBottom: 16 }}>
                  <label className="input-label">{{ complaints: 'Жалобы', anamnesis: 'Анамнез', diagnosis: 'Диагноз', recommendations: 'Рекомендации' }[field]}</label>
                  <textarea className="input" value={editForm[field] || ''} onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })} rows={4} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleSaveReport} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Отмена</button>
              </div>
            </div>
          ) : (
            <div>
              {data.status === 'ready' && (user?.role === 'doctor' || user?.role === 'admin') && (
                <div style={{ marginBottom: 16 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Редактировать отчёт</button>
                </div>
              )}
              {[
                { key: 'complaints', title: 'Жалобы пациента', color: 'var(--primary)' },
                { key: 'anamnesis', title: 'Анамнез заболевания', color: 'var(--info)' },
                { key: 'diagnosis', title: 'Предварительный диагноз', color: 'var(--danger)' },
                { key: 'recommendations', title: 'Назначения и рекомендации', color: 'var(--success)' },
              ].map(({ key, title, color }) => (
                <div className="card report-section" key={key}>
                  <div className="report-section-title">
                    <span style={{ width: 4, height: 16, borderRadius: 2, background: color, display: 'inline-block' }} />
                    {title}
                  </div>
                  <div className="report-section-body">{report[key] || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'transcription' && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Текст транскрипции</h3>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
            {data.raw_transcription || 'Транскрипция пока отсутствует'}
          </div>
        </div>
      )}

      {tab === 'images' && (
        <div>
          {(user?.role === 'doctor' || user?.role === 'admin') && (
            <div style={{ marginBottom: 16 }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                Загрузить снимок
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              </label>
            </div>
          )}
          {data.analysis_images?.length === 0 ? (
            <div className="card empty-state"><h3>Нет снимков</h3><p>{user?.role === 'patient' ? 'Снимки отсутствуют' : 'Загрузите снимки анализов для улучшения ИИ-отчёта'}</p></div>
          ) : (
            <div className="grid-3">
              {data.analysis_images?.map((img) => (
                <div className="card" key={img.id} style={{ padding: 12, position: 'relative' }}>
                  <img src={img.image} alt={img.description || 'Снимок'} style={{ width: '100%', borderRadius: 'var(--radius)', marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{img.description || 'Без описания'}</p>
                  {(user?.role === 'doctor' || user?.role === 'admin') && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteImage(img.id)} style={{ position: 'absolute', top: 8, right: 8, color: 'var(--danger)' }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="card" style={{ padding: 0 }}>
          {data.report_versions?.length === 0 ? (
            <div className="empty-state"><h3>Нет истории версий</h3><p>История появится после первого редактирования отчёта</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Дата</th><th>Редактор</th><th>Данные</th></tr></thead>
                <tbody>
                  {data.report_versions?.map((v) => (
                    <tr key={v.id}>
                      <td>{new Date(v.created_at).toLocaleString('ru-RU')}</td>
                      <td>{v.edited_by_name || '—'}</td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => { try { const d = JSON.parse(v.report_data); alert(JSON.stringify(d, null, 2)); } catch { alert(v.report_data); } }}>Просмотр</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
