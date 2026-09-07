'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import { Plus, Trash2, Edit2, FolderTree } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      if (editingId) {
        await api.updateCategory(editingId, { name, slug, description });
      } else {
        await api.createCategory({ name, slug, description });
      }
      setName('');
      setSlug('');
      setDescription('');
      setEditingId(null);
      toast.success(editingId ? '分类更新成功' : '分类创建成功');
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal({
      title: '删除分类确认',
      message: '确定要删除该分类吗？删除后相关文章分类将被置空。',
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteCategory(id);
      toast.success('分类已成功删除');
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">分类管理</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          创建与维护文章核心分类（如 Technology, AI, Life, Travel）。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-card border border-border space-y-4 text-xs h-fit">
          <h2 className="text-sm font-bold text-foreground">
            {editingId ? '编辑分类' : '新建分类'}
          </h2>

          <div className="space-y-1">
            <label className="font-medium text-foreground">分类名称</label>
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
              placeholder="例如: Artificial Intelligence"
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
              placeholder="例如: ai"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">分类描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要介绍该分类涵盖的内容领域..."
              rows={3}
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              {editingId ? '更新分类' : '确认添加'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setSlug('');
                  setDescription('');
                }}
                className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border"
              >
                取消
              </button>
            )}
          </div>
        </form>

        {/* List */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="p-3.5">名称</th>
                <th className="p-3.5">Slug</th>
                <th className="p-3.5">描述</th>
                <th className="p-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-secondary/20">
                  <td className="p-3.5 font-semibold text-foreground">{cat.name}</td>
                  <td className="p-3.5 font-mono text-muted-foreground">{cat.slug}</td>
                  <td className="p-3.5 text-muted-foreground max-w-xs truncate">{cat.description || '-'}</td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
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
