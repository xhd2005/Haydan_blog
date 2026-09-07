'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Post } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { Search, Loader2, ArrowRight, Calendar, Clock, Folder } from 'lucide-react';

export default function SearchPage() {
  const { t, locale } = useI18n();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getPosts({ keyword: keyword.trim(), pageSize: 20 });
        setResults(res.records);
        setSearched(true);
      } catch (err) {
        console.error('搜索出错:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-3 text-center sm:text-left">
        <span className="text-xs uppercase font-mono tracking-widest text-emerald-500 font-semibold">
          {t('search.badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {t('search.page_title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('search.page_desc')}
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t('search.input_placeholder')}
          className="w-full pl-12 pr-12 py-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-base shadow-sm transition-all"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Results */}
      <div className="space-y-4 pt-4">
        {results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground font-mono">
              {t('search.found_count')} {results.length}
            </p>
            {results.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block p-5 rounded-2xl bg-card border border-border hover:border-emerald-500/50 hover:shadow-md transition-all group space-y-2"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {post.category && (
                    <span className="px-2 py-0.5 rounded bg-secondary font-medium text-foreground">
                      {post.category.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN') : t('common.recently')}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-foreground group-hover:text-emerald-500 transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : searched && !loading ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
            {t('search.no_match')}
          </div>
        ) : !searched && !loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            {t('search.start_prompt')}
          </div>
        ) : null}
      </div>
    </div>
  );
}
