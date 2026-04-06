import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../api/apiClient';
import { useLocale } from '../context/LocaleContext';

export default function NotificationsPage() {
  const { t, formatDateTime } = useLocale();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(Array.isArray(data) ? data : (data?.results || []));
    } catch {} finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try { await notificationsAPI.markRead(id); loadNotifications(); } catch {}
  };

  const handleMarkAllRead = async () => {
    try { await notificationsAPI.markAllRead(); loadNotifications(); } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const typeIcon = (type) => {
    switch (type) {
      case 'report_ready': return '✅';
      case 'appointment_reminder': return '📅';
      case 'consultation_shared': return '🔗';
      case 'error': return '❌';
      default: return '🔔';
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('notifications.title', 'Уведомления')}</h1>
          <p className="page-subtitle">{unreadCount > 0 ? t('notifications.unreadCount', '{{count}} непрочитанных', { count: unreadCount }) : t('notifications.allRead', 'Все прочитаны')}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            {t('notifications.markAllRead', 'Прочитать все')}
          </button>
        )}
      </div>

      {loading ? <div className="loading-spinner" /> : notifications.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <h3>{t('notifications.emptyTitle', 'Нет уведомлений')}</h3>
          <p>{t('notifications.emptySubtitle', 'Уведомления появятся здесь')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notifications.map(n => (
            <div key={n.id} className="card" style={{
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              background: n.is_read ? 'var(--card-bg)' : 'rgba(99,102,241,0.04)',
              borderLeft: n.is_read ? 'none' : '3px solid var(--primary)',
              cursor: n.is_read ? 'default' : 'pointer',
              transition: 'all .2s'
            }} onClick={() => !n.is_read && handleMarkRead(n.id)}>
              <div style={{ fontSize: 22 }}>{typeIcon(n.notification_type || n.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.is_read ? 400 : 600, fontSize: 14 }}>{n.title || n.message}</div>
                {n.message && n.title && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</div>}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {formatDateTime(n.created_at)}
                </div>
              </div>
              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
