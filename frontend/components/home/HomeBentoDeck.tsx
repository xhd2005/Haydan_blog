'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ArrowUpRight, 
  Clock, 
  Heart, 
  MapPin, 
  Sparkles, 
  Languages,
  BookOpen
} from 'lucide-react';
import { Post, Project, Journey, SiteSetting } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { VisaStamp } from '@/components/journey/VisaStamp';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/motion-primitives';
import { ScrollLevitationCard } from '@/components/ui/ScrollLevitationCard';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { useI18n } from '@/lib/i18n';

interface HomeBentoDeckProps {
  latestPosts: Post[];
  featuredProjects: Project[];
  latestJourneys: Journey[];
  settings: SiteSetting | null;
}

/**
 * 液体玻璃卡片基座 (Liquid Glass Card with Specular Reflection)
 * 具备双层高光边框、inset 晶莹内倒角与鼠标水光漫反射微动效
 */
export function LiquidGlassCard({
  children,
  className = '',
  glowColor = 'rgba(16, 185, 129, 0.15)',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: -1000, y: -1000 });
      }}
      onClick={onClick}
      className={`liquid-glass-card group relative rounded-3xl transition-all duration-500 ${className}`}
    >
      {/* 1. 顶部发丝级极细白微光倒角 */}
      <div 
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/25 to-transparent z-20" 
        aria-hidden="true" 
      />

      {/* 2. 鼠标实时跟随的水光漫反射图层 (Liquid Specular Sheen) */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300 rounded-3xl"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(420px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 65%)`,
        }}
        aria-hidden="true"
      />

      {/* 3. 浅色模式下白瓷边缘环境光 */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_24px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_0_24px_rgba(255,255,255,0.04)] z-10" 
        aria-hidden="true" 
      />

      {children}
    </div>
  );
}

export function HomeBentoDeck({
  latestPosts,
  featuredProjects,
  latestJourneys,
  settings,
}: HomeBentoDeckProps) {
  const { locale, t } = useI18n();

  const primaryPost = latestPosts[0];
  const secondaryPosts = latestPosts.slice(1, 3);

  return (
    <div className="w-full space-y-20 sm:space-y-28">
      {/* =========================================================================
          SECTION 1: 深度思考与前沿创想 (Latest Thoughts / Writing) - 非对称 Bento
          ========================================================================= */}
      <section className="space-y-7">
        <Reveal>
          <div className="flex items-end justify-between border-b border-border/80 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-xs uppercase font-mono tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                  {t('home.section_writing')}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t('home.latest_thoughts')}
              </h2>
            </div>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium backdrop-blur-md bg-secondary/80 hover:bg-secondary border border-border/70 text-slate-800 dark:text-slate-200 transition-all duration-300 hover:shadow-xs hover:border-emerald-500/40"
            >
              <span>{t('home.view_all_posts')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        {latestPosts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* 左侧 7 栅格：首篇主推深度大卡 (Panoramic Featured Hero Card) */}
            {primaryPost && (
              <div className="lg:col-span-7 h-full">
                <ScrollLevitationCard index={0} glowColor="rgba(16, 185, 129, 0.22)">
                  <LiquidGlassCard glowColor="rgba(16, 185, 129, 0.25)" className="h-full flex flex-col">
                    <Link href={`/blog/${primaryPost.slug}`} className="flex flex-col h-full flex-1">
                      {/* 大景深封面图 */}
                      {primaryPost.cover ? (
                        <div className="relative overflow-hidden w-full aspect-[16/9] sm:aspect-[21/10] rounded-t-3xl">
                          <SafeImage
                            src={primaryPost.cover}
                            alt={primaryPost.title}
                            aspectRatio="16/9"
                            containerClassName="w-full h-full"
                            className="transition-transform duration-[1.2s] ease-out group-hover:scale-105 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />

                          {/* 浮动标签区 */}
                          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20">
                            {primaryPost.category && (
                              <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-medium text-xs">
                                {primaryPost.category.name}
                              </span>
                            )}
                            {locale === 'en' && primaryPost.lang === 'zh' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/90 text-white backdrop-blur-md">
                                <Languages className="w-3 h-3" />
                                <span>ZH / 中文</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* 卡片正文区 */}
                      <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <StardateBadge date={primaryPost.publishedAt} logId={primaryPost.id} />
                            <span className="flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-emerald-500" />
                              {primaryPost.readingTime} {t('home.min_read')}
                            </span>
                          </div>

                          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                            {primaryPost.title}
                          </h3>

                          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                            {primaryPost.excerpt || t('home.read_excerpt')}
                          </p>
                        </div>

                        {/* 底部互动行动区 */}
                        <div className="pt-4 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                            {primaryPost.likeCount > 0 && (
                              <span className="flex items-center gap-1 text-rose-500 font-medium">
                                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                                {primaryPost.likeCount}
                              </span>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                            <span>{t('home.read_more')}</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </LiquidGlassCard>
                </ScrollLevitationCard>
              </div>
            )}

            {/* 右侧 5 栅格：2 篇纵向精致卡 (Stacked Magazine Cards) */}
            <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
              {secondaryPosts.map((post, idx) => (
                <div key={post.id} className="flex-1">
                  <ScrollLevitationCard index={idx + 1} glowColor="rgba(16, 185, 129, 0.18)">
                    <LiquidGlassCard glowColor="rgba(16, 185, 129, 0.2)" className="h-full">
                      <Link href={`/blog/${post.slug}`} className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
                        <div className="flex items-start gap-4">
                          {/* 封面缩略图 */}
                          {post.cover && (
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-200/70 dark:border-white/10 shadow-xs">
                              <SafeImage
                                src={post.cover}
                                alt={post.title}
                                aspectRatio="1/1"
                                containerClassName="w-full h-full"
                                className="transition-transform duration-700 ease-out group-hover:scale-105 object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <StardateBadge date={post.publishedAt} logId={post.id} />
                              {post.category && (
                                <span className="px-2 py-0.5 rounded-md bg-secondary text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-border/40">
                                  {post.category.name}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                              {post.title}
                            </h4>

                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              {post.excerpt || t('home.read_excerpt')}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            {post.readingTime} {t('home.min_read')}
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                            <span>{t('home.read_more')}</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    </LiquidGlassCard>
                  </ScrollLevitationCard>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 border border-dashed border-border rounded-3xl">
            {t('blog.empty')}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 2: 匠心造物与精选工程 (Featured Projects) - 宽幅双列 Bento
          ========================================================================= */}
      <section className="space-y-7">
        <Reveal>
          <div className="flex items-end justify-between border-b border-border/80 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_#14b8a6]" />
                <span className="text-xs uppercase font-mono tracking-widest text-teal-600 dark:text-teal-400 font-bold">
                  {t('home.section_creations')}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t('home.featured_projects')}
              </h2>
            </div>
            <Link
              href="/projects"
              className="group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium backdrop-blur-md bg-secondary/80 hover:bg-secondary border border-border/70 text-slate-800 dark:text-slate-200 transition-all duration-300 hover:shadow-xs hover:border-teal-500/40"
            >
              <span>{t('home.view_all_projects')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <RevealStagger className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredProjects.length > 0 ? (
            featuredProjects.map((proj, idx) => (
              <RevealItem key={proj.id} className="h-full">
                <ScrollLevitationCard index={idx} glowColor="rgba(20, 184, 166, 0.22)">
                  <LiquidGlassCard glowColor="rgba(20, 184, 166, 0.25)" className="h-full flex flex-col">
                    {/* 项目封面 */}
                    {proj.cover && (
                      <div className="relative overflow-hidden w-full aspect-[16/9] rounded-t-3xl">
                        <SafeImage
                          src={proj.cover}
                          alt={proj.name}
                          aspectRatio="16/9"
                          containerClassName="w-full h-full"
                          className="transition-transform duration-[1.2s] ease-out group-hover:scale-105 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                        {/* 状态徽章 */}
                        <div className="absolute top-3.5 right-3.5 z-20">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-black/60 text-teal-300 backdrop-blur-md border border-teal-400/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                            {proj.status || 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 项目内容详情 */}
                    <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <StardateBadge date={proj.createdAt} logId={proj.id} />
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {proj.name}
                        </h3>

                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                          {proj.description}
                        </p>

                        {/* 技术栈胶囊 */}
                        {proj.technologies && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {proj.technologies.split(',').slice(0, 4).map((tech) => (
                              <span
                                key={tech}
                                className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100/90 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-mono border border-slate-200/80 dark:border-white/[0.08]"
                              >
                                {tech.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 底部行动栏：案例详情 + 实时演示 */}
                      <div className="pt-4 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between">
                        <Link
                          href={`/projects/${proj.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                        >
                          <span>{t('home.case_study')}</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>

                        {proj.demoUrl && (
                          <a
                            href={proj.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-400 hover:bg-teal-500/20 border border-teal-500/25 transition-all"
                          >
                            <span>Live Demo</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </LiquidGlassCard>
                </ScrollLevitationCard>
              </RevealItem>
            ))
          ) : (
            <div className="col-span-2 py-12 text-center text-slate-500 border border-dashed border-border rounded-3xl">
              {locale === 'en' ? 'Selected works are being curated. Stay tuned.' : '精选作品正在打磨中，敬请期待。'}
            </div>
          )}
        </RevealStagger>
      </section>

      {/* =========================================================================
          SECTION 3: 寰宇漫游与旅行足迹 (Travel Footprints) - 航海登机牌 / 拍立得画卷
          ========================================================================= */}
      <section className="space-y-7">
        <Reveal>
          <div className="flex items-end justify-between border-b border-border/80 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]" />
                <span className="text-xs uppercase font-mono tracking-widest text-cyan-700 dark:text-cyan-400 font-bold">
                  {t('home.section_exploration')}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t('home.journey_preview')}
              </h2>
            </div>
            <Link
              href="/journey"
              className="group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium backdrop-blur-md bg-secondary/80 hover:bg-secondary border border-border/70 text-slate-800 dark:text-slate-200 transition-all duration-300 hover:shadow-xs hover:border-cyan-500/40"
            >
              <span>{t('home.view_all_journeys')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <RevealStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestJourneys.length > 0 ? (
            latestJourneys.slice(0, 3).map((j, idx) => (
              <RevealItem key={j.id} className="h-full">
                <ScrollLevitationCard index={idx} glowColor="rgba(6, 182, 212, 0.22)">
                  <LiquidGlassCard glowColor="rgba(6, 182, 212, 0.25)" className="h-full flex flex-col">
                    <Link href={`/journey/${j.slug}`} className="flex flex-col h-full justify-between">
                      {/* 航海登机牌顶栏 */}
                      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02]">
                        <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                          <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>{j.country} · {j.city}</span>
                        </span>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 dark:text-slate-500">
                          VOYAGE #{j.id}
                        </span>
                      </div>

                      {/* 拍立得 4/3 大图 + 真实印章 */}
                      {j.cover && (
                        <div className="relative overflow-hidden w-full aspect-[4/3]">
                          <SafeImage
                            src={j.cover}
                            alt={j.title}
                            aspectRatio="4/3"
                            containerClassName="w-full h-full"
                            className="transition-transform duration-[1.2s] ease-out group-hover:scale-105 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                          {/* 极富旅行记忆的签证印章 */}
                          <VisaStamp
                            city={j.city}
                            country={j.country}
                            year={j.startDate?.slice(0, 4)}
                            className="absolute top-2.5 right-2.5 z-20"
                          />
                        </div>
                      )}

                      {/* 游记文案 */}
                      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between space-y-3">
                        <div className="space-y-2">
                          <StardateBadge date={j.startDate} logId={j.id} />
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                            {j.title}
                          </h3>
                          {j.description && (
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              {j.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                          <span>{t('home.view_travelogue')}</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  </LiquidGlassCard>
                </ScrollLevitationCard>
              </RevealItem>
            ))
          ) : (
            <div className="col-span-3 py-12 text-center text-slate-500 border border-dashed border-border rounded-3xl">
              {locale === 'en' ? 'The first voyage is being written. Footprints will appear here soon.' : '第一段旅程正在书写中，足迹即将点亮这里。'}
            </div>
          )}
        </RevealStagger>
      </section>

      {/* =========================================================================
          SECTION 4: 站长档案 (About Hayden Xue) - 极客流光液态玻璃大底座
          ========================================================================= */}
      <Reveal>
        <LiquidGlassCard glowColor="rgba(16, 185, 129, 0.18)" className="p-8 sm:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            {/* 极光渐变描边头像与呼吸探活灯 */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 opacity-60 blur-md" aria-hidden="true" />
              <SafeImage
                src={settings?.avatar || DEFAULT_AVATAR}
                alt="Hayden Xue Avatar"
                aspectRatio="1/1"
                containerClassName="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-background shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background shadow-[0_0_8px_#10b981]" />
              </span>
            </div>

            <div className="space-y-4 flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>ONLINE · EXPLORING & CRAFTING</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t('home.hey_intro')} Hayden Xue
              </h2>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base max-w-2xl">
                {locale === 'en' 
                  ? (settings?.aboutBioEn || (settings?.bio && !settings.bio.includes('我相信代码') ? settings.bio : t('home.about_bio_default')))
                  : (settings?.aboutBioZh || settings?.bio || t('home.about_bio_default'))}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-95 transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  <span>{t('home.about_me_link')}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </LiquidGlassCard>
      </Reveal>
    </div>
  );
}
