'use client';

import React from 'react';

interface SkeletonBoneProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 基础高斯微磨砂骨架块：采用 VisionOS 全透光微磨砂高斯呼吸动效，告别刺眼生硬的扫光
 */
export function SkeletonBone({ className = '', style }: SkeletonBoneProps) {
  return (
    <div
      style={style}
      className={`bg-slate-200/50 dark:bg-white/[0.06] backdrop-blur-md rounded-xl transition-all duration-500 animate-frosted-breathing ${className}`}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

/**
 * 文本占位骨架组：以自然段落比例错落分布
 */
export function SkeletonText({ lines = 3, className = '', lastLineWidth = '60%' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBone
          key={idx}
          className="h-3.5 rounded-full"
          style={{
            width: idx === lines - 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * 液态微磨砂玻璃卡片底座：深浅双主题景深磨砂，空灵通透
 */
export function SkeletonCard({ children, className = '' }: SkeletonCardProps) {
  return (
    <div className={`liquid-glass-card rounded-3xl p-6 border border-slate-200/70 dark:border-white/[0.08] shadow-sm animate-frosted-breathing ${className}`}>
      {children}
    </div>
  );
}
