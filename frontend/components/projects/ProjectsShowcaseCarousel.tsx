'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { Project, PageVisualItem } from '@/lib/types';
import { 
  Sparkles, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Github, 
  Layers, 
  Cpu, 
  Terminal,
  Play,
  Maximize2
} from 'lucide-react';

interface ProjectsShowcaseCarouselProps {
  projects: Project[];
  pageVisual?: PageVisualItem;
  locale: string;
  translations?: {
    badge?: string;
    featuredTag?: string;
    exploreDetails?: string;
    liveDemo?: string;
    sourceCode?: string;
    defaultTitle?: string;
    defaultDesc?: string;
  };
}

/**
 * 全景互动橱窗与作品展台组件 (Interactive Carousel & Lab Showcase)
 * 
 * 核心设计演进：
 * 1. 彻底摆脱“伪单篇文章大巨幕”结构，转为沉浸式全景工程展台；
 * 2. 大画幅作品轮播（支持鼠标悬浮暂停、快捷翻页、指示点与高张力视觉切换）；
 * 3. 交互动作：轻量外链直达 Live Demo 与 GitHub 源码，一键跳转工程详情手记；
 * 4. 融合后台 CMS 视觉背景（作为首屏环境氛围底色与标语），无缝过渡至下方紧凑工程矩阵。
 */
export function ProjectsShowcaseCarousel({
  projects,
  pageVisual,
  locale,
  translations: t,
}: ProjectsShowcaseCarouselProps) {
  // 1. 提取焦点展台展示的项目 (置顶代表作优先，若不足则取前 5 项)
  const showcaseProjects = React.useMemo(() => {
    const featured = projects.filter((p) => p.featured === 1);
    if (featured.length >= 2) return featured;
    return projects.slice(0, Math.min(projects.length, 5));
  }, [projects]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 2. 自动轮播定时器 (悬停时暂停)
  const nextSlide = useCallback(() => {
    if (showcaseProjects.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % showcaseProjects.length);
  }, [showcaseProjects.length]);

  const prevSlide = useCallback(() => {
    if (showcaseProjects.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + showcaseProjects.length) % showcaseProjects.length);
  }, [showcaseProjects.length]);

  useEffect(() => {
    if (isPaused || showcaseProjects.length <= 1) return;
    const interval = setInterval(nextSlide, 6500);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, showcaseProjects.length]);

  // 3. 背景与文案计算
  const hasCustomBg = Boolean(pageVisual?.bgUrl);
  const isVideoBg = hasCustomBg && pageVisual?.bgType === 'video';
  const bgUrl = hasCustomBg ? pageVisual!.bgUrl! : undefined;

  const displayTitle = pageVisual?.customTitle || t?.defaultTitle || (locale === 'zh' ? '开源造物与数字工程' : 'ENGINEERING & ARTIFACTS');
  const displayDesc = pageVisual?.customDesc || t?.defaultDesc || (locale === 'zh' ? '探索站长开源工具、全栈架构系统与智能体数字实验。支持全景橱窗直达 Live Demo。' : 'Explore open-source systems, full-stack architectures, and AI experiments with interactive showcase viewports.');

  const currentProject = showcaseProjects[currentIndex];

  const currentTechs = currentProject?.technologies
    ? currentProject.technologies.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <section 
      className="relative w-full overflow-hidden pt-28 sm:pt-36 pb-12 sm:pb-16 transition-colors duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. 环境光晕氛围层 (Ambient Canvas) */}
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
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl" />
            <div className="absolute top-24 left-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl" />
            <div 
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
              style={{
                backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fbfbfd] dark:from-[#090a0f] to-transparent" />
      </div>

      {/* 2. 前景主体 (1400px 版心) */}
      <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-10">
        
        {/* 2.1 顶部标语与极客工坊指标 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-xl bg-white/80 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-white/[0.08] text-xs font-mono text-foreground/80 shadow-sm">
              <Terminal className="w-3.5 h-3.5 text-teal-500" />
              <span className="font-semibold text-teal-600 dark:text-teal-400">LAB SHOWCASE</span>
              <span className="opacity-40">/</span>
              <span>HAYDEN XUE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.2]">
              {displayTitle}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal max-w-2xl">
              {displayDesc}
            </p>
          </div>

          {/* 状态指标徽标 */}
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800/80 border border-slate-200/60 dark:border-white/[0.05]">
              <Cpu className="w-3.5 h-3.5 text-teal-500" />
              <span>{projects.length} {locale === 'zh' ? '项开源造物' : 'Artifacts'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800/80 border border-slate-200/60 dark:border-white/[0.05]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>{showcaseProjects.length} {locale === 'zh' ? '部精选旗舰' : 'Featured'}</span>
            </span>
          </div>
        </div>

        {/* 2.2 全景互动橱窗轮播卡片 (Showcase Carousel) */}
        {showcaseProjects.length > 0 && currentProject && (
          <div className="relative group/carousel overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg hover:shadow-2xl transition-all duration-300">
            
            {/* 展台内容容器：左右分屏或通栏大画幅 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px] sm:min-h-[480px] lg:min-h-[500px]">
              
              {/* 左翼信息区 (5 列) */}
              <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6 z-10">
                <div className="space-y-4">
                  {/* 顶栏元信息 */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-xs font-semibold font-mono">
                      FLAGSHIP №0{currentIndex + 1}
                    </span>
                    <StardateBadge
                      date={currentProject.createdAt}
                      logId={currentProject.id}
                    />
                  </div>

                  {/* 作品主标题 */}
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                    {currentProject.name}
                  </h2>

                  {/* 作品长短描述 */}
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-4">
                    {currentProject.description}
                  </p>

                  {/* 技术栈徽标阵列 */}
                  {currentTechs.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {currentTechs.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-100 dark:bg-white/[0.05] text-foreground/80 border border-slate-200/60 dark:border-white/[0.06]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 底部交互直达操作条 */}
                <div className="pt-6 border-t border-slate-200/60 dark:border-white/[0.06] flex flex-wrap items-center gap-3">
                  {/* 详情与架构手记 */}
                  <Link
                    href={`/projects/${currentProject.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs sm:text-sm hover:bg-teal-600 dark:hover:bg-teal-400 hover:text-white dark:hover:text-slate-950 transition-all shadow-sm hover:shadow group/btn"
                  >
                    <span>{t?.exploreDetails || (locale === 'zh' ? '探索工程架构' : 'Explore Spec')}</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* Live Demo 直达 */}
                  {currentProject.demoUrl && (
                    <a
                      href={currentProject.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-medium text-xs sm:text-sm transition-all shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t?.liveDemo || (locale === 'zh' ? '实时体验' : 'Live Demo')}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </a>
                  )}

                  {/* GitHub 仓库直达 */}
                  {currentProject.githubUrl && (
                    <a
                      href={currentProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-foreground/80 border border-slate-200/60 dark:border-white/[0.06] transition-colors"
                      title={locale === 'zh' ? '开源仓库' : 'GitHub Repository'}
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* 右翼大画幅展台视窗 (7 列) */}
              <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[340px] lg:min-h-full overflow-hidden bg-slate-950/20 dark:bg-black/40">
                {currentProject.cover ? (
                  <div className="relative w-full h-full group/cover">
                    <SafeImage
                      src={currentProject.cover}
                      alt={currentProject.name}
                      containerClassName="w-full h-full min-h-[300px]"
                      className="w-full h-full object-cover object-center filter brightness-[0.92] dark:brightness-[0.80] group-hover/cover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* 氛围渐变边缘 */}
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-white/90 dark:from-[#090a0f]/90 via-transparent to-transparent opacity-90 lg:opacity-80" />
                  </div>
                ) : (
                  <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-gradient-to-br from-teal-950/30 via-slate-900/40 to-slate-950/80">
                    <div 
                      className="absolute inset-0 opacity-20 pointer-events-none" 
                      style={{
                        backgroundImage: 'radial-gradient(rgba(20, 184, 166, 0.4) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }}
                    />
                    <div className="text-center space-y-2 p-6 z-10">
                      <Cpu className="w-12 h-12 text-teal-400/60 mx-auto" />
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        Full-Stack Architecture Spec
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* 左右翻页控制器 */}
            {showcaseProjects.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous Slide"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-md flex items-center justify-center text-foreground hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next Slide"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-md flex items-center justify-center text-foreground hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* 底部指示器条 */}
                <div className="absolute bottom-4 left-6 sm:left-10 flex items-center gap-2 z-20">
                  {showcaseProjects.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentIndex
                          ? 'w-8 bg-teal-500'
                          : 'w-2 bg-slate-300 dark:bg-neutral-700 hover:bg-slate-400 dark:hover:bg-neutral-500'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

          </div>
        )}

      </div>
    </section>
  );
}
