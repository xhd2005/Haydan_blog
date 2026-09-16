'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface BrandLogoProps {
  /** 尺寸预设或自定义数字 (像素) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** 色彩风格：aurora (翡翠极光渐变) | white (高反差纯白/反色) | monochrome (单色跟随当前文字) */
  variant?: 'aurora' | 'white' | 'monochrome';
  /** 是否展示文字字标 "HAYDEN XUE" */
  showText?: boolean;
  /** 是否展示次级标语 "DIGITAL GARDEN" (需 showText 为 true) */
  showSubtitle?: boolean;
  /** 是否启用微动效 (呼吸脉冲与悬停微位移) */
  animated?: boolean;
  /** 是否带有环境极光外晕 */
  glow?: boolean;
  /** 自定义外层容器样式 */
  className?: string;
  /** 自定义文本样式 */
  textClassName?: string;
}

const SIZE_MAP = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 44,
  xl: 60,
};

// 5 个流线型新月与地平线拱桥几何路径 (200x200 坐标系，绝对轴对称)
const PATH_TOP_LEFT =
  'M49.93 43.55 L50.88 43.85 L53.46 45.23 L58.82 48.76 L61.39 50.78 L66.33 55.50 L70.07 60.00 L73.19 64.50 L75.61 68.79 L78.92 76.51 L79.99 79.73 L81.22 84.45 L81.83 87.45 L82.11 89.38 L82.01 89.84 L81.55 90.06 L72.12 91.68 L65.47 93.46 L65.04 93.43 L64.98 93.03 L66.39 87.88 L66.97 84.24 L67.40 79.73 L67.18 75.44 L66.57 70.72 L65.41 66.01 L64.58 63.43 L63.39 60.64 L60.54 55.28 L56.25 49.71 L51.53 44.99 L49.97 43.64 Z';

const PATH_TOP_RIGHT =
  'M150.03 43.64 L148.47 44.99 L143.75 49.71 L139.46 55.28 L136.61 60.64 L135.42 63.43 L134.59 66.01 L133.43 70.72 L132.82 75.44 L132.60 79.73 L133.03 84.24 L133.61 87.88 L135.02 93.03 L134.96 93.43 L134.53 93.46 L127.88 91.68 L118.45 90.06 L117.99 89.84 L117.89 89.38 L118.17 87.45 L118.78 84.45 L120.01 79.73 L121.08 76.51 L124.39 68.79 L126.81 64.50 L129.93 60.00 L133.67 55.50 L138.61 50.78 L141.18 48.76 L146.54 45.23 L149.12 43.85 L150.07 43.55 Z';

const PATH_HORIZON_BEAM =
  'M92.92 92.48 L93.57 92.39 L106.43 92.39 L115.44 93.24 L123.59 94.47 L131.96 96.37 L137.75 98.02 L142.68 99.68 L149.33 102.28 L152.12 103.48 L159.41 107.12 L165.84 110.83 L171.21 114.32 L177.43 118.89 L179.54 120.76 L172.71 117.20 L167.13 114.63 L161.77 112.36 L155.55 110.03 L151.05 108.53 L144.40 106.66 L134.53 104.34 L125.95 102.77 L114.16 101.39 L109.87 101.18 L108.36 100.97 L104.50 100.97 L103.00 100.75 L97.64 100.75 L96.14 100.97 L91.64 100.97 L90.13 101.18 L85.84 101.39 L79.62 102.04 L70.83 103.26 L65.25 104.34 L59.68 105.59 L49.60 108.32 L43.81 110.25 L38.66 112.15 L29.87 115.92 L20.77 120.48 L20.70 120.39 L21.07 119.96 L25.36 116.68 L32.23 111.96 L36.51 109.33 L40.80 106.91 L46.81 103.91 L52.60 101.39 L57.10 99.68 L61.39 98.24 L68.69 96.15 L71.47 95.51 L76.41 94.47 L83.06 93.46 L88.20 92.82 L92.71 92.51 Z';

const PATH_BOT_LEFT =
  'M82.20 105.38 L82.47 105.47 L82.63 105.71 L82.63 107.40 L81.62 114.26 L80.79 118.12 L79.78 121.55 L78.09 126.27 L76.47 129.92 L73.80 134.85 L71.41 138.50 L68.96 141.72 L65.38 145.79 L62.90 148.15 L60.54 150.17 L55.39 153.94 L52.60 155.56 L50.58 156.51 L50.70 156.09 L55.60 151.37 L57.81 148.79 L59.40 146.65 L60.97 144.29 L63.17 140.21 L64.40 137.43 L65.19 135.07 L66.57 129.71 L67.18 125.42 L67.18 123.49 L67.40 121.98 L66.97 116.19 L66.39 112.55 L65.35 108.69 L65.44 108.13 L66.11 107.77 L70.40 106.94 L77.27 105.90 L81.98 105.38 Z';

const PATH_BOT_RIGHT =
  'M118.02 105.38 L122.73 105.90 L129.60 106.94 L133.89 107.77 L134.56 108.13 L134.65 108.69 L133.61 112.55 L133.03 116.19 L132.60 121.98 L132.82 123.49 L132.82 125.42 L133.43 129.71 L134.81 135.07 L135.60 137.43 L136.83 140.21 L139.03 144.29 L140.60 146.65 L142.19 148.79 L144.40 151.37 L149.30 156.09 L149.42 156.51 L147.40 155.56 L144.61 153.94 L139.46 150.17 L137.10 148.15 L134.62 145.79 L131.04 141.72 L128.59 138.50 L126.20 134.85 L123.53 129.92 L121.91 126.27 L120.22 121.55 L119.21 118.12 L118.38 114.26 L117.37 107.40 L117.37 105.71 L117.53 105.47 L117.80 105.38 Z';

export function BrandLogo({
  size = 'sm',
  variant = 'aurora',
  showText = false,
  showSubtitle = false,
  animated = true,
  glow = true,
  className = '',
  textClassName = '',
}: BrandLogoProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 24;
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const gradId = `hx-logo-grad-${pixelSize}`;

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 图标主体容器 */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: pixelSize, height: pixelSize }}
      >
        {/* 环境冷光晕底层 */}
        {glow && (
          <div
            className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ${
              variant === 'white'
                ? 'bg-slate-400/15 dark:bg-white/20'
                : 'bg-emerald-500/25 dark:bg-emerald-400/30'
            } ${animated && !shouldReduceMotion ? 'animate-pulse' : ''} ${
              isHovered ? 'scale-125 opacity-100' : 'opacity-60'
            }`}
            style={{ filter: `blur(${Math.max(4, pixelSize / 4)}px)` }}
          />
        )}

        {/* SVG 图腾主体 (全新 Hayden Xue 流线 H 标识) */}
        <motion.svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full overflow-visible"
          animate={
            animated && !shouldReduceMotion
              ? {
                  scale: isHovered ? 1.06 : 1,
                }
              : undefined
          }
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <defs>
            {/* 翡翠极光流光渐变 */}
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            {/* 悬停穿透流光 Mask */}
            <linearGradient id={`shimmer-${pixelSize}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 5 个流线型部件 */}
          <g
            fill={
              variant === 'white'
                ? 'currentColor'
                : variant === 'monochrome'
                ? 'currentColor'
                : `url(#${gradId})`
            }
            className={variant === 'white' ? 'text-slate-900 dark:text-white' : ''}
          >
            {/* 1. 左上弯月牙 */}
            <path d={PATH_TOP_LEFT} />
            {/* 2. 右上弯月牙 */}
            <path d={PATH_TOP_RIGHT} />
            {/* 3. 向上穹顶拱桥横梁 */}
            <path d={PATH_HORIZON_BEAM} />
            {/* 4. 左下弯月牙 */}
            <path d={PATH_BOT_LEFT} />
            {/* 5. 右下弯月牙 */}
            <path d={PATH_BOT_RIGHT} />
          </g>

          {/* 悬停微流光扫射 */}
          {animated && !shouldReduceMotion && isHovered && (
            <motion.polygon
              points="0,20 60,-20 0,220 -60,260"
              fill={`url(#shimmer-${pixelSize})`}
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 260, opacity: [0, 0.85, 0] }}
              transition={{ duration: 0.65, ease: 'easeInOut' }}
            />
          )}
        </motion.svg>
      </div>

      {/* 品牌文字与副标 */}
      {showText && (
        <div className={`flex flex-col min-w-0 ${textClassName}`}>
          <span className="font-extrabold tracking-widest uppercase text-foreground leading-none text-sm sm:text-base">
            HAYDEN XUE
          </span>
          {showSubtitle && (
            <span className="text-[10px] tracking-wider font-mono font-semibold text-emerald-500/90 dark:text-emerald-400/90 leading-tight mt-0.5">
              DIGITAL GARDEN
            </span>
          )}
        </div>
      )}
    </div>
  );
}
