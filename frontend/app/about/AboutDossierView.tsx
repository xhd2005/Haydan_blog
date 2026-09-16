'use client';

import React, { useState, useEffect } from 'react';
import { Timeline, SiteSetting, Journey } from '@/lib/types';
import { CinematicActDock } from './components/CinematicActDock';
import { CinematicHeroAct } from './components/CinematicHeroAct';
import { CinematicWildernessFilmAct } from './components/CinematicWildernessFilmAct';
import { CinematicLivingChronicleAct } from './components/CinematicLivingChronicleAct';
import { CinematicTerminalColophonAct } from './components/CinematicTerminalColophonAct';

interface AboutDossierViewProps {
  timelines: Timeline[];
  settings: SiteSetting | null;
  journeys?: Journey[];
}

/**
 * AboutDossierView
 * 
 * 沉浸式电影级空间叙事长卷 (Cinematic Scrollytelling Odyssey)
 * 
 * 1. 经典电影四大分幕长卷：
 *    - Act 01: 序章 // 身份初现与生命脉搏 (纯净黑曜石微晶深空 + 双面灵魂字体 + 序章交响字符动效)
 *    - Act 02: 回响 // 旷野沉思与 35mm 胶片测光廊 (CMS 真实游记直连 + 暗房大图灯箱)
 *    - Act 03: 跃迁 // 动态时空纪元长卷 (CMS Timelines 100% 动态驱动 + 历史手稿)
 *    - Act 04: 终章 // 公理引言与极客交互终端 (巨幕哲学格言 + 内嵌可执行 Terminal + 悬浮联络坞)
 * 2. 右侧高定悬浮分幕导航坞 (Cinematic Act Dock)：
 *    - 实时同步当前幕次 (01 ~ 04)；
 *    - 支持平滑跳转与键盘 ArrowUp / ArrowDown 上下切幕。
 * 3. 严格遵循 AGENTS.md 准则：
 *    - 站长姓名严格唯一保持 Hayden Xue；
 *    - 真实关联数据库游记（journeys）与时空纪元（timelines）；
 *    - 双主题深度景深（凝脂白瓷 #fbfbfd vs 曜石黑 #050608）。
 */
export function AboutDossierView({
  timelines = [],
  settings,
  journeys = [],
}: AboutDossierViewProps) {
  const [activeActIndex, setActiveActIndex] = useState<number>(0);

  const actIds = [
    'act-hero',
    'act-wilderness',
    'act-chronicle',
    'act-terminal',
  ];

  // 平滑跳转到目标剧幕
  const handleSelectAct = (index: number) => {
    setActiveActIndex(index);
    const targetId = actIds[index];
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 监听视口中的剧幕，动态高亮当前分幕
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    actIds.forEach((id, index) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveActIndex(index);
            }
          });
        },
        { rootMargin: '-30% 0px -40% 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const avatarUrl = settings?.avatar || undefined;

  // 解析 CMS 后台关于页独立视觉配置 (pageVisualsJson.about)
  let heroVideoUrl: string | undefined = undefined;
  let heroImageUrl: string | undefined = undefined;
  let heroBgType: 'obsidian' | 'video' | 'image' = 'obsidian';
  let titleLine1: string = 'Engineering Elegance,';
  let titleLine2: string = 'Wandering in Nature.';
  let fontFamilyLine1: string = 'sans';
  let fontFamilyLine2: string = 'handwrite';
  let customFontLine1: string | undefined = undefined;
  let customFontLine2: string | undefined = undefined;

  if (settings?.pageVisualsJson) {
    try {
      const visuals = JSON.parse(settings.pageVisualsJson);
      const aboutVisual = visuals.about;
      if (aboutVisual) {
        if (aboutVisual.bgType === 'image' && aboutVisual.bgUrl) {
          heroImageUrl = aboutVisual.bgUrl;
          heroBgType = 'image';
        } else if (aboutVisual.bgType === 'video' && aboutVisual.bgUrl) {
          heroVideoUrl = aboutVisual.bgUrl;
          heroBgType = 'video';
        } else {
          heroBgType = 'obsidian';
        }

        if (aboutVisual.titleLine1) titleLine1 = aboutVisual.titleLine1;
        if (aboutVisual.titleLine2) titleLine2 = aboutVisual.titleLine2;
        if (aboutVisual.fontFamilyLine1) fontFamilyLine1 = aboutVisual.fontFamilyLine1;
        if (aboutVisual.fontFamilyLine2) fontFamilyLine2 = aboutVisual.fontFamilyLine2;
        if (aboutVisual.customFontLine1) customFontLine1 = aboutVisual.customFontLine1;
        if (aboutVisual.customFontLine2) customFontLine2 = aboutVisual.customFontLine2;
      }
    } catch {
      // 容错保持默认
    }
  }

  return (
    <div className="relative min-h-screen bg-[#fbfbfd] dark:bg-[#050608] text-slate-900 dark:text-white selection:bg-emerald-500/20 selection:text-emerald-500 transition-colors duration-500 overflow-x-hidden">
      
      {/* 悬浮电影分幕导航轨 (桌面端右侧固定，移动端顶部胶囊) */}
      <CinematicActDock
        activeActIndex={activeActIndex}
        onSelectAct={handleSelectAct}
      />

      <div className="relative z-10 space-y-4 sm:space-y-8">
        {/* Act 01: 序章 // 身份初现与生命体征 (纯净黑曜石微晶深空 + 双面灵魂字体 + 序章交响) */}
        <CinematicHeroAct
          avatarUrl={avatarUrl}
          onExploreClick={() => handleSelectAct(1)}
          videoUrl={heroVideoUrl}
          imageUrl={heroImageUrl}
          bgType={heroBgType}
          titleLine1={titleLine1}
          titleLine2={titleLine2}
          fontFamilyLine1={fontFamilyLine1}
          fontFamilyLine2={fontFamilyLine2}
          customFontLine1={customFontLine1}
          customFontLine2={customFontLine2}
        />

        {/* Act 02: 回响 // 旷野沉思与 35mm 胶片测光廊 */}
        <CinematicWildernessFilmAct journeys={journeys} />

        {/* Act 03: 跃迁 // CMS 动态时空纪元长卷 */}
        <CinematicLivingChronicleAct timelines={timelines} />

        {/* Act 04: 终章 // 公理引言、极客交互终端与高定联络坞 */}
        <CinematicTerminalColophonAct />
      </div>

    </div>
  );
}
