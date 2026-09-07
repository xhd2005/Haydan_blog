'use client';

import React, { useEffect, useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

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
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [page, statusFilter]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateCommentStatus(id, status);
      setComments(comments.map((c) => (c.id === id ? { ...c, status } : c)));
      toast.success(status === 'APPROVED' ? '评论已审核通过并公开' : status === 'PENDING' ? '已转入待审核' : '评论已屏蔽');
    } catch (err: any) {
      toast.error(err.message || '更新状态失败');
    }
  };

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
      toast.success('评论已彻底删除');
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-8 max-w-5xl text-xs">
      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-emerald-500" />
            <span>读者互动评论管理 (Comments)</span>
          </h1>
          <p className="text-muted-foreground mt-0.5">
            审查和管理博客文章与足迹下的读者留言，支持审核通过、屏蔽隐藏违规发言与彻底删除。
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border self-start md:self-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
          <button
            onClick={() => {
              setStatusFilter(undefined);
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
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
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'APPROVED'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            正常已审核
          </button>
          <button
            onClick={() => {
              setStatusFilter('PENDING');
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
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
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'SPAM'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            垃圾/已屏蔽
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>加载评论数据中...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
            暂无相关评论数据
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-medium">评论者</th>
                  <th className="pb-3 font-medium">评论内容</th>
                  <th className="pb-3 font-medium">目标类型 / ID</th>
                  <th className="pb-3 font-medium">发表时间</th>
                  <th className="pb-3 font-medium">当前状态</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {comments.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/40 transition-colors">
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
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                            title="审核通过"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {c.status !== 'SPAM' && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'SPAM')}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                            title="屏蔽/标为垃圾"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="彻底删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                className="p-1.5 rounded-xl border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-xl border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
