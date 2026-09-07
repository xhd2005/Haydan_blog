import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Journey } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { VoyageGlobe } from '@/components/journey/VoyageGlobe';
import { getServerTranslation } from '@/lib/i18n-server';
import { MapPin, Calendar, Compass, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'Journey & Footprints | Hayden Xue' : '旅行足迹与纪行 | Hayden Xue',
    description: 'Travel records, photography, and city explorations around the world.',
  };
}

export const revalidate = 60;

export default async function JourneyPage() {
  const { locale, t } = getServerTranslation();
  const journeys = await api.getJourneys().catch(() => [] as Journey[]);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <span className="text-xs uppercase font-mono tracking-widest text-cyan-500 font-semibold">
          {t('journey.badge')}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {t('journey.title')}
        </h1>
        <p className="text-muted-foreground text-base max-w-2xl">
          {t('journey.desc')}
        </p>
      </div>

      {/* 3D Voyage Interactive Globe */}
      <VoyageGlobe journeys={journeys} />

      {/* Journeys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {journeys.length > 0 ? (
          journeys.map((item) => (
            <Link
              key={item.id}
              href={`/journey/${item.slug}`}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-card border border-border hover:border-cyan-500/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="space-y-4">
                {item.cover && (
                  <SafeImage
                    src={item.cover}
                    alt={item.title}
                    aspectRatio="4/3"
                    containerClassName="w-full overflow-hidden"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                <div className="p-6 pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-cyan-600 dark:text-cyan-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {item.country} · {item.city}
                    </span>
                    {item.startDate && (
                      <span className="font-mono">{item.startDate}</span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-foreground group-hover:text-cyan-500 transition-colors">
                    {item.title}
                  </h2>

                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-foreground">
                <span>{t('home.view_travelogue')}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-cyan-500" />
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-3 py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
            {t('journey.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
