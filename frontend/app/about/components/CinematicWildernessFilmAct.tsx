'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Journey } from '@/lib/types';
import { 
  Compass, 
  Camera, 
  MapPin, 
  ArrowUpRight, 
  Maximize2, 
  X, 
  Film, 
  Globe2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface CinematicWildernessFilmActProps {
  journeys?: Journey[];
}

export function CinematicWildernessFilmAct({ journeys = [] }: CinematicWildernessFilmActProps) {
  // 优雅兜底川西雪山真实记录
  const fallbackJourneys: Journey[] = [
    {
      id: 1,
      title: '川西高海拔雪线漫游与贡嘎群峰',
      city: '甘孜',
      country: '中国',
      cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
      slug: 'gongga-snow-mountain',
      description: '在零下 15 度的狂风中记录日照金山。徒步与系统架构同理：唯有专注脚下的步频与呼吸，才能翻越漫长的垭口。',
      createdAt: '2023-10-18',
      updatedAt: '2023-10-18',
      latitude: 29.58,
      longitude: 101.88,
    },
    {
      id: 2,
      title: '格聂神山南线重装穿越实录',
      city: '理塘',
      country: '中国',
      cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
      slug: 'genie-mountain-crossing',
      description: '背负 18kg 行囊在海拔 4,700 米的高山草甸与碎石流中徒步。彻底剥离城市繁杂信息，心智回归最清澈的极简基态。',
      createdAt: '2024-06-22',
      updatedAt: '2024-06-22',
      latitude: 29.82,
      longitude: 99.80,
    },
  ];

  // 优先采用数据库真实游记，缺省时结合真实兜底
  const displayJourneys = journeys.length > 0 ? journeys.slice(0, 4) : fallbackJourneys;
  const [activeLightboxJourney, setActiveLightboxJourney] = useState<Journey | null>(null);

  // 监听 ESC 键关闭灯箱
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightboxJourney(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section id="act-wilderness" className="relative py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* 章节导引 */}
      <div className="mb-12 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <Compass className="w-3.5 h-3.5" />
            ACT 02 · WILDERNESS ECHOES & 35MM FILM
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-serif tracking-tight text-slate-900 dark:text-white">
            回响：旷野沉思与 35mm 胶片测光廊
          </h2>
        </div>
        <p className="text-sm font-mono text-slate-500 dark:text-neutral-400 max-w-md">
          在稀薄冰冷的雪线空气中校准心智，所有点标严格关联数据库真实游记记录。
        </p>
      </div>

      {/* 胶片相纸廊展台 (Film Contact Sheet) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayJourneys.map((journey, idx) => (
          <div
            key={journey.id || idx}
            className="group relative rounded-[28px] p-5 sm:p-6 overflow-hidden
              bg-white/85 dark:bg-[#0f1117]/85 backdrop-blur-2xl
              border border-slate-200/80 dark:border-white/[0.08]
              shadow-lg hover:shadow-2xl hover:border-emerald-500/40 transition-all duration-500"
          >
            {/* 拟真 35mm 胶片打孔边缘修饰 */}
            <div className="flex items-center justify-between px-2 pb-3 text-[10px] font-mono text-slate-400 dark:text-neutral-500 border-b border-slate-100 dark:border-white/[0.04]">
              <span className="flex items-center gap-1.5">
                <Film className="w-3 h-3 text-emerald-500" />
                <span>KODAK PORTRA 400 · 35MM EXIF</span>
              </span>
              <span>EXP #{String(idx + 1).padStart(2, '0')}</span>
            </div>

            {/* 胶片相框主体 */}
            <div className="relative mt-3 w-full h-56 sm:h-64 rounded-2xl overflow-hidden shadow-inner bg-slate-900">
              <Image
                src={journey.cover || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop'}
                alt={journey.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105 filter saturate-[1.08]"
                sizes="(max-width: 768px) 100vw, 600px"
              />
              
              {/* 胶片暗角与渐变 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* 浮动放大按钮 */}
              <button
                type="button"
                onClick={() => setActiveLightboxJourney(journey)}
                aria-label="在暗房灯箱中查看高清大图"
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-emerald-500 transition-colors opacity-0 group-hover:opacity-100 duration-300"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* 胶片底部经纬度与地标 */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-mono">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{journey.city ? `${journey.city} · ${journey.country}` : '川西雪山'}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10 text-[11px] text-emerald-300">
                  {journey.latitude && journey.longitude 
                    ? `${journey.latitude.toFixed(2)}°N ${journey.longitude.toFixed(2)}°E`
                    : '4,768 m 垭口'}
                </span>
              </div>
            </div>

            {/* 游记叙述内容 */}
            <div className="mt-5 space-y-2">
              <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {journey.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans line-clamp-2 leading-relaxed">
                {journey.description || '在零下 15 度的狂风中记录日照金山。翻越漫长垭口，心智回归最清澈的极简基态。'}
              </p>
            </div>

            {/* 联动详情入口 */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
              <Link
                href={journey.slug ? `/journey/${journey.slug}` : '/journey'}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <span>阅读真实游记长文</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/journey"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
              >
                <Globe2 className="w-3 h-3" />
                <span>3D 地球仪足迹</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 旷野信条胶囊横幅 */}
      <div className="mt-10 p-6 sm:p-8 rounded-[24px] bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
            WILDERNESS MANIFESTO · 旷野信条
          </div>
          <p className="text-sm sm:text-base font-serif text-slate-800 dark:text-slate-200">
            “最高级别的软件架构，与攀登高海拔雪线无异：从来不是盲目堆砌代码，而是在广袤的自然中保持克制与自律。”
          </p>
        </div>
        <Link
          href="/journey"
          className="shrink-0 px-5 py-2.5 rounded-full text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors"
        >
          探索全部真实航迹 →
        </Link>
      </div>

      {/* ================= 胶片暗房全屏灯箱 (Darkroom Lightbox) ================= */}
      {activeLightboxJourney && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 select-none"
        >
          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={() => setActiveLightboxJourney(null)}
            aria-label="关闭暗房灯箱"
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl w-full flex flex-col items-center">
            <div className="relative w-full h-[60vh] sm:h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <Image
                src={activeLightboxJourney.cover || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1800&auto=format&fit=crop'}
                alt={activeLightboxJourney.title}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* 灯箱底部 EXIF 与详情导航 */}
            <div className="mt-4 w-full flex flex-wrap items-center justify-between gap-4 text-white">
              <div>
                <h3 className="text-lg font-serif font-bold">
                  {activeLightboxJourney.title}
                </h3>
                <p className="text-xs font-mono text-neutral-400 mt-0.5">
                  {activeLightboxJourney.city} · {activeLightboxJourney.country} · Leica M6 35mm
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={activeLightboxJourney.slug ? `/journey/${activeLightboxJourney.slug}` : '/journey'}
                  onClick={() => setActiveLightboxJourney(null)}
                  className="px-4 py-2 rounded-full text-xs font-mono font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                >
                  进入游记详情长文
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
