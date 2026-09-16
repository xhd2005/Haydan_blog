'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface RouteProgressBarProps {
  enabled?: boolean;
}

/**
 * 内部实现：监听路由与全局链接点击
 */
function RouteProgressBarInner({ enabled = true }: RouteProgressBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (!enabled) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setVisible(true);
    setProgress(15);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 60) return prev + Math.random() * 15;
        if (prev < 85) return prev + Math.random() * 5;
        if (prev < 95) return prev + 0.5;
        return prev;
      });
    }, 120);
  };

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    const fadeTimer = setTimeout(() => {
      setVisible(false);
      const resetTimer = setTimeout(() => {
        setProgress(0);
      }, 200);
      return () => clearTimeout(resetTimer);
    }, 300);
    return () => clearTimeout(fadeTimer);
  };

  // 监听 pathname 和 searchParams 变化完成进度
  useEffect(() => {
    completeProgress();
  }, [pathname, searchParams]);

  // 全局拦截站内 <a> 标签点击以启动进度条
  useEffect(() => {
    if (!enabled) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // 忽略外链、锚点、下载或新标签页打开
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        targetAttr === '_blank' ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // 如果目标路径与当前路径相同，不触发
      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin) {
          if (url.pathname === window.location.pathname && url.search === window.location.search) {
            return;
          }
          startProgress();
        }
      } catch {
        // 非标准 URL 忽略
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled]);

  if (!enabled || !visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8),0_0_24px_rgba(52,211,153,0.4)] transition-all duration-300 ease-out relative"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      >
        {/* 流光头部光晕小火花 */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/80 blur-[2px] shadow-[0_0_8px_#34d399]" />
      </div>
    </div>
  );
}

/**
 * Hayden Xue 专属顶部翡翠流光路由进度条 (RouteProgressBar)
 * 采用 Suspense 边界隔离保护，避免 Next.js 静态生成阶段触发 CSR bailout
 */
export function RouteProgressBar(props: RouteProgressBarProps) {
  return (
    <Suspense fallback={null}>
      <RouteProgressBarInner {...props} />
    </Suspense>
  );
}
