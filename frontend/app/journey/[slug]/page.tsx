import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { SafeImage } from '@/components/SafeImage';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { CommentSection } from '@/components/CommentSection';
import { ReadingProgress } from '@/components/ReadingProgress';
import { TableOfContents } from '@/components/TableOfContents';
import { getServerTranslation } from '@/lib/i18n-server';
import { ResonanceNexus } from '@/components/garden/ResonanceNexus';
import { JourneyFullBleedHero } from '@/components/journey/JourneyFullBleedHero';
import { Image as ImageIcon, Compass, MapPin, Sparkles } from 'lucide-react';

interface JourneyDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: JourneyDetailPageProps) {
  try {
    const data = await api.getJourneyBySlug(params.slug);
    return {
      title: data.journey.title,
      description: data.journey.description,
      openGraph: {
        title: data.journey.title,
        description: data.journey.description,
        images: data.journey.cover ? [data.journey.cover] : [],
      },
    };
  } catch {
    return { title: 'Journey Not Found' };
  }
}

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const journeys = await api.getJourneys();
    return (journeys || []).map((j) => ({
      slug: j.slug,
    }));
  } catch {
    return [];
  }
}

export default async function JourneyDetailPage({ params }: JourneyDetailPageProps) {
  const { t } = getServerTranslation();
  let data;
  try {
    data = await api.getJourneyBySlug(params.slug);
  } catch {
    notFound();
  }

  const { journey, images } = data;

  const [posts, projects] = await Promise.all([
    api.getLatestPosts(2).catch(() => []),
    api.getFeaturedProjects().catch(() => []),
  ]);

  return (
    <>
      {/* 顶部细腻阅读进度条 */}
      <ReadingProgress />

      <div className="w-full">
        {/* 1. 100vw 全景通栏风光首屏 (右上角加盖 VisaStamp 签证印章) */}
        <JourneyFullBleedHero
          journey={journey}
          translations={{
            backJourney: t('detail.back_journey'),
          }}
        />

        {/* 2. 白瓷画卷微重叠层叠 (Overlapping Sheet) 
             浅色微磨砂雪白瓷面，深色曜石黑磨砂，-mt-10~-mt-16 优雅重叠压在封面底沿，
             彻底消除生硬死板的渐变发灰感，重现现代艺术杂志的立体景深 */}
        <div className="relative z-30 -mt-10 sm:-mt-14 lg:-mt-16">
          <div className="w-full bg-[#fbfbfd]/95 dark:bg-[#090a0f]/95 backdrop-blur-2xl rounded-t-[2.5rem] sm:rounded-t-[3rem] border-t border-slate-200/80 dark:border-white/[0.08] shadow-[0_-16px_40px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.7)] transition-colors duration-300">
            <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14 items-start">
                
                {/* 核心正文主干 (与上方大标题严格共享 980px 宽阔主阅读道) */}
                <main className="lg:col-span-8 xl:col-span-9 space-y-10 min-w-0 max-w-[980px]">
                  {/* 游记游思故事正文 */}
                  <article className="prose-custom max-w-none leading-relaxed text-foreground/90">
                    <MarkdownViewer content={journey.content || t('journey.no_content')} />
                  </article>

                  {/* 旅途摄影影集相册 (现代艺术自适应 2 列磨砂卡片墙) */}
                  {images && images.length > 0 && (
                    <div className="space-y-6 pt-10 border-t border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                            {t('journey.gallery')}
                          </h2>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            Visual Chronicles & Moments ({images.length})
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                        {images.map((img) => (
                          <div
                            key={img.id}
                            className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-neutral-900/50 border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <div className="overflow-hidden">
                              <SafeImage
                                src={img.imageUrl}
                                alt={img.caption || journey.title}
                                aspectRatio="4/3"
                                containerClassName="w-full"
                                className="group-hover:scale-105 transition-transform duration-500 ease-out"
                              />
                            </div>
                            {img.caption && (
                              <div className="p-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-slate-200/60 dark:border-white/[0.06]">
                                <p className="text-xs text-center text-muted-foreground font-mono truncate">
                                  {img.caption}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 读者评论与交互区 (与正文主轴像素级对齐) */}
                  <div className="pt-8 border-t border-border">
                    <CommentSection targetType="JOURNEY" targetId={journey.id} />
                  </div>
                </main>

                {/* 右翼伴读侧栏：导轨目录 + 行旅时空档案 + 思维回响 + 站长档案 */}
                <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 sticky top-28">
                  {/* 1. 极简导轨目录 */}
                  <TableOfContents />

                  {/* 2. 行旅时空档案名片 */}
                  <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                      <Compass className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Travel Dossier</span>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                        <span className="text-muted-foreground">Destination</span>
                        <span className="font-semibold text-foreground">{journey.country} · {journey.city}</span>
                      </div>
                      {journey.startDate && (
                        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                          <span className="text-muted-foreground">Stardate</span>
                          <span className="font-mono text-cyan-600 dark:text-cyan-400 font-medium">
                            {journey.startDate.replace(/-/g, '.')}
                          </span>
                        </div>
                      )}
                      {journey.latitude && journey.longitude && (
                        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                          <span className="text-muted-foreground">GPS Locus</span>
                          <span className="font-mono text-muted-foreground">
                            {Number(journey.latitude).toFixed(2)}°N, {Number(journey.longitude).toFixed(2)}°E
                          </span>
                        </div>
                      )}
                      {images && images.length > 0 && (
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-muted-foreground">Frames</span>
                          <span className="font-mono text-foreground font-semibold">{images.length} Captures</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. 数字花园思维回响 (关联行旅与工程造物) */}
                  <ResonanceNexus
                    currentType="JOURNEY"
                    posts={posts}
                    projects={projects}
                    variant="sidebar"
                  />

                  {/* 4. 站长档案名片 (严格 Hayden Xue) */}
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
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold border border-cyan-500/20">
                            Traveler
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                          Explorer · Architect
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('detail.author_bio')}
                    </p>
                  </div>
                </aside>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
