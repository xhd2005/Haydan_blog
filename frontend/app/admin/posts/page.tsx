'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Post } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import { Plus, Search, Trash2, Edit3, Eye, Star, CheckCircle, Clock, Languages, Loader2 } from 'lucide-react';

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [lang, setLang] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [derivingId, setDerivingId] = useState<number | null>(null);

  useEffect(() => {
    loadPosts();
  }, [page, status, lang]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminPosts({
        page,
        pageSize: 10,
        status: status || undefined,
        keyword: keyword || undefined,
        lang: lang || undefined,
      });
      setPosts(data.records);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
  };

  const handleDerive = async (post: Post) => {
    setDerivingId(post.id);
    try {
      const newPost = await api.deriveTranslation(post.id);
      toast.success(
        post.lang === 'en'
          ? '已成功派生中文草稿，正在进入双栏编辑器...'
          : '已成功派生英文草稿，正在进入双栏编辑器...'
      );
      if (newPost && newPost.id) {
        router.push(`/admin/posts/edit/${newPost.id}`);
      } else {
        loadPosts();
      }
    } catch (err: any) {
      toast.error(err.message || '派生译文草稿失败');
    } finally {
      setDerivingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal({
      title: '删除文章确认',
      message: '确定要删除该文章吗？该操作不可逆。',
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deletePost(id);
      toast.success('文章已成功删除');
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  const toggleFeatured = async (post: Post) => {
    try {
      const newFeatured = post.featured === 1 ? 0 : 1;
      await api.updatePostFeatured(post.id, newFeatured);
      toast.success(newFeatured === 1 ? '已设为置顶文章' : '已取消置顶');
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || '更新置顶状态失败');
    }
  };

  const toggleStatus = async (post: Post) => {
    try {
      const newStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await api.updatePostStatus(post.id, newStatus);
      toast.success(newStatus === 'PUBLISHED' ? '文章已发布上线' : '文章已转为草稿');
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || '更新状态失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            文章管理
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            共 {total} 篇文章，支持创建、双语派生、Markdown 编辑、发布与归档。
          </p>
        </div>

        <Link
          href="/admin/posts/create"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>写新文章</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status filter */}
          <button
            onClick={() => { setStatus(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              status === '' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            全部状态
          </button>
          <button
            onClick={() => { setStatus('PUBLISHED'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              status === 'PUBLISHED' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            已发布
          </button>
          <button
            onClick={() => { setStatus('DRAFT'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              status === 'DRAFT' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            草稿箱
          </button>

          <span className="text-border mx-1 hidden sm:inline">|</span>

          {/* Lang filter */}
          <button
            onClick={() => { setLang(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              lang === '' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            全部语言
          </button>
          <button
            onClick={() => { setLang('zh'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              lang === 'zh' ? 'bg-emerald-600 text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            中文 [ZH]
          </button>
          <button
            onClick={() => { setLang('en'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              lang === 'en' ? 'bg-indigo-600 text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            English [EN]
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
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
            className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors border border-border"
          >
            查询
          </button>
        </form>
      </div>

      {/* Posts Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground font-medium border-b border-border">
              <tr>
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
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3.5 max-w-xs">
                      <div className="font-semibold text-foreground truncate">
                        {post.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">
                        /{post.slug}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {post.category ? (
                        <span className="px-2 py-0.5 rounded bg-secondary text-foreground">
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
                          <span>English [EN]</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Languages className="w-3 h-3" />
                          <span>中文 [ZH]</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => toggleStatus(post)}
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-medium transition-opacity hover:opacity-80 ${
                          post.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {post.status}
                      </button>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => toggleFeatured(post)}
                        className={`p-1 rounded hover:bg-secondary transition-colors ${
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
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-medium border border-border transition-colors"
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
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20 transition-colors disabled:opacity-50"
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

                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="inline-flex p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="查看前台"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/admin/posts/edit/${post.id}`}
                        className="inline-flex p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="编辑文章"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="inline-flex p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                        title="删除文章"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    {loading ? '加载中...' : '暂无匹配文章'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
