'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Friend, FriendActivity } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { FriendCard } from '@/components/links/FriendCard';
import { FriendStationCard } from '@/components/links/FriendStationCard';
import { FriendStreamRadar } from '@/components/links/FriendStreamRadar';
import { FriendApplyModal } from '@/components/links/FriendApplyModal';
import { AuroraBackground } from '@/components/links/AuroraBackground';
import { HyperspaceWarpModal } from '@/components/links/HyperspaceWarpModal';
import {
  Globe,
  Plus,
  Shuffle,
  Search,
  Users,
  Radio,
  Sparkles,
  Zap,
  X,
  Compass,
} from 'lucide-react';

interface LinksDirectoryViewProps {
  initialFriends: Friend[];
  initialActivities?: FriendActivity[];
}

// 轻量平滑数字递增缓动 Hook
function useCountUp(target: number, duration = 750) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setCount(0);
      return;
    }
    let current = 0;
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = target / totalSteps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export function LinksDirectoryView({
  initialFriends,
  initialActivities = [],
}: LinksDirectoryViewProps) {
  const { locale } = useI18n();
  const [friends] = useState<Friend[]>(initialFriends);
  const [activities] = useState<FriendActivity[]>(initialActivities);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyOnline, setOnlyOnline] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // 随机穿梭 Warp HUD 目标
  const [warpTarget, setWarpTarget] = useState<Friend | null>(null);

  const stationRef = useRef<HTMLDivElement>(null);

  // 1. 动态统计指标计算
  const stats = useMemo(() => {
    const total = friends.length;
    const online = friends.filter((f) => f.pingStatus === 'ONLINE').length;
    const openSourceOrGeek = friends.filter(
      (f) =>
        f.category === '开源先锋' ||
        f.category === 'OPEN_SOURCE' ||
        f.category === '极客同好' ||
        f.category === 'GEEK_PEER'
    ).length;
    return { total, online, openSourceOrGeek };
  }, [friends]);

  // 数字平滑滚入
  const animatedTotal = useCountUp(stats.total);
  const animatedOnline = useCountUp(stats.online);
  const animatedGeek = useCountUp(stats.openSourceOrGeek);

  // 2. 提取并去重所有真实分类
  const categories = useMemo(() => {
    const set = new Set<string>();
    friends.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [friends]);

  // 3. 多维组合过滤
  const filteredFriends = useMemo(() => {
    return friends.filter((f) => {
      const matchCat = selectedCategory === 'ALL' || f.category === selectedCategory;
      const matchOnline = !onlyOnline || f.pingStatus === 'ONLINE';
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        f.url.toLowerCase().includes(q);
      return matchCat && matchOnline && matchQuery;
    });
  }, [friends, selectedCategory, onlyOnline, searchQuery]);

  // 4. 触发光速跃迁随机漫游
  const handleRandomTeleport = () => {
    if (friends.length === 0) {
      toast.error(locale === 'en' ? 'No friends available' : '暂无可穿梭的友邻');
      return;
    }
    const target = friends[Math.floor(Math.random() * friends.length)];
    setWarpTarget(target);
  };

  // 5. 滚动定位至本站挂载卡
  const scrollToStation = () => {
    stationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // 标题文字字符数组（字符级渐显）
  const titleChars = (locale === 'en' ? 'Friends & Garden Allies' : '数字花园友邻圈').split('');

  return (
    <div className="relative w-full min-h-screen pb-28">
      {/* 1. 纯光影流光极光束空间背景 (Aurora Ambient) */}
      <AuroraBackground />

      {/* 2. 顶部 Hero 空间站总览 */}
      <section className="pt-28 pb-10 sm:pb-16 text-center max-w-4xl mx-auto px-4 space-y-6">
        {/* 顶部微呼吸光圈徽章 */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-semibold bg-white/90 dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-200 border border-slate-200/80 dark:border-white/[0.12] shadow-sm backdrop-blur-md">
          <Globe className="w-3.5 h-3.5 text-emerald-500 animate-spin-slow" />
          <span className="tracking-wide">WEBVERSE // 数字花园友邻圈</span>
        </div>

        {/* 字符级逐字渐入显现主标题 */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground font-sans flex items-center justify-center flex-wrap gap-x-1 select-none">
          {titleChars.map((ch, idx) => (
            <span
              key={idx}
              className="inline-block transition-transform duration-300 hover:-translate-y-1 hover:text-emerald-500 cursor-default"
              style={{
                animation: 'fadeRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
                animationDelay: `${idx * 0.04}s`,
              }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </h1>

        {/* 副标题 / 宣言 */}
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-sans">
          {locale === 'en'
            ? 'Walking alongside authentic thinkers, fullstack craftsmen, and open-web architects. Real data driven, zero fake marks.'
            : '与优秀的独立思考者、全栈工匠与设计创造者同行。拒绝虚假数据，拥抱真实开放互联。'}
        </p>

        {/* 空间站统计仪表 Bento 胶囊 (带 CountUp 递增) */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/85 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-white/[0.08] text-xs font-mono shadow-sm backdrop-blur-md hover:scale-102 transition-transform">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-muted-foreground">已收录盟友:</span>
            <span className="font-extrabold text-foreground">{animatedTotal} 位</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/85 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-white/[0.08] text-xs font-mono shadow-sm backdrop-blur-md hover:scale-102 transition-transform">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="text-muted-foreground">探活在线:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {animatedOnline} 节点
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/85 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-white/[0.08] text-xs font-mono shadow-sm backdrop-blur-md hover:scale-102 transition-transform">
            <Zap className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-muted-foreground">开源与极客:</span>
            <span className="font-extrabold text-purple-600 dark:text-purple-400">
              {animatedGeek} 席
            </span>
          </div>
        </div>

        {/* 顶部操作入口 */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsApplyOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-mono font-bold shadow-md hover:scale-103 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>申请友链</span>
          </button>
          <button
            onClick={handleRandomTeleport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/90 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-white/[0.08] text-foreground text-xs font-mono font-medium shadow-2xs hover:bg-slate-100 dark:hover:bg-neutral-800 active:scale-98 transition-all cursor-pointer backdrop-blur-md"
          >
            <Shuffle className="w-4 h-4 text-blue-500" />
            <span>随机漫游</span>
          </button>
          <button
            onClick={scrollToStation}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/90 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-white/[0.08] text-foreground text-xs font-mono font-medium shadow-2xs hover:bg-slate-100 dark:hover:bg-neutral-800 active:scale-98 transition-all cursor-pointer backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>本站互换卡片</span>
          </button>
        </div>
      </section>

      {/* 3. 页面主干内容 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Hayden Xue Station 专属本站挂载卡 */}
        <div ref={stationRef}>
          <FriendStationCard
            onApplyClick={() => setIsApplyOpen(true)}
            onRandomTeleport={handleRandomTeleport}
          />
        </div>

        {/* 友邻动态雷达 (Living Dispatch) */}
        {activities.length > 0 && (
          <FriendStreamRadar activities={activities} />
        )}

        {/* 分类检索与状态控制工具栏 */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* 分类药丸 */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold shadow-sm'
                      : 'bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  {cat === 'ALL' ? '全部友邻' : cat}
                </button>
              ))}

              {/* 仅在线筛选开关 */}
              <button
                onClick={() => setOnlyOnline(!onlyOnline)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                  onlyOnline
                    ? 'bg-emerald-500 text-white font-bold shadow-sm'
                    : 'bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] text-muted-foreground hover:text-foreground'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    onlyOnline ? 'bg-white animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <span>仅在线</span>
              </button>
            </div>

            {/* 实时搜索输入框 */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索友邻名称、简介或网址..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/85 dark:bg-neutral-900/65 border border-slate-200/80 dark:border-white/[0.08] text-xs text-foreground placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors font-sans backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 4. Bento 友邻展厅大网格 */}
        <main>
          {filteredFriends.length === 0 ? (
            <div className="text-center py-20 bg-white/60 dark:bg-neutral-900/40 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-8 space-y-3 backdrop-blur-xl">
              <Users className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm font-mono text-muted-foreground">未找到匹配的友邻站点</p>
              {(selectedCategory !== 'ALL' || onlyOnline || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setOnlyOnline(false);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 transition-transform hover:scale-102 cursor-pointer"
                >
                  重置筛选条件
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFriends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  featured={friend.category === '开源先锋' || friend.sortOrder < 5}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 友链申请弹窗 */}
      <FriendApplyModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
      />

      {/* 随机漫游光速跃迁 HUD 罗盘 */}
      <HyperspaceWarpModal
        target={warpTarget}
        onClose={() => setWarpTarget(null)}
      />
    </div>
  );
}
