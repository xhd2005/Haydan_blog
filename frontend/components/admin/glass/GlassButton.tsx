'use client';

import React from 'react';
import clsx from 'clsx';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      children,
      icon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
      md: 'px-4 py-2 text-sm rounded-xl gap-2',
      lg: 'px-5 py-2.5 text-base rounded-2xl gap-2.5',
      icon: 'p-2 rounded-xl justify-center items-center',
    }[size];

    const variantClasses = {
      primary:
        'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-[0_4px_16px_rgba(79,70,229,0.35)] border border-indigo-400/40',
      secondary:
        'vision-pill text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-white/10 active:scale-[0.98]',
      danger:
        'bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-[0_2px_12px_rgba(244,63,94,0.15)]',
      ghost:
        'bg-transparent hover:bg-slate-100/70 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-transparent',
      glass:
        'vision-dock text-slate-800 dark:text-slate-100 hover:border-indigo-400/40 active:scale-[0.98]',
    }[variant];

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center font-medium transition-colors select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
          sizeClasses,
          variantClasses,
          (disabled || loading) && 'opacity-60 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
