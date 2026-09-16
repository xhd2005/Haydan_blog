'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { MapPin, Sparkles, BookOpen, Clock, Activity, Cpu, Layers, Bot, Terminal, Flame, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface FocusTopic {
  title: string;
  tag?: string;
  progress: number;
  description?: string;
}

export interface ReadingNote {
  title: string;
  author: string;
  badge?: string;
  quote?: string;
  progress?: number;
}

export interface MicroLog {
  date: string;
  tag?: string;
  content: string;
}

interface LivingPulseCapsuleProps {
  currentCity?: string;
  building?: string;
  learning?: string;
  exploring?: string;
  thinking?: string;
  focusTopicsJson?: string;
  readingNotesJson?: string;
  microLogsJson?: string;
  updatedAt?: string;
}

export function LivingPulseCapsule({
  currentCity,
  building,
  learning,
  exploring,
  thinking,
  focusTopicsJson,
  readingNotesJson,
  microLogsJson,
  updatedAt,
}: LivingPulseCapsuleProps) {
  const { locale, t } = useTranslation();

  // 解析聚焦攻坚专题
  let focusTopics: FocusTopic[] = [];
  if (focusTopicsJson) {
    try {
      const parsed = JSON.parse(focusTopicsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        focusTopics = parsed;
      }
    } catch {
      focusTopics = [];
    }
  }
  if (focusTopics.length === 0) {
    focusTopics = [
      {
        title: locale === 'en' ? 'Java 25 Enterprise Concurrency & Virtual Threads' : 'Java 25 虚拟线程高吞吐与企业级并发',
        tag: 'JDK 25 / Loom',
        progress: 95,
        description: locale === 'en' ? 'JEP 491 non-blocking monitors & structured concurrency' : 'JEP 491 无固定监视器锁，支持百万轻量线程超高并发',
      },
      {
        title: locale === 'en' ? 'LangChain4j Multi-Agent & Digital Garden RAG' : 'LangChain4j 多模型智能体与数字花园 RAG',
        tag: 'Agentic AI',
        progress: 88,
        description: locale === 'en' ? 'DeepSeek MoE + SenseNova with Function Calling tools' : 'DeepSeek 与商汤混合模型，结合站内轻量向量库检索',
      },
      {
        title: locale === 'en' ? 'Three.js 3D Spatial Aesthetics & Tech Orbit Radar' : 'Three.js 3D 空间美学与引力星轨雷达',
        tag: 'Spatial Web',
        progress: 92,
        description: locale === 'en' ? 'Multi-depth lighting, concentric orbits & 120fps physics' : '三维景深光晕、同心星轨公转与 120fps 微交互',
      },
    ];
  }

  // 解析精读书摘
  let readingNotes: ReadingNote[] = [];
  if (readingNotesJson) {
    try {
      const parsed = JSON.parse(readingNotesJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        readingNotes = parsed;
      }
    } catch {
      readingNotes = [];
    }
  }
  if (readingNotes.length === 0) {
    readingNotes = [
      {
        title: locale === 'en' ? 'Designing Data-Intensive Applications' : '数据密集型应用系统设计',
        author: 'Martin Kleppmann',
        badge: 'Architecture Must-Read',
        quote: locale === 'en' 
          ? 'Reliability, scalability, and maintainability are the triple bedrock of modern software.' 
          : '可靠性、可扩展性与可维护性是现代分布式软件系统的永恒基石。',
        progress: 100,
      },
      {
        title: locale === 'en' ? 'The Art of Unix Programming' : 'Unix 编程艺术',
        author: 'Eric S. Raymond',
        badge: 'Craftsmanship',
        quote: locale === 'en'
          ? 'Rule of Modularity: Write simple parts connected by clean interfaces.'
          : '模块原则：编写简单的各部分，并由清晰纯正的接口连接。',
        progress: 85,
      },
    ];
  }

  // 解析工程微日志
  let microLogs: MicroLog[] = [];
  if (microLogsJson) {
    try {
      const parsed = JSON.parse(microLogsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        microLogs = parsed;
      }
    } catch {
      microLogs = [];
    }
  }
  if (microLogs.length === 0) {
    microLogs = [
      {
        date: '2026-09-08',
        tag: 'Release',
        content: locale === 'en'
          ? 'Completed Java 25 & LangChain4j integration, deployed 3D Tech Orbit Radar and high-res film darkroom.'
          : '全面落地 Java 25 与 LangChain4j 双智能外脑，构建 3D 引力星轨雷达与高精度时光胶片暗房。',
      },
    ];
  }

  const latestLog = microLogs[0];
  const activeCity = currentCity || (locale === 'zh' ? '中国 · 杭州 / 滨江 (30.2084°N, 120.2119°E)' : 'Hangzhou, China (30.2084°N, 120.2119°E)');

  return (
    <div id="living-pulse" className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 sm:p-8 space-y-6">
      {/* 头部状态胶囊 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>LIVING PULSE // {locale === 'zh' ? '流动心智胶囊 · 实时遥测' : 'REAL-TIME MINDSTREAM'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <span>{locale === 'zh' ? '此时此刻生活与工程心智' : 'What I am Doing Right Now'}</span>
          </h2>
        </div>

        {/* 物理驻留与更新时间 */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 text-foreground border border-border/60">
            <MapPin className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="text-muted-foreground">{locale === 'zh' ? '驻留：' : 'Loc: '}</span>
            <span className="font-semibold">{activeCity}</span>
          </div>
          {updatedAt && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/60 text-muted-foreground border border-border/40">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>{new Date(updatedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 中部网格：左侧三大攻坚专题，右侧在读书摘与微日志 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧：聚焦攻坚专题 (7 列) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-emerald-500" />
              <span>{locale === 'zh' ? '当下攻坚工程专题' : 'Active Engineering Sprints'}</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              {focusTopics.length} {locale === 'zh' ? '个进行中' : 'IN PROGRESS'}
            </span>
          </div>

          <div className="space-y-3">
            {focusTopics.map((topic, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-secondary/40 dark:bg-neutral-900/40 border border-border/60 hover:border-emerald-500/40 transition-all duration-300 space-y-2 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                    <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                      {topic.title}
                    </h4>
                  </div>
                  {topic.tag && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      {topic.tag}
                    </span>
                  )}
                </div>

                {topic.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {topic.description}
                  </p>
                )}

                {/* 进度条 */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>{locale === 'zh' ? '攻坚完成度' : 'Sprint Velocity'}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{topic.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-1000"
                      style={{ width: `${Math.min(100, Math.max(0, topic.progress))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：精读书摘与微日志 (5 列) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* 精读手记 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-cyan-500" />
              <span>{locale === 'zh' ? '在读经典与精辟书摘' : 'Curated Reading & Quotes'}</span>
            </div>

            {readingNotes.slice(0, 2).map((book, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-secondary/40 dark:bg-neutral-900/40 border border-border/60 hover:border-cyan-500/40 transition-all duration-300 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground line-clamp-1">《{book.title}》</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{book.author}</span>
                </div>
                {book.quote && (
                  <p className="text-xs italic text-muted-foreground leading-relaxed line-clamp-3 font-serif border-l-2 border-cyan-500/40 pl-2.5 my-1">
                    “{book.quote}”
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 最新一条微日志 */}
          {latestLog && (
            <div className="p-4 rounded-2xl bg-secondary/40 dark:bg-neutral-900/40 border border-border/60 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-indigo-400" />
                  {latestLog.date}
                </span>
                {latestLog.tag && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-500 font-mono">
                    {latestLog.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed line-clamp-2">
                {latestLog.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
