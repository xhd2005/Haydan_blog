import React from 'react';
import { api } from '@/lib/api';
import { Post, Project, Journey, SiteSetting } from '@/lib/types';
import { HeroCinematicStage } from '@/components/home/HeroCinematicStage';
import { HomeBentoDeck } from '@/components/home/HomeBentoDeck';
import { getServerTranslation } from '@/lib/i18n-server';

async function getHomeData() {
  try {
    const [latestPosts, featuredProjects, latestJourneys, settings] = await Promise.all([
      api.getLatestPosts(8).catch(() => [] as Post[]),
      api.getFeaturedProjects().catch(() => [] as Project[]),
      api.getLatestJourneys(12).catch(() => [] as Journey[]),
      api.getSettings().catch(() => null as SiteSetting | null),
    ]);
    return { 
      latestPosts, 
      featuredProjects, 
      latestJourneys, 
      settings,
    };
  } catch (e) {
    return { latestPosts: [], featuredProjects: [], latestJourneys: [], settings: null };
  }
}

export const revalidate = 60;

export default async function HomePage() {
  const { locale, t } = getServerTranslation();
  const { latestPosts: rawLatestPosts, featuredProjects, latestJourneys, settings } = await getHomeData();

  // 双语自适应去重与过滤
  let latestPosts: Post[] = [];
  if (locale === 'en') {
    const translatedZhIds = new Set<number>();
    rawLatestPosts.forEach((p) => {
      if (p.lang === 'en' && p.translationPostId) {
        translatedZhIds.add(p.translationPostId);
      }
    });
    latestPosts = rawLatestPosts.filter((p) => {
      if (p.lang === 'en') return true;
      if (translatedZhIds.has(p.id)) return false;
      if (p.translationPostId && p.translationPost?.status === 'PUBLISHED') return false;
      return true;
    });
    latestPosts.sort((a, b) => {
      const aScore = a.lang === 'en' ? 0 : 1;
      const bScore = b.lang === 'en' ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      return 0;
    });
  } else {
    const translatedEnIds = new Set<number>();
    rawLatestPosts.forEach((p) => {
      if (p.lang === 'zh' && p.translationPostId) {
        translatedEnIds.add(p.translationPostId);
      }
    });
    latestPosts = rawLatestPosts.filter((p) => {
      if (p.lang === 'zh' || !p.lang) return true;
      if (translatedEnIds.has(p.id)) return false;
      if (p.translationPostId && p.translationPost?.status === 'PUBLISHED') return false;
      return true;
    });
  }
  latestPosts = latestPosts.slice(0, 3);

  const heroTitle = settings?.heroTitle || (locale === 'en' ? 'From the East,' : '基于东方，');
  const heroSlogan = settings?.heroSlogan || (locale === 'en' ? 'toward the unknown.' : '探索未知。');
  const heroDesc = settings?.heroDescription || t('home.hero_default_desc');

  return (
    <div className="w-full">
      {/* 1. 沉浸式 Hero 舞台：全屏直通顶端，内嵌浮光公告药丸与悬浮液态胶囊 Navbar 浑然天成 */}
      <section className="w-full relative">
        <HeroCinematicStage
          heroTitle={heroTitle}
          heroSlogan={heroSlogan}
          heroDesc={heroDesc}
          heroBgType={settings?.heroBgType}
          heroVideoUrl={settings?.heroVideoUrl}
          heroSloganConfigJson={settings?.heroSloganConfigJson}
          announcementEnabled={settings?.announcementEnabled}
          announcementText={settings?.announcementText}
          announcementLink={settings?.announcementLink}
        />
      </section>

      {/* 2. 核心展区 Bento 灵动画廊 (自然流式承接 Hero 底部羽化，文章不向上重叠浮动) */}
      <div className="relative w-full overflow-hidden pt-10 sm:pt-14 pb-24 z-10">
        {/* 深空极光流动星云图层 (Aurora Nebula Mesh) */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 -left-48 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/[0.08] blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-1/3 -right-48 w-[32rem] h-[32rem] rounded-full bg-cyan-500/10 dark:bg-cyan-500/[0.07] blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute top-2/3 left-1/4 w-[28rem] h-[28rem] rounded-full bg-purple-500/10 dark:bg-purple-500/[0.06] blur-[140px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>

        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 pb-24">
          <HomeBentoDeck
            latestPosts={latestPosts}
            featuredProjects={featuredProjects}
            latestJourneys={latestJourneys}
            settings={settings}
          />
        </div>
      </div>
    </div>
  );
}
