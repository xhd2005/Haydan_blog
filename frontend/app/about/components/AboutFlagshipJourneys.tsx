'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Journey } from '@/lib/types';
import { MapPin, Compass, ArrowUpRight, Sparkles, Camera } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface AboutFlagshipJourneysProps {
  journeys?: Journey[];
}

export function AboutFlagshipJourneys({ journeys = [] }: AboutFlagshipJourneysProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-60px' });

  const publishedJourneys = (journeys || []).slice(0, 3);

  return (
    <section ref={containerRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
            <Compass className="w-3.5 h-3.5" />
            <span>Presence & Exploration // 真实足迹与旷野</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
            高山旷野、胶片光影与真实行旅
          </h2>
        </div>
        <Link
          href="/journey"
          className="liquid-glass-pill px-4 py-2 rounded-full text-xs font-mono text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <span>3D 地球仪足迹剧场</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {publishedJourneys.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {publishedJourneys.map((j, idx) => {
            const locationStr = [j.city, j.country].filter(Boolean).join(', ');
            return (
              <motion.div
                key={j.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/journey/${j.slug || j.id}`}
                  className="liquid-glass-card rounded-3xl overflow-hidden block group h-full flex flex-col justify-between"
                >
                  {j.cover && (
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-neutral-900">
                      <Image
                        src={j.cover}
                        alt={j.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      {locationStr && (
                        <div className="absolute bottom-3 left-3 liquid-glass-pill px-3 py-1 rounded-full text-[10px] font-mono text-white flex items-center gap-1 bg-black/40 border-white/20">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>{locationStr}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5 sm:p-6 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {j.startDate ? new Date(j.startDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' }) : 'REAL RECORD'}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground font-sans group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {j.title}
                      </h3>
                      {j.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {j.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span>READ DOSSIER</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="liquid-glass-card rounded-3xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full mx-auto bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">真实旷野足迹与胶片影像</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            所有足迹严格与数据库中真实旅行纪实关联。欢迎移步足迹专页，在 3D 卫星地球仪中俯瞰大圆航线与高山影像。
          </p>
          <Link
            href="/journey"
            className="inline-flex items-center gap-2 liquid-glass-pill px-5 py-2 rounded-full text-xs font-mono text-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <span>进入足迹剧场</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
