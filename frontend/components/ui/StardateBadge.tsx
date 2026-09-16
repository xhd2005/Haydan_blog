import React from 'react';
import { formatStardate, formatLogNo } from '@/lib/stardate';

interface StardateBadgeProps {
  /** 内容发布日期（生成 STARDATE） */
  date?: string | Date | null;
  /** 内容 ID（生成 LOG 序号） */
  logId?: number | string | null;
  className?: string;
}

/**
 * 星历档案徽标（星际远航 IP 记忆点）
 * 等宽字体 + 极光描边小胶囊，形如任务档案编号：LOG №007 · STARDATE 2026.09.09
 */
export function StardateBadge({ date, logId, className = '' }: StardateBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider bg-slate-900/[0.04] dark:bg-white/[0.05] text-slate-500 dark:text-zinc-400 border border-slate-200/80 dark:border-white/[0.08] ${className}`}
    >
      <span className="text-emerald-600 dark:text-emerald-400">{formatLogNo(logId)}</span>
      <span className="opacity-50">·</span>
      <span>{formatStardate(date)}</span>
    </span>
  );
}
