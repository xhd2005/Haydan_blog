'use client';

import React, { useState } from 'react';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import {
  Sparkles,
  Copy,
  Check,
  Radio,
  ExternalLink,
  Code2,
  Send,
  Compass,
} from 'lucide-react';
import Image from 'next/image';

interface FriendStationCardProps {
  onApplyClick: () => void;
  onRandomTeleport: () => void;
}

export function FriendStationCard({ onApplyClick, onRandomTeleport }: FriendStationCardProps) {
  const { locale } = useI18n();
  const [activeFormat, setActiveFormat] = useState<'markdown' | 'html' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  // 严格遵守站长纯正性准则：Hayden Xue
  const siteConfig = {
    name: 'Hayden Xue',
    title: 'Hayden Xue // 数字花园',
    url: 'https://haydenxue.com',
    avatar: 'https://haydenxue.com/avatar.png',
    description: 'From the East, toward the unknown. 全栈系统架构师与数字花园。',
  };

  const codeSnippets: Record<'markdown' | 'html' | 'json', string> = {
    markdown: `- 名称: ${siteConfig.name}\n- 网址: ${siteConfig.url}\n- 图标: ${siteConfig.avatar}\n- 简介: ${siteConfig.description}`,
    html: `<a href="${siteConfig.url}" target="_blank" rel="noopener noreferrer">\n  <img src="${siteConfig.avatar}" alt="${siteConfig.name}" width="40" height="40" />\n  <span>${siteConfig.name}</span>\n</a>`,
    json: JSON.stringify(
      {
        name: siteConfig.name,
        url: siteConfig.url,
        avatar: siteConfig.avatar,
        desc: siteConfig.description,
      },
      null,
      2
    ),
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeFormat]);
    setCopied(true);
    toast.success(locale === 'en' ? 'Site code copied to clipboard!' : '已复制本站挂载代码！');
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="relative rounded-3xl bg-white/85 dark:bg-neutral-900/65 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-2xl p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] dark:shadow-[0_12px_36px_-4px_rgba(0,0,0,0.5)] hover:shadow-2xl transition-all duration-300 overflow-hidden group">
      {/* 玻璃切角微光棱镜 (Glass Edge Sheen) 顶部流光细线 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-emerald-400/40 to-transparent" />

      {/* 环境氛围光晕 (Ambient Glows) */}
      <div className="pointer-events-none absolute -right-20 -top-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/18 transition-all duration-500" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/18 transition-all duration-500" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
        {/* 左侧：站长名片与信条 */}
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
              <Radio className="w-3 h-3 animate-pulse text-emerald-500" />
              <span>STATION BEACON // ONLINE</span>
            </span>
            <span className="text-xs font-mono text-muted-foreground hidden sm:inline-block">
              坐标 // 开放数字花园
            </span>
          </div>

          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-500 shadow-md shrink-0 group-hover:scale-103 transition-transform duration-300">
              <div className="w-full h-full rounded-2xl bg-white dark:bg-neutral-950 overflow-hidden flex items-center justify-center relative">
                <Image
                  src="/avatar.png"
                  alt="Hayden Xue"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = '/brand/avatar.png';
                  }}
                />
              </div>
              {/* 站长专属翡翠光环 */}
              <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900 shadow-[0_0_10px_rgba(16,185,129,0.8)] flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground font-sans">
                  Hayden Xue
                </h3>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold border border-neutral-200/60 dark:border-white/10">
                  数字花园盟友
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                追求极简与克制，在不确定中构建高确定性的全栈工程与智能体系统。欢迎同频博友自由挂载互换。
              </p>
            </div>
          </div>

          {/* 快捷操作通道 */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onApplyClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-mono font-bold shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>申请友链互换</span>
            </button>
            <button
              onClick={onRandomTeleport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/90 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-white/10 text-foreground text-xs font-mono font-medium shadow-2xs hover:bg-slate-100 dark:hover:bg-neutral-700 active:scale-98 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" />
              <span>随机漫游穿梭</span>
            </button>
          </div>
        </div>

        {/* 右侧：代码挂载交互器 */}
        <div className="w-full lg:w-96 rounded-2xl bg-slate-900/95 dark:bg-black/95 border border-slate-800 dark:border-white/10 p-4 shadow-inner text-slate-200 font-mono text-xs space-y-3 shrink-0">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-300">挂载互换代码</span>
            </div>

            {/* 格式切换药丸 */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg text-[10px]">
              {(['markdown', 'html', 'json'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setActiveFormat(fmt)}
                  className={`px-2.5 py-1 rounded-md uppercase font-bold transition-all cursor-pointer ${
                    activeFormat === fmt
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* 代码预览窗口 */}
          <div className="relative group/code">
            <pre className="p-3 rounded-xl bg-black/60 text-[11px] leading-relaxed overflow-x-auto text-slate-300 font-mono max-h-28 scrollbar-thin border border-white/[0.04]">
              <code>{codeSnippets[activeFormat]}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-[11px] font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="复制到剪贴板"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>复制代码</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
            <span>标准互联格式规范</span>
            <span className="text-emerald-400/80">一键快速集成</span>
          </div>
        </div>
      </div>
    </div>
  );
}
