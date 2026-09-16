import React from 'react';
import { api } from '@/lib/api';
import { Post, Category, Tag, PageVisualsConfig, SiteSetting } from '@/lib/types';
import { getServerTranslation } from '@/lib/i18n-server';
import { BlogBentoHero } from '@/components/blog/BlogBentoHero';
import { BlogInteractiveContainer } from '@/components/blog/BlogInteractiveContainer';
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
  const { locale, t } = getServerTranslation();
  return {
    title: `${t('blog.title')} | Hayden Xue`,
    description: t('blog.desc'),
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { locale, t } = getServerTranslation();
  const currentPage = Number(searchParams.page) || 1;
  const currentCategory = searchParams.category;
  const currentTag = searchParams.tag;

  // 1. 数据并发获取：文章列表、分类元数据与站点配置（用于获取后台自定义页面视觉背景）
  const [postsData, categories, settings] = await Promise.all([
    api.getPosts({
      page: currentPage,
      pageSize: 18,
      category: currentCategory,
      tag: currentTag,
      lang: searchParams.lang,
    }).catch(() => ({ records: [] as Post[], total: 0, page: 1, pageSize: 18 })),
    api.getCategories().catch(() => [] as Category[]),
    api.getSettings().catch(() => null as SiteSetting | null),
  ]);

  // 解析后台页面视觉背景配置
  let pageVisuals: PageVisualsConfig = {};
  try {
    if (settings?.pageVisualsJson) {
      pageVisuals = JSON.parse(settings.pageVisualsJson);
    }
  } catch {}

  // 2. 双语自适应过滤与智能去重算法
  const rawPosts = postsData.records;
  let displayPosts: Post[] = [];

  if (locale === 'en') {
    // 英文模式：优先展示英文版，如无对应翻译则去重展示中文 fallback
    const translatedZhIds = new Set<number>();
    rawPosts.forEach((p) => {
      if (p.lang === 'en' && p.translationPostId) {
        translatedZhIds.add(p.translationPostId);
      }
    });

    displayPosts = rawPosts.filter((p) => {
      if (p.lang === 'en') return true;
      if (translatedZhIds.has(p.id)) return false;
      if (p.translationPostId && p.translationPost?.status === 'PUBLISHED') return false;
      return true;
    });

    displayPosts.sort((a, b) => {
      const aScore = a.lang === 'en' ? 0 : 1;
      const bScore = b.lang === 'en' ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      if (b.featured !== a.featured) return b.featured - a.featured;
      return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
    });
  } else {
    // 中文模式：优先展示中文版
    const translatedEnIds = new Set<number>();
    rawPosts.forEach((p) => {
      if (p.lang === 'zh' && p.translationPostId) {
        translatedEnIds.add(p.translationPostId);
      }
    });

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

  // 3. 抽取置顶精华手记作为全景巨幕核心内容
  let heroPost: Post | null = null;
  let remainingPosts: Post[] = [...displayPosts];

  if (currentPage === 1 && displayPosts.length > 0) {
    const featuredIndex = displayPosts.findIndex((p) => p.featured === 1);
    if (featuredIndex !== -1) {
      heroPost = displayPosts[featuredIndex];
      remainingPosts = displayPosts.filter((_, idx) => idx !== featuredIndex);
    } else {
      heroPost = displayPosts[0];
      remainingPosts = displayPosts.slice(1);
    }
  }

  const totalPages = Math.ceil((postsData.total || 0) / (postsData.pageSize || 18)) || 1;

  return (
    <div className="w-full min-h-screen bg-[#fbfbfd] dark:bg-[#090a0f] transition-colors duration-300">
      {/* 1. 现代双层策展式 Bento 首屏 (Curated Bento Garden Hero) */}
      <BlogBentoHero
        featuredPost={heroPost || undefined}
        recentPosts={remainingPosts.slice(0, 2)}
        categories={categories}
        totalPosts={postsData.total || displayPosts.length}
        pageVisual={pageVisuals.blog}
        locale={locale}
        translations={{
          badge: t('blog.badge'),
          readMore: t('home.read_more'),
          readingTime: t('home.min_read'),
          defaultTitle: t('blog.title'),
          defaultDesc: t('blog.desc'),
        }}
      />

      {/* 2. 手记矩阵与交互过滤流 (平滑衔接，彻底告别与详情页撞车的 -mt-16 假抽屉) */}
      <div className="relative z-20 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 pb-24">
        <BlogInteractiveContainer
          posts={currentPage === 1 && heroPost ? remainingPosts : displayPosts}
          categories={categories}
          currentCategory={currentCategory}
          currentPage={currentPage}
          totalPages={totalPages}
          locale={locale}
          translations={{
            all: t('blog.all'),
            searchPlaceholder: t('blog.search_placeholder'),
            searchNoResults: t('blog.search_no_results'),
            clearSearch: t('blog.clear_search'),
            viewGrid: t('blog.view_grid'),
            viewList: t('blog.view_list'),
            empty: t('blog.empty'),
            clickToRead: t('blog.click_to_read'),
            minRead: t('home.min_read'),
            readMore: t('home.read_more'),
            prev: t('blog.prev'),
            next: t('blog.next'),
            pageOf: t('blog.page_of'),
            zhFallback: t('badge.zh_fallback'),
          }}
        />
      </div>
    </div>
  );
}
