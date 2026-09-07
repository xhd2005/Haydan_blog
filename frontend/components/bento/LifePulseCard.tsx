'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { Activity, Radio, MapPin, Headphones, Code2, Sparkles } from 'lucide-react';
import { LifePulseState } from '@/lib/types';

interface LifePulseCardProps {
  pulseData?: LifePulseState | null;
}

export function LifePulseCard({ pulseData }: LifePulseCardProps) {
  const { locale, t } = useTranslation();

  const pulse: LifePulseState = pulseData || {
    statusText: '正在构建下一代 AI Agent 数字分身与 3D 航海体系',
    statusTextEn: 'Building Next-Gen AI Agent Twin & 3D Voyage Ecosystem',
    project: 'Hayden Garden V2.0',
    city: 'Hangzhou, China',
    listening: 'Ambient Lo-Fi & Cyber Chill',
    active: true,
  };

  return (
    <div className="relative w-full h-[340px] flex flex-col justify-between overflow-hidden rounded-3xl bg-card border border-border/80 p-6 shadow-xl backdrop-blur-md group hover:border-emerald-500/40 transition-colors duration-300">
      {/* 极光背景微光晕 */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />

      {/* 头部状态条 */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {t('bento.pulse_title')}
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">
              @haydenxue · PULSE
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span>{t('bento.pulse_live')}</span>
        </div>
      </div>

      {/* 核心专注状态 */}
      <div className="relative z-10 space-y-3 my-auto">
        <span className="text-[11px] uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-1">
          <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
          {t('bento.pulse_status')}
        </span>
        <p className="text-base sm:text-lg font-semibold text-foreground leading-snug group-hover:text-emerald-500 transition-colors">
          {locale === 'en' ? pulse.statusTextEn : pulse.statusText}
        </p>
      </div>

      {/* 底部详细指标 */}
      <div className="relative z-10 grid grid-cols-2 gap-3 pt-4 border-t border-border/60 text-xs">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <Code2 className="w-3 h-3 text-cyan-500" />
            Active Project
          </span>
          <p className="font-semibold text-foreground truncate">
            {pulse.project}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-500" />
            {t('bento.pulse_location')}
          </span>
          <p className="font-semibold text-foreground truncate">
            {pulse.city}
          </p>
        </div>

        {pulse.listening && (
          <div className="col-span-2 space-y-1 pt-1">
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <Headphones className="w-3 h-3 text-violet-500" />
              {t('bento.pulse_listening')}
            </span>
            <p className="font-medium text-muted-foreground text-[11px] truncate">
              {pulse.listening}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
