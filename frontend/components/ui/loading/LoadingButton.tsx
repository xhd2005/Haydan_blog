'use client';

import React, { useRef, useState, useLayoutEffect } from 'react';
import { EmeraldSpinner } from './EmeraldSpinner';
import { Check } from 'lucide-react';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  success?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const VARIANT_CLASSES = {
  primary:
    'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 active:scale-[0.98]',
  secondary:
    'liquid-glass-pill text-slate-800 dark:text-zinc-200 hover:border-emerald-500/40 active:scale-[0.98]',
  outline:
    'border border-slate-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-400 text-slate-700 dark:text-zinc-200 active:scale-[0.98]',
  ghost:
    'text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60',
  danger:
    'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/20 active:scale-[0.98]',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5 min-h-[32px]',
  md: 'px-4 py-2 text-sm rounded-2xl gap-2 min-h-[40px]',
  lg: 'px-6 py-2.5 text-base rounded-2xl gap-2.5 min-h-[46px]',
};

/**
 * Hayden Xue 专属尺寸锁定多态变形按钮 (Morphing LoadingButton)
 * 点击触发异步操作时自动物理锁定当前像素级宽度，彻底消除任何页面排版抖动与跳动
 */
export function LoadingButton({
  loading = false,
  success = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [lockedWidth, setLockedWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (loading || success) {
      if (buttonRef.current && !lockedWidth) {
        setLockedWidth(buttonRef.current.offsetWidth);
      }
    } else {
      setLockedWidth(undefined);
    }
  }, [loading, success, lockedWidth]);

  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <button
      ref={buttonRef}
      style={lockedWidth ? { minWidth: `${lockedWidth}px` } : undefined}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`relative inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none select-none ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {/* 状态 1：加载中 - 极细双环微旋转器 */}
      {loading ? (
        <span className="flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <EmeraldSpinner size={size === 'sm' ? 'xs' : 'sm'} />
          {loadingText ? (
            <span className="text-xs font-mono tracking-wider">{loadingText}</span>
          ) : null}
        </span>
      ) : success ? (
        /* 状态 2：操作成功微对勾弹性展开 */
        <span className="flex items-center justify-center gap-1.5 animate-in zoom-in-90 duration-200 text-emerald-400 dark:text-emerald-300">
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span className="text-xs font-mono">已完成</span>
        </span>
      ) : (
        /* 状态 3：常态展示 */
        <span className="flex items-center justify-center gap-2">
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </span>
      )}
    </button>
  );
}
