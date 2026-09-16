'use client';

import React from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface CenteredPageLoaderProps {
  title?: string;
  subtitle?: string;
  type?: string;
  className?: string;
}

/**
 * Hayden Xue 专属极简无框居中加载动效 (CenteredPageLoader)
 * 参考足迹页面艺术设计：
 * 1. 彻底不被框起来（无卡片外框、无背景矩形、零约束通透感）；
 * 2. 纯粹居中左右排版：左侧品牌 Logo + 中间极细微光分割线 + 右侧现代精致文本；
 * 3. 伴随翡翠微光呼吸与极细流线指示槽，极致简约高级。
 */
export function CenteredPageLoader({
  title = '博客手记 · THOUGHTS & ESSAYS',
  subtitle = 'From the East, toward the unknown.',
  className = '',
}: CenteredPageLoaderProps) {
  return (
    <div
      className={`min-h-[calc(100dvh-120px)] sm:min-h-[calc(100vh-140px)] w-full flex flex-col items-center justify-center select-none px-4 sm:px-6 my-auto animate-fade-in ${className}`}
      aria-busy="true"
      role="status"
    >
      {/* 居中核心：无框左右分布 [Logo] | [Title & Subtitle] */}
      <div className="relative flex items-center justify-center gap-4 sm:gap-5 max-w-xl">
        {/* 左侧：精美品牌 Logo (带微动效与翡翠环境微光) */}
        <div className="shrink-0 flex items-center justify-center">
          <BrandLogo size={42} variant="aurora" animated={true} glow={true} />
        </div>

        {/* 中间：极细半透明微光垂直分隔线 */}
        <div
          className="w-[1px] h-9 sm:h-11 bg-slate-300/80 dark:bg-white/15 shrink-0"
          aria-hidden="true"
        />

        {/* 右侧：多层次现代排印 */}
        <div className="flex flex-col justify-center space-y-1 text-left min-w-0">
          {/* 主标题 */}
          <h3 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans truncate">
            {title}
          </h3>

          {/* 副标语 */}
          {subtitle && (
            <p className="text-xs sm:text-[13px] font-serif italic text-emerald-600 dark:text-emerald-400/90 font-medium tracking-wide truncate">
              {subtitle}
            </p>
          )}

          {/* 极细微光流动线 */}
          <div className="w-24 h-[1.5px] rounded-full bg-slate-200/80 dark:bg-neutral-800/80 overflow-hidden relative mt-0.5">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-liquid-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
