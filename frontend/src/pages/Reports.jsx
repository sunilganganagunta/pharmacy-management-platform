import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { useNotification } from '../context/NotificationContext';
import StatCard from '../components/StatCard';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Reports = () => {
  const { addToast } = useNotification();
  const [reportType, setReportType] = useState('sales'); // 'sales' or 'inventory'
  const [salesRange, setSalesRange] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'annual'
  const [invType, setInvType] = useState('all'); // 'all', 'low_stock', 'expired', 'expiring_soon'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      if (reportType === 'sales') {
        const res = await api.get(`/reports/sales?range=${salesRange}`);
        if (res?.data) setReportData(res.data);
      } else {
        const res = await api.get(`/reports/inventory?type=${invType}`);
        if (res?.data) setReportData(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, salesRange, invType]);

  const handleExportCsv = async () => {
    try {
      const endpoint = reportType === 'sales' ? '/reports/export/sales' : '/reports/export/inventory';
      const token = localStorage.getItem('medicore_token');
      const response = await fetch(`/api${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medicore_${reportType}_report_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      addToast('CSV Report downloaded successfully', 'success');
    } catch (err) {
      addToast('Failed to export CSV', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Executive Financial & Clinical Reports
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time reporting on revenue velocity, tax distributions, lot valuation, and inventory shrinkage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Category Selector & Filter Pills */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportType('sales')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              reportType === 'sales'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Sales & Revenue Analytics
          </button>
          <button
            onClick={() => setReportType('inventory')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              reportType === 'inventory'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Inventory Valuation & Status
          </button>
        </div>

        {reportType === 'sales' ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Time Horizon:</span>
            {['daily', 'weekly', 'monthly', 'annual'].map((r) => (
              <button
                key={r}
                onClick={() => setSalesRange(r)}
                className={`rounded-lg px-2.5 py-1 uppercase text-[10px] font-bold tracking-wider transition ${
                  salesRange === r
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Filter Set:</span>
            {[
              { id: 'all', label: 'All Catalog' },
              { id: 'low_stock', label: 'Low Stock' },
              { id: 'expiring_soon', label: 'Expiring Soon' },
              { id: 'expired', label: 'Expired Lots' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setInvType(f.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  invType === f.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      {reportType === 'sales' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Period Revenue"
            value={`₹${Number(reportData?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle={reportData?.dateRange}
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            title="Total Invoiced Orders"
            value={reportData?.totalTransactions || 0}
            subtitle="Completed sales transactions"
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Average Order Value"
            value={`₹${Number(reportData?.averageOrderValue || 0).toFixed(2)}`}
            subtitle="Revenue per checkout ticket"
            icon={DollarSign}
            color="purple"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title="Selected Inventory Valuation"
            value={`₹${Number(reportData?.totalInventoryValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle="Calculated at wholesale acquisition cost"
            icon={DollarSign}
            color="teal"
          />
          <StatCard
            title="Total Medicines in Scope"
            value={reportData?.totalItemsCount || 0}
            subtitle={reportData?.reportType}
            icon={Package}
            color="blue"
          />
        </div>
      )}

      {/* Chart Section (for Sales) */}
      {reportType === 'sales' && reportData?.timeSeriesData?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Revenue Trajectory ({reportData.reportType})
          </h3>
          <p className="text-xs text-slate-400 mb-4">{reportData.dateRange}</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toFixed(2)}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Records Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            {reportType === 'sales' ? 'Transaction Audit Stream' : 'Itemized Medicine Valuation'}
          </h3>
        </div>

        {reportType === 'sales' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Tax</th>
                  <th className="px-5 py-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportData?.salesDetails?.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-mono font-bold">{s.invoiceNumber}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(s.saleDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3">{s.customerName || 'Walk-in'}</td>
                    <td className="px-5 py-3">{s.paymentMethod}</td>
                    <td className="px-5 py-3">₹{Number(s.taxAmount).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900 dark:text-white">
                      ₹{Number(s.totalAmount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Medicine</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Batch</th>
                  <th className="px-5 py-3">Units in Stock</th>
                  <th className="px-5 py-3">Unit Cost</th>
                  <th className="px-5 py-3">Total Asset Value</th>
                  <th className="px-5 py-3">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportData?.medicineDetails?.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-bold">{m.name}</td>
                    <td className="px-5 py-3 text-slate-500">{m.categoryName || 'General'}</td>
                    <td className="px-5 py-3 font-mono">{m.batchNumber}</td>
                    <td className="px-5 py-3 font-semibold">{m.availableQuantity}</td>
                    <td className="px-5 py-3">₹{Number(m.purchasePrice).toFixed(2)}</td>
                    <td className="px-5 py-3 font-bold text-teal-600 dark:text-teal-400">
                      ₹{(Number(m.purchasePrice) * m.availableQuantity).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{m.expiryDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;

