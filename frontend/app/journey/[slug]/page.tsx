import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { SafeImage } from '@/components/SafeImage';
import { CommentSection } from '@/components/CommentSection';
import { getServerTranslation } from '@/lib/i18n-server';
import { ArrowLeft, MapPin, Calendar, Compass, Image as ImageIcon } from 'lucide-react';

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
    };
  } catch {
    return { title: 'Journey Not Found' };
  }
}

export const revalidate = 60;

export default async function JourneyDetailPage({ params }: JourneyDetailPageProps) {
  const { t } = getServerTranslation();
  let data;
  try {
    data = await api.getJourneyBySlug(params.slug);
  } catch {
    notFound();
  }

  const { journey, images } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <Link
          href="/journey"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{t('detail.back_journey')}</span>
        </Link>
      </div>

      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="px-3 py-1 rounded-full bg-secondary font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {journey.country} · {journey.city}
          </span>
          {journey.startDate && (
            <span className="text-muted-foreground flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              {journey.startDate} {journey.endDate ? `~ ${journey.endDate}` : ''}
            </span>
          )}
          {journey.latitude && journey.longitude && (
            <span className="text-muted-foreground font-mono flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-500" />
              {Number(journey.latitude).toFixed(4)}° N, {Number(journey.longitude).toFixed(4)}° E
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          {journey.title}
        </h1>

        {journey.description && (
          <p className="text-lg text-muted-foreground leading-relaxed italic border-l-2 border-cyan-500 pl-4">
            {journey.description}
          </p>
        )}

        {journey.cover && (
          <SafeImage
            src={journey.cover}
            alt={journey.title}
            aspectRatio="21/9"
            containerClassName="w-full rounded-2xl border border-border shadow-md"
          />
        )}
      </header>

      {/* Main Story Content */}
      <div className="pt-4 border-t border-border">
        <MarkdownViewer content={journey.content || t('journey.no_content')} />
      </div>

      {/* Photo Gallery if images exist */}
      {images && images.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-border">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-cyan-500" />
            <h2 className="text-2xl font-bold text-foreground">{t('journey.gallery')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {images.map((img) => (
              <div key={img.id} className="space-y-2 group">
                <SafeImage
                  src={img.imageUrl}
                  alt={img.caption || journey.title}
                  aspectRatio="4/3"
                  containerClassName="w-full rounded-2xl overflow-hidden border border-border shadow-sm"
                  className="group-hover:scale-105 transition-transform duration-500"
                />
                {img.caption && (
                  <p className="text-xs text-center text-muted-foreground font-mono">
                    {img.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reader Comments */}
      <CommentSection targetType="JOURNEY" targetId={journey.id} />
    </div>
  );
}
