// frontend/src/pages/Notifications.jsx
import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  const { notifications, markAsRead, clearAll } = useNotifications();

  return (
    <div style={{ maxWidth: 900, margin: '20px auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Notifications</h2>
        <div>
          <button className="btn" onClick={() => clearAll()}>Clear all</button>
        </div>
      </header>

      <div style={{ marginTop: 16 }}>
        {notifications.length === 0 && <div>No notifications</div>}
        {notifications.map(n => (
          <div key={n._id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 10, background: n.read ? '#fff' : '#f8fbff' }}>
            <div>{n.message}</div>
            <div style={{ color: '#666', fontSize: 13, marginTop: 6 }}>{n.type} • {new Date(n.createdAt).toLocaleString()}</div>
            <div style={{ marginTop: 8 }}>
              {!n.read && <button className="btn small" onClick={() => markAsRead(n._id)}>Mark read</button>}
              {n.conversation && <Link className="btn small" to={`/chat/${n.conversation._id || n.conversation}`} style={{ marginLeft: 8 }}>Open chat</Link>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
