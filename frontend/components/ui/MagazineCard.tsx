import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from './StardateBadge';
import { ArrowRight } from 'lucide-react';

interface MagazineCardProps {
  href: string;
  title: string;
  cover?: string | null;
  excerpt?: string | null;
  date?: string | Date | null;
  logId?: number | string | null;
  /** 眉题区（星历徽标右侧）：分类/地点/状态等小徽标 */
  eyebrow?: React.ReactNode;
  /** 封面角标浮层（VisaStamp 等） */
  overlay?: React.ReactNode;
  /** 底部左侧元信息（阅读时长/点赞等），默认「阅读全文」 */
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  aspectRatio?: '16/9' | '4/3';
  readMoreText?: string;
  className?: string;
}

/**
 * 杂志卡片（五列表页统一卡片语言）
 *
 * 大封面 + 星历档案徽标 + Ken Burns 悬停慢缩放 + 纸感/磨砂双主题基座。
 * 服务端组件兼容（纯 CSS 交互，零客户端 JS 开销）。
 */
export function MagazineCard({
  href,
  title,
  cover,
  excerpt,
  date,
  logId,
  eyebrow,
  overlay,
  footerLeft,
  footerRight,
  aspectRatio = '16/9',
  readMoreText,
  className = '',
}: MagazineCardProps) {
  return (
    <Link
      href={href}
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.12] shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.65)] hover:shadow-[0_24px_50px_-10px_rgba(16,185,129,0.25)] dark:hover:shadow-[0_24px_55px_-10px_rgba(16,185,129,0.3)] hover:border-emerald-500/50 transition-all duration-500 ${className}`}
    >
      {/* 顶部极细环境微光高光发线 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/25 to-transparent z-20" aria-hidden="true" />
      {/* 杂志大封面 + Ken Burns 悬停慢缩放 */}
      {cover && (
        <div className="relative overflow-hidden">
          <SafeImage
            src={cover}
            alt={title}
            aspectRatio={aspectRatio}
            containerClassName="w-full"
            className="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.07]"
          />
          {/* 悬停纱幕加深 */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            aria-hidden="true"
          />
          {overlay}
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div className="space-y-2.5">
          {/* 星历档案行 + 眉题 */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StardateBadge date={date} logId={logId} />
            {eyebrow}
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>

          {excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {excerpt}
            </p>
          )}
        </div>

        {/* 底部元信息行 */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2 min-w-0">
            {footerLeft}
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 font-medium text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {footerRight ?? (
              <>
                {readMoreText || 'Read'}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
