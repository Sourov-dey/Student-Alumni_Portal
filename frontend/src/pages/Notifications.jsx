// frontend/src/pages/Notifications.jsx — Premium Design
import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, Trash2, MessageCircle, Clock, Inbox } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markAsRead, clearAll } = useNotifications();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'message': return <MessageCircle size={16} />;
      case 'application': return <CheckCircle size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="notif-page">
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-left">
          <div className="notif-icon-wrap">
            <Bell size={22} />
          </div>
          <div>
            <h2 className="notif-title">Notifications</h2>
            <p className="notif-subtitle">
              {notifications.length === 0
                ? "You're all caught up!"
                : `${notifications.filter(n => !n.read).length} unread`}
            </p>
          </div>
        </div>
        {notifications.length > 0 && (
          <button className="notif-clear-btn" onClick={() => clearAll()}>
            <Trash2 size={14} />
            Clear All
          </button>
        )}
      </div>

      {/* List */}
      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <Inbox size={48} />
            </div>
            <h3>No notifications yet</h3>
            <p>When you receive notifications, they'll appear here.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n._id}
              className={`notif-item ${n.read ? 'read' : 'unread'}`}
            >
              <div className="notif-item-dot" />
              <div className="notif-item-icon">{getTypeIcon(n.type)}</div>
              <div className="notif-item-body">
                <p className="notif-message">{n.message}</p>
                <div className="notif-meta">
                  <span className="notif-type">{n.type}</span>
                  <span className="notif-time">
                    <Clock size={12} /> {getTimeAgo(n.createdAt)}
                  </span>
                </div>
              </div>
              <div className="notif-item-actions">
                {!n.read && (
                  <button
                    className="notif-action-btn"
                    onClick={() => markAsRead(n._id)}
                    title="Mark as read"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                {n.conversation && (
                  <Link
                    className="notif-action-btn primary"
                    to={`/chat/${n.conversation._id || n.conversation}`}
                    title="Open chat"
                  >
                    <MessageCircle size={16} />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inline styles — scoped to this page */}
      <style>{`
        .notif-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .notif-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
          border-bottom: 1px solid var(--border-light, #f1f5f9);
          margin-bottom: 1.5rem;
        }

        .notif-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .notif-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .notif-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .notif-subtitle {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 2px 0 0;
        }

        .notif-clear-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .notif-clear-btn:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #ef4444;
        }

        .notif-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          background: white;
          border: 1px solid #f1f5f9;
          transition: all 0.2s;
          position: relative;
        }

        .notif-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          border-color: #e2e8f0;
        }

        .notif-item.unread {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.04), rgba(139, 92, 246, 0.04));
          border-color: rgba(99, 102, 241, 0.15);
        }

        .notif-item-dot {
          position: absolute;
          top: 18px;
          left: 8px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: transparent;
        }

        .notif-item.unread .notif-item-dot {
          background: #6366f1;
          box-shadow: 0 0 6px rgba(99, 102, 241, 0.4);
        }

        .notif-item-icon {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
        }

        .notif-item.unread .notif-item-icon {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        .notif-item-body {
          flex: 1;
          min-width: 0;
        }

        .notif-message {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
          margin: 0 0 6px;
          line-height: 1.5;
        }

        .notif-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.75rem;
        }

        .notif-type {
          padding: 2px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #64748b;
          font-weight: 600;
          text-transform: capitalize;
        }

        .notif-time {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #94a3b8;
        }

        .notif-item-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .notif-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .notif-action-btn:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #3b82f6;
        }

        .notif-action-btn.primary {
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.2);
          color: #6366f1;
        }

        .notif-action-btn.primary:hover {
          background: rgba(99, 102, 241, 0.15);
        }

        .notif-empty {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
        }

        .notif-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
        }

        .notif-empty h3 {
          font-size: 1.25rem;
          color: #1e293b;
          margin: 0 0 0.5rem;
          font-weight: 700;
        }

        .notif-empty p {
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 0;
        }

        @media (max-width: 640px) {
          .notif-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .notif-item {
            flex-wrap: wrap;
          }

          .notif-item-actions {
            width: 100%;
            justify-content: flex-end;
            margin-top: 4px;
          }
        }
      `}</style>
    </div>
  );
}
