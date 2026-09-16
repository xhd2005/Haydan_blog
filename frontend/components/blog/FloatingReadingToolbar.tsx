'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  Heart, 
  Share2, 
  Type, 
  Check 
} from 'lucide-react';
import { api } from '@/lib/api';

interface FloatingReadingToolbarProps {
  articleId: number;
  initialLikes?: number;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  onChangeFontSize: (size: 'sm' | 'base' | 'lg' | 'xl') => void;
  onOpenPoster: () => void;
  locale: string;
}

/**
 * 自适应微光伴读工具胶囊 (Adaptive Reading Toolbar)
 * 
 * 极致空间利用与响应式美学：
 * - 宽屏 (xl+ 宽屏)：自动变换为左翼垂直伴读条，贴合左侧留白；
 * - 窄屏 (平板/手机)：自动变换为底部居中横向微光胶囊；
 * - 环形阅读进度、字号缩放、即时点赞、生成海报、一键回顶。
 */
export function FloatingReadingToolbar({
  articleId,
  initialLikes = 0,
  fontSize,
  onChangeFontSize,
  onOpenPoster,
  locale,
}: FloatingReadingToolbarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  // 1. 监听滚动并计算阅读百分比
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const currentScroll = window.scrollY;
      const progress = Math.min(100, Math.max(0, Math.round((currentScroll / totalHeight) * 100)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. 免登录点赞交互
  const handleLike = async () => {
    if (hasLiked || isLiking) return;
    setIsLiking(true);
    try {
      await api.likePost(articleId);
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    } catch {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    } finally {
      setIsLiking(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fontSizes: { key: 'sm' | 'base' | 'lg' | 'xl'; label: string }[] = [
    { key: 'sm', label: '小 A' },
    { key: 'base', label: '标准 A' },
    { key: 'lg', label: '大 A' },
    { key: 'xl', label: '特大 A' },
  ];

  return (
    <aside 
      aria-label="阅读伴读工具栏"
      className="fixed z-40 select-none transition-all duration-300 bottom-6 left-1/2 -translate-x-1/2 xl:bottom-auto xl:top-36 xl:left-6 2xl:left-12 xl:translate-x-0"
    >
      <div className="relative flex flex-row xl:flex-col items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-full backdrop-blur-2xl bg-white/85 dark:bg-neutral-900/85 border border-slate-200/80 dark:border-white/[0.12] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_45px_-8px_rgba(0,0,0,0.8)]">
        {/* 顶部微光高光线 */}
        <div 
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent rounded-full" 
          aria-hidden="true" 
        />

        {/* 1. 环形阅读进度圈 */}
        <div 
          className="flex flex-col xl:flex-col items-center gap-1 p-1.5 text-xs font-mono font-bold text-foreground"
          title={`阅读进度 ${scrollProgress}%`}
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-border"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-150"
                strokeDasharray={`${scrollProgress}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
          <span className="text-[10px]">{scrollProgress}%</span>
        </div>

        <div className="w-px h-4 xl:w-4 xl:h-px bg-border/80" />

        {/* 2. 字号缩放菜单 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            className={`p-2 rounded-full transition-all ${
              showSizeMenu
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            title="字号缩放"
          >
            <Type className="w-4 h-4" />
          </button>

          {showSizeMenu && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 xl:bottom-auto xl:left-full xl:ml-3 xl:top-0 xl:translate-x-0 p-1.5 rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-neutral-900/95 border border-border shadow-xl min-w-[120px] space-y-1 z-50">
              <div className="text-[10px] font-mono text-muted-foreground px-2 py-1 uppercase">
                {locale === 'en' ? 'Font Size' : '阅读字号'}
              </div>
              {fontSizes.map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    onChangeFontSize(f.key);
                    setShowSizeMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                    fontSize === f.key
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <span>{f.label}</span>
                  {fontSize === f.key && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. 一键生成分享海报 */}
        <button
          type="button"
          onClick={onOpenPoster}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          title="生成分享海报"
        >
          <Share2 className="w-4 h-4 text-teal-500" />
        </button>

        {/* 4. 免登录即时点赞 */}
        <button
          type="button"
          onClick={handleLike}
          disabled={hasLiked}
          className={`flex flex-col items-center p-2 rounded-full transition-all ${
            hasLiked
              ? 'text-rose-500 bg-rose-500/10 cursor-default'
              : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'
          }`}
          title={hasLiked ? '已点赞' : '免登录点赞'}
        >
          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
          <span className="text-[10px] font-mono mt-0.5">{likes}</span>
        </button>

        <div className="w-px h-4 xl:w-4 xl:h-px bg-border/80" />

        {/* 5. 一键回顶 */}
        <button
          type="button"
          onClick={scrollToTop}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          title="返回顶部"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
