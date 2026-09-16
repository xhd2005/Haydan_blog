import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { Post } from '@/lib/types';
import { normalizeMediaUrl } from '@/lib/media-url';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  Sparkles 
} from 'lucide-react';

interface ArticleFullBleedHeroProps {
  post: Post;
  locale: string;
  formattedDate: string;
  translations: {
    backBlog: string;
    readingTime: string;
    views: string;
  };
}

/**
 * 通栏全景电影首屏组件 (100vw Cinematic Full-bleed Hero)
 * 
 * 严格对齐与黄金重心排版：
 * 1. 标题垂直位置上浮至约 45% 黄金分割带，视野开阔通透；
 * 2. 内部文字与下方正文、评论区严格共享 max-w-[1400px] 版心与 max-w-[860px] 左对齐基准线；
 * 3. 100vw 封面大图铺满背景，文字对比度极高，沉浸感拉满。
 */
export function ArticleFullBleedHero({
  post,
  locale,
  formattedDate,
  translations: t,
}: ArticleFullBleedHeroProps) {
  const coverUrl = normalizeMediaUrl(post.cover);

  return (
    <section className="relative w-full min-h-[540px] sm:min-h-[640px] lg:min-h-[720px] flex flex-col justify-center overflow-hidden pt-36 sm:pt-44 lg:pt-48 pb-20 sm:pb-28">
      {/* 1. 100vw 全幅高清封面背景层 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {coverUrl ? (
          <div className="relative w-full h-full">
            <SafeImage
              src={coverUrl}
              alt={post.title}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover filter brightness-[0.88] dark:brightness-[0.62] saturate-[1.08] scale-105"
            />
            {/* 电影质感微膜：浅色通透明朗，深色沉浸深邃 */}
            <div className="absolute inset-0 bg-black/20 dark:bg-black/55 pointer-events-none transition-colors duration-300" />
            {/* 径向暗角：浅色保持轻盈微暗角，深色强化四周环境包围感 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.35)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
          </div>
        ) : (
          /* 无封面时的数字网格深空渐变背景 */
          <div className="relative w-full h-full bg-gradient-to-b from-emerald-950/60 via-slate-900 to-[#090a0f]">
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none" 
              style={{
                backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.4) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>
        )}

        {/* 移除了原本容易在浅色模式产生灰白雾气的底部渐变层，完美交由下方的白瓷画卷 Sheet 向上微重叠切入 */}
      </div>

      {/* 2. 前景文字排版区 (严格同轴版心：与下方正文左侧绝对对齐) */}
      <div className="relative z-20 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 text-white select-none">
        <div className="max-w-[980px] space-y-5 sm:space-y-6">
          {/* 返回文章列表按钮 */}
          <div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/20 text-xs font-mono font-medium text-white transition-all duration-300 group shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-emerald-300" />
              <span>{t.backBlog}</span>
            </Link>
          </div>

          {/* 核心元信息徽标条 */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="px-3 py-1 rounded-full backdrop-blur-md bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 font-semibold border border-emerald-400/30 transition-colors shadow-sm"
              >
                {post.category.name}
              </Link>
            )}

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-black/40 border border-white/15 text-white/85 font-mono">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formattedDate}</span>
            </div>

            <StardateBadge date={post.publishedAt || post.createdAt} logId={post.id} />

            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-black/40 border border-white/15 text-white/85 font-mono">
              <Clock className="w-3.5 h-3.5 text-teal-300" />
              <span>{post.readingTime} {t.readingTime}</span>
            </div>

            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-black/40 border border-white/15 text-white/85 font-mono">
              <Eye className="w-3.5 h-3.5 text-cyan-300" />
              <span>{post.viewCount} {t.views}</span>
            </div>
          </div>

          {/* 文章大标题 (像素级同轴左对齐，大字号、高张力) */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] drop-shadow-md">
            {post.title}
          </h1>

          {/* 导言摘要 (同轴左对齐) */}
          {post.excerpt && (
            <p className="text-base sm:text-xl text-white/90 max-w-3xl leading-relaxed font-normal italic border-l-2 border-emerald-400 pl-4 py-0.5 drop-shadow-sm">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
