import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import AlertBadge from '../components/AlertBadge';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Truck,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  DollarSign,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';

const Purchases = () => {
  const { addToast } = useNotification();
  const { isAdmin } = useAuth();

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form State for creating PO
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState([{ medicineId: '', quantity: 1, unitCost: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/purchases?page=${page}&size=10`);
      if (res?.data) {
        setOrders(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch purchase orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
    api.get('/suppliers/active').then((res) => {
      if (res?.data) setSuppliers(res.data);
    }).catch(console.error);

    api.get('/medicines/all').then((res) => {
      if (res?.data) setMedicines(res.data);
    }).catch(console.error);
  }, [fetchOrders]);

  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { medicineId: '', quantity: 1, unitCost: '' }]);
  };

  const handleRemoveItemRow = (index) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;

    // Autofill default purchase cost if medicine selected
    if (field === 'medicineId') {
      const med = medicines.find((m) => m.id === Number(value));
      if (med) {
        updated[index].unitCost = med.purchasePrice;
      }
    }
    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unitCost) || 0;
      return sum + qty * cost;
    }, 0);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      addToast('Please select a supplier', 'warning');
      return;
    }

    const validItems = orderItems.filter((item) => item.medicineId && item.quantity > 0 && item.unitCost >= 0);
    if (validItems.length === 0) {
      addToast('Please add at least one valid item to the purchase order', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/purchases', {
        supplierId: Number(supplierId),
        expectedDate: expectedDate || null,
        notes: notes || 'Standard batch order',
        items: validItems.map((item) => ({
          medicineId: Number(item.medicineId),
          quantity: parseInt(item.quantity, 10),
          unitCost: parseFloat(item.unitCost),
        })),
      });

      addToast('Purchase order created with status PENDING', 'success');
      setCreateModalOpen(false);
      // Reset form
      setSupplierId('');
      setExpectedDate('');
      setNotes('');
      setOrderItems([{ medicineId: '', quantity: 1, unitCost: '' }]);
      fetchOrders();
    } catch (err) {
      addToast(err.message || 'Failed to create purchase order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/purchases/${orderId}/status`, { status: newStatus });
      if (newStatus === 'RECEIVED') {
        addToast('Stock received! Inventory automatically updated.', 'success');
      } else {
        addToast(`Order status updated to ${newStatus}`, 'info');
      }
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setViewModalOpen(false);
      }
    } catch (err) {
      addToast(err.message || 'Failed to update order status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Purchase Orders & Stock Procurement
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Create vendor POs, track delivery status, and automatically reconcile received inventory lots.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Purchase Order</span>
          </button>
        )}
      </div>

      {/* PO Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No purchase orders found</h3>
            <p className="mt-1 text-xs">Click "Create Purchase Order" to replenish medicine stocks.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">PO Number</th>
                  <th className="px-5 py-3.5 font-semibold">Supplier</th>
                  <th className="px-5 py-3.5 font-semibold">Order Date</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Total Amount</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {po.orderNumber}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {po.supplierName}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {po.orderDate}
                    </td>
                    <td className="px-5 py-4">
                      <AlertBadge type={po.status} text={po.status} />
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      ₹{Number(po.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(po);
                            setViewModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Quick Action: Receive Stock */}
                        {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleUpdateStatus(po.id, 'RECEIVED')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300 transition"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Receive Stock</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Draft New Purchase Order"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Supplier *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="">-- Choose Vendor --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.companyName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Order Items (Line items)
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {orderItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <select
                    required
                    value={item.medicineId}
                    onChange={(e) => handleItemChange(index, 'medicineId', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">Select Medicine</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Stock: {m.availableQuantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={item.unitCost}
                    onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                    placeholder="Unit Cost (₹)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="col-span-1 text-right">
                  {orderItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      className="text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Procurement Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Urgent order, batch packaging instructions..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Grand Total Bar */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Estimated Total:</span>
            <span className="text-base font-bold text-brand-600 dark:text-brand-400">
              ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Creating...' : 'Draft Purchase Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View PO Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title={`Purchase Order: ${selectedOrder.orderNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400">Supplier:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedOrder.supplierName}</p>
                <p className="text-[11px] text-slate-400">Ordered on: {selectedOrder.orderDate}</p>
              </div>
              <div className="text-right">
                <AlertBadge type={selectedOrder.status} text={selectedOrder.status} />
                <p className="mt-1 font-bold text-sm text-slate-900 dark:text-white">
                  ₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Order Line Items</h4>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px]">
                    <tr>
                      <th className="px-3 py-2">Medicine</th>
                      <th className="px-3 py-2">Quantity</th>
                      <th className="px-3 py-2">Unit Cost</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{item.medicineName}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">₹{Number(item.unitCost).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-semibold">₹{Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <span className="font-semibold text-slate-500">Order Notes:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Actions for Status Update */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Current Status: {selectedOrder.status}</span>
              <div className="flex gap-2">
                {selectedOrder.status === 'PENDING' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'APPROVED')}
                    className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300"
                  >
                    Approve PO
                  </button>
                )}
                {selectedOrder.status !== 'RECEIVED' && selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'RECEIVED')}
                    className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                  >
                    Receive Stock into Inventory
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Purchases;

