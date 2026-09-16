import React from 'react';
import { api } from '@/lib/api';
import { Journey } from '@/lib/types';
import { getServerTranslation } from '@/lib/i18n-server';
import type { Metadata } from 'next';
import { JourneyFlightApp } from '@/components/journey/JourneyFlightApp';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'Voyage & Moving Map | Hayden Xue' : '环球漫游与时空航图 | Hayden Xue',
    description:
      'Chronicles of Hayden Xue’s global expeditions, urban walks, and landscape photography across real geographic coordinates.',
  };
}

export const revalidate = 60;

export default async function JourneyPage() {
  // 并发获取旅行足迹真实数据
  const journeys = await api.getJourneys().catch(() => [] as Journey[]);

  return (
    <>
      {/* 提前进行 DNS 解析与 TLS 握手，加速 Esri 与 NASA 遥感瓦片加载 */}
      <link rel="dns-prefetch" href="https://server.arcgisonline.com" />
      <link rel="preconnect" href="https://server.arcgisonline.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://gibs.earthdata.nasa.gov" />
      <link rel="preconnect" href="https://gibs.earthdata.nasa.gov" crossOrigin="anonymous" />
      <link rel="preload" href="/maplibre-gl-worker.mjs" as="worker" type="text/javascript" />

      <main className="w-full h-[100svh] relative overflow-hidden bg-[#030508] dark:bg-[#030508] select-none">
        {/* 沉浸式时空航行全屏剧场 */}
        <JourneyFlightApp initialJourneys={journeys} />
      </main>
    </>
  );
}
