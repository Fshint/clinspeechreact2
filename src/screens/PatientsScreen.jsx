import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoCreateOutline, IoTrashOutline, IoSearchOutline } from 'react-icons/io5';
import { patientsAPI } from '../api/apiClient';
import '../css/PatientsScreen.css';

export default function PatientsScreen() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [form, setForm] = useState({ last_name: '', first_name: '', middle_name: '', birth_date: '', iin: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadPatients(); }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const { data } = await patientsAPI.getAll();
            setPatients(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
            console.error('Load patients error', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = patients.filter(p => {
        const full = `${p.last_name} ${p.first_name} ${p.middle_name || ''} ${p.iin || ''}`.toLowerCase();
        return full.includes(search.toLowerCase());
    });

    const openCreate = () => {
        setEditingPatient(null);
        setForm({ last_name: '', first_name: '', middle_name: '', birth_date: '', iin: '' });
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditingPatient(p);
        setForm({
            last_name: p.last_name || '',
            first_name: p.first_name || '',
            middle_name: p.middle_name || '',
            birth_date: p.birth_date || '',
            iin: p.iin || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.last_name.trim() || !form.first_name.trim()) return;
        setSaving(true);
        try {
            if (editingPatient) {
                await patientsAPI.update(editingPatient.id, form);
            } else {
                await patientsAPI.create(form);
            }
            setShowModal(false);
            loadPatients();
        } catch (err) {
            const msg = err.response?.data
                ? (typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data)
                : 'Ошибка сохранения';
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить пациента?')) return;
        try {
            await patientsAPI.delete(id);
            loadPatients();
        } catch (err) {
            alert('Ошибка удаления');
        }
    };

    const getInitials = (p) =>
        `${(p.first_name || '')[0] || ''}${(p.last_name || '')[0] || ''}`.toUpperCase() || '?';

    return (
        <div className="patients-container">
            <div className="patients-header">
                <h2 className="patients-title">Пациенты</h2>
                <button className="addPatientBtn" onClick={openCreate}>
                    <IoAddOutline size={22} />
                </button>
            </div>

            <input
                type="text"
                className="searchInput"
                placeholder="🔍 Поиск по ФИО или ИИН..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            {loading && <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>Загрузка...</p>}

            {!loading && filtered.length === 0 && (
                <div className="emptyState">
                    <div className="emptyStateIcon">👥</div>
                    <p className="emptyStateText">
                        {patients.length === 0 ? 'Нет пациентов' : 'Ничего не найдено'}
                    </p>
                    <p className="emptyStateHint">
                        {patients.length === 0 ? 'Нажмите + чтобы добавить первого пациента' : 'Попробуйте другой запрос'}
                    </p>
                </div>
            )}

            {filtered.map(p => (
                <div key={p.id} className="patientItem">
                    <div className="patientAvatar">{getInitials(p)}</div>
                    <div className="patientInfo">
                        <p className="patientName">{p.last_name} {p.first_name} {p.middle_name || ''}</p>
                        <p className="patientMeta">
                            {p.birth_date ? `📅 ${p.birth_date}` : ''}
                            {p.iin ? ` · ИИН: ${p.iin}` : ''}
                        </p>
                    </div>
                    <div className="patientActions">
                        <button className="patientActionBtn" onClick={() => openEdit(p)}>
                            <IoCreateOutline size={20} color="var(--primary)" />
                        </button>
                        <button className="patientActionBtn" onClick={() => handleDelete(p.id)}>
                            <IoTrashOutline size={20} color="var(--danger)" />
                        </button>
                    </div>
                </div>
            ))}

            {/* Modal: Create/Edit */}
            {showModal && (
                <div className="modalOverlay" onClick={() => setShowModal(false)}>
                    <div className="modalContent" onClick={e => e.stopPropagation()}>
                        <h3 className="modalTitle">
                            {editingPatient ? 'Редактировать пациента' : 'Новый пациент'}
                        </h3>

                        <input
                            className="modalInput"
                            placeholder="Фамилия *"
                            value={form.last_name}
                            onChange={e => setForm({ ...form, last_name: e.target.value })}
                        />
                        <input
                            className="modalInput"
                            placeholder="Имя *"
                            value={form.first_name}
                            onChange={e => setForm({ ...form, first_name: e.target.value })}
                        />
                        <input
                            className="modalInput"
                            placeholder="Отчество"
                            value={form.middle_name}
                            onChange={e => setForm({ ...form, middle_name: e.target.value })}
                        />
                        <input
                            className="modalInput"
                            type="date"
                            placeholder="Дата рождения"
                            value={form.birth_date}
                            onChange={e => setForm({ ...form, birth_date: e.target.value })}
                        />
                        <input
                            className="modalInput"
                            placeholder="ИИН"
                            value={form.iin}
                            onChange={e => setForm({ ...form, iin: e.target.value })}
                        />

                        <div className="modalActions">
                            <button className="modalBtnSecondary" onClick={() => setShowModal(false)}>
                                Отмена
                            </button>
                            <button
                                className="modalBtnPrimary"
                                onClick={handleSave}
                                disabled={saving || !form.last_name.trim() || !form.first_name.trim()}
                            >
                                {saving ? 'Сохранение...' : (editingPatient ? 'Сохранить' : 'Создать')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
