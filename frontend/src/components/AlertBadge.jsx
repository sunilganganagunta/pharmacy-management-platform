import React from 'react';

const AlertBadge = ({ type, text }) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'IN_STOCK':
      case 'ACTIVE':
      case 'RECEIVED':
      case 'COMPLETED':
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
      case 'LOW_STOCK':
      case 'EXPIRING_SOON':
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      case 'OUT_OF_STOCK':
      case 'EXPIRED':
      case 'CANCELLED':
      case 'INACTIVE':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
      {text || type}
    </span>
  );
};

export default AlertBadge;

