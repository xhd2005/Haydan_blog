'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AnalyticsOverview, AnalyticsTrend, AnalyticsTopPost, AnalyticsSource } from '@/lib/types';
import { toast } from '@/lib/toast';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  FileText, 
  MessageSquare, 
  Globe2, 
  Flame, 
  RotateCw, 
  ArrowUpRight,
  Loader2,
  Calendar
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trend, setTrend] = useState<AnalyticsTrend[]>([]);
  const [topPosts, setTopPosts] = useState<AnalyticsTopPost[]>([]);
  const [sources, setSources] = useState<AnalyticsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [ov, tr, tp, sc] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAnalyticsTrend(),
        api.getAnalyticsTopPosts(),
        api.getAnalyticsSources(),
      ]);
      setOverview(ov);
      setTrend(tr);
      setTopPosts(tp);
      setSources(sc);
      if (isManual) toast.success('数据看板已刷新');
    } catch (err: any) {
      toast.error(err.message || '加载分析数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 计算最大 PV 以便绘制相对高度的柱状图
  const maxPv = Math.max(...trend.map((t) => t.pv || 0), 20);

  // 计算流量来源总计数
  const totalSourceVisits = sources.reduce((acc, cur) => acc + cur.count, 0) || 1;

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-sm text-muted-foreground">正在统计并生成流量与访问分析报表...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-xs">
      {/* 统一规范头部 */}
      <AdminPageHeader
        title="数据分析与流量看板 (Analytics & Insights)"
        description="全站真实 PV/UV 流量监控、7 天访客趋势、热门文章排行与外部引流渠道画像。"
        icon={BarChart3}
        breadcrumbs={[
          { label: 'Studio', href: '/admin/dashboard' },
          { label: '概览仪表盘', href: '/admin/dashboard' },
          { label: '访问分析' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>刷新数据</span>
          </button>
        }
      />

      {/* Overview Stat Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span>全站总浏览量 (PV)</span>
              <Eye className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-foreground font-mono">{overview.totalPv}</div>
            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">今日 +{overview.todayPv}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span>全站独立访客 (UV)</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-foreground font-mono">{overview.totalUv}</div>
            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-blue-500 font-semibold">今日 +{overview.todayUv}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span>今日访问 (Today PV)</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-foreground font-mono">{overview.todayPv}</div>
            <div className="text-[10px] text-muted-foreground mt-1">当日实时访问流水</div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span>今日独立用户 (UV)</span>
              <Users className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-xl font-bold text-foreground font-mono">{overview.todayUv}</div>
            <div className="text-[10px] text-muted-foreground mt-1">当日去重客户端 IP</div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span>已发布文章</span>
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-foreground font-mono">{overview.totalPosts}</div>
            <div className="text-[10px] text-muted-foreground mt-1">公开长文库总数</div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span>全站互动留言</span>
              <MessageSquare className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-foreground font-mono">{overview.totalComments}</div>
            <div className="text-[10px] text-muted-foreground mt-1">读者反馈与站长回复</div>
          </div>
        </div>
      )}

      {/* 7-Day Trend Chart */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>近 7 天流量访问趋势 (PV / UV 对比)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-muted-foreground">PV (浏览量)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
              <span className="text-muted-foreground">UV (独立访客)</span>
            </span>
          </div>
        </div>

        {/* CSS Bar Chart */}
        <div className="pt-6 pb-2">
          <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 border-b border-border/80 px-2 sm:px-6">
            {trend.map((item, idx) => {
              const pvHeight = Math.max(12, Math.round((item.pv / maxPv) * 100));
              const uvHeight = Math.max(8, Math.round((item.uv / maxPv) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono bg-popover text-popover-foreground border border-border px-2 py-1 rounded shadow-md pointer-events-none mb-1 text-center whitespace-nowrap">
                    PV: {item.pv} | UV: {item.uv}
                  </div>

                  {/* Dual Bar */}
                  <div className="w-full max-w-[48px] flex items-end justify-center gap-1 h-full">
                    {/* PV bar */}
                    <div 
                      className="w-1/2 bg-emerald-500/85 hover:bg-emerald-500 rounded-t-md transition-all duration-300" 
                      style={{ height: `${pvHeight}%` }}
                    />
                    {/* UV bar */}
                    <div 
                      className="w-1/2 bg-blue-500/85 hover:bg-blue-500 rounded-t-md transition-all duration-300" 
                      style={{ height: `${uvHeight}%` }}
                    />
                  </div>

                  {/* Date Label */}
                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap pt-2">
                    {item.visit_date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Columns: Hot Posts & Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Posts Leaderboard */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>最受欢迎热门文章 Top 5</span>
          </div>

          <div className="space-y-2.5">
            {topPosts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">暂无文章阅读数据</p>
            ) : (
              topPosts.map((post, idx) => (
                <div 
                  key={post.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                      idx === 0 
                        ? 'bg-amber-500 text-white' 
                        : idx === 1 
                        ? 'bg-slate-400 text-white' 
                        : idx === 2 
                        ? 'bg-amber-700 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="font-medium text-foreground hover:text-primary transition-colors truncate"
                      title={post.title}
                    >
                      {post.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-muted-foreground text-[11px]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-500" />
                      {post.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Traffic Sources Breakdown */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Globe2 className="w-4 h-4 text-blue-500" />
              <span>流量来源画像 (Traffic Sources)</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              100% 真实引流数据
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {sources.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Globe2 className="w-8 h-8 text-slate-300 dark:text-neutral-700 animate-pulse" />
                <span className="text-xs font-medium">暂无外部引流数据</span>
                <p className="text-[11px] max-w-xs text-slate-400 dark:text-zinc-500">
                  当有访客通过 Google、GitHub、知乎或外部链接访问您的博文时，引流来源与精准占比将在此实时自动生成。
                </p>
              </div>
            ) : (
              sources.map((item, idx) => {
                const percent = Math.round((item.count / totalSourceVisits) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-foreground">{item.source}</span>
                      <span className="font-mono text-muted-foreground">
                        {item.count} 次 ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-purple-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
