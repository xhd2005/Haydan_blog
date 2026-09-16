'use client';

import React, { useState, useMemo } from 'react';
import { Friend } from '@/lib/types';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import { FriendCard } from '@/components/links/FriendCard';
import { FriendApplyModal } from '@/components/links/FriendApplyModal';
import { api } from '@/lib/api';
import {
  Radio,
  Plus,
  Compass,
  Search,
  Users,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  Shuffle,
  Globe,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  initialFriends: Friend[];
}

export function LinksInteractiveView({ initialFriends }: Props) {
  const { locale, t } = useI18n();
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [copiedInfo, setCopiedInfo] = useState(false);

  // 1. 真实博友统计
  const totalCount = friends.length;

  // 2. 随机漫游穿梭 (Random Teleport)
  const handleRandomTeleport = () => {
    if (friends.length === 0) {
      toast.error(locale === 'zh' ? '暂无可穿梭的友邻站点' : 'No friend links available');
      return;
    }
    const randomIndex = Math.floor(Math.random() * friends.length);
    const target = friends[randomIndex];

    toast.success(
      locale === 'zh'
        ? `正在穿梭至: ${target.name}...`
        : `Teleporting to ${target.name}...`
    );

    window.open(target.url, '_blank', 'noopener,noreferrer');
  };

  // 3. 复制本站信息
  const handleCopySiteInfo = () => {
    const info = `名称: Hayden Xue\n简介: From the East, toward the unknown. 全栈系统架构师与数字花园。\n网址: https://haydenxue.com\n头像: https://haydenxue.com/brand/avatar.png`;
    navigator.clipboard.writeText(info).then(() => {
      setCopiedInfo(true);
      toast.success('已复制本站友链信息到剪贴板！');
      setTimeout(() => setCopiedInfo(false), 2500);
    });
  };

  // 4. 分类与搜索过滤
  const categories = useMemo(() => {
    const set = new Set<string>();
    friends.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    set.add('独立博客');
    set.add('极客同好');
    set.add('开源先锋');
    return ['ALL', ...Array.from(set)];
  }, [friends]);

  const filteredFriends = useMemo(() => {
    return friends.filter((f) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        f.category === selectedCategory ||
        (selectedCategory === '独立博客' && !f.category);

      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        f.name.toLowerCase().includes(query) ||
        (f.description && f.description.toLowerCase().includes(query)) ||
        f.url.toLowerCase().includes(query);

      return matchCat && matchQuery;
    });
  }, [friends, selectedCategory, searchQuery]);

  return (
    <div className="space-y-12">
      {/* 1. 顶部全息 HUD 状态看板 (Clean, Authentic Hero) */}
      <section className="relative p-6 sm:p-10 rounded-3xl bg-white/85 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl backdrop-blur-xl overflow-hidden">
        {/* 背景微环境光晕 */}
        <div className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* 左侧：标题与开放互联网哲学 */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>{locale === 'zh' ? '开放互联星系 · 独立博友圈' : 'OPEN WEBRING & CREATORS'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-100">
              {locale === 'zh' ? '数字花园友邻圈' : 'Digital Garden Friends'}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              {locale === 'zh'
                ? '与优秀的创造者、全栈极客与思考者同行。摒弃虚构信息，在真实的开放互联网中漫游彼此的心流与灵感。'
                : 'Walking with creators, tech writers, and curious minds across the authentic open web.'}
            </p>

            {/* 真实指标统计 */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>收录真实友邻: <strong className="text-foreground">{totalCount}</strong> 位</span>
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>双向互换与健康连接</span>
              </div>
            </div>
          </div>

          {/* 右侧：操作按钮 (随机漫游 + 申请交换) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* 🎲 随机漫游穿梭机 */}
            <button
              onClick={handleRandomTeleport}
              className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-neutral-800 text-foreground text-xs font-semibold border border-slate-200/80 dark:border-white/[0.1] hover:border-emerald-500/50 shadow-sm transition-all cursor-pointer"
              title={locale === 'zh' ? '随机拜访一位活跃友邻博客' : 'Randomly visit an active friend site'}
            >
              <Shuffle className="w-4 h-4 text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
              <span>{locale === 'zh' ? '随机漫游穿梭' : 'Random Teleport'}</span>
            </button>

            {/* ＋ 申请交换友链 */}
            <button
              onClick={() => setIsApplyOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{locale === 'zh' ? '申请加入友链' : 'Apply for Link'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. 分类切换与搜索筛选 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2">
        {/* 分类 Tab */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-foreground text-background shadow-md'
                    : 'bg-white/80 dark:bg-neutral-900/60 hover:bg-white text-muted-foreground hover:text-foreground border border-slate-200/80 dark:border-white/[0.08]'
                }`}
              >
                {cat === 'ALL' ? (locale === 'zh' ? '全部友邻' : 'All') : cat}
              </button>
            );
          })}
        </div>

        {/* 搜索框 */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'zh' ? '搜索友邻站名、简介或域名...' : 'Search friends...'}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/60 transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* 3. 友邻卡片通栏宽屏栅格 (4 列自适应) */}
      {filteredFriends.length > 0 ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFriends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </section>
      ) : (
        <div className="p-16 rounded-3xl bg-white/60 dark:bg-neutral-900/40 border border-slate-200/80 dark:border-white/[0.08] text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {locale === 'zh' ? '未找到符合条件的友邻' : 'No friends found'}
          </p>
          <p className="text-xs text-muted-foreground">
            {locale === 'zh'
              ? '尝试更换分类或清空搜索关键词'
              : 'Try clearing the search query or changing category'}
          </p>
        </div>
      )}

      {/* 4. 本站信息卡片与申请契约 */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-500" />
              <span>{locale === 'zh' ? '友链交换契约与本站信息' : 'Exchange Principles & Site Info'}</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'zh'
                ? '站长 Hayden Xue 坚持真实、互信与长期的开放互联原则，欢迎同频创作者申请。'
                : 'Hayden Xue upholds authenticity and long-term values across the open web.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySiteInfo}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-xs font-mono font-medium text-foreground flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copiedInfo ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedInfo ? '已复制信息' : '一键复制本站信息'}</span>
            </button>
            <button
              onClick={() => setIsApplyOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {locale === 'zh' ? '提交申请' : 'Apply'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-neutral-950/40 border border-slate-200/80 dark:border-white/[0.06] space-y-1.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>独立域名与原创</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              拥有独立二级或顶级域名，持续保持原创技术思考、架构或设计手记输出。
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-neutral-950/40 border border-slate-200/80 dark:border-white/[0.06] space-y-1.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>稳定访问与 HTTPS</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              站点全站启用 HTTPS 安全协议，具备良好网络连通性。
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-neutral-950/40 border border-slate-200/80 dark:border-white/[0.06] space-y-1.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>双向平等互换</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              在提交申请前，请预先在贵站友链区添加本站信息，形成真正的去中心化双向互联。
            </p>
          </div>
        </div>
      </section>

      {/* 5. 自助申请模态框 */}
      <FriendApplyModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={() => {
          api.getFriends().then((res) => {
            if (Array.isArray(res)) setFriends(res);
          });
        }}
      />
    </div>
  );
}
