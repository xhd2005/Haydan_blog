'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Memo } from '@/lib/types';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import confetti from 'canvas-confetti';
import { Calendar, Camera, Sparkles, Inbox } from 'lucide-react';
import { BentoCockpit, BentoFilterType } from './BentoCockpit';
import { BentoCard } from './BentoCard';
import { DarkroomLightbox, parseMemoImages } from './DarkroomLightbox';

interface JournalTimelineFlowProps {
  initialMemos: Memo[];
}

interface MonthCluster {
  key: string;
  year: string;
  month: string;
  label: string;
  items: Memo[];
}

export function JournalTimelineFlow({ initialMemos }: JournalTimelineFlowProps) {
  const { locale } = useI18n();
  const [memos, setMemos] = useState<Memo[]>(initialMemos);

  // 状态管理
  const [likedMemos, setLikedMemos] = useState<Record<number, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>(() => {
    const counts: Record<number, number> = {};
    initialMemos.forEach((m) => {
      counts[m.id] = m.likeCount || 0;
    });
    return counts;
  });

  const [activeFilter, setActiveFilter] = useState<BentoFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 站长身份检测
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hayden_token');
      setIsAdmin(!!token);
    }
  }, []);

  // 全屏暗房灯箱状态
  const [lightboxMemo, setLightboxMemo] = useState<Memo | null>(null);
  const [lightboxSubImgIndex, setLightboxSubImgIndex] = useState<number>(0);

  // 提取全部可用标签
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    memos.forEach((m) => {
      if (m.tags) {
        m.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((t) => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet);
  }, [memos]);

  // 统计数据
  const stats = useMemo(() => {
    let totalPhotos = 0;
    let totalNotes = 0;
    let pinnedCount = 0;
    const locations = new Set<string>();

    memos.forEach((m) => {
      const imgs = parseMemoImages(m.images);
      if (imgs.length > 0) {
        totalPhotos += imgs.length;
      } else {
        totalNotes += 1;
      }
      if (m.isPinned === 1) pinnedCount += 1;
      if (m.location && m.location.trim()) {
        locations.add(m.location.trim());
      }
    });

    return {
      totalMemos: memos.length,
      totalPhotos,
      totalNotes,
      totalLocations: locations.size,
      pinnedCount,
    };
  }, [memos]);

  // 多维筛选过滤
  const filteredMemos = useMemo(() => {
    return memos
      .filter((m) => {
        const imgs = parseMemoImages(m.images);
        if (activeFilter === 'photos' && imgs.length === 0) return false;
        if (activeFilter === 'notes' && imgs.length > 0) return false;
        if (activeFilter === 'pinned' && m.isPinned !== 1) return false;
        return true;
      })
      .filter((m) => {
        if (!selectedTag) return true;
        if (!m.tags) return false;
        return m.tags.split(',').map((t) => t.trim()).includes(selectedTag);
      })
      .filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        const contentMatch = m.content?.toLowerCase().includes(q);
        const locationMatch = m.location?.toLowerCase().includes(q);
        const tagsMatch = m.tags?.toLowerCase().includes(q);
        const moodMatch = m.mood?.toLowerCase().includes(q);
        return contentMatch || locationMatch || tagsMatch || moodMatch;
      })
      .sort((a, b) => {
        // 置顶优先，其次按时间倒序
        if (a.isPinned !== b.isPinned) return (b.isPinned || 0) - (a.isPinned || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [memos, activeFilter, selectedTag, searchQuery]);

  // 按「年-月」组织 Bento 时间簇 (Time Clusters)
  const monthClusters = useMemo<MonthCluster[]>(() => {
    const groups: Record<string, Memo[]> = {};

    filteredMemos.forEach((memo) => {
      const date = new Date(memo.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(memo);
    });

    return Object.entries(groups).map(([key, items]) => {
      const [year, month] = key.split('-');
      const label =
        locale === 'en'
          ? `${new Date(Number(year), Number(month) - 1).toLocaleString('en', { month: 'short' })} ${year}`
          : `${year} · ${month}月`;
      return {
        key,
        year,
        month,
        label,
        items,
      };
    });
  }, [filteredMemos, locale]);

  // 月份导航条目
  const monthNavItems = useMemo(() => {
    return monthClusters.map((c) => ({
      key: c.key,
      label: c.label,
      count: c.items.length,
    }));
  }, [monthClusters]);

  // 平滑滚动至指定月份
  const scrollToMonth = useCallback((monthKey: string) => {
    const el = document.getElementById(`month-cluster-${monthKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // 心动点赞与微粒子动效
  const handleToggleLike = async (memoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyLiked = !!likedMemos[memoId];
    const newLiked = !isCurrentlyLiked;

    setLikedMemos((prev) => ({ ...prev, [memoId]: newLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [memoId]: Math.max(0, (prev[memoId] || 0) + (newLiked ? 1 : -1)),
    }));

    if (newLiked) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 28,
        spread: 60,
        origin: { x, y },
        colors: ['#f43f5e', '#fb7185', '#fda4af', '#f59e0b', '#ec4899', '#10b981'],
        ticks: 120,
        gravity: 1.2,
        scalar: 0.9,
      });

      toast.success(locale === 'en' ? 'Favorited moment' : '已心动收藏此瞬息');
      api.likeMemo(memoId).catch(() => {});
    }
  };

  // 分享直达链接
  const handleShare = (memoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/memos#memo-${memoId}`;
      navigator.clipboard.writeText(url);
      toast.success(locale === 'en' ? 'Direct link copied' : '随记直达链接已复制到剪贴板');
    }
  };

  // 站长快捷置顶切换
  const handleTogglePin = async (memoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.togglePinMemo(memoId);
      setMemos((prev) =>
        prev.map((m) => (m.id === memoId ? { ...m, isPinned: m.isPinned === 1 ? 0 : 1 } : m))
      );
      toast.success('置顶状态已更新');
    } catch (err: any) {
      toast.error(err.message || '切换置顶失败');
    }
  };

  // 打开暗房灯箱
  const handleOpenLightbox = (memo: Memo, subIdx = 0) => {
    setLightboxMemo(memo);
    setLightboxSubImgIndex(subIdx);
  };

  // 翻页随记灯箱
  const handlePrevMemo = () => {
    if (!lightboxMemo) return;
    const curIdx = filteredMemos.findIndex((m) => m.id === lightboxMemo.id);
    if (curIdx > 0) {
      const prev = filteredMemos[curIdx - 1];
      setLightboxMemo(prev);
      const prevImgs = parseMemoImages(prev.images);
      setLightboxSubImgIndex(prevImgs.length > 0 ? prevImgs.length - 1 : 0);
    }
  };

  const handleNextMemo = () => {
    if (!lightboxMemo) return;
    const curIdx = filteredMemos.findIndex((m) => m.id === lightboxMemo.id);
    if (curIdx !== -1 && curIdx < filteredMemos.length - 1) {
      const next = filteredMemos[curIdx + 1];
      setLightboxMemo(next);
      setLightboxSubImgIndex(0);
    }
  };

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-[#fbfbfd] dark:bg-[#090a0f] text-foreground transition-colors duration-500 pb-36 font-sans">
      {/* ======================================================== */}
      {/* 动态环境弥散光晕（三维空间景深，消除冷硬感）               */}
      {/* ======================================================== */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1700px] h-[900px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-36 w-[680px] h-[680px] rounded-full bg-gradient-to-br from-rose-500/10 via-pink-400/5 to-transparent dark:from-rose-500/15 dark:via-purple-900/10 dark:to-transparent blur-3xl" />
        <div className="absolute top-16 -right-36 w-[720px] h-[720px] rounded-full bg-gradient-to-bl from-amber-400/10 via-sky-400/5 to-transparent dark:from-blue-600/15 dark:via-indigo-950/10 dark:to-transparent blur-3xl" />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 space-y-8">
        {/* 顶置灵动控制台 (Cockpit) */}
        <BentoCockpit
          stats={stats}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          allTags={allTags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          monthGroups={monthNavItems}
          onScrollToMonth={scrollToMonth}
          isAdmin={isAdmin}
          locale={locale}
        />

        {/* 核心内容区：按年月优雅分簇的自适应异形 Bento 网格 */}
        {filteredMemos.length === 0 ? (
          <div className="text-center py-32 bg-white/70 dark:bg-neutral-900/50 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl p-8 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-muted-foreground">
              <Camera className="w-8 h-8 opacity-50" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground font-sans">暂无匹配的随记</h3>
              <p className="text-xs font-mono text-muted-foreground">
                没有找到符合当前筛选条件的瞬息碎片，不妨切换标签或清除关键词。
              </p>
            </div>
            {(searchQuery || selectedTag || activeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                  setActiveFilter('all');
                }}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-mono bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                重置全部筛选
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {monthClusters.map((cluster) => (
              <section
                key={cluster.key}
                id={`month-cluster-${cluster.key}`}
                className="space-y-5 scroll-mt-28"
              >
                {/* 时间簇题头胶囊 */}
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/15 shadow-2xs text-xs font-mono text-foreground font-bold">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{cluster.label}</span>
                    <span className="px-2 py-0.2 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] text-muted-foreground">
                      {cluster.items.length} 篇
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent" />
                </div>

                {/* 紧凑自适应真实 Masonry 瀑布流 (无拉伸空隙) */}
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
                  {cluster.items.map((memo, itemIdx) => (
                    <div key={memo.id} id={`memo-${memo.id}`} className="break-inside-avoid mb-6">
                      <BentoCard
                        memo={memo}
                        index={itemIdx}
                        isAdmin={isAdmin}
                        onOpenLightbox={handleOpenLightbox}
                        onToggleLike={handleToggleLike}
                        onShare={handleShare}
                        onTogglePin={handleTogglePin}
                        onSelectTag={setSelectedTag}
                        isLiked={!!likedMemos[memo.id]}
                        likeCount={likeCounts[memo.id] || 0}
                        locale={locale}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 电影级暗房全景灯箱                                        */}
      {/* ======================================================== */}
      {lightboxMemo && (
        <DarkroomLightbox
          memo={lightboxMemo}
          subImgIndex={lightboxSubImgIndex}
          onClose={() => setLightboxMemo(null)}
          onSelectSubIndex={setLightboxSubImgIndex}
          onPrevMemo={handlePrevMemo}
          onNextMemo={handleNextMemo}
          onToggleLike={handleToggleLike}
          onShare={handleShare}
          isLiked={!!likedMemos[lightboxMemo.id]}
          likeCount={likeCounts[lightboxMemo.id] || 0}
          locale={locale}
        />
      )}
    </div>
  );
}
