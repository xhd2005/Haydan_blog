'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Check, Github, Rss, BookOpen, Compass, Sparkles, Heart } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';

export function ApplePhilosophyDock() {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const email = 'haydenxue@example.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success(locale === 'en' ? 'Email copied' : '站长邮箱已复制');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 text-center">
      {/* 背景微晕 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[300px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* 顶部小标 */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono tracking-widest uppercase font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          ACT 04 · PHILOSOPHY & MANIFESTO
        </div>

        {/* 巨幕艺术引言 */}
        <blockquote className="space-y-4">
          <p className="text-2xl sm:text-3xl md:text-4xl font-serif text-slate-900 dark:text-white leading-relaxed max-w-2xl mx-auto">
            “以第一性原理叩问代码，在自然旷野中校准心智。”
          </p>
          <p className="text-sm sm:text-base font-serif italic text-slate-500 dark:text-neutral-400">
            &ldquo;To architect systems with first principles, to seek resonance in the boundless wilderness.&rdquo;
          </p>
          <cite className="block pt-2 text-xs font-mono font-medium tracking-widest uppercase text-emerald-600 dark:text-emerald-400 not-italic">
            —— Hayden Xue · 全栈系统架构师 & 数字造物者
          </cite>
        </blockquote>

        {/* 苹果高定悬浮联络坞 (Apple Floating Pill Dock) */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
          {/* 邮箱一键复制 */}
          <button
            type="button"
            onClick={handleCopyEmail}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-medium
              bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl
              text-slate-800 dark:text-slate-200
              border border-slate-200/80 dark:border-white/[0.08]
              hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-white/[0.05]
              shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>COPIED EMAIL</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span>haydenxue@example.com</span>
              </>
            )}
          </button>

          {/* GitHub 入口 */}
          <a
            href="https://github.com/xhd2005"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-mono font-medium
              bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl
              text-slate-700 dark:text-slate-300
              border border-slate-200/80 dark:border-white/[0.08]
              hover:border-emerald-500/50 hover:text-emerald-500
              shadow-sm transition-all duration-200"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          {/* 博客入口 */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-mono font-medium
              bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl
              text-slate-700 dark:text-slate-300
              border border-slate-200/80 dark:border-white/[0.08]
              hover:border-emerald-500/50 hover:text-emerald-500
              shadow-sm transition-all duration-200"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>深度博文</span>
          </Link>

          {/* 游记入口 */}
          <Link
            href="/journey"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-mono font-medium
              bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl
              text-slate-700 dark:text-slate-300
              border border-slate-200/80 dark:border-white/[0.08]
              hover:border-emerald-500/50 hover:text-emerald-500
              shadow-sm transition-all duration-200"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>高山足迹</span>
          </Link>

          {/* RSS 订阅 */}
          <a
            href="/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-mono font-medium
              bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl
              text-slate-700 dark:text-slate-300
              border border-slate-200/80 dark:border-white/[0.08]
              hover:border-emerald-500/50 hover:text-emerald-500
              shadow-sm transition-all duration-200"
          >
            <Rss className="w-3.5 h-3.5 text-amber-500" />
            <span>RSS 订阅</span>
          </a>
        </div>

        {/* 极简版权与纯正标识 */}
        <div className="pt-10 text-xs font-mono text-slate-400 dark:text-neutral-500 space-y-1">
          <p>© 2026 Hayden Xue. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1 text-[11px] opacity-75">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" />
            <span>Next.js 14, Java 21 & High-concurrency Passion.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
