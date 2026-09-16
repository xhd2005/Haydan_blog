import React from 'react';
import { api } from '@/lib/api';
import { Friend, FriendActivity } from '@/lib/types';
import { getServerTranslation } from '@/lib/i18n-server';
import type { Metadata } from 'next';
import { LinksDirectoryView } from './LinksDirectoryView';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'Friends & Garden Allies | Hayden Xue' : '数字花园友邻圈 | Hayden Xue',
    description:
      'Walking with authentic creators, tech writers, and independent builders across the open web. Hayden Xue verified friends directory.',
    openGraph: {
      title: 'Friends & Garden Allies | Hayden Xue',
      description: 'Walking with authentic creators, tech writers, and independent builders across the open web.',
      type: 'website',
    },
  };
}

export const revalidate = 60;

export default async function LinksPage() {
  const [friends, activities] = await Promise.all([
    api.getFriends().catch(() => [] as Friend[]),
    api.getFriendStream().catch(() => [] as FriendActivity[]),
  ]);

  return <LinksDirectoryView initialFriends={friends} initialActivities={activities} />;
}
