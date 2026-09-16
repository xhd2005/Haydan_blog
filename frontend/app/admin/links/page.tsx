'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { api } from '@/lib/api';
import { Friend } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import {
  Link2,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2,
  CheckCircle,
  EyeOff,
  Sparkles,
  X,
  Check,
  Upload,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Globe
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { triggerRevalidate } from '@/components/admin/revalidate';

export default function AdminLinksPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选、搜索与多选状态
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'HIDDEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [avatar, setAvatar] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('技术伙伴');
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState<'ACTIVE' | 'HIDDEN'>('ACTIVE');

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminFriends();
      setFriends(data || []);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '获取友链列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  // 统计不同状态数量
  const counts = useMemo(() => {
    let active = 0;
    let pending = 0;
    let hidden = 0;
    friends.forEach((f) => {
      const s = String(f.status);
      if (s === 'ACTIVE' || s === '1') active++;
      else if (s === 'PENDING' || s === '0') pending++;
      else hidden++;
    });
    return { all: friends.length, active, pending, hidden };
  }, [friends]);

  // 本地根据选项卡与关键词过滤
  const filteredFriends = useMemo(() => {
    return friends.filter((f) => {
      // 状态过滤
      const s = String(f.status);
      if (filterTab === 'ACTIVE' && s !== 'ACTIVE' && s !== '1') return false;
      if (filterTab === 'PENDING' && s !== 'PENDING' && s !== '0') return false;
      if (filterTab === 'HIDDEN' && (s === 'ACTIVE' || s === '1' || s === 'PENDING' || s === '0')) return false;

      // 关键词检索
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = f.name?.toLowerCase().includes(q);
        const matchUrl = f.url?.toLowerCase().includes(q);
        const matchDesc = f.description?.toLowerCase().includes(q);
        const matchCat = f.category?.toLowerCase().includes(q);
        if (!matchName && !matchUrl && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [friends, filterTab, searchQuery]);

  // 全选/反选
  const isAllSelected = filteredFriends.length > 0 && filteredFriends.every((f) => selectedIds.has(f.id));
  const isSomeSelected = filteredFriends.some((f) => selectedIds.has(f.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredFriends.forEach((f) => next.add(f.id));
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

  const openCreateModal = () => {
    setEditingFriend(null);
    setName('');
    setUrl('');
    setAvatar('');
    setDescription('');
    setCategory('技术伙伴');
    setSortOrder(0);
    setStatus('ACTIVE');
    setModalOpen(true);
  };

  const openEditModal = (f: Friend) => {
    setEditingFriend(f);
    setName(f.name);
    setUrl(f.url);
    setAvatar(f.avatar || '');
    setDescription(f.description || '');
    setCategory(f.category || '技术伙伴');
    setSortOrder(f.sortOrder || 0);
    setStatus(f.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setSubmitting(true);
    try {
      const payload: Partial<Friend> = {
        name: name.trim(),
        url: url.trim(),
        avatar: avatar.trim() || undefined,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
        status,
      };

      if (editingFriend) {
        await api.updateFriend(editingFriend.id, payload);
      } else {
        await api.createFriend(payload);
      }

      setModalOpen(false);
      toast.success(editingFriend ? '友链更新成功' : '友链添加成功');
      await fetchFriends();
      triggerRevalidate(['/links', '/']);
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (f: Friend) => {
    const nextStatus = f.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
    try {
      await api.updateFriend(f.id, { status: nextStatus });
      setFriends(friends.map((item) => (item.id === f.id ? { ...item, status: nextStatus } : item)));
      toast.success(nextStatus === 'ACTIVE' ? '友链已设为公开展示' : '友链已隐藏');
      triggerRevalidate(['/links', '/']);
    } catch (err: any) {
      toast.error(err.message || '切换状态失败');
    }
  };

  const handleQuickAudit = async (id: number, status: 'ACTIVE' | 'HIDDEN') => {
    try {
      await api.auditFriend(id, status);
      setFriends(friends.map((item) => (item.id === id ? { ...item, status } : item)));
      toast.success(status === 'ACTIVE' ? '已批准并公开该友链申请' : '已驳回/隐藏该友链申请');
      triggerRevalidate(['/links', '/']);
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal({
      title: '删除友链确认',
      message: '确定要删除这条友链吗？此操作不可逆。',
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteFriend(id);
      setFriends(friends.filter((f) => f.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('友链已成功删除');
      triggerRevalidate(['/links', '/']);
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  // 批量更新状态
  const handleBatchUpdateStatus = async (status: 'ACTIVE' | 'HIDDEN') => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    const ids = Array.from(selectedIds);
    const actionText = status === 'ACTIVE' ? '公开展示' : '设为隐藏';

    try {
      const results = await Promise.allSettled(
        ids.map((id) => api.auditFriend(id, status))
      );
      const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;

      setFriends((prev) =>
        prev.map((f) => (selectedIds.has(f.id) ? { ...f, status } : f))
      );
      setSelectedIds(new Set());
      toast.success(`成功批量将 ${fulfilledCount} 条友链${actionText}`);
      triggerRevalidate(['/links', '/']);
    } catch (err: any) {
      toast.error(err.message || '批量操作失败');
    } finally {
      setBatchLoading(false);
    }
  };

  // 批量删除 (严格遵从 Rule 6 破坏性批处理防误触红线)
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = await confirmModal({
      title: '批量删除友链确认',
      message: `确定要彻底删除选中的 ${selectedIds.size} 条友链吗？此操作不可逆。`,
      confirmText: '确认批量删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    setBatchLoading(true);
    const ids = Array.from(selectedIds);

    try {
      const results = await Promise.allSettled(
        ids.map((id) => api.deleteFriend(id))
      );
      const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;

      setFriends((prev) => prev.filter((f) => !selectedIds.has(f.id)));
      setSelectedIds(new Set());
      toast.success(`成功批量删除 ${fulfilledCount} 条友链`);
      triggerRevalidate(['/links', '/']);
    } catch (err: any) {
      toast.error(err.message || '批量删除失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await api.uploadMedia(file);
      setAvatar(res.url);
      toast.success('头像图片已上传至 MinIO');
    } catch (err: any) {
      toast.error(err.message || '上传头像失败');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-5 text-xs">
      <AdminPageHeader
        title="友链与邻居管理"
        description="管理数字花园互联友链，支持申请审核、多选批处理、分类分组、权重排序与即时展示控制"
        icon={Link2}
        badgeText={`${friends.length} 条友链`}
        breadcrumbs={[
          { label: 'Studio 控制台', href: '/admin/dashboard' },
          { label: '友链与邻居' }
        ]}
        action={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>添加新友链</span>
          </button>
        }
      />

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border shadow-sm">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-secondary border border-border/80">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            全部 ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              filterTab === 'ACTIVE'
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            公开展示 ({counts.active})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('PENDING')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs font-semibold'
                : counts.pending > 0
                ? 'text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>待审核申请</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterTab === 'PENDING'
                ? 'bg-white/20 text-white'
                : counts.pending > 0
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {counts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('HIDDEN')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              filterTab === 'HIDDEN'
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            已隐藏 ({counts.hidden})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索站点名称、网址、分类..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Friends Table/List */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>加载友链数据中...</span>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
            {searchQuery ? '未找到匹配的友链' : '当前选项卡下暂无友链数据'}
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
                      title="全选/反选当前列表"
                    />
                  </th>
                  <th className="pb-3 font-medium">站点信息</th>
                  <th className="pb-3 font-medium">协议与连通</th>
                  <th className="pb-3 font-medium">分类分组</th>
                  <th className="pb-3 font-medium">排序权重</th>
                  <th className="pb-3 font-medium">当前状态</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredFriends.map((f) => {
                  const isSelected = selectedIds.has(f.id);
                  const isHttps = f.url?.startsWith('https://');
                  const isPending = String(f.status) === 'PENDING' || f.status === '0';
                  const isActive = String(f.status) === 'ACTIVE' || f.status === '1';

                  return (
                    <tr
                      key={f.id}
                      className={`hover:bg-secondary/40 transition-colors ${
                        isSelected ? 'bg-secondary/30' : ''
                      }`}
                    >
                      <td className="py-3.5 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(f.id)}
                          className="rounded border-border text-foreground focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-secondary border border-border shrink-0 flex items-center justify-center font-bold text-foreground">
                            {f.avatar ? (
                              <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                            ) : (
                              f.name?.[0] || 'L'
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{f.name}</span>
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="打开对方站点"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-sm">
                              {f.description || f.url}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                            isHttps
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          <ShieldCheck className="w-2.5 h-2.5" />
                          {isHttps ? 'HTTPS 安全' : 'HTTP 明文'}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4">
                        <span className="px-2 py-0.5 rounded-md bg-secondary border border-border text-foreground text-[11px]">
                          {f.category || '未分类'}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4 font-mono text-muted-foreground">
                        {f.sortOrder}
                      </td>

                      <td className="py-3.5 pr-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium border border-amber-500/20">
                            <Radio className="w-2.5 h-2.5 animate-pulse text-amber-500" />
                            <span>待站长审核</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(f)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3" /> 正常展示
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" /> 已隐藏
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickAudit(f.id, 'ACTIVE')}
                                className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                title="一键批准通过"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAudit(f.id, 'HIDDEN')}
                                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                title="驳回/标记隐藏"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(f)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                            title="编辑友链"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(f.id)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="删除友链"
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
      </div>

      {/* Floating Batch Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.12] shadow-2xl animate-in slide-in-from-bottom-5">
          <span className="font-medium text-foreground text-xs pr-2 border-r border-border">
            已选择 <span className="text-primary font-bold">{selectedIds.size}</span> 条友链
          </span>

          <button
            type="button"
            disabled={batchLoading}
            onClick={() => handleBatchUpdateStatus('ACTIVE')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {batchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            <span>批量公开</span>
          </button>

          <button
            type="button"
            disabled={batchLoading}
            onClick={() => handleBatchUpdateStatus('HIDDEN')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>批量隐藏</span>
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-card border border-border space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>{editingFriend ? '编辑友链信息' : '添加新友链'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">站点名称 *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="如 某某的博客"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">站点分类</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="如 技术伙伴 / 设计生活"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">网址 URL *</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-foreground">站点图标 / 站长头像 (MinIO / URL)</label>
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-500 hover:text-blue-600 disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    <span>上传</span>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://... 或点击右上角上传"
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">站点简介或一句话推荐</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="一句话介绍对方的网站特色..."
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">排序权重 (数字越大越靠前)</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">展示状态</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'HIDDEN')}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    <option value="ACTIVE">正常在前台展示 (ACTIVE)</option>
                    <option value="HIDDEN">待审核 / 暂不下发 (HIDDEN)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-secondary text-foreground cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>确认保存</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
