'use client';

import React, { useState } from 'react';
import { SiteSetting } from '@/lib/types';
import { toast } from '@/lib/toast';
import { triggerRevalidate } from '@/components/admin/revalidate';
import {
  Wrench,
  RefreshCw,
  Search,
  Globe,
  Share2,
  CheckCircle2,
  Radio,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MaintenanceSettingsCardProps {
  initialSettings?: Partial<SiteSetting>;
  onSaved?: () => void;
}

export function MaintenanceSettingsCard({ initialSettings }: MaintenanceSettingsCardProps) {
  const [revalidating, setRevalidating] = useState(false);
  const [lastRevalidatedAt, setLastRevalidatedAt] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<'google' | 'twitter'>('google');

  const siteTitle = initialSettings?.seoTitle || initialSettings?.siteName || 'Hayden Xue - Personal Blog & Digital Garden';
  const siteDesc = initialSettings?.seoDescription || initialSettings?.siteDescription || 'Software developer and lifelong learner exploring technology, AI, and the world.';
  const domain = 'https://haydenxue.com';

  const handleRevalidateAll = async () => {
    setRevalidating(true);
    try {
      const paths = ['/', '/posts', '/journey', '/projects', '/memos', '/about', '/archive', '/graph'];
      await triggerRevalidate(paths);
      setLastRevalidatedAt(new Date().toLocaleTimeString());
      toast.success(`全站 ${paths.length} 个核心路由 ISR 缓存已触发增量重构刷新`);
    } catch (err: any) {
      toast.error(err.message || '重构缓存失败');
    } finally {
      setRevalidating(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden transition-all">
      {/* 头部标题与操作 */}
      <div className="p-6 border-b border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>全站 ISR 缓存重构与 SEO 社交预览</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold">
                Ops & SEO
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              一键按需清退全站静态页面缓存，并实时预览 Google 搜索与 Twitter (X) 社交卡片分享渲染效果
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRevalidateAll}
            disabled={revalidating}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${revalidating ? 'animate-spin' : ''}`} />
            <span>{revalidating ? '正在重构全网缓存...' : '一键触发全站 ISR 重构'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 text-xs">
        {/* 1. 全站 ISR 缓存状态通知 */}
        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-indigo-500 animate-pulse shrink-0" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Next.js 按需增量静态再生 (On-Demand ISR)</span>
                {lastRevalidatedAt && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    上次重构时间: {lastRevalidatedAt}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                覆盖首页、博客归档、足迹地图、精选项目、随记等全部边缘节点，修改设置后可即时生效。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/[0.08] font-mono text-slate-600 dark:text-zinc-300">
              CDN Stale-While-Revalidate: 就绪
            </span>
          </div>
        </div>

        {/* 2. SEO 社交分享卡片实时模拟器 */}
        <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Share2 className="w-4 h-4 text-cyan-500" />
              <span>SEO 搜索引擎与社交卡片实时交互预览</span>
            </div>

            {/* 切换预览 Tab */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/[0.06] p-0.5 border border-slate-200 dark:border-white/[0.08] text-[11px]">
              <button
                type="button"
                onClick={() => setActivePreview('google')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activePreview === 'google'
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Search className="w-3 h-3 text-blue-500" />
                <span>Google 搜索结果</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePreview('twitter')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activePreview === 'twitter'
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3 h-3 text-sky-500" />
                <span>Twitter / X 卡片</span>
              </button>
            </div>
          </div>

          {/* Google 预览 */}
          {activePreview === 'google' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1f1f1f] border border-slate-200/80 dark:border-white/[0.12] shadow-sm space-y-1.5 font-sans">
              <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-[#bdc1c6]">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                  H
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-[#dadce0] text-xs leading-none">
                    Hayden Xue
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-[#9aa0a6] leading-none mt-0.5 font-mono">
                    {domain}
                  </span>
                </div>
              </div>

              <h4 className="text-base text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium line-clamp-1">
                {siteTitle}
              </h4>

              <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                {siteDesc}
              </p>

              <div className="pt-2 flex items-center gap-3 text-[10px] text-slate-400 dark:text-[#9aa0a6] font-mono">
                <span>标题长度: {siteTitle.length} 字符 (建议 ≤ 60)</span>
                <span>·</span>
                <span>描述长度: {siteDesc.length} 字符 (建议 ≤ 160)</span>
              </div>
            </div>
          )}

          {/* Twitter / X 预览 */}
          {activePreview === 'twitter' && (
            <div className="max-w-md mx-auto rounded-2xl overflow-hidden bg-white dark:bg-black border border-slate-200 dark:border-white/[0.15] shadow-sm font-sans">
              <div className="aspect-[16/9] bg-gradient-to-br from-neutral-900 to-slate-950 flex flex-col items-center justify-center text-center p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_60%)]" />
                <Sparkles className="w-8 h-8 text-emerald-400 mb-2 relative z-10" />
                <h5 className="font-bold text-base tracking-tight relative z-10">{siteTitle}</h5>
                <p className="text-xs text-neutral-400 line-clamp-1 mt-1 relative z-10">{siteDesc}</p>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-neutral-500">
                  haydenxue.com
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-neutral-900 border-t border-slate-100 dark:border-white/[0.08] space-y-0.5">
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">haydenxue.com</div>
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{siteTitle}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">{siteDesc}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
