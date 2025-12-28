import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

// Safe defaults so app won't crash if provider is not mounted
const defaultValue = {
  notifications: [],
  setNotifications: () => {},
  markAsRead: () => {},
  clearAll: () => {},
};

const NotificationContext = createContext(defaultValue);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('au_notifications') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      localStorage.removeItem('au_notifications');
      return;
    }
    // If you add a server API later, fetch here.
    // Example: http.get('/api/notifications').then(res => setNotifications(res.data.items));
  }, [user]);

  const markAsRead = (id) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('au_notifications', JSON.stringify(next));
      return next;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('au_notifications');
  };

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
