import React from 'react';
import { api } from '@/lib/api';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { getServerTranslation } from '@/lib/i18n-server';
import { Sparkles, BookOpen, Hammer, Compass, Lightbulb, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'What I am Doing Now | Hayden Xue' : '此时此刻正在做什么 | Hayden Xue',
    description: 'What Hayden Xue is doing right now. Learning, building, exploring, and thinking.',
  };
}

export const revalidate = 60;

export default async function NowPage() {
  const { locale, t } = getServerTranslation();
  const now = await api.getNow().catch(() => null);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span>{t('now.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {t('home.doing_now')}
        </h1>
        <p className="text-muted-foreground text-base">
          {t('now.desc')}
        </p>
        {now?.updatedAt && (
          <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {t('now.updated')} {new Date(now.updatedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}
          </p>
        )}
      </div>

      {/* Grid Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Learning */}
        <section className="p-8 rounded-3xl bg-card border border-border space-y-4 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('now.learning_title')}</h2>
          </div>
          <div className="pt-2 text-sm text-muted-foreground">
            <MarkdownViewer content={now?.learning || t('now.learning_default')} />
          </div>
        </section>

        {/* Building */}
        <section className="p-8 rounded-3xl bg-card border border-border space-y-4 hover:border-teal-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Hammer className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('now.building_title')}</h2>
          </div>
          <div className="pt-2 text-sm text-muted-foreground">
            <MarkdownViewer content={now?.building || t('now.building_default')} />
          </div>
        </section>

        {/* Exploring */}
        <section className="p-8 rounded-3xl bg-card border border-border space-y-4 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('now.exploring_title')}</h2>
          </div>
          <div className="pt-2 text-sm text-muted-foreground">
            <MarkdownViewer content={now?.exploring || t('now.exploring_default')} />
          </div>
        </section>

        {/* Thinking */}
        <section className="p-8 rounded-3xl bg-card border border-border space-y-4 hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('now.thinking_title')}</h2>
          </div>
          <div className="pt-2 text-sm text-muted-foreground">
            <MarkdownViewer content={now?.thinking || t('now.thinking_default')} />
          </div>
        </section>
      </div>
    </div>
  );
}
