'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  FileText,
  Pin,
  Search,
  X,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';

export type BentoFilterType = 'all' | 'photos' | 'notes' | 'pinned';

interface BentoCockpitProps {
  stats: {
    totalMemos: number;
    totalPhotos: number;
    totalNotes: number;
    pinnedCount: number;
  };
  activeFilter: BentoFilterType;
  onSelectFilter: (filter: BentoFilterType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  allTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  monthGroups: { key: string; label: string; count: number }[];
  onScrollToMonth: (monthKey: string) => void;
  isAdmin: boolean;
  locale: string;
}

export function BentoCockpit({
  stats,
  activeFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  allTags,
  selectedTag,
  onSelectTag,
  monthGroups,
  onScrollToMonth,
  isAdmin,
  locale,
}: BentoCockpitProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. 紧凑画报级题头 (Editorial Header)                     */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/50 dark:border-white/[0.06]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-slate-200/70 dark:border-white/10 shadow-2xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-foreground">HAYDEN XUE</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>MINDSTREAM</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
            瞬息与光影
          </h1>

          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xl font-sans">
            穿行于旷野、街道与心流中的真实时空切片。以纯粹图文对话无垠光阴。
          </p>
        </div>

        {/* 题头右侧状态微标 */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{stats.totalMemos} 篇瞬息</span>
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. 粘性吸顶灵动岛胶囊 (Sticky Dynamic Island Capsule)     */}
      {/* ======================================================== */}
      <div className="sticky top-20 z-30 py-2 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-black/5">
          {/* 左侧：分类过滤胶囊 */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-mono">
            <button
              onClick={() => onSelectFilter('all')}
              type="button"
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer select-none text-xs flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              <span>全部</span>
              <span className="text-[10px] opacity-70">({stats.totalMemos})</span>
            </button>

            <button
              onClick={() => onSelectFilter('photos')}
              type="button"
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer select-none text-xs flex items-center gap-1.5 ${
                activeFilter === 'photos'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-blue-500" />
              <span>相纸</span>
              <span className="text-[10px] opacity-70">({stats.totalPhotos})</span>
            </button>

            <button
              onClick={() => onSelectFilter('notes')}
              type="button"
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer select-none text-xs flex items-center gap-1.5 ${
                activeFilter === 'notes'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>随笔</span>
              <span className="text-[10px] opacity-70">({stats.totalNotes})</span>
            </button>

            {stats.pinnedCount > 0 && (
              <button
                onClick={() => onSelectFilter('pinned')}
                type="button"
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer select-none text-xs flex items-center gap-1.5 ${
                  activeFilter === 'pinned'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <Pin className="w-3 h-3" />
                <span>精选</span>
              </button>
            )}
          </div>

          {/* 右侧：展开搜索 + 标签抽屉 + 伴听微部件 + 站长入口 */}
          <div className="flex items-center gap-2">
            {/* 灵动搜索框展开交互 */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center bg-slate-100 dark:bg-neutral-800 rounded-full pl-3 pr-2 py-1 transition-all animate-in fade-in zoom-in-95 duration-200">
                  <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="搜索正文/标签..."
                    className="w-32 sm:w-44 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-hidden ml-2 font-sans"
                  />
                  <button
                    onClick={() => {
                      onSearchChange('');
                      setIsSearchOpen(false);
                    }}
                    type="button"
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  type="button"
                  className={`p-2 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-neutral-800 ${
                    searchQuery ? 'text-emerald-500 bg-emerald-500/10' : ''
                  }`}
                  title="实时搜索随记"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 标签与月份筛选抽屉开关 */}
            {(allTags.length > 0 || monthGroups.length > 0) && (
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                type="button"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  isDrawerOpen || selectedTag
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-neutral-800'
                }`}
                title="筛选标签或时光月份"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {selectedTag ? `#${selectedTag}` : '过滤'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. 可折叠灵动抽屉：标签云与月份罗盘 (Drawer)            */}
        {/* ======================================================== */}
        {(isDrawerOpen || selectedTag) && (
          <div className="mt-2.5 p-3 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md space-y-2.5 animate-in slide-in-from-top-2 duration-200 font-mono text-xs">
            {/* 标签栏 */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-muted-foreground text-[11px] shrink-0 mr-1">标签:</span>
                {selectedTag && (
                  <button
                    onClick={() => onSelectTag(null)}
                    type="button"
                    className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition-colors text-[10px] shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>清除</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
                    type="button"
                    className={`px-2.5 py-0.5 rounded-full text-[10px] transition-all cursor-pointer shrink-0 border ${
                      selectedTag === tag
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold border-transparent shadow-2xs'
                        : 'bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-white/10 border-slate-200/60 dark:border-white/5'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* 月份时空罗盘 */}
            {monthGroups.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100 dark:border-white/5">
                <span className="text-muted-foreground text-[11px] shrink-0 mr-1 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-emerald-500" />
                  <span>时空:</span>
                </span>
                {monthGroups.map((group) => (
                  <button
                    key={group.key}
                    onClick={() => onScrollToMonth(group.key)}
                    type="button"
                    className="px-2.5 py-0.5 rounded-full bg-slate-100/70 dark:bg-neutral-800/50 hover:bg-slate-200 dark:hover:bg-neutral-800 text-muted-foreground hover:text-foreground text-[10px] transition-colors shrink-0 cursor-pointer"
                  >
                    {group.label} ({group.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
