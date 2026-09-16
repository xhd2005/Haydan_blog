'use client';

import React from 'react';
import clsx from 'clsx';

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, icon, hint, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full bg-white/70 dark:bg-white/[0.05] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 dark:focus:border-indigo-400/50',
              icon && 'pl-9',
              error && 'border-rose-500/60 focus:ring-rose-500/40',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
