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
import { ProjectFullBleedHero } from '@/components/projects/ProjectFullBleedHero';
import { Terminal, Github, Globe, Sparkles, Layers } from 'lucide-react';

interface ProjectDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  try {
    const project = await api.getProjectBySlug(params.slug);
    return {
      title: project.name,
      description: project.description,
      openGraph: {
        title: project.name,
        description: project.description,
        images: project.cover ? [project.cover] : [],
      },
    };
  } catch {
    return { title: 'Project Not Found' };
  }
}

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const projects = await api.getProjects();
    return (projects || []).map((p) => ({
      slug: p.slug,
    }));
  } catch {
    return [];
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { t } = getServerTranslation();
  let project;
  try {
    project = await api.getProjectBySlug(params.slug);
  } catch {
    notFound();
  }

  const [posts, journeys] = await Promise.all([
    api.getLatestPosts(2).catch(() => []),
    api.getLatestJourneys(2).catch(() => []),
  ]);

  const techList = project.technologies
    ? project.technologies.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <>
      {/* 顶部细腻阅读进度条 */}
      <ReadingProgress />

      <div className="w-full">
        {/* 1. 100vw 全景通栏工程首屏 (蓝图网格/封面大图 + 状态/源码直达胶囊) */}
        <ProjectFullBleedHero
          project={project}
          translations={{
            backProjects: t('detail.back_projects'),
            sourceCode: t('projects.source_code'),
            liveDemo: t('projects.live_demo'),
            present: t('projects.present'),
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
                  {/* 工程技术文档与架构手记正文 */}
                  <article className="prose-custom max-w-none leading-relaxed text-foreground/90">
                    <MarkdownViewer content={project.content || t('projects.no_content')} />
                  </article>

                  {/* 读者评论与工程技术交流互动区 (与正文主轴像素级对齐) */}
                  <div className="pt-8 border-t border-border">
                    <CommentSection targetType="PROJECT" targetId={project.id} />
                  </div>
                </main>

                {/* 右翼伴读侧栏：导轨目录 + 极客工程档案 + 思维回响 + 站长档案 */}
                <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 sticky top-28">
                  {/* 1. 极简导轨目录 */}
                  <TableOfContents />

                  {/* 2. 极客工程档案名片 */}
                  <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                      <Terminal className="w-3.5 h-3.5 text-teal-500" />
                      <span>Project Spec</span>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                        <span className="text-muted-foreground">Lifecycle</span>
                        <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold uppercase">
                          {project.status}
                        </span>
                      </div>
                      {project.startDate && (
                        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                          <span className="text-muted-foreground">Timeline</span>
                          <span className="font-mono text-muted-foreground">
                            {project.startDate} ~ {project.endDate || t('projects.present')}
                          </span>
                        </div>
                      )}
                      {project.githubUrl && (
                        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                          <span className="text-muted-foreground">Repository</span>
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-foreground hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>GitHub</span>
                          </a>
                        </div>
                      )}
                      {project.demoUrl && (
                        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                          <span className="text-muted-foreground">Deployment</span>
                          <a
                            href={project.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Live Site</span>
                          </a>
                        </div>
                      )}
                      {techList.length > 0 && (
                        <div className="pt-1.5 space-y-2">
                          <span className="text-muted-foreground block">Stack Badges</span>
                          <div className="flex flex-wrap gap-1.5">
                            {techList.map((t) => (
                              <span
                                key={t}
                                className="px-2.5 py-0.5 rounded-md bg-secondary/80 text-[11px] font-mono text-muted-foreground border border-border/60"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. 数字花园思维回响 (关联手记博文与行旅) */}
                  <ResonanceNexus
                    currentType="PROJECT"
                    posts={posts}
                    journeys={journeys}
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
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/20">
                            Architect
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                          Creator · Engineer
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
