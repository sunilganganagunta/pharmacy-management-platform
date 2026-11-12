import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmStyle = 'danger' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
            confirmStyle === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
              : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/30'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

