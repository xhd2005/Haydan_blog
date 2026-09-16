'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Sparkles, Cpu, Compass, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export interface ActDefinition {
  id: string;
  actNo: string;
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  subtitleEn: string;
  targetProgress: number; // 0.0 ~ 1.0
  icon: React.ComponentType<{ className?: string }>;
}

export const KEYNOTE_ACTS: ActDefinition[] = [
  {
    id: 'act-reveal',
    actNo: '01',
    titleZh: '身份初现',
    titleEn: 'The Reveal',
    subtitleZh: '液体透镜与造物宣言',
    subtitleEn: 'Liquid Lens & Manifesto',
    targetProgress: 0.08,
    icon: Sparkles,
  },
  {
    id: 'act-exploded',
    actNo: '02',
    titleZh: '全栈解构',
    titleEn: 'Exploded Engine',
    subtitleZh: '四维芯片 3D 爆炸图',
    subtitleEn: '4-Chip Architecture',
    targetProgress: 0.40,
    icon: Cpu,
  },
  {
    id: 'act-voyage',
    actNo: '03',
    titleZh: '真实航道',
    titleEn: 'Voyage Reel',
    subtitleZh: '空间足迹与光影穿越',
    subtitleEn: 'Authentic Footprints',
    targetProgress: 0.68,
    icon: Compass,
  },
  {
    id: 'act-axioms',
    actNo: '04',
    titleZh: '公理终章',
    titleEn: 'Axioms & Colophon',
    subtitleZh: '第一性原理金石铭牌',
    subtitleEn: 'Principles & Colophon',
    targetProgress: 0.92,
    icon: BookOpen,
  },
];

interface KeynoteActTimelineDockProps {
  progress: number; // 0.0 ~ 1.0
  activeActIndex: number; // 0 ~ 3
  onSelectAct: (index: number) => void;
}

export function KeynoteActTimelineDock({
  progress,
  activeActIndex,
  onSelectAct,
}: KeynoteActTimelineDockProps) {
  const { locale } = useI18n();

  // 键盘方向键监听：ArrowDown / PageDown 下一幕，ArrowUp / PageUp 上一幕
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在输入框中打字时误触发
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        const nextIdx = Math.min(KEYNOTE_ACTS.length - 1, activeActIndex + 1);
        onSelectAct(nextIdx);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        const prevIdx = Math.max(0, activeActIndex - 1);
        onSelectAct(prevIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeActIndex, onSelectAct]);

  return (
    <>
      {/* 1. 桌面端：右侧悬浮苹果式胶囊时间轨 (Apple Pinned Keynote Dock) */}
      <nav
        aria-label="苹果发布会剧场导航"
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-3 pointer-events-auto select-none"
      >
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative px-3 py-4 rounded-[28px] bg-white/[0.68] dark:bg-[#0c0d16]/[0.68] backdrop-blur-2xl backdrop-saturate-[180%] border border-white/80 dark:border-white/[0.14] shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.85),inset_0_-1.5px_1.5px_rgba(0,0,0,0.03),0_20px_50px_-15px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.22),inset_0_0_20px_rgba(16,185,129,0.05),0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col gap-3"
        >
          {/* 背景贯穿细进度轨 */}
          <div className="absolute top-8 bottom-8 right-[21px] w-[2px] bg-slate-200/80 dark:bg-white/[0.08] rounded-full overflow-hidden">
            <motion.div
              className="w-full bg-gradient-to-b from-emerald-400 to-cyan-500 origin-top"
              style={{ height: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>

          {KEYNOTE_ACTS.map((act, idx) => {
            const Icon = act.icon;
            const isActive = activeActIndex === idx;

            return (
              <motion.button
                key={act.id}
                type="button"
                onClick={() => onSelectAct(idx)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-300 text-right cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/[0.06]'
                }`}
              >
                {/* 文本标签 */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider">
                    <span className="opacity-60">{act.actNo}</span>
                    <span>{locale === 'zh' ? act.titleZh : act.titleEn}</span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground opacity-70 group-hover:opacity-100 hidden group-hover:inline">
                    {locale === 'zh' ? act.subtitleZh : act.subtitleEn}
                  </span>
                </div>

                {/* 状态徽标圆点 */}
                <span
                  className={`relative z-10 flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-300 ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.6)] scale-110'
                      : 'border-slate-300/80 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900/60 text-muted-foreground group-hover:border-emerald-400'
                  }`}
                >
                  <Icon className="w-2.5 h-2.5" />
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </nav>

      {/* 2. 移动端/平板端：底部吸底悬浮胶囊 (Mobile Dock) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 xl:hidden pointer-events-auto select-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.75] dark:bg-[#0c0d16]/[0.75] backdrop-blur-2xl backdrop-saturate-[180%] border border-white/80 dark:border-white/[0.12] shadow-2xl"
        >
          {KEYNOTE_ACTS.map((act, idx) => {
            const Icon = act.icon;
            const isActive = activeActIndex === idx;

            return (
              <button
                key={act.id}
                type="button"
                onClick={() => onSelectAct(idx)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/30 scale-105'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{act.actNo}</span>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* 3. 左下角：极简推演提示 (Scroll / Keyboard Prompt) */}
      <div className="fixed bottom-6 left-6 z-30 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.5] dark:bg-black/[0.4] backdrop-blur-md border border-white/60 dark:border-white/[0.08] text-[10px] font-mono text-muted-foreground select-none pointer-events-none">
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-white/80 dark:bg-neutral-800 text-[9px] shadow-xs">↑</kbd>
          <kbd className="px-1 py-0.5 rounded bg-white/80 dark:bg-neutral-800 text-[9px] shadow-xs">↓</kbd>
        </div>
        <span>{locale === 'zh' ? '滚轮推演 / 方向键跳幕' : 'Scroll or use Arrow keys'}</span>
        <span className="opacity-30">|</span>
        <span className="text-emerald-500 font-semibold">{Math.round(progress * 100)}%</span>
      </div>
    </>
  );
}
