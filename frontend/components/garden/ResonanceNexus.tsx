'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, MapPin, BookOpen, Layers, ArrowUpRight, Sparkles } from 'lucide-react';
import { Post, Journey, Project } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { useI18n } from '@/lib/i18n';

interface ResonanceNexusProps {
  currentType: 'POST' | 'JOURNEY' | 'PROJECT';
  journeys?: Journey[];
  posts?: Post[];
  projects?: Project[];
  variant?: 'full' | 'sidebar';
}

export function ResonanceNexus({
  currentType,
  journeys = [],
  posts = [],
  projects = [],
  variant = 'full',
}: ResonanceNexusProps) {
  const { t } = useI18n();

  const hasJourneys = journeys.length > 0;
  const hasPosts = posts.length > 0;
  const hasProjects = projects.length > 0;

  // 如果没有任何关联数据，保持静默优雅，不显示突兀空白
  if (!hasJourneys && !hasPosts && !hasProjects) {
    return null;
  }

  // 侧边栏紧凑模式 (Sidebar Companion)
  if (variant === 'sidebar') {
    return (
      <div className="p-4 sm:p-5 rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-foreground uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('resonance.badge')}</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/80">NEXUS</span>
        </div>

        {/* 同频行旅 (当非行旅页且存在行旅时展示) */}
        {hasJourneys && currentType !== 'JOURNEY' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-teal-500" />
                <span>{t('resonance.journeys_title')}</span>
              </span>
              <Link href="/journey" className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {journeys.slice(0, 1).map((j) => (
              <Link
                key={j.id}
                href={`/journey/${j.slug}`}
                className="group flex items-center gap-3 p-2 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors"
              >
                {j.cover && (
                  <SafeImage
                    src={j.cover}
                    alt={j.title}
                    aspectRatio="1/1"
                    containerClassName="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-semibold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 truncate">
                    {j.title}
                  </h5>
                  <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-teal-500" />
                    <span>{j.city}, {j.country}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 关联手记/博文 (当非博文页且存在博文时展示) */}
        {hasPosts && currentType !== 'POST' && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('resonance.posts_title')}</span>
              </span>
              <Link href="/blog" className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {posts.slice(0, 1).map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group flex items-center gap-3 p-2 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors"
              >
                {p.cover && (
                  <SafeImage
                    src={p.cover}
                    alt={p.title}
                    aspectRatio="1/1"
                    containerClassName="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                    {p.title}
                  </h5>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {p.excerpt || p.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 关联造物 (当非造物页且存在造物时展示) */}
        {hasProjects && currentType !== 'PROJECT' && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>{t('resonance.projects_title')}</span>
              </span>
              <Link href="/projects" className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {projects.slice(0, 1).map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.slug}`}
                className="group flex items-center gap-3 p-2 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors"
              >
                {p.cover && (
                  <SafeImage
                    src={p.cover}
                    alt={p.name}
                    aspectRatio="1/1"
                    containerClassName="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 truncate">
                    {p.name}
                  </h5>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {p.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-6 pt-10 pb-6 border-t border-border">
      {/* 1. 思维回响 Header 栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>{t('resonance.badge')}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t('resonance.title')}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {t('resonance.desc')}
          </p>
        </div>

        <span className="hidden md:inline-block text-[11px] font-mono text-muted-foreground/70 px-3 py-1 rounded-lg bg-secondary/50 border border-border/50">
          GARDEN // BIDIRECTIONAL MESH
        </span>
      </div>

      {/* 2. 节点网格容器 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 分支 A: 如果当前是博文，展示【同频行旅与风物记忆】 */}
        {currentType === 'POST' && hasJourneys && (
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4 hover:border-teal-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Compass className="w-4 h-4 text-teal-500" />
                <span>{t('resonance.journeys_title')}</span>
              </div>
              <Link
                href="/journey"
                className="text-xs font-mono text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
              >
                <span>{t('resonance.explore')}</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {journeys.slice(0, 2).map((journey) => (
                <Link
                  key={journey.id}
                  href={`/journey/${journey.slug}`}
                  className="flex items-center gap-3.5 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors"
                >
                  {journey.cover && (
                    <SafeImage
                      src={journey.cover}
                      alt={journey.title}
                      aspectRatio="1/1"
                      containerClassName="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-teal-500 transition-colors">
                        {journey.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-500/80" />
                        {journey.city}, {journey.country}
                      </span>
                      {journey.startDate && (
                        <span className="hidden sm:inline-block">· {journey.startDate}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 分支 B: 如果当前是行旅，展示【同期的深度手记与思考】 */}
        {currentType === 'JOURNEY' && hasPosts && (
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>{t('resonance.posts_title')}</span>
              </div>
              <Link
                href="/blog"
                className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                <span>{t('resonance.explore')}</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {posts.slice(0, 2).map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="flex items-center gap-3.5 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors"
                >
                  {post.cover ? (
                    <SafeImage
                      src={post.cover}
                      alt={post.title}
                      aspectRatio="1/1"
                      containerClassName="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-emerald-500 transition-colors">
                      {post.title}
                    </span>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {post.excerpt || post.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 共享分支: 关联的【工程实践与实战造物】 */}
        {hasProjects && (
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4 hover:border-cyan-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>{t('resonance.projects_title')}</span>
              </div>
              <Link
                href="/projects"
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                <span>{t('resonance.explore')}</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {projects.slice(0, 2).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="flex items-center gap-3.5 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors"
                >
                  {project.cover ? (
                    <SafeImage
                      src={project.cover}
                      alt={project.name}
                      aspectRatio="1/1"
                      containerClassName="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 border border-cyan-500/20">
                      <Layers className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-cyan-500 transition-colors">
                      {project.name}
                    </span>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 font-mono">
                      {project.technologies || project.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
