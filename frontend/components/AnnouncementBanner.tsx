'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { Sparkles, X, ArrowRight } from 'lucide-react';

interface AnnouncementBannerProps {
  enabled?: number;
  text?: string;
  link?: string;
}

export function AnnouncementBanner({ enabled, text, link }: AnnouncementBannerProps) {
  const { t } = useI18n();
  const [closed, setClosed] = useState(false);

  if (!enabled || !text || closed) return null;

  return (
    <div className="relative bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-b border-emerald-500/20 text-xs py-2 px-4 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="font-medium text-foreground truncate">{text}</span>
          {link && (
            <Link
              href={link}
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 ml-1"
            >
              <span>{t('banner.learn_more')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <button
          onClick={() => setClosed(true)}
          className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label={t('banner.close')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
