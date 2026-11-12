import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import AlertBadge from '../components/AlertBadge';
import {
  Pill,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  ArrowUpRight,
  ShoppingCart,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#0284c7', '#0d9488', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/dashboard/stats');
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              MediCore Operations Hub
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <Sparkles className="h-3 w-3" />
              Live SaaS
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time pharmacy metrics, stock valuation, automated expiry monitoring, and POS performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 transition"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Open POS Checkout</span>
          </Link>
        </div>
      </div>

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Medicines"
          value={stats?.totalMedicines || 0}
          subtitle="Active catalogue records"
          icon={Pill}
          color="blue"
        />
        <StatCard
          title="Total Inventory Value"
          value={formatCurrency(stats?.totalInventoryValue)}
          subtitle="At wholesale purchase cost"
          icon={DollarSign}
          color="teal"
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats?.todaySales)}
          subtitle="Gross retail volume today"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue)}
          subtitle="Current calendar month"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Active Suppliers"
          value={stats?.totalSuppliers || 0}
          subtitle="Verified pharmaceutical partners"
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockCount || 0}
          subtitle="At or below minimum threshold"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Expired Medicines"
          value={stats?.expiredCount || 0}
          subtitle="Auto-quarantined from POS"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Expiring Soon (<30d)"
          value={stats?.expiringSoonCount || 0}
          subtitle="Requires inventory clearance"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Sales Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Sales Performance</h3>
              <p className="text-xs text-slate-400">Revenue per day over the last 7 calendar days</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Live Trend</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.weeklySalesChart || []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">6-Month Revenue Trend</h3>
              <p className="text-xs text-slate-400">Completed order revenues by calendar month</p>
            </div>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">Audited</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.monthlyRevenueChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Distribution and Top Selling */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Stock by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Inventory units distribution across specialties</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.categoryDistributionChart || []}
                  dataKey="totalStock"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {(stats?.categoryDistributionChart || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} units`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
            {(stats?.categoryDistributionChart || []).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="truncate max-w-[130px]">{cat.name}</span>
                </span>
                <span className="font-semibold">{cat.totalStock} units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top-Selling Medicines */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top-Selling Medicines</h3>
              <p className="text-xs text-slate-400">Highest volume medicines sold across verified POS invoices</p>
            </div>
            <Link to="/reports" className="text-xs font-semibold text-brand-600 hover:underline">
              Detailed Reports →
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.topSellingMedicinesChart || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="medicineName" type="category" stroke="#64748b" fontSize={11} width={130} />
                <Tooltip
                  formatter={(val, name) => [name === 'quantitySold' ? `${val} units` : formatCurrency(val), name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="quantitySold" name="Quantity Sold" fill="#0284c7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Stock Alerts and Recent Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Critical Alerts Center */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Critical Stock & Expiry Alerts</h3>
            </div>
            <Link to="/medicines?lowStock=true" className="text-xs font-semibold text-brand-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.lowStockAlerts?.length === 0 && stats?.expiringSoonAlerts?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">All medicines are currently healthy in stock.</p>
            ) : (
              <>
                {stats?.lowStockAlerts?.slice(0, 3).map((med) => (
                  <div
                    key={'low-' + med.id}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">{med.name}</div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-300">
                        Stock: {med.availableQuantity} units (Threshold: {med.minimumStock})
                      </div>
                    </div>
                    <AlertBadge type="LOW_STOCK" text="Low Stock" />
                  </div>
                ))}
                {stats?.expiringSoonAlerts?.slice(0, 3).map((med) => (
                  <div
                    key={'exp-' + med.id}
                    className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/60 dark:bg-rose-950/20"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">{med.name}</div>
                      <div className="text-[11px] text-rose-700 dark:text-rose-300">
                        Expires on: {med.expiryDate} (Batch: {med.batchNumber})
                      </div>
                    </div>
                    <AlertBadge type="EXPIRING_SOON" text="Expiring Soon" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent POS Transactions</h3>
            <Link to="/reports" className="text-xs font-semibold text-brand-600 hover:underline">
              All Sales
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentSales?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No transactions recorded yet.</p>
            ) : (
              stats?.recentSales?.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{sale.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-400">• {sale.paymentMethod}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Customer: {sale.customerName || 'Walk-in'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(sale.totalAmount)}
                    </div>
                    <AlertBadge type={sale.status} text={sale.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

