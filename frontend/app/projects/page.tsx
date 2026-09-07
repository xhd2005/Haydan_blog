import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { getServerTranslation } from '@/lib/i18n-server';
import { Github, Globe, ExternalLink, Calendar, Layers } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'Projects & Works | Hayden Xue' : '项目与作品 | Hayden Xue',
    description: 'Showcase of software projects, open source tools, and digital experiments.',
  };
}

export const revalidate = 60;

export default async function ProjectsPage() {
  const { locale, t } = getServerTranslation();
  const projects = await api.getProjects().catch(() => [] as Project[]);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <span className="text-xs uppercase font-mono tracking-widest text-teal-500 font-semibold">
          {t('projects.badge')}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {t('projects.title')}
        </h1>
        <p className="text-muted-foreground text-base max-w-2xl">
          {t('projects.desc')}
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.length > 0 ? (
          projects.map((proj) => (
            <div
              key={proj.id}
              className="flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-card border border-border hover:border-teal-500/50 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="space-y-5">
                {proj.cover && (
                  <SafeImage
                    src={proj.cover}
                    alt={proj.name}
                    aspectRatio="16/9"
                    containerClassName="w-full overflow-hidden rounded-2xl border border-border/50"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/projects/${proj.slug}`}>
                      <h2 className="text-2xl font-bold text-foreground group-hover:text-teal-500 transition-colors">
                        {proj.name}
                      </h2>
                    </Link>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-secondary text-muted-foreground border border-border">
                      {proj.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                {proj.technologies && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.technologies.split(',').map((tech) => (
                      <span
                        key={tech}
                        className="text-xs px-2.5 py-1 rounded-md bg-secondary text-muted-foreground font-mono"
                      >
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-border flex items-center justify-between text-sm">
                <Link
                  href={`/projects/${proj.slug}`}
                  className="font-medium text-foreground hover:text-teal-500 transition-colors inline-flex items-center gap-1"
                >
                  <span>{t('home.case_study')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-3">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="GitHub Repository"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {proj.demoUrl && (
                    <a
                      href={proj.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Live Demo"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
            {t('projects.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
