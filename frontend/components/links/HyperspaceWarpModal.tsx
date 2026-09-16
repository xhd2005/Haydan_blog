'use client';

import React, { useEffect, useState } from 'react';
import { Friend } from '@/lib/types';
import { Compass, ExternalLink, Radio, Sparkles, X } from 'lucide-react';

interface HyperspaceWarpModalProps {
  target: Friend | null;
  onClose: () => void;
}

export function HyperspaceWarpModal({ target, onClose }: HyperspaceWarpModalProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!target) {
      setProgress(0);
      return;
    }

    // 跃迁倒计时进度条
    const startTime = Date.now();
    const duration = 750; // 750ms 跃迁沉浸动画

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        // 打开新页面并退出
        window.open(target.url, '_blank', 'noopener,noreferrer');
        setTimeout(() => {
          onClose();
        }, 150);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [target, onClose]);

  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* 极光跃迁全屏遮罩与星轨拉伸 */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-xl animate-fade-in transition-all duration-300"
      />

      {/* 空间径向流光放射线 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle at center, transparent 15%, rgba(16, 185, 129, 0.15) 50%, rgba(59, 130, 246, 0.25) 90%)',
        }}
      />

      {/* 核心穿梭 HUD 罗盘气泡 */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-neutral-900/90 border border-emerald-500/30 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.25)] text-center space-y-6 animate-warp-compass overflow-hidden">
        {/* 顶部流光掠影 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />

        {/* 罗盘雷达抬头 */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>WARP VECTOR // 空间跃迁中</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 跃迁目标博友卡片 */}
        <div className="space-y-4 py-2">
          {/* 头像与量子双重光环 */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute -inset-2 rounded-full border border-emerald-500/40 animate-ping opacity-75" />
            <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-500 shadow-lg">
              <div className="w-full h-full rounded-full bg-neutral-950 overflow-hidden flex items-center justify-center relative">
                {target.avatar ? (
                  <img
                    src={target.avatar}
                    alt={target.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="font-mono font-black text-xl text-emerald-400">
                    {target.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 站名与网址 */}
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white tracking-tight font-sans">
              {target.name}
            </h3>
            <p className="text-xs font-mono text-emerald-400/90 truncate max-w-xs mx-auto">
              {target.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </p>
          </div>

          {/* 真实简介 */}
          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed max-w-xs mx-auto font-sans">
            {target.description || '一位专注独立思考与造物的真实友邻。'}
          </p>
        </div>

        {/* 进度条与状态 */}
        <div className="space-y-2 font-mono">
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 rounded-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(16,185,129,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>跃迁信道锁定</span>
            </span>
            <span className="font-bold text-emerald-400">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
