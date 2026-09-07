import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Post, Category, Tag } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { getServerTranslation } from '@/lib/i18n-server';
import { Clock, Calendar, Tag as TagIcon, Folder, ChevronLeft, ChevronRight, Languages } from 'lucide-react';
import type { Metadata } from 'next';

interface BlogPageProps {
  searchParams: {
    page?: string;
    category?: string;
    tag?: string;
    lang?: string;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'Articles & Thoughts | Hayden Xue' : '手记与深度思考 | Hayden Xue',
    description: 'Articles on software engineering, architecture, AI, and evergreen thoughts.',
  };
}

export const revalidate = 60;

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { locale, t } = getServerTranslation();
  const currentPage = Number(searchParams.page) || 1;
  const currentCategory = searchParams.category;
  const currentTag = searchParams.tag;

  const [postsData, categories, tags] = await Promise.all([
    api.getPosts({
      page: currentPage,
      pageSize: 12,
      category: currentCategory,
      tag: currentTag,
      lang: searchParams.lang,
    }).catch(() => ({ records: [] as Post[], total: 0, page: 1, pageSize: 12 })),
    api.getCategories().catch(() => [] as Category[]),
    api.getTags().catch(() => [] as Tag[]),
  ]);

  // 双语自适应过滤与智能去重算法：
  const rawPosts = postsData.records;
  let displayPosts: Post[] = [];

  if (locale === 'en') {
    // 英文模式：
    // 1. 记录已发布的英文文章所关联的中文文章 ID
    const translatedZhIds = new Set<number>();
    rawPosts.forEach((p) => {
      if (p.lang === 'en' && p.translationPostId) {
        translatedZhIds.add(p.translationPostId);
      }
    });

    // 2. 去重过滤：如果某篇中文文章已有英文版，则自动隐藏中文版，杜绝重复；
    // 未翻译的中文文章保留在列表中作为回退，避免列表空洞
    displayPosts = rawPosts.filter((p) => {
      if (p.lang === 'en') return true;
      if (translatedZhIds.has(p.id)) return false;
      if (p.translationPostId && p.translationPost?.status === 'PUBLISHED') return false;
      return true;
    });

    // 3. 排序权重：优先展示英文博文，未翻译中文博文排在后面
    displayPosts.sort((a, b) => {
      const aScore = a.lang === 'en' ? 0 : 1;
      const bScore = b.lang === 'en' ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      if (b.featured !== a.featured) return b.featured - a.featured;
      return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
    });
  } else {
    // 中文模式：
    // 记录已发布的中文文章所关联的英文文章 ID
    const translatedEnIds = new Set<number>();
    rawPosts.forEach((p) => {
      if (p.lang === 'zh' && p.translationPostId) {
        translatedEnIds.add(p.translationPostId);
      }
    });

    // 默认展示中文文章；若存在纯英文创作且未翻译，则保留；如果英文文章已有中文版，则隐藏英文版
    displayPosts = rawPosts.filter((p) => {
      if (p.lang === 'zh' || !p.lang) return true;
      if (translatedEnIds.has(p.id)) return false;
      if (p.translationPostId && p.translationPost?.status === 'PUBLISHED') return false;
      return true;
    });

    displayPosts.sort((a, b) => {
      const aScore = a.lang === 'zh' || !a.lang ? 0 : 1;
      const bScore = b.lang === 'zh' || !b.lang ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      if (b.featured !== a.featured) return b.featured - a.featured;
      return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
    });
  }

  const totalPages = Math.ceil(postsData.total / postsData.pageSize) || 1;

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <span className="text-xs uppercase font-mono tracking-widest text-emerald-500 font-semibold">
          {t('blog.badge')}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {t('blog.title')}
        </h1>
        <p className="text-muted-foreground text-base max-w-2xl">
          {t('blog.desc')}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <Link
          href="/blog"
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            !currentCategory
              ? 'bg-foreground text-background font-semibold shadow-sm'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('blog.all')}
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/blog?category=${cat.slug}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentCategory === cat.slug
                ? 'bg-foreground text-background font-semibold shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Articles Grid */}
      {displayPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col justify-between p-5 rounded-2xl bg-card border border-border hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="space-y-3">
                {post.cover && (
                  <SafeImage
                    src={post.cover}
                    alt={post.title}
                    aspectRatio="16/9"
                    containerClassName="w-full rounded-xl overflow-hidden"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-2">
                    {post.category && (
                      <span className="px-2 py-0.5 rounded bg-secondary font-medium text-foreground">
                        {post.category.name}
                      </span>
                    )}
                    {post.maturity && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold">
                        {post.maturity === 'EVERGREEN' ? '🌲 常青' : post.maturity === 'SEEDLING' ? '🌱 萌芽' : '🌿 生长'}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTime} {t('home.min_read')}
                    </span>
                  </div>

                  {/* 英文模式下未翻译的中文文章展示 [ZH / 中文] 徽标 */}
                  {locale === 'en' && post.lang === 'zh' && (
                    <span 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      title="Original article in Chinese (Not yet translated)"
                    >
                      <Languages className="w-3 h-3" />
                      <span>{t('badge.zh_fallback')}</span>
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-lg text-foreground group-hover:text-emerald-500 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {post.excerpt || t('blog.click_to_read')}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN') : t('common.recently')}</span>
                <span className="group-hover:translate-x-1 transition-transform text-foreground font-medium flex items-center gap-0.5">
                  {t('home.read_more')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
          {t('blog.empty')}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          {currentPage > 1 && (
            <Link
              href={`/blog?page=${currentPage - 1}${currentCategory ? `&category=${currentCategory}` : ''}`}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {t('blog.prev')}
            </Link>
          )}
          <span className="text-sm text-muted-foreground font-mono">
            {t('blog.page_of').replace('{page}', String(currentPage)).replace('{total}', String(totalPages))}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/blog?page=${currentPage + 1}${currentCategory ? `&category=${currentCategory}` : ''}`}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              {t('blog.next')} <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
