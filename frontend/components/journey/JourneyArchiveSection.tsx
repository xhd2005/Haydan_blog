'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { Journey } from '@/lib/types';
import {
  buildCityFootprints,
  buildFlightLegs,
  computeJourneyStats,
  CityFootprint,
  isDomesticCountry,
} from './footprint';
import { MagazineCard } from '@/components/ui/MagazineCard';
import { VisaStamp } from './VisaStamp';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/motion-primitives';
import { MapPin, ArrowUp, Compass, Globe2, Route, Ticket } from 'lucide-react';

interface JourneyArchiveSectionProps {
  journeys: Journey[];
}

/** 数据缎带数字滚动器：进入视口后 count-up 一次 */
function CountUp({
  value,
  duration = 1.6,
  className = '',
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
    </span>
  );
}

type RegionFilter = 'ALL' | 'DOMESTIC' | 'GLOBAL';

/**
 * 第二幕 · 旅程志画卷 (Journey Archive Section)
 * 与 /blog、/projects 同语言的编辑部画卷：数据缎带 → 年份时间线 + 杂志卡片网格 → 手写尾声 CTA。
 * 全部内容 100% 来自真实 journeys 数据，卡片直达 /journey/[slug] 游记详情。
 */
export function JourneyArchiveSection({ journeys }: JourneyArchiveSectionProps) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('ALL');

  const citiesData: CityFootprint[] = useMemo(() => buildCityFootprints(journeys), [journeys]);
  const stats = useMemo(() => computeJourneyStats(citiesData), [citiesData]);
  const { totalKm } = useMemo(() => buildFlightLegs(citiesData), [citiesData]);

  // 筛选 + 按年份倒序分组（年内保持时序正排）
  const yearGroups = useMemo(() => {
    const filtered = citiesData.filter((c) => {
      if (regionFilter === 'DOMESTIC') return isDomesticCountry(c.country);
      if (regionFilter === 'GLOBAL') return !isDomesticCountry(c.country);
      return true;
    });

    const map = new Map<string, CityFootprint[]>();
    filtered.forEach((c) => {
      const year = (c.startDate || c.createdAt || '').slice(0, 4) || 'EARLY';
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(c);
    });

    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [citiesData, regionFilter]);

  return (
    <section
      id="journey-archive"
      className="relative z-30 -mt-14 sm:-mt-16 rounded-t-[2.5rem] sm:rounded-t-[3rem] bg-[#fbfbfd]/95 dark:bg-[#090a0f]/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/[0.08] shadow-[0_-18px_50px_-20px_rgba(0,0,0,0.25)] dark:shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.8)]"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20 space-y-14 sm:space-y-20">
        {/* ============ 卷首标题 ============ */}
        <Reveal className="text-center space-y-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full font-mono text-[10.5px] tracking-[0.22em] uppercase bg-slate-900/[0.04] dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-zinc-400">
            <Compass className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Journey Archive · 旅程志
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15]">
            每一个坐标
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              ，都是一行诗
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            从地球仪上的光点，到杂志卡片里的故事——所有足迹均来自真实发布的游记，点击任意卡片即可启程。
          </p>
        </Reveal>

        {/* ============ 数据缎带：四联统计卡 ============ */}
        <RevealStagger className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5" stagger={0.1}>
          {[
            {
              icon: MapPin,
              label: '足迹城市',
              en: 'CITIES',
              value: stats.citiesCount,
              suffix: '座',
              accent: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              icon: Globe2,
              label: '跨越国家',
              en: 'COUNTRIES',
              value: stats.countriesCount,
              suffix: '国',
              accent: 'text-cyan-600 dark:text-cyan-300',
            },
            {
              icon: Route,
              label: '累计航程',
              en: 'GREAT CIRCLE',
              value: totalKm,
              suffix: 'km',
              accent: 'text-teal-600 dark:text-teal-300',
            },
            {
              icon: Ticket,
              label: '发布游记',
              en: 'LOGS',
              value: citiesData.length,
              suffix: '篇',
              accent: 'text-amber-600 dark:text-amber-300',
            },
          ].map((item) => (
            <RevealItem key={item.label}>
              <div className="group relative h-full rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.1] shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.65)] hover:shadow-[0_24px_50px_-10px_rgba(16,185,129,0.25)] hover:border-emerald-500/50 transition-all duration-500 p-5 sm:p-6 overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/25 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-500">
                    {item.en}
                  </span>
                  <item.icon className="w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <CountUp
                    value={item.value}
                    className={`text-3xl sm:text-4xl font-black font-mono tracking-tight tabular-nums ${item.accent}`}
                  />
                  <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                    {item.suffix}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{item.label}</div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        {/* ============ 地区筛选 tabs ============ */}
        <Reveal className="flex items-center justify-center gap-2 flex-wrap">
          {(
            [
              ['ALL', `全部足迹 (${citiesData.length})`],
              ['DOMESTIC', '国内漫游'],
              ['GLOBAL', '海外探索'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRegionFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
                regionFilter === key
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-lg'
                  : 'bg-white/70 dark:bg-white/[0.05] text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              {label}
            </button>
          ))}
        </Reveal>

        {/* ============ 年份时间线 + 杂志卡片网格 ============ */}
        {yearGroups.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400 dark:text-zinc-500 font-mono">
            该分类下暂无足迹记录 · 去后台发布一篇游记吧
          </div>
        ) : (
          <div className="relative space-y-16">
            {/* 时间线主轴 */}
            <div
              className="absolute left-[7px] sm:left-[9px] top-2 bottom-2 w-[1px] bg-gradient-to-b from-emerald-500/40 via-slate-200 dark:via-white/[0.08] to-transparent"
              aria-hidden="true"
            />

            {yearGroups.map(([year, cities], gi) => (
              <div key={year} className="relative pl-8 sm:pl-12">
                {/* 年份节点标签 */}
                <Reveal
                  className="absolute -left-0 sm:-left-0 top-0 flex items-center"
                  y={12}
                >
                  <span className="relative inline-flex items-center gap-2 pl-3">
                    <span className="absolute -left-[7px] sm:-left-[9px] w-3.5 h-3.5 rounded-full bg-emerald-500 border-[3px] border-[#fbfbfd] dark:border-[#090a0f] shadow-md shadow-emerald-500/30" />
                    <span className="font-mono text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                      {year}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 tracking-wider">
                      {String(cities.length).padStart(2, '0')} 站
                    </span>
                  </span>
                </Reveal>

                {/* 卡片网格（首年顶部留出年份标题空间） */}
                <RevealStagger
                  className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 ${
                    gi === 0 ? 'pt-10 sm:pt-12' : 'pt-2'
                  }`}
                  stagger={0.09}
                >
                  {cities.map((city) => (
                    <RevealItem key={city.id}>
                      <MagazineCard
                        href={`/journey/${city.slug}`}
                        title={city.title}
                        cover={city.cover}
                        excerpt={city.description}
                        date={city.startDate || city.createdAt}
                        logId={city.id}
                        eyebrow={
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                            <MapPin className="w-2.5 h-2.5" />
                            {city.city} · {city.country}
                          </span>
                        }
                        overlay={
                          city.startDate ? (
                            <div className="absolute top-3 right-3">
                              <VisaStamp
                                city={city.city}
                                country={city.country}
                                year={city.startDate.slice(0, 4)}
                                className="w-14 h-14 opacity-90"
                              />
                            </div>
                          ) : undefined
                        }
                        footerLeft={
                          <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                            {city.lat.toFixed(1)}°, {city.lon.toFixed(1)}°
                          </span>
                        }
                        readMoreText="阅读游记"
                      />
                    </RevealItem>
                  ))}
                </RevealStagger>
              </div>
            ))}
          </div>
        )}

        {/* ============ 尾声 CTA：手写展望 + 回到轨道视图 ============ */}
        <Reveal className="text-center space-y-6 pt-4">
          <p className="font-handwrite text-3xl sm:text-5xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent">
            Where to next, captain?
          </p>
          <p className="text-xs font-mono tracking-[0.35em] text-slate-400 dark:text-zinc-500 uppercase">
            下一站 · 星河漫漫 · 步履生辉
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              去读博客文章
            </Link>
            <a
              href="#journey-stage"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.12] text-sm font-bold text-slate-700 dark:text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-300 hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              <ArrowUp className="w-4 h-4" />
              回到轨道视图
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
