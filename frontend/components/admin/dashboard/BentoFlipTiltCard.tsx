'use client';

import React, { useRef, useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface BentoFlipTiltCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description: string;
  accentColor?: string; // 如 'emerald', 'teal', 'amber', 'cyan', 'indigo', 'rose'
  subBadge?: string;
  onClick?: () => void;
}

export function BentoFlipTiltCard({
  title,
  value,
  icon: Icon,
  description,
  accentColor = 'emerald',
  subBadge,
  onClick,
}: BentoFlipTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  // 平滑数字步进/翻牌插值
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = displayValue;
    const endVal = value;
    const duration = 800; // 800ms 平滑步进

    if (startVal === endVal) return;
    setIsFlipping(true);

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo 缓动曲线
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startVal + (endVal - startVal) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setIsFlipping(false);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  // 3D 鼠标物理倾斜计算
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 计算旋转倾斜角度（最大 9 度）
    const rotateX = ((y - centerY) / centerY) * -9;
    const rotateY = ((x - centerX) / centerX) * 9;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out',
    });

    // 动态镜面高光坐标
    setGlarePosition({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
      opacity: 0.18,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    });
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  // 颜色映射表
  const colorMap: Record<string, { icon: string; text: string; ring: string; glow: string }> = {
    emerald: {
      icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      ring: 'border-emerald-500/20',
      glow: 'rgba(16, 185, 129, 0.15)',
    },
    teal: {
      icon: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
      text: 'text-teal-600 dark:text-teal-400',
      ring: 'border-teal-500/20',
      glow: 'rgba(20, 184, 166, 0.15)',
    },
    amber: {
      icon: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      ring: 'border-amber-500/20',
      glow: 'rgba(245, 158, 11, 0.15)',
    },
    cyan: {
      icon: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
      text: 'text-cyan-600 dark:text-cyan-400',
      ring: 'border-cyan-500/20',
      glow: 'rgba(6, 182, 212, 0.15)',
    },
    indigo: {
      icon: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      ring: 'border-indigo-500/20',
      glow: 'rgba(99, 102, 241, 0.15)',
    },
    rose: {
      icon: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      ring: 'border-rose-500/20',
      glow: 'rgba(244, 63, 94, 0.15)',
    },
  };

  const themeColors = colorMap[accentColor] || colorMap.emerald;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={tiltStyle}
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.18] transition-shadow duration-300 cursor-pointer select-none group will-change-transform`}
    >
      {/* 动态 3D 镜面光影叠加层 */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, ${glarePosition.opacity}), transparent 65%)`,
        }}
      />

      {/* 柔光环境色溢出 */}
      <div
        className="pointer-events-none absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-40 z-0"
        style={{ background: themeColors.glow }}
      />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
        {/* 卡片头部：标题与流光图标 */}
        <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-zinc-400">
          <span className="text-xs font-semibold tracking-wide text-slate-600 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            {title}
          </span>
          <div className={`p-2 rounded-xl ${themeColors.icon} border ${themeColors.ring} transition-transform duration-300 group-hover:scale-110 shadow-xs`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* 动态翻牌计数器核心区 */}
        <div className="flex items-baseline gap-2 pt-1">
          <div className="relative inline-block font-mono">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${themeColors.text} drop-shadow-xs transition-transform duration-200 inline-block ${
                isFlipping ? 'scale-[1.03]' : 'scale-100'
              }`}
            >
              {displayValue.toLocaleString()}
            </span>
          </div>

          {subBadge && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400 border border-slate-200/60 dark:border-white/[0.04]">
              {subBadge}
            </span>
          )}
        </div>

        {/* 底部副文案 */}
        <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate flex items-center justify-between pt-0.5">
          <span>{description}</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-slate-400 dark:text-zinc-500">
            →
          </span>
        </div>
      </div>
    </div>
  );
}
