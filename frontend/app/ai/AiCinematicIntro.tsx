'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Brain } from 'lucide-react';

interface AiCinematicIntroProps {
  title?: string;
  onComplete?: () => void;
}

const CINEMATIC_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Hayden AI 数字外脑 · 电影感开屏就绪仪式：
 * 1. 深度层级美学：纯净居中布局，发光 BrandLogo + "Into the Unknown" 字符级消散升腾；
 * 2. VisionOS 液态玻璃反光层 (Specular Highlight) 与环境星芒微光晕，原生支持深浅双主题；
 * 3. 绝不遮挡全局导航栏 (z-40，Navbar 为 z-50)；
 * 4. 自动就绪平滑淡出，支持鼠标任意处点击或 ESC 键瞬间跳过。
 */
export function AiCinematicIntro({
  title = 'Into the Unknown',
  onComplete,
}: AiCinematicIntroProps) {
  const reduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const triggerExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onCompleteRef.current?.();
    }, reduceMotion ? 60 : 650);
  };

  // 自动倒计时展示：约 1.3 秒完整动效呈现，随后如晨雾般自然溶解消散
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerExit();
    }, reduceMotion ? 500 : 1350);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  // 支持 ESC 键瞬间跳过
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const titleChars = (title || 'Into the Unknown').split('');

  return (
    <aside
      aria-label="Hayden AI 智能中枢就绪仪式"
      onClick={triggerExit}
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center select-none cursor-pointer px-6 transition-all duration-700 ease-out ${
        isExiting
          ? 'bg-transparent backdrop-blur-none pointer-events-none'
          : 'bg-[#fbfbfd]/70 dark:bg-[#06080e]/70 backdrop-blur-2xl'
      }`}
    >
      {/* 玻璃通透感光效层 (VisionOS Liquid Glass Specular Reflection & Caustic Halo) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 overflow-hidden"
        style={{ opacity: isExiting ? 0 : 1 }}
        aria-hidden="true"
      >
        {/* 顶部镜面菲涅尔反光条 */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/25 to-transparent" />

        {/* 中心星芒与微光漫反射光晕 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0%,rgba(6,182,212,0.08)_35%,transparent_70%)]" />

        {/* 微弱边缘景深暗角 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.22)_100%)]" />

        {/* 极细微网格背景 */}
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_0.8px,transparent_0.8px)] dark:bg-[radial-gradient(#ffffff0a_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* 居中核心舞台 (视口黄金分割居中，退场时平滑下沉融入主对话框) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={
          isExiting
            ? { opacity: 0, scale: 0.98, y: 20, filter: 'blur(8px)' }
            : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
        }
        transition={{ duration: 0.55, ease: [...CINEMATIC_EASE] }}
        className="relative z-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4 select-none pt-8 sm:pt-12"
      >
        {/* 核心 Logo 与标题组合：左右水平排布，无边框，深浅自适应 */}
        <div className="flex items-center justify-center gap-3 sm:gap-4.5">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, x: -8 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            transition={{ delay: 0.06, duration: 0.45, ease: [...CINEMATIC_EASE] }}
            className="shrink-0 flex items-center justify-center text-slate-900 dark:text-white"
          >
            <BrandLogo
              size={46}
              variant="monochrome"
              animated={false}
              glow={false}
              className="text-slate-900 dark:text-white"
            />
          </motion.div>

          {/* 逐字字符升腾显现 (Letter-by-letter unblur reveal) */}
          <h1 className="flex items-center flex-wrap justify-center gap-x-[1px] text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-slate-900 dark:text-white drop-shadow-sm selection:text-blue-500">
            {titleChars.map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: reduceMotion ? 0 : 0.1 + index * 0.025,
                  duration: 0.45,
                  ease: [...CINEMATIC_EASE],
                }}
                className={`inline-block ${char === ' ' ? 'w-2 sm:w-2.5' : ''}`}
              >
                {char}
              </motion.span>
            ))}
          </h1>
        </div>

        {/* 底部轻量跳过提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-8 text-[11px] font-mono text-slate-400 dark:text-neutral-500 tracking-wider flex items-center gap-1.5"
        >
          <span>点击任意处或按 ESC 即可跳过</span>
        </motion.div>
      </motion.div>
    </aside>
  );
}
