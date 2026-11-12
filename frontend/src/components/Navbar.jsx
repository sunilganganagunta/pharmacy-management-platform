import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { Sun, Moon, Bell, User, LogOut, Menu, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotification();
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex sm:items-center sm:gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online: v1.0.0</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          title="Notification Center"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-left text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white font-semibold text-xs shadow-sm">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[120px]">
                {user?.fullName || user?.username}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                <ShieldCheck className="h-3 w-3" />
                {user?.role}
              </div>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="border-b border-slate-100 px-4 py-2 dark:border-slate-800">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user?.email}</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Role: {user?.role}
                </span>
              </div>
              <Link
                to="/notifications"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Bell className="h-4 w-4" />
                Alerts & Notifications
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

