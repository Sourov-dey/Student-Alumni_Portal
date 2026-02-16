import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import http from '../api/http';

// Safe defaults so app won't crash if provider is not mounted
const defaultValue = {
  notifications: [],
  setNotifications: () => { },
  markAsRead: () => { },
  clearAll: () => { },
  refreshNotifications: () => { },
};

const NotificationContext = createContext(defaultValue);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const intervalRef = useRef(null);

  // Fetch notifications from the backend
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await http.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Initial fetch
    refreshNotifications();

    // Poll every 30 seconds for new notifications
    intervalRef.current = setInterval(refreshNotifications, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, refreshNotifications]);

  const markAsRead = async (id) => {
    try {
      await http.patch(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, markAsRead, clearAll, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
