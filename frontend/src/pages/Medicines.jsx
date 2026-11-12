import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertBadge from '../components/AlertBadge';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Pill,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Barcode,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

const Medicines = () => {
  const { addToast } = useNotification();
  const { isAdmin } = useAuth();

  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Form State
  const initialFormState = {
    name: '',
    genericName: '',
    brand: '',
    categoryId: '',
    manufacturer: '',
    batchNumber: '',
    barcode: '',
    purchasePrice: '',
    sellingPrice: '',
    availableQuantity: '',
    minimumStock: '10',
    manufacturingDate: '',
    expiryDate: '',
    supplierId: '',
    description: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch initial lookups (Categories & Suppliers)
  useEffect(() => {
    api.get('/categories').then((res) => {
      if (res?.data) setCategories(res.data);
    }).catch(console.error);

    api.get('/suppliers/active').then((res) => {
      if (res?.data) setSuppliers(res.data);
    }).catch(console.error);
  }, []);

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 10,
        sort: 'id,desc',
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.categoryId = selectedCategory;
      if (lowStockFilter) params.lowStockOnly = true;

      const res = await api.get('/medicines', { params });
      if (res?.data) {
        setMedicines(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch medicines', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, lowStockFilter]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setFormData({
      name: med.name || '',
      genericName: med.genericName || '',
      brand: med.brand || '',
      categoryId: med.categoryId || '',
      manufacturer: med.manufacturer || '',
      batchNumber: med.batchNumber || '',
      barcode: med.barcode || '',
      purchasePrice: med.purchasePrice || '',
      sellingPrice: med.sellingPrice || '',
      availableQuantity: med.availableQuantity || '',
      minimumStock: med.minimumStock || '10',
      manufacturingDate: med.manufacturingDate || '',
      expiryDate: med.expiryDate || '',
      supplierId: med.supplierId || '',
      description: med.description || '',
    });
    setSelectedMedicine(med);
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleOpenView = (med) => {
    setSelectedMedicine(med);
    setViewModalOpen(true);
  };

  const handleOpenDelete = (med) => {
    setSelectedMedicine(med);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      const payload = {
        ...formData,
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        supplierId: formData.supplierId ? Number(formData.supplierId) : null,
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        availableQuantity: parseInt(formData.availableQuantity, 10),
        minimumStock: parseInt(formData.minimumStock, 10),
      };

      if (isEditing) {
        await api.put(`/medicines/${selectedMedicine.id}`, payload);
        addToast('Medicine updated successfully', 'success');
      } else {
        await api.post('/medicines', payload);
        addToast('Medicine added to catalog successfully', 'success');
      }

      setModalOpen(false);
      fetchMedicines();
    } catch (err) {
      addToast(err.message || 'Operation failed', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMedicine) return;
    try {
      await api.delete(`/medicines/${selectedMedicine.id}`);
      addToast('Medicine deactivated successfully', 'success');
      fetchMedicines();
    } catch (err) {
      addToast(err.message || 'Failed to delete medicine', 'error');
    }
  };

  const getStockBadge = (med) => {
    if (med.expired) return <AlertBadge type="EXPIRED" text="Expired" />;
    if (med.availableQuantity === 0) return <AlertBadge type="OUT_OF_STOCK" text="Out of Stock" />;
    if (med.lowStock) return <AlertBadge type="LOW_STOCK" text={`Low (${med.availableQuantity})`} />;
    if (med.expiringSoon) return <AlertBadge type="EXPIRING_SOON" text="Expiring Soon" />;
    return <AlertBadge type="IN_STOCK" text={`In Stock (${med.availableQuantity})`} />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Medicine Catalogue & Inventory
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total records: {totalElements} medicines across registered therapeutic categories.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by brand name, generic formula, barcode, or batch..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(0);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setLowStockFilter(!lowStockFilter);
              setPage(0);
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              lowStockFilter
                ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Stock</span>
          </button>
        </div>
      </div>

      {/* Medicines Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={7} />
          </div>
        ) : medicines.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Pill className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No medicines found</h3>
            <p className="mt-1 text-xs">Try adjusting your search filters or click "Add New Medicine".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Medicine & Generic</th>
                  <th className="px-5 py-3.5 font-semibold">Category</th>
                  <th className="px-5 py-3.5 font-semibold">Batch / Barcode</th>
                  <th className="px-5 py-3.5 font-semibold">Stock Status</th>
                  <th className="px-5 py-3.5 font-semibold">Cost / Sell Price</th>
                  <th className="px-5 py-3.5 font-semibold">Expiry Date</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {medicines.map((med) => (
                  <tr
                    key={med.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{med.name}</div>
                      <div className="text-[11px] text-slate-400 italic">{med.genericName}</div>
                      {med.brand && <div className="text-[10px] text-brand-600">{med.brand}</div>}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {med.categoryName || 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono text-slate-700 dark:text-slate-300">{med.batchNumber}</div>
                      {med.barcode && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <Barcode className="h-3 w-3" />
                          <span>{med.barcode}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {getStockBadge(med)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        ₹{Number(med.sellingPrice).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Cost: ₹{Number(med.purchasePrice).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={med.expired ? 'font-bold text-rose-600' : med.expiringSoon ? 'font-bold text-amber-600' : 'text-slate-600 dark:text-slate-300'}>
                        {med.expiryDate}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(med)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(med)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 transition"
                          title="Edit Medicine"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenDelete(med)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 transition"
                            title="Delete"
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

        {/* Pagination Controls */}
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

      {/* Add / Edit Medicine Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Medicine Record' : 'Register New Medicine'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Augmentin 625 Duo"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Generic Name (Active Formula) *
              </label>
              <input
                type="text"
                required
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                placeholder="e.g. Amoxicillin + Clavulanic Acid"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand / Trade Name
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. GSK"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g. GlaxoSmithKline"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Number *
              </label>
              <input
                type="text"
                required
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g. BATCH-2026-01"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Barcode Number
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="e.g. 890103001001"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="100.00"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="150.00"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Available Units *
              </label>
              <input
                type="number"
                required
                value={formData.availableQuantity}
                onChange={(e) => setFormData({ ...formData, availableQuantity: e.target.value })}
                placeholder="50"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Stock Alert *
              </label>
              <input
                type="number"
                required
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                placeholder="10"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Manufacturing Date
              </label>
              <input
                type="date"
                value={formData.manufacturingDate}
                onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Supplier
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.companyName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Usage / Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Dosage notes, therapeutic guidelines, or storage conditions..."
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
              disabled={formSubmitting}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {formSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      {selectedMedicine && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title="Medicine Detailed Profile"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{selectedMedicine.name}</h4>
                <p className="text-slate-500 italic">{selectedMedicine.genericName}</p>
              </div>
              <div>{getStockBadge(selectedMedicine)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-semibold block">Brand & Manufacturer:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedMedicine.brand || 'N/A'} • {selectedMedicine.manufacturer || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Category:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedMedicine.categoryName || 'General'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Batch & Barcode:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">
                  Batch: {selectedMedicine.batchNumber} • Barcode: {selectedMedicine.barcode || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Stock & Threshold:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  Available: {selectedMedicine.availableQuantity} units (Min Alert: {selectedMedicine.minimumStock})
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Pricing:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  Purchase: ₹{Number(selectedMedicine.purchasePrice).toFixed(2)} | Selling: ₹{Number(selectedMedicine.sellingPrice).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Manufacturing & Expiry:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  Mfg: {selectedMedicine.manufacturingDate || 'N/A'} | Exp: {selectedMedicine.expiryDate}
                </span>
              </div>
            </div>

            {selectedMedicine.description && (
              <div className="pt-2">
                <span className="text-slate-400 font-semibold block">Clinical Notes:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {selectedMedicine.description}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Deactivate Medicine"
        message={`Are you sure you want to deactivate '${selectedMedicine?.name}'? It will be archived from active sales and inventory.`}
        confirmText="Deactivate"
        confirmStyle="danger"
      />
    </div>
  );
};

export default Medicines;

