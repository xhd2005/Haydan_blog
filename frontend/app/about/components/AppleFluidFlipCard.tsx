'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RotateCw } from 'lucide-react';

interface AppleFluidFlipCardProps {
  className?: string;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  badge?: string;
  flipLabel?: string;
  defaultFlipped?: boolean;
}

/**
 * AppleFluidFlipCard
 * 
 * 具备苹果硬件质感的 3D 静谧流体翻转卡片：
 * 1. CSS 3D 透视与 preserve-3d 物理翻转；
 * 2. 实时跟随光标的聚光微光边框（Spotlight Glow）；
 * 3. 悬停与点击双重触发，正面为极简现代艺术概览，背面为工程蓝图手稿或深度手记；
 * 4. 深度适配深色深邃曜石与浅色凝脂白瓷。
 */
export function AppleFluidFlipCard({
  className = '',
  frontContent,
  backContent,
  badge,
  flipLabel = '翻转查看手稿',
  defaultFlipped = false,
}: AppleFluidFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(defaultFlipped);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleToggleFlip = (e: React.MouseEvent) => {
    // 阻止内部交互链接的冒泡
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button.no-flip')) return;
    setIsFlipped((prev) => !prev);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleToggleFlip}
      className={`group relative cursor-pointer select-none [perspective:1400px] ${className}`}
    >
      {/* 光标跟随聚光外发光（Spotlight Ambient Aura） */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[28px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.15), transparent 70%)`,
        }}
      />

      {/* 3D 翻转主体容器 */}
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full min-h-[340px] rounded-[26px] transition-shadow duration-500 group-hover:shadow-2xl dark:group-hover:shadow-emerald-950/20 shadow-lg"
      >
        {/* ================= 正面 (FRONT) ================= */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="absolute inset-0 w-full h-full rounded-[26px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden
            bg-white/80 dark:bg-[#0f1117]/85 backdrop-blur-2xl
            border border-slate-200/80 dark:border-white/[0.08]
            shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
        >
          {/* 正面微光网格底纹 */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* 顶栏徽章与翻转按钮 */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            {badge ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-wider uppercase font-semibold
                bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                {badge}
              </span>
            ) : <span />}

            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-2.5 py-1 rounded-full bg-slate-100/70 dark:bg-white/[0.05] border border-slate-200/50 dark:border-white/[0.05] transition-colors"
            >
              <RotateCw className="w-3 h-3 group-hover:rotate-45 transition-transform duration-300" />
              <span>{flipLabel}</span>
            </button>
          </div>

          {/* 正面主体内容插槽 */}
          <div className="relative z-10 my-auto">
            {frontContent}
          </div>

          {/* 正面底栏提示微光 */}
          <div className="relative z-10 pt-4 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-neutral-500">
            <span>HAYDEN XUE · DOSSIER</span>
            <span className="flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
              CLICK TO FLIP ↵
            </span>
          </div>
        </div>

        {/* ================= 背面 (BACK / 架构手稿蓝图) ================= */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 w-full h-full rounded-[26px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden
            bg-[#0a0d14] text-slate-200 backdrop-blur-2xl
            border border-emerald-500/30 dark:border-emerald-400/25
            shadow-[inset_0_0_20px_rgba(16,185,129,0.08)]"
        >
          {/* 蓝图坐标网格 */}
          <div className="pointer-events-none absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* 背面顶栏 */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-wider font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              BLUEPRINT SKETCH · 架构手稿
            </span>

            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-emerald-400 px-2 py-0.5 rounded bg-white/[0.06] transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              <span>返回概览</span>
            </button>
          </div>

          {/* 背面主体内容插槽 */}
          <div className="relative z-10 my-auto overflow-y-auto pr-1 no-scrollbar">
            {backContent}
          </div>

          {/* 背面底栏 */}
          <div className="relative z-10 pt-3 border-t border-emerald-900/40 flex items-center justify-between text-[11px] font-mono text-emerald-500/80">
            <span>CORE ARCHITECTURE // FIRST PRINCIPLES</span>
            <span>RESTORE OVERVIEW ↵</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
