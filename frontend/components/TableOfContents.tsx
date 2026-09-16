'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { AlignLeft } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * 极简无边框导轨文章目录 (Floating Track Table of Contents)
 * 
 * 类似 Linear / Stripe 文档的极简轻量美学：
 * - 去卡片化与零视觉干扰；
 * - 左侧极细流动垂直导轨线条；
 * - 随滚动平滑滑动高亮游标，自动对齐当前章节。
 */
export function TableOfContents() {
  const { t } = useI18n();
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 自动扫描文章正文容器中的 h2 和 h3
    const article = document.querySelector('article') || document.querySelector('.prose-custom');
    if (!article) return;

    const elements = Array.from(article.querySelectorAll('h2, h3'));
    const items: TocItem[] = elements.map((el, index) => {
      let id = el.id;
      if (!id) {
        id = `heading-${index}-${el.textContent?.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-') || index}`;
        el.id = id;
      }
      return {
        id,
        text: el.textContent || '',
        level: el.tagName === 'H2' ? 2 : 3,
      };
    });

    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -65% 0%' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav 
      aria-label={t('detail.toc')}
      className="space-y-4 pl-2 sticky top-28 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-none select-none"
    >
      <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground pb-1">
        <AlignLeft className="w-3.5 h-3.5 text-emerald-500" />
        <span>{t('detail.toc')}</span>
      </div>

      {/* 极简无边框导轨列表 */}
      <div className="relative border-l border-border/70 dark:border-white/[0.08] space-y-1">
        {headings.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById(item.id);
                if (target) {
                  const offset = 90;
                  const bodyRect = document.body.getBoundingClientRect().top;
                  const elementRect = target.getBoundingClientRect().top;
                  const elementPosition = elementRect - bodyRect;
                  const offsetPosition = elementPosition - offset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  setActiveId(item.id);
                }
              }}
              style={{
                paddingLeft: item.level === 3 ? '1.5rem' : '1rem',
              }}
              className={`group relative block py-1 text-xs transition-all duration-200 line-clamp-1 leading-relaxed ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* 导轨上平滑激活的高亮指示块 */}
              {isActive && (
                <span 
                  className="absolute -left-[1px] top-1.5 bottom-1.5 w-[2px] bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
                />
              )}
              <span className="transition-transform duration-200 group-hover:translate-x-0.5 inline-block">
                {item.text}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
