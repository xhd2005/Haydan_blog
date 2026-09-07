import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, Code, MapPin, Sparkles, Clock, Heart, Users, Languages } from 'lucide-react';
import { api } from '@/lib/api';
import { Post, Project, Journey, NowRecord, SiteSetting, Memo } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { AmbientMusicPlayer } from '@/components/AmbientMusicPlayer';
import { BentoGrid } from '@/components/bento/BentoGrid';
import { HeroPinnedScrollytelling } from '@/components/home/HeroPinnedScrollytelling';
import { getServerTranslation } from '@/lib/i18n-server';

async function getHomeData() {
  try {
    const [latestPosts, featuredProjects, latestJourneys, now, settings, memosData] = await Promise.all([
      api.getLatestPosts(8).catch(() => [] as Post[]),
      api.getFeaturedProjects().catch(() => [] as Project[]),
      api.getLatestJourneys(3).catch(() => [] as Journey[]),
      api.getNow().catch(() => null as NowRecord | null),
      api.getSettings().catch(() => null as SiteSetting | null),
      api.getMemos({ page: 1, pageSize: 2 }).catch(() => ({ records: [] as Memo[] })),
    ]);
    return { 
      latestPosts, 
      featuredProjects, 
      latestJourneys, 
      now, 
      settings,
      latestMemos: memosData?.records || [] 
    };
  } catch (e) {
    return { latestPosts: [], featuredProjects: [], latestJourneys: [], now: null, settings: null, latestMemos: [] };
  }
}

export const revalidate = 60;

export default async function HomePage() {
  const { locale, t } = getServerTranslation();
  const { latestPosts: rawLatestPosts, featuredProjects, latestJourneys, now, settings, latestMemos } = await getHomeData();

  // 双语自适应去重与过滤
  let latestPosts: Post[] = [];
  if (locale === 'en') {
    const translatedZhIds = new Set<number>();
    rawLatestPosts.forEach((p) => {
      if (p.lang === 'en' && p.translationPostId) {
        translatedZhIds.add(p.translationPostId);
      }
    });
    latestPosts = rawLatestPosts.filter((p) => {
      if (p.lang === 'en') return true;
      if (translatedZhIds.has(p.id)) return false;
      if (p.translationPostId && p.translationPost?.status === 'PUBLISHED') return false;
      return true;
    });
    latestPosts.sort((a, b) => {
      const aScore = a.lang === 'en' ? 0 : 1;
      const bScore = b.lang === 'en' ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      return 0;
    });
  } else {
    const translatedEnIds = new Set<number>();
    rawLatestPosts.forEach((p) => {
      if (p.lang === 'zh' && p.translationPostId) {
        translatedEnIds.add(p.translationPostId);
      }
    });
    latestPosts = rawLatestPosts.filter((p) => {
      if (p.lang === 'zh' || !p.lang) return true;
      if (translatedEnIds.has(p.id)) return false;
      if (p.translationPostId && p.translationPost?.status === 'PUBLISHED') return false;
      return true;
    });
  }
  latestPosts = latestPosts.slice(0, 3);

  const heroTitle = settings?.heroTitle || (locale === 'en' ? 'From the East,' : '基于东方，');
  const heroSlogan = settings?.heroSlogan || (locale === 'en' ? 'toward the unknown.' : '探索未知。');
  const heroDesc = settings?.heroDescription || t('home.hero_default_desc');

  let pulseData = null;
  if (settings?.lifePulseJson) {
    try {
      pulseData = JSON.parse(settings.lifePulseJson);
    } catch {}
  }

  return (
    <div className="space-y-20 md:space-y-28">
      {/* 0. Top Announcement Banner (Configurable in CMS) */}
      <AnnouncementBanner
        enabled={settings?.announcementEnabled}
        text={settings?.announcementText}
        link={settings?.announcementLink}
      />

      {/* 1. Hero Section (Dynamic from Site Settings & Locale) */}
      <section className="relative pt-6 md:pt-14 pb-4 overflow-hidden">
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-secondary text-muted-foreground border border-border">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>{t('home.badge')}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] text-foreground">
            {heroTitle} <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              {heroSlogan}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl font-normal">
            {heroDesc}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-all shadow-md hover:shadow-lg"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('home.read_thoughts')}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/journey"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors border border-border"
            >
              <Compass className="w-4 h-4 text-emerald-500" />
              <span>{t('home.explore_journey')}</span>
            </Link>

            <Link
              href="/memos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary/50 text-foreground font-medium hover:bg-secondary transition-colors border border-border"
            >
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>{t('home.memos')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 1.2 3D 几何罗盘滚动解构吸附舞台 (Scrollytelling) */}
      <HeroPinnedScrollytelling />

      {/* 1.5 Bento Grid (Spatial Aesthetics, Cosmos Graph & Life Pulse) */}
      <BentoGrid
        featuredPost={latestPosts[0] || null}
        latestMemo={latestMemos[0] || null}
        latestJourney={latestJourneys[0] || null}
        pulseData={pulseData}
      />

      {/* 2. Latest Thoughts (Blog) */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-500 font-semibold">
              {t('home.section_writing')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
              {t('home.latest_thoughts')}
            </h2>
          </div>
          <Link
            href="/blog"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{t('home.view_all_posts')}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestPosts.length > 0 ? (
            latestPosts.map((post) => (
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    {post.category && (
                      <span className="px-2 py-0.5 rounded-md bg-secondary font-medium text-foreground">
                        {post.category.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTime} {t('home.min_read')}
                    </span>
                    {post.likeCount > 0 && (
                      <span className="flex items-center gap-1 text-rose-500">
                        <Heart className="w-3 h-3 fill-rose-500" />
                        {post.likeCount}
                      </span>
                    )}

                    {/* 英文模式下未翻译的中文文章展示 [ZH / 中文] 徽标 */}
                    {locale === 'en' && post.lang === 'zh' && (
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ml-auto"
                        title="Original article in Chinese (Not yet translated)"
                      >
                        <Languages className="w-3 h-3" />
                        <span>ZH / 中文</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-foreground group-hover:text-emerald-500 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.excerpt || t('home.read_excerpt')}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN') : t('common.recently')}</span>
                  <span className="group-hover:translate-x-1 transition-transform text-foreground font-medium flex items-center gap-0.5">
                    {t('home.read_more')}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
              {t('blog.empty')}
            </div>
          )}
        </div>
      </section>

      {/* 3. Featured Projects */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-teal-500 font-semibold">
              {t('home.section_creations')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
              {t('home.featured_projects')}
            </h2>
          </div>
          <Link
            href="/projects"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{t('home.view_all_projects')}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredProjects.map((proj) => (
            <div
              key={proj.id}
              className="flex flex-col justify-between p-6 rounded-2xl bg-card border border-border hover:border-teal-500/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="space-y-4">
                {proj.cover && (
                  <SafeImage
                    src={proj.cover}
                    alt={proj.name}
                    aspectRatio="21/9"
                    containerClassName="w-full rounded-xl overflow-hidden"
                    className="hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/projects/${proj.slug}`}>
                      <h3 className="text-xl font-bold text-foreground hover:text-teal-500 transition-colors">
                        {proj.name}
                      </h3>
                    </Link>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-secondary text-foreground border border-border">
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                {proj.technologies && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {proj.technologies.split(',').map((tech) => (
                      <span
                        key={tech}
                        className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-mono"
                      >
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 mt-4 flex items-center gap-4 text-xs font-medium">
                <Link
                  href={`/projects/${proj.slug}`}
                  className="text-foreground hover:text-teal-500 transition-colors underline underline-offset-4"
                >
                  {t('home.case_study')}
                </Link>
                {proj.githubUrl && (
                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                )}
                {proj.demoUrl && (
                  <a
                    href={proj.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Memos Snippet Section */}
      {latestMemos.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-rose-500 font-semibold">
                {t('home.section_realtime')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
                {t('home.latest_memos')}
              </h2>
            </div>
            <Link
              href="/memos"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{t('home.view_all_memos')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {latestMemos.map((memo) => (
              <div key={memo.id} className="p-6 rounded-3xl bg-card border border-border space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{new Date(memo.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}</span>
                  <span className="text-rose-500 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" /> {memo.likeCount}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                  {memo.content}
                </p>
                <div className="pt-2">
                  <Link href="/memos" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                    {t('home.view_memo_stream')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Journey Preview */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-500 font-semibold">
              {t('home.section_exploration')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
              {t('home.journey_preview')}
            </h2>
          </div>
          <Link
            href="/journey"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{t('home.view_all_journeys')}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestJourneys.map((j) => (
            <Link
              key={j.id}
              href={`/journey/${j.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-cyan-500/50 hover:shadow-lg transition-all"
            >
              {j.cover && (
                <SafeImage
                  src={j.cover}
                  alt={j.title}
                  aspectRatio="4/3"
                  containerClassName="w-full overflow-hidden"
                  className="group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{j.country} · {j.city}</span>
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-cyan-500 transition-colors">
                  {j.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {j.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Now Preview */}
      {now && (
        <section className="p-8 rounded-3xl bg-secondary/50 border border-border relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {t('home.doing_now')}
              </h2>
            </div>
            <Link
              href="/now"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('home.full_now')}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-2xl bg-background/80 border border-border/80 space-y-2">
              <span className="text-xs font-mono uppercase text-emerald-500 font-semibold tracking-wider">
                {t('now.learning_title')}
              </span>
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
                {now.learning || t('now.learning_default')}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-background/80 border border-border/80 space-y-2">
              <span className="text-xs font-mono uppercase text-teal-500 font-semibold tracking-wider">
                {t('now.building_title')}
              </span>
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
                {now.building || t('now.building_default')}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-background/80 border border-border/80 space-y-2">
              <span className="text-xs font-mono uppercase text-cyan-500 font-semibold tracking-wider">
                {t('now.exploring_title')}
              </span>
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
                {now.exploring || t('now.exploring_default')}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-background/80 border border-border/80 space-y-2">
              <span className="text-xs font-mono uppercase text-indigo-500 font-semibold tracking-wider">
                {t('now.thinking_title')}
              </span>
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
                {now.thinking || t('now.thinking_default')}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 7. About Preview (Dynamic Bio & Avatar from CMS) */}
      <section className="p-8 sm:p-12 rounded-3xl border border-border bg-card flex flex-col md:flex-row items-center gap-8">
        <SafeImage
          src={settings?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces'}
          alt="Hayden Xue Avatar"
          aspectRatio="1/1"
          containerClassName="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 border-2 border-border shadow-md"
        />
        <div className="space-y-4 flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-foreground">
            {t('home.hey_intro')} Hayden Xue
          </h2>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            {locale === 'en' 
              ? (settings?.aboutBioEn || (settings?.bio && !settings.bio.includes('我相信代码') ? settings.bio : t('home.about_bio_default')))
              : (settings?.aboutBioZh || settings?.bio || t('home.about_bio_default'))}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 text-foreground hover:text-emerald-500 transition-colors"
            >
              <span>{t('home.about_me_link')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Ambient Music Player (Configurable via Settings) */}
      <AmbientMusicPlayer musicUrl={settings?.bgMusicUrl} />
    </div>
  );
}
