import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { HeartPulse, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide your username or email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(username.trim(), password);
      addToast('Welcome back to MediCore!', 'success');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userType) => {
    if (userType === 'ADMIN') {
      setUsername('admin@medicore.com');
      setPassword('Admin@123');
    } else {
      setUsername('pharmacist@medicore.com');
      setPassword('Pharmacist@123');
    }
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Left side: Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-950 to-slate-950 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.15),transparent_50%)]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
            <HeartPulse className="h-7 w-7" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight">
              Medi<span className="text-brand-400">Core</span>
            </span>
            <p className="text-xs text-brand-200">Smart Pharmacy Management. Simplified.</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md my-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ALGiONS AI LABS Enterprise Suite</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Intelligent Pharmacy & Clinical Stock Automation.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Engineered with Spring Boot 3, Java 21, and PostgreSQL. Real-time POS checkout, batch expiry alerts, automated supplier PO reconciliation, and AWS cloud deployment.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <div className="text-2xl font-bold text-brand-400">100%</div>
              <div className="text-xs text-slate-400">Real Database Records</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-400">&lt; 50ms</div>
              <div className="text-xs text-slate-400">POS Billing Latency</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          DevOps & Cloud Internship Project • ALGiONS AI LABS
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile brand header */}
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <HeartPulse className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Medi<span className="text-brand-600">Core</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Sign in to MediCore
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Access your pharmacy dashboard, inventory, and POS terminal.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Quick Demo Login Credentials Bar */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <span>One-Click Demo Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-2.5 text-left text-xs hover:border-brand-500 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-500 dark:hover:bg-slate-800/80 transition"
              >
                <span className="font-semibold text-slate-900 dark:text-white">Admin Account</span>
                <span className="text-[10px] text-slate-400">admin@medicore.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('PHARMACIST')}
                className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-2.5 text-left text-xs hover:border-brand-500 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-500 dark:hover:bg-slate-800/80 transition"
              >
                <span className="font-semibold text-slate-900 dark:text-white">Pharmacist Account</span>
                <span className="text-[10px] text-slate-400">pharmacist@medicore.com</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username or Work Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@medicore.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 transition"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-400">
            MediCore Cloud Platform • Version 1.0.0 LTS • PostgreSQL + Spring Boot 3
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

