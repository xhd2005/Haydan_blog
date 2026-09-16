'use client';

import React from 'react';

interface EmeraldSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

/**
 * Hayden Xue 专属空间计算极简双环微旋转器 (Minimalist Dual-Ring Spinner)
 * 1.5px 极细精纯双环，内外环非线性差速自转，中心悬浮翡翠微光量子核，极致优雅克制
 */
export function EmeraldSpinner({ size = 'md', className = '' }: EmeraldSpinnerProps) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${sizeClass} ${className}`}
      role="status"
      aria-label="加载中"
    >
      {/* 极细外环：顺时针平滑旋转 */}
      <svg
        className="w-full h-full animate-spin text-emerald-500"
        style={{ animationDuration: '1.2s' }}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-15 stroke-current"
          cx="12"
          cy="12"
          r="10"
          strokeWidth="1.5"
        />
        <path
          className="opacity-90 stroke-current"
          d="M12 2C17.5228 2 22 6.47715 22 12C22 13.8824 21.48 15.6432 20.5746 17.1472"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* 极细内环：逆时针差速自转 */}
      <div className="absolute inset-1">
        <svg
          className="w-full h-full animate-spin text-teal-400"
          style={{ animationDuration: '1.8s', animationDirection: 'reverse' }}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="opacity-80 stroke-current"
            d="M12 4C7.58172 4 4 7.58172 4 12C4 13.6264 4.4847 15.1396 5.31837 16.4"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 中心翡翠微光量子核 */}
      <div className="absolute w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
    </div>
  );
}
