import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { VisaStamp } from '@/components/journey/VisaStamp';
import { Journey } from '@/lib/types';
import { ArrowLeft, MapPin, Calendar, Compass } from 'lucide-react';

interface JourneyFullBleedHeroProps {
  journey: Journey;
  translations: {
    backJourney: string;
  };
}

/**
 * 游记 100vw 通栏全景电影首屏组件 (Full-bleed Cinematic Journey Hero)
 * 
 * 核心特征：
 * 1. 100vw 壮丽风光大片铺满视界，浅色模式通透鲜活，深色模式深邃沉浸；
 * 2. 彻底移除引起浅色灰雾的底部死白渐变，交由下方白瓷画卷 Sheet 向上微重叠自然衔接；
 * 3. 严格共享 max-w-[1400px] 版心轴与 max-w-[980px] 左对齐基准线；
 * 4. 右上角如同护照纸面般物理加盖专属旅行签证印章 (VisaStamp)。
 */
export function JourneyFullBleedHero({
  journey,
  translations: t,
}: JourneyFullBleedHeroProps) {
  return (
    <section className="relative w-full min-h-[520px] sm:min-h-[620px] lg:min-h-[680px] flex flex-col justify-center overflow-hidden pt-36 sm:pt-44 lg:pt-48 pb-24 sm:pb-32">
      {/* 1. 100vw 全幅风光大图背景层 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {journey.cover ? (
          <div className="relative w-full h-full">
            <SafeImage
              src={journey.cover}
              alt={journey.title}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover filter brightness-[0.88] dark:brightness-[0.62] saturate-[1.08] scale-105"
            />
            {/* 电影质感微膜：浅色通透明朗，深色沉浸深邃 */}
            <div className="absolute inset-0 bg-black/20 dark:bg-black/55 pointer-events-none transition-colors duration-300" />
            {/* 径向暗角：浅色保持轻盈微暗角，深色强化四周环境包围感 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.35)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
          </div>
        ) : (
          /* 无封面时的数字地理等高线蓝绿渐变背景 */
          <div className="relative w-full h-full bg-gradient-to-b from-teal-950/70 via-slate-900 to-[#090a0f]">
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none" 
              style={{
                backgroundImage: 'radial-gradient(rgba(20, 184, 166, 0.4) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>
        )}
      </div>

      {/* 2. 前景文字排版区 (严格同轴 1400px 版心与 980px 左对齐线) */}
      <div className="relative z-20 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 text-white select-none">
        {/* 右上角物理加盖的专属签证印章 (Visa Stamp) */}
        <div className="absolute -top-6 sm:-top-8 right-4 sm:right-6 lg:right-10 pointer-events-none">
          <VisaStamp
            city={journey.city}
            country={journey.country}
            year={journey.startDate?.slice(0, 4)}
            className="transform rotate-6 scale-90 sm:scale-110 lg:scale-125 filter drop-shadow-2xl"
          />
        </div>

        <div className="max-w-[980px] space-y-5 sm:space-y-6">
          {/* 返回足迹列表按钮 */}
          <div>
            <Link
              href="/journey"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/20 text-xs font-mono font-medium text-white transition-all duration-300 group shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-cyan-300" />
              <span>{t.backJourney}</span>
            </Link>
          </div>

          {/* 核心时空元信息徽标条 */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-semibold shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-cyan-300" />
              <span>{journey.country} · {journey.city}</span>
            </div>

            {journey.startDate && (
              <>
                <StardateBadge date={journey.startDate} logId={journey.id} />
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-black/40 border border-white/15 text-white/85 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-teal-300" />
                  <span>{journey.startDate} {journey.endDate ? `~ ${journey.endDate}` : ''}</span>
                </div>
              </>
            )}

            {journey.latitude && journey.longitude && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-black/40 border border-white/15 text-white/85 font-mono">
                <Compass className="w-3.5 h-3.5 text-cyan-300" />
                <span>{Number(journey.latitude).toFixed(4)}° N, {Number(journey.longitude).toFixed(4)}° E</span>
              </div>
            )}
          </div>

          {/* 游记主标题 (同轴左对齐，大字号、高张力) */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] drop-shadow-md">
            {journey.title}
          </h1>

          {/* 导言摘要 */}
          {journey.description && (
            <p className="text-base sm:text-xl text-white/90 max-w-3xl leading-relaxed font-normal italic border-l-2 border-cyan-400 pl-4 py-0.5 drop-shadow-sm">
              {journey.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
