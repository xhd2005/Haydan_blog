import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { Post, PageVisualItem } from '@/lib/types';
import { Sparkles, ArrowRight, Clock, BookOpen, Compass } from 'lucide-react';

interface BlogFullBleedHeroProps {
  featuredPost?: Post;
  pageVisual?: PageVisualItem;
  locale: string;
  translations: {
    badge: string;
    readMore: string;
    readingTime: string;
    defaultTitle: string;
    defaultDesc: string;
  };
}

/**
 * 博客手记 100vw 通栏全景电影首屏组件 (Full-bleed Blog Editorial Hero)
 * 
 * 核心特征：
 * 1. 100vw 全幅巨幕背景（优先使用后台配置的图片/视频背景，未配置时智能使用精选手记大图），浅色通透明快，深色沉浸深邃；
 * 2. 彻底移除产生死白雾气的底层渐变，交由下方白瓷画卷 Sheet 向上微重叠自然切入；
 * 3. 严格共享 max-w-[1400px] 版心轴与 max-w-[980px] 左对齐基准线；
 * 4. 黄金重心呈现焦点文章标题、导言理念、星历徽标与“阅读全文”直达胶囊。
 */
export function BlogFullBleedHero({
  featuredPost,
  pageVisual,
  locale,
  translations: t,
}: BlogFullBleedHeroProps) {
  const hasCustomBg = Boolean(pageVisual?.bgUrl);
  const isVideoBg = hasCustomBg && pageVisual?.bgType === 'video';
  const coverUrl = hasCustomBg ? pageVisual!.bgUrl! : featuredPost?.cover;

  const displayTitle = featuredPost?.title || pageVisual?.customTitle || t.defaultTitle;
  const displayDesc = featuredPost?.excerpt || pageVisual?.customDesc || t.defaultDesc;

  return (
    <section className="relative w-full min-h-[520px] sm:min-h-[620px] lg:min-h-[680px] flex flex-col justify-center overflow-hidden pt-36 sm:pt-44 lg:pt-48 pb-24 sm:pb-32">
      {/* 1. 100vw 全幅巨幕背景层 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {isVideoBg ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover filter brightness-[0.88] dark:brightness-[0.62] saturate-[1.08] scale-105"
            src={coverUrl}
          />
        ) : coverUrl ? (
          <div className="relative w-full h-full">
            <SafeImage
              src={coverUrl}
              alt={displayTitle}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover filter brightness-[0.88] dark:brightness-[0.62] saturate-[1.08] scale-105"
            />
            {/* 电影质感微膜：浅色通透明朗，深色沉浸深邃 */}
            <div className="absolute inset-0 bg-black/20 dark:bg-black/55 pointer-events-none transition-colors duration-300" />
            {/* 径向暗角：浅色保持轻盈微暗角，深色强化四周环境包围感 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.35)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
          </div>
        ) : (
          /* 无背景时的数字花园深空渐变蓝图背景 */
          <div className="relative w-full h-full bg-gradient-to-b from-emerald-950/70 via-slate-900 to-[#090a0f]">
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none" 
              style={{
                backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.4) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>
        )}
      </div>

      {/* 2. 前景文字排版区 (严格同轴 1400px 版心与 980px 左对齐线) */}
      <div className="relative z-20 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 text-white select-none">
        <div className="max-w-[980px] space-y-5 sm:space-y-6">
          {/* 专栏顶标 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/20 border border-white/20 text-xs font-mono font-medium text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>{t.badge}</span>
          </div>

          {/* 核心元信息徽标条 */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            {featuredPost && (
              <span className="px-3 py-1 rounded-full backdrop-blur-md bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-semibold shadow-sm">
                精选焦点
              </span>
            )}

            {featuredPost?.category && (
              <span className="px-3 py-1 rounded-full backdrop-blur-md bg-black/40 border border-white/15 text-white/85 font-mono">
                {featuredPost.category.name}
              </span>
            )}

            {featuredPost && (
              <StardateBadge date={featuredPost.publishedAt || featuredPost.createdAt} logId={featuredPost.id} />
            )}

            {featuredPost?.readingTime && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-black/40 border border-white/15 text-white/85 font-mono">
                <Clock className="w-3.5 h-3.5 text-teal-300" />
                <span>{featuredPost.readingTime} {t.readingTime}</span>
              </div>
            )}
          </div>

          {/* 大标题 (同轴左对齐，大字号、高张力) */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] drop-shadow-md">
            {displayTitle}
          </h1>

          {/* 导言摘要 */}
          {displayDesc && (
            <p className="text-base sm:text-xl text-white/90 max-w-3xl leading-relaxed font-normal italic border-l-2 border-emerald-400 pl-4 py-0.5 drop-shadow-sm">
              {displayDesc}
            </p>
          )}

          {/* 行动按钮：直达精选手记阅读 */}
          {featuredPost && (
            <div className="pt-2">
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-white/90 text-slate-900 font-semibold text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t.readMore}</span>
                <ArrowRight className="w-4 h-4 text-emerald-600" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
