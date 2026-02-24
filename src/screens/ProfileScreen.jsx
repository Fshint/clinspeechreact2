import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api/apiClient';
import '../css/ProfileScreen.css';

export default function ProfileScreen() {
    const { user, fetchUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                middle_name: user.middle_name || '',
                email: user.email || '',
                phone: user.phone || '',
                specialization: user.specialization || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await userAPI.updateMe(form);
            await fetchUser();
            setEditing(false);
        } catch (err) {
            const msg = err.response?.data
                ? JSON.stringify(err.response.data) : 'Ошибка сохранения';
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    const roleLabels = { admin: 'Администратор', doctor: 'Врач', patient: 'Пациент' };

    if (!user) return <div className="profile-container"><p style={{ textAlign: 'center', padding: 40 }}>Загрузка...</p></div>;

    const initials = `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase() || '?';

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h2 className="profile-headerTitle">Профиль</h2>
            </div>

            <div className="profileCardLarge">
                <div className="profileAvatarLg">{initials}</div>
                <p className="profileNameLg">{user.full_name || user.username}</p>
                <p className="profileEmailLg">{user.email}</p>
                <span className="profileRoleBadge">{roleLabels[user.role] || user.role}</span>
            </div>

            {!editing ? (
                <>
                    <div className="profileFieldGroup">
                        <div className="profileField">
                            <span className="profileFieldLabel">Фамилия</span>
                            <span className="profileFieldValue">{user.last_name || '—'}</span>
                        </div>
                        <div className="profileField">
                            <span className="profileFieldLabel">Имя</span>
                            <span className="profileFieldValue">{user.first_name || '—'}</span>
                        </div>
                        <div className="profileField">
                            <span className="profileFieldLabel">Отчество</span>
                            <span className="profileFieldValue">{user.middle_name || '—'}</span>
                        </div>
                        <div className="profileField">
                            <span className="profileFieldLabel">Телефон</span>
                            <span className="profileFieldValue">{user.phone || '—'}</span>
                        </div>
                        <div className="profileField">
                            <span className="profileFieldLabel">Специализация</span>
                            <span className="profileFieldValue">{user.specialization || '—'}</span>
                        </div>
                        <div className="profileField">
                            <span className="profileFieldLabel">Организация</span>
                            <span className="profileFieldValue">{user.organization_name || '—'}</span>
                        </div>
                    </div>

                    <button className="profileEditBtn" onClick={() => setEditing(true)}>
                        ✏️ Редактировать профиль
                    </button>
                </>
            ) : (
                <>
                    <div className="profileFieldGroup" style={{ padding: '16px 18px' }}>
                        <label className="profileFieldLabel" style={{ display: 'block', marginBottom: 6 }}>Фамилия</label>
                        <input className="modalInput" value={form.last_name}
                            onChange={e => setForm({ ...form, last_name: e.target.value })} />

                        <label className="profileFieldLabel" style={{ display: 'block', marginBottom: 6 }}>Имя</label>
                        <input className="modalInput" value={form.first_name}
                            onChange={e => setForm({ ...form, first_name: e.target.value })} />

                        <label className="profileFieldLabel" style={{ display: 'block', marginBottom: 6 }}>Отчество</label>
                        <input className="modalInput" value={form.middle_name}
                            onChange={e => setForm({ ...form, middle_name: e.target.value })} />

                        <label className="profileFieldLabel" style={{ display: 'block', marginBottom: 6 }}>Телефон</label>
                        <input className="modalInput" value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })} />

                        <label className="profileFieldLabel" style={{ display: 'block', marginBottom: 6 }}>Специализация</label>
                        <input className="modalInput" value={form.specialization}
                            onChange={e => setForm({ ...form, specialization: e.target.value })} />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="modalBtnSecondary" style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', background: '#f0f2f5' }}
                            onClick={() => setEditing(false)}>Отмена</button>
                        <button className="profileEditBtn" style={{ flex: 1 }}
                            onClick={handleSave} disabled={saving}>
                            {saving ? 'Сохранение...' : '💾 Сохранить'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
