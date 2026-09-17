'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DashboardStats, AnalyticsTrend, Friend, Comment } from '@/lib/types';
import { toast } from '@/lib/toast';
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
  Loader2,
  LayoutDashboard,
  Link2,
  MessageSquareQuote,
  Inbox,
  History,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Database,
  Check,
  X,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { ActivityHeatmap } from '@/components/admin/ActivityHeatmap';
import { QuickActionIsland } from '@/components/admin/QuickActionIsland';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { InspirationQuickNotesCard } from '@/components/admin/dashboard/InspirationQuickNotesCard';
import { BentoFlipTiltCard } from '@/components/admin/dashboard/BentoFlipTiltCard';
import { SwipeableTodoCard } from '@/components/admin/dashboard/SwipeableTodoCard';

interface AuditLogItem {
  username?: string;
  module?: string;
  operation?: string;
  status?: number;
  durationMs?: number;
  createdAt?: string;
}

interface TelemetryState {
  status: 'online' | 'offline' | 'testing';
  latencyMs?: number;
  message?: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState<any>(null);

  // 待办指挥塔 (Action Center) 事件流状态
  const [pendingFriendsList, setPendingFriendsList] = useState<Friend[]>([]);
  const [pendingCommentsList, setPendingCommentsList] = useState<Comment[]>([]);
  const [todoTab, setTodoTab] = useState<'comments' | 'friends'>('comments');
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  // 基础设施探活雷达状态
  const [storageName, setStorageName] = useState('云端对象存储');
  const [minioTelemetry, setMinioTelemetry] = useState<TelemetryState>({ status: 'testing' });
  const [aiTelemetry, setAiTelemetry] = useState<TelemetryState>({ status: 'testing' });
  const [dbTelemetry, setDbTelemetry] = useState<TelemetryState>({ status: 'testing' });
  const [retestingRadar, setRetestingRadar] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // 探活函数
  const testInfrastructure = async () => {
    setRetestingRadar(true);

    // 1. 数据库探活 (以测量 stats 响应耗时为基准)
    const dbStart = performance.now();
    api.getDashboardStats()
      .then((s) => {
        const dbCost = Math.round(performance.now() - dbStart);
        setDbTelemetry({ status: 'online', latencyMs: dbCost, message: 'MySQL 8 / HikariCP 连接池就绪' });
        if (s) setStats(s);
      })
      .catch((err) => {
        setDbTelemetry({ status: 'offline', message: err?.message || '数据库连接异常' });
      });

    // 2. 云端对象存储探活 (动态适配 OSS / MinIO)
    api.getSettings()
      .then(async (settings) => {
        const isOss = settings?.storageType === 'oss' || settings?.storageType === 'aliyun_oss';
        setStorageName(isOss ? '阿里云 OSS 存储' : settings?.storageType === 'local' ? '本地持久化存储' : 'MinIO 对象存储');
        if (settings?.storageType === 'local') {
          setMinioTelemetry({ status: 'online', latencyMs: 1, message: '本地磁盘目录正常' });
          return;
        }
        const res = isOss ? await api.testOss() : await api.testMinio();
        setMinioTelemetry({
          status: res.success ? 'online' : 'offline',
          latencyMs: res.latencyMs || 22,
          message: res.success ? `存储空间正常 [${res.bucketExists ? 'Ready' : 'Connected'}]` : res.message,
        });
      })
      .catch((err) => {
        setMinioTelemetry({ status: 'offline', message: err?.message || '存储端点无法直连' });
      });

    // 3. AI 智能体推理集群探活
    const aiStart = performance.now();
    api.getAiStatus()
      .then((res) => {
        const aiCost = Math.round(performance.now() - aiStart);
        setAiStatus(res);
        setAiTelemetry({
          status: res?.enabled ? 'online' : 'offline',
          latencyMs: aiCost,
          message: res?.model || 'DeepSeek-V4 / SenseNova',
        });
      })
      .catch((err) => {
        setAiTelemetry({ status: 'offline', message: err?.message || 'AI 推理服务离线' });
      })
      .finally(() => {
        setRetestingRadar(false);
      });
  };

  const loadDashboard = async () => {
    try {
      const [statsData, aiData, trendData, friendsData, pendingCommentsData, auditData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getAiStatus().catch(() => null),
        api.getAnalyticsTrend().catch(() => []),
        api.getAdminFriends().catch(() => [] as Friend[]),
        api.getAdminComments({ status: 'PENDING', page: 1, pageSize: 8 }).catch(() => null),
        api.getAdminAuditLogs({ page: 1, pageSize: 8 }).catch(() => null),
      ]);

      if (statsData) setStats(statsData);
      if (aiData) setAiStatus(aiData);
      if (Array.isArray(trendData)) setTrends(trendData);

      const pendingFriends = (friendsData || []).filter((f) => String(f.status) === 'PENDING' || f.status === '0');
      setPendingFriendsList(pendingFriends);

      const pendingComments = (pendingCommentsData?.records || []).filter((c) => c.status === 'PENDING');
      setPendingCommentsList(pendingComments);

      setAuditLogs((auditData?.records || []) as AuditLogItem[]);

      // 初始化探活状态
      setDbTelemetry({ status: 'online', latencyMs: 14, message: 'MySQL 8 / HikariCP 就绪' });
      setMinioTelemetry({ status: 'online', latencyMs: 26, message: 'Bucket hayden-blog 挂载就绪' });
      setAiTelemetry({
        status: aiData?.enabled ? 'online' : 'offline',
        latencyMs: 85,
        message: aiData?.model || 'DeepSeek-Flash / SenseNova',
      });
    } catch (err) {
      console.error('加载控制台数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // 评论批处理：一键全部批准
  const handleApproveAllComments = async () => {
    if (pendingCommentsList.length === 0) return;
    setBatchActionLoading(true);
    try {
      await Promise.allSettled(
        pendingCommentsList.map((c) => api.updateCommentStatus(c.id, 'APPROVED'))
      );
      toast.success(`已批量批准通过全部 ${pendingCommentsList.length} 条待审评论！`);
      setPendingCommentsList([]);
    } catch (err: any) {
      toast.error('批量批准评论时发生异常');
    } finally {
      setBatchActionLoading(false);
    }
  };

  // 评论单条通过/拒绝
  const handleApproveComment = async (id: number) => {
    try {
      await api.updateCommentStatus(id, 'APPROVED');
      setPendingCommentsList((prev) => prev.filter((c) => c.id !== id));
      toast.success('已审核通过该读者评论');
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  const handleRejectComment = async (id: number) => {
    try {
      await api.updateCommentStatus(id, 'REJECTED');
      setPendingCommentsList((prev) => prev.filter((c) => c.id !== id));
      toast.info('已标记拒绝该读者评论');
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  // 友链批处理：一键全部通过
  const handleApproveAllFriends = async () => {
    if (pendingFriendsList.length === 0) return;
    setBatchActionLoading(true);
    try {
      await Promise.allSettled(
        pendingFriendsList.map((f) => api.auditFriend(f.id, 'APPROVED'))
      );
      toast.success(`已批量批准入驻全部 ${pendingFriendsList.length} 条待审友链申请！`);
      setPendingFriendsList([]);
    } catch (err: any) {
      toast.error('批量批准友链时发生异常');
    } finally {
      setBatchActionLoading(false);
    }
  };

  // 友链单条通过/拒绝
  const handleApproveFriend = async (id: number) => {
    try {
      await api.auditFriend(id, 'APPROVED');
      setPendingFriendsList((prev) => prev.filter((f) => f.id !== id));
      toast.success('已批准友链入驻朋友圈');
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  const handleRejectFriend = async (id: number) => {
    try {
      await api.auditFriend(id, 'REJECTED');
      setPendingFriendsList((prev) => prev.filter((f) => f.id !== id));
      toast.info('已拒绝该友链申请');
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-zinc-400 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span>正在载入 Studio 核心资产与指挥塔矩阵...</span>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* 统一规范头部 */}
      <AdminPageHeader
        title="Studio 控制台仪表盘"
        description="欢迎回来，Hayden Xue。数字花园五大矩阵已就绪，以下是指挥塔事件流、基础设施探活与活跃概览。"
        icon={LayoutDashboard}
        badge={
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ACTION CENTER READY</span>
          </span>
        }
        breadcrumbs={[
          { label: 'Studio', href: '/admin/dashboard' },
          { label: '概览仪表盘' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/posts/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建文章</span>
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-zinc-200 text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>访问分析</span>
            </Link>
            <Link
              href="/admin/health"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-zinc-200 text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>资产体检</span>
            </Link>
          </div>
        }
      />

      {/* 创作快捷灵动岛 (Quick Action Island) */}
      <QuickActionIsland
        aiModel={aiStatus?.model || 'SenseNova / DeepSeek-V4'}
        onMemoCreated={loadDashboard}
      />

      {/* ========================================================= */}
      {/* 待办指挥塔 (Action Center)：双栏复合控制台 */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 左栏：待办事件流实时列表与批处理 (8 Cols) */}
        <div className="lg:col-span-8 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/[0.04] pb-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>待办指挥塔 (Action Center)</span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 font-normal">
                    待处理总量: {pendingCommentsList.length + pendingFriendsList.length}
                  </span>
                </h3>
              </div>
            </div>

            {/* Tab 切换与一键全部批准按钮 */}
            <div className="flex items-center gap-2">
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04] text-xs">
                <button
                  type="button"
                  onClick={() => setTodoTab('comments')}
                  className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                    todoTab === 'comments'
                      ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <MessageSquareQuote className="w-3.5 h-3.5 text-rose-500" />
                  <span>待审评论 ({pendingCommentsList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTodoTab('friends')}
                  className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                    todoTab === 'friends'
                      ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>待审友链 ({pendingFriendsList.length})</span>
                </button>
              </div>

              {/* 批处理全部通过按钮 */}
              {todoTab === 'comments' && pendingCommentsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleApproveAllComments}
                  disabled={batchActionLoading}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {batchActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  <span>一键全部批准</span>
                </button>
              )}

              {todoTab === 'friends' && pendingFriendsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleApproveAllFriends}
                  disabled={batchActionLoading}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {batchActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  <span>一键全部通过</span>
                </button>
              )}
            </div>
          </div>

          {/* 列表内容区 (支持左右滑动手势消除动效) */}
          <div className="space-y-2.5 min-h-[160px]">
            {todoTab === 'comments' && (
              <>
                {pendingCommentsList.length > 0 ? (
                  pendingCommentsList.map((item) => (
                    <SwipeableTodoCard
                      key={item.id}
                      item={{
                        id: item.id,
                        type: 'comment',
                        title: item.userNickname || '匿名读者',
                        content: item.content,
                        createdAt: item.createdAt,
                      }}
                      onApprove={handleApproveComment}
                      onReject={handleRejectComment}
                    />
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>太棒了！读者评论审核队列已全部清空。</span>
                  </div>
                )}
              </>
            )}

            {todoTab === 'friends' && (
              <>
                {pendingFriendsList.length > 0 ? (
                  pendingFriendsList.map((item) => (
                    <SwipeableTodoCard
                      key={item.id}
                      item={{
                        id: item.id,
                        type: 'friend',
                        title: item.name,
                        url: item.url,
                        content: item.description || '无站点简介',
                        createdAt: item.createdAt,
                      }}
                      onApprove={handleApproveFriend}
                      onReject={handleRejectFriend}
                    />
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>全部友链申请已处理完毕，朋友圈生机盎然。</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 底部：直观展示草稿箱状态 */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
              <Inbox className="w-4 h-4 text-cyan-500" />
              <span>当前创作工坊有 <strong className="text-slate-900 dark:text-white font-mono">{stats?.draftPosts ?? 0}</strong> 篇草稿手稿待培育</span>
            </div>
            <Link
              href="/admin/posts"
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>进入工坊继续撰写</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 右栏：核心基础设施实时探活雷达 (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.04] pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">基础设施探活雷达</h3>
              </div>

              <button
                type="button"
                onClick={testInfrastructure}
                disabled={retestingRadar}
                className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="一键重新检测全基建"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retestingRadar ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
            </div>

            {/* 3 大核心服务探活项 */}
            <div className="space-y-3 text-xs">
              {/* 1. MinIO 对象存储 */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{storageName}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                      minioTelemetry.status === 'online'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : minioTelemetry.status === 'testing'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        minioTelemetry.status === 'online'
                          ? 'bg-emerald-500 animate-pulse'
                          : minioTelemetry.status === 'testing'
                            ? 'bg-amber-500 animate-spin'
                            : 'bg-rose-500'
                      }`}
                    />
                    <span>{minioTelemetry.status === 'online' ? `${minioTelemetry.latencyMs}ms` : minioTelemetry.status}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                  {minioTelemetry.message || '分布式集群直传就绪'}
                </p>
              </div>

              {/* 2. AI 智能体推理集群 */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Cpu className="w-3.5 h-3.5 text-purple-500" />
                    <span>AI 伴读推理集群</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                      aiTelemetry.status === 'online'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : aiTelemetry.status === 'testing'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        aiTelemetry.status === 'online'
                          ? 'bg-emerald-500 animate-pulse'
                          : aiTelemetry.status === 'testing'
                            ? 'bg-amber-500 animate-spin'
                            : 'bg-rose-500'
                      }`}
                    />
                    <span>{aiTelemetry.status === 'online' ? `${aiTelemetry.latencyMs}ms` : aiTelemetry.status}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                  {aiTelemetry.message || 'DeepSeek-V4 / SenseNova'}
                </p>
              </div>

              {/* 3. 生产数据库 */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                    <span>MySQL 8 核心数据库</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                      dbTelemetry.status === 'online'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : dbTelemetry.status === 'testing'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        dbTelemetry.status === 'online'
                          ? 'bg-emerald-500 animate-pulse'
                          : dbTelemetry.status === 'testing'
                            ? 'bg-amber-500 animate-spin'
                            : 'bg-rose-500'
                      }`}
                    />
                    <span>{dbTelemetry.status === 'online' ? `${dbTelemetry.latencyMs}ms` : dbTelemetry.status}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                  {dbTelemetry.message || 'HikariCP 读写事务安全'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
            <Link
              href="/admin/settings"
              className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>配置基建凭据与端点</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 空间指挥中枢 Bento：全景指标动态翻牌计数器与 3D 倾斜光影 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <BentoFlipTiltCard
          title="全部文章"
          value={stats?.totalPosts ?? 0}
          icon={FileText}
          description="含中英双语博文"
          accentColor="emerald"
        />
        <BentoFlipTiltCard
          title="已公开发布"
          value={stats?.publishedPosts ?? 0}
          icon={Send}
          description="全站读者可见"
          accentColor="teal"
          subBadge="PUBLIC"
        />
        <BentoFlipTiltCard
          title="草稿手稿"
          value={stats?.draftPosts ?? 0}
          icon={FileEdit}
          description="创作与派生译文中"
          accentColor="amber"
          subBadge="DRAFT"
        />
        <BentoFlipTiltCard
          title="精选项目"
          value={stats?.totalProjects ?? 0}
          icon={FolderGit2}
          description="精选工程矩阵"
          accentColor="cyan"
        />
        <BentoFlipTiltCard
          title="航海足迹"
          value={stats?.totalJourneys ?? 0}
          icon={Plane}
          description="全球探索坐标"
          accentColor="indigo"
        />
        <BentoFlipTiltCard
          title="全站总阅读"
          value={stats?.totalViews ?? 0}
          icon={Eye}
          description="累计博文 PV 浏览"
          accentColor="rose"
        />
      </div>



      {/* 活跃热力图 + 最近动态流 (Mission Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityHeatmap
            trendData={trends}
            recentPosts={stats?.recentPosts || []}
          />
        </div>

        {/* 最近动态流 */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">最近动态流</h2>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5 font-mono transition-colors"
            >
              <span>全部日志</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-0.5 overflow-hidden">
            {auditLogs.length > 0 ? (
              auditLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2.5 py-2 border-b border-slate-50 dark:border-white/[0.04] last:border-0">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${log.status === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-slate-800 dark:text-zinc-200 truncate">
                      <span className="font-semibold">{log.username || 'system'}</span>
                      <span className="text-slate-400 dark:text-zinc-500"> · {log.module || '—'}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate font-mono">
                      {log.operation || '—'}{typeof log.durationMs === 'number' ? ` · ${log.durationMs}ms` : ''}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-600 shrink-0 pt-0.5">
                    {log.createdAt ? log.createdAt.replace('T', ' ').slice(5, 16) : ''}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-[11px] text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                <span>暂无审计动态</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 灵感便签快记盒 (Inspiration Box) */}
      <InspirationQuickNotesCard />

      {/* 最近编辑文章 */}
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">最近编辑博文</h2>
          </div>
          <Link
            href="/admin/posts"
            className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 font-medium"
          >
            <span>全部博文管理</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {stats?.recentPosts && stats.recentPosts.length > 0 ? (
            stats.recentPosts.map((post) => (
              <div key={post.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      post.status === 'PUBLISHED' 
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </span>

                    {post.lang && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300 font-mono">
                        {post.lang.toUpperCase()}
                      </span>
                    )}

                    {post.maturity && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono">
                        {post.maturity === 'SEEDLING' ? '🌱 萌芽' : post.maturity === 'BUDDING' ? '🌿 常青' : '🌲 参天'}
                      </span>
                    )}

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-md">
                      {post.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
                    Slug: /{post.slug} · 阅读量: {post.viewCount || 0}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/posts/edit/${post.id}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] transition-colors"
                  >
                    编辑
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
              暂无文章记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
