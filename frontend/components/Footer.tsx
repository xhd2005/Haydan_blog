'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { SiteSetting } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { Rss, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export function Footer() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [settings, setSettings] = useState<Partial<SiteSetting>>({});

  useEffect(() => {
    api.getSettings().then((data) => {
      if (data) setSettings(data);
    }).catch(() => {});
  }, []);

  if (pathname === '/ai' || pathname?.startsWith('/ai/')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-border bg-card/40 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <BrandLogo size={20} animated={false} glow={false} />
              <span className="font-bold tracking-wider text-base">
                {settings.siteName || 'HAYDEN XUE'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                Digital Garden
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground italic font-serif">
              “{settings.slogan || 'From the East, toward the unknown.'}”
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              {t('nav.home')}
            </Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              {t('nav.blog')}
            </Link>
            <Link href="/projects" className="hover:text-foreground transition-colors">
              {t('nav.projects')}
            </Link>
            <Link href="/journey" className="hover:text-foreground transition-colors">
              {t('nav.journey')}
            </Link>
            <Link href="/memos" className="hover:text-foreground transition-colors">
              {t('nav.memos')}
            </Link>
            <Link href="/links" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors group">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse group-hover:shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span>{t('nav.links')}</span>
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              {t('nav.about')}
            </Link>
            <a
              href="/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-amber-500 transition-colors"
              title={t('footer.rss_tooltip')}
            >
              <Rss className="w-3.5 h-3.5" /> RSS
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3 text-center sm:text-left">
            <p>{settings.footerText || `© ${new Date().getFullYear()} Hayden Xue. All rights reserved.`}</p>
            {settings.icpNumber && (
              <a
                href="https://beian.miit.gov.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-foreground"
              >
                {settings.icpNumber}
              </a>
            )}
          </div>
          <p className="flex items-center gap-1.5">
            <span>{t('footer.built_with')}</span>
            <span>•</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Digital Garden V2.0
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
