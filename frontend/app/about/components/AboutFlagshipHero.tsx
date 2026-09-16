'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SiteSetting } from '@/lib/types';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { Mail, Github, Check, Sparkles, Compass, ArrowDown } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';

interface AboutFlagshipHeroProps {
  settings: SiteSetting | null;
  onExploreClick?: () => void;
}

export function AboutFlagshipHero({ settings, onExploreClick }: AboutFlagshipHeroProps) {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const contactEmail = 'haydenxue@example.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    toast.success(locale === 'en' ? 'Email copied' : '站长邮箱已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative w-full pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden">
      {/* 顶部状态胶囊：微光液态玻璃 */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <div className="liquid-glass-pill rounded-full px-4 py-2 inline-flex items-center gap-2.5 text-xs font-mono text-slate-700 dark:text-neutral-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-bold tracking-wider text-foreground">HAYDEN XUE</span>
          <span className="opacity-30">|</span>
          <span className="text-muted-foreground">ACTIVE ARCHITECT & DIGITAL GARDENER</span>
        </div>
      </motion.div>

      {/* 核心头像与光晕 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-6 group"
      >
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 liquid-glass-card shadow-xl group-hover:scale-105 transition-transform duration-500">
          <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100 dark:bg-neutral-900 border border-slate-200/60 dark:border-white/10">
            <Image
              src={settings?.avatar || DEFAULT_AVATAR}
              alt="Hayden Xue"
              fill
              sizes="144px"
              priority
              className="object-cover"
            />
          </div>
        </div>
        {/* 悬浮微光光斑 */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-blue-500/20 blur-xl opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity" />
      </motion.div>

      {/* 姓名与极客身份纯正性 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3 max-w-3xl mb-8"
      >
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground font-sans">
          Hayden Xue
        </h1>
        <div className="text-xs sm:text-sm font-mono tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
          Full-Stack Architect · Digital Gardener · Visual Explorer
        </div>
      </motion.div>

      {/* Instrument Serif 艺术哲思大题词 (双主题完美对比) */}
      <motion.blockquote
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-2xl sm:text-3xl md:text-4xl font-serif italic text-slate-800 dark:text-neutral-100 leading-snug max-w-3xl mx-auto mb-10 font-normal select-none"
      >
        “追求极简与克制，在不确定中构建高确定性的全栈工程与智能体系统。代码是逻辑的诗歌，而旅途与胶片则是生命的刻度。”
      </motion.blockquote>

      {/* 交互岛：液体玻璃快速通道 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        <button
          onClick={handleCopyEmail}
          className="liquid-glass-pill px-5 py-2.5 rounded-full inline-flex items-center gap-2.5 text-xs font-mono text-slate-800 dark:text-neutral-200 hover:text-foreground transition-all cursor-pointer group hover:scale-[1.03]"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 group-hover:text-emerald-500 transition-colors" />
          )}
          <span>{copied ? 'COPIED!' : contactEmail}</span>
        </button>

        <a
          href="https://github.com/xhd2005"
          target="_blank"
          rel="noopener noreferrer"
          className="liquid-glass-pill px-5 py-2.5 rounded-full inline-flex items-center gap-2.5 text-xs font-mono text-slate-800 dark:text-neutral-200 hover:text-foreground transition-all cursor-pointer hover:scale-[1.03]"
        >
          <Github className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
          <span>GITHUB / xhd2005</span>
        </a>

        {onExploreClick && (
          <button
            onClick={onExploreClick}
            className="liquid-glass-pill px-5 py-2.5 rounded-full inline-flex items-center gap-2 text-xs font-mono text-slate-800 dark:text-neutral-200 hover:text-foreground transition-all cursor-pointer hover:scale-[1.03]"
          >
            <span>EXPLORE DOSSIER</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        )}
      </motion.div>
    </section>
  );
}
