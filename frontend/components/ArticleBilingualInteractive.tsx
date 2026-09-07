'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Post } from '@/lib/types';
import { Languages, X, Globe, ArrowRight } from 'lucide-react';

interface ArticleBilingualInteractiveProps {
  post: Post;
}

export function ArticleBilingualInteractive({ post }: ArticleBilingualInteractiveProps) {
  const router = useRouter();
  const { locale, setLocale } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const prevLocaleRef = useRef(locale);

  const postLang = post.lang || 'zh';
  const hasPublishedTranslation =
    Boolean(post.translationPost && post.translationPost.status === 'PUBLISHED');
  const transSlug = post.translationPost?.slug;
  const transLang = post.translationPost?.lang || (postLang === 'zh' ? 'en' : 'zh');

  // 1. 智能对齐跳转：监听全站语言切换
  useEffect(() => {
    if (prevLocaleRef.current !== locale) {
      prevLocaleRef.current = locale;
      if (hasPublishedTranslation && transSlug && locale === transLang) {
        router.push(`/blog/${transSlug}`);
      }
    }
  }, [locale, hasPublishedTranslation, transSlug, transLang, router]);

  // 判断是否需要展示 Friendly Fallback Banner：
  // 读者当前全站偏好与文章语言不一致，且暂无对应已发布译文
  const shouldShowFallbackBanner =
    !dismissed &&
    locale !== postLang &&
    !hasPublishedTranslation;

  const handleSwitchLanguageDirectly = () => {
    if (hasPublishedTranslation && transSlug) {
      setLocale(transLang as 'zh' | 'en');
      router.push(`/blog/${transSlug}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Friendly Fallback Banner (防 404 友好回退提示条) */}
      {shouldShowFallbackBanner && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <Languages className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="leading-relaxed font-medium">
              {locale === 'en'
                ? 'This article is currently only available in Chinese. You can continue reading below or explore other English posts.'
                : '该文章暂仅发布了英文版本，您可以继续阅读下方原文或探索其他中文博文。'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <Link
              href={locale === 'en' ? '/blog?lang=en' : '/blog?lang=zh'}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-100 font-medium transition-colors inline-flex items-center gap-1"
            >
              <span>{locale === 'en' ? 'Explore English Posts' : '浏览中文文章'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Close banner"
              className="p-1 rounded-lg hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 文章头部双语直达组件 (Header Direct Translation Switcher) */}
      {hasPublishedTranslation && transSlug && (
        <div className="flex items-center gap-3 pt-0.5">
          <button
            type="button"
            onClick={handleSwitchLanguageDirectly}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all hover:scale-[1.02] shadow-sm group"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500 group-hover:rotate-12 transition-transform" />
            <span>
              {postLang === 'zh'
                ? '🌐 Read in English →'
                : '🌐 阅读全文中文版 →'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
