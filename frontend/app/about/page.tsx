import React from 'react';
import { api } from '@/lib/api';
import { Timeline, SiteSetting } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { getServerTranslation } from '@/lib/i18n-server';
import { Code, Compass, Camera, Sparkles, Brain, Cpu, Lightbulb, Globe } from 'lucide-react';
import type { Metadata } from 'next';

async function getAboutData() {
  try {
    const [timelines, settings] = await Promise.all([
      api.getTimelines().catch(() => [] as Timeline[]),
      api.getSettings().catch(() => null as SiteSetting | null),
    ]);
    return { timelines, settings };
  } catch {
    return { timelines: [], settings: null };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'About Hayden Xue | Profile & Digital Garden' : '关于 Hayden Xue | 个人画像与成长轨迹',
    description: 'About Hayden Xue - Personal Introduction, Interests and Growth Timeline.',
  };
}

export const revalidate = 60;

export default async function AboutPage() {
  const { locale, t } = getServerTranslation();
  const { timelines, settings } = await getAboutData();

  // 1. 兼容解析后台配置的兴趣爱好 JSON (兼容 interestsJson 与 aboutInterests)
  let rawInterests: any[] = [];
  const interestsSource = settings?.interestsJson || settings?.aboutInterests;
  if (interestsSource) {
    try {
      rawInterests = typeof interestsSource === 'string' ? JSON.parse(interestsSource) : interestsSource;
    } catch {
      rawInterests = [];
    }
  }

  // 兴趣中英映射表（用于纯字符串标签的英文映射）
  const interestMap: Record<string, string> = {
    '系统架构设计': 'Software Architecture',
    '人工智能与智能体': 'AI & Multi-Agent Systems',
    '编程工匠精神': 'Programming Craftsmanship',
    '全球旅行探索': 'Travel & Exploration',
    '街头摄影艺术': 'Street Photography',
    '分布式系统': 'Distributed Systems',
    '开源创作': 'Open Source',
  };

  // 格式化兴趣数据
  interface InterestItem {
    icon?: string;
    label: string;
  }

  let formattedInterests: InterestItem[] = [];

  if (Array.isArray(rawInterests) && rawInterests.length > 0) {
    formattedInterests = rawInterests.map((item) => {
      if (typeof item === 'string') {
        const label = locale === 'en' ? (interestMap[item] || item) : item;
        return { icon: 'Sparkles', label };
      }
      const label = locale === 'en' 
        ? (item.label_en || item.label || interestMap[item.label_zh] || item.label_zh)
        : (item.label_zh || item.label || item.label_en);
      return { icon: item.icon || 'Sparkles', label };
    });
  }

  // 兜底默认兴趣列表
  if (formattedInterests.length === 0) {
    const defaults = [
      { icon: 'Cpu', label_zh: '系统架构设计', label_en: 'Software Architecture' },
      { icon: 'Brain', label_zh: '人工智能与智能体', label_en: 'AI & Multi-Agent Systems' },
      { icon: 'Code', label_zh: '编程工匠精神', label_en: 'Programming Craftsmanship' },
      { icon: 'Compass', label_zh: '全球旅行探索', label_en: 'Travel & Exploration' },
      { icon: 'Camera', label_zh: '街头摄影艺术', label_en: 'Street Photography' },
    ];
    formattedInterests = defaults.map((d) => ({
      icon: d.icon,
      label: locale === 'en' ? d.label_en : d.label_zh,
    }));
  }

  const getIcon = (name?: string) => {
    switch (name) {
      case 'Cpu': return <Cpu className="w-4 h-4 text-emerald-500" />;
      case 'Brain': return <Brain className="w-4 h-4 text-teal-500" />;
      case 'Code': return <Code className="w-4 h-4 text-cyan-500" />;
      case 'Compass': return <Compass className="w-4 h-4 text-indigo-500" />;
      case 'Camera': return <Camera className="w-4 h-4 text-rose-500" />;
      default: return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  // 2. 自述分支选择：英文模式优先 aboutBioEn，中文模式优先 aboutBioZh
  const renderBioContent = () => {
    if (locale === 'en') {
      if (settings?.aboutBioEn) {
        return <div className="space-y-3 whitespace-pre-line leading-relaxed">{settings.aboutBioEn}</div>;
      }
      return (
        <div className="space-y-4 leading-relaxed">
          <p>{t('about.bio_p1')}</p>
          <p>{t('about.bio_p2')}</p>
          <p>{t('about.bio_p3')}</p>
        </div>
      );
    } else {
      if (settings?.aboutBioZh) {
        return <div className="space-y-3 whitespace-pre-line leading-relaxed">{settings.aboutBioZh}</div>;
      }
      return (
        <div className="space-y-4 leading-relaxed">
          <p>{t('about.bio_p1')}</p>
          <p>{t('about.bio_p2')}</p>
          <p>{t('about.bio_p3')}</p>
        </div>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      {/* Header */}
      <section className="space-y-4">
        <span className="text-xs uppercase font-mono tracking-widest text-emerald-500 font-semibold">
          {t('about.tag')}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {t('about.title')}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed italic font-serif">
          “{settings?.slogan || (locale === 'en' ? 'From the East, toward the unknown.' : '基于东方，探索未知。')}”
        </p>
      </section>

      {/* Bio Card */}
      <section className="p-8 rounded-3xl bg-card border border-border space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <SafeImage
            src={settings?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces'}
            alt="Hayden Xue"
            aspectRatio="1/1"
            containerClassName="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-border shrink-0 shadow-md"
          />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Hayden Xue
            </h2>
            <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
              {t('about.role')}
            </p>
            <p className="text-sm text-muted-foreground">
              {locale === 'en' 
                ? (settings?.bio && settings.bio !== '我相信代码是思考的具象化，也是探索未知世界的工具。本网站是我的心智外脑与数字花园，用于记录技术探索、旅行足迹与长期成长。'
                    ? settings.bio 
                    : t('about.bio_fallback'))
                : (settings?.bio || t('about.bio_fallback'))}
            </p>
          </div>
        </div>

        {/* Detailed Bio (Dynamic by Locale) */}
        <div className="pt-4 border-t border-border space-y-4 text-sm text-muted-foreground leading-relaxed">
          {renderBioContent()}
        </div>
      </section>

      {/* Interests (Dynamic from Settings & Locale) */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('about.interests_title')}
        </h2>
        <div className="flex flex-wrap gap-3">
          {formattedInterests.map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-sm font-medium text-foreground hover:border-foreground/30 transition-colors"
            >
              {getIcon(item.icon)}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Timeline */}
      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t('about.timeline_title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('about.timeline_desc')}
          </p>
        </div>

        <div className="relative pl-6 border-l-2 border-border space-y-8 ml-2">
          {timelines.length > 0 ? (
            timelines.map((item) => (
              <div key={item.id} className="relative group">
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background bg-emerald-500 group-hover:scale-125 transition-transform" />
                
                <div className="space-y-1">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-secondary text-emerald-600 dark:text-emerald-400">
                    {item.year}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-1">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">{t('about.timeline_empty')}</div>
          )}
        </div>
      </section>
    </div>
  );
}
