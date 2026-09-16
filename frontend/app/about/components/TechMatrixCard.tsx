'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n-client';
import {
  Cpu,
  Zap,
  Server,
  Layers,
  Atom,
  Palette,
  Box,
  Bot,
  Brain,
  Sparkles,
  Database,
  HardDrive,
  Table,
  Boxes,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export type TechMaturity = 'ADOPT' | 'TRIAL' | 'ASSESS';
export type TechCategory = 'backend' | 'frontend' | 'ai' | 'infra';

export interface TechMatrixItem {
  id: string;
  titleZh: string;
  titleEn: string;
  maturity: TechMaturity;
  category: TechCategory;
  categoryZh: string;
  categoryEn: string;
  summaryZh: string;
  summaryEn: string;
  highlights: string[];
  link: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 14 项全栈核心工程技术
export const TECH_MATRIX_ITEMS: TechMatrixItem[] = [
  // 1. 后端并发底座 (3 项)
  {
    id: 'java-25-lts',
    titleZh: 'Java 25 LTS',
    titleEn: 'Java 25 LTS',
    maturity: 'ADOPT',
    category: 'backend',
    categoryZh: '后端底座',
    categoryEn: 'Backend',
    summaryZh: '原生虚拟线程高吞吐并发、模式匹配 switch、Sequenced Collections 与 Stream Gatherers。',
    summaryEn: 'High-throughput virtual threads, pattern matching switch, and Sequenced Collections.',
    highlights: ['Loom Concurrency', 'JDK 25 LTS', 'High Throughput'],
    link: '/blog?tag=Java',
    icon: Cpu,
  },
  {
    id: 'project-loom-jep491',
    titleZh: 'Project Loom 虚拟线程 (JEP 491)',
    titleEn: 'Project Loom Virtual Threads (JEP 491)',
    maturity: 'TRIAL',
    category: 'backend',
    categoryZh: '后端底座',
    categoryEn: 'Backend',
    summaryZh: '消除 synchronized 监视器挂起限制，轻量线程单机支撑百万级非阻塞高并发调度。',
    summaryEn: 'Unpinning synchronized monitors to support millions of lightweight concurrent threads.',
    highlights: ['JEP 491', 'Unpinned Monitor', 'Non-blocking I/O'],
    link: '/blog?tag=Concurrency',
    icon: Zap,
  },
  {
    id: 'spring-boot-33',
    titleZh: 'Spring Boot 3.3 企业级微服务',
    titleEn: 'Spring Boot 3.3 Enterprise Services',
    maturity: 'ADOPT',
    category: 'backend',
    categoryZh: '后端底座',
    categoryEn: 'Backend',
    summaryZh: 'Spring 6.2 架构、内建虚拟线程执行器、结构化异常体系与企业级安全鉴权底座。',
    summaryEn: 'Spring 6.2 architecture, native virtual thread pools, structured error handling, and security.',
    highlights: ['Spring 6.2', 'Virtual Pools', 'Security 6'],
    link: '/blog?tag=Architecture',
    icon: Server,
  },

  // 2. 现代前端空间 (4 项)
  {
    id: 'nextjs-14',
    titleZh: 'Next.js 14 App Router',
    titleEn: 'Next.js 14 App Router',
    maturity: 'ADOPT',
    category: 'frontend',
    categoryZh: '现代前端',
    categoryEn: 'Frontend',
    summaryZh: '全栈流式渲染 (Streaming SSR) 与按需增量静态再生 (ISR Revalidation) 极致提速。',
    summaryEn: 'Full-stack Streaming SSR and on-demand ISR revalidation for instant edge delivery.',
    highlights: ['App Router', 'On-demand ISR', 'Streaming SSR'],
    link: '/blog?tag=Next.js',
    icon: Layers,
  },
  {
    id: 'react-18-rsc',
    titleZh: 'React 18 Server Components',
    titleEn: 'React 18 Server Components',
    maturity: 'ADOPT',
    category: 'frontend',
    categoryZh: '现代前端',
    categoryEn: 'Frontend',
    summaryZh: '零打包体积服务端组件 RSC、流式 Suspense 水合，兼顾极致 SEO 与秒开首屏。',
    summaryEn: 'Zero-bundle-size RSC and streaming Suspense hydration for lightning-fast loads.',
    highlights: ['React Server Components', 'Suspense Stream', 'Zero Bundle'],
    link: '/blog?tag=React',
    icon: Atom,
  },
  {
    id: 'tailwind-3depth',
    titleZh: 'Tailwind 双主题三维景深',
    titleEn: 'Tailwind Multi-Depth Lighting',
    maturity: 'TRIAL',
    category: 'frontend',
    categoryZh: '现代前端',
    categoryEn: 'Frontend',
    summaryZh: '高定白瓷与深曜石双主题「底色层 -> 内容卡片层 -> 悬浮交互层」三维空间立体景深。',
    summaryEn: 'White porcelain and deep obsidian spatial multi-depth tokens with ambient glow.',
    highlights: ['Dual Theme', 'Spatial Depth', '1px Ambient Glow'],
    link: '/blog?tag=Frontend',
    icon: Palette,
  },
  {
    id: 'threejs-webgl',
    titleZh: 'Three.js WebGL',
    titleEn: 'Three.js WebGL 3D Pipeline',
    maturity: 'TRIAL',
    category: 'frontend',
    categoryZh: '现代前端',
    categoryEn: 'Frontend',
    summaryZh: '原生 WebGL 着色器粒子管线，构建 3D 几何罗盘解构与发光点阵航海地球仪交互。',
    summaryEn: 'Native WebGL shaders driving 3D geometric compass scrollytelling and voyage globe.',
    highlights: ['Three.js', 'Shader Particles', 'Slerp Camera'],
    link: '/blog?tag=WebGL',
    icon: Box,
  },

  // 3. AI 智能体外脑 (4 项)
  {
    id: 'langchain4j',
    titleZh: 'LangChain4j 0.35.0',
    titleEn: 'LangChain4j 0.35.0',
    maturity: 'ADOPT',
    category: 'ai',
    categoryZh: 'AI 外脑',
    categoryEn: 'Agentic AI',
    summaryZh: 'Java 原生智能体框架，轻量内存向量嵌入与声明式 @Tool 工具链。',
    summaryEn: 'Java-native agentic framework with in-memory embeddings and declarative @Tool pipelines.',
    highlights: ['LangChain4j', 'Agent Tools', 'In-memory Vector'],
    link: '/blog?tag=AI',
    icon: Bot,
  },
  {
    id: 'deepseek-v4',
    titleZh: 'DeepSeek V4',
    titleEn: 'DeepSeek V4',
    maturity: 'ASSESS',
    category: 'ai',
    categoryZh: 'AI 外脑',
    categoryEn: 'Agentic AI',
    summaryZh: '混合专家 (MoE) 架构高速推理流，429 指数退避重试与容灾自愈。',
    summaryEn: 'Mixture-of-Experts stream reasoning with 429 exponential backoff retries.',
    highlights: ['DeepSeek-V4', 'MoE Architecture', 'Stream Reasoning'],
    link: '/blog?tag=DeepSeek',
    icon: Brain,
  },
  {
    id: 'sensenova',
    titleZh: '商汤日日新 SenseNova',
    titleEn: 'SenseNova 5.5 Enterprise',
    maturity: 'TRIAL',
    category: 'ai',
    categoryZh: 'AI 外脑',
    categoryEn: 'Agentic AI',
    summaryZh: '企业级大模型基座，海量上下文长文本精读与毫秒级多模型热备协同。',
    summaryEn: 'Enterprise LLM foundation with extensive context windows and real-time hot backup.',
    highlights: ['SenseNova 5.5', 'Long Context', 'Fail-safe Hot Backup'],
    link: '/blog?tag=SenseNova',
    icon: Sparkles,
  },
  {
    id: 'true-rag',
    titleZh: '数字花园 True RAG 向量知识库',
    titleEn: 'Digital Garden True RAG',
    maturity: 'ADOPT',
    category: 'ai',
    categoryZh: 'AI 外脑',
    categoryEn: 'Agentic AI',
    summaryZh: '全站博文语义切片检索，精准出处佐证与伴读助手交互知识卡片。',
    summaryEn: 'Full-site semantic post chunk retrieval, source citation cards, and co-pilot RAG.',
    highlights: ['True RAG', 'Semantic Chunks', 'Citation Cards'],
    link: '/blog?tag=RAG',
    icon: Database,
  },

  // 4. 云原生与存储基建 (3 项)
  {
    id: 'minio-storage',
    titleZh: 'MinIO 云端对象存储直传',
    titleEn: 'MinIO Cloud Storage Direct',
    maturity: 'ADOPT',
    category: 'infra',
    categoryZh: '云原生',
    categoryEn: 'Cloud & Infra',
    summaryZh: '生产集群 (49.233.166.212:9000) 媒体中心，支持 200MB 视频与图片安全直传。',
    summaryEn: 'Production media hub (49.233.166.212:9000) supporting direct 200MB video and image streaming.',
    highlights: ['MinIO S3', 'Media Hub', '200MB Direct'],
    link: '/blog?tag=Storage',
    icon: HardDrive,
  },
  {
    id: 'mysql-8',
    titleZh: 'MySQL 8 生产数据库',
    titleEn: 'MySQL 8 Production Database',
    maturity: 'ADOPT',
    category: 'infra',
    categoryZh: '云原生',
    categoryEn: 'Cloud & Infra',
    summaryZh: '企业级关系型数据底座，双语数据模型、事务隔离与高可用索引设计。',
    summaryEn: 'Enterprise relational storage, bilingual schema models, ACID transactions, and indexes.',
    highlights: ['MySQL 8', 'ACID Transactions', 'High Availability'],
    link: '/blog?tag=Database',
    icon: Table,
  },
  {
    id: 'docker-container',
    titleZh: 'Docker 容器化',
    titleEn: 'Docker Containerization',
    maturity: 'ADOPT',
    category: 'infra',
    categoryZh: '云原生',
    categoryEn: 'Cloud & Infra',
    summaryZh: '轻量标准容器镜像交付，多阶段构建、资源隔离与全自动 CI/CD 交付底座。',
    summaryEn: 'Lightweight container images, multi-stage builds, and automated CI/CD foundations.',
    highlights: ['Docker', 'Multi-stage Build', 'CI/CD'],
    link: '/blog?tag=DevOps',
    icon: Boxes,
  },
];

// 成熟度徽章配置
const MATURITY_CONFIG: Record<
  TechMaturity,
  {
    labelZh: string;
    labelEn: string;
    dotColor: string;
    glowShadow: string;
    borderClass: string;
    bgClass: string;
    spotlightGlow: string;
    borderGlow: string;
  }
> = {
  ADOPT: {
    labelZh: 'ADOPT · 核心基石',
    labelEn: 'ADOPT // CORE',
    dotColor: 'bg-[#10b981]',
    glowShadow: 'shadow-[0_0_8px_#10b981]',
    borderClass: 'border-emerald-500/30 dark:border-emerald-500/40',
    bgClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    spotlightGlow: 'rgba(16, 185, 129, 0.15)',
    borderGlow: 'rgba(16, 185, 129, 0.45)',
  },
  TRIAL: {
    labelZh: 'TRIAL · 探索演进',
    labelEn: 'TRIAL // EVOLUTION',
    dotColor: 'bg-[#06b6d4]',
    glowShadow: 'shadow-[0_0_8px_#06b6d4]',
    borderClass: 'border-cyan-500/30 dark:border-cyan-500/40',
    bgClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
    spotlightGlow: 'rgba(6, 182, 212, 0.15)',
    borderGlow: 'rgba(6, 182, 212, 0.45)',
  },
  ASSESS: {
    labelZh: 'ASSESS · 前沿洞察',
    labelEn: 'ASSESS // FRONTIER',
    dotColor: 'bg-[#a855f7]',
    glowShadow: 'shadow-[0_0_8px_#a855f7]',
    borderClass: 'border-purple-500/30 dark:border-purple-500/40',
    bgClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    spotlightGlow: 'rgba(168, 85, 247, 0.15)',
    borderGlow: 'rgba(168, 85, 247, 0.45)',
  },
};

// 交互式单个技术卡片子组件 (带 3D 鼠标视差 Tilt 与 Spotlight 流光边框)
interface TechItemCardProps {
  item: TechMatrixItem;
  locale: string;
}

function TechItemCard({ item, locale }: TechItemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const matCfg = MATURITY_CONFIG[item.maturity];
  const IconComponent = item.icon;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // 计算 3D 视差倾斜角度 (±7deg)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = -((y - centerY) / centerY) * 7;
    const tiltY = ((x - centerX) / centerX) * 7;

    setTilt({ x: tiltX, y: tiltY });
    setIsHovered(true);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const title = locale === 'en' ? item.titleEn : item.titleZh;
  const summary = locale === 'en' ? item.summaryEn : item.summaryZh;
  const categoryName = locale === 'en' ? item.categoryEn : item.categoryZh;
  const maturityLabel = locale === 'en' ? matCfg.labelEn : matCfg.labelZh;

  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
          z: isHovered ? 4 : 0,
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 280,
          mass: 0.4,
        }}
        className="group/card relative h-full rounded-2xl bg-white/[0.70] dark:bg-[#0c0d16]/[0.65] backdrop-blur-2xl backdrop-saturate-[180%] border border-white/80 dark:border-white/[0.12] p-3.5 sm:p-4 overflow-hidden shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.85),inset_0_-1px_1px_rgba(0,0,0,0.03),0_10px_25px_-5px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.18),0_15px_30px_-10px_rgba(0,0,0,0.5)] hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
      >
        {/* 动态光斑跟随层 (Spotlight Follower) */}
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300 ease-out"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, ${matCfg.spotlightGlow}, transparent 70%)`,
          }}
          aria-hidden="true"
        />

        {/* 1px 微光边框高亮跟踪 (Border Follower via CSS Mask) */}
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300 ease-out"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(130px circle at ${mousePos.x}px ${mousePos.y}px, ${matCfg.borderGlow}, transparent 60%)`,
            maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
          aria-hidden="true"
        />

        {/* 顶部行：图标 + 成熟度徽章 */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100/80 dark:bg-neutral-800/80 text-slate-700 dark:text-slate-300 group-hover/card:text-emerald-500 dark:group-hover/card:text-emerald-400 group-hover/card:scale-110 transition-all duration-300 shrink-0">
              <IconComponent className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
              {categoryName}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${matCfg.borderClass} ${matCfg.bgClass} transition-all duration-300`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${matCfg.dotColor} ${matCfg.glowShadow}`}
            />
            <span>{maturityLabel}</span>
          </div>
        </div>

        {/* 中部核心信息：标题与技术摘要 */}
        <div className="relative z-10 space-y-1.5 my-auto">
          <Link
            href={item.link}
            className="group/link inline-flex items-center gap-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400 transition-colors line-clamp-1"
          >
            <span>{title}</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-x-0 group-hover/card:translate-y-0 transition-all duration-200 text-emerald-500" />
          </Link>

          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {summary}
          </p>
        </div>

        {/* 底部技术特性标签与链接条 */}
        <div className="relative z-10 flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-slate-200/60 dark:border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-1">
            {item.highlights.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100/70 dark:bg-neutral-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/[0.04]"
              >
                {tag}
              </span>
            ))}
          </div>

          <Link
            href={item.link}
            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 group-hover/card:translate-x-0.5 transition-transform"
          >
            <span>{locale === 'en' ? 'INSIGHTS' : '手记'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// 主技术矩阵组件
export function TechMatrixCard() {
  const { locale } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<'all' | TechCategory>('all');

  // 分类统计
  const allCount = TECH_MATRIX_ITEMS.length;
  const backendCount = TECH_MATRIX_ITEMS.filter((i) => i.category === 'backend').length;
  const frontendCount = TECH_MATRIX_ITEMS.filter((i) => i.category === 'frontend').length;
  const aiCount = TECH_MATRIX_ITEMS.filter((i) => i.category === 'ai').length;
  const infraCount = TECH_MATRIX_ITEMS.filter((i) => i.category === 'infra').length;

  const adoptCount = TECH_MATRIX_ITEMS.filter((i) => i.maturity === 'ADOPT').length;
  const trialCount = TECH_MATRIX_ITEMS.filter((i) => i.maturity === 'TRIAL').length;
  const assessCount = TECH_MATRIX_ITEMS.filter((i) => i.maturity === 'ASSESS').length;

  // 过滤项
  const filteredItems =
    activeCategory === 'all'
      ? TECH_MATRIX_ITEMS
      : TECH_MATRIX_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div
      className="flex flex-col justify-between h-full space-y-4 sm:space-y-5"
      tabIndex={0}
      aria-label="全栈工程技术矩阵"
    >
      {/* 头部：标题、统计与三级成熟度图例 */}
      <div className="flex flex-col gap-3 border-b border-slate-200/60 dark:border-white/[0.06] pb-3.5 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Layers className="w-3 h-3 animate-pulse motion-reduce:animate-none" />
              <span>
                TECH MATRIX 2026 // {locale === 'en' ? 'FULLSTACK ARCHITECTURE' : '全栈工程矩阵'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-foreground flex items-center gap-2">
              <span>{locale === 'en' ? 'Interactive Tech Matrix' : '全栈工程技术矩阵'}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {locale === 'en'
                ? '14 Core Architectural Technologies · 4 Critical Pillars · 3 Maturity Levels'
                : '14 项核心架构技术 · 4 大关键领域 · 3 级成熟度演进'}
            </p>
          </div>

          {/* 右侧成熟度三级统计徽标 */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
              title="ADOPT · 核心基石"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]" />
              <span>ADOPT ({adoptCount})</span>
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/25"
              title="TRIAL · 探索演进"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] shadow-[0_0_6px_#06b6d4]" />
              <span>TRIAL ({trialCount})</span>
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/25"
              title="ASSESS · 前沿洞察"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] shadow-[0_0_6px_#a855f7]" />
              <span>ASSESS ({assessCount})</span>
            </div>
          </div>
        </div>

        {/* 领域分类过滤 Tab */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3" />
            <span>{locale === 'en' ? 'Pillars:' : '领域:'}</span>
          </span>

          {[
            { key: 'all' as const, labelZh: '全部 ALL', labelEn: 'ALL', count: allCount },
            { key: 'backend' as const, labelZh: '后端底座', labelEn: 'Backend', count: backendCount },
            { key: 'frontend' as const, labelZh: '现代前端', labelEn: 'Frontend', count: frontendCount },
            { key: 'ai' as const, labelZh: 'AI 外脑', labelEn: 'Agentic AI', count: aiCount },
            { key: 'infra' as const, labelZh: '云原生', labelEn: 'Cloud & Infra', count: infraCount },
          ].map((tab) => {
            const isActive = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={`relative px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-all duration-200 shrink-0 select-none ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm font-semibold'
                    : 'bg-slate-100/80 dark:bg-neutral-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-neutral-700/80 border border-slate-200/60 dark:border-white/[0.05]'
                }`}
              >
                <span>{locale === 'en' ? tab.labelEn : tab.labelZh}</span>
                <span className="ml-1 opacity-70 text-[10px]">({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 核心内容区：卡片网格 */}
      <div className="flex-1 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 ${
              activeCategory === 'all'
                ? 'max-h-[390px] sm:max-h-[440px] overflow-y-auto pr-1 sm:pr-1.5'
                : ''
            }`}
          >
            {filteredItems.map((item) => (
              <TechItemCard key={item.id} item={item} locale={locale} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部底栏：全景引导与站内关联 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping motion-reduce:animate-none" />
          <span>
            {locale === 'en'
              ? 'Hayden Xue Architecture Matrix · Production Live'
              : 'Hayden Xue 工程技术矩阵 · 生产体系稳定运行'}
          </span>
        </span>

        <Link
          href="/blog?tag=Java"
          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
        >
          <span>{locale === 'en' ? 'Explore All Technical Blogs' : '探索站内全部技术手记'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
