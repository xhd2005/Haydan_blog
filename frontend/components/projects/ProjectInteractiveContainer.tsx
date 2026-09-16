'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  Laptop, 
  Github, 
  ExternalLink, 
  Play, 
  RotateCw, 
  Maximize2, 
  Sparkles,
  ArrowUpRight,
  Cpu,
  Layers,
  Code2
} from 'lucide-react';

interface ProjectInteractiveContainerProps {
  projects: Project[];
  locale: string;
  translations?: {
    all?: string;
    searchPlaceholder?: string;
    searchNoResults?: string;
    clearSearch?: string;
    viewGrid?: string;
    viewList?: string;
    empty?: string;
    caseStudy?: string;
    liveDemo?: string;
    featuredWork?: string;
  };
}

/**
 * 3D 鼠标视差 Tilt 卡片组件
 */
function ProjectTiltCard({ 
  proj, 
  onOpenSandbox,
  isFeatured = false,
  locale
}: { 
  proj: Project; 
  onOpenSandbox: (p: Project) => void;
  isFeatured?: boolean;
  locale: string;
}) {
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

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const techs = proj.technologies ? proj.technologies.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease',
      }}
      className={`group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl backdrop-blur-xl transition-all duration-300 transform-gpu overflow-hidden ${
        isFeatured
          ? 'bg-card/95 dark:bg-neutral-900/90 border-2 border-teal-500/40 hover:border-teal-500 shadow-xl shadow-teal-500/5'
          : 'bg-card/90 dark:bg-card/75 border border-border/80 hover:border-teal-500/50 hover:shadow-2xl'
      }`}
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

            {/* 精选徽标 */}
            {isFeatured && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-teal-500 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-md shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 fill-current" />
                <span>{locale === 'zh' ? '精选代表作' : 'FEATURED'}</span>
              </div>
            )}

            {/* Live Demo Quick Hover Badge */}
            {proj.demoUrl && (
              <button
                type="button"
                onClick={() => onOpenSandbox(proj)}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-teal-500 text-white text-xs font-mono font-medium backdrop-blur-md border border-white/20 opacity-0 group-hover/cover:opacity-100 transition-all flex items-center gap-1.5 shadow-lg transform translate-y-1 group-hover/cover:translate-y-0 cursor-pointer"
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

        {/* 流光渐变技术栈徽章 */}
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
          <span>{locale === 'zh' ? '架构解构与沉思' : 'Case Study & Architecture'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-2">
          {proj.demoUrl && (
            <button
              type="button"
              onClick={() => onOpenSandbox(proj)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500 text-teal-600 dark:text-teal-300 hover:text-white border border-teal-500/30 text-xs font-mono font-medium transition-all shadow-xs cursor-pointer"
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

/**
 * 紧凑技术流列表行组件
 */
function ProjectListRow({
  proj,
  onOpenSandbox,
  isFeatured = false,
  locale
}: {
  proj: Project;
  onOpenSandbox: (p: Project) => void;
  isFeatured?: boolean;
  locale: string;
}) {
  const techs = proj.technologies ? proj.technologies.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className={`group p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
      isFeatured
        ? 'bg-card/95 border-teal-500/40 shadow-sm'
        : 'bg-card/80 hover:bg-card border-border/80 hover:border-teal-500/40 hover:shadow-md'
    }`}>
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          {isFeatured && (
            <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-[10px] font-bold uppercase tracking-wider">
              {locale === 'zh' ? '精选代表作' : 'FEATURED'}
            </span>
          )}
          <Link href={`/projects/${proj.slug}`}>
            <h3 className="text-base font-bold text-foreground group-hover:text-teal-500 transition-colors truncate">
              {proj.name}
            </h3>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-secondary text-muted-foreground border border-border">
            {proj.status || 'ACTIVE'}
          </span>
          <StardateBadge date={proj.createdAt} logId={proj.id} />
        </div>

        <p className="text-xs text-muted-foreground line-clamp-1">
          {proj.description}
        </p>

        {techs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {techs.map((tech) => (
              <span
                key={tech}
                className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-secondary/80 text-muted-foreground border border-border/60"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        {proj.demoUrl && (
          <button
            type="button"
            onClick={() => onOpenSandbox(proj)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500 text-teal-600 dark:text-teal-300 hover:text-white border border-teal-500/30 text-xs font-mono font-medium transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Live Sandbox</span>
          </button>
        )}

        <Link
          href={`/projects/${proj.slug}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-medium transition-colors"
        >
          <span>{locale === 'zh' ? '查看详情' : 'Details'}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        {proj.githubUrl && (
          <a
            href={proj.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

export function ProjectInteractiveContainer({
  projects,
  locale,
  translations,
}: ProjectInteractiveContainerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'developing' | 'completed' | 'ai' | 'system'>('all');
  const [sandboxProject, setSandboxProject] = useState<Project | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hayden_projects_view_mode');
      if (saved === 'grid' || saved === 'list') {
        setViewMode(saved);
      }
    } catch {}
  }, []);

  const handleViewChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('hayden_projects_view_mode', mode);
    } catch {}
  };

  // 状态与分类标签配置
  const filterTabs = [
    { id: 'all', label: locale === 'zh' ? '全部作品' : 'All Works' },
    { id: 'developing', label: locale === 'zh' ? '正在研发' : 'Developing' },
    { id: 'completed', label: locale === 'zh' ? '已上线' : 'Completed' },
    { id: 'ai', label: locale === 'zh' ? 'AI 智能体' : 'AI & Agents' },
    { id: 'system', label: locale === 'zh' ? '全栈架构' : 'Full-Stack Systems' },
  ] as const;

  // 复合筛选与即时搜索
  const filteredProjects = useMemo(() => {
    let list = [...projects];

    // 分类筛选
    if (activeFilter === 'developing') {
      list = list.filter((p) => (p.status || '').toLowerCase().includes('develop') || (p.status || '').toLowerCase().includes('wip'));
    } else if (activeFilter === 'completed') {
      list = list.filter((p) => (p.status || '').toLowerCase().includes('complete') || (p.status || '').toLowerCase().includes('active') || (p.status || '').toLowerCase().includes('online'));
    } else if (activeFilter === 'ai') {
      list = list.filter((p) => {
        const text = `${p.name} ${p.description} ${p.technologies}`.toLowerCase();
        return text.includes('ai') || text.includes('agent') || text.includes('llm') || text.includes('fastapi') || text.includes('langgraph') || text.includes('prompt');
      });
    } else if (activeFilter === 'system') {
      list = list.filter((p) => {
        const text = `${p.name} ${p.description} ${p.technologies}`.toLowerCase();
        return text.includes('spring') || text.includes('java') || text.includes('next') || text.includes('react') || text.includes('架构') || text.includes('system');
      });
    }

    // 关键词搜索
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.technologies || '').toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [projects, activeFilter, searchQuery]);

  return (
    <div id="projects-grid" className="space-y-8">
      {/* 顶部控制栏：分类筛选胶囊 + 即时搜索框 + 视图切换 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/80">
        {/* 分类筛选标签 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-foreground text-background font-semibold shadow-sm'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 右侧：搜索框与视图切换 */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* 实时搜索框 */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translations?.searchPlaceholder || (locale === 'zh' ? '搜索作品名称、技术栈...' : 'Search projects...')}
              className="w-full pl-9 pr-8 py-2 rounded-full bg-secondary/80 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-teal-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 视图切换 (网格 / 列表) */}
          <div className="flex items-center p-1 rounded-full bg-secondary/80 border border-border shrink-0">
            <button
              type="button"
              onClick={() => handleViewChange('grid')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={locale === 'zh' ? '网格卡片视图' : 'Grid View'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('list')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={locale === 'zh' ? '列表视图' : 'List View'}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 项目展示区 (网格或列表) */}
      {filteredProjects.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredProjects.map((proj, idx) => (
              <ProjectTiltCard
                key={proj.id}
                proj={proj}
                isFeatured={idx === 0}
                locale={locale}
                onOpenSandbox={(p) => setSandboxProject(p)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((proj, idx) => (
              <ProjectListRow
                key={proj.id}
                proj={proj}
                isFeatured={idx === 0}
                locale={locale}
                onOpenSandbox={(p) => setSandboxProject(p)}
              />
            ))}
          </div>
        )
      ) : (
        <div className="py-24 text-center space-y-4 rounded-3xl border border-dashed border-border/80 bg-secondary/20">
          <Code2 className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {translations?.searchNoResults || (locale === 'zh' ? '未找到符合条件的项目' : 'No projects found')}
            </p>
            <p className="text-xs text-muted-foreground">
              {locale === 'zh' ? '尝试调整筛选标签或搜索关键词' : 'Try adjusting your search terms or filters'}
            </p>
          </div>
          {(searchQuery || activeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground border border-border transition-colors cursor-pointer"
            >
              {translations?.clearSearch || (locale === 'zh' ? '清除所有筛选' : 'Clear filters')}
            </button>
          )}
        </div>
      )}

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
                  className="w-3 h-3 rounded-full bg-rose-500 hover:opacity-80 transition-opacity cursor-pointer"
                  title="Close"
                />
                <button
                  type="button"
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="w-3 h-3 rounded-full bg-amber-500 hover:opacity-80 transition-opacity cursor-pointer"
                  title="Reload"
                />
                <button
                  type="button"
                  onClick={() => window.open(sandboxProject.demoUrl, '_blank')}
                  className="w-3 h-3 rounded-full bg-emerald-500 hover:opacity-80 transition-opacity cursor-pointer"
                  title="Open in new window"
                />
              </div>

              {/* 居中地址栏胶囊 */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/80 dark:bg-black/50 border border-border/60 text-xs font-mono text-muted-foreground max-w-sm truncate shadow-xs">
                <Laptop className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span className="truncate">{sandboxProject.demoUrl}</span>
              </div>

              {/* 右侧工具按钮 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Reload sandbox"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <a
                  href={sandboxProject.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Open in external browser"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setSandboxProject(null)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 沙盒 Web 视口容器 */}
            <div className="relative flex-1 w-full bg-background overflow-hidden">
              <iframe
                key={iframeKey}
                src={sandboxProject.demoUrl}
                title={`Live Demo of ${sandboxProject.name}`}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
