'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Timeline, SiteSetting, Journey } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { resolveAvatar } from '@/lib/media-defaults';
import { formatStardate } from '@/lib/stardate';
import { SafeImage } from '@/components/SafeImage';
import {
  Sparkles,
  Cpu,
  Compass,
  BookOpen,
  Terminal,
  ExternalLink,
  Mail,
  Github,
  MapPin,
  Quote,
  Check,
  ArrowDown,
  Layers,
  Zap,
  Maximize2,
  X,
  Server,
  Code2,
  Bot,
  Database
} from 'lucide-react';
import Link from 'next/link';

import { SpatialExplodedGlassWorld } from './SpatialExplodedGlassWorld';
import { KeynoteActTimelineDock, KEYNOTE_ACTS } from './KeynoteActTimelineDock';
import { GeekMiniTerminal } from './GeekMiniTerminal';

interface AboutScrollytellingStageProps {
  timelines: Timeline[];
  settings: SiteSetting | null;
  journeys?: Journey[];
}

interface LightboxPhoto {
  photoUrl: string;
  title: string;
  location: string;
  year: string;
  narrative: string;
}

export function AboutScrollytellingStage({
  timelines,
  settings,
  journeys = [],
}: AboutScrollytellingStageProps) {
  const { locale } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. 实时滚轮时序解构进度监听 (useScroll from 0.0 to 1.0)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const [currentProgress, setCurrentProgress] = useState(0);
  const [activeActIndex, setActiveActIndex] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<LightboxPhoto | null>(null);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setCurrentProgress(latest);

    // 计算当前所属剧幕 (0: 01初现, 1: 02解构, 2: 03真实足迹, 3: 04公理终章)
    if (latest < 0.25) {
      setActiveActIndex(0);
    } else if (latest < 0.55) {
      setActiveActIndex(1);
    } else if (latest < 0.80) {
      setActiveActIndex(2);
    } else {
      setActiveActIndex(3);
    }
  });

  // 平滑跳幕至目标剧幕位置
  const handleSelectAct = (index: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollHeight = container.scrollHeight - window.innerHeight;
    const targetProgress = KEYNOTE_ACTS[index].targetProgress;
    const targetY = container.offsetTop + targetProgress * scrollHeight;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  // 复制邮箱操作
  const emailToCopy = settings?.email || 'haydenxue@example.com';
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailToCopy);
    setCopiedEmail(true);
    toast.success(locale === 'en' ? 'Email copied to clipboard' : '站长邮箱已复制到剪贴板');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const avatarUrl = resolveAvatar(settings?.avatar);
  const stardateStr = formatStardate(new Date());

  // 4 块架构芯片核心信息
  const CHIP_ARCHITECTURES = [
    {
      id: 'backend',
      badge: 'BACKEND CORE',
      title: '高并发系统底座',
      titleEn: 'Concurrency Backend',
      desc: '深入 Java 25 原生虚拟线程 (Project Loom)、Spring Boot 3.3 响应式微服务架构，构建高吞吐低延迟的分布式并发处理能力。',
      techs: ['Java 25 LTS', 'Project Loom', 'Spring Boot 3.3', 'Virtual Threads'],
      icon: Server,
      accent: 'emerald',
    },
    {
      id: 'frontend',
      badge: 'SPATIAL WEB',
      title: '空间响应式前端',
      titleEn: 'Spatial Interactive UI',
      desc: '基于 Next.js 14 App Router、Three.js WebGL 与物理流体玻璃，探索 Apple 空间计算与交互界面的极致工程平衡。',
      techs: ['Next.js 14', 'Three.js / WebGL', 'TypeScript', 'VisionOS Glass'],
      icon: Code2,
      accent: 'cyan',
    },
    {
      id: 'ai',
      badge: 'INTELLIGENCE',
      title: 'AI 智能体系统',
      titleEn: 'Multi-Agent Systems',
      desc: '构建具备自主环境感知、Function Calling 工具调用、反思重试机制的端到端 RAG 知识伴读与全自主协作多智能体闭环。',
      techs: ['Multi-Agent DAG', 'Tool Calling', 'Vector RAG', 'Self-Healing'],
      icon: Bot,
      accent: 'indigo',
    },
    {
      id: 'infra',
      badge: 'CLOUD-NATIVE',
      title: '分布式云原生底座',
      titleEn: 'Cloud-Native Infra',
      desc: '全站多媒体与存储深度解耦 S3 / MinIO 分布式对象存储，多级缓存容灾与 Docker 容器化编排，守护系统确定性。',
      techs: ['MinIO / S3', 'Redis Cache', 'Docker', 'Edge CDN'],
      icon: Database,
      accent: 'teal',
    },
  ];

  // 4 项心智模型
  const COGNITIVE_AXIOMS = [
    {
      no: '01',
      titleZh: '对抗熵增与数字花园',
      titleEn: 'Anti-Entropy & Digital Garden',
      quoteZh: '思想若不修剪便会荒芜；公开记录是最好的认知灌溉。',
      quoteEn: 'Thoughts left unpruned decay into chaos; public creation is the truest nourishment.',
      descZh: '软件架构与个人心智的本质，都是在局部空间内以高密度能量投入构建出高度有序的确定性结构。数字花园是持续生长的活体系统。',
    },
    {
      no: '02',
      titleZh: '第一性原理与系统重构',
      titleEn: 'First Principles & System Order',
      quoteZh: '穿透流行概念的迷雾，在不确定性中构建确定性系统。',
      quoteEn: 'Pierce the haze of buzzwords; engineer resilient certainty amid systemic flux.',
      descZh: '回归底层物理与逻辑公理：数据流如何流动、状态如何收敛、故障边界如何隔离，从底层真理推演坚固架构。',
    },
    {
      no: '03',
      titleZh: '技术理性与人文温度',
      titleEn: 'Tech Rationality & Humanistic Warmth',
      quoteZh: '技术是坚硬的骨骼，人文与审美是流动的血液。',
      quoteEn: 'Technology constitutes rigid bone; humanities and beauty breathe vital blood.',
      descZh: '代码是严密的逻辑具象，但软件的终极归宿是服务于鲜活具体的人。坚持把极致的工艺、优雅的交互与真实体察注入系统。',
    },
    {
      no: '04',
      titleZh: '知行躬行与建造者精神',
      titleEn: 'Praxis & The Builder Spirit',
      quoteZh: '不做旁观的挑剔评论家，做躬身入局的工匠建造者。',
      quoteEn: 'Shun passive critique; embrace the arena of creation as a disciplined craftsman.',
      descZh: '真理不在抽象的辩论中显现，而在一次次编译、部署、攻坚与重构的实战反馈中自我澄明。',
    },
  ];

  // 过滤真实旅程摄影（严格遵守 AGENTS.md 铁律 2）
  const authenticJourneys = journeys.filter(j => !!j.cover).slice(0, 4);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400vh] bg-[#fbfbfd] dark:bg-[#090a0f] text-foreground transition-colors duration-700"
    >
      {/* ==============================================================
          1. 连续 3D WebGL 空间流体世界 (Layer 0)
         ============================================================== */}
      <SpatialExplodedGlassWorld progress={currentProgress} journeys={journeys} />

      {/* ==============================================================
          2. 空间极光微光弥散光晕 (Layer 1)
         ============================================================== */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-emerald-500/[0.08] via-cyan-500/[0.05] to-transparent blur-3xl" />
        <div className="absolute top-[35%] right-0 w-[550px] h-[550px] bg-indigo-500/[0.05] rounded-full blur-[130px]" />
        <div className="absolute bottom-[20%] left-0 w-[650px] h-[650px] bg-emerald-500/[0.04] rounded-full blur-[150px]" />
      </div>

      {/* ==============================================================
          3. 苹果式右侧悬浮胶囊时间轨与键盘控制器 (Layer 3)
         ============================================================== */}
      <KeynoteActTimelineDock
        progress={currentProgress}
        activeActIndex={activeActIndex}
        onSelectAct={handleSelectAct}
      />

      {/* ==============================================================
          4. 苹果发布会钉住式 100vh 舞台视窗 (Layer 2 Pinned Stage)
         ============================================================== */}
      <div className="fixed inset-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-none z-10">
        
        {/* ============================================================
            ACT 01: 初现 // 液体透镜与身份觉醒 (Progress: 0.00 ~ 0.26)
           ============================================================ */}
        {currentProgress < 0.28 && (
          <motion.div
            key="act-01"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: currentProgress > 0.22 ? Math.max(0, 1 - (currentProgress - 0.22) / 0.05) : 1,
              scale: currentProgress > 0.22 ? 0.95 : 1,
              y: currentProgress > 0.22 ? -25 : 0,
            }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 z-20 pointer-events-auto max-w-4xl mx-auto space-y-6"
          >
            {/* 幕次指示徽标 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm backdrop-blur-xl"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>ACT 01 // IDENTITY & THE REVEAL</span>
            </motion.div>

            {/* 超大 SF Pro 大字阶主标题 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-2"
            >
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm font-sans">
                Hayden Xue
              </h1>
              <p className="text-sm sm:text-lg font-mono text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider">
                Full-Stack Architect · Digital Gardener · Visual Explorer
              </p>
            </motion.div>

            {/* 悬浮星历与地理坐标芯片 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono font-medium bg-white/[0.70] dark:bg-[#0c0d16]/[0.70] backdrop-blur-2xl backdrop-saturate-[180%] border border-white/80 dark:border-white/[0.14] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_10px_25px_-5px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.2)] text-slate-800 dark:text-slate-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>杭州 · 滨江 (30.2° N, 120.2° E)</span>
              <span className="opacity-40">|</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stardateStr}</span>
            </motion.div>

            {/* 造物哲学宣言高透液体玻璃托盘 */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-2xl mx-auto rounded-[32px] bg-white/[0.65] dark:bg-[#0c0d16]/[0.60] backdrop-blur-2xl backdrop-saturate-[180%] border border-white/80 dark:border-white/[0.12] p-6 sm:p-8 shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.85),inset_0_-1.5px_1.5px_rgba(0,0,0,0.03),0_20px_50px_-15px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.22),inset_0_0_20px_rgba(16,185,129,0.04),0_25px_60px_-15px_rgba(0,0,0,0.65)] space-y-3 text-left relative overflow-hidden"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                <Quote className="w-4 h-4" />
                <span>{locale === 'zh' ? '造物哲学宣言' : 'THE BUILDER MANIFESTO'}</span>
              </div>
              <blockquote className="text-base sm:text-lg text-slate-800 dark:text-slate-200 font-sans leading-relaxed italic">
                {locale === 'zh'
                  ? '“追求极简与克制，在不确定中构建高确定性的全栈工程与智能体系统。代码是逻辑的诗歌，而旅途与胶片则是生命的刻度。”'
                  : '“Pursuing restraint and simplicity, engineering deterministic systems in flux. Code is poetry of logic; voyages and film reels are the true metric of life.”'}
              </blockquote>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                {settings?.aboutBioZh || '全栈系统架构师与数字花园建造者。热衷于在复杂高并发的分布式后端系统与极致纯粹的 Web 空间交互美学之间寻找平衡点。'}
              </p>
            </motion.div>

            {/* 快速连接与操作浮岛 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 pt-2"
            >
              <a
                href={settings?.githubUrl || 'https://github.com/xhd2005'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-neutral-900/95 dark:bg-white text-white dark:text-neutral-950 text-xs font-mono font-bold shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.65] dark:bg-[#0c0d16]/[0.60] backdrop-blur-2xl border border-white/80 dark:border-white/[0.12] text-foreground text-xs font-mono font-medium shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {copiedEmail ? <Check className="w-4 h-4 text-emerald-500" /> : <Mail className="w-4 h-4 text-slate-500" />}
                <span>{copiedEmail ? (locale === 'zh' ? '已复制邮箱' : 'Copied!') : emailToCopy}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectAct(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-mono text-muted-foreground hover:text-foreground hover:scale-105 transition-all cursor-pointer"
              >
                <span>{locale === 'zh' ? '探索全栈解构' : 'Explore Engine'}</span>
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ============================================================
            ACT 02: 解构 // 全栈架构引擎 3D 爆炸图 (Progress: 0.24 ~ 0.56)
           ============================================================ */}
        {currentProgress >= 0.22 && currentProgress < 0.58 && (
          <motion.div
            key="act-02"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity:
                currentProgress < 0.28
                  ? (currentProgress - 0.22) / 0.06
                  : currentProgress > 0.52
                  ? Math.max(0, 1 - (currentProgress - 0.52) / 0.06)
                  : 1,
              scale: 1,
            }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 z-20 pointer-events-auto max-w-5xl mx-auto w-full"
          >
            {/* 顶栏标题 */}
            <div className="text-center space-y-2 mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 backdrop-blur-xl">
                <Cpu className="w-3.5 h-3.5" />
                <span>ACT 02 // FULL-STACK EXPLODED ENGINE</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                {locale === 'zh' ? '全栈架构引擎 3D 解构' : 'Full-Stack Exploded Architecture'}
              </h2>
              <p className="text-xs sm:text-sm font-mono text-muted-foreground">
                {locale === 'zh'
                  ? '3D 空间硬件爆炸图 · 四维全栈架构与确定性系统工程'
                  : '3D Hardware Exploded View · Deterministic Engineering Systems'}
              </p>
            </div>

            {/* 四象限液体玻璃架构芯片卡片群 (4-Quadrant Liquid Glass Bento) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl">
              {CHIP_ARCHITECTURES.map((chip) => {
                const Icon = chip.icon;
                return (
                  <div
                    key={chip.id}
                    className="group relative rounded-[28px] bg-white/[0.65] dark:bg-[#0c0d16]/[0.60] backdrop-blur-2xl backdrop-saturate-[180%] border border-white/80 dark:border-white/[0.12] p-5 sm:p-6 shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.85),0_15px_35px_-10px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.2),0_20px_45px_-15px_rgba(0,0,0,0.6)] hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                          {chip.badge}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">ACT 02</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'zh' ? chip.title : chip.titleEn}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                      {chip.desc}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/50 dark:border-white/[0.06]">
                      {chip.techs.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100/80 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.04]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ============================================================
            ACT 03: 共鸣 // 真实旅程与空间光影折射 (Progress: 0.52 ~ 0.82)
           ============================================================ */}
        {currentProgress >= 0.50 && currentProgress < 0.82 && (
          <motion.div
            key="act-03"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity:
                currentProgress < 0.56
                  ? (currentProgress - 0.50) / 0.06
                  : currentProgress > 0.76
                  ? Math.max(0, 1 - (currentProgress - 0.76) / 0.06)
                  : 1,
              scale: 1,
            }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 z-20 pointer-events-auto max-w-5xl mx-auto w-full"
          >
            {/* 顶栏标题 */}
            <div className="text-center space-y-2 mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 backdrop-blur-xl">
                <Compass className="w-3.5 h-3.5 text-emerald-500" />
                <span>ACT 03 // AUTHENTIC VOYAGE REEL</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                {locale === 'zh' ? '真实旅程与空间足迹' : 'Authentic Footprints & Voyage'}
              </h2>
              <p className="text-xs sm:text-sm font-mono text-muted-foreground">
                {locale === 'zh'
                  ? '行万里路打破日常惯性 · 照片 100% 取自数据库真实记录'
                  : 'Breaking habitual inertia · 100% authentic journey data from CMS'}
              </p>
            </div>

            {/* 真实旅程照片画廊卡片群 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
              {authenticJourneys.length > 0 ? (
                authenticJourneys.map((j) => (
                  <div
                    key={j.id}
                    onClick={() =>
                      setActiveLightbox({
                        photoUrl: j.cover || '',
                        title: j.title,
                        location: [j.city, j.country].filter(Boolean).join(', ') || '中国',
                        year: j.startDate ? new Date(j.startDate).getFullYear().toString() : '2025',
                        narrative: j.description || j.title,
                      })
                    }
                    className="group relative rounded-[24px] overflow-hidden bg-white/[0.65] dark:bg-[#0c0d16]/[0.60] backdrop-blur-2xl border border-white/80 dark:border-white/[0.12] shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-900">
                      <SafeImage
                        src={j.cover || ''}
                        alt={j.title}
                        aspectRatio="4/3"
                        containerClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold mb-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{[j.city, j.country].filter(Boolean).join(' · ') || '旅程记录'}</span>
                        </div>
                        <h4 className="text-xs font-bold line-clamp-1">{j.title}</h4>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* 回退展示站长真实纪元历程 */
                [
                  { year: '2026', title: '数字花园全栈重塑', loc: '杭州 · 滨江' },
                  { year: '2025', title: 'AI 伴读与智能体工程', loc: '上海 / 杭州' },
                  { year: '2024', title: '云原生与高并发网关', loc: '华东算力枢纽' },
                  { year: '2023', title: '全球旅程与游民探索', loc: '舟山 / 黄山 / 云南' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-[24px] p-5 bg-white/[0.65] dark:bg-[#0c0d16]/[0.60] backdrop-blur-2xl border border-white/80 dark:border-white/[0.12] shadow-md space-y-2 text-left"
                  >
                    <span className="text-xs font-mono font-bold text-emerald-500 px-2 py-0.5 rounded-md bg-emerald-500/10">
                      {item.year}
                    </span>
                    <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                    <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span>{item.loc}</span>
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* 真实数据驱动凭证徽章 */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono text-muted-foreground bg-white/[0.6] dark:bg-black/[0.4] backdrop-blur-md border border-white/60 dark:border-white/[0.08]">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>{locale === 'zh' ? '严格遵守 AGENTS.md 真实数据驱动准则' : 'Strictly authentic database footprints'}</span>
            </div>
          </motion.div>
        )}

        {/* ============================================================
            ACT 04: 信念与终章 // 第一性原理与数字避难所 (Progress: 0.78 ~ 1.00)
           ============================================================ */}
        {currentProgress >= 0.76 && (
          <motion.div
            key="act-04"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: currentProgress < 0.82 ? (currentProgress - 0.76) / 0.06 : 1,
              scale: 1,
            }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 z-20 pointer-events-auto max-w-5xl mx-auto w-full overflow-y-auto py-8"
          >
            {/* 顶栏标题 */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 backdrop-blur-xl">
                <BookOpen className="w-3.5 h-3.5" />
                <span>ACT 04 // FIRST PRINCIPLES & COLOPHON</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                {locale === 'zh' ? '心智公理与数字避难所' : 'Cognitive Axioms & Sanctuary'}
              </h2>
            </div>

            {/* 四大心智公理矩阵 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl mb-6">
              {COGNITIVE_AXIOMS.map((axiom) => (
                <div
                  key={axiom.no}
                  className="rounded-[24px] bg-white/[0.65] dark:bg-[#0c0d16]/[0.60] backdrop-blur-2xl backdrop-saturate-[180%] border border-white/80 dark:border-white/[0.12] p-5 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.85),0_15px_30px_-10px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.2)] text-left space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      // {axiom.no}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {locale === 'zh' ? axiom.titleZh : axiom.titleEn}
                    </h4>
                  </div>
                  <p className="text-xs font-serif italic text-emerald-700 dark:text-emerald-300 font-medium">
                    “{locale === 'zh' ? axiom.quoteZh : axiom.quoteEn}”
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {axiom.descZh}
                  </p>
                </div>
              ))}
            </div>

            {/* 极客终端触发与终章版权基座 */}
            <div className="w-full max-w-4xl rounded-[28px] bg-gradient-to-br from-neutral-900/95 via-neutral-950/95 to-black text-white p-6 sm:p-8 shadow-2xl border border-white/15 backdrop-blur-2xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>INTERACTIVE TERMINAL SANDBOX</span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    {locale === 'zh' ? '探索内置 Linux 交互终端与站长专属彩蛋' : 'Explore the embedded Linux sandbox & easter eggs'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTerminalModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-mono font-bold shadow-md hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {locale === 'zh' ? '唤醒极客终端' : 'Open Terminal'}
                </button>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
                <div>© 2026 HAYDEN XUE. ALL RIGHTS RESERVED.</div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span>CRAFTED WITH FIRST PRINCIPLES & SPATIAL KEYNOTE.</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ==============================================================
          5. 全屏暗房照片灯箱 (Photo Lightbox Modal)
         ============================================================== */}
      <AnimatePresence>
        {activeLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLightbox(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 select-none cursor-zoom-out"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-neutral-900 rounded-3xl overflow-hidden border border-white/15 shadow-2xl cursor-default"
            >
              <button
                type="button"
                onClick={() => setActiveLightbox(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-16/10 w-full bg-black">
                <SafeImage
                  src={activeLightbox.photoUrl}
                  alt={activeLightbox.title}
                  aspectRatio="16/10"
                  containerClassName="w-full h-full object-contain"
                />
              </div>

              <div className="p-6 bg-neutral-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{activeLightbox.location}</span>
                    <span className="opacity-40">|</span>
                    <span>{activeLightbox.year}</span>
                  </div>
                  <h3 className="text-lg font-bold">{activeLightbox.title}</h3>
                  <p className="text-xs text-neutral-400">{activeLightbox.narrative}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==============================================================
          6. 极客微终端弹窗 (Interactive Terminal Modal)
         ============================================================== */}
      <AnimatePresence>
        {showTerminalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTerminalModal(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full rounded-[32px] overflow-hidden border border-white/20 shadow-2xl bg-neutral-950"
            >
              <div className="absolute top-3 right-4 z-20">
                <button
                  type="button"
                  onClick={() => setShowTerminalModal(false)}
                  className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <GeekMiniTerminal />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
