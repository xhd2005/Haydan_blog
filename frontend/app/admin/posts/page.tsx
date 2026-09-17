'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Post, Category } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Eye,
  Star,
  CheckCircle,
  Clock,
  Languages,
  Loader2,
  FileText,
  FolderTree,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List,
  Sparkles,
  Calendar,
  Layers,
  Replace,
  History,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { triggerRevalidate } from '@/components/admin/revalidate';
import { PostQuickLookDrawer } from '@/components/admin/posts/PostQuickLookDrawer';
import { PostBatchReplaceModal } from '@/components/admin/posts/PostBatchReplaceModal';
import { PostRevisionHistoryModal } from '@/components/admin/posts/PostRevisionHistoryModal';

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12; // 调整为 12，便于表格与 3/4 列卡片流自适应排版
  const [status, setStatus] = useState('');
  const [lang, setLang] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [derivingId, setDerivingId] = useState<number | null>(null);

  // 视图模式：'table' (紧凑表格) | 'grid' (杂志卡片流)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // QuickLook 预览抽屉状态
  const [quickLookPostId, setQuickLookPostId] = useState<number | null>(null);
  const [quickLookOpen, setQuickLookOpen] = useState(false);

  // 批量正文替换模态框
  const [batchReplaceOpen, setBatchReplaceOpen] = useState(false);

  // 时光机版本快照模态框
  const [revisionModalPost, setRevisionModalPost] = useState<Post | null>(null);

  // 多选与批量操作状态
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [batchOperating, setBatchOperating] = useState(false);
  const [batchCategoryModalOpen, setBatchCategoryModalOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<number | undefined>();
  const [jumpPage, setJumpPage] = useState('');

  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // 初始化视图模式记忆
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_posts_view_mode');
      if (saved === 'grid' || saved === 'table') {
        setViewMode(saved);
      }
    } catch {}
  }, []);

  const switchViewMode = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem('admin_posts_view_mode', mode);
    } catch {}
  };

  // 空格快捷键唤起 QuickLook 极速预览
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space' && !quickLookOpen && !batchReplaceOpen && !revisionModalPost) {
        const targetId = selectedIds.length > 0 ? selectedIds[0] : (posts.length > 0 ? posts[0].id : null);
        if (targetId) {
          e.preventDefault();
          setQuickLookPostId(targetId);
          setQuickLookOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickLookOpen, batchReplaceOpen, revisionModalPost, selectedIds, posts]);

  useEffect(() => {
    setSelectedIds([]);
    loadPosts();
  }, [page, status, lang]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPosts({
        page,
        pageSize,
        status: status || undefined,
        lang: lang || undefined,
        keyword: keyword || undefined,
      });
      setPosts(res.records || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast.error(err.message || '加载文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSelectedIds([]);
    loadPosts();
  };

  const toggleFeatured = async (post: Post) => {
    try {
      const nextFeatured = post.featured === 1 ? 0 : 1;
      await api.updatePostFeatured(post.id, nextFeatured);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, featured: nextFeatured } : p))
      );
      await triggerRevalidate(['/blog', '/']);
      toast.success(nextFeatured === 1 ? '已设为置顶文章' : '已取消置顶');
    } catch (err: any) {
      toast.error(err.message || '修改置顶状态失败');
    }
  };

  const toggleStatus = async (post: Post) => {
    try {
      const nextStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await api.updatePostStatus(post.id, nextStatus);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p))
      );
      await triggerRevalidate(['/blog', '/', `/blog/${post.slug}`]);
      toast.success(nextStatus === 'PUBLISHED' ? '文章已发布上线' : '文章已转为草稿');
    } catch (err: any) {
      toast.error(err.message || '修改发布状态失败');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal({
      title: '删除文章确认',
      message: '确定要彻底删除这篇文章吗？此操作不可逆！',
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deletePost(id);
      await triggerRevalidate(['/blog', '/']);
      toast.success('文章已删除');
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  const handleDerive = async (post: Post) => {
    setDerivingId(post.id);
    try {
      const newPost = await api.deriveTranslation(post.id);
      toast.success('双语译文草稿已成功派生！正在前往编辑...');
      if (newPost && newPost.id) {
        router.push(`/admin/posts/edit/${newPost.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || '派生失败');
    } finally {
      setDerivingId(null);
    }
  };

  // 多选逻辑
  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const currentPageIds = posts.map((p) => p.id);
    const isAllSelected =
      currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const isAllSelected =
    posts.length > 0 && posts.every((p) => selectedIds.includes(p.id));
  const isPartiallySelected =
    posts.some((p) => selectedIds.includes(p.id)) && !isAllSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  // 批量操作实现
  const handleBatchPublish = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmModal({
      title: '批量发布文章',
      message: `确定要将选中的 ${selectedIds.length} 篇文章批量发布上线吗？`,
      confirmText: '确认批量发布',
    });
    if (!confirmed) return;

    setBatchOperating(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => api.updatePostStatus(id, 'PUBLISHED'))
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      await triggerRevalidate(['/blog', '/']);
      if (failed === 0) {
        toast.success(`已成功批量发布 ${succeeded} 篇文章上线！`);
      } else {
        toast.warning(`批量发布完成：${succeeded} 篇成功，${failed} 篇失败`);
      }
      setSelectedIds([]);
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || '批量发布失败');
    } finally {
      setBatchOperating(false);
    }
  };

  const handleBatchDraft = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmModal({
      title: '批量转为草稿',
      message: `确定要将选中的 ${selectedIds.length} 篇文章批量下架转为草稿吗？`,
      confirmText: '确认转为草稿',
    });
    if (!confirmed) return;

    setBatchOperating(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => api.updatePostStatus(id, 'DRAFT'))
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      await triggerRevalidate(['/blog', '/']);
      if (failed === 0) {
        toast.success(`已成功将 ${succeeded} 篇文章转为草稿！`);
      } else {
        toast.warning(`批量转草稿完成：${succeeded} 篇成功，${failed} 篇失败`);
      }
      setSelectedIds([]);
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || '批量操作失败');
    } finally {
      setBatchOperating(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmModal({
      title: '批量删除文章确认',
      message: `高危操作：确定要彻底删除选中的 ${selectedIds.length} 篇文章吗？将自动清除关联标签与双语绑定，此操作不可逆！`,
      confirmText: `确认彻底删除 (${selectedIds.length}篇)`,
      variant: 'danger',
    });
    if (!confirmed) return;

    setBatchOperating(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => api.deletePost(id))
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      await triggerRevalidate(['/blog', '/']);
      if (failed === 0) {
        toast.success(`已彻底删除 ${succeeded} 篇文章！`);
      } else {
        toast.warning(`批量删除完成：${succeeded} 篇成功，${failed} 篇失败`);
      }
      setSelectedIds([]);
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || '批量删除失败');
    } finally {
      setBatchOperating(false);
    }
  };

  const handleBatchChangeCategory = async () => {
    if (selectedIds.length === 0 || !targetCategoryId) return;
    const targetCategory = categories.find((c) => c.id === targetCategoryId);

    setBatchOperating(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) =>
          api.updatePost(id, { categoryId: targetCategoryId })
        )
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      await triggerRevalidate(['/blog', '/']);
      if (failed === 0) {
        toast.success(`已成功将 ${succeeded} 篇文章变更至分类「${targetCategory?.name}」！`);
      } else {
        toast.warning(`批量变更分类完成：${succeeded} 篇成功，${failed} 篇失败`);
      }
      setBatchCategoryModalOpen(false);
      setSelectedIds([]);
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || '批量变更分类失败');
    } finally {
      setBatchOperating(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="w-full space-y-5">
      {/* 统一规范头部 */}
      <AdminPageHeader
        title="文章管理 (Posts Studio)"
        description={`共 ${total} 篇文章，支持多选批处理、双语派生、双重视图切换、Markdown 创作与发布。`}
        icon={FileText}
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/20">
            {total} 篇
          </span>
        }
        breadcrumbs={[
          { label: 'Studio', href: '/admin/dashboard' },
          { label: '创作工坊', href: '/admin/posts' },
          { label: '文章管理' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setBatchReplaceOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer border border-slate-300/80 dark:border-white/[0.08]"
              title="全站正文批量查找替换引擎 (带 Diff 预览与快照回滚)"
            >
              <Replace className="w-3.5 h-3.5 text-indigo-500" />
              <span>全站批量替换</span>
            </button>
            <Link
              href="/admin/posts/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>写新文章</span>
            </Link>
          </div>
        }
      />

      {/* Filter Bar & View Toggle */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <button
            onClick={() => { setStatus(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              status === '' ? 'bg-foreground text-background font-bold shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            全部状态
          </button>
          <button
            onClick={() => { setStatus('PUBLISHED'); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              status === 'PUBLISHED' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            已发布
          </button>
          <button
            onClick={() => { setStatus('DRAFT'); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              status === 'DRAFT' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            草稿箱
          </button>

          <span className="text-border mx-1 hidden sm:inline">|</span>

          {/* Lang filter */}
          <button
            onClick={() => { setLang(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              lang === '' ? 'bg-foreground text-background font-bold shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            全部语言
          </button>
          <button
            onClick={() => { setLang('zh'); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              lang === 'zh' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            中文 [ZH]
          </button>
          <button
            onClick={() => { setLang('en'); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              lang === 'en' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            English [EN]
          </button>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 lg:flex-initial">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索标题或摘要..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors border border-border cursor-pointer shrink-0"
            >
              查询
            </button>
          </form>

          {/* 视图模式切换 */}
          <div className="flex items-center p-1 rounded-xl bg-secondary border border-border shrink-0">
            <button
              type="button"
              onClick={() => switchViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="紧凑表格视图"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => switchViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="杂志卡片流视图"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 文章内容展示区域：根据 viewMode 渲染 */}
      {viewMode === 'table' ? (
        /* 紧凑数据表格视图 */
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      ref={headerCheckboxRef}
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title={isAllSelected ? '取消全选本页' : '全选本页'}
                    />
                  </th>
                  <th className="p-3.5">标题</th>
                  <th className="p-3.5">分类</th>
                  <th className="p-3.5">语言</th>
                  <th className="p-3.5">状态</th>
                  <th className="p-3.5">置顶</th>
                  <th className="p-3.5">阅读量</th>
                  <th className="p-3.5">创建时间</th>
                  <th className="p-3.5 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {posts.length > 0 ? (
                  posts.map((post) => {
                    const isSelected = selectedIds.includes(post.id);
                    return (
                      <tr
                        key={post.id}
                        className={`hover:bg-secondary/30 transition-colors ${
                          isSelected ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''
                        }`}
                      >
                        <td className="p-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(post.id)}
                            className="rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5 max-w-sm">
                          <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                            {post.featured === 1 && (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                            <span className="truncate">{post.title}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono truncate">
                            /{post.slug}
                          </div>
                        </td>
                        <td className="p-3.5">
                          {post.category ? (
                            <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground font-medium border border-border/50">
                              {post.category.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {post.lang === 'en' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              <Languages className="w-3 h-3" />
                              <span>EN</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <Languages className="w-3 h-3" />
                              <span>ZH</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => toggleStatus(post)}
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold transition-opacity hover:opacity-80 cursor-pointer border ${
                              post.status === 'PUBLISHED'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
                          </button>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => toggleFeatured(post)}
                            className={`p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer ${
                              post.featured === 1 ? 'text-amber-500' : 'text-muted-foreground/40'
                            }`}
                            title="点击切换置顶状态"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {post.viewCount || 0}
                        </td>
                        <td className="p-3.5 text-muted-foreground font-mono">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString('zh-CN') : '-'}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* 双语派生 / 查看译文 */}
                          {post.translationPostId ? (
                            <Link
                              href={`/admin/posts/edit/${post.translationPostId}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-medium border border-border transition-colors cursor-pointer"
                              title={`已关联译文 ID: #${post.translationPostId}${post.translationPostTitle ? ` (${post.translationPostTitle})` : ''}`}
                            >
                              <Languages className="w-3 h-3 text-emerald-500" />
                              <span>查看译文</span>
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDerive(post)}
                              disabled={derivingId === post.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                              title={post.lang === 'en' ? '一键派生中文版本草稿并跳转' : '一键派生英文版本草稿并跳转'}
                            >
                              {derivingId === post.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Languages className="w-3 h-3" />
                              )}
                              <span>{post.lang === 'en' ? '派生中文版' : '派生英文版'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setQuickLookPostId(post.id);
                              setQuickLookOpen(true);
                            }}
                            className="inline-flex p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                            title="极速速览 (QuickLook · 空格键)"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevisionModalPost(post)}
                            className="inline-flex p-1.5 rounded-lg hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                            title="版本历史与时光机快照"
                          >
                            <History className="w-3.5 h-3.5 text-indigo-500" />
                          </button>
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="inline-flex p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="查看前台"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/posts/edit/${post.id}`}
                            className="inline-flex p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="编辑文章"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="inline-flex p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                            title="删除文章"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-muted-foreground">
                      {loading ? '加载中...' : '暂无匹配文章'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 杂志封面卡片流视图 (Magazine Cards Grid) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {posts.length > 0 ? (
            posts.map((post) => {
              const isSelected = selectedIds.includes(post.id);
              return (
                <div
                  key={post.id}
                  className={`group relative flex flex-col rounded-2xl border bg-card overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/5'
                      : 'border-border hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  {/* 顶部封面图与快速勾选 */}
                  <div className="relative aspect-[16/10] w-full bg-secondary/80 overflow-hidden border-b border-border/60">
                    {post.cover ? (
                      <img
                        src={post.cover}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/10 via-indigo-500/5 to-secondary text-muted-foreground/50">
                        <FileText className="w-8 h-8 opacity-40 mb-1" />
                        <span className="text-[10px] font-mono opacity-60">NO COVER</span>
                      </div>
                    )}

                    {/* 勾选框覆盖 */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(post.id)}
                        className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer bg-card/80 backdrop-blur-sm"
                      />
                    </div>

                    {/* 状态与语言标签徽章 */}
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                      {post.featured === 1 && (
                        <span className="p-1 rounded-md bg-amber-500 text-white shadow-xs" title="置顶推荐">
                          <Star className="w-3 h-3 fill-white" />
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold backdrop-blur-md shadow-xs ${
                        post.status === 'PUBLISHED'
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-amber-500/90 text-white'
                      }`}>
                        {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
                      </span>
                    </div>

                    {/* 分类徽标 */}
                    {post.category && (
                      <div className="absolute bottom-2 left-2.5 z-10">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-medium text-[10px] border border-white/10">
                          {post.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 卡片正文信息 */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                        <Languages className="w-3 h-3 text-emerald-500" />
                        <span>{post.lang === 'en' ? 'English (EN)' : '中文 (ZH)'}</span>
                        <span>·</span>
                        <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('zh-CN') : '-'}</span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {post.title}
                      </h4>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    {/* 卡片底栏操作 */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {post.viewCount || 0} 次阅读
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setQuickLookPostId(post.id);
                            setQuickLookOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                          title="极速速览 (QuickLook · 空格键)"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevisionModalPost(post)}
                          className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                          title="版本历史与时光机快照"
                        >
                          <History className="w-3.5 h-3.5 text-indigo-500" />
                        </button>
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="前台预览"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/posts/edit/${post.id}`}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="编辑文章"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                          title="删除文章"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-muted-foreground bg-card rounded-2xl border border-border">
              {loading ? '正在加载文章卡片...' : '暂无匹配文章'}
            </div>
          )}
        </div>
      )}

      {/* 现代 Pagination 分页导航条 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card text-xs text-muted-foreground shadow-sm">
        <div className="flex items-center gap-2">
          <span>共 <strong className="text-foreground font-mono">{total}</strong> 篇</span>
          <span>·</span>
          <span>第 <strong className="text-foreground font-mono">{page}</strong> / <strong className="text-foreground font-mono">{totalPages}</strong> 页</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="首页"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="上一页"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* 页码选择 Pills */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => {
              const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsisBefore && <span className="px-1 text-muted-foreground">...</span>}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    disabled={loading}
                    className={`min-w-[28px] h-7 px-2 rounded-lg font-mono text-xs transition-colors cursor-pointer ${
                      page === p
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="下一页"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="末页"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>

          {/* 快速跳转 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const p = parseInt(jumpPage, 10);
              if (!isNaN(p) && p >= 1 && p <= totalPages) {
                setPage(p);
                setJumpPage('');
              } else {
                toast.warning(`请输入 1 到 ${totalPages} 之间的页码`);
              }
            }}
            className="flex items-center gap-1.5 ml-2"
          >
            <span className="text-[11px]">跳至</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              placeholder={String(page)}
              className="w-12 h-7 px-1 text-center font-mono rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[11px]">页</span>
            <button
              type="submit"
              className="px-2 h-7 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs transition-colors cursor-pointer"
            >
              GO
            </button>
          </form>
        </div>
      </div>

      {/* Floating Bulk Action Bar (批量操作悬浮岛) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 mx-auto max-w-3xl w-[94%] z-40 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-card/95 backdrop-blur-md border border-slate-300/90 dark:border-white/[0.15] shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold border border-emerald-500/20">
                已选中 {selectedIds.length} 篇文章
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
                title="取消全选"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={handleBatchPublish}
                disabled={batchOperating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {batchOperating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>批量发布</span>
              </button>

              <button
                type="button"
                onClick={handleBatchDraft}
                disabled={batchOperating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>批量转草稿</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (categories.length > 0 && !targetCategoryId) {
                    setTargetCategoryId(categories[0].id);
                  }
                  setBatchCategoryModalOpen(true);
                }}
                disabled={batchOperating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
                <span>批量变更分类</span>
              </button>

              <button
                type="button"
                onClick={handleBatchDelete}
                disabled={batchOperating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>彻底删除</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量变更分类弹窗 */}
      {batchCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-emerald-500" />
                <span>批量变更分类 ({selectedIds.length} 篇文章)</span>
              </h3>
              <button
                type="button"
                onClick={() => setBatchCategoryModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-medium text-foreground">选择目标分类：</label>
              <select
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchCategoryModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs text-foreground transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleBatchChangeCategory}
                disabled={batchOperating}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {batchOperating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>确认变更</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QuickLook 极速速览抽屉 */}
      <PostQuickLookDrawer
        isOpen={quickLookOpen}
        onClose={() => setQuickLookOpen(false)}
        postId={quickLookPostId}
        postList={posts}
        onSelectPost={(post) => setQuickLookPostId(post.id)}
      />

      {/* 全站正文批量查找替换模态框 */}
      <PostBatchReplaceModal
        isOpen={batchReplaceOpen}
        onClose={() => setBatchReplaceOpen(false)}
        selectedPostIds={selectedIds}
        onSuccess={() => loadPosts()}
      />

      {/* 时光机版本快照模态框 */}
      {revisionModalPost && (
        <PostRevisionHistoryModal
          isOpen={Boolean(revisionModalPost)}
          onClose={() => setRevisionModalPost(null)}
          postId={revisionModalPost.id}
          currentTitle={revisionModalPost.title}
          currentContent={revisionModalPost.content || ''}
          onRestore={(restoredTitle, restoredContent) => {
            api.updatePost(revisionModalPost.id, {
              title: restoredTitle,
              content: restoredContent,
            }).then(() => {
              toast.success('已恢复至历史版本并同步保存');
              loadPosts();
            }).catch((err) => {
              toast.error(err.message || '恢复失败');
            });
          }}
        />
      )}
    </div>
  );
}
