'use client';

import React, { useEffect } from 'react';
import { Sparkles, Cpu, Compass, Milestone, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export interface CinematicAct {
  id: string;
  actNo: string;
  titleZh: string;
  titleEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CINEMATIC_ACTS: CinematicAct[] = [
  {
    id: 'act-hero',
    actNo: '01',
    titleZh: '身份初现',
    titleEn: 'The Reveal',
    icon: Sparkles,
  },
  {
    id: 'act-wilderness',
    actNo: '02',
    titleZh: '旷野胶片',
    titleEn: 'Wilderness',
    icon: Compass,
  },
  {
    id: 'act-chronicle',
    actNo: '03',
    titleZh: '时空跃迁',
    titleEn: 'Chronicle',
    icon: Milestone,
  },
  {
    id: 'act-terminal',
    actNo: '04',
    titleZh: '极客终端',
    titleEn: 'Terminal Deck',
    icon: Terminal,
  },
];

interface CinematicActDockProps {
  activeActIndex: number;
  onSelectAct: (index: number) => void;
  scrollProgress?: number;
}

export function CinematicActDock({
  activeActIndex,
  onSelectAct,
  scrollProgress = 0,
}: CinematicActDockProps) {
  // 键盘快捷键监听：ArrowDown / PageDown 下一幕，ArrowUp / PageUp 上一幕
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        const nextIdx = Math.min(CINEMATIC_ACTS.length - 1, activeActIndex + 1);
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
      {/* 桌面端右侧悬浮高定胶囊导航坞 */}
      <aside
        aria-label="电影分幕时空导航"
        className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3 select-none"
      >
        <div className="p-2 rounded-full bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col items-center gap-2">
          {/* 上一幕按钮 */}
          <button
            type="button"
            onClick={() => onSelectAct(Math.max(0, activeActIndex - 1))}
            disabled={activeActIndex === 0}
            title="上一幕 (ArrowUp)"
            className="p-1.5 rounded-full text-slate-400 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* 进度指示细线与点位 */}
          <div className="flex flex-col items-center gap-3 py-1">
            {CINEMATIC_ACTS.map((act, idx) => {
              const isActive = activeActIndex === idx;
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => onSelectAct(idx)}
                  className="group relative flex items-center justify-center"
                  title={`${act.actNo} // ${act.titleZh} (${act.titleEn})`}
                >
                  {/* 点位 / 胶囊指示器 */}
                  <div
                    className={`relative rounded-full transition-all duration-300 flex items-center justify-center ${
                      isActive
                        ? 'w-8 h-8 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'w-6 h-6 text-slate-400 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={isActive ? 'w-4 h-4' : 'w-3 h-3'} />
                  </div>

                  {/* 悬浮气泡卡片 (Hover Popover) */}
                  <div className="pointer-events-none absolute right-full mr-3 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out whitespace-nowrap">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-black/90 backdrop-blur-md text-white border border-white/10 shadow-xl flex items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-400 font-bold">{act.actNo}</span>
                      <span className="text-neutral-300">{act.titleZh}</span>
                      <span className="text-neutral-500 text-[10px]">{act.titleEn}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 下一幕按钮 */}
          <button
            type="button"
            onClick={() => onSelectAct(Math.min(CINEMATIC_ACTS.length - 1, activeActIndex + 1))}
            disabled={activeActIndex === CINEMATIC_ACTS.length - 1}
            title="下一幕 (ArrowDown)"
            className="p-1.5 rounded-full text-slate-400 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 底部小进度条 */}
        <div className="px-2.5 py-1 rounded-full bg-white/70 dark:bg-[#0f1117]/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/[0.06] shadow-sm text-[10px] font-mono text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
          <span className="text-emerald-500 font-bold">0{activeActIndex + 1}</span>
          <span className="opacity-40">/</span>
          <span>0{CINEMATIC_ACTS.length}</span>
        </div>
      </aside>

      {/* 移动端/平板顶部极简分幕指示胶囊 (吸顶半透明) */}
      <div className="lg:hidden fixed top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="px-3.5 py-1 rounded-full bg-white/80 dark:bg-[#0f1117]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg flex items-center gap-2 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            ACT {CINEMATIC_ACTS[activeActIndex]?.actNo || '01'}
          </span>
          <span className="text-slate-300 dark:text-neutral-700">|</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium text-[11px]">
            {CINEMATIC_ACTS[activeActIndex]?.titleZh || ''}
          </span>
        </div>
      </div>
    </>
  );
}
