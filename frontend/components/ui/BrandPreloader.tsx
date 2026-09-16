'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingVisualsConfig } from '@/lib/types';

interface BrandPreloaderProps {
  config?: LoadingVisualsConfig;
}

/**
 * Hayden Xue 专属 VisionOS 空间计算液态透镜开屏预加载动效 (BrandPreloader)
 * 高透光微曲面透镜 + 字符悬浮舒展 + 深度水滴升维融化退场，拒绝机械生硬
 */
export function BrandPreloader({ config }: BrandPreloaderProps) {
  const [visible, setVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const isEnabled = config?.preloaderEnabled !== false; // 默认开启
  const slogan = config?.slogan || 'From the East, toward the unknown.';
  const durationMs = config?.durationMs || 1000;
  const showSkipHint = config?.showSkipHint !== false;

  const dismiss = useCallback(() => {
    setIsDismissing(true);
    setTimeout(() => {
      setVisible(false);
      setIsDismissing(false);
    }, 550);
  }, []);

  const triggerOpen = useCallback(() => {
    setVisible(true);
    setIsDismissing(false);
    const timer = setTimeout(() => {
      dismiss();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [dismiss, durationMs]);

  useEffect(() => {
    if (!isEnabled) return;

    // 后台控制台不自动弹出全屏开屏，仅支持手动预览事件触发
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return;
    }

    // 检查会话级防疲劳标记
    const hasSeen = sessionStorage.getItem('hayden_preloader_seen');
    if (!hasSeen) {
      sessionStorage.setItem('hayden_preloader_seen', '1');
      const cleanup = triggerOpen();
      return cleanup;
    }
  }, [isEnabled, triggerOpen]);

  // 支持后台 CMS 或快捷事件强制触发预览
  useEffect(() => {
    const handleTrigger = () => {
      triggerOpen();
    };
    window.addEventListener('hayden:trigger-preloader', handleTrigger);
    return () => window.removeEventListener('hayden:trigger-preloader', handleTrigger);
  }, [triggerOpen]);

  // 支持 ESC 键快速跳过
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="brand-preloader-visionos"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            filter: 'blur(20px)',
            transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={dismiss}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center select-none cursor-pointer bg-[#fbfbfd]/90 dark:bg-[#090a0f]/92 backdrop-blur-3xl transition-colors duration-500"
          aria-live="polite"
          aria-busy="true"
        >
          {/* 背景深空景深光斑 */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent blur-[120px] pointer-events-none animate-pulse-glow" />

          {/* VisionOS 悬浮曲面液态透镜胶囊 (Liquid Lens Core) */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center p-8 sm:p-10 rounded-[2.5rem] bg-white/70 dark:bg-neutral-900/60 backdrop-blur-2xl border border-white/60 dark:border-white/[0.12] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.4)_inset] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)_inset] space-y-7 z-10 animate-lens-float max-w-sm w-full mx-4"
          >
            {/* 中心空间微环与几何徽标 */}
            <div className="relative flex items-center justify-center w-24 h-24">
              {/* 空间同心外微环：顺时针 14s 极细自转 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-emerald-500/30 dark:border-emerald-400/25"
              />

              {/* 空间内环：逆时针 10s 极细自转 */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                className="absolute inset-2.5 rounded-full border border-teal-500/20 dark:border-white/10"
              />

              {/* 中心高透光微标基座 */}
              <div className="relative w-14 h-14 rounded-2xl bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl flex items-center justify-center shadow-lg shadow-emerald-500/15 border border-emerald-500/40 dark:border-emerald-400/30">
                {/* 翡翠微光量子核 */}
                <div className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-ping" style={{ animationDuration: '3s' }} />

                <svg
                  className="w-7 h-7 text-emerald-600 dark:text-emerald-400 relative z-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
            </div>

            {/* 品牌站长姓名与字符级舒展排印 */}
            <div className="text-center space-y-2 w-full">
              <motion.h1
                initial={{ opacity: 0, letterSpacing: '0.15em' }}
                animate={{ opacity: 1, letterSpacing: '0.28em' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-xl sm:text-2xl font-bold tracking-[0.28em] text-slate-900 dark:text-white uppercase font-sans pl-1"
              >
                HAYDEN XUE
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="text-xs sm:text-sm font-serif italic tracking-wide text-emerald-600 dark:text-emerald-400/90 font-medium"
              >
                {slogan}
              </motion.p>
            </div>

            {/* 空间微光呼吸进度指示槽 */}
            <div className="w-28 h-[2px] rounded-full bg-slate-200/80 dark:bg-neutral-800/80 overflow-hidden relative">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
                className="w-full h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
              />
            </div>
          </motion.div>

          {/* 底部跳过提示 */}
          {showSkipHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute bottom-8 text-[11px] font-mono tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 z-10"
            >
              <span className="px-1.5 py-0.5 rounded border border-slate-300/80 dark:border-zinc-700 bg-white/60 dark:bg-neutral-900/60 text-[10px]">
                ESC
              </span>
              <span>或轻点屏幕跳过</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
