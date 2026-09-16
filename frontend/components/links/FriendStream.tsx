'use client';

import React from 'react';
import { FriendActivity } from '@/lib/types';
import { Activity, Clock, ExternalLink, Sparkles, Inbox } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface FriendStreamProps {
  activities: FriendActivity[];
  loading?: boolean;
}

export function FriendStream({ activities, loading }: FriendStreamProps) {
  const { locale } = useI18n();

  return (
    <section className="space-y-4">
      {/* 动态流标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {locale === 'zh' ? '友邻最新动态流' : 'Neighbor Activity Stream'}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {locale === 'zh'
                ? '汇聚友邻独立博客最新发布的思想火花与工程手记'
                : 'Aggregating recent publications from the indie blogosphere.'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-3 h-3" />
          <span>LIVING DISPATCH</span>
        </div>
      </div>

      {/* 动态流列表或空状态 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-3xl bg-card border border-border/60 animate-pulse space-y-3 h-36"
            >
              <div className="h-3 bg-secondary rounded w-1/3" />
              <div className="h-4 bg-secondary rounded w-4/5" />
              <div className="h-3 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activities.slice(0, 6).map((act) => (
            <a
              key={act.id}
              href={act.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span className="font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate max-w-[130px]">
                    {act.friendName}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] shrink-0 opacity-80">
                    <Clock className="w-3 h-3" />
                    {act.publishedAt}
                  </span>
                </div>

                <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 group-hover:text-emerald-500 transition-colors leading-snug">
                  {act.title}
                </h3>

                {act.snippet && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {act.snippet}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end text-[11px] font-mono text-muted-foreground group-hover:text-emerald-500 transition-colors">
                <span>{locale === 'zh' ? '阅读原文' : 'Read Article'}</span>
                <ExternalLink className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        /* 空状态占位 (满足 TC-T2-F10-05: 静候友邻新知) */
        <div className="p-10 rounded-3xl bg-secondary/30 border border-border/60 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
            <Inbox className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              {locale === 'zh' ? '静候友邻新知' : 'Waiting for Neighbor Updates'}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              {locale === 'zh'
                ? '暂无最新聚合动态，探活雷达正持续监听友邻的最新博客与手记。'
                : 'Radar is continuously monitoring for recent RSS updates from our friends.'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
