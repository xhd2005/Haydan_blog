'use client';

import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { Project, PageVisualItem } from '@/lib/types';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Github, 
  Layers, 
  Code2, 
  ExternalLink,
  Cpu
} from 'lucide-react';

interface ProjectsListHeroProps {
  featuredProject?: Project;
  pageVisual?: PageVisualItem;
  locale: string;
  onOpenSandbox?: (project: Project) => void;
  translations?: {
    badge?: string;
    featuredTag?: string;
    exploreDetails?: string;
    liveDemo?: string;
    defaultTitle?: string;
    defaultDesc?: string;
  };
}

/**
 * 项目作品列表页 100vw 通栏全景电影首屏组件 (Full-bleed Projects List Editorial Hero)
 * 
 * 核心设计特征：
 * 1. 100vw 全幅巨幕背景（优先读取后台设置中为【开源造物】配置的图片/视频背景，未配置时智能回退置顶代表作大图），浅色通透明快，深色深邃沉浸；
 * 2. 彻底移除产生死白雾气的死板边框，由下方白瓷画卷 Sheet 向上微重叠自然切入；
 * 3. 严格共享 max-w-[1400px] 版心轴与 max-w-[980px] 左对齐基准线；
 * 4. 黄金重心呈现精选代表作标题、技术栈徽标、导言以及【探索作品详情】与【Live Sandbox】直达胶囊。
 */
export function ProjectsListHero({
  featuredProject,
  pageVisual,
  locale,
  onOpenSandbox,
  translations,
}: ProjectsListHeroProps) {
  const hasCustomBg = Boolean(pageVisual?.bgUrl);
  const isVideoBg = hasCustomBg && pageVisual?.bgType === 'video';
  const coverUrl = hasCustomBg ? pageVisual!.bgUrl! : featuredProject?.cover;

  const displayTitle = pageVisual?.customTitle || featuredProject?.name || translations?.defaultTitle || (locale === 'zh' ? '开源造物与数字工程' : 'ENGINEERING & ARTIFACTS');
  const displayDesc = pageVisual?.customDesc || featuredProject?.description || translations?.defaultDesc || (locale === 'zh' ? '探索站长开源工具、全栈架构系统与智能体数字实验。支持 3D 视差解构与实时 Live Demo 沙盒。' : 'Explore open-source systems, full-stack architectures, and AI experiments with 3D deconstruction and live demo viewports.');

  const techs = featuredProject?.technologies 
    ? featuredProject.technologies.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

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
            className="w-full h-full object-cover filter brightness-[0.88] dark:brightness-[0.60] saturate-[1.08] scale-105"
            src={coverUrl}
          />
        ) : coverUrl ? (
          <div className="relative w-full h-full">
            <SafeImage
              src={coverUrl}
              alt={displayTitle}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover filter brightness-[0.88] dark:brightness-[0.60] saturate-[1.08] scale-105"
            />
            {/* 电影质感微膜：浅色通透明朗，深色沉浸深邃 */}
            <div className="absolute inset-0 bg-black/25 dark:bg-black/60 pointer-events-none transition-colors duration-300" />
            {/* 径向暗角：浅色保持轻盈微暗角，深色强化四周环境包围感 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.35)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
          </div>
        ) : (
          /* 无背景时的数字花园全栈工程深空芯片渐变背景 */
          <div className="relative w-full h-full bg-gradient-to-b from-teal-950/70 via-slate-900 to-[#090a0f]">
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none" 
              style={{
                backgroundImage: 'radial-gradient(rgba(20, 184, 166, 0.4) 1px, transparent 1px)',
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
            <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
            <span>{translations?.badge || (locale === 'en' ? 'PORTFOLIO SHOWCASE // 3D DECONSTRUCT' : 'PORTFOLIO SHOWCASE // 全栈架构与开源造物')}</span>
          </div>

          {/* 核心元信息徽标条 */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            {featuredProject && (
              <span className="px-3 py-1 rounded-full backdrop-blur-md bg-teal-500/30 border border-teal-400/40 text-teal-200 font-semibold shadow-sm flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>{translations?.featuredTag || (locale === 'zh' ? '精选代表作' : 'FEATURED WORK')}</span>
              </span>
            )}

            {featuredProject?.status && (
              <span className="px-3 py-1 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white/90 font-mono">
                {featuredProject.status.toUpperCase()}
              </span>
            )}

            {featuredProject && (
              <StardateBadge
                date={featuredProject.createdAt}
                logId={featuredProject.id}
                className="backdrop-blur-md bg-white/10 border-white/20 text-white/90"
              />
            )}
          </div>

          {/* 核心大标题 */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] drop-shadow-md">
            {displayTitle}
          </h1>

          {/* 项目核心理念/自述导言 */}
          <div className="border-l-2 border-teal-400/80 pl-4 sm:pl-5">
            <p className="text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-3xl font-normal drop-shadow-sm">
              {displayDesc}
            </p>
          </div>

          {/* 技术栈标签阵列 */}
          {techs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {techs.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono backdrop-blur-md bg-white/15 border border-white/20 text-white/90 shadow-xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* 核心行动胶囊按钮组 */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            {featuredProject ? (
              <>
                <Link
                  href={`/projects/${featuredProject.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-neutral-950 font-semibold text-xs sm:text-sm hover:bg-neutral-100 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20 group cursor-pointer"
                >
                  <span>{translations?.exploreDetails || (locale === 'zh' ? '探索作品解构' : 'Explore Architecture')}</span>
                  <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:translate-x-1 transition-transform" />
                </Link>

                {featuredProject.demoUrl && onOpenSandbox && (
                  <button
                    type="button"
                    onClick={() => onOpenSandbox(featuredProject)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full backdrop-blur-md bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-white font-medium text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-teal-300 text-teal-300" />
                    <span>{translations?.liveDemo || (locale === 'zh' ? '唤起实时沙盒' : 'Live Sandbox')}</span>
                  </button>
                )}

                {featuredProject.githubUrl && (
                  <a
                    href={featuredProject.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs sm:text-sm transition-all shadow-sm"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
              </>
            ) : (
              <a
                href="#projects-grid"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-neutral-950 font-semibold text-xs sm:text-sm hover:bg-neutral-100 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20 group cursor-pointer"
              >
                <span>浏览全部作品</span>
                <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
