import React from 'react';
import { api } from '@/lib/api';
import { Memo } from '@/lib/types';
import { PolaroidMemoCard } from '@/components/memos/PolaroidMemoCard';
import { getServerTranslation } from '@/lib/i18n-server';
import { Sparkles, Camera, Heart } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'Memos & Thoughts | Hayden Xue' : '随记与微动态 | Hayden Xue',
    description: 'Capturing ephemeral thoughts, inspirations and micro-updates in real time with 3D polaroid cards.',
  };
}

export const revalidate = 60;

export default async function MemosPage() {
  const { locale, t } = getServerTranslation();
  const memosData = await api
    .getMemos({ page: 1, pageSize: 30 })
    .catch(() => ({ records: [] as Memo[], total: 0, page: 1, pageSize: 30 }));
  const memos = memosData.records || [];

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <Camera className="w-3.5 h-3.5" />
          <span>POLAROID 3D · {t('memos.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {t('memos.title')}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
          {t('memos.desc')}
        </p>

        {/* 交互说明徽章 */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary border border-border">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            {locale === 'en' ? 'Click "3D" to flip specs' : '点击 "3D" 翻转拍摄参数'}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary border border-border">
            <Heart className="w-3 h-3 text-rose-500" />
            {t('polaroid.double_click')}
          </span>
        </div>
      </div>

      {/* 3D Polaroid Memo Gallery Stream */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
        {memos.length > 0 ? (
          memos.map((memo, idx) => (
            <PolaroidMemoCard key={memo.id} memo={memo} index={idx} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed border-border rounded-3xl">
            {t('memos.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
