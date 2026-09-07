'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n-client';
import { Post, Memo, Journey, LifePulseState } from '@/lib/types';
import { TiltCard } from './TiltCard';
import { CosmosGraph } from './CosmosGraph';
import { LifePulseCard } from './LifePulseCard';
import { SafeImage } from '@/components/SafeImage';
import { BookOpen, Compass, Camera, Sparkles, ArrowRight, Clock, MapPin } from 'lucide-react';

interface BentoGridProps {
  featuredPost?: Post | null;
  latestMemo?: Memo | null;
  latestJourney?: Journey | null;
  pulseData?: LifePulseState | null;
}

export function BentoGrid({
  featuredPost,
  latestMemo,
  latestJourney,
  pulseData,
}: BentoGridProps) {
  const { locale, t } = useTranslation();

  return (
    <section className="relative space-y-6 pt-2 pb-8">
      {/* 模块标题 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('bento.badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t('bento.title')}
          </h2>
        </div>
      </div>

      {/* Bento Grid 布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. 思维引力星图 (Cosmos Graph) - 占 7 列 */}
        <div className="lg:col-span-7">
          <TiltCard maxTilt={5}>
            <CosmosGraph />
          </TiltCard>
        </div>

        {/* 2. 站长实时心跳 (Life Pulse) - 占 5 列 */}
        <div className="lg:col-span-5">
          <TiltCard maxTilt={6}>
            <LifePulseCard pulseData={pulseData} />
          </TiltCard>
        </div>

        {/* 3. 精选深度思想洞察 - 占 4 列 */}
        <div className="lg:col-span-4">
          <TiltCard maxTilt={7}>
            <Link
              href={featuredPost ? `/blog/${featuredPost.slug}` : '/blog'}
              className="group relative flex flex-col justify-between h-[280px] rounded-3xl bg-card border border-border/80 p-6 overflow-hidden hover:border-emerald-500/50 transition-all duration-300 block shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono text-emerald-500 font-semibold">
                    <BookOpen className="w-3.5 h-3.5" />
                    {t('bento.featured_title')}
                  </span>
                  {featuredPost?.maturity && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary font-medium">
                      {featuredPost.maturity === 'EVERGREEN' ? '🌲 常青' : featuredPost.maturity === 'SEEDLING' ? '🌱 萌芽' : '🌿 生长'}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors line-clamp-2">
                  {featuredPost ? featuredPost.title : (locale === 'en' ? 'Reflections on Clean Architecture & AI Agents' : '关于整洁系统架构与 AI 智能体的长效思考')}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {featuredPost?.excerpt || (locale === 'en' ? 'Explore technical insights on Java 21, reactive design patterns, and modern Web engineering.' : '探索关于 Java 21、响应式设计范式与现代 Web 前沿工程的技术手记。')}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-border/50 text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {featuredPost?.readingTime || 5} min
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-500 group-hover:translate-x-1 transition-transform">
                  {t('bento.view_detail')}
                </span>
              </div>
            </Link>
          </TiltCard>
        </div>

        {/* 4. 即时灵感拍立得相纸窥镜 - 占 4 列 */}
        <div className="lg:col-span-4">
          <TiltCard maxTilt={7}>
            <Link
              href="/memos"
              className="group relative flex flex-col justify-between h-[280px] rounded-3xl bg-card border border-border/80 p-6 overflow-hidden hover:border-cyan-500/50 transition-all duration-300 block shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono text-cyan-500 font-semibold">
                    <Camera className="w-3.5 h-3.5" />
                    {t('bento.memo_peek')}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                    POLAROID 3D
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/40 text-xs text-foreground/90 italic leading-relaxed line-clamp-4">
                  “{latestMemo?.content || (locale === 'en' ? '“From the East, toward the unknown.” Keep curious and voyage to new horizons.' : '“From the East, toward the unknown.” 永远保持好奇心，向未知的边界不断航行。')}”
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-border/50 text-muted-foreground font-mono">
                <span>{latestMemo?.createdAt?.split('T')[0] || '2026-09-07'}</span>
                <span className="inline-flex items-center gap-1 text-cyan-500 group-hover:translate-x-1 transition-transform">
                  {t('bento.view_detail')}
                </span>
              </div>
            </Link>
          </TiltCard>
        </div>

        {/* 5. 全球足迹 3D 航海入口 - 占 4 列 */}
        <div className="lg:col-span-4">
          <TiltCard maxTilt={7}>
            <Link
              href="/journey"
              className="group relative flex flex-col justify-between h-[280px] rounded-3xl bg-card border border-border/80 p-6 overflow-hidden hover:border-violet-500/50 transition-all duration-300 block shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono text-violet-500 font-semibold">
                    <Compass className="w-3.5 h-3.5" />
                    {t('bento.voyage_preview')}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    3D GLOBE
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-violet-400 transition-colors">
                    {latestJourney ? `${latestJourney.city}, ${latestJourney.country}` : 'Tokyo & Kyoto, Japan'}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {latestJourney?.description || (locale === 'en' ? 'Interactive 3D WebGL voyage globe with realistic coordinates and city photography.' : '交互式 3D WebGL 航海地球仪，包含真实经纬度航线与旅行摄影。')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-border/50 text-muted-foreground font-mono">
                <span className="flex items-center gap-1 text-rose-500">
                  <MapPin className="w-3 h-3" />
                  {latestJourney?.city || 'Tokyo'}
                </span>
                <span className="inline-flex items-center gap-1 text-violet-500 group-hover:translate-x-1 transition-transform">
                  {t('bento.view_detail')}
                </span>
              </div>
            </Link>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
