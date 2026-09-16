import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft, Sparkles } from 'lucide-react';
import { getServerTranslation } from '@/lib/i18n-server';

/**
 * 全局 404 极光花园迷失页 (AGENTS.md 铁律 3: 双主题三层级景深)
 */
export default function NotFound() {
  const { locale } = getServerTranslation();
  const isEn = locale === 'en';

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* 深空星轨氛围背景 */}
      <div className="starfield pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      {/* 极光环境光晕 */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 dark:bg-emerald-400/10 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-1/4 h-64 w-64 rounded-full bg-cyan-500/10 dark:bg-cyan-400/[0.08] blur-[90px]"
        aria-hidden="true"
      />

      <div className="relative space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>404 // {isEn ? 'LOST IN THE GARDEN' : '迷失于数字花园'}</span>
        </div>

        <h1 className="text-7xl sm:text-9xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-300 dark:via-teal-200 dark:to-cyan-300 bg-clip-text text-transparent select-none">
          404
        </h1>

        <p className="max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">
          {isEn
            ? 'This corner of the digital garden has not been cultivated yet. Let us guide you back to familiar paths.'
            : '这片花园的角落尚未开垦。让我们带你回到熟悉的小径。'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl dark:bg-white dark:text-neutral-950 active:scale-95"
          >
            <Compass className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
            {isEn ? 'Back to Garden' : '回到花园'}
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 px-6 py-3 text-sm font-semibold backdrop-blur-xl transition-all hover:border-emerald-500/50 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-teal-500" />
            {isEn ? 'Read Thoughts' : '阅读思考'}
          </Link>
        </div>
      </div>
    </div>
  );
}
