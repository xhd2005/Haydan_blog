'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Timeline } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import { Plus, Trash2, Edit2, Milestone } from 'lucide-react';

export default function AdminTimelinePage() {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(10);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadTimelines();
  }, []);

  const loadTimelines = async () => {
    try {
      const data = await api.getTimelines();
      setTimelines(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!year.trim() || !title.trim()) return;

    try {
      if (editingId) {
        await api.updateTimeline(editingId, { year, title, description, sortOrder });
      } else {
        await api.createTimeline({ year, title, description, sortOrder });
      }
      setEditingId(null);
      setYear('');
      setTitle('');
      setDescription('');
      setSortOrder(10);
      toast.success(editingId ? '时间线节点更新成功' : '时间线节点创建成功');
      loadTimelines();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal({
      title: '删除时间线节点确认',
      message: '确定删除该时间线节点吗？该操作不可逆。',
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteTimeline(id);
      toast.success('时间线节点已成功删除');
      loadTimelines();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  const handleEdit = (t: Timeline) => {
    setEditingId(t.id);
    setYear(t.year);
    setTitle(t.title);
    setDescription(t.description || '');
    setSortOrder(t.sortOrder || 10);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">成长时间线管理</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          管理在 About 页面展示的里程碑与个人成长时间轴节点。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-card border border-border space-y-4 text-xs h-fit">
          <h2 className="text-sm font-bold text-foreground">
            {editingId ? '编辑时间线' : '添加新里程碑'}
          </h2>

          <div className="space-y-1">
            <label className="font-medium text-foreground">年份 / 时期</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              placeholder="例如: 2026 或 2024-2025"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">事件标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="例如: 构建个人数字花园 V1.0"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">详细描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="记录该时期的重要思考、技术突破或心境转折..."
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">排序值 (越小越靠前)</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              {editingId ? '更新里程碑' : '确认添加'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setYear('');
                  setTitle('');
                  setDescription('');
                }}
                className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border"
              >
                取消
              </button>
            )}
          </div>
        </form>

        <div className="md:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="p-3.5">年份</th>
                <th className="p-3.5">事件</th>
                <th className="p-3.5">描述</th>
                <th className="p-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {timelines.map((t) => (
                <tr key={t.id} className="hover:bg-secondary/20">
                  <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {t.year}
                  </td>
                  <td className="p-3.5 font-semibold text-foreground">
                    {t.title}
                  </td>
                  <td className="p-3.5 text-muted-foreground max-w-xs truncate">
                    {t.description || '-'}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => handleEdit(t)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
