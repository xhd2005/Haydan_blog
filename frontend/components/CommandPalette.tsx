'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Post } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { useTheme } from 'next-themes';
import { Search, X, BookOpen, Compass, Code, MapPin, Sparkles, Sun, Moon, Languages, User, ExternalLink } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { t, locale, toggleLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  // 监听键盘 ESC 退出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 搜索文章
  useEffect(() => {
    if (!query.trim()) {
      setPosts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getPosts({ keyword: query.trim(), pageSize: 8 });
        const raw = res.records || [];
        // 根据当前语言加权排序优先呈现
        const sorted = [...raw].sort((a, b) => {
          const aMatch = (a.lang || 'zh') === locale ? 0 : 1;
          const bMatch = (b.lang || 'zh') === locale ? 0 : 1;
          if (aMatch !== bMatch) return aMatch - bMatch;
          return 0;
        });
        setPosts(sorted);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, locale]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  const navItems = [
    { name: t('nav.home'), path: '/', icon: <Sparkles className="w-4 h-4 text-emerald-500" /> },
    { name: t('nav.blog'), path: '/blog', icon: <BookOpen className="w-4 h-4 text-teal-500" /> },
    { name: t('nav.projects'), path: '/projects', icon: <Code className="w-4 h-4 text-cyan-500" /> },
    { name: t('nav.journey'), path: '/journey', icon: <MapPin className="w-4 h-4 text-indigo-500" /> },
    { name: t('nav.memos'), path: '/memos', icon: <Sparkles className="w-4 h-4 text-rose-500" /> },
    { name: t('nav.links'), path: '/links', icon: <ExternalLink className="w-4 h-4 text-blue-500" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden space-y-4">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder={t('search.placeholder')}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-secondary text-muted-foreground border border-border">
              ESC
            </kbd>
          )}
        </div>

        {/* Results / Navigation Body */}
        <div className="max-h-[60vh] overflow-y-auto px-4 pb-4 space-y-4 text-xs">
          {/* Searched Posts */}
          {query.trim() && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold px-2">
                {t('search.articles')}
              </span>
              {loading ? (
                <div className="py-4 text-center text-muted-foreground">{t('search.loading')}</div>
              ) : posts.length > 0 ? (
                posts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigateTo(`/blog/${p.slug}`)}
                    className="w-full p-3 rounded-2xl bg-secondary/50 hover:bg-secondary text-left flex items-start gap-3 transition-colors group"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground group-hover:text-emerald-500 transition-colors line-clamp-1">
                          {p.title}
                        </span>
                        {p.lang === 'en' ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                            [EN]
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            [ZH]
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[11px] line-clamp-1">
                        {p.excerpt || t('search.read_post')}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-4 text-center text-muted-foreground">{t('search.no_results')}</div>
              )}
            </div>
          )}

          {/* Quick Navigations */}
          {!query.trim() && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold px-2">
                {t('search.navigation')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigateTo(item.path)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary text-left font-medium text-foreground transition-colors"
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold px-2">
              {t('search.actions')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                  onClose();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                <span>{theme === 'dark' ? t('search.switch_light') : t('search.switch_dark')}</span>
              </button>

              <button
                onClick={() => {
                  toggleLocale();
                  onClose();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <Languages className="w-4 h-4 text-emerald-500" />
                <span>{t('search.switch_lang')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
