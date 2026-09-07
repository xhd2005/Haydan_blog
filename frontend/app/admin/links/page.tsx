'use client';

import React, { useEffect, useState } from 'react';
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
  Check
} from 'lucide-react';

export default function AdminLinksPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

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
      toast.success(nextStatus === 'ACTIVE' ? '友链已设为公开可见' : '友链已隐藏');
    } catch (err: any) {
      toast.error(err.message || '切换状态失败');
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
      toast.success('友链已成功删除');
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl text-xs">
      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Link2 className="w-6 h-6 text-emerald-500" />
            <span>友链与邻居管理 (Links)</span>
          </h1>
          <p className="text-muted-foreground mt-0.5">
            管理数字花园互联友链，支持分类分组、权重排序、头像预览与一键上下架审核。
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 flex items-center gap-1.5 self-start md:self-auto transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>添加新友链</span>
        </button>
      </div>

      {/* Friends Table/List */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between text-muted-foreground font-mono">
          <span>共录入 {friends.length} 条友链</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>加载友链数据中...</span>
          </div>
        ) : friends.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
            暂无友链数据，点击上方“添加新友链”新增第一个伙伴吧！
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-medium">站点信息</th>
                  <th className="pb-3 font-medium">分类分组</th>
                  <th className="pb-3 font-medium">排序权重</th>
                  <th className="pb-3 font-medium">状态</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {friends.map((f) => (
                  <tr key={f.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-secondary border border-border shrink-0 flex items-center justify-center font-bold text-foreground">
                          {f.avatar ? (
                            <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                          ) : (
                            f.name[0]
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>{f.name}</span>
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {f.description || f.url}
                          </div>
                        </div>
                      </div>
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
                      <button
                        onClick={() => handleToggleStatus(f)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                          f.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {f.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> 正常展示
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> 待审核/隐藏
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(f)}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="编辑友链"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="删除友链"
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
      </div>

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
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
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
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">站点分类</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="如 技术伙伴 / 设计生活"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs"
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
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">站点图标 / 站长头像 URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">站点简介或一句话推荐</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="一句话介绍对方的网站特色..."
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">排序权重 (数字越大越靠前)</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">展示状态</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'HIDDEN')}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs"
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
                  className="px-4 py-2 rounded-xl border border-border hover:bg-secondary text-foreground"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 flex items-center gap-1.5"
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
