'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { UserManageVO } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import { SafeImage } from '@/components/SafeImage';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Ban, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  Calendar,
  Filter,
  Loader2
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserManageVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers({
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
        status: statusFilter || undefined,
      });
      setUsers(res.records || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast.error(err.message || '获取读者用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user: UserManageVO) => {
    if (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN') {
      toast.warning('不可操作超级管理员账号');
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    const actionName = nextStatus === 'BANNED' ? '封禁' : '解封';

    const confirmed = await confirmModal({
      title: `${actionName}账号确认`,
      message: `确定要${actionName}读者账号「${user.nickname || user.username}」吗？${nextStatus === 'BANNED' ? '封禁后该用户将无法登录与发表评论。' : '解封后该用户将恢复正常互动权限。'}`,
      confirmText: `确认${actionName}`,
      variant: nextStatus === 'BANNED' ? 'danger' : 'default',
    });

    if (!confirmed) return;

    setUpdatingId(user.id);
    try {
      await api.updateUserStatus(user.id, nextStatus);
      toast.success(`已成功${actionName}该账号`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || `${actionName}失败`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="w-full space-y-5 text-xs">
      <AdminPageHeader
        title="用户与读者管理"
        description="管理全站已注册读者、活跃度指标与账号安全状态控制"
        icon={Users}
        badgeText={`全站注册 ${total} 人`}
        breadcrumbs={[
          { label: 'Studio 控制台', href: '/admin/dashboard' },
          { label: '用户管理' }
        ]}
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索用户名、昵称或邮箱..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            搜索
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none"
          >
            <option value="">全部状态</option>
            <option value="ACTIVE">正常活跃 (ACTIVE)</option>
            <option value="BANNED">违规封禁 (BANNED)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4">用户主体</th>
                <th className="py-3.5 px-4">权限角色</th>
                <th className="py-3.5 px-4">状态</th>
                <th className="py-3.5 px-4">评论互动数</th>
                <th className="py-3.5 px-4">最后登录 IP / 时间</th>
                <th className="py-3.5 px-4">注册日期</th>
                <th className="py-3.5 px-4 text-right">账号管控</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    正在拉取用户数据...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    未检索到符合条件的用户记录
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = u.role === 'ADMIN' || u.role === 'ROLE_ADMIN';
                  const isBanned = u.status === 'BANNED';

                  return (
                    <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Avatar & User info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={u.avatar || DEFAULT_AVATAR}
                            alt={u.nickname || u.username}
                            aspectRatio="1/1"
                            containerClassName="w-9 h-9 rounded-full overflow-hidden border border-border shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-foreground text-xs">{u.nickname || u.username}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">@{u.username}</div>
                            {u.email && <div className="text-[10px] text-muted-foreground">{u.email}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            管理员
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground">
                            读者
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <ShieldAlert className="w-3 h-3" />
                            已封禁
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            正常活跃
                          </span>
                        )}
                      </td>

                      {/* Comments */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
                          <MessageSquare className="w-3 h-3" />
                          {u.commentCount || 0} 条
                        </span>
                      </td>

                      {/* Last login */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                        <div>{u.lastLoginIp || '未记录 IP'}</div>
                        <div className="text-[10px]">
                          {u.lastLoginTime ? new Date(u.lastLoginTime).toLocaleString() : '未登录过'}
                        </div>
                      </td>

                      {/* Register date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <span className="text-[11px] text-muted-foreground/60 italic">超管受保护</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={updatingId === u.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                              isBanned
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                            }`}
                          >
                            {updatingId === u.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isBanned ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Ban className="w-3 h-3" />
                            )}
                            <span>{isBanned ? '解封账号' : '封禁此人'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              显示第 {(page - 1) * pageSize + 1} 至 {Math.min(page * pageSize, total)} 条，共 {total} 条记录
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-secondary border border-border hover:bg-secondary/80 disabled:opacity-40 transition-opacity"
              >
                上一页
              </button>
              <span className="font-mono">
                {page} / {Math.ceil(total / pageSize)}
              </span>
              <button
                type="button"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg bg-secondary border border-border hover:bg-secondary/80 disabled:opacity-40 transition-opacity"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
