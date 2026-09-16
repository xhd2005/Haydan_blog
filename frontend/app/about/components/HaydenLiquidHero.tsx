'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SeamlessLoopVideo } from './SeamlessLoopVideo';
import { Mail, Github, Check, ArrowDown, Sparkles, Compass } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import { SiteSetting } from '@/lib/types';

interface HaydenLiquidHeroProps {
  settings?: SiteSetting | null;
  onExploreClick?: () => void;
}

export function HaydenLiquidHero({ settings, onExploreClick }: HaydenLiquidHeroProps) {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);

  const contactEmail = 'haydenxue@example.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    toast.success(locale === 'en' ? 'Email copied to clipboard' : '站长邮箱已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative w-full min-h-[92vh] sm:min-h-screen flex flex-col justify-between px-4 sm:px-8 lg:px-12 pt-28 sm:pt-32 pb-12 overflow-hidden bg-black text-white">
      {/* 纯黑背景全景视频底图：无缝 500ms rAF 淡入淡出 Crossfade 循环 */}
      <div className="absolute inset-0 z-0">
        <SeamlessLoopVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4"
          className="w-full h-full opacity-60"
        />
        {/* 电影感暗光遮罩与向底部沉降过渡 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
      </div>

      {/* 顶部液体玻璃状态胶囊 */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 self-start"
      >
        <div className="liquid-glass rounded-full px-4 py-2 inline-flex items-center gap-3 text-xs font-mono tracking-wider text-neutral-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-white font-medium">HAYDEN XUE</span>
          <span className="text-white/20">|</span>
          <span className="text-neutral-400">ARCHITECT & GARDENER</span>
        </div>
      </motion.div>

      {/* 核心巨幕排版：Instrument Serif 标题 + 衬线流体感 */}
      <div className="relative z-10 max-w-5xl my-auto py-12 sm:py-16 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>Digital Sanctuary // Presence 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.02] text-white select-none font-serif">
            Architecting the unseen,
            <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400 font-serif font-normal mt-1">
              nurturing the digital garden.
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg md:text-xl text-neutral-300 max-w-2xl font-sans font-light leading-relaxed"
        >
          在不确定中构建高确定性的全栈工程与智能体系统。代码是逻辑的诗歌，而旅途与胶片则是生命的刻度。
        </motion.p>

        {/* 交互岛：液体玻璃邮箱复制 + GitHub 链接 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-3 pt-2"
        >
          <button
            onClick={handleCopyEmail}
            className="liquid-glass px-5 py-2.5 rounded-full inline-flex items-center gap-2.5 text-xs font-mono text-neutral-200 hover:text-white transition-colors cursor-pointer group"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
            )}
            <span>{copied ? 'EMAIL COPIED' : contactEmail}</span>
          </button>

          <a
            href="https://github.com/xhd2005"
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-glass px-5 py-2.5 rounded-full inline-flex items-center gap-2.5 text-xs font-mono text-neutral-200 hover:text-white transition-colors cursor-pointer"
          >
            <Github className="w-3.5 h-3.5 text-neutral-400" />
            <span>GITHUB / xhd2005</span>
          </a>
        </motion.div>
      </div>

      {/* 底部探索锚点指示器 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-6 text-xs font-mono text-neutral-400"
      >
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-neutral-400" />
          <span>SCROLL TO EXPLORE DOSSIER</span>
        </div>

        <button
          onClick={onExploreClick}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <span>PROCEED</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </button>
      </motion.div>
    </section>
  );
}
