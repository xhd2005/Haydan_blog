import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { SafeImage } from '@/components/SafeImage';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { ReadingProgress } from '@/components/ReadingProgress';
import { TableOfContents } from '@/components/TableOfContents';
import { CommentSection } from '@/components/CommentSection';
import { Tag as TagIcon, Sparkles } from 'lucide-react';
import { getServerTranslation } from '@/lib/i18n-server';
import { ArticleBilingualInteractive } from '@/components/ArticleBilingualInteractive';
import { ArticleInteractiveWrapper } from '@/components/ArticleInteractiveWrapper';
import { ResonanceNexus } from '@/components/garden/ResonanceNexus';
import { ArticleFullBleedHero } from '@/components/blog/ArticleFullBleedHero';
import { AiConceptRadarDeck } from '@/components/blog/AiConceptRadarDeck';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { locale } = getServerTranslation();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haydenxue.com';

  try {
    const post = await api.getPostBySlug(params.slug);
    const canonicalUrl = `${siteUrl}/blog/${post.slug}`;

    // 构建 Google 标准 alternate hreflang 字典
    const languages: Record<string, string> = {};

    // 1. 注册当前文章自身的语言映射 (支持 BCP 47)
    if (post.lang === 'zh') {
      languages['zh-CN'] = canonicalUrl;
      languages['zh'] = canonicalUrl;
    } else {
      languages['en'] = canonicalUrl;
      languages['en-US'] = canonicalUrl;
    }

    // 2. 当关联译文存在且为已发布状态时，注入译文 alternate
    if (post.translationPost && post.translationPost.status === 'PUBLISHED') {
      const transUrl = `${siteUrl}/blog/${post.translationPost.slug}`;
      if (post.translationPost.lang === 'en') {
        languages['en'] = transUrl;
        languages['en-US'] = transUrl;
      } else {
        languages['zh-CN'] = transUrl;
        languages['zh'] = transUrl;
      }
      // 3. x-default 策略：指向主站默认版本（中文版）或首发版本
      languages['x-default'] = post.lang === 'zh' ? canonicalUrl : transUrl;
    }

    return {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      alternates: {
        canonical: canonicalUrl,
        languages: Object.keys(languages).length > 2 ? languages : undefined,
      },
      openGraph: {
        title: post.title,
        description: post.excerpt,
        images: post.cover ? [post.cover] : [],
        type: 'article',
        publishedTime: post.publishedAt || post.createdAt,
        locale: post.lang === 'zh' ? 'zh_CN' : 'en_US',
        alternateLocale:
          post.translationPost && post.translationPost.status === 'PUBLISHED'
            ? (post.lang === 'zh' ? 'en_US' : 'zh_CN')
            : undefined,
      },
    };
  } catch {
    return {
      title: locale === 'en' ? 'Article Not Found' : '文章未找到',
    };
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  try {
    const res = await api.getPosts({ page: 1, pageSize: 50 });
    return (res.records || []).map((post) => ({
      slug: post.slug,
    }));
  } catch {
    return [];
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, t } = getServerTranslation();
  let post;
  try {
    post = await api.getPostBySlug(params.slug);
  } catch {
    notFound();
  }

  const [journeys, projects] = await Promise.all([
    api.getLatestJourneys(2).catch(() => []),
    api.getFeaturedProjects().catch(() => []),
  ]);

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : t('common.recently');

  return (
    <>
      {/* 顶部细腻阅读进度条 */}
      <ReadingProgress />

      <div className="w-full">
        {/* 1. 通栏全景电影首屏 (大标题浮于大图黄金分割点，与下方正文同轴对齐) */}
        <ArticleFullBleedHero
          post={post}
          locale={locale}
          formattedDate={formattedDate}
          translations={{
            backBlog: t('detail.back_blog'),
            readingTime: t('detail.reading_time'),
            views: t('detail.views'),
          }}
        />

        {/* 2. 白瓷画卷微重叠层叠 (Overlapping Sheet)
             浅色微磨砂雪白瓷面，深色曜石黑磨砂，-mt-10~-mt-16 优雅重叠压在封面大图底沿，
             彻底消除生硬死板的渐变发灰感，重现现代艺术杂志的立体景深 */}
        <div className="relative z-30 -mt-10 sm:-mt-14 lg:-mt-16">
          <div className="w-full bg-[#fbfbfd]/95 dark:bg-[#090a0f]/95 backdrop-blur-2xl rounded-t-[2.5rem] sm:rounded-t-[3rem] border-t border-slate-200/80 dark:border-white/[0.08] shadow-[0_-16px_40px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.7)] transition-colors duration-300">
            <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14 items-start">
            {/* 核心正文主干 (与上方大标题严格共享 980px 宽阔主阅读道) */}
            <main className="lg:col-span-8 xl:col-span-9 space-y-8 min-w-0 max-w-[980px]">
              {/* 双语版本快速切换与 Friendly Fallback 友好提示条 */}
              <ArticleBilingualInteractive post={post} />

              {/* AI 全息概念雷达与 30 秒核心速读舱 */}
              <AiConceptRadarDeck post={post} />

              {/* 正文交互容器（支持字号动态缩放、伴读工具栏与划词显微镜） */}
              <ArticleInteractiveWrapper post={post}>
                <article className="prose-custom max-w-none leading-relaxed text-foreground/90">
                  <MarkdownViewer content={post.content || ''} />
                </article>
              </ArticleInteractiveWrapper>

              {/* 标签列表 */}
              {post.tags && post.tags.length > 0 && (
                <div className="pt-6 border-t border-border flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2 font-mono">
                    <TagIcon className="w-3.5 h-3.5" /> {t('detail.tags')}:
                  </span>
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/blog?tag=${tag.slug}`}
                      className="px-3 py-1 rounded-full bg-secondary/80 hover:bg-secondary text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border border-border/50"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* 上一篇 / 下一篇导航 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                {post.prevPost ? (
                  <Link
                    href={`/blog/${post.prevPost.slug}`}
                    className="p-4 rounded-2xl border border-border hover:border-emerald-500/40 bg-secondary/20 hover:bg-secondary/50 transition-all space-y-1 group"
                  >
                    <span className="text-xs text-muted-foreground font-mono">
                      &larr; {t('detail.prev')}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-1 transition-colors">
                      {post.prevPost.title}
                    </h4>
                  </Link>
                ) : (
                  <div />
                )}

                {post.nextPost && (
                  <Link
                    href={`/blog/${post.nextPost.slug}`}
                    className="p-4 rounded-2xl border border-border hover:border-emerald-500/40 bg-secondary/20 hover:bg-secondary/50 transition-all space-y-1 text-right group sm:col-start-2"
                  >
                    <span className="text-xs text-muted-foreground font-mono">
                      {t('detail.next')} &rarr;
                    </span>
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-1 transition-colors">
                      {post.nextPost.title}
                    </h4>
                  </Link>
                )}
              </div>

              {/* 评论交互区 (与正文主轴像素级对齐) */}
              <CommentSection targetType="POST" targetId={post.id} />
            </main>

            {/* 右翼伴读侧栏：导轨目录 + 数字花园思维回响 + 作者档案 + 相关手记 */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 sticky top-28">
              {/* 1. 极简导轨目录 */}
              <TableOfContents />

              {/* 2. 数字花园思维回响 (关联行旅与工程造物) */}
              <ResonanceNexus
                currentType="POST"
                journeys={journeys}
                projects={projects}
                variant="sidebar"
              />

              {/* 3. 作者档案名片 */}
              <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3">
                <div className="flex items-center gap-3.5">
                  <SafeImage
                    src={DEFAULT_AVATAR}
                    alt="Hayden Xue"
                    aspectRatio="1/1"
                    containerClassName="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-border shadow-inner"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-foreground">Hayden Xue</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                        {t('detail.author')}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                      Architect · Thinker
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('detail.author_bio')}
                </p>
              </div>

              {/* 4. 相关手记精选推荐 */}
              {post.relatedPosts && post.relatedPosts.length > 0 && (
                <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('detail.related')}</span>
                  </div>
                  <div className="space-y-3">
                    {post.relatedPosts.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/blog/${rel.slug}`}
                        className="group flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 transition-all border border-transparent hover:border-border/50"
                      >
                        {rel.cover && (
                          <div className="w-16 h-12 shrink-0 rounded-lg overflow-hidden">
                            <SafeImage
                              src={rel.cover}
                              alt={rel.title}
                              aspectRatio="16/9"
                              containerClassName="w-full h-full"
                              className="group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2 leading-snug transition-colors">
                            {rel.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  </div>
</>
  );
}
