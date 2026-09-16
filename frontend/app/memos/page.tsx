import React from 'react';
import { api } from '@/lib/api';
import { Memo } from '@/lib/types';
import { getServerTranslation } from '@/lib/i18n-server';
import type { Metadata } from 'next';
import { JournalTimelineFlow } from '@/components/memos/JournalTimelineFlow';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title:
      locale === 'en'
        ? 'Mindstream Bento & Visual Diary | Hayden Xue'
        : '瞬息与光影 · Bento 随记灵感流 | Hayden Xue',
    description:
      'Modern Bento visual diary, moments, photography and thoughts by Hayden Xue. An authentic digital garden stream of moments and mindstream.',
  };
}

export const revalidate = 60;

export default async function MemosPage() {
  // 获取真实已发布的随记数据（加大单页上限以供时间线完整呈现）
  const memosData = await api
    .getMemos({ page: 1, pageSize: 100 })
    .catch(() => ({ records: [] as Memo[], total: 0, page: 1, pageSize: 100 }));

  const memos = memosData.records || [];

  return <JournalTimelineFlow initialMemos={memos} />;
}
