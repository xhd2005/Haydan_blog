import React from 'react';
import { api } from '@/lib/api';
import { Timeline, SiteSetting, Journey } from '@/lib/types';
import { getServerTranslation } from '@/lib/i18n-server';
import type { Metadata } from 'next';
import { AboutDossierView } from './AboutDossierView';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'About Hayden Xue | Full-Stack Architect & Digital Garden' : '关于 Hayden Xue | 极客画像与造物纪实',
    description:
      'About Hayden Xue: Full-Stack Architect, Digital Gardener, and Visual Explorer. Growth epochs, craftsman toolkit, and philosophy.',
  };
}

export const revalidate = 60;

export default async function AboutPage() {
  const [timelines, settings, journeys] = await Promise.all([
    api.getTimelines().catch(() => [] as Timeline[]),
    api.getSettings().catch(() => null as SiteSetting | null),
    api.getJourneys().catch(() => [] as Journey[]),
  ]);

  return (
    <AboutDossierView
      timelines={timelines}
      settings={settings}
      journeys={journeys}
    />
  );
}

