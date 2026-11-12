import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertBadge from '../components/AlertBadge';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  UserCheck
} from 'lucide-react';

const Suppliers = () => {
  const { addToast } = useNotification();
  const { isAdmin } = useAuth();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    active: true,
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      if (res?.data) {
        setSuppliers(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch suppliers', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setSelectedSupplier(sup);
    setFormData({
      name: sup.name || '',
      companyName: sup.companyName || '',
      contactPerson: sup.contactPerson || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
      active: sup.active,
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleOpenDelete = (sup) => {
    setSelectedSupplier(sup);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isEditing) {
        await api.put(`/suppliers/${selectedSupplier.id}`, formData);
        addToast('Supplier details updated', 'success');
      } else {
        await api.post('/suppliers', formData);
        addToast('Supplier registered successfully', 'success');
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      addToast(err.message || 'Failed to save supplier', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSupplier) return;
    try {
      await api.delete(`/suppliers/${selectedSupplier.id}`);
      addToast('Supplier archived successfully', 'success');
      fetchSuppliers();
    } catch (err) {
      addToast(err.message || 'Failed to delete supplier', 'error');
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.companyName?.toLowerCase().includes(q) ||
      s.contactPerson?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pharmaceutical Suppliers & Vendors
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Authorized pharmaceutical distribution partners, procurement contacts, and vendor profiles.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by vendor name, company name, contact person, or phone number..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          <Building2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No suppliers found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{sup.name}</h3>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">{sup.companyName}</p>
                  </div>
                  <AlertBadge type={sup.active ? 'ACTIVE' : 'INACTIVE'} text={sup.active ? 'Active' : 'Archived'} />
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {sup.contactPerson && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>{sup.contactPerson}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{sup.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEdit(sup)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleOpenDelete(sup)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Deactivate</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Supplier' : 'Register New Vendor'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supplier Label / Trade Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Cipla Healthcare Dist"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Registered Corporate Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. Cipla Ltd Distribution Network"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Rajesh Gupta"
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
                placeholder="+91 22 2482 6000"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Official Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="orders@supplier.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Warehouse / Dispatch Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Building, street, city, state, pincode..."
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
              {submitting ? 'Saving...' : isEditing ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate Confirm */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Deactivate Supplier"
        message={`Are you sure you want to deactivate '${selectedSupplier?.name}'?`}
        confirmText="Deactivate"
        confirmStyle="danger"
      />
    </div>
  );
};

export default Suppliers;

