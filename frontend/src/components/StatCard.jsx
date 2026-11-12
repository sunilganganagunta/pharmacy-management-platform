import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border-teal-200 dark:border-teal-900',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-900',
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorMap[color] || colorMap.blue}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;

