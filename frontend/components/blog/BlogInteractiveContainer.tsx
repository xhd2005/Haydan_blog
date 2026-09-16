'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Post, Category } from '@/lib/types';
import { MagazineCard } from '@/components/ui/MagazineCard';
import { CompactPostRow } from '@/components/blog/CompactPostRow';
import { RevealStagger, RevealItem } from '@/components/ui/motion-primitives';
import { 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  Clock, 
  Languages, 
  FileText, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface BlogInteractiveContainerProps {
  posts: Post[];
  categories: Category[];
  currentCategory?: string;
  currentPage: number;
  totalPages: number;
  locale: string;
  translations: {
    all: string;
    searchPlaceholder: string;
    searchNoResults: string;
    clearSearch: string;
    viewGrid: string;
    viewList: string;
    empty: string;
    clickToRead: string;
    minRead: string;
    readMore: string;
    prev: string;
    next: string;
    pageOf: string;
    zhFallback: string;
  };
}

export function BlogInteractiveContainer({
  posts,
  categories,
  currentCategory,
  currentPage,
  totalPages,
  locale,
  translations: t,
}: BlogInteractiveContainerProps) {
  // 1. 视图模式状态 (grid: 大图网格 | list: 紧凑行列表)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // 挂载时从 localStorage 恢复用户视图首选项
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hayden_blog_view_mode');
      if (saved === 'grid' || saved === 'list') {
        setViewMode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleViewChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('hayden_blog_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // 2. 客户端即时过滤 (标题与摘要模糊匹配)
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((p) => {
      const matchTitle = p.title?.toLowerCase().includes(query);
      const matchExcerpt = p.excerpt?.toLowerCase().includes(query);
      const matchCategory = p.category?.name?.toLowerCase().includes(query);
      return matchTitle || matchExcerpt || matchCategory;
    });
  }, [posts, searchQuery]);

  // 分类 URL 生成工具
  const getCategoryUrl = (slug?: string) => {
    const p = new URLSearchParams();
    if (slug) p.set('category', slug);
    const s = p.toString();
    return s ? `/blog?${s}` : '/blog';
  };

  const getPageUrl = (page: number) => {
    const p = new URLSearchParams();
    if (currentCategory) p.set('category', currentCategory);
    if (page > 1) p.set('page', String(page));
    const s = p.toString();
    return s ? `/blog?${s}` : '/blog';
  };

  return (
    <div className="space-y-8">
      {/* 1. 控制栏：分类导航 + 即时搜索 + 视图切换器 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/70">
        {/* 左侧：分类切换胶囊 */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Link
            href={getCategoryUrl()}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              !currentCategory
                ? 'bg-foreground text-background font-semibold shadow-sm'
                : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            {t.all}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={getCategoryUrl(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                currentCategory === cat.slug
                  ? 'bg-foreground text-background font-semibold shadow-sm'
                  : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* 右侧：即时搜索框 + 视图切换胶囊 */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* 实时搜索框 */}
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-full bg-secondary/60 hover:bg-secondary focus:bg-background border border-border/70 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-foreground placeholder:text-muted-foreground transition-all duration-200 outline-none font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title={t.clearSearch}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 视图切换按钮组 */}
          <div className="flex items-center p-1 rounded-full bg-secondary/80 border border-border/70 shrink-0">
            <button
              type="button"
              onClick={() => handleViewChange('grid')}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={t.viewGrid}
              aria-label={t.viewGrid}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('list')}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={t.viewList}
              aria-label={t.viewList}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 搜索提示状态 */}
      {searchQuery && (
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono px-1">
          <span>
            {locale === 'zh' ? `匹配到 ${filteredPosts.length} 篇手记` : `Found ${filteredPosts.length} matching articles`}
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-emerald-500 hover:underline inline-flex items-center gap-1"
          >
            <span>{t.clearSearch}</span>
          </button>
        </div>
      )}

      {/* 2. 文章列表展示区 */}
      {filteredPosts.length > 0 ? (
        viewMode === 'grid' ? (
          /* 网格大图卡片模式 */
          <RevealStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <RevealItem key={post.id} className="h-full">
                <MagazineCard
                  href={`/blog/${post.slug}`}
                  title={post.title}
                  cover={post.cover}
                  excerpt={post.excerpt || t.clickToRead}
                  date={post.publishedAt || post.createdAt}
                  logId={post.id}
                  eyebrow={
                    post.category ? (
                      <span className="px-2 py-0.5 rounded-lg bg-secondary/90 font-medium text-foreground text-[11px] border border-border/40">
                        {post.category.name}
                      </span>
                    ) : undefined
                  }
                  footerLeft={
                    <>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {post.readingTime} {t.minRead}
                      </span>
                      {locale === 'en' && post.lang === 'zh' && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          title="Original article in Chinese"
                        >
                          <Languages className="w-3 h-3" />
                          <span>{t.zhFallback}</span>
                        </span>
                      )}
                    </>
                  }
                  readMoreText={t.readMore}
                />
              </RevealItem>
            ))}
          </RevealStagger>
        ) : (
          /* 紧凑列表模式 */
          <div className="flex flex-col space-y-3">
            {filteredPosts.map((post) => (
              <CompactPostRow
                key={post.id}
                post={post}
                locale={locale}
                minReadText={t.minRead}
              />
            ))}
          </div>
        )
      ) : (
        /* 空状态反馈 */
        <div className="py-20 text-center text-muted-foreground border border-dashed border-border/80 rounded-3xl space-y-3 bg-secondary/20">
          <FileText className="w-10 h-10 mx-auto text-emerald-500/50" />
          <p className="text-sm font-medium">
            {searchQuery ? t.searchNoResults : t.empty}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 text-xs font-mono text-emerald-500 hover:underline pt-1"
            >
              <span>{t.clearSearch}</span>
            </button>
          )}
        </div>
      )}

      {/* 3. 分页控件（仅在非即时搜索且总页数大于 1 时显示） */}
      {!searchQuery && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          {currentPage > 1 && (
            <Link
              href={getPageUrl(currentPage - 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {t.prev}
            </Link>
          )}
          <span className="text-sm text-muted-foreground font-mono">
            {t.pageOf.replace('{page}', String(currentPage)).replace('{total}', String(totalPages))}
          </span>
          {currentPage < totalPages && (
            <Link
              href={getPageUrl(currentPage + 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              {t.next} <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
