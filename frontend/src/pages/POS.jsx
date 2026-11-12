import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosInstance';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import AlertBadge from '../components/AlertBadge';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Barcode,
  Receipt
} from 'lucide-react';

const POS = () => {
  const { addToast } = useNotification();
  const { user } = useAuth();

  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [taxPercent, setTaxPercent] = useState('12'); // 12% default GST
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, UPI
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Completed Invoice Modal State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  const barcodeRef = useRef(null);

  useEffect(() => {
    fetchCatalogue();
    api.get('/customers/all').then((res) => {
      if (res?.data) setCustomers(res.data);
    }).catch(console.error);
  }, []);

  const fetchCatalogue = async () => {
    try {
      const res = await api.get('/medicines/all');
      if (res?.data) {
        setMedicines(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    try {
      const res = await api.get(`/medicines/barcode/${barcodeInput.trim()}`);
      if (res?.data) {
        addToCart(res.data);
        setBarcodeInput('');
      }
    } catch (err) {
      addToast('No medicine matched barcode: ' + barcodeInput, 'error');
    }
  };

  const addToCart = (med) => {
    if (med.expired) {
      addToast(`Cannot sell expired medicine: ${med.name}`, 'error');
      return;
    }
    if (med.availableQuantity <= 0) {
      addToast(`Out of stock: ${med.name}`, 'warning');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === med.id);
      if (existing) {
        if (existing.quantity >= med.availableQuantity) {
          addToast(`Maximum available stock reached (${med.availableQuantity})`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.medicineId === med.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        return [
          ...prev,
          {
            medicineId: med.id,
            name: med.name,
            genericName: med.genericName,
            batchNumber: med.batchNumber,
            unitPrice: parseFloat(med.sellingPrice),
            quantity: 1,
            availableQuantity: med.availableQuantity,
            subtotal: parseFloat(med.sellingPrice),
          },
        ];
      }
    });
  };

  const updateQuantity = (medId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicineId === medId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.availableQuantity) {
              addToast(`Cannot exceed available stock of ${item.availableQuantity}`, 'warning');
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (medId) => {
    setCart((prev) => prev.filter((item) => item.medicineId !== medId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountPercent('0');
    setNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountVal = parseFloat(discountPercent) || 0;
  const discountAmount = (subtotal * discountVal) / 100;
  const discountedSubtotal = subtotal - discountAmount;
  const taxVal = parseFloat(taxPercent) || 0;
  const taxAmount = (discountedSubtotal * taxVal) / 100;
  const grandTotal = discountedSubtotal + taxAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty', 'warning');
      return;
    }

    try {
      setProcessing(true);
      const payload = {
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || null,
        paymentMethod,
        discountPercent: discountVal,
        taxPercent: taxVal,
        notes: notes || 'Standard counter sale',
        items: cart.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
        })),
      };

      const res = await api.post('/sales', payload);
      if (res?.data) {
        setCompletedInvoice(res.data);
        setInvoiceModalOpen(true);
        addToast('Sale completed successfully!', 'success');
        clearCart();
        fetchCatalogue(); // refresh updated stock
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete sale', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredMedicines = medicines.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.genericName?.toLowerCase().includes(q) ||
      m.barcode?.includes(q) ||
      m.batchNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: Catalogue Search & Selection (7 cols) */}
      <div className="space-y-4 lg:col-span-7">
        {/* Search Bar + Barcode Scanner Input */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicines by name, generic, batch..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <form onSubmit={handleBarcodeSearch} className="flex items-center gap-2">
              <div className="relative w-44">
                <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={barcodeRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs font-mono text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                Scan
              </button>
            </form>
          </div>
        </div>

        {/* Medicines List Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Available Medicines ({filteredMedicines.length})
            </h2>
            <span className="text-[11px] text-slate-400">Click card to add to billing cart</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredMedicines.map((med) => {
              const inCart = cart.find((i) => i.medicineId === med.id);
              const disabled = med.expired || med.availableQuantity <= 0;

              return (
                <div
                  key={med.id}
                  onClick={() => !disabled && addToCart(med)}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 transition cursor-pointer ${
                    disabled
                      ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900/50'
                      : inCart
                      ? 'border-brand-500 bg-brand-50/40 shadow-sm dark:bg-brand-950/20'
                      : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{med.name}</h4>
                        <p className="text-[11px] text-slate-400 italic line-clamp-1">{med.genericName}</p>
                      </div>
                      <span className="font-bold text-xs text-brand-600 dark:text-brand-400">
                        ₹{Number(med.sellingPrice).toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">Lot: {med.batchNumber}</span>
                      <span className={med.expired ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        Exp: {med.expiryDate}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                    <span className={`text-[11px] font-semibold ${med.lowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                      Stock: {med.availableQuantity} units
                    </span>
                    <button
                      type="button"
                      disabled={disabled}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{inCart ? `Add (${inCart.quantity})` : 'Add'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Checkout Terminal & Cart (5 cols) */}
      <div className="space-y-4 lg:col-span-5">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 min-h-[700px]">
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-brand-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Billing Cart</h3>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {cart.length}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Customer Details Inputs */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Customer Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingCart className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs">Your cart is currently empty.</p>
                  <p className="text-[11px] text-slate-400">Add medicines from the left to start billing.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.medicineId} className="flex items-center justify-between py-2.5">
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ₹{item.unitPrice.toFixed(2)} &times; {item.quantity} = ₹{item.subtotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                        <button
                          onClick={() => updateQuantity(item.medicineId, -1)}
                          className="p-1 hover:text-brand-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.medicineId, 1)}
                          className="p-1 hover:text-brand-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.medicineId)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout Breakdown & Payment Controls */}
          <div className="border-t border-slate-200 pt-4 space-y-3 dark:border-slate-800">
            {/* Payment Method Selector */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                        paymentMethod === m.id
                          ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-950 dark:border-brand-600 dark:text-brand-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discount and Tax inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-500">Discount (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full mt-0.5 rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Tax / GST (%)</span>
                <input
                  type="number"
                  min="0"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full mt-0.5 rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Totals Summary */}
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Applicable Tax ({taxPercent}%):</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white border-t border-slate-100 pt-2 dark:border-slate-800">
                <span>Grand Total:</span>
                <span className="text-brand-600 dark:text-brand-400">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-700 disabled:opacity-40 transition"
            >
              {processing ? (
                <span>Generating Invoice...</span>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  <span>Complete Sale & Print Invoice (₹{grandTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {completedInvoice && (
        <Modal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          title={`Tax Invoice: ${completedInvoice.invoiceNumber}`}
          maxWidth="max-w-xl"
        >
          <div id="invoice-printable" className="space-y-4 p-4 border border-slate-200 rounded-2xl bg-white text-slate-900 dark:border-slate-700 dark:bg-white dark:text-slate-900 printable-card">
            {/* Invoice Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-lg font-extrabold tracking-tight text-brand-700 uppercase">
                {completedInvoice.pharmacyName}
              </h2>
              <p className="text-xs text-slate-500">{completedInvoice.pharmacyTagline}</p>
              <p className="text-[11px] text-slate-600 mt-1">{completedInvoice.pharmacyAddress}</p>
              <div className="flex justify-center gap-4 text-[10px] text-slate-500 mt-1 font-mono">
                <span>GSTIN: {completedInvoice.pharmacyGstin}</span>
                <span>D.L. No: {completedInvoice.pharmacyDlNo}</span>
              </div>
            </div>

            {/* Invoice Metadata */}
            <div className="flex justify-between text-xs border-b pb-3">
              <div>
                <p><span className="font-bold">Invoice No:</span> {completedInvoice.invoiceNumber}</p>
                <p><span className="font-bold">Date:</span> {new Date(completedInvoice.invoiceDate).toLocaleString('en-IN')}</p>
                <p><span className="font-bold">Pharmacist:</span> {completedInvoice.pharmacistName || user?.fullName}</p>
              </div>
              <div className="text-right">
                <p><span className="font-bold">Customer:</span> {completedInvoice.customerName}</p>
                <p><span className="font-bold">Phone:</span> {completedInvoice.customerPhone || 'N/A'}</p>
                <p><span className="font-bold">Payment:</span> {completedInvoice.paymentMethod}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs">
              <thead className="border-b text-slate-600 bg-slate-50">
                <tr>
                  <th className="py-1.5 px-2">Item</th>
                  <th className="py-1.5 px-2">Qty</th>
                  <th className="py-1.5 px-2">Price</th>
                  <th className="py-1.5 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedInvoice.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-2 font-medium">{item.medicineName}</td>
                    <td className="py-2 px-2">{item.quantity}</td>
                    <td className="py-2 px-2">₹{Number(item.unitPrice).toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-bold">₹{Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Breakdown */}
            <div className="border-t pt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{Number(completedInvoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(completedInvoice.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-₹{Number(completedInvoice.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST/Taxes ({completedInvoice.taxPercent}%):</span>
                <span>₹{Number(completedInvoice.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold border-t pt-2 text-slate-900">
                <span>Total Paid:</span>
                <span className="text-brand-600">₹{Number(completedInvoice.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-3 border-t">
              Thank you for trusting MediCore Pharmacy. Get well soon!
            </div>
          </div>

          {/* Modal Actions */}
          <div className="mt-4 flex justify-end gap-3 no-print">
            <button
              onClick={() => setInvoiceModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700"
            >
              <Printer className="h-4 w-4" />
              <span>Print Tax Invoice</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default POS;

