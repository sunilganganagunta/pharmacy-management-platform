import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/unread-count');
      if (res?.data) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 45000); // refresh every 45s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        unreadCount,
        refreshUnreadCount: fetchUnreadCount,
      }}
    >
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all transform duration-300 translate-y-0 ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-800'
                : toast.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800'
                : 'bg-brand-50 text-brand-900 border-brand-300 dark:bg-slate-900 dark:text-brand-100 dark:border-slate-800'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

