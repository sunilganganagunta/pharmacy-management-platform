import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useNotification } from '../context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  ShoppingCart,
  CheckCheck,
  RefreshCw
} from 'lucide-react';

const Notifications = () => {
  const { addToast, refreshUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?size=50');
      if (res?.data) {
        setNotifications(res.data.content || []);
      }
      refreshUnreadCount();
    } catch (err) {
      addToast(err.message || 'Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      refreshUnreadCount();
    } catch (err) {
      addToast('Failed to update notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshUnreadCount();
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      addToast('Failed to mark all as read', 'error');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LOW_STOCK':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'EXPIRY_WARNING':
      case 'EXPIRED':
        return <Clock className="h-5 w-5 text-rose-500" />;
      case 'PURCHASE_ORDER':
        return <Package className="h-5 w-5 text-brand-500" />;
      case 'SALE_COMPLETED':
        return <ShoppingCart className="h-5 w-5 text-emerald-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              MediCore Alert Center
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time critical inventory thresholds, expiration warnings, and POS sales logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <CheckCheck className="h-4 w-4 text-brand-600" />
            <span>Mark All Read</span>
          </button>
          <button
            onClick={fetchNotifications}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">All Systems Clear</h3>
            <p className="text-xs mt-1">No alerts or notifications pending.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-start justify-between rounded-2xl border p-4 transition ${
                item.read
                  ? 'border-slate-200 bg-white opacity-70 dark:border-slate-800 dark:bg-slate-900'
                  : 'border-brand-200 bg-brand-50/20 shadow-sm dark:border-brand-900/40 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getNotificationIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-brand-600" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.message}
                  </p>
                  <span className="mt-2 block text-[10px] text-slate-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : 'Just now'}
                  </span>
                </div>
              </div>

              {!item.read && (
                <button
                  onClick={() => handleMarkAsRead(item.id)}
                  className="rounded-lg p-1.5 text-xs text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Mark as read"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

