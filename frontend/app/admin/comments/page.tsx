'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Comment, PageResult } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import {
  MessageSquare,
  Trash2,
  CheckCircle,
  EyeOff,
  Loader2,
  Calendar,
  Shield,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  X,
  Ban,
  AlertCircle
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { triggerRevalidate } from '@/components/admin/revalidate';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // 搜索与多选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res: PageResult<Comment> = await api.getAdminComments({
        page,
        pageSize,
        status: statusFilter,
      });
      setComments(res.records || []);
      setTotal(res.total || 0);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '获取评论列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [page, statusFilter]);

  // 本地根据关键词搜索过滤
  const filteredComments = useMemo(() => {
    if (!searchKeyword.trim()) return comments;
    const kw = searchKeyword.trim().toLowerCase();
    return comments.filter((c) => {
      const contentMatch = c.content?.toLowerCase().includes(kw);
      const userMatch = c.userNickname?.toLowerCase().includes(kw);
      const targetMatch = String(c.targetId).includes(kw);
      return contentMatch || userMatch || targetMatch;
    });
  }, [comments, searchKeyword]);

  // 全选/反选当前页展示的评论
  const isAllSelected = filteredComments.length > 0 && filteredComments.every((c) => selectedIds.has(c.id));
  const isSomeSelected = filteredComments.some((c) => selectedIds.has(c.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredComments.forEach((c) => next.add(c.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // 单条更新状态
  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateCommentStatus(id, status);
      setComments(comments.map((c) => (c.id === id ? { ...c, status } : c)));
      toast.success(status === 'APPROVED' ? '评论已审核通过并公开' : status === 'PENDING' ? '已转入待审核' : '评论已屏蔽');
      triggerRevalidate(['/blog']);
    } catch (err: any) {
      toast.error(err.message || '更新状态失败');
    }
  };

  // 单条彻底删除
  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal({
      title: '删除评论确认',
      message: '确定彻底删除该条评论吗？此操作不可撤销。',
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteComment(id);
      setComments(comments.filter((c) => c.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('评论已彻底删除');
      triggerRevalidate(['/blog']);
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  // 批量更新状态
  const handleBatchUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    const ids = Array.from(selectedIds);
    const statusText = status === 'APPROVED' ? '审核通过' : status === 'PENDING' ? '转待审核' : '屏蔽';

    try {
      const results = await Promise.allSettled(
        ids.map((id) => api.updateCommentStatus(id, status))
      );
      const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
      
      setComments((prev) =>
        prev.map((c) => (selectedIds.has(c.id) ? { ...c, status } : c))
      );
      setSelectedIds(new Set());
      toast.success(`已批量将 ${fulfilledCount} 条评论${statusText}`);
      triggerRevalidate(['/blog']);
    } catch (err: any) {
      toast.error(err.message || '批量操作失败');
    } finally {
      setBatchLoading(false);
    }
  };

  // 批量彻底删除 (严格遵从 Rule 6 破坏性批处理防误触红线)
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = await confirmModal({
      title: '批量删除评论确认',
      message: `确定要彻底删除选中的 ${selectedIds.size} 条评论吗？此操作将物理删除数据且无法恢复。`,
      confirmText: '确认批量删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    setBatchLoading(true);
    const ids = Array.from(selectedIds);

    try {
      const results = await Promise.allSettled(
        ids.map((id) => api.deleteComment(id))
      );
      const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;

      setComments((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setTotal((prev) => Math.max(0, prev - fulfilledCount));
      setSelectedIds(new Set());
      toast.success(`成功批量删除 ${fulfilledCount} 条评论`);
      triggerRevalidate(['/blog']);
    } catch (err: any) {
      toast.error(err.message || '批量删除失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="w-full space-y-5 text-xs">
      <AdminPageHeader
        title="读者互动评论管理"
        description="审查和管理博客文章与足迹下的读者留言，支持多选批量审核、关键词检索、屏蔽与彻底清理"
        icon={MessageSquare}
        badgeText={`${total} 条评论`}
        breadcrumbs={[
          { label: 'Studio 控制台', href: '/admin/dashboard' },
          { label: '互动评论' }
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索评论内容、读者昵称..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground w-48 sm:w-56 transition-all"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 状态过滤选项卡 */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
              <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
              <button
                onClick={() => {
                  setStatusFilter(undefined);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors text-xs cursor-pointer ${
                  statusFilter === undefined
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                全部 ({total})
              </button>
              <button
                onClick={() => {
                  setStatusFilter('APPROVED');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors text-xs cursor-pointer ${
                  statusFilter === 'APPROVED'
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                已公开
              </button>
              <button
                onClick={() => {
                  setStatusFilter('PENDING');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors text-xs cursor-pointer ${
                  statusFilter === 'PENDING'
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                待审核
              </button>
              <button
                onClick={() => {
                  setStatusFilter('SPAM');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors text-xs cursor-pointer ${
                  statusFilter === 'SPAM'
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                已屏蔽
              </button>
            </div>
          </div>
        }
      />

      {/* Table Card */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>加载评论数据中...</span>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-6 h-6 opacity-40" />
            <span>{searchKeyword ? '未检索到匹配的评论内容' : '暂无相关评论数据'}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="rounded border-border text-foreground focus:ring-0 cursor-pointer"
                      title="全选/反选本页"
                    />
                  </th>
                  <th className="pb-3 font-medium">评论者</th>
                  <th className="pb-3 font-medium">评论内容</th>
                  <th className="pb-3 font-medium">目标类型 / ID</th>
                  <th className="pb-3 font-medium">发表时间</th>
                  <th className="pb-3 font-medium">当前状态</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredComments.map((c) => {
                  const isSelected = selectedIds.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-secondary/40 transition-colors ${
                        isSelected ? 'bg-secondary/30' : ''
                      }`}
                    >
                      <td className="py-3.5 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(c.id)}
                          className="rounded border-border text-foreground focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary border border-border shrink-0 flex items-center justify-center font-bold text-foreground">
                            {c.userAvatar ? (
                              <img src={c.userAvatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              c.userNickname?.[0] || 'U'
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{c.userNickname || `用户#${c.userId}`}</span>
                              {c.userRole === 'ROLE_ADMIN' ? (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 text-[10px] font-medium">
                                  <Shield className="w-2.5 h-2.5" /> 站长
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-secondary text-muted-foreground text-[10px]">
                                  读者
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">UID: {c.userId}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 pr-4 max-w-xs">
                        <div className="text-foreground leading-relaxed break-words whitespace-pre-wrap">
                          {c.replyToUserNickname && (
                            <span className="text-muted-foreground mr-1">回复 @{c.replyToUserNickname}:</span>
                          )}
                          {c.content}
                        </div>
                      </td>

                      <td className="py-3.5 pr-4">
                        <span className="px-2 py-0.5 rounded-md bg-secondary border border-border text-foreground text-[11px] font-mono">
                          {c.targetType === 'POST' || c.targetType === 'post' ? '文章' : '足迹'} #{c.targetId}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{c.createdAt?.replace('T', ' ').substring(0, 16)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 pr-4">
                        {c.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                            <CheckCircle className="w-3 h-3" /> 正常展示
                          </span>
                        ) : c.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                            <EyeOff className="w-3 h-3" /> 待审核
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-[11px]">
                            <EyeOff className="w-3 h-3" /> 已屏蔽
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'APPROVED')}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="审核通过并公开"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {c.status !== 'SPAM' && (
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'SPAM')}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title="屏蔽/标记垃圾"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="彻底删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border text-muted-foreground">
            <div>
              第 {page} / {totalPages} 页 (共 {total} 条)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-xl border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Batch Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.12] shadow-2xl animate-in slide-in-from-bottom-5">
          <span className="font-medium text-foreground text-xs pr-2 border-r border-border">
            已选择 <span className="text-primary font-bold">{selectedIds.size}</span> 项
          </span>

          <button
            type="button"
            disabled={batchLoading}
            onClick={() => handleBatchUpdateStatus('APPROVED')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {batchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            <span>批量通过</span>
          </button>

          <button
            type="button"
            disabled={batchLoading}
            onClick={() => handleBatchUpdateStatus('PENDING')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>转待审核</span>
          </button>

          <button
            type="button"
            disabled={batchLoading}
            onClick={() => handleBatchUpdateStatus('SPAM')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>批量屏蔽</span>
          </button>

          <button
            type="button"
            disabled={batchLoading}
            onClick={handleBatchDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>彻底删除</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors ml-1 cursor-pointer"
            title="取消勾选"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
