'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Plane,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Compass,
  Box,
  RotateCw,
  Maximize2,
  Minimize2,
  Radio,
  MapPin,
  Globe2,
  Route,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { FlightLeg } from './footprint';
import { StardateBadge } from '@/components/ui/StardateBadge';

interface FlightTelemetryHUDProps {
  currentLeg: FlightLeg | null;
  activeLegIndex: number;
  totalLegs: number;
  legProgressPercent: number;
  onChangeLeg: (index: number) => void;
  isTheaterMode: boolean;
  onToggleTheaterMode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetNorth?: () => void;
  onToggle3D?: () => void;
  isOrbiting?: boolean;
  onToggleOrbit?: () => void;
  onTogglePerspective?: () => void;
  /** 开屏长镜头结束后触发错峰入场 */
  entranceReady?: boolean;
  /** 真实航行宏观统计数据 */
  citiesCount?: number;
  countriesCount?: number;
  totalKm?: number;
  logsCount?: number;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
}

/**
 * 现代 Spatial Glass OS 时空航行控制台 (FlightTelemetryHUD)
 * 1. 左上角：航行数据液态玻璃胶囊 (Macro Telemetry Capsule - 城市/国家/里程/日志)
 * 2. 顶部中央：分段式航程指示器 (航段切换 + 进度条)
 * 3. 右上角：高清卫星实景 pill + 剧场全屏模式
 * 4. 底部中央：时空多功能 Dock 栏 (航段信息条 + 抽屉开关 + 3D/环绕/指北工具)
 * 5. 彻底移除向下滚动链接，实现 100% 沉浸全屏
 */
export function FlightTelemetryHUD({
  currentLeg,
  activeLegIndex,
  totalLegs,
  legProgressPercent,
  onChangeLeg,
  isTheaterMode,
  onToggleTheaterMode,
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onToggle3D,
  isOrbiting = false,
  onToggleOrbit,
  onTogglePerspective,
  entranceReady = true,
  citiesCount = 0,
  countriesCount = 0,
  totalKm = 0,
  logsCount = 0,
  isDrawerOpen = false,
  onToggleDrawer,
}: FlightTelemetryHUDProps) {
  const reduceMotion = useReducedMotion();
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const EASE = [0.16, 1, 0.3, 1] as const;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 18 },
    animate: entranceReady
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: reduceMotion ? 0 : 18 },
    transition: {
      duration: reduceMotion ? 0.01 : 0.65,
      delay: reduceMotion ? 0 : delay,
      ease: EASE,
    },
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none">
      {/* ============ 顶部中央：分段式航程指示器 (灵动胶囊形变落位终态) ============ */}
      {currentLeg && (
        <motion.div
          {...rise(0.08)}
          className="absolute top-20 sm:top-24 inset-x-0 flex justify-center px-4 pointer-events-none"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-2xl bg-white/85 dark:bg-[#070c14]/85 border border-slate-200/90 dark:border-white/[0.12] backdrop-blur-2xl shadow-xl text-slate-900 dark:text-white pointer-events-auto">
            <button
              onClick={() => onChangeLeg(activeLegIndex - 1)}
              disabled={activeLegIndex <= 0}
              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="上一航段"
              aria-label="上一航段"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center gap-1.5 min-w-[170px] sm:min-w-[240px]">
              {/* 航段标题行：航班号 · 起讫 IATA */}
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-300">
                <Plane className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold">{currentLeg.flightNumber}</span>
                <span className="text-slate-300 dark:text-white/30">|</span>
                <span>{currentLeg.fromIata}</span>
                <span className="text-emerald-600 dark:text-emerald-400">➔</span>
                <span>{currentLeg.toIata}</span>
                <span className="text-[10px] text-slate-500 dark:text-white/50 font-semibold">
                  ({activeLegIndex + 1}/{totalLegs})
                </span>
              </div>

              {/* 分段式航程指示器 */}
              <div className="flex items-center gap-1 w-full">
                {Array.from({ length: totalLegs }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => onChangeLeg(i)}
                    className="group/seg relative flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/15 overflow-hidden cursor-pointer hover:h-2 transition-all"
                    title={`直达第 ${i + 1} 航段`}
                    aria-label={`第 ${i + 1} 航段`}
                  >
                    {i < activeLegIndex && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
                    )}
                    {i === activeLegIndex && (
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-[width] duration-150"
                        style={{ width: `${legProgressPercent}%` }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onChangeLeg(activeLegIndex + 1)}
              disabled={activeLegIndex >= totalLegs - 1}
              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="下一航段"
              aria-label="下一航段"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ============ 3. 右上角：遥感卫星实景 pill + 剧场模式 ============ */}
      <motion.div
        {...rise(0.45)}
        className="absolute top-20 sm:top-24 right-4 sm:right-6 flex items-center gap-2 pointer-events-auto"
      >
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-mono font-medium border bg-white/85 dark:bg-[#070c14]/85 text-slate-700 dark:text-emerald-300 border-slate-200/90 dark:border-white/[0.12] backdrop-blur-2xl shadow-lg"
          title="高清遥感卫星实景 (ESRI World Imagery HD)"
        >
          <Radio className="w-3 h-3 text-emerald-500 animate-pulse motion-reduce:animate-none" />
          <span>遥感卫星 HD</span>
        </div>

        <button
          onClick={onToggleTheaterMode}
          className="p-2.5 rounded-2xl bg-white/85 dark:bg-[#070c14]/85 hover:bg-slate-100 dark:hover:bg-black/60 text-slate-700 dark:text-white border border-slate-200/90 dark:border-white/[0.12] backdrop-blur-2xl shadow-lg hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all duration-200 cursor-pointer"
          title={isTheaterMode ? '退出剧场模式 (ESC)' : '剧场模式 · 纯净沉浸'}
          aria-label="剧场模式"
        >
          {isTheaterMode ? (
            <Minimize2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
          ) : (
            <Maximize2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
          )}
        </button>
      </motion.div>

      {/* ============ 4. 底部右侧：紧凑圆形 3D 工具列 ============ */}
      <motion.div
        {...rise(0.65)}
        className="absolute bottom-8 right-4 sm:right-6 z-20 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-white/85 dark:bg-[#070c14]/85 border border-slate-200/90 dark:border-white/[0.12] backdrop-blur-2xl shadow-2xl pointer-events-auto"
      >
        {onToggleOrbit && (
          <button
            onClick={onToggleOrbit}
            className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
              isOrbiting
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/40'
                : 'bg-transparent text-slate-700 dark:text-white/80 border-transparent hover:bg-slate-100 dark:hover:bg-white/10 hover:text-emerald-600 dark:hover:text-emerald-300'
            }`}
            title={isOrbiting ? '暂停 3D 环绕运镜' : '开启 3D 环绕运镜'}
            aria-label="3D 环绕"
          >
            <RotateCw
              className={`w-4 h-4 ${isOrbiting ? 'animate-spin motion-reduce:animate-none text-slate-950' : ''}`}
            />
          </button>
        )}

        {onTogglePerspective && (
          <button
            onClick={onTogglePerspective}
            className="p-2 rounded-xl text-slate-700 dark:text-white/80 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="切换视角 (近地空间站特写 ⇄ 深空全景)"
            aria-label="切换视角"
          >
            <Globe2 className="w-4 h-4" />
          </button>
        )}

        {onToggle3D && (
          <button
            onClick={onToggle3D}
            className="p-2 rounded-xl text-slate-700 dark:text-white/80 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="切换 3D 航拍俯仰角"
            aria-label="3D 俯仰"
          >
            <Box className="w-4 h-4" />
          </button>
        )}

        {onResetNorth && (
          <button
            onClick={onResetNorth}
            className="p-2 rounded-xl text-slate-700 dark:text-white/80 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="重置正北视角"
            aria-label="正北"
          >
            <Compass className="w-4 h-4" />
          </button>
        )}

        <div className="w-4 h-[1px] bg-slate-200 dark:bg-white/15 my-0.5" />

        <button
          onClick={onZoomIn}
          className="p-2 rounded-xl text-slate-700 dark:text-white/80 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="放大行星地球"
          aria-label="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={onZoomOut}
          className="p-2 rounded-xl text-slate-700 dark:text-white/80 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="缩小行星地球"
          aria-label="缩小"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </motion.div>

      {/* ============ 5. 底部中央：时空航段极简信息条 (Temporal Dock) ============ */}
      <motion.div
        {...rise(0.75)}
        className="absolute bottom-8 inset-x-0 flex justify-center px-4 pointer-events-none"
      >
        {currentLeg ? (
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/90 dark:bg-[#070c14]/90 border border-slate-200/90 dark:border-white/[0.12] backdrop-blur-2xl shadow-2xl text-slate-900 dark:text-white pointer-events-auto max-w-[92vw]">
            <div className="flex items-center gap-2 min-w-0 text-xs">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                {currentLeg.fromIata}
              </span>
              <span className="text-slate-600 dark:text-white/60 truncate hidden sm:inline">
                {currentLeg.fromCity.city}
              </span>
              <span className="relative inline-flex items-center">
                <span className="h-[1px] w-8 sm:w-14 bg-gradient-to-r from-emerald-500/60 via-cyan-400/60 to-emerald-500/60" />
                <Plane className="absolute left-1/2 -translate-x-1/2 w-3 h-3 text-cyan-500 dark:text-cyan-300" />
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                {currentLeg.toIata}
              </span>
              <span className="text-slate-600 dark:text-white/60 truncate hidden sm:inline">
                {currentLeg.toCity.city}
              </span>
            </div>

            <span className="w-[1px] h-4 bg-slate-200 dark:bg-white/15 shrink-0" />

            <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-slate-600 dark:text-white/70">
              <span className="font-bold text-slate-900 dark:text-white">
                {currentLeg.distanceKm.toLocaleString()} km
              </span>
              <StardateBadge
                date={currentLeg.toCity.startDate || currentLeg.toCity.createdAt}
                logId={currentLeg.index + 1}
                className="hidden md:inline-flex"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 dark:bg-[#070c14]/90 border border-slate-200/90 dark:border-white/[0.12] backdrop-blur-2xl shadow-2xl text-xs font-mono text-slate-600 dark:text-white/70 pointer-events-auto">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>环球探索就绪 · 选择左上角足迹索引或直接轻触地球地标启航</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
