import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useNotification } from '../context/NotificationContext';
import { HeartPulse, Mail, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/auth/forgot-password', { email, newPassword: newPassword || 'MediCore@2026' });
      setSubmitted(true);
      addToast('Password reset instructions processed', 'success');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
            <HeartPulse className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Medi<span className="text-brand-600">Core</span>
          </span>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Password Reset Successfully</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your password has been updated. You can now log into your MediCore account with your new credentials.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-brand-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reset Account Password</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Enter your registered email address and optional new password.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@medicore.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (Optional - defaults to MediCore@2026)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-50 transition"
              >
                {loading ? 'Processing...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

