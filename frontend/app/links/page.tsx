import React from 'react';
import { api } from '@/lib/api';
import { Friend } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { getServerTranslation } from '@/lib/i18n-server';
import { ExternalLink, Users, Sparkles, Heart } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'Friends & Links | Hayden Xue' : '友链朋友圈 | Hayden Xue',
    description: 'Walking with creators, tech writers, and curious minds across the open web.',
  };
}

export const revalidate = 60;

export default async function LinksPage() {
  const { locale, t } = getServerTranslation();
  const friends = await api.getFriends().catch(() => [] as Friend[]);

  const categories = Array.from(new Set(friends.map((f) => f.category || 'Blog')));

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      {/* Header */}
      <div className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Users className="w-3.5 h-3.5" />
          <span>{t('links.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {t('links.title')}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
          {t('links.desc')}
        </p>
      </div>

      {/* Friends Group by Category */}
      {friends.length > 0 ? (
        categories.map((cat) => {
          const groupFriends = friends.filter((f) => (f.category || 'Blog') === cat);
          return (
            <section key={cat} className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <span className="text-xs uppercase font-mono tracking-widest text-emerald-500 font-semibold">
                  {t('links.category')}
                </span>
                <h2 className="text-xl font-bold text-foreground">{cat}</h2>
                <span className="text-xs font-mono text-muted-foreground ml-auto">
                  {groupFriends.length} {t('links.count')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {groupFriends.map((friend) => (
                  <a
                    key={friend.id}
                    href={friend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-5 rounded-3xl bg-card border border-border hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 flex items-start gap-4"
                  >
                    <SafeImage
                      src={friend.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'}
                      alt={friend.name}
                      aspectRatio="1/1"
                      containerClassName="w-12 h-12 rounded-2xl overflow-hidden bg-secondary border border-border shrink-0"
                      className="group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-sm text-foreground group-hover:text-emerald-500 transition-colors truncate">
                          {friend.name}
                        </h3>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {friend.description || t('links.default_desc')}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <div className="py-20 text-center text-xs text-muted-foreground border border-dashed border-border rounded-3xl">
          {t('links.empty')}
        </div>
      )}

      {/* Exchange links card */}
      <div className="p-8 rounded-3xl bg-secondary/40 border border-border text-xs space-y-3">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <span>{t('links.exchange_title')}</span>
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {t('links.exchange_desc')}
        </p>
        <div className="p-3 rounded-2xl bg-card border border-border font-mono text-[11px] text-muted-foreground space-y-1">
          <div><span className="text-foreground font-semibold">{t('links.site_name_label')}</span> Hayden Xue Personal Blog</div>
          <div><span className="text-foreground font-semibold">{t('links.slogan_label')}</span> From the East, toward the unknown.</div>
          <div><span className="text-foreground font-semibold">{t('links.url_label')}</span> https://haydenxue.com</div>
        </div>
      </div>
    </div>
  );
}
