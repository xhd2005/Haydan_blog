'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { 
  FileText, 
  Send, 
  FileEdit, 
  FolderGit2, 
  Plane, 
  Eye, 
  Plus, 
  ArrowRight,
  Sparkles,
  BarChart3,
  Cpu,
  ShieldCheck,
  Compass,
  Users,
  MessageSquareQuote,
  Loader2
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, aiData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getAiStatus().catch(() => null),
      ]);
      if (statsData) setStats(statsData);
      if (aiData) setAiStatus(aiData);
    } catch (err) {
      console.error('加载控制台数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-xs font-mono">正在载入 Studio 核心资产与系统指标...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 顶部欢迎横幅 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Studio 控制台仪表盘
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              LIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            欢迎回来，Hayden。系统五大职能矩阵已就绪，以下是数字花园核心资产与访问概览。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/posts/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建文章</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-xs font-medium border border-white/[0.08] transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
            <span>访问分析</span>
          </Link>
          <Link
            href="/admin/memos"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-xs font-medium border border-white/[0.08] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>随记工坊</span>
          </Link>
        </div>
      </div>

      {/* 核心指标 Bento 网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">全部文章</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.totalPosts ?? 0}
          </div>
          <p className="text-[10px] text-zinc-400 font-mono">
            含中英双语博文
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">已公开发布</span>
            <Send className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-400 tracking-tight">
            {stats?.publishedPosts ?? 0}
          </div>
          <p className="text-[10px] text-zinc-400 font-mono">
            全站读者可见
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">草稿箱</span>
            <FileEdit className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {stats?.draftPosts ?? 0}
          </div>
          <p className="text-[10px] text-zinc-400 font-mono">
            创作与派生译文中
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">开源项目</span>
            <FolderGit2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.totalProjects ?? 0}
          </div>
          <p className="text-[10px] text-zinc-400 font-mono">
            精选工程矩阵
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">航海足迹</span>
            <Plane className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.totalJourneys ?? 0}
          </div>
          <p className="text-[10px] text-zinc-400 font-mono">
            全球探索坐标
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">全站总阅读</span>
            <Eye className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">
            {stats?.totalViews ?? 0}
          </div>
          <p className="text-[10px] text-zinc-400 font-mono">
            累计博文 PV 浏览
          </p>
        </div>
      </div>

      {/* AI 智能体与系统健康状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">AI 伴读智能体</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              模型：{aiStatus?.model || 'SenseNova / DeepSeek-V4'}
            </p>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            aiStatus?.configured
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {aiStatus?.configured ? 'Online · 正常推理' : 'Standby · 待配密钥'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-white">安全与攻防体系</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              IP 限流防护 · 隐秘暗门 · 角色鉴权
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Active Guard
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-white">知识花园状态</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              🌱 萌芽 · 🌿 常青 · 🌲 参天 认知矩阵
            </p>
          </div>
          <Link
            href="/admin/posts"
            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
          >
            <span>进入工坊</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 最近文章列表 */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">最近编辑文章</h2>
          </div>
          <Link
            href="/admin/posts"
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
          >
            <span>全部博文管理</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {stats?.recentPosts && stats.recentPosts.length > 0 ? (
            stats.recentPosts.map((post) => (
              <div key={post.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      post.status === 'PUBLISHED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {post.status}
                    </span>

                    {post.lang && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300 font-mono">
                        {post.lang.toUpperCase()}
                      </span>
                    )}

                    {post.maturity && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                        {post.maturity === 'SEEDLING' ? '🌱 萌芽' : post.maturity === 'BUDDING' ? '🌿 常青' : '🌲 参天'}
                      </span>
                    )}

                    <h3 className="text-sm font-medium text-white truncate max-w-md">
                      {post.title}
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-400 font-mono">
                    Slug: /{post.slug} · 阅读量: {post.viewCount || 0}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/posts/edit/${post.id}`}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-white border border-white/[0.08] transition-colors"
                  >
                    编辑
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              暂无文章记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
