import React from 'react';
import Link from 'next/link';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { Post } from '@/lib/types';
import { Clock, ArrowRight, Languages } from 'lucide-react';

interface CompactPostRowProps {
  post: Post;
  locale: string;
  minReadText?: string;
}

/**
 * 极简紧凑单行文章组件 (Compact Post Row)
 * 
 * 类似 Linear / Apple Developer 式的高级紧凑行排版：
 * - 纯粹、克制、信息密度高，极适宜快速纵向扫读；
 * - 悬浮微光背景淡入 + 1px 细边界；
 * - 标题悬停渐变，箭头平滑位移。
 */
export function CompactPostRow({
  post,
  locale,
  minReadText = '分钟阅读',
}: CompactPostRowProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl backdrop-blur-md bg-white/70 dark:bg-neutral-900/40 border border-slate-200/70 dark:border-white/[0.08] hover:border-emerald-500/40 dark:hover:border-emerald-400/30 hover:bg-white/95 dark:hover:bg-neutral-800/60 transition-all duration-300 shadow-sm hover:shadow-[0_8px_25px_-6px_rgba(16,185,129,0.12)]"
    >
      {/* 顶部/左侧：星历与分类 */}
      <div className="flex items-center gap-2.5 shrink-0">
        <StardateBadge date={post.publishedAt || post.createdAt} logId={post.id} />
        {post.category && (
          <span className="px-2 py-0.5 rounded-md bg-secondary/80 text-foreground text-[11px] font-medium border border-border/50">
            {post.category.name}
          </span>
        )}
      </div>

      {/* 中部：标题与简明引语 */}
      <div className="min-w-0 flex-1 sm:px-2">
        <h4 className="text-base sm:text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
          {post.title}
        </h4>
        {post.excerpt && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5 sm:mt-0 font-normal">
            {post.excerpt}
          </p>
        )}
      </div>

      {/* 右侧：阅读时长、多语言标记与箭头 */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          {locale === 'en' && post.lang === 'zh' && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              title="Original article in Chinese"
            >
              <Languages className="w-3 h-3" />
              <span>ZH</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
            {post.readingTime} {minReadText}
          </span>
        </div>

        <div className="w-7 h-7 rounded-full bg-secondary/60 flex items-center justify-center text-foreground group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
