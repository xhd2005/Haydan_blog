'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Post, AiRadarInsight } from '@/lib/types';
import { useTranslation } from '@/lib/i18n-client';
import { Sparkles, ChevronDown, ChevronUp, Cpu, Compass, BookOpen, Layers, ArrowRight } from 'lucide-react';

interface AiConceptRadarDeckProps {
  post: Post;
}

export function AiConceptRadarDeck({ post }: AiConceptRadarDeckProps) {
  const { locale, t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  // 解析文章持久化或者生成的雷达数据
  let radar: AiRadarInsight | null = null;
  if (post.aiRadarJson) {
    try {
      radar = JSON.parse(post.aiRadarJson);
    } catch {
      radar = null;
    }
  }

  // 若无持久化数据，基于文章元数据构建智能兜底雷达
  if (!radar) {
    const isJava = (post.title + (post.content || '')).includes('Java') || (post.title + (post.content || '')).includes('线程');
    const isNext = (post.title + (post.content || '')).includes('Next.js') || (post.title + (post.content || '')).includes('React');
    const isThree = (post.title + (post.content || '')).includes('Three.js') || (post.title + (post.content || '')).includes('WebGL');

    const defaultConcepts = [];
    if (isJava) {
      defaultConcepts.push({ name: 'Virtual Threads', essence: '协程级轻量高并发与 Continuation 机制', tag: 'Java' });
    }
    if (isNext) {
      defaultConcepts.push({ name: 'React Server Components', essence: '服务端分层流水线与零客户端 Bundle 打包', tag: 'Next.js' });
    }
    if (isThree) {
      defaultConcepts.push({ name: 'GPU Shader Pipeline', essence: 'GPU 顶点/片元着色器流水线与 60FPS 动力学', tag: 'Three.js' });
    }
    if (defaultConcepts.length === 0) {
      defaultConcepts.push({ name: 'Deterministic Architecture', essence: '追求极简与高确定性的全栈工程设计', tag: 'Architecture' });
      defaultConcepts.push({ name: 'Digital Garden Philosophy', essence: '随时间复利演进的长效心智模型与知识沉淀', tag: 'Garden' });
    }

    radar = {
      summary: post.excerpt || (locale === 'en'
        ? 'A comprehensive technical exploration into core system principles and resilient architectures by Hayden Xue.'
        : '系统探讨核心技术原理与工程落地实践，提炼在复杂不确定环境中构建高确定性系统的范式。'),
      concepts: defaultConcepts,
      prerequisites: locale === 'en'
        ? 'Basic familiarity with modern full-stack development and distributed systems.'
        : '具备现代全栈工程研发基础，熟悉 Java 21+ 现代语法或 React / Next.js 核心概念。',
      difficulty: (post.content?.length || 0) > 1500 ? 'ADVANCED' : ((post.content?.length || 0) > 600 ? 'INTERMEDIATE' : 'BEGINNER'),
      maturityReason: post.maturity === 'EVERGREEN'
        ? (locale === 'en' ? 'Evergreen piece with lasting architectural value.' : '历经长期工程实践沉淀的常青思维模型。')
        : (locale === 'en' ? 'Growing knowledge node with ongoing updates.' : '正在生长演进的数字花园思想花蕾。'),
    };
  }

  const maturityBadge = {
    SEEDLING: { icon: '🌱', label: locale === 'en' ? 'Seedling' : '萌芽', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    BUDDING: { icon: '🌿', label: locale === 'en' ? 'Budding' : '生长', color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
    EVERGREEN: { icon: '🌲', label: locale === 'en' ? 'Evergreen' : '常青', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  }[post.maturity || 'BUDDING'];

  const difficultyLabel = {
    BEGINNER: locale === 'en' ? 'Beginner' : '入门引导',
    INTERMEDIATE: locale === 'en' ? 'Intermediate' : '进阶攻坚',
    ADVANCED: locale === 'en' ? 'Advanced' : '架构前沿',
  }[radar.difficulty || 'INTERMEDIATE'];

  return (
    <div className="relative my-6 rounded-3xl overflow-hidden border border-slate-200/90 dark:border-white/[0.09] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 group">
      {/* 顶部极光微流光装饰线 */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-cyan-500/60 opacity-80" />

      {/* 头部舱体栏 */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 dark:bg-neutral-950/40 border-b border-slate-200/70 dark:border-white/[0.06] select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-emerald-500" />
            <span>HAYDEN AI // INTEL RADAR</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${maturityBadge.color}`}>
              {maturityBadge.icon} {maturityBadge.label}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono border text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/[0.05] border-neutral-200 dark:border-white/[0.08]">
              {difficultyLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? (locale === 'en' ? 'Collapse' : '收起速读') : (locale === 'en' ? 'Expand' : '展开速读')}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 展开内容区 */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* 30 秒 TL;DR 执行摘要 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{locale === 'en' ? '30s Executive TL;DR' : '30秒核心论点速读'}</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.04] p-3.5 rounded-2xl border border-emerald-500/15">
              {radar.summary}
            </p>
          </div>

          {/* 核心概念芯片 */}
          {radar.concepts && radar.concepts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5" />
                <span>{locale === 'en' ? 'Concept Radar & Architecture Essence' : '核心概念芯片与本质解构'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {radar.concepts.map((chip, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] hover:border-sky-500/30 transition-all hover:translate-y-[-1px] space-y-1 group/chip"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground group-hover/chip:text-sky-500 transition-colors">
                        {chip.name}
                      </span>
                      {chip.tag && (
                        <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
                          {chip.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {chip.essence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 前置阅读建议 */}
          {radar.prerequisites && (
            <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center gap-2 text-xs text-muted-foreground">
              <Compass className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-mono text-[11px] font-medium text-foreground shrink-0">
                {locale === 'en' ? 'Prerequisites:' : '建议前置知识:'}
              </span>
              <span className="text-[11px] leading-relaxed line-clamp-1">
                {radar.prerequisites}
              </span>
            </div>
          )}

          {/* 底部与 AI 对话快捷入口 */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{locale === 'en' ? 'Questions about this design?' : '对本文架构或推演存疑？'}</span>
            </div>
            <Link
              href={`/ai?prompt=${encodeURIComponent(`我想深入探讨你的文章《${post.title}》，请帮我剖析其核心架构权衡与落地要点。`)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-mono font-medium transition-all shadow-sm border border-blue-200/60 dark:border-blue-800/40"
            >
              <span>{locale === 'en' ? 'Ask Hayden AI' : '向外脑追问本文'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
