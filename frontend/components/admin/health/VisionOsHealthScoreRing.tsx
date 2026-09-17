'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';

interface VisionOsHealthScoreRingProps {
  score: number;
  grade?: 'S' | 'A' | 'B' | 'C' | 'D';
  gradeText?: string;
  isScanning?: boolean;
}

export function VisionOsHealthScoreRing({
  score,
  grade = 'S',
  gradeText = '极佳',
  isScanning = false,
}: VisionOsHealthScoreRingProps) {
  // 3D 翻牌平滑计数器动效
  const [displayScore, setDisplayScore] = useState<number>(0);

  useEffect(() => {
    let startVal = displayScore;
    const endVal = Math.max(0, Math.min(100, Math.round(score)));
    if (startVal === endVal) return;

    const duration = 1200; // ms
    const startTime = performance.now();

    const animateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * ease);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    const animId = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(animId);
  }, [score]);

  // 计算环形进度条周长 (半径 80, 周长 = 2 * PI * 80 ≈ 502.65)
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // 根据分数生成流光色彩
  const getGlowColors = (s: number) => {
    if (s >= 90) {
      return {
        stroke: 'url(#emeraldGlowGradient)',
        glowBg: 'rgba(16, 185, 129, 0.25)',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        textColor: 'text-emerald-500',
      };
    }
    if (s >= 75) {
      return {
        stroke: 'url(#cyanGlowGradient)',
        glowBg: 'rgba(6, 182, 212, 0.25)',
        badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
        textColor: 'text-cyan-500',
      };
    }
    if (s >= 60) {
      return {
        stroke: 'url(#amberGlowGradient)',
        glowBg: 'rgba(245, 158, 11, 0.25)',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        textColor: 'text-amber-500',
      };
    }
    return {
      stroke: 'url(#roseGlowGradient)',
      glowBg: 'rgba(244, 63, 94, 0.3)',
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse',
      textColor: 'text-rose-500',
    };
  };

  const glow = getGlowColors(displayScore);

  return (
    <div className="relative flex flex-col items-center justify-center p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg overflow-hidden group">
      {/* 3D 物理环境微光光晕底衬 */}
      <div
        className="absolute w-56 h-56 rounded-full blur-3xl pointer-events-none transition-all duration-700 -z-10"
        style={{
          background: glow.glowBg,
          transform: 'scale(1.2)',
        }}
      />

      {/* 环形光环与激光扫描动画容器 */}
      <div className="relative w-52 h-52 flex items-center justify-center select-none">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
          <defs>
            {/* 极客渐变定义 */}
            <linearGradient id="emeraldGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="cyanGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="amberGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="roseGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>

            {/* 激光微光滤镜 */}
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 底层深色磨砂轨道 */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-slate-100 dark:text-neutral-800"
          />

          {/* 刻度虚线环 */}
          <circle
            cx="100"
            cy="100"
            r={radius + 8}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 6"
            fill="transparent"
            className="text-slate-300 dark:text-neutral-700 opacity-60"
          />

          {/* 主跑分彩色光环 */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke={glow.stroke}
            strokeWidth="11"
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#laserGlow)"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* 激光扫描环微光动效 (Laser Scanning Sweep) */}
        {isScanning && (
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/60 animate-spin" style={{ animationDuration: '4s' }} />
        )}

        {/* 中心翻牌计数器 */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center font-mono">
            <span className={`text-5xl sm:text-6xl font-extrabold tracking-tight drop-shadow-sm ${glow.textColor}`}>
              {displayScore}
            </span>
            <span className="text-sm font-bold text-slate-400 ml-1">/100</span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-500 dark:text-zinc-400 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>全息健康评分</span>
          </div>
        </div>
      </div>

      {/* 底部评级徽章与描述 */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className={`px-4 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-xs ${glow.badgeClass}`}>
          <span className="text-sm font-extrabold font-mono">Grade {grade}</span>
          <span>•</span>
          <span>{gradeText}</span>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center max-w-xs font-sans">
          基于全站核心中间件延迟、2MB+ 巨幅大图、死链与安全威胁全景加权跑分
        </p>
      </div>
    </div>
  );
}
