import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { SafeImage } from '@/components/SafeImage';
import { getServerTranslation } from '@/lib/i18n-server';
import { ArrowLeft, Github, Globe, Calendar, Layers } from 'lucide-react';

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
    };
  } catch {
    return { title: 'Project Not Found' };
  }
}

export const revalidate = 60;

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { t } = getServerTranslation();
  let project;
  try {
    project = await api.getProjectBySlug(params.slug);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{t('detail.back_projects')}</span>
        </Link>
      </div>

      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="px-3 py-1 rounded-full bg-secondary font-mono text-teal-600 dark:text-teal-400 font-medium">
            {project.status}
          </span>
          {project.startDate && (
            <span className="text-muted-foreground flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              {project.startDate} {project.endDate ? `~ ${project.endDate}` : `~ ${t('projects.present')}`}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {project.name}
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed">
          {project.description}
        </p>

        {/* Links & Techs */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Github className="w-4 h-4" /> {t('projects.source_code')}
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-foreground border border-border text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <Globe className="w-4 h-4 text-teal-500" /> {t('projects.live_demo')}
            </a>
          )}
        </div>

        {project.technologies && (
          <div className="flex flex-wrap gap-2 pt-2">
            {project.technologies.split(',').map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-lg bg-secondary text-xs font-mono text-muted-foreground"
              >
                {tech.trim()}
              </span>
            ))}
          </div>
        )}

        {project.cover && (
          <SafeImage
            src={project.cover}
            alt={project.name}
            aspectRatio="21/9"
            containerClassName="w-full rounded-2xl border border-border mt-6"
          />
        )}
      </header>

      {/* Content */}
      <div className="pt-8 border-t border-border">
        <MarkdownViewer content={project.content || t('projects.no_content')} />
      </div>
    </div>
  );
}
