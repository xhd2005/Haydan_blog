'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { useTranslation } from '@/lib/i18n-client';
import { 
  Github, 
  Globe, 
  ExternalLink, 
  Sparkles, 
  X, 
  Maximize2, 
  RotateCw, 
  Play, 
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Laptop
} from 'lucide-react';

interface ProjectShowcaseGridProps {
  projects: Project[];
}

function ProjectTiltCard({ 
  proj, 
  onOpenSandbox 
}: { 
  proj: Project; 
  onOpenSandbox: (p: Project) => void;
}) {
  const { locale, t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const techs = proj.technologies ? proj.technologies.split(',').map((s) => s.trim()) : [];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease',
      }}
      className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-card/90 dark:bg-card/75 border border-border/80 hover:border-teal-500/50 hover:shadow-2xl transition-all duration-300 transform-gpu overflow-hidden"
    >
      {/* 顶部微光光晕 (Ambient Spotlight Glow) */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-3xl group-hover:scale-150 transition-transform pointer-events-none" />

      <div className="space-y-5">
        {/* Project Cover Image with Parallax & Hover Glow */}
        {proj.cover && (
          <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-neutral-950 group/cover">
            <SafeImage
              src={proj.cover}
              alt={proj.name}
              aspectRatio="16/9"
              containerClassName="w-full transition-transform duration-700 group-hover/cover:scale-105"
            />

            {/* Live Demo Quick Hover Badge */}
            {proj.demoUrl && (
              <button
                type="button"
                onClick={() => onOpenSandbox(proj)}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-teal-500 text-white text-xs font-mono font-medium backdrop-blur-md border border-white/20 opacity-0 group-hover/cover:opacity-100 transition-all flex items-center gap-1.5 shadow-lg transform translate-y-1 group-hover/cover:translate-y-0"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Live Sandbox</span>
              </button>
            )}
          </div>
        )}

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/projects/${proj.slug}`}>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground group-hover:text-teal-500 transition-colors flex items-center gap-1.5">
                <span>{proj.name}</span>
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
              </h2>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <StardateBadge date={proj.createdAt} logId={proj.id} />
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-secondary text-muted-foreground border border-border/80">
                {proj.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {proj.description}
          </p>
        </div>

        {/* 流光渐变技术栈徽章 (Glow Badges) */}
        {techs.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {techs.map((tech) => (
              <span
                key={tech}
                className="text-xs px-2.5 py-1 rounded-xl font-mono bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-cyan-500/10 border border-teal-500/25 text-teal-700 dark:text-teal-300 hover:border-teal-400/50 transition-colors shadow-xs"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 底部操作工具栏 */}
      <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between text-sm">
        <Link
          href={`/projects/${proj.slug}`}
          className="font-medium text-foreground hover:text-teal-500 transition-colors inline-flex items-center gap-1.5 text-xs font-mono"
        >
          <span>{t('home.case_study')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-2">
          {proj.demoUrl && (
            <button
              type="button"
              onClick={() => onOpenSandbox(proj)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500 text-teal-600 dark:text-teal-300 hover:text-white border border-teal-500/30 text-xs font-mono font-medium transition-all shadow-xs"
              title="Open Live Sandbox Viewport"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Live Demo</span>
            </button>
          )}

          {proj.githubUrl && (
            <a
              href={proj.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
              aria-label="GitHub Repository"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectShowcaseGrid({ projects }: ProjectShowcaseGridProps) {
  const { locale, t } = useTranslation();
  const [sandboxProject, setSandboxProject] = useState<Project | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const refreshSandbox = () => {
    setIframeKey((k) => k + 1);
  };

  return (
    <div className="space-y-8">
      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.length > 0 ? (
          projects.map((proj) => (
            <ProjectTiltCard
              key={proj.id}
              proj={proj}
              onOpenSandbox={(p) => setSandboxProject(p)}
            />
          ))
        ) : (
          <div className="col-span-2 py-20 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
            {t('projects.empty')}
          </div>
        )}
      </div>

      {/* Live Demo 悬浮实时沙盒视窗 (macOS Style Sandbox Modal) */}
      {sandboxProject && (
        <div 
          onClick={() => setSandboxProject(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-3xl overflow-hidden bg-card/95 dark:bg-neutral-950/95 border border-border/80 dark:border-white/[0.1] shadow-2xl animate-scaleUp text-foreground"
          >
            {/* macOS 风格视窗控制顶栏 */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-secondary/70 dark:bg-neutral-900/90 border-b border-border/60 dark:border-white/[0.08] select-none shrink-0">
              {/* 交通灯三色球 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSandboxProject(null)}
                  className="w-3 h-3 rounded-full bg-rose-500 hover:opacity-80 transition-opacity"
                  title="Close"
                />
                <button
                  type="button"
                  onClick={refreshSandbox}
                  className="w-3 h-3 rounded-full bg-amber-500 hover:opacity-80 transition-opacity"
                  title="Reload"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (sandboxProject.demoUrl) {
                      window.open(sandboxProject.demoUrl, '_blank');
                    }
                  }}
                  className="w-3 h-3 rounded-full bg-emerald-500 hover:opacity-80 transition-opacity"
                  title="Open in new window"
                />
              </div>

              {/* 地址栏模拟 */}
              <div className="flex-1 max-w-md mx-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-background/80 border border-border/60 text-xs font-mono text-muted-foreground truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{sandboxProject.demoUrl}</span>
                </div>
              </div>

              {/* 右侧操作按钮 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshSandbox}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Reload sandbox"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <a
                  href={sandboxProject.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Open in external browser tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setSandboxProject(null)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground transition-colors"
                  title="Close (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 沙盒主体区域：安全 iframe 与回退展示 */}
            <div className="relative flex-1 w-full h-full bg-background overflow-hidden">
              <iframe
                key={iframeKey}
                src={sandboxProject.demoUrl}
                title={sandboxProject.name}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className="w-full h-full border-none"
              />
            </div>

            {/* 底部信息状态条 */}
            <div className="px-5 py-2.5 bg-secondary/50 dark:bg-neutral-900/60 border-t border-border/60 flex items-center justify-between text-xs font-mono text-muted-foreground shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{sandboxProject.name}</span>
                <span>·</span>
                <span className="text-[11px] text-teal-600 dark:text-teal-400">
                  {sandboxProject.status || 'ACTIVE'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline">SANDBOX ISOLATED VIEWPORT</span>
                <Link
                  href={`/projects/${sandboxProject.slug}`}
                  onClick={() => setSandboxProject(null)}
                  className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <span>{locale === 'en' ? 'Read Project Case Study' : '查看完整项目深度解构'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
