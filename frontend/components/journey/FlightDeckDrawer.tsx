'use client';

import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Journey } from '@/lib/types';
import {
  CityFootprint,
  getCityIataCode,
  isDomesticCountry,
  computeJourneyStats,
} from './footprint';
import {
  Compass,
  MapPin,
  Globe2,
  Route,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  ChevronRight,
  Plane,
} from 'lucide-react';

export type { CityFootprint } from './footprint';
export { getCityIataCode } from './footprint';

interface FlightDeckDrawerProps {
  journeys: Journey[];
  citiesData: CityFootprint[];
  selectedCity: CityFootprint | null;
  onSelectCity: (city: CityFootprint | null) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  totalDistanceKm: number;
  /** 开屏长镜头结束后触发错峰滑入入场 */
  entranceReady?: boolean;
  isDark?: boolean;
  className?: string;
}

/**
 * 一体化折叠时空舱 (Unified Spatial Terminal Deck)
 * 1. 彻底解决多层重叠遮挡与数据重复：
 *    - 默认状态：单行紧凑高透液态玻璃胶囊 (展示: 航站索引 · X城 X国 XKM X篇 ▾)
 *    - 展开状态：原地平滑下展为一体化航站索引面板 (大数字指标 + 搜索 + 筛选 + 时序足迹)
 * 2. 100% 遵从 Hayden Xue 身份纯正性准则与真实数据驱动原则
 */
export function FlightDeckDrawer({
  journeys,
  citiesData,
  selectedCity,
  onSelectCity,
  isOpen,
  onToggleOpen,
  totalDistanceKm,
  entranceReady = true,
  isDark = true,
  className = '',
}: FlightDeckDrawerProps) {
  const reduceMotion = useReducedMotion();
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'DOMESTIC' | 'GLOBAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => computeJourneyStats(citiesData), [citiesData]);
  const countriesCount = useMemo(() => {
    return new Set(citiesData.map((c) => c.country)).size;
  }, [citiesData]);

  // 过滤行程列表
  const filteredCities = useMemo(() => {
    return citiesData.filter((c) => {
      if (regionFilter === 'DOMESTIC' && !isDomesticCountry(c.country)) return false;
      if (regionFilter === 'GLOBAL' && isDomesticCountry(c.country)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCity = c.city.toLowerCase().includes(q);
        const matchCountry = c.country.toLowerCase().includes(q);
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        if (!matchCity && !matchCountry && !matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [citiesData, regionFilter, searchQuery]);

  const entranceTransition = {
    duration: reduceMotion ? 0.01 : 0.65,
    delay: reduceMotion ? 0 : 0.15,
    ease: [0.16, 1, 0.3, 1] as const,
  };
  const hiddenX = reduceMotion ? 0 : -32;

  return (
    <motion.aside
      aria-label="一体化航站时空舱"
      initial={{ opacity: 0, x: hiddenX }}
      animate={entranceReady ? { opacity: 1, x: 0 } : { opacity: 0, x: hiddenX }}
      transition={entranceTransition}
      className={`absolute top-20 sm:top-24 left-4 sm:left-6 z-30 transition-opacity select-none ${className}`}
    >
      {/* ================= 1. 收起状态：极简单行微磨砂液态玻璃胶囊 ================= */}
      {!isOpen ? (
        <button
          onClick={onToggleOpen}
          className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-2xl shadow-xl transition-all duration-300 cursor-pointer border ${
            isDark
              ? 'bg-[#0a0f18]/92 text-white border-white/[0.14] hover:border-emerald-500/50 hover:shadow-emerald-500/20'
              : 'bg-white/92 text-slate-900 border-slate-200/90 hover:border-emerald-500/50 hover:shadow-emerald-500/20'
          } active:scale-[0.98]`}
          title="展开航站时空舱"
          aria-label="展开航站时空舱"
        >
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Compass className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
          </div>

          <span className="font-bold text-xs font-mono tracking-wide">
            航站索引
          </span>

          <span className={`w-px h-3 ${isDark ? 'bg-white/15' : 'bg-slate-200'}`} />

          {/* 紧凑数据点阵 */}
          <div className={`flex items-center gap-2 text-xs font-mono ${isDark ? 'text-white/80' : 'text-slate-600'}`}>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {citiesData.length}
            </span>
            <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>城</span>

            <span className="font-bold text-cyan-600 dark:text-cyan-400">
              {countriesCount}
            </span>
            <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>国</span>

            <span className="font-bold text-teal-600 dark:text-teal-300">
              {totalDistanceKm.toLocaleString()}
            </span>
            <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>KM</span>

            <span className="hidden md:inline font-bold text-amber-600 dark:text-amber-400">
              {journeys.length}
            </span>
            <span className={`hidden md:inline text-[10px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>篇</span>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-y-0.5 transition-all ml-0.5" />
        </button>
      ) : (
        /* ================= 2. 展开状态：完整一体化时空舱面板 ================= */
        <div
          className={`w-[330px] sm:w-[370px] max-h-[calc(100svh-8.5rem)] flex flex-col rounded-3xl backdrop-blur-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border ${
            isDark
              ? 'bg-[#0a0f18]/95 border-white/[0.14] text-white shadow-[0_25px_60px_rgba(0,0,0,0.85)]'
              : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.12)]'
          }`}
        >
          {/* 顶栏：标题与收起按钮 */}
          <div
            className={`flex items-center justify-between px-5 pt-4 pb-3 border-b ${
              isDark ? 'border-white/[0.08]' : 'border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-mono tracking-wider">
                  航站索引 · TERMINAL
                </div>
                <div className={`text-[9px] font-mono ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  HAYDEN XUE · SPATIO-TEMPORAL
                </div>
              </div>
            </div>

            <button
              onClick={onToggleOpen}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'
              }`}
              title="收起为悬浮胶囊"
              aria-label="收起航站索引"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* 3 项核心大数字指标卡 */}
          <div
            className={`p-4 grid grid-cols-3 gap-2 border-b ${
              isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-slate-50/70 border-slate-100'
            }`}
          >
            <div
              className={`p-2.5 rounded-2xl border text-center ${
                isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white/90 border-slate-200/70'
              }`}
            >
              <span className={`block text-[8px] font-mono uppercase font-semibold ${
                isDark ? 'text-white/40' : 'text-slate-500'
              }`}>
                航程 KM
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-teal-600 dark:text-teal-400">
                {totalDistanceKm.toLocaleString()}
              </span>
            </div>

            <div
              className={`p-2.5 rounded-2xl border text-center ${
                isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white/90 border-slate-200/70'
              }`}
            >
              <span className={`block text-[8px] font-mono uppercase font-semibold ${
                isDark ? 'text-white/40' : 'text-slate-500'
              }`}>
                国家 COUNTRIES
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-cyan-600 dark:text-cyan-400">
                {countriesCount}
              </span>
            </div>

            <div
              className={`p-2.5 rounded-2xl border text-center ${
                isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white/90 border-slate-200/70'
              }`}
            >
              <span className={`block text-[8px] font-mono uppercase font-semibold ${
                isDark ? 'text-white/40' : 'text-slate-500'
              }`}>
                足迹 CITIES
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-amber-600 dark:text-amber-400">
                {citiesData.length}
              </span>
            </div>
          </div>

          {/* 搜索与区域筛选 */}
          <div
            className={`p-3.5 space-y-2.5 border-b ${
              isDark ? 'border-white/[0.08]' : 'border-slate-100'
            }`}
          >
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索城市、国家、旅行纪行..."
                className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-emerald-500/50 ${
                  isDark
                    ? 'bg-white/[0.06] border-white/10 text-white placeholder-white/40'
                    : 'bg-slate-100 border-slate-200/80 text-slate-900 placeholder-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 全部 / 国内漫游 / 海外探索 */}
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-medium">
              {(
                [
                  ['ALL', `全部 (${citiesData.length})`],
                  ['DOMESTIC', '国内漫游'],
                  ['GLOBAL', '海外探索'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRegionFilter(key)}
                  className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                    regionFilter === key
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : isDark
                      ? 'hover:bg-white/10 text-white/70'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 时序城市列表 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
            {filteredCities.length > 0 ? (
              filteredCities.map((city, idx) => {
                const isSelected = selectedCity?.id === city.id;
                const iata = getCityIataCode(city.city);
                const date = (city.startDate || city.createdAt || '').slice(0, 10);

                return (
                  <button
                    key={city.id}
                    onClick={() => onSelectCity(city)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-300'
                        : isDark
                        ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06] text-white/90'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/60 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected ? 'bg-emerald-500 animate-ping' : isDark ? 'bg-white/30' : 'bg-slate-300'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-mono">{city.city}</span>
                          <span className={`text-[9px] font-mono px-1 rounded ${
                            isDark ? 'bg-white/10 text-white/60' : 'bg-slate-200/70 text-slate-600'
                          }`}>
                            {iata}
                          </span>
                        </div>
                        <div className={`text-[10px] truncate ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                          {city.title}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400 shrink-0">
                      <span>{date}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-400">
                未检索到匹配的足迹城市
              </div>
            )}
          </div>

          {/* 底部署名 */}
          <div className={`px-4 py-2 border-t flex items-center justify-between text-[9px] font-mono ${
            isDark ? 'border-white/[0.08] text-white/40' : 'border-slate-100 text-slate-400'
          }`}>
            <span>Hayden Xue © 2026</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">SPATIO-TEMPORAL CHRONICLES</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
