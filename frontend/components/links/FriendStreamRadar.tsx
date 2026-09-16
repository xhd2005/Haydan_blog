'use client';

import React from 'react';
import { FriendActivity } from '@/lib/types';
import { Activity, Clock, ExternalLink, Sparkles, Compass, Newspaper } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import Image from 'next/image';

interface FriendStreamRadarProps {
  activities: FriendActivity[];
  loading?: boolean;
}

export function FriendStreamRadar({ activities, loading }: FriendStreamRadarProps) {
  const { locale } = useI18n();

  // 格式化相对时间
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return locale === 'en' ? 'Recently' : '近期发布';
    try {
      const date = new Date(timeStr);
      const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
      if (diffHours <= 0) return locale === 'en' ? 'Just now' : '刚刚';
      if (diffHours < 24) return locale === 'en' ? `${diffHours}h ago` : `${diffHours} 小时前`;
      const diffDays = Math.round(diffHours / 24);
      if (diffDays < 30) return locale === 'en' ? `${diffDays}d ago` : `${diffDays} 天前`;
      return date.toLocaleDateString();
    } catch {
      return locale === 'en' ? 'Recently' : '近期发布';
    }
  };

  return (
    <section className="space-y-4">
      {/* 头部标题与雷达标语 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-2xs">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground font-sans">
                {locale === 'en' ? 'Neighbor Living Radar' : '友邻动态雷达'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                <span>DISPATCH</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              {locale === 'en'
                ? 'Aggregating authentic essays and engineering notes from friends across the web.'
                : '聚合盟友独立博客近期最新发布的工程手记与思想火花，打破信息孤岛。'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>REAL-TIME STREAMING</span>
        </div>
      </div>

      {/* 动态卡片列表 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-3xl bg-white/60 dark:bg-neutral-900/40 border border-slate-200/80 dark:border-white/[0.08] animate-pulse space-y-3 h-36"
            >
              <div className="h-4 bg-slate-200 dark:bg-neutral-800 rounded w-1/3" />
              <div className="h-5 bg-slate-200 dark:bg-neutral-800 rounded w-4/5" />
              <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="rounded-3xl bg-white/60 dark:bg-neutral-900/40 border border-slate-200/80 dark:border-white/[0.08] p-6 text-center space-y-2">
          <Newspaper className="w-6 h-6 text-muted-foreground/50 mx-auto" />
          <p className="text-xs font-mono text-muted-foreground">
            {locale === 'en' ? 'No recent friend activities broadcasted.' : '暂无最新友邻广播手记，持续监听中...'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.slice(0, 6).map((act) => {
            const targetUrl = act.link || act.friendUrl || '#';
            return (
              <a
                key={act.id}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                {/* 悬停流光条 */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="space-y-2.5">
                  {/* 博友来源行 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-neutral-800 shrink-0 relative flex items-center justify-center border border-slate-200 dark:border-neutral-700">
                        {act.friendAvatar ? (
                          <img
                            src={act.friendAvatar}
                            alt={act.friendName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback
                              const target = e.currentTarget;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-[10px] font-bold font-mono text-emerald-600">
                            {act.friendName ? act.friendName.slice(0, 1) : 'F'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-foreground truncate max-w-[140px]">
                        {act.friendName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatTime(act.publishedAt)}</span>
                    </div>
                  </div>

                  {/* 文章标题 */}
                  <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors line-clamp-2 leading-snug font-sans">
                    {act.title}
                  </h3>

                  {/* 摘要片段 */}
                  {act.snippet && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                      {act.snippet}
                    </p>
                  )}
                </div>

                {/* 底部外跳引导 */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    阅读手记
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
