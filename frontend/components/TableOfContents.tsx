'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { AlignLeft } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

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
      { rootMargin: '0% 0% -60% 0%' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-3 p-4 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-sm sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
        <AlignLeft className="w-3.5 h-3.5 text-emerald-500" />
        <span>{t('detail.toc')}</span>
      </div>
      <ul className="space-y-1.5 text-xs">
        {headings.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: item.level === 3 ? '1rem' : '0' }}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById(item.id);
                if (target) {
                  const offset = 80;
                  const bodyRect = document.body.getBoundingClientRect().top;
                  const elementRect = target.getBoundingClientRect().top;
                  const elementPosition = elementRect - bodyRect;
                  const offsetPosition = elementPosition - offset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  setActiveId(item.id);
                }
              }}
              className={`block py-1 px-2 rounded-lg transition-colors leading-relaxed line-clamp-1 ${
                activeId === item.id
                  ? 'text-emerald-500 bg-emerald-500/10 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
