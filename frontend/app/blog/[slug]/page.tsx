import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { SafeImage } from '@/components/SafeImage';
import { ReadingProgress } from '@/components/ReadingProgress';
import { TableOfContents } from '@/components/TableOfContents';
import { LikeButton } from '@/components/LikeButton';
import { CommentSection } from '@/components/CommentSection';
import { ArrowLeft, Calendar, Clock, Eye, Tag as TagIcon, Heart } from 'lucide-react';
import { getServerTranslation } from '@/lib/i18n-server';
import { ArticleBilingualInteractive } from '@/components/ArticleBilingualInteractive';
import { ArticleInteractiveWrapper } from '@/components/ArticleInteractiveWrapper';

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

export const revalidate = 60;

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, t } = getServerTranslation();
  let post;
  try {
    post = await api.getPostBySlug(params.slug);
  } catch {
    notFound();
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : t('common.recently', locale === 'en' ? 'Recently' : '近期');

  return (
    <>
      {/* 顶部细腻阅读进度条 */}
      <ReadingProgress />

      <div className="max-w-5xl mx-auto space-y-10">
        {/* Back to Blog */}
        <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>{t('detail.back_blog', locale === 'en' ? 'Back to all posts' : '返回文章列表')}</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="space-y-6 max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="px-2.5 py-1 rounded-full bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                {post.category.name}
              </Link>
            )}
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime} {t('detail.reading_time', locale === 'en' ? 'min read' : '分钟阅读')}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Eye className="w-3.5 h-3.5" />
              {post.viewCount} {t('detail.views', locale === 'en' ? 'views' : '次浏览')}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.2]">
            {post.title}
          </h1>

          {/* 双语对齐直达与 Friendly Fallback 友好提示条 */}
          <ArticleBilingualInteractive post={post} />

          {post.excerpt && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed italic border-l-2 border-emerald-500 pl-4">
              {post.excerpt}
            </p>
          )}

          {/* Cover Image */}
          {post.cover && (
            <SafeImage
              src={post.cover}
              alt={post.title}
              aspectRatio="21/9"
              containerClassName="w-full rounded-2xl border border-border shadow-md"
            />
          )}
        </header>

        {/* Content & TOC Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pt-4 border-t border-border">
          {/* Left / Center: Article Content */}
          <div className="lg:col-span-3 space-y-10 max-w-[70ch]">
            <ArticleInteractiveWrapper post={post}>
              <article className="prose-custom">
                <MarkdownViewer content={post.content || ''} />
              </article>
            </ArticleInteractiveWrapper>

            {/* Like and Reactions */}
            <div className="pt-8 border-t border-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-foreground">
                  {t('detail.like_prompt', locale === 'en' ? 'Enjoyed this article?' : '喜欢这篇手记？')}
                </span>
                <p className="text-xs text-muted-foreground">
                  {t('detail.like_sub', locale === 'en' ? 'Like without sign-in to support ongoing writing.' : '免登录点赞，支持创作者持续输出。')}
                </p>
              </div>
              <LikeButton id={post.id} initialLikes={post.likeCount} type="post" />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="pt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
                  <TagIcon className="w-3.5 h-3.5" /> {t('detail.tags', locale === 'en' ? 'Tags' : '标签')}:
                </span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog?tag=${tag.slug}`}
                    className="px-3 py-1 rounded-md bg-secondary text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Author Card */}
            <div className="p-6 rounded-2xl bg-card border border-border flex items-center gap-5">
              <SafeImage
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces"
                alt="Hayden Xue"
                aspectRatio="1/1"
                containerClassName="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-border"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-foreground">Hayden Xue</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                    {t('detail.author', locale === 'en' ? 'Author' : '作者')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('detail.author_bio', locale === 'en' ? 'From the East, toward the unknown. Exploring tech, AI, and the world.' : 'From the East, toward the unknown. 记录技术、AI、建筑摄影与长期成长。')}
                </p>
              </div>
            </div>

            {/* Prev / Next Post Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              {post.prevPost ? (
                <Link
                  href={`/blog/${post.prevPost.slug}`}
                  className="p-4 rounded-xl border border-border hover:bg-secondary/40 transition-colors space-y-1 group"
                >
                  <span className="text-xs text-muted-foreground">
                    &larr; {t('detail.prev', locale === 'en' ? 'Previous' : '上一篇')}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-emerald-500 line-clamp-1 transition-colors">
                    {post.prevPost.title}
                  </h4>
                </Link>
              ) : (
                <div />
              )}

              {post.nextPost && (
                <Link
                  href={`/blog/${post.nextPost.slug}`}
                  className="p-4 rounded-xl border border-border hover:bg-secondary/40 transition-colors space-y-1 text-right group sm:col-start-2"
                >
                  <span className="text-xs text-muted-foreground">
                    {t('detail.next', locale === 'en' ? 'Next' : '下一篇')} &rarr;
                  </span>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-emerald-500 line-clamp-1 transition-colors">
                    {post.nextPost.title}
                  </h4>
                </Link>
              )}
            </div>

            {/* Related Posts */}
            {post.relatedPosts && post.relatedPosts.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-bold text-foreground">
                  {t('detail.related', locale === 'en' ? 'Related Articles' : '相关推荐')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {post.relatedPosts.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/blog/${rel.slug}`}
                      className="p-4 rounded-xl border border-border hover:border-emerald-500/40 bg-card transition-all group space-y-2"
                    >
                      {rel.cover && (
                        <SafeImage
                          src={rel.cover}
                          alt={rel.title}
                          aspectRatio="16/9"
                          containerClassName="w-full rounded-lg overflow-hidden"
                          className="group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-emerald-500 transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <CommentSection targetType="POST" targetId={post.id} />
          </div>

          {/* Right Sidebar: Table of Contents (Desktop Sticky) */}
          <aside className="hidden lg:block lg:col-span-1">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </>
  );
}
