'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { CityFootprint, getCityIataCode } from './footprint';
import { SafeImage } from '@/components/SafeImage';
import { VisaStamp } from './VisaStamp';
import { Plane, ArrowRight, MapPin, Sparkles, X } from 'lucide-react';

interface BoardingPassTicketProps {
  selectedCity: CityFootprint;
  fromCity?: CityFootprint | null;
  onClose?: () => void;
  className?: string;
}

/**
 * 航空高定双联撕纸登机牌 v2 —— 航空骨架 × 手账质感
 * - 弹簧入场 (spring bounce) + VisaStamp 盖章动效 (scale 2.4 → 0.9 → 1 旋转回弹)
 * - 手账纸面质感：暖纸纤维底纹 + 手写体航注 + 湿印章
 * - 桌面端水平双联 / 移动端垂直堆叠，锯齿撕裂线保留
 */
export function BoardingPassTicket({
  selectedCity,
  fromCity,
  onClose,
  className = '',
}: BoardingPassTicketProps) {
  const reduceMotion = useReducedMotion();
  const toIata = getCityIataCode(selectedCity.city);
  const fromIata = fromCity ? getCityIataCode(fromCity.city) : 'HDN';
  const idNum =
    typeof selectedCity.id === 'number'
      ? selectedCity.id
      : Array.from(String(selectedCity.id)).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const flightNumber = `HX-${(idNum * 137 + 100) % 900 + 100}`;
  const dateStr = selectedCity.startDate || selectedCity.createdAt?.slice(0, 10) || '';
  const yearStr = dateStr.slice(0, 4) || String(new Date().getFullYear());

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32, rotate: 1.5, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0.15 }
          : { type: 'spring', stiffness: 210, damping: 22, mass: 0.9 }
      }
      className={`relative flex flex-col md:flex-row w-full max-w-[360px] md:max-w-[620px] rounded-3xl overflow-hidden bg-[#fefdfb]/97 dark:bg-[#0a0f18]/95 border border-slate-200/95 dark:border-white/15 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.8)] text-slate-900 dark:text-white ${className}`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(120,113,108,0.028) 0px, rgba(120,113,108,0.028) 1px, transparent 1px, transparent 3px)',
      }}
    >
      {/* ===================== 左联：乘客主联 (Main Ticket) ===================== */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-5">
        {/* 顶栏：航司品牌与舱位标牌 */}
        <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-300/80 dark:border-white/10 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Plane className="w-3 h-3" />
            </div>
            <span className="font-black tracking-widest text-slate-900 dark:text-white">
              HAYDEN AIRWAYS
            </span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/15 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 font-bold text-[8px]">
              FIRST
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-white/70 font-semibold">
            <span>FLIGHT</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{flightNumber}</span>
          </div>
        </div>

        {/* 起降超大 IATA 字符与城市对 */}
        <div className="flex items-center justify-between gap-2 py-3">
          <div className="text-left">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono leading-none">
              {fromIata}
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-white/60 mt-1">
              {fromCity ? fromCity.city : '起航基地'}
            </div>
          </div>

          {/* 航程中间连接标志 */}
          <div className="flex-1 flex flex-col items-center px-2">
            <div className="flex items-center gap-1 w-full justify-center">
              <div className="h-[1px] flex-1 border-t border-dashed border-slate-300 dark:bg-white/20" />
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Plane className="w-3 h-3 rotate-90" />
              </div>
              <div className="h-[1px] flex-1 border-t border-dashed border-slate-300 dark:bg-white/20" />
            </div>
            <span className="font-handwrite text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 tracking-wide">
              non-stop expedition
            </span>
          </div>

          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono leading-none">
              {toIata}
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-white/60 mt-1">
              {selectedCity.city}
            </div>
          </div>
        </div>

        {/* 核心内容区：封面图与游记简介 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 my-1 items-center">
          {selectedCity.cover && (
            <div className="sm:col-span-5 relative w-full h-24 rounded-2xl overflow-hidden shadow-inner bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-white/10 group/cover">
              <SafeImage
                src={selectedCity.cover}
                alt={selectedCity.title}
                aspectRatio="16/9"
                containerClassName="w-full h-full"
              />
              <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-emerald-300 font-mono text-[8px] backdrop-blur-md flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                <span>
                  {selectedCity.lat.toFixed(2)}°, {selectedCity.lon.toFixed(2)}°
                </span>
              </div>
            </div>
          )}

          <div className={`${selectedCity.cover ? 'sm:col-span-7' : 'sm:col-span-12'} space-y-1.5`}>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
              {selectedCity.title}
            </h4>
            {selectedCity.description && (
              <p className="text-[10px] text-slate-600 dark:text-white/65 line-clamp-2 leading-relaxed">
                {selectedCity.description}
              </p>
            )}
            <div className="font-handwrite text-[13px] text-emerald-700/90 dark:text-emerald-300/90 leading-none pt-0.5">
              {selectedCity.city}, {selectedCity.country}
            </div>
          </div>
        </div>

        {/* 舱位、登机口、日期三联信息栅格 */}
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-center font-mono mt-2">
          <div>
            <span className="block text-[7px] text-slate-500 dark:text-white/40 uppercase font-semibold">
              GATE
            </span>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white">08A</span>
          </div>
          <div>
            <span className="block text-[7px] text-slate-500 dark:text-white/40 uppercase font-semibold">
              SEAT
            </span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">01A</span>
          </div>
          <div>
            <span className="block text-[7px] text-slate-500 dark:text-white/40 uppercase font-semibold">
              DATE
            </span>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white">{dateStr}</span>
          </div>
        </div>
      </div>

      {/* ===================== 中间拟物撕纸齿孔与虚线 (Perforated Tear Notch) ===================== */}
      {/* 桌面端：垂直齿孔撕线 */}
      <div className="hidden md:flex flex-col items-center justify-between relative w-6 shrink-0 pointer-events-none my-[-1px]">
        <div className="w-5 h-3 rounded-b-full bg-[#fbfbfd] dark:bg-[#030508] border-b border-x border-slate-200/90 dark:border-white/15" />
        <div className="w-[1px] flex-1 border-r-2 border-dashed border-slate-300 dark:border-white/20 my-1" />
        <div className="w-5 h-3 rounded-t-full bg-[#fbfbfd] dark:bg-[#030508] border-t border-x border-slate-200/90 dark:border-white/15" />
      </div>

      {/* 移动端：水平齿孔撕线 */}
      <div className="md:hidden relative flex items-center justify-between my-0.5 px-0 pointer-events-none">
        <div className="w-3.5 h-5 rounded-r-full bg-[#fbfbfd] dark:bg-[#030508] -ml-2 border-r border-slate-200/80 dark:border-white/15" />
        <div className="flex-1 border-t-2 border-dashed border-slate-300/80 dark:border-white/20 mx-2" />
        <div className="w-3.5 h-5 rounded-l-full bg-[#fbfbfd] dark:bg-[#030508] -mr-2 border-l border-slate-200/80 dark:border-white/15" />
      </div>

      {/* ===================== 右联：副券存根区 (Stub) ===================== */}
      <div className="w-full md:w-[250px] shrink-0 p-4 sm:p-5 flex flex-col justify-between bg-[#faf7f2]/95 dark:bg-white/[0.02] border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-white/10">
        {/* 副券顶栏与关闭按钮 */}
        <div className="flex items-center justify-between pb-2">
          <div>
            <span className="text-[8px] font-mono text-slate-500 dark:text-white/40 block font-semibold">
              BOARDING STUB · 存根
            </span>
            <div className="text-xs font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{selectedCity.city}</span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400">[{toIata}]</span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:text-white/50 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="关闭登机牌"
              aria-label="关闭登机牌"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 乘客身份与湿盖签证印章（盖章动效：scale 2.4 → 0.9 → 1 + 旋转回弹） */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5 font-mono text-[8px] text-slate-500 dark:text-white/60">
            <div>PASSENGER</div>
            <div className="text-[10px] font-bold text-slate-900 dark:text-white tracking-wide">
              HAYDEN XUE
            </div>
            <div>STATUS: VERIFIED</div>
          </div>

          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 2.4, rotate: -28 }}
            animate={
              reduceMotion
                ? { opacity: 1, scale: 1, rotate: 0 }
                : { opacity: 1, scale: [2.4, 0.9, 1.05, 1], rotate: [-28, -6, 2, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0.15, delay: 0.2 }
                : { duration: 0.5, delay: 0.45, times: [0, 0.6, 0.82, 1], ease: 'easeOut' }
            }
            key={`stamp-${selectedCity.id}`}
            className="relative -my-2 -mr-1 scale-90"
          >
            <VisaStamp
              city={selectedCity.city}
              country={selectedCity.country}
              year={yearStr}
              className="w-16 h-16"
            />
          </motion.div>
        </div>

        {/* 航空标准 SVG 矢量条形码 */}
        <div className="p-1.5 rounded-xl bg-white/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex flex-col items-center my-1.5">
          <svg className="w-full h-6" viewBox="0 0 200 24" preserveAspectRatio="none">
            {[
              2, 4, 8, 12, 14, 18, 22, 26, 28, 34, 38, 40, 46, 50, 56, 62, 66, 70, 74, 80, 84, 90,
              94, 100, 106, 110, 116, 122, 128, 134, 140, 144, 150, 156, 160, 166, 172, 178, 184,
              190, 196,
            ].map((x, i) => (
              <line
                key={i}
                x1={x}
                y1="0"
                x2={x}
                y2="24"
                stroke="currentColor"
                strokeWidth={i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1}
                className="text-slate-800 dark:text-white/80"
              />
            ))}
          </svg>
          <span className="text-[7px] font-mono tracking-[0.25em] text-slate-400 dark:text-white/40 mt-0.5">
            HX {flightNumber} · {toIata} · ETKT
          </span>
        </div>

        {/* 撕下副券 · 阅览游记 直达按钮 */}
        <Link
          href={selectedCity.slug ? `/journey/${selectedCity.slug}` : `/journey`}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/25 transition-all duration-200 group cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-slate-950" />
          <span>撕下副券 · 阅览游记</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
