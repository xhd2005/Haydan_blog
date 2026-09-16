'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Category, Tag as TagType } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import { 
  FolderTree, 
  Tag, 
  Layers, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowUpRight, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  BarChart2,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { triggerRevalidate } from '@/components/admin/revalidate';

type TaxonomyTab = 'categories' | 'tags' | 'overview';

interface KnowledgeTaxonomyWorkbenchProps {
  defaultTab?: TaxonomyTab;
}

function KnowledgeTaxonomyWorkbench({ defaultTab = 'categories' }: KnowledgeTaxonomyWorkbenchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. URL Query 参数联动（支持 ?tab=categories | tags | overview）
  const queryTab = searchParams?.get('tab') as TaxonomyTab | null;
  const initialTab: TaxonomyTab = (queryTab === 'tags' || queryTab === 'overview' || queryTab === 'categories')
    ? queryTab
    : defaultTab;

  const [activeTab, setActiveTab] = useState<TaxonomyTab>(initialTab);

  // 同步 URL 参数变动到 state
  useEffect(() => {
    if (queryTab && (queryTab === 'categories' || queryTab === 'tags' || queryTab === 'overview')) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const handleTabChange = (tab: TaxonomyTab) => {
    setActiveTab(tab);
    router.replace(`/admin/categories?tab=${tab}`, { scroll: false });
  };

  // 2. 分类数据状态域 (完全独立隔离)
  const [categories, setCategories] = useState<Category[]>([]);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catEditingId, setCatEditingId] = useState<number | null>(null);
  const [catSearch, setCatSearch] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);

  // 3. 标签数据状态域 (完全独立隔离)
  const [tags, setTags] = useState<TagType[]>([]);
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [tagEditingId, setTagEditingId] = useState<number | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [tagSubmitting, setTagSubmitting] = useState(false);

  // 初始化加载全量分类与标签
  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('加载分类列表失败:', err);
    }
  };

  const loadTags = async () => {
    try {
      const data = await api.getTags();
      setTags(data || []);
    } catch (err) {
      console.error('加载标签列表失败:', err);
    }
  };

  // 分类 CRUD
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) {
      toast.warning('请填写完整的分类名称与 Slug');
      return;
    }

    setCatSubmitting(true);
    try {
      if (catEditingId) {
        await api.updateCategory(catEditingId, {
          name: catName.trim(),
          slug: catSlug.trim(),
          description: catDescription.trim(),
        });
        toast.success('分类更新成功');
      } else {
        await api.createCategory({
          name: catName.trim(),
          slug: catSlug.trim(),
          description: catDescription.trim(),
        });
        toast.success('分类创建成功');
      }

      setCatName('');
      setCatSlug('');
      setCatDescription('');
      setCatEditingId(null);
      await triggerRevalidate(['/blog', '/']);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || '分类保存失败');
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setCatEditingId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description || '');
  };

  const handleCancelEditCategory = () => {
    setCatEditingId(null);
    setCatName('');
    setCatSlug('');
    setCatDescription('');
  };

  const handleDeleteCategory = async (id: number) => {
    const target = categories.find((c) => c.id === id);
    const confirmed = await confirmModal({
      title: '删除分类确认',
      message: `确定要删除分类「${target?.name || id}」吗？删除后相关文章的分类将被置空。`,
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteCategory(id);
      await triggerRevalidate(['/blog', '/']);
      toast.success('分类已成功删除');
      if (catEditingId === id) {
        handleCancelEditCategory();
      }
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  // 标签 CRUD
  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim() || !tagSlug.trim()) {
      toast.warning('请填写完整的标签名称与 Slug');
      return;
    }

    setTagSubmitting(true);
    try {
      if (tagEditingId) {
        await api.updateTag(tagEditingId, {
          name: tagName.trim(),
          slug: tagSlug.trim(),
        });
        toast.success('标签更新成功');
      } else {
        await api.createTag({
          name: tagName.trim(),
          slug: tagSlug.trim(),
        });
        toast.success('标签创建成功');
      }

      setTagName('');
      setTagSlug('');
      setTagEditingId(null);
      await triggerRevalidate(['/blog', '/']);
      loadTags();
    } catch (err: any) {
      toast.error(err.message || '标签保存失败');
    } finally {
      setTagSubmitting(false);
    }
  };

  const handleEditTag = (tag: TagType) => {
    setTagEditingId(tag.id);
    setTagName(tag.name);
    setTagSlug(tag.slug);
  };

  const handleCancelEditTag = () => {
    setTagEditingId(null);
    setTagName('');
    setTagSlug('');
  };

  const handleDeleteTag = async (id: number) => {
    const target = tags.find((t) => t.id === id);
    const confirmed = await confirmModal({
      title: '删除标签确认',
      message: `确定要删除标签「#${target?.name || id}」吗？`,
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteTag(id);
      await triggerRevalidate(['/blog', '/']);
      toast.success('标签已成功删除');
      if (tagEditingId === id) {
        handleCancelEditTag();
      }
      loadTags();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  // 筛选分类与标签
  const filteredCategories = useMemo(() => {
    if (!catSearch.trim()) return categories;
    const q = catSearch.trim().toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, catSearch]);

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return tags;
    const q = tagSearch.trim().toLowerCase();
    return tags.filter(
      (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    );
  }, [tags, tagSearch]);

  return (
    <div className="w-full space-y-5">
      {/* 统一规范页面头部 */}
      <AdminPageHeader
        title="知识分类工作台 (Knowledge Taxonomy)"
        description="系统化整合博文分类矩阵与细粒度标签索引，消除割裂孤岛，构建高内聚的数字花园知识拓扑。"
        icon={FolderTree}
        badge={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/20">
              {categories.length} 个分类
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono text-[10px] font-semibold border border-teal-500/20">
              {tags.length} 个标签
            </span>
          </div>
        }
        breadcrumbs={[
          { label: 'Studio', href: '/admin/dashboard' },
          { label: '知识与足迹', href: '/admin/categories' },
          { label: '知识分类工作台' },
        ]}
      />

      {/* 顶部现代化 Segmented 风格 Tab 切换 */}
      <div className="flex items-center justify-between gap-4 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={() => handleTabChange('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/[0.08]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/40 dark:hover:bg-white/[0.03]'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>分类管理 (Categories)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-neutral-700 text-slate-500 dark:text-zinc-400">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('tags')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'tags'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/[0.08]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/40 dark:hover:bg-white/[0.03]'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>标签矩阵 (Tags)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-neutral-700 text-slate-500 dark:text-zinc-400">
              {tags.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/[0.08]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/40 dark:hover:bg-white/[0.03]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>知识脉络图景 (Overview)</span>
          </button>
        </div>

        {/* 快捷跳转链接 */}
        <div className="hidden md:flex items-center gap-2 pr-2 text-xs">
          <Link
            href="/admin/graph"
            className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <span>3D 知识图谱</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-slate-300 dark:text-zinc-700">·</span>
          <Link
            href="/admin/posts"
            className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <span>文章管理</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ===================== TAB 1: 分类管理 ===================== */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* 左侧：分类表单 (状态隔离) */}
          <div className="rounded-2xl p-5 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm h-fit space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-emerald-500" />
                <span>{catEditingId ? '编辑分类' : '新建核心分类'}</span>
              </h2>
              {catEditingId && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  编辑中 #{catEditingId}
                </span>
              )}
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">分类名称</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!catEditingId && !catSlug) {
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  required
                  placeholder="例如: Artificial Intelligence"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">URL Slug</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  required
                  placeholder="例如: ai"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">分类描述</label>
                <textarea
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="简要介绍该分类所沉淀的知识深度与领域..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={catSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {catEditingId ? '更新分类' : '确认添加'}
                </button>
                {catEditingId && (
                  <button
                    type="button"
                    onClick={handleCancelEditCategory}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 右侧：分类数据列表 */}
          <div className="lg:col-span-2 rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                <FolderTree className="w-4 h-4 text-emerald-500" />
                <span>全站分类索引</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  ({filteredCategories.length} / {categories.length})
                </span>
              </div>
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="筛选分类名称或 Slug..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200/80 dark:border-white/[0.06]">
                  <tr>
                    <th className="p-3.5">分类名称</th>
                    <th className="p-3.5">Slug 路径</th>
                    <th className="p-3.5">描述</th>
                    <th className="p-3.5 text-right">管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-zinc-500">
                        {catSearch ? '未搜索到匹配的分类' : '暂无分类数据，请在左侧表单中创建'}
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                            <span>{cat.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-zinc-400">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
                            /{cat.slug}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 dark:text-zinc-400 max-w-xs truncate">
                          {cat.description || '-'}
                        </td>
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <Link
                            href={`/admin/posts?category=${cat.slug}`}
                            title="查看该分类下的博文"
                            className="inline-flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEditCategory(cat)}
                            title="编辑分类"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            title="删除分类"
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: 标签矩阵 ===================== */}
      {activeTab === 'tags' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* 左侧：标签表单 (状态独立隔离) */}
          <div className="rounded-2xl p-5 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm h-fit space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-500" />
                <span>{tagEditingId ? '编辑标签' : '新建知识标签'}</span>
              </h2>
              {tagEditingId && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  编辑中 #{tagEditingId}
                </span>
              )}
            </div>

            <form onSubmit={handleTagSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">标签名称</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => {
                    setTagName(e.target.value);
                    if (!tagEditingId && !tagSlug) {
                      setTagSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  required
                  placeholder="例如: Spring Boot"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">URL Slug</label>
                <input
                  type="text"
                  value={tagSlug}
                  onChange={(e) => setTagSlug(e.target.value)}
                  required
                  placeholder="例如: spring-boot"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={tagSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {tagEditingId ? '更新标签' : '添加标签'}
                </button>
                {tagEditingId && (
                  <button
                    type="button"
                    onClick={handleCancelEditTag}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 右侧：标签列表与搜索 */}
          <div className="lg:col-span-2 rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                <Tag className="w-4 h-4 text-teal-500" />
                <span>全站标签矩阵</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  ({filteredTags.length} / {tags.length})
                </span>
              </div>
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="筛选标签名称或 Slug..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200/80 dark:border-white/[0.06]">
                  <tr>
                    <th className="p-3.5">标签名称</th>
                    <th className="p-3.5">Slug 路径</th>
                    <th className="p-3.5 text-right">管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {filteredTags.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400 dark:text-zinc-500">
                        {tagSearch ? '未搜索到匹配的标签' : '暂无标签，请在左侧表单中添加'}
                      </td>
                    </tr>
                  ) : (
                    filteredTags.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 font-mono">
                            #{t.name}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-zinc-400">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
                            /{t.slug}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <Link
                            href={`/admin/posts?tag=${t.slug}`}
                            title="查看带有此标签的博文"
                            className="inline-flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEditTag(t)}
                            title="编辑标签"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTag(t.id)}
                            title="删除标签"
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: 知识脉络图景 ===================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 指标网格卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-zinc-400">一级体系分类</span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {categories.length}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-zinc-400">细粒度标签索引</span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {tags.length}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-zinc-400">分类健全度状态</span>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  100% 结构化就绪
                </div>
              </div>
            </div>
          </div>

          {/* 分类矩阵全览卡片 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  核心领域分布 (Taxonomy Domains)
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  每一个核心分类作为知识体系的一级目录支柱，承载长篇深度思考
                </p>
              </div>
              <button
                onClick={() => handleTabChange('categories')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>管理分类</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] space-y-2 hover:border-emerald-500/40 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">
                      {c.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                      /{c.slug}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {c.description || '暂无分类描述'}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <Link
                      href={`/admin/posts?category=${c.slug}`}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>筛选博文</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 标签云全景卡片 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  网状标签拓扑云 (Tag Network)
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  多对多微观标签，用于跨分类技术栈与专题交叉检索
                </p>
              </div>
              <button
                onClick={() => handleTabChange('tags')}
                className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>管理标签</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/posts?tag=${t.slug}`}
                  title={`点击查看带有 #${t.name} 的所有文章`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-teal-500/10 dark:hover:bg-teal-500/15 border border-slate-200/70 dark:border-white/[0.06] hover:border-teal-500/30 text-xs font-mono text-slate-700 dark:text-zinc-300 hover:text-teal-700 dark:hover:text-teal-400 transition-all flex items-center gap-1.5 group"
                >
                  <Tag className="w-3 h-3 text-slate-400 group-hover:text-teal-500 transition-colors" />
                  <span>#{t.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500 dark:text-zinc-400 font-mono">
          正在载入知识分类工作台...
        </div>
      }
    >
      <KnowledgeTaxonomyWorkbench defaultTab="categories" />
    </Suspense>
  );
}
