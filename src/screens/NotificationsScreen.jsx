import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack, IoCheckmarkDoneOutline } from 'react-icons/io5';
import { notificationsAPI } from '../api/apiClient';
import '../css/Settings.css';

export default function NotificationsScreen() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const { data } = await notificationsAPI.getAll();
            setNotifications(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationsAPI.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) { console.error(err); }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) { console.error(err); }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="settings-container">
            <div className="safe-area">
                <div className="header">
                    <button className="backButton" onClick={() => navigate(-1)}>
                        <IoChevronBack size={28} color="#000" />
                    </button>
                    <h1 className="headerTitle">Уведомления</h1>
                    {unreadCount > 0 ? (
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                            onClick={handleMarkAllRead} title="Прочитать все">
                            <IoCheckmarkDoneOutline size={24} color="var(--primary)" />
                        </button>
                    ) : <div style={{ width: 36 }} />}
                </div>

                <div className="content" style={{ display: 'block' }}>
                    {loading && <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>Загрузка...</p>}

                    {!loading && notifications.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                            <p style={{ fontSize: 40, marginBottom: 12 }}>🔔</p>
                            <p>Нет уведомлений</p>
                        </div>
                    )}

                    {notifications.map(n => (
                        <div key={n.id}
                            className="menuGroup"
                            style={{
                                marginBottom: 10,
                                opacity: n.is_read ? 0.6 : 1,
                                borderLeft: n.is_read ? 'none' : '3px solid var(--primary)',
                                cursor: n.is_read ? 'default' : 'pointer',
                            }}
                            onClick={() => !n.is_read && handleMarkRead(n.id)}
                        >
                            <div style={{ padding: '14px 16px' }}>
                                <p style={{ fontSize: 14, fontWeight: n.is_read ? 400 : 600, color: 'var(--text)', marginBottom: 4 }}>
                                    {n.title || n.message || 'Уведомление'}
                                </p>
                                {n.message && n.title && (
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{n.message}</p>
                                )}
                                <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                                    {new Date(n.created_at).toLocaleString('ru-RU')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
