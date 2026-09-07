'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { locale, toggleLocale } = useI18n();

  return (
    <button
      onClick={toggleLocale}
      aria-label="Toggle Language"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border border-border bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
      title={locale === 'zh' ? 'Switch to English' : '切换为简体中文'}
    >
      <Languages className="w-3.5 h-3.5 text-emerald-500" />
      <span>{locale === 'zh' ? '中' : 'EN'}</span>
    </button>
  );
}
