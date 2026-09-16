import React from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { ArrowLeft, Github, Globe, Calendar, Layers, Sparkles, ExternalLink, Play } from 'lucide-react';

interface ProjectFullBleedHeroProps {
  project: Project;
  translations: {
    backProjects: string;
    sourceCode: string;
    liveDemo: string;
    present: string;
  };
}

/**
 * 项目详情页 100vw 通栏巨幕首屏组件 (Project Detail Full-Bleed Hero)
 * 适配项目详情页 /projects/[slug]，呈现高美感数字工程封面与技术栈徽章
 */
export function ProjectFullBleedHero({
  project,
  translations: t,
}: ProjectFullBleedHeroProps) {
  const techs = project.technologies
    ? project.technologies.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <section className="relative w-full min-h-[480px] sm:min-h-[560px] lg:min-h-[600px] flex flex-col justify-center overflow-hidden pt-32 sm:pt-40 pb-20 sm:pb-28">
      {/* 1. 100vw 全幅巨幕背景层 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {project.cover ? (
          <div className="relative w-full h-full">
            <SafeImage
              src={project.cover}
              alt={project.name}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover filter brightness-[0.88] dark:brightness-[0.58] saturate-[1.08] scale-105"
            />
            {/* 电影质感微膜 */}
            <div className="absolute inset-0 bg-black/30 dark:bg-black/65 pointer-events-none transition-colors duration-300" />
            {/* 径向暗角 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />
          </div>
        ) : (
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

      {/* 2. 前景排版内容区 */}
      <div className="relative z-20 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 text-white select-none">
        <div className="max-w-[980px] space-y-5 sm:space-y-6">
          {/* 返回按钮 */}
          <div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-mono text-white transition-all shadow-sm group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>{t.backProjects}</span>
            </Link>
          </div>

          {/* 状态与时间徽标 */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <span className="px-3 py-1 rounded-full backdrop-blur-md bg-teal-500/30 border border-teal-400/40 text-teal-200 font-semibold shadow-sm">
              {project.status || 'ACTIVE'}
            </span>

            {project.startDate && (
              <span className="px-3 py-1 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white/90 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{project.startDate} {project.endDate ? `~ ${project.endDate}` : `~ ${t.present}`}</span>
              </span>
            )}

            <StardateBadge
              date={project.createdAt}
              logId={project.id}
              className="backdrop-blur-md bg-white/10 border-white/20 text-white/90"
            />
          </div>

          {/* 大标题 */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] drop-shadow-md">
            {project.name}
          </h1>

          {/* 简介自述 */}
          <div className="border-l-2 border-teal-400/80 pl-4 sm:pl-5">
            <p className="text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-3xl font-normal drop-shadow-sm">
              {project.description}
            </p>
          </div>

          {/* 技术栈阵列 */}
          {techs.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
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

          {/* 操作直达按钮 */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-neutral-950 font-semibold text-xs sm:text-sm hover:bg-neutral-100 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
              >
                <Play className="w-4 h-4 fill-current text-teal-600" />
                <span>{t.liveDemo}</span>
              </a>
            )}

            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full backdrop-blur-md bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium text-xs sm:text-sm transition-all shadow-sm"
              >
                <Github className="w-4 h-4" />
                <span>{t.sourceCode}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
