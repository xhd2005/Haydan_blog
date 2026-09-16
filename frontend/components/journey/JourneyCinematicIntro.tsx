'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface JourneyCinematicIntroProps {
  /** 3D 地球引擎是否已完成首次瓦片与图层加载 */
  isLoaded?: boolean;
  isDark?: boolean;
  onComplete?: () => void;
}

const SLOGAN_TEXT = 'From the Word , To the word .';

/**
 * 足迹页极简开屏等待仪式：
 * 1. 纯粹左右布局：左侧 Logo + 右侧动效标语 "From the Word , To the word ."；
 * 2. 没有任何多余元素（无多余标题、无状态条、无多余边框）；
 * 3. 不遮挡导航栏 (z-40，Navbar 为 z-50)；
 * 4. 遮罩通透玻璃质感 (高透光率 + backdrop-blur-md + 透镜微光折射)；
 * 5. 真实等待 3D 地球加载完成，就绪后自然如雾散开溶解褪去。
 */
export function JourneyCinematicIntro({
  isLoaded = false,
  isDark = true,
  onComplete,
}: JourneyCinematicIntroProps) {
  const reduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // 保证展示约 1.2 秒以呈现完整动效，避免缓存瞬间闪烁
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, reduceMotion ? 600 : 1200);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  // 最大保护延时（最多 4 秒自动放行）
  useEffect(() => {
    const maxTimer = setTimeout(() => {
      triggerExit();
    }, 4000);
    return () => clearTimeout(maxTimer);
  }, []);

  // 当 3D 地球加载就绪且最小展示时间已到，自动触发优雅退场
  useEffect(() => {
    if (isLoaded && minTimePassed && !isExiting) {
      triggerExit();
    }
  }, [isLoaded, minTimePassed, isExiting]);

  const triggerExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onCompleteRef.current?.();
    }, reduceMotion ? 80 : 700);
  };

  // 支持键盘 ESC 跳过
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

  const CINEMATIC_EASE = [0.16, 1, 0.3, 1] as const;
  const sloganChars = SLOGAN_TEXT.split('');

  return (
    <aside
      aria-label="3D 地球加载等待仪式"
      onClick={triggerExit}
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center pt-20 sm:pt-24 pb-8 px-6 select-none cursor-pointer transition-all duration-700 ease-out ${
        isExiting
          ? 'bg-transparent backdrop-blur-none pointer-events-none'
          : isDark
          ? 'bg-[#03060f]/60 backdrop-blur-xl'
          : 'bg-white/70 backdrop-blur-xl'
      }`}
    >
      {/* 玻璃通透感光效层 (VisionOS Liquid Glass Refraction & Specular Lens) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 overflow-hidden"
        style={{ opacity: isExiting ? 0 : 1 }}
        aria-hidden="true"
      >
        {/* 顶部透镜边缘反射微光 */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 dark:via-white/20 to-transparent" />
        {/* 中心微光透镜漫反射光斑 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,rgba(16,185,129,0.03)_40%,transparent_75%)]" />
        {/* 微弱边缘景深暗角，突出玻璃通透质感 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.25)_100%)]" />
      </div>

      {/* 居中核心：左右布局 [Logo] + [From the Word , To the word .] */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={
          isExiting
            ? { opacity: 0, scale: 1.05, filter: 'blur(16px)', y: -10 }
            : { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }
        }
        transition={{ duration: 0.7, ease: [...CINEMATIC_EASE] }}
        className="relative z-10 flex items-center justify-center gap-4 sm:gap-5 px-6 select-none"
      >
        {/* 左侧：黑白随深浅主题自适应的大号 BrandLogo */}
        <div className="shrink-0 flex items-center justify-center">
          <BrandLogo size={44} variant="white" animated={true} glow={true} />
        </div>

        {/* 右侧：加大号现代无衬线标语 From the Word , To the word . (绝无艺术字) */}
        <div className="flex items-center flex-wrap gap-x-[1px] text-xl sm:text-2xl md:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_24px_rgba(255,255,255,0.3)] whitespace-nowrap">
          {sloganChars.map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                delay: reduceMotion ? 0 : 0.15 + index * 0.035,
                duration: 0.45,
                ease: [...CINEMATIC_EASE],
              }}
              className={`inline-block ${char === ' ' ? 'w-2 sm:w-2.5' : ''}`}
            >
              {char}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </aside>
  );
}
