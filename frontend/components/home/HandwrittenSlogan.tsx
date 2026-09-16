'use client';

import React, { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HeroSloganColorScheme } from '@/lib/types';

interface HandwrittenSloganProps {
  text: string;
  className?: string;
  /** 是否为视频模式（亮色描边/填充以保证深色纱幕上可读） */
  cinematic?: boolean;
  /** 错峰动画起始延迟（秒） */
  delay?: number;
  /** 可选 SVG viewBox */
  viewBox?: string;
  /** 字号（默认 140） */
  fontSize?: number;
  /** 文本 Y 坐标基线（默认自适应） */
  y?: number;
  /** 笔划描边宽度（默认 2.0） */
  strokeWidth?: number;
  /** 色彩方案 */
  colorScheme?: HeroSloganColorScheme | string;
  /** 自定义起始渐变色 */
  customColorStart?: string;
  /** 自定义结束渐变色 */
  customColorEnd?: string;
}

/** 拉丁字符检测（Caveat 手写字体仅覆盖拉丁字符集） */
const isLatinText = (s: string) => /^[\x00-\x7F\s.,'’!&?-]+$/.test(s);

/**
 * 色彩方案渐变与描边配置解析器
 */
function resolveColorConfig(
  scheme: string = 'emerald',
  cinematic: boolean = false,
  customStart?: string,
  customEnd?: string
) {
  if (scheme === 'custom' && customStart && customEnd) {
    return {
      stops: [
        { offset: '0%', color: customStart },
        { offset: '100%', color: customEnd },
      ],
      stroke: cinematic ? customStart : (customEnd || customStart),
      nonLatinClass: '',
      customStyle: {
        backgroundImage: `linear-gradient(to right, ${customStart}, ${customEnd})`,
      },
    };
  }

  switch (scheme) {
    case 'cyan':
      return {
        stops: cinematic
          ? [
              { offset: '0%', color: '#67e8f9' },
              { offset: '50%', color: '#7dd3fc' },
              { offset: '100%', color: '#93c5fd' },
            ]
          : [
              { offset: '0%', color: '#0e7490' },
              { offset: '50%', color: '#0284c7' },
              { offset: '100%', color: '#2563eb' },
            ],
        stroke: cinematic ? '#38bdf8' : '#0284c7',
        nonLatinClass:
          'from-cyan-700 via-sky-600 to-blue-600 dark:from-cyan-300 dark:via-sky-200 dark:to-blue-300',
      };
    case 'violet':
      return {
        stops: cinematic
          ? [
              { offset: '0%', color: '#c4b5fd' },
              { offset: '50%', color: '#d8b4fe' },
              { offset: '100%', color: '#f0abfc' },
            ]
          : [
              { offset: '0%', color: '#7c3aed' },
              { offset: '50%', color: '#9333ea' },
              { offset: '100%', color: '#c026d3' },
            ],
        stroke: cinematic ? '#a78bfa' : '#9333ea',
        nonLatinClass:
          'from-violet-700 via-purple-600 to-fuchsia-600 dark:from-violet-300 dark:via-purple-200 dark:to-fuchsia-300',
      };
    case 'amber':
      return {
        stops: cinematic
          ? [
              { offset: '0%', color: '#fde68a' },
              { offset: '50%', color: '#fdba74' },
              { offset: '100%', color: '#fca5a5' },
            ]
          : [
              { offset: '0%', color: '#d97706' },
              { offset: '50%', color: '#ea580c' },
              { offset: '100%', color: '#e11d48' },
            ],
        stroke: cinematic ? '#fbbf24' : '#ea580c',
        nonLatinClass:
          'from-amber-600 via-orange-600 to-rose-600 dark:from-amber-200 dark:via-orange-200 dark:to-rose-200',
      };
    case 'rose':
      return {
        stops: cinematic
          ? [
              { offset: '0%', color: '#fecdd3' },
              { offset: '50%', color: '#fbcfe8' },
              { offset: '100%', color: '#f5d0fe' },
            ]
          : [
              { offset: '0%', color: '#e11d48' },
              { offset: '50%', color: '#db2777' },
              { offset: '100%', color: '#c026d3' },
            ],
        stroke: cinematic ? '#fb7185' : '#db2777',
        nonLatinClass:
          'from-rose-600 via-pink-600 to-fuchsia-600 dark:from-rose-200 dark:via-pink-200 dark:to-fuchsia-200',
      };
    case 'monochrome':
      return {
        stops: cinematic
          ? [
              { offset: '0%', color: '#ffffff' },
              { offset: '50%', color: '#f1f5f9' },
              { offset: '100%', color: '#e2e8f0' },
            ]
          : [
              { offset: '0%', color: '#0f172a' },
              { offset: '50%', color: '#334155' },
              { offset: '100%', color: '#475569' },
            ],
        stroke: cinematic ? '#ffffff' : '#334155',
        nonLatinClass:
          'from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-200',
      };
    case 'emerald':
    default:
      return {
        stops: cinematic
          ? [
              { offset: '0%', color: '#a7f3d0' },
              { offset: '50%', color: '#5eead4' },
              { offset: '100%', color: '#67e8f9' },
            ]
          : [
              { offset: '0%', color: '#047857' },
              { offset: '50%', color: '#0f766e' },
              { offset: '100%', color: '#0e7490' },
            ],
        stroke: cinematic ? '#34d399' : '#10b981',
        nonLatinClass:
          'from-emerald-700 via-teal-600 to-cyan-600 dark:from-emerald-300 dark:via-teal-200 dark:to-cyan-300',
      };
  }
}

/**
 * Apple「hello」式手写描绘标语组件
 */
export function HandwrittenSlogan({
  text,
  className = '',
  cinematic = false,
  delay = 0,
  viewBox,
  fontSize = 140,
  y,
  strokeWidth = 2.0,
  colorScheme = 'emerald',
  customColorStart,
  customColorEnd,
}: HandwrittenSloganProps) {
  const gradientId = useId().replace(/:/g, 'hw-grad-');
  const reduce = useReducedMotion();
  const chars = useMemo(() => (text || '').split(''), [text]);
  const latin = useMemo(() => isLatinText(text || ''), [text]);

  const colorConfig = useMemo(
    () => resolveColorConfig(colorScheme, cinematic, customColorStart, customColorEnd),
    [colorScheme, cinematic, customColorStart, customColorEnd]
  );

  // 自适应视口尺寸与 Y 基线推算（保证任何字号与字符长度下不被裁剪且完美贴合）
  const autoViewBox = useMemo(() => {
    if (viewBox) return viewBox;
    const estimatedWidth = Math.max(300, Math.ceil(chars.length * fontSize * 0.52 + 80));
    const estimatedHeight = Math.ceil(fontSize * 1.25);
    return `0 0 ${estimatedWidth} ${estimatedHeight}`;
  }, [viewBox, chars.length, fontSize]);

  const baselineY = useMemo(() => {
    if (typeof y === 'number') return y;
    return Math.ceil(fontSize * 0.9);
  }, [y, fontSize]);

  // 非拉丁文本回退（如中文）：渐变笔刷显现
  if (!latin) {
    return (
      <motion.span
        className={`block w-full text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight bg-gradient-to-r ${colorConfig.nonLatinClass} bg-clip-text text-transparent ${className}`}
        style={colorConfig.customStyle}
        initial={reduce ? false : { opacity: 0, filter: 'blur(6px)', y: 12 }}
        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {text}
      </motion.span>
    );
  }

  return (
    <span className={`block w-full ${className}`} role="img" aria-label={text}>
      <svg
        className="block w-full h-auto overflow-visible"
        viewBox={autoViewBox}
        preserveAspectRatio="xMinYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {colorConfig.stops.map((stop, i) => (
              <stop key={i} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>

        <text
          x="10"
          y={baselineY}
          className="font-handwrite"
          fontSize={fontSize}
          fontWeight="700"
          fill={`url(#${gradientId})`}
          stroke={colorConfig.stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {chars.map((ch, i) => {
            const startSec = delay + 0.15 + i * 0.055;
            const fillSec = delay + 0.75 + i * 0.055;
            return (
              <tspan
                key={i}
                className="hw-char"
                style={{
                  strokeDasharray: 500,
                  strokeDashoffset: reduce ? 0 : 500,
                  fillOpacity: reduce ? 1 : 0,
                  animation: reduce
                    ? 'none'
                    : `hw-draw 1.15s cubic-bezier(0.4, 0, 0.2, 1) ${startSec}s forwards, hw-fill 0.7s ease ${fillSec}s forwards`,
                }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </tspan>
            );
          })}
        </text>
      </svg>
    </span>
  );
}
