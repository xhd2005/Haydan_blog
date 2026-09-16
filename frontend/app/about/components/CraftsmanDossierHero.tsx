'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { 
  Terminal, 
  Cpu, 
  Layers, 
  Compass, 
  MapPin, 
  Sparkles, 
  ArrowUpRight, 
  Mail, 
  Github, 
  Camera,
  Heart
} from 'lucide-react';
import Link from 'next/link';

export function CraftsmanDossierHero() {
  const { locale } = useI18n();

  return (
    <div className="relative h-full flex flex-col justify-between rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] bg-white/85 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm dark:shadow-xl space-y-6 overflow-hidden">
      {/* 背景微环境光晕 */}
      <div className="pointer-events-none absolute -right-20 -top-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* 顶部状态与时空坐标 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-white/[0.06] pb-4 relative z-10">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>HAYDEN XUE // DOSSIER & MANIFESTO</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
          <span>杭州 · 滨江 (30.2° N, 120.2° E)</span>
        </div>
      </div>

      {/* 核心个人声明与引语 */}
      <div className="space-y-3 relative z-10">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight leading-snug">
          {locale === 'zh'
            ? '以第一性原理雕琢软件架构，用人文与光线记录真实世界。'
            : 'Sculpting resilient systems with first principles, capturing reality with humanistic light.'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
          {locale === 'zh'
            ? '你好，我是 Hayden Xue。全栈系统架构师与数字花园建造者。热衷于在复杂高并发的分布式系统与极致纯粹的 Web 交互美学之间寻找平衡点。'
            : 'Hi, I’m Hayden Xue. Full-Stack Architect & Digital Garden Builder, exploring the convergence of distributed systems and interactive web craftsmanship.'}
        </p>
      </div>

      {/* 核心三维工匠支柱 (Bento Pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative z-10">
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-neutral-950/40 border border-slate-200/70 dark:border-white/[0.06] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>系统架构造物</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Java 21/25 虚拟线程、分布式存储与生产级高并发韧性。
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-neutral-950/40 border border-slate-200/70 dark:border-white/[0.06] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
            <Layers className="w-3.5 h-3.5" />
            <span>空间交互美学</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Next.js 全景通栏、双主题三维景深与微交互反馈。
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-neutral-950/40 border border-slate-200/70 dark:border-white/[0.06] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
            <Camera className="w-3.5 h-3.5" />
            <span>人文与旅行足迹</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            真实坐标记录，街头摄影漫游与流光片羽定格。
          </p>
        </div>
      </div>

      {/* 底部行动快捷通道 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/70 dark:border-white/[0.06] text-xs font-mono relative z-10">
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/xhd2005"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-foreground transition-all flex items-center gap-1.5"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
          <a
            href="mailto:contact@haydenxue.com"
            className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-foreground transition-all flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/journey"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>漫游足迹星图</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
