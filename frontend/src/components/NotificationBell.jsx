// frontend/src/components/NotificationBell.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationBell() {
  // Handle missing provider gracefully
  let ctx;
  try {
    ctx = typeof useNotifications === "function" ? useNotifications() : null;
  } catch (_) {
    ctx = null;
  }

  const notifications = ctx?.notifications ?? [];
  const markAsRead = ctx?.markAsRead ?? (() => {});
  const clearAll = ctx?.clearAll ?? (() => {});
  const unread = notifications.filter((n) => !n.read).length;

  const [open, setOpen] = useState(false);

  // If no provider, render a minimal bell without dropdown so the app never crashes
  if (!ctx) {
    return (
      <button
        className="btn"
        aria-label="Notifications (disabled)"
        title="Notifications unavailable"
        style={{ opacity: 0.6, cursor: "default" }}
      >
        🔔
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} className="btn" aria-label="Notifications">
        🔔{" "}
        {unread > 0 && (
          <span
            style={{
              background: "#d00",
              color: "#fff",
              padding: "2px 6px",
              borderRadius: 12,
              marginLeft: 8,
              fontSize: 12,
              lineHeight: 1,
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 320,
            background: "#fff",
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            borderRadius: 8,
            zIndex: 60,
            overflow: "hidden",
            border: "1px solid #eef2f7",
          }}
        >
          <div
            style={{
              padding: 10,
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong>Notifications</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn small" onClick={clearAll}>
                Clear
              </button>
              <Link to="/notifications" onClick={() => setOpen(false)} className="btn small">
                Open
              </Link>
            </div>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto", background: "#fff" }}>
            {notifications.length === 0 && <div style={{ padding: 12 }}>No notifications</div>}

            {notifications.map((n) => (
              <div
                key={n.id || n._id}
                style={{
                  padding: 10,
                  borderBottom: "1px solid #f4f4f4",
                  background: n.read ? "#fff" : "#f8fbff",
                }}
              >
                <div style={{ fontSize: 13 }}>{n.message}</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                  {n.type} • {new Date(n.createdAt).toLocaleString()}
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button className="btn small" onClick={() => markAsRead(n.id || n._id)}>
                    Mark read
                  </button>
                  {n.conversation && (
                    <Link
                      className="btn small"
                      to={`/chat/${n.conversation._id || n.conversation}`}
                      onClick={() => setOpen(false)}
                    >
                      Open chat
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
