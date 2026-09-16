'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { FlightDeckDrawer } from './FlightDeckDrawer';
import { FlightTelemetryHUD } from './FlightTelemetryHUD';
import { BoardingPassTicket } from './BoardingPassTicket';
import { JourneyCinematicIntro } from './JourneyCinematicIntro';
import {
  buildCityFootprints,
  buildFlightLegs,
  CityFootprint,
  FlightLeg,
} from './footprint';
import { Plane, X } from 'lucide-react';
import { getCityIataCode } from './footprint';
import { useI18n } from '@/lib/i18n';
import { prewarmCriticalTiles } from './tilePreloader';

// 动态客户端加载 Three.js 高定深空星域画布与 MapLibre GL 3D 全球视口
const JourneyStarfieldCanvas = dynamic(
  () => import('./JourneyStarfieldCanvas').then((mod) => mod.JourneyStarfieldCanvas),
  { ssr: false, loading: () => null }
);

const GoogleEarthGlobeView = dynamic(
  () => import('./GoogleEarthGlobeView').then((mod) => mod.GoogleEarthGlobeView),
  { ssr: false, loading: () => null }
);

interface JourneyFlightAppProps {
  initialJourneys: Awaited<Parameters<typeof buildCityFootprints>[0]>;
}

/**
 * 第一幕 · 沉浸地球舞台 (Journey Flight Stage)
 * 100svh 槽位内相对定位的地球剧场：所有浮窗均为 absolute，滚动离开舞台自然随页滚走。
 * 剧场模式：一键 fixed inset-0 沉浸（父级槽位保持占位，无布局跳动），ESC 退出。
 * 入场编排：开屏长镜头 → 地球下潜 → 航站索引滑入 → 航段指示器落位 → 工具列淡入。
 */
export function JourneyFlightApp({ initialJourneys }: JourneyFlightAppProps) {
  const { resolvedTheme } = useTheme();
  const { locale } = useI18n();
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [isTicketMinimized, setIsTicketMinimized] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 监听 DOM 树 dark 类名变化，保证 100% 实时响应
  useEffect(() => {
    const updateTheme = () => {
      const isDarkClass = document.documentElement.classList.contains('dark');
      setCurrentTheme(isDarkClass ? 'dark' : 'light');
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // 挂载时立即启动核心视口瓦片后台并发预热（与开屏动效完美并行）
  useEffect(() => {
    prewarmCriticalTiles();
  }, []);

  const isDark = currentTheme === 'dark';

  // 鼠标微视差引力漫游
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  }, []);

  // 1. 时序足迹点标（来自真实 journeys 数据）
  const citiesData: CityFootprint[] = useMemo(
    () => buildCityFootprints(initialJourneys),
    [initialJourneys]
  );

  // 2. 时序飞行航段与大圆累计里程
  const { flightLegs, totalKm: totalCumulativeKm } = useMemo(
    () => buildFlightLegs(citiesData),
    [citiesData]
  );

  // 跨越国家数量统计
  const countriesCount = useMemo(() => {
    return new Set(citiesData.map((c) => c.country)).size;
  }, [citiesData]);

  // 舞台状态系统 (默认收起抽屉，提供纯粹全屏沉浸视野)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityFootprint | null>(null);
  const [activeLegIndex, setActiveLegIndex] = useState(0);
  const [legProgressPercent, setLegProgressPercent] = useState(0);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);

  // 控制句柄引用
  const controlsRef = useRef<{
    flyToCity: (city: CityFootprint) => void;
    changeLeg: (idx: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetNorth: () => void;
    toggle3DTilt: () => void;
    toggleOrbit: () => void;
    toggleOverviewCloseUp: () => void;
  } | null>(null);

  const handleMapLoaded = useCallback(() => {
    setIsMapLoaded(true);
  }, []);

  const handleRegisterControls = useCallback((controls: any) => {
    controlsRef.current = controls;
  }, []);

  const handleLegProgress = useCallback((percent: number) => {
    setLegProgressPercent(percent);
  }, []);

  // 选中城市：展开右侧票务坞并驱动地图优雅定焦
  const handleSelectCity = useCallback((city: CityFootprint | null) => {
    setSelectedCity(city);
    setIsTicketMinimized(false);
    if (city) {
      controlsRef.current?.flyToCity(city);
    }
  }, []);

  const handleChangeLeg = useCallback((idx: number) => {
    controlsRef.current?.changeLeg(idx);
  }, []);

  // 剧场模式 / 登机牌 ESC 监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCity) {
          handleSelectCity(null);
        } else if (isTheaterMode) {
          setIsTheaterMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterMode, selectedCity, handleSelectCity]);

  // 剧场模式时锁定页面滚动
  useEffect(() => {
    document.body.style.overflow = isTheaterMode ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isTheaterMode]);

  // 前序城市推导（用于登机牌起降城市对显示）
  const previousCity = useMemo(() => {
    if (!selectedCity || citiesData.length <= 1) return null;
    const idx = citiesData.findIndex((c) => c.id === selectedCity.id);
    if (idx > 0) return citiesData[idx - 1];
    return citiesData[citiesData.length - 1];
  }, [selectedCity, citiesData]);

  const currentLeg: FlightLeg | null = flightLegs[activeLegIndex] || null;

  return (
    <div
      id="journey-stage"
      onMouseMove={handleMouseMove}
      className={`relative h-[100svh] min-h-[560px] w-full overflow-hidden select-none transition-colors duration-700 ${
        isTheaterMode
          ? 'fixed inset-0 z-[70] h-screen'
          : ''
      }`}
    >
      {/* 双主题舞台底色：深色=深空夜幕 / 浅色=宇航晨曦微光天幕 (保留深空底蕴透射星空与地球昼夜) */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark
            ? 'bg-[#030508]'
            : 'bg-gradient-to-b from-[#050b18] via-[#081224] to-[#0e1b33]'
        }`}
        aria-hidden="true"
      />
      {/* 浅色模式专属微弱宇航晨曦地平圈辉光 (不遮蔽星空，增添天际景深) */}
      {!isDark && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -bottom-10 inset-x-0 h-48 bg-gradient-to-t from-sky-500/[0.08] via-indigo-500/[0.03] to-transparent pointer-events-none" />
          <div className="absolute top-0 right-[10%] w-[500px] h-[260px] rounded-full bg-cyan-500/[0.04] blur-[120px] pointer-events-none" />
        </div>
      )}
      {/* 1. 天文摄影级深空星域画布（深蓝/暗夜靛青星云 + 哈佛光谱恒星晶粒） */}
      <JourneyStarfieldCanvas mousePos={mousePos} isDark={isDark} />

      {/* 2. 开屏文字 Logo 与背景虚化等待 3D 地球加载 */}
      <JourneyCinematicIntro
        isLoaded={isMapLoaded}
        isDark={isDark}
        onComplete={() => setIsIntroComplete(true)}
      />

      {/* 3. MapLibre GL 3D 遥感卫星地球与柔和晨昏晕染视口 */}
      <GoogleEarthGlobeView
        citiesData={citiesData}
        flightLegs={flightLegs}
        activeLegIndex={activeLegIndex}
        onLegChange={setActiveLegIndex}
        onProgressChange={handleLegProgress}
        onSelectCity={handleSelectCity}
        isDark={isDark}
        locale={locale}
        isDrawerOpen={isDrawerOpen}
        selectedCity={selectedCity}
        isIntroComplete={isIntroComplete}
        onMapLoaded={handleMapLoaded}
        onOrbitStateChange={setIsOrbiting}
        onRegisterControls={handleRegisterControls}
      />

      {/* 4. 航站索引玻璃岛（开屏后错峰滑入） */}
      <FlightDeckDrawer
        journeys={initialJourneys}
        citiesData={citiesData}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        isOpen={isDrawerOpen}
        onToggleOpen={() => setIsDrawerOpen(!isDrawerOpen)}
        totalDistanceKm={totalCumulativeKm}
        entranceReady={isIntroComplete}
        isDark={isDark}
      />

      {/* 5. 现代 Spatial Glass OS 控制台（左上角航行胶囊 + 分段进度 + 剧场模式 + 工具列 + 时空 Dock） */}
      <FlightTelemetryHUD
        currentLeg={currentLeg}
        activeLegIndex={activeLegIndex}
        totalLegs={flightLegs.length}
        legProgressPercent={legProgressPercent}
        onChangeLeg={handleChangeLeg}
        isTheaterMode={isTheaterMode}
        onToggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
        onZoomIn={() => controlsRef.current?.zoomIn()}
        onZoomOut={() => controlsRef.current?.zoomOut()}
        onResetNorth={() => controlsRef.current?.resetNorth()}
        onToggle3D={() => controlsRef.current?.toggle3DTilt()}
        isOrbiting={isOrbiting}
        onToggleOrbit={() => controlsRef.current?.toggleOrbit()}
        onTogglePerspective={() => controlsRef.current?.toggleOverviewCloseUp()}
        entranceReady={isIntroComplete}
        citiesCount={citiesData.length}
        countriesCount={countriesCount}
        totalKm={totalCumulativeKm}
        logsCount={initialJourneys.length}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      {/* 6. 右侧悬浮票务坞（spring 弹出 + 盖章动效；absolute 随舞台滚走） */}
      {selectedCity && (
        <aside
          aria-label="航旅登机牌悬浮坞"
          className="absolute right-3 sm:right-5 top-20 sm:top-24 z-30 max-w-[calc(100vw-24px)] md:max-w-[700px]"
        >
          {isTicketMinimized ? (
            <button
              onClick={() => setIsTicketMinimized(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#0a0f18]/95 border border-emerald-500/40 backdrop-blur-2xl shadow-2xl text-xs font-mono text-slate-900 dark:text-white hover:scale-105 transition-all group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Plane className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold">已聚焦航点: {selectedCity.city}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                [{getCityIataCode(selectedCity.city)}]
              </span>
              <span className="text-[10px] text-slate-500 dark:text-white/60 ml-1">展开票根 ▾</span>
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              {/* 顶部票务坞控制条 */}
              <div className="flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-white/85 dark:bg-[#0a0f18]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 text-[10px] font-mono text-slate-600 dark:text-white/70 select-none shadow-lg">
                <div className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping motion-reduce:animate-none" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    机载票务坞 · FLIGHT DOCK
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTicketMinimized(true)}
                    className="px-2 py-0.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 transition-colors cursor-pointer"
                    title="收起为悬浮胶囊"
                  >
                    最小化
                  </button>
                  <button
                    onClick={() => handleSelectCity(null)}
                    className="p-1 rounded-lg hover:bg-rose-500/20 hover:text-rose-500 dark:hover:text-rose-400 text-slate-400 dark:text-white/50 transition-colors cursor-pointer"
                    title="关闭登机牌"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 登机牌主体卡片 */}
              <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto custom-scrollbar shadow-2xl rounded-3xl">
                <BoardingPassTicket
                  selectedCity={selectedCity}
                  fromCity={previousCity}
                  onClose={() => handleSelectCity(null)}
                />
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
