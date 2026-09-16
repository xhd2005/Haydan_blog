import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { Post } from '@/lib/types';
import { Sparkles, Clock, ArrowRight, BookOpen } from 'lucide-react';

interface HeroFeaturedPostProps {
  post: Post;
  locale: string;
  readMoreText?: string;
  featuredBadgeText?: string;
  minReadText?: string;
}

/**
 * 博客首屏沉浸式图文巨幕卡片 (Hero Featured Post)
 * 
 * 采用 Editorial 现代杂志/科技精选风：
 * - 宽屏非对称分栏画幅，视觉张力拉满；
 * - 玻璃拟态深色层级（bg-white/80 浅色雪白磨砂 / bg-neutral-900/60 深邃曜石黑磨砂）；
 * - 1px 微光边界高光线 + 环境微光溢出；
 * - Ken Burns 悬停缓慢缩放与平滑光感过渡。
 */
export function HeroFeaturedPost({
  post,
  locale,
  readMoreText = '阅读全文',
  featuredBadgeText = '精选焦点',
  minReadText = '分钟阅读',
}: HeroFeaturedPostProps) {
  return (
    <div className="relative group">
      {/* 底部背光环境光晕 (Ambient Glow) */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent blur-2xl opacity-40 group-hover:opacity-75 transition-opacity duration-700" 
      />

      <Link
        href={`/blog/${post.slug}`}
        className="relative block overflow-hidden rounded-[2rem] backdrop-blur-xl bg-white/85 dark:bg-neutral-900/70 border border-slate-200/90 dark:border-white/[0.12] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] hover:border-emerald-500/50 dark:hover:border-emerald-400/40 transition-all duration-500"
      >
        {/* 顶部极细高光微发线 */}
        <div 
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 dark:via-emerald-400/30 to-transparent z-20" 
          aria-hidden="true" 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
          {/* 左侧文字与元信息排版区 (占 7 列) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 lg:p-10 z-10">
            <div className="space-y-4 sm:space-y-5">
              {/* 眉题信息条：Featured 标识 + 分类 + 星历 */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span>{featuredBadgeText}</span>
                </span>

                {post.category && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary/80 text-foreground border border-border/60">
                    {post.category.name}
                  </span>
                )}

                <StardateBadge date={post.publishedAt || post.createdAt} logId={post.id} />
              </div>

              {/* 标题 */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-[1.2] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                {post.title}
              </h2>

              {/* 摘要 */}
              <p className="text-sm sm:text-base text-muted-foreground line-clamp-3 sm:line-clamp-4 leading-relaxed font-normal">
                {post.excerpt || '点击深入探索这篇深度思考与系统工程实践手记，了解更多架构与设计哲学细节...'}
              </p>
            </div>

            {/* 底部元信息与行动按钮 */}
            <div className="pt-6 sm:pt-8 mt-6 border-t border-slate-100 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs sm:text-sm font-mono text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  {post.readingTime} {minReadText}
                </span>
                {post.tags && post.tags.length > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
                    #{post.tags[0].name}
                  </span>
                )}
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-foreground text-background group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
                <span>{readMoreText}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* 右侧大画幅封面区 (占 5 列) */}
          <div className="lg:col-span-5 relative min-h-[240px] sm:min-h-[300px] lg:min-h-full overflow-hidden bg-muted">
            {post.cover ? (
              <>
                <SafeImage
                  src={post.cover}
                  alt={post.title}
                  aspectRatio="16/9"
                  containerClassName="w-full h-full min-h-full"
                  className="w-full h-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
                />
                {/* 悬停光泽纱幕与深色渐变融入 */}
                <div 
                  className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-transparent via-transparent to-white/20 dark:to-neutral-950/40 pointer-events-none" 
                  aria-hidden="true" 
                />
                <div 
                  className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                  aria-hidden="true" 
                />
              </>
            ) : (
              <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent text-muted-foreground">
                <BookOpen className="w-12 h-12 text-emerald-500/40 mb-3" />
                <span className="text-xs font-mono tracking-wider uppercase">Editorial Focus</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
