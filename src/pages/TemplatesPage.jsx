import React, { useState, useEffect } from 'react';
import { templatesAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', template_data: '', is_public: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await templatesAPI.getAll();
      setTemplates(Array.isArray(data) ? data : (data?.results || []));
    } catch {} finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', template_data: '', is_public: false });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setForm({ name: t.name, template_data: t.template_data || '', is_public: t.is_public || false });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editId) {
        await templatesAPI.update(editId, form);
      } else {
        await templatesAPI.create(form);
      }
      setShowModal(false);
      loadTemplates();
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join('; ') : 'Ошибка');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить шаблон?')) return;
    try { await templatesAPI.delete(id); loadTemplates(); } catch { alert('Ошибка удаления'); }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">Шаблоны отчётов</h1><p className="page-subtitle">{templates.length} шаблонов</p></div>
        {(user?.role === 'doctor' || user?.role === 'admin') && (
          <button className="btn btn-primary" onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Новый шаблон
          </button>
        )}
      </div>

      {loading ? <div className="loading-spinner" /> : templates.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3>Нет шаблонов</h3>
          <p>Создайте шаблон для автоматического форматирования отчётов</p>
        </div>
      ) : (
        <div className="grid-3">
          {templates.map(t => (
            <div key={t.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600 }}>{t.name}</h4>
                {t.is_public && <span className="badge badge-info">Публичный</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'hidden' }}>
                {t.template_data || 'Нет содержимого'}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>Изменить</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(t.id)} style={{ color: 'var(--danger)' }}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editId ? 'Редактирование' : 'Новый шаблон'}</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div className="auth-error">{error}</div>}
                <div className="input-group">
                  <label className="input-label">Название *</label>
                  <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Содержимое шаблона *</label>
                  <textarea className="input" value={form.template_data} onChange={e => setForm({ ...form, template_data: e.target.value })} rows={10} style={{ fontFamily: 'monospace', fontSize: 13 }} required />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} />
                  Публичный шаблон
                </label>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>Отмена</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : (editId ? 'Сохранить' : 'Создать')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
