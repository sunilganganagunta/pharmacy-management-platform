import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import AlertBadge from '../components/AlertBadge';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Package,
  PlusCircle,
  MinusCircle,
  Sliders,
  History,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';

const Inventory = () => {
  const { addToast } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit', 'low_stock', 'expiry'

  // Modal State for stock adjustment
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState('STOCK_IN'); // 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lookups for alerts
  const [lowStockList, setLowStockList] = useState([]);
  const [expiringList, setExpiringList] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, medRes, lowRes, expRes] = await Promise.all([
        api.get('/inventory/history?size=25'),
        api.get('/medicines/all'),
        api.get('/medicines/low-stock'),
        api.get('/medicines/expiring-soon')
      ]);

      if (txRes?.data) setTransactions(txRes.data.content || []);
      if (medRes?.data) setMedicines(medRes.data || []);
      if (lowRes?.data) setLowStockList(lowRes.data || []);
      if (expRes?.data) setExpiringList(expRes.data || []);
    } catch (err) {
      addToast(err.message || 'Error loading inventory records', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdjust = (type) => {
    setAdjustType(type);
    setSelectedMedicineId('');
    setAdjustQuantity('');
    setAdjustReason('');
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedicineId || !adjustQuantity) {
      addToast('Please select a medicine and quantity', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      let qty = parseInt(adjustQuantity, 10);
      if (adjustType === 'STOCK_OUT') {
        qty = -Math.abs(qty);
      }

      await api.post('/inventory/adjust', {
        medicineId: Number(selectedMedicineId),
        quantity: qty,
        type: adjustType,
        reason: adjustReason || `Manual inventory ${adjustType.toLowerCase()}`,
      });

      addToast(`Stock successfully adjusted (${adjustType})`, 'success');
      setAdjustModalOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Stock adjustment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Inventory Control & Stock Adjustments
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Audit-grade inventory lifecycle tracking, adjustments, reconciliation, and lot tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAdjust('STOCK_IN')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Stock In</span>
          </button>
          <button
            onClick={() => handleOpenAdjust('STOCK_OUT')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
          >
            <MinusCircle className="h-3.5 w-3.5" />
            <span>Stock Out</span>
          </button>
          <button
            onClick={() => handleOpenAdjust('ADJUSTMENT')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Adjust Stock</span>
          </button>
          <button
            onClick={loadData}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'audit'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Audit Transaction History ({transactions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('low_stock')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'low_stock'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Low Stock Items ({lowStockList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('expiry')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'expiry'
              ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Expiring Soon ({expiringList.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : activeTab === 'audit' ? (
        /* Audit Log Table */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                  <th className="px-5 py-3.5 font-semibold">Medicine</th>
                  <th className="px-5 py-3.5 font-semibold">Transaction Type</th>
                  <th className="px-5 py-3.5 font-semibold">Change Qty</th>
                  <th className="px-5 py-3.5 font-semibold">Previous &rarr; New Stock</th>
                  <th className="px-5 py-3.5 font-semibold">Reference & Reason</th>
                  <th className="px-5 py-3.5 font-semibold">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {tx.medicineName}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          tx.transactionType === 'STOCK_IN' || tx.transactionType === 'PURCHASE_RECEIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : tx.transactionType === 'SALE' || tx.transactionType === 'STOCK_OUT'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold">
                      <span className={tx.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400">{tx.previousStock}</span> &rarr;{' '}
                      <span className="font-bold">{tx.newStock}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {tx.referenceId || 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-400">{tx.reason || '-'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">
                      {tx.performedBy || 'system'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'low_stock' ? (
        /* Low Stock Items */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lowStockList.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-amber-900/60 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</h4>
                  <p className="text-xs text-slate-400">{m.genericName}</p>
                </div>
                <AlertBadge type="LOW_STOCK" text="Low Stock" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3 dark:border-slate-800">
                <div>
                  <span className="text-slate-400">Current Stock:</span>
                  <p className="font-bold text-amber-600 text-sm">{m.availableQuantity} units</p>
                </div>
                <div>
                  <span className="text-slate-400">Min Threshold:</span>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{m.minimumStock} units</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Expiring Soon Items */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {expiringList.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm dark:border-rose-900/60 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</h4>
                  <p className="text-xs text-slate-400">Batch: {m.batchNumber}</p>
                </div>
                <AlertBadge type="EXPIRING_SOON" text="Expiring Soon" />
              </div>

              <div className="mt-4 text-xs border-t border-slate-100 pt-3 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Expiry Date:</span>
                  <span className="font-bold text-rose-600">{m.expiryDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stock in Danger:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{m.availableQuantity} units</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Inventory Adjustment: ${adjustType}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Medicine *
            </label>
            <select
              required
              value={selectedMedicineId}
              onChange={(e) => setSelectedMedicineId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="">-- Choose Medicine --</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Current: {m.availableQuantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Adjustment Quantity *
            </label>
            <input
              type="number"
              min="1"
              required
              value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(e.target.value)}
              placeholder="e.g. 20"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Reference
            </label>
            <textarea
              rows={2}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Restock shipment, damaged vials written off, physical audit correction..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Applying...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;

