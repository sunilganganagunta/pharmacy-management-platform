import React from 'react';

export const CardSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between">
      <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
      <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
    </div>
    <div className="mt-4 h-8 w-32 rounded bg-slate-200 dark:bg-slate-700"></div>
    <div className="mt-2 h-3 w-20 rounded bg-slate-200 dark:bg-slate-700"></div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="animate-pulse space-y-3">
    <div className="h-10 w-full rounded-xl bg-slate-200/60 dark:bg-slate-800"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-8 flex-1 rounded-lg bg-slate-100 dark:bg-slate-800/40"></div>
        ))}
      </div>
    ))}
  </div>
);

