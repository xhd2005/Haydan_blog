'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { Timeline, Journey } from '@/lib/types';
import { DEFAULT_COVER } from '@/lib/media-defaults';
import {
  ChevronDown,
  ChevronUp,
  Camera,
  Sparkles,
  Film,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  Compass,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export interface MilestoneSlice {
  year: string;
  titleZh: string;
  titleEn: string;
  category: string;
  summaryZh: string;
  summaryEn: string;
  notesZh: string;
  notesEn: string;
  /** 展开时展示真实旅程照片墙（数据 100% 源自数据库 journeys，AGENTS.md 足迹铁律） */
  withJourneyPhotos?: boolean;
}

/**
 * 站长成长自述里程碑（纯文字叙事，不含任何伪造照片与伪造相机 EXIF 参数）
 */
const GROWTH_MILESTONES: MilestoneSlice[] = [
  {
    year: '2026',
    titleZh: '全栈架构跃迁与 3D 数字花园',
    titleEn: 'Full-Stack Architecture Leap & 3D Digital Garden',
    category: 'Creative Tech & Architecture',
    summaryZh: '完成数字花园全面重塑：高定白瓷与曜石双生主题、3D 罗盘滚动解构与全息 Bento 看板。',
    summaryEn: 'Rebuilt the digital garden: dual porcelain/obsidian themes, 3D scrollytelling compass and holographic bento board.',
    notesZh: '最好的学习方法是公开记录与实践创造。在不确定性中构建确定性系统，将前端美学与后端稳健工程结合。',
    notesEn: 'The best way to master complex systems is public creation. Uniting spatial web aesthetics with rigorous backend resilience.',
  },
  {
    year: '2025',
    titleZh: '拥抱大模型与智能体工程化',
    titleEn: 'Embracing LLM Agents & Systemic Engineering',
    category: 'AI & Multi-Agent Systems',
    summaryZh: '构建端到端 AI 伴读智能体体系：标准 Function Calling、指数退避容灾与全站知识库 RAG 检索。',
    summaryEn: 'Engineered an end-to-end reading copilot: Function Calling tools, backoff retries, and true RAG retrieval.',
    notesZh: '智能体不仅仅是一次 Prompt 问答，而是带有工具调用、环境感知、自动重试与反思能力的复杂软件工程闭环。',
    notesEn: 'AI Agents transcend simple prompt completions: they are self-healing, tool-using software loops.',
  },
  {
    year: '2024',
    titleZh: '云原生分布式系统与高并发攻坚',
    titleEn: 'Cloud-Native Distributed Systems & High Concurrency',
    category: 'Distributed Systems',
    summaryZh: '深入 Java 25 虚拟线程（Project Loom）高并发编程，构建百万长连接网关与分布式微服务治理。',
    summaryEn: 'Mastered Java 25 virtual threads, developing high-throughput gateways and robust microservices.',
    notesZh: '虚拟线程彻底抹平了高吞吐与同步编程心智之间的鸿沟，在海量并发请求下保持极佳的系统可维护性。',
    notesEn: 'Virtual threads unite massive throughput with simple synchronous coding models without thread-pool bottlenecks.',
  },
  {
    year: '2023',
    titleZh: '航海足迹与全球数字游民探索',
    titleEn: 'Global Voyage & Digital Nomad Explorations',
    category: 'Travel & Photography',
    summaryZh: '行万里路打破日常惯性：在街头与山川间记录真实的光影与思考，足迹全部沉淀于本站旅程数据库。',
    summaryEn: 'Breaking habitual inertia: capturing street moments and mountain light. Every footprint lives in the journeys database.',
    notesZh: '旅行是打破日常惯性的良方。置身于陌生的语言与山川间，更能看清自己内心最底层的热爱与笃定。',
    notesEn: 'Travel shatters mental echo chambers. Wandering amidst unfamiliar landscapes crystallizes true inner convictions.',
    withJourneyPhotos: true,
  },
  {
    year: '2022',
    titleZh: '开源与极客启航',
    titleEn: 'Open Source Inception & Hacker Spirit',
    category: 'Open Source & Craftsmanship',
    summaryZh: '提交数字花园的第一个 Commit。确立代码工匠精神与终身学习信条，探索浩瀚的万维网世界。',
    summaryEn: 'Pushed the first commit of the digital garden. Committed to craftsmanship and lifelong learning.',
    notesZh: '从第一行代码到拥有属于自己的心智外脑。代码是逻辑的诗篇，也是连接世界的桥梁。',
    notesEn: 'From line one to an autonomous digital garden. Code is poetry of logic and our bridge to the world.',
  },
];

interface LightboxPhoto {
  photoUrl: string;
  title: string;
  location: string;
  year: string;
  narrative: string;
}

interface Props {
  timelines?: Timeline[];
  journeys?: Journey[];
}

export function GrowthChronicleTimeline({ timelines = [], journeys = [] }: Props) {
  const { locale } = useI18n();
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({
    '2026': true,
    '2025': true,
  });

  // 全屏胶片暗房灯箱状态 (Darkroom Lightbox) —— 仅承载真实旅程照片
  const [activeLightbox, setActiveLightbox] = useState<LightboxPhoto | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // 键盘 ESC 监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeLightbox) {
        setActiveLightbox(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightbox]);

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const openLightbox = (photo: LightboxPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveLightbox(photo);
    setZoomLevel(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <Film className="w-4 h-4" />
            <span>{locale === 'zh' ? '成长编年史与真实足迹胶片' : 'GROWTH CHRONICLE & AUTHENTIC VOYAGE REEL'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {locale === 'zh' ? '成长编年史与真实足迹' : 'Visual Milestones & Real Footprints'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {locale === 'zh'
              ? '文字为站长自述，照片 100% 源自数据库真实旅程记录，点击可唤起全屏灯箱'
              : 'Words are personal narrative; every photo comes from the real journeys database. Click to open the lightbox.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-secondary px-3.5 py-1.5 rounded-full border border-border">
          <Compass className="w-3.5 h-3.5 text-emerald-500" />
          <span>{locale === 'zh' ? '真实旅程数据驱动' : 'REAL JOURNEYS DRIVEN'}</span>
        </div>
      </div>

      {/* Film Reel Timeline List */}
      <div className="space-y-6">
        {GROWTH_MILESTONES.map((slice) => {
          const isExpanded = !!expandedYears[slice.year];

          return (
            <div
              key={slice.year}
              className="relative overflow-hidden rounded-[30px] border border-white/80 dark:border-white/[0.12] bg-white/[0.65] dark:bg-[#0c0d16]/[0.60] backdrop-blur-2xl backdrop-saturate-[180%] shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.85),inset_0_-1.5px_1.5px_rgba(0,0,0,0.03),0_20px_45px_-12px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.22),inset_0_0_20px_rgba(16,185,129,0.04),0_20px_50px_-15px_rgba(0,0,0,0.65)] hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 group"
            >
              {/* Left 35mm Film Sprocket Holes Decor (胶片打孔边缘) */}
              <div className="absolute top-0 bottom-0 left-0 w-3.5 bg-neutral-900/90 dark:bg-black border-r border-neutral-700/50 flex flex-col justify-between py-3 items-center pointer-events-none z-20">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1.5 h-2.5 rounded-[2px] bg-neutral-600/60" />
                ))}
              </div>

              {/* Card Main Container */}
              <div className="pl-7 pr-4 sm:px-8 py-5 sm:py-6">
                {/* Clickable Header Bar */}
                <div
                  onClick={() => toggleYear(slice.year)}
                  className="flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="font-mono text-base sm:text-lg font-extrabold px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 w-fit">
                      {slice.year}
                    </span>

                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {locale === 'zh' ? slice.titleZh : slice.titleEn}
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        {slice.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-block text-xs font-mono text-muted-foreground">
                      {isExpanded ? (locale === 'zh' ? '收起胶片' : 'Collapse') : (locale === 'zh' ? '展开胶片' : 'Expand')}
                    </span>
                    <button
                      type="button"
                      className="p-2 rounded-full bg-secondary hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Summary (Always visible) */}
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-0 sm:pl-16">
                  {locale === 'zh' ? slice.summaryZh : slice.summaryEn}
                </p>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-6 pt-5 border-t border-border/70 space-y-6 sm:pl-16 animate-fadeIn">
                    {/* 真实旅程照片墙（仅航海里程碑 + 数据库存在旅程时渲染） */}
                    {slice.withJourneyPhotos && journeys.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {journeys.slice(0, 2).map((j) => {
                          const photo: LightboxPhoto = {
                            photoUrl: j.cover || DEFAULT_COVER,
                            title: j.title,
                            location: `${j.city} · ${j.country}`,
                            year: j.startDate || '',
                            narrative: j.description || '',
                          };
                          return (
                            <div
                              key={j.id}
                              onClick={(e) => openLightbox(photo, e)}
                              className="relative overflow-hidden rounded-2xl border-4 border-white dark:border-neutral-800 shadow-xl bg-neutral-950 cursor-zoom-in group/photo"
                            >
                              <SafeImage
                                src={photo.photoUrl}
                                alt={j.title}
                                aspectRatio="16/9"
                                containerClassName="w-full h-44 sm:h-52 object-cover transition-transform duration-700 group-hover/photo:scale-105"
                              />

                              {/* 悬浮放大提示 */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-mono text-xs backdrop-blur-xs">
                                <Maximize2 className="w-4 h-4 text-emerald-400" />
                                <span>{locale === 'zh' ? '点击唤起全屏灯箱' : 'Click to launch Lightbox'}</span>
                              </div>

                              {/* 真实地点信息栏 */}
                              <div className="p-3 bg-neutral-900/95 border-t border-white/[0.08] flex items-center justify-between gap-3 text-zinc-300 font-mono text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="font-semibold text-white truncate">{photo.location}</span>
                                </div>
                                {j.startDate && (
                                  <span className="text-emerald-400/90 text-[11px] shrink-0">{j.startDate}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Journal Reflection Box */}
                    <div className="p-5 rounded-2xl bg-secondary/60 border border-border/80 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{locale === 'zh' ? '站长当时手记与心智沉淀' : 'Personal Journal & Reflections'}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/90 italic leading-relaxed font-serif">
                        “{locale === 'zh' ? slice.notesZh : slice.notesEn}”
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Timelines from Backend */}
        {timelines.length > 0 && (
          <div className="pt-4 border-t border-border/70 space-y-4">
            <h4 className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
              {locale === 'zh' ? '后台动态扩展轨迹' : 'Additional Synced Milestones'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {timelines.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-card border border-border space-y-1.5">
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                    {item.year}
                  </span>
                  <h5 className="font-bold text-sm text-foreground mt-1">{item.title}</h5>
                  {item.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 全屏高清暗房灯箱 (Lightbox Modal) —— 仅展示真实照片与真实地点 */}
      {activeLightbox && (
        <div
          onClick={() => setActiveLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl max-h-[95vh] flex flex-col rounded-3xl overflow-hidden bg-neutral-950 border border-white/[0.1] shadow-2xl animate-scaleUp text-white"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900/90 border-b border-white/[0.08] select-none">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs text-zinc-300 font-semibold tracking-wider uppercase truncate">
                  VOYAGE LIGHTBOX // {activeLightbox.location}
                </span>
                {activeLightbox.year && (
                  <span className="text-xs text-zinc-500 hidden sm:inline">#{activeLightbox.year}</span>
                )}
              </div>

              {/* Controls: Zoom, Close */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-neutral-800/80 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                    className="p-1 rounded text-zinc-400 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono px-1 text-zinc-300">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    className="p-1 rounded text-zinc-400 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {zoomLevel !== 1 && (
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1 rounded text-zinc-400 hover:text-white"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveLightbox(null)}
                  className="p-1.5 rounded-xl bg-neutral-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 transition-colors"
                  title="Close (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Photo Canvas Area */}
            <div className="relative flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 bg-black/60 min-h-[300px] sm:min-h-[480px]">
              <div
                className="relative transition-all duration-300 transform-gpu"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={activeLightbox.photoUrl}
                  alt={activeLightbox.title}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
                />
              </div>
            </div>

            {/* Bottom Location & Narrative Plate */}
            <div className="px-6 py-4 bg-neutral-900/95 border-t border-white/[0.08] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-emerald-400 font-bold">
                  <Camera className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[240px]">{activeLightbox.title}</span>
                </div>
                <span className="flex items-center gap-1 text-rose-400">
                  <MapPin className="w-3 h-3" />
                  {activeLightbox.location}
                  {activeLightbox.year ? ` · ${activeLightbox.year}` : ''}
                </span>
              </div>

              {activeLightbox.narrative && (
                <p className="text-xs text-zinc-300 leading-relaxed font-serif italic border-l-2 border-emerald-500/50 pl-3 line-clamp-3">
                  “{activeLightbox.narrative}”
                </p>
              )}

              <div className="pt-1">
                <Link
                  href="/journey"
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Compass className="w-3 h-3" />
                  {locale === 'zh' ? '查看全部真实旅程' : 'Explore all real journeys'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
