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
  Calendar,
  Sparkles,
  ShieldCheck,
  Target,
  Layers
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DualAxisFinanceChart } from '@/components/admin/analytics/DualAxisFinanceChart';
import { ClientDeviceBreakdownCard } from '@/components/admin/analytics/ClientDeviceBreakdownCard';
import { VisitorMaskedDetailTable } from '@/components/admin/analytics/VisitorMaskedDetailTable';

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
      if (isManual) toast.success('数据分析看板已同步最新流水！');
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

  // 计算流量来源总计数
  const totalSourceVisits = sources.reduce((acc, cur) => acc + cur.count, 0) || 1;

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-zinc-400 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span>正在汇总全网访客足迹、多维雷达与深度漏斗报表...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-7 text-xs">
      {/* 统一规范头部 */}
      <AdminPageHeader
        title="深度数据分析与流量看板 (Analytics Tower)"
        description="全站真实 PV/UV 流量监控、Apple 财务级双轴图表、阅读深度完读漏斗、读者互动转化雷达与访客脱敏流水。"
        icon={BarChart3}
        badge={
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ANALYTICS ENGINE ONLINE</span>
          </span>
        }
        breadcrumbs={[
          { label: 'Studio', href: '/admin/dashboard' },
          { label: '概览仪表盘', href: '/admin/dashboard' },
          { label: '深度分析看板' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-zinc-200 font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
            <span>刷新分析报表</span>
          </button>
        }
      />

      {/* 概览指标六联卡片 (VisionOS 微晶磨砂质感) */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/[0.16] transition-all space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-medium">全站总浏览量</span>
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {overview.totalPv.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">今日 +{overview.todayPv}</span>
              <span>PV</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/[0.16] transition-all space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-medium">全站独立访客</span>
              <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {overview.totalUv.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-1">
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">今日 +{overview.todayUv}</span>
              <span>UV</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/[0.16] transition-all space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-medium">今日实时访问</span>
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono tracking-tight">
              {overview.todayPv.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              当日实时请求流水
            </div>
          </div>

          <div className="p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/[0.16] transition-all space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-medium">今日去重 IP</span>
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {overview.todayUv.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              去重独立客户端
            </div>
          </div>

          <div className="p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/[0.16] transition-all space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-medium">已发布文章</span>
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {overview.totalPosts}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              公开长文知识库
            </div>
          </div>

          <div className="p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/[0.16] transition-all space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-medium">全站互动留言</span>
              <MessageSquare className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tight">
              {overview.totalComments}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              读者反馈与探讨
            </div>
          </div>
        </div>
      )}

      {/* 1. Apple 财务级双轴分析图表 (含时间滑块胶囊 7d / 30d / realtime) */}
      <DualAxisFinanceChart initialTrend={trend} />

      {/* 2. 核心分析矩阵：最受欢迎热门文章 Top 10 + 客户端终端与系统画像 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最受欢迎热门文章 Top 10 */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>最受欢迎热门文章 Top 10</span>
            </div>
            <Link
              href="/admin/posts"
              className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-mono flex items-center gap-1"
            >
              <span>查看全部文章</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {topPosts.length === 0 ? (
              <p className="text-center py-12 text-slate-400 dark:text-zinc-500">暂无文章阅读数据</p>
            ) : (
              topPosts.map((post, idx) => (
                <div 
                  key={post.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-black/30 hover:bg-slate-100 dark:hover:bg-neutral-800/50 border border-slate-200/60 dark:border-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                      idx === 0 
                        ? 'bg-amber-500 text-white shadow-xs' 
                        : idx === 1 
                        ? 'bg-slate-400 text-white' 
                        : idx === 2 
                        ? 'bg-amber-700 text-white' 
                        : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-zinc-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="font-medium text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate text-xs"
                      title={post.title}
                    >
                      {post.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-slate-500 dark:text-zinc-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      <strong className="text-slate-800 dark:text-zinc-200">{post.viewCount || 0}</strong>
                    </span>
                    <Link
                      href={`/admin/posts/edit/${post.id}`}
                      className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors"
                      title="编辑博文"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 流量渠道画像 (Traffic Sources) */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Globe2 className="w-4 h-4 text-cyan-500" />
              <span>流量来源渠道画像 (Traffic Sources)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase">
              100% 真实引流画像
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {sources.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
                <Globe2 className="w-8 h-8 text-slate-300 dark:text-neutral-700 animate-pulse" />
                <span className="text-xs font-medium">暂无外部引流数据</span>
                <p className="text-[11px] max-w-xs text-slate-400 dark:text-zinc-500">
                  当有读者通过 Google、GitHub、知乎或外部链接访问博文时，引流来源与精准占比将在此实时自动生成。
                </p>
              </div>
            ) : (
              sources.map((item, idx) => {
                const percent = Math.round((item.count / totalSourceVisits) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-800 dark:text-zinc-200">{item.source}</span>
                      <span className="font-mono text-slate-500 dark:text-zinc-400">
                        {item.count} 次 ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-black/40 overflow-hidden border border-slate-200/60 dark:border-white/[0.04]">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-cyan-500' : idx === 2 ? 'bg-purple-500' : 'bg-amber-500'
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

      {/* 3. 客户端终端与操作系统画像 (100% 真实请求流水解析) */}
      <ClientDeviceBreakdownCard sources={sources} totalPv={overview?.totalPv} />

      {/* 4. 访客明细严格末位掩码脱敏表格 (VisitorMaskedDetailTable) */}
      <VisitorMaskedDetailTable />
    </div>
  );
}
