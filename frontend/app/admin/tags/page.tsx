'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Tag } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const data = await api.getTags();
      setTags(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      if (editingId) {
        await api.updateTag(editingId, { name, slug });
      } else {
        await api.createTag({ name, slug });
      }
      setName('');
      setSlug('');
      setEditingId(null);
      toast.success(editingId ? '标签更新成功' : '标签创建成功');
      loadTags();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal({
      title: '删除标签确认',
      message: '确定要删除该标签吗？',
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteTag(id);
      toast.success('标签已成功删除');
      loadTags();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">标签管理</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          文章多对多关联标签，方便细粒度主题索引。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-card border border-border space-y-4 text-xs h-fit">
          <h2 className="text-sm font-bold text-foreground">
            {editingId ? '编辑标签' : '新建标签'}
          </h2>

          <div className="space-y-1">
            <label className="font-medium text-foreground">标签名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingId && !slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }
              }}
              required
              placeholder="例如: Spring Boot"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">URL Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="例如: spring-boot"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              {editingId ? '更新标签' : '添加标签'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setSlug('');
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
                <th className="p-3.5">标签名称</th>
                <th className="p-3.5">Slug</th>
                <th className="p-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-secondary/20">
                  <td className="p-3.5 font-semibold text-foreground">#{tag.name}</td>
                  <td className="p-3.5 font-mono text-muted-foreground">{tag.slug}</td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => { setEditingId(tag.id); setName(tag.name); setSlug(tag.slug); }}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
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
