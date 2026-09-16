'use client';

import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { Post, Category, PageVisualItem } from '@/lib/types';
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Compass, 
  FolderOpen, 
  BookOpen,
  Layers,
  ChevronRight,
  Flame
} from 'lucide-react';

interface BlogBentoHeroProps {
  featuredPost?: Post;
  recentPosts?: Post[];
  categories: Category[];
  totalPosts: number;
  pageVisual?: PageVisualItem;
  locale: string;
  translations: {
    badge: string;
    readMore: string;
    readingTime: string;
    defaultTitle: string;
    defaultDesc: string;
    gardenExplorer?: string;
    recentDispatches?: string;
    allArticles?: string;
  };
}

/**
 * 现代双层策展式首屏 (Curated Bento Garden Hero)
 * 
 * 核心设计演进：
 * 1. 告别传统文章假冒的 100vw 电影大图，首屏聚焦“策展、索引与全貌”；
 * 2. 经典三要素 Bento 架构：
 *    - 左侧主卡：当期精选焦点手记（高张力封面、3D微浮层、深度摘要与阅读入口）；
 *    - 右上副卡：数字花园与分类探索雷达（即时分类徽标、手记容量统计）；
 *    - 右下副卡：近期最新思考速递（时空脉络直达、星历编号）；
 * 3. 严格遵循 Hayden Xue 身份纯正性与白瓷/曜石黑双主题微磨砂景深准则。
 */
export function BlogBentoHero({
  featuredPost,
  recentPosts = [],
  categories,
  totalPosts,
  pageVisual,
  locale,
  translations: t,
}: BlogBentoHeroProps) {
  const hasCustomBg = Boolean(pageVisual?.bgUrl);
  const isVideoBg = hasCustomBg && pageVisual?.bgType === 'video';
  const bgUrl = hasCustomBg ? pageVisual!.bgUrl! : undefined;

  const displayTitle = pageVisual?.customTitle || t.defaultTitle;
  const displayDesc = pageVisual?.customDesc || t.defaultDesc;

  return (
    <section className="relative w-full overflow-hidden pt-28 sm:pt-36 pb-10 sm:pb-14 transition-colors duration-300">
      {/* 1. 环境光晕氛围层 (Ambient Canvas: 继承后台图片/视频或极光微光网格) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {isVideoBg && bgUrl ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-15 dark:opacity-20 blur-xl scale-110"
            src={bgUrl}
          />
        ) : bgUrl ? (
          <div className="relative w-full h-full">
            <SafeImage
              src={bgUrl}
              alt={displayTitle}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover opacity-15 dark:opacity-25 blur-2xl scale-110"
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl" />
            <div className="absolute top-20 right-1/4 w-96 h-96 bg-teal-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl" />
            <div 
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
              style={{
                backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>
        )}
        {/* 底部微弱羽化蒙层，消除任何生硬边界 */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fbfbfd] dark:from-[#090a0f] to-transparent" />
      </div>

      {/* 2. 前景版心内容区 (1400px 黄金阅读轴) */}
      <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-10">
        
        {/* 2.1 顶部灵动标语与站长脉络徽标 */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-xl bg-white/80 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-white/[0.08] text-xs font-mono text-foreground/80 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">DIGITAL GARDEN</span>
            <span className="opacity-40">/</span>
            <span>HAYDEN XUE</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.2]">
              {displayTitle}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
              {displayDesc}
            </p>
          </div>

          {/* 状态徽标条 */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800/80 border border-slate-200/60 dark:border-white/[0.05]">
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              <span>{totalPosts} {locale === 'zh' ? '篇思维手记' : 'Dispatches'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800/80 border border-slate-200/60 dark:border-white/[0.05]">
              <Layers className="w-3.5 h-3.5 text-teal-500" />
              <span>{categories.length} {locale === 'zh' ? '个知识主题' : 'Taxonomies'}</span>
            </span>
          </div>
        </div>

        {/* 2.2 Curated Bento 策展便当盒网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          
          {/* 左主卡: 当期精选焦点手记 (8 列) */}
          {featuredPost ? (
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between overflow-hidden rounded-[2rem] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all duration-300 group p-6 sm:p-8">
              <div className="space-y-6">
                {/* 顶部标签行 */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                      <Flame className="w-3 h-3" />
                      <span>{locale === 'zh' ? '精选代表作' : 'FEATURED ESSAY'}</span>
                    </span>

                    {featuredPost.category && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-muted-foreground text-xs font-mono">
                        {featuredPost.category.name}
                      </span>
                    )}
                  </div>

                  <StardateBadge
                    date={featuredPost.publishedAt || featuredPost.createdAt}
                    logId={featuredPost.id}
                  />
                </div>

                {/* 封面大图 (微视差与 Hover 缩放) */}
                {featuredPost.cover && (
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="block relative w-full h-48 sm:h-64 lg:h-72 overflow-hidden rounded-2xl bg-muted group/cover"
                  >
                    <SafeImage
                      src={featuredPost.cover}
                      alt={featuredPost.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover transform group-hover/cover:scale-105 transition-transform duration-500 ease-out filter brightness-[0.95] dark:brightness-[0.85]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                  </Link>
                )}

                {/* 标题与摘要 */}
                <div className="space-y-3">
                  <Link href={`/blog/${featuredPost.slug}`} className="block">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>
                  </Link>
                  {featuredPost.excerpt && (
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                  )}
                </div>
              </div>

              {/* 底部行动胶囊 */}
              <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                  {featuredPost.readingTime && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-500" />
                      <span>{featuredPost.readingTime} {t.readingTime}</span>
                    </span>
                  )}
                </div>

                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs hover:bg-emerald-600 dark:hover:bg-emerald-400 hover:text-white dark:hover:text-slate-950 transition-all shadow-sm hover:shadow group/btn"
                >
                  <span>{t.readMore}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-7 xl:col-span-8 p-8 rounded-[2rem] bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">暂无置顶手记</p>
            </div>
          )}

          {/* 右侧两张副卡 (4 列) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5 sm:gap-6">
            
            {/* 右上卡: 数字花园与分类雷达 */}
            <div className="flex-1 rounded-[2rem] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Compass className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">
                      {locale === 'zh' ? '数字花园分类雷达' : 'Garden Taxonomies'}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {categories.length} Topics
                  </span>
                </div>

                {/* 分类标签微阵列 */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {categories.slice(0, 8).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/blog?category=${cat.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-emerald-500/10 dark:bg-white/[0.05] dark:hover:bg-emerald-500/20 text-foreground/80 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-white/[0.06] hover:border-emerald-500/30 transition-all group/chip"
                    >
                      <FolderOpen className="w-3 h-3 text-muted-foreground group-hover/chip:text-emerald-500 transition-colors" />
                      <span>{cat.name}</span>
                      {typeof cat.postCount === 'number' && (
                        <span className="text-[10px] font-mono opacity-60">
                          ({cat.postCount})
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-white/[0.06]">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                >
                  <span>{locale === 'zh' ? '查看全部分类' : 'View all topics'}</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 右下卡: 近期最新速递 */}
            <div className="flex-1 rounded-[2rem] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">
                      {locale === 'zh' ? '近期时空脉络' : 'Recent Dispatches'}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Chronology
                  </span>
                </div>

                {/* 2 篇近期手记列表 */}
                <div className="space-y-2.5 pt-1">
                  {recentPosts.length > 0 ? (
                    recentPosts.slice(0, 2).map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group/item block p-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors border border-transparent hover:border-slate-200/60 dark:hover:border-white/[0.06]"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground mb-1">
                          <StardateBadge
                            date={post.publishedAt || post.createdAt}
                            logId={post.id}
                          />
                          {post.readingTime && (
                            <span>{post.readingTime} {t.readingTime}</span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-medium text-foreground group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors line-clamp-1">
                          {post.title}
                        </h4>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">暂无更多近期手记</p>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
                <span className="text-[11px] text-muted-foreground">
                  {locale === 'zh' ? '保持好奇，持续书写与探索' : 'Curated by Hayden Xue'}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
