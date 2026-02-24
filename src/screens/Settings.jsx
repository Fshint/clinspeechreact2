import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/apiClient';
import '../css/Settings.css';

export default function SettingsScreen() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const handlePasswordChange = async () => {
        setPwError('');
        setPwSuccess('');
        if (pwForm.new_password.length < 6) {
            setPwError('Пароль должен быть не менее 6 символов');
            return;
        }
        if (pwForm.new_password !== pwForm.confirm) {
            setPwError('Пароли не совпадают');
            return;
        }
        setPwSaving(true);
        try {
            await authAPI.changePassword(pwForm.old_password, pwForm.new_password);
            setPwSuccess('Пароль успешно изменён!');
            setPwForm({ old_password: '', new_password: '', confirm: '' });
            setTimeout(() => setShowPasswordModal(false), 1500);
        } catch (err) {
            const msg = err.response?.data?.old_password?.[0]
                || err.response?.data?.detail
                || err.response?.data?.error
                || 'Ошибка смены пароля';
            setPwError(msg);
        } finally {
            setPwSaving(false);
        }
    };

    const initials = user
        ? `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase() || '?'
        : '?';

    const roleLabels = { admin: 'Администратор', doctor: 'Врач', patient: 'Пациент' };

    return (
        <div className="settings-container">
            <div className="safe-area">
                <div className="header">
                    <button className="backButton" onClick={() => navigate(-1)}>
                        <IoChevronBack size={28} color="#000" />
                    </button>
                    <h1 className="headerTitle">Настройки</h1>
                    <div style={{ width: 36 }} />
                </div>

                <div className="content">
                    {user && (
                        <div className="profileCard">
                            <div className="profileAvatar">{initials}</div>
                            <p className="profileName">{user.full_name || user.username}</p>
                            <p className="profileEmail">{user.email}</p>
                            <p className="profileRole">{roleLabels[user.role] || user.role}</p>
                        </div>
                    )}

                    <div className="menuGroup">
                        <button className="menuItem" onClick={() => navigate('/main/profile')}>
                            <span className="menuItemIcon">👤</span>
                            <span className="menuItemText">Редактировать профиль</span>
                            <IoChevronForward className="menuItemArrow" />
                        </button>
                        <button className="menuItem" onClick={() => {
                            setPwError(''); setPwSuccess('');
                            setPwForm({ old_password: '', new_password: '', confirm: '' });
                            setShowPasswordModal(true);
                        }}>
                            <span className="menuItemIcon">🔒</span>
                            <span className="menuItemText">Сменить пароль</span>
                            <IoChevronForward className="menuItemArrow" />
                        </button>
                        <button className="menuItem" onClick={() => navigate('/notifications')}>
                            <span className="menuItemIcon">🔔</span>
                            <span className="menuItemText">Уведомления</span>
                            <IoChevronForward className="menuItemArrow" />
                        </button>
                    </div>

                    <div className="menuGroup">
                        <button className="menuItem" onClick={() => navigate('/main/archive')}>
                            <span className="menuItemIcon">📋</span>
                            <span className="menuItemText">Архив отчётов</span>
                            <IoChevronForward className="menuItemArrow" />
                        </button>
                        <button className="menuItem" onClick={() => navigate('/main/patients')}>
                            <span className="menuItemIcon">👥</span>
                            <span className="menuItemText">Пациенты</span>
                            <IoChevronForward className="menuItemArrow" />
                        </button>
                        <button className="menuItem" onClick={() => setShowAboutModal(true)}>
                            <span className="menuItemIcon">ℹ️</span>
                            <span className="menuItemText">О приложении</span>
                            <IoChevronForward className="menuItemArrow" />
                        </button>
                    </div>

                    <button className="logoutButton" onClick={handleLogout}>
                        Выйти из аккаунта
                    </button>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="modalOverlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modalContent" onClick={e => e.stopPropagation()}>
                        <h3 className="modalTitle">Сменить пароль</h3>

                        <input
                            className="modalInput"
                            type="password"
                            placeholder="Текущий пароль"
                            value={pwForm.old_password}
                            onChange={e => setPwForm({ ...pwForm, old_password: e.target.value })}
                        />
                        <input
                            className="modalInput"
                            type="password"
                            placeholder="Новый пароль (мин. 6 символов)"
                            value={pwForm.new_password}
                            onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                        />
                        <input
                            className="modalInput"
                            type="password"
                            placeholder="Подтвердите новый пароль"
                            value={pwForm.confirm}
                            onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                        />

                        {pwError && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{pwError}</p>}
                        {pwSuccess && <p style={{ color: 'var(--success)', fontSize: 14, marginBottom: 12 }}>✅ {pwSuccess}</p>}

                        <div className="modalActions">
                            <button className="modalBtnSecondary" onClick={() => setShowPasswordModal(false)}>
                                Отмена
                            </button>
                            <button
                                className="modalBtnPrimary"
                                onClick={handlePasswordChange}
                                disabled={pwSaving}
                            >
                                {pwSaving ? 'Сохранение...' : 'Сменить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* About Modal */}
            {showAboutModal && (
                <div className="modalOverlay" onClick={() => setShowAboutModal(false)}>
                    <div className="modalContent" onClick={e => e.stopPropagation()}>
                        <h3 className="modalTitle">О приложении</h3>
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <p style={{ fontSize: 32, marginBottom: 8 }}>🩺</p>
                            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>ClinSpeech</p>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Интеллектуальная система преобразования медицинской речи
                                в структурированные протоколы и отчёты.
                            </p>
                            <p style={{ fontSize: 13, color: '#999', marginTop: 16 }}>Версия 1.0.0</p>
                            <p style={{ fontSize: 13, color: '#999' }}>© 2024 ClinSpeech</p>
                        </div>
                        <div className="modalActions" style={{ marginTop: 16 }}>
                            <button className="modalBtnPrimary" onClick={() => setShowAboutModal(false)}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
