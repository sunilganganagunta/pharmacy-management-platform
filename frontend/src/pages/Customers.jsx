import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Customers = () => {
  const { addToast } = useNotification();
  const { isAdmin } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    name: '',
    phone: '',
    email: '',
    address: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, size: 10 };
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/customers', { params });
      if (res?.data) {
        setCustomers(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setSelectedCustomer(c);
    setFormData({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleOpenDelete = (c) => {
    setSelectedCustomer(c);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isEditing) {
        await api.put(`/customers/${selectedCustomer.id}`, formData);
        addToast('Customer details updated', 'success');
      } else {
        await api.post('/customers', formData);
        addToast('Customer enrolled successfully', 'success');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      addToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;
    try {
      await api.delete(`/customers/${selectedCustomer.id}`);
      addToast('Customer record removed', 'success');
      fetchCustomers();
    } catch (err) {
      addToast(err.message || 'Failed to delete customer', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Customer Profiles & Loyalty
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Enrolled patients, prescription accounts, and customer lifetime value.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Enroll New Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search customers by full name or phone number..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No customers found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Customer Name</th>
                  <th className="px-5 py-3.5 font-semibold">Phone Number</th>
                  <th className="px-5 py-3.5 font-semibold">Email</th>
                  <th className="px-5 py-3.5 font-semibold">Address</th>
                  <th className="px-5 py-3.5 font-semibold">Lifetime Purchases</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-mono">
                      {c.phone}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {c.email || 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-slate-500 max-w-xs truncate">
                      {c.address || 'N/A'}
                    </td>
                    <td className="px-5 py-4 font-bold text-brand-600 dark:text-brand-400">
                      ₹{Number(c.totalPurchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenDelete(c)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Customer' : 'Enroll New Customer'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Chand"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98230 11223"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@gmail.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Apartment, street, city..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Customer' : 'Enroll Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Profile"
        message={`Are you sure you want to remove customer '${selectedCustomer?.name}'?`}
        confirmText="Delete"
        confirmStyle="danger"
      />
    </div>
  );
};

export default Customers;

