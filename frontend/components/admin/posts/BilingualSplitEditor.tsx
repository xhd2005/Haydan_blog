'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { calculateWordMetrics } from '@/components/MarkdownEditor';
import {
  Columns,
  Languages,
  RotateCcw,
  Copy,
  Sparkles,
  Check,
  Eye,
  Edit3,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from '@/lib/toast';

export interface BilingualSplitEditorProps {
  zhContent: string;
  enContent: string;
  onChangeZh: (val: string) => void;
  onChangeEn: (val: string) => void;
  zhTitle?: string;
  enTitle?: string;
  onChangeZhTitle?: (val: string) => void;
  onChangeEnTitle?: (val: string) => void;
}

export function BilingualSplitEditor({
  zhContent,
  enContent,
  onChangeZh,
  onChangeEn,
  zhTitle,
  enTitle,
  onChangeZhTitle,
  onChangeEnTitle,
}: BilingualSplitEditorProps) {
  const [activeMode, setActiveMode] = useState<'edit' | 'preview'>('edit');
  const [syncScroll, setSyncScroll] = useState(true);

  const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
  const rightTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isScrollingRef = useRef<'left' | 'right' | null>(null);

  // 同步滚动计算 (两栏按滚动比例严格镜像)
  const handleLeftScroll = () => {
    if (!syncScroll || isScrollingRef.current === 'right') return;
    isScrollingRef.current = 'left';
    const left = leftTextareaRef.current;
    const right = rightTextareaRef.current;
    if (left && right) {
      const scrollRatio = left.scrollTop / (left.scrollHeight - left.clientHeight || 1);
      right.scrollTop = scrollRatio * (right.scrollHeight - right.clientHeight);
    }
    setTimeout(() => {
      if (isScrollingRef.current === 'left') isScrollingRef.current = null;
    }, 60);
  };

  const handleRightScroll = () => {
    if (!syncScroll || isScrollingRef.current === 'left') return;
    isScrollingRef.current = 'right';
    const left = leftTextareaRef.current;
    const right = rightTextareaRef.current;
    if (left && right) {
      const scrollRatio = right.scrollTop / (right.scrollHeight - right.clientHeight || 1);
      left.scrollTop = scrollRatio * (left.scrollHeight - left.clientHeight);
    }
    setTimeout(() => {
      if (isScrollingRef.current === 'right') isScrollingRef.current = null;
    }, 60);
  };

  const zhMetrics = calculateWordMetrics(zhContent);
  const enMetrics = calculateWordMetrics(enContent);

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
      {/* 顶部双语控制条 */}
      <div className="px-5 py-3 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/60 dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <Languages className="w-4 h-4 text-indigo-500" />
            <span>中英双语原生分屏对照工作台</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            (Bilingual Studio · 左右双栏实时镜像)
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* 同步滚动开关 */}
          <button
            type="button"
            onClick={() => setSyncScroll(!syncScroll)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
              syncScroll
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-200/50 dark:bg-white/5 text-slate-400'
            }`}
          >
            <span>同步滚动: {syncScroll ? 'ON' : 'OFF'}</span>
          </button>

          {/* 模式切换 */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/60 dark:bg-white/10">
            <button
              type="button"
              onClick={() => setActiveMode('edit')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeMode === 'edit'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500'
              }`}
            >
              编辑对照
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('preview')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeMode === 'preview'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500'
              }`}
            >
              渲染预览
            </button>
          </div>
        </div>
      </div>

      {/* 双栏工作区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-white/[0.08] min-h-[500px]">
        {/* 左栏：中文 (zh-CN) */}
        <div className="p-5 flex flex-col space-y-3 bg-slate-50/20 dark:bg-black/10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-500/20">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              中文母本 (zh-CN)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {zhMetrics.totalCount} 字符 · {zhMetrics.readingTimeMinutes} 分钟
            </span>
          </div>

          {onChangeZhTitle && (
            <input
              type="text"
              value={zhTitle || ''}
              onChange={(e) => onChangeZhTitle(e.target.value)}
              placeholder="中文文章标题..."
              className="w-full text-base font-bold bg-transparent border-0 border-b border-slate-200/80 dark:border-white/[0.08] focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none py-1"
            />
          )}

          {activeMode === 'edit' ? (
            <textarea
              ref={leftTextareaRef}
              value={zhContent}
              onChange={(e) => onChangeZh(e.target.value)}
              onScroll={handleLeftScroll}
              placeholder="在此书写中文正文..."
              className="w-full flex-1 min-h-[420px] bg-transparent font-mono text-sm leading-relaxed text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none resize-none"
            />
          ) : (
            <div className="flex-1 min-h-[420px] overflow-y-auto pr-2 text-sm leading-relaxed">
              <MarkdownViewer content={zhContent || '*(暂无中文正文)*'} />
            </div>
          )}
        </div>

        {/* 右栏：英文 (en-US) */}
        <div className="p-5 flex flex-col space-y-3 bg-indigo-50/10 dark:bg-black/20">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold border border-indigo-500/20">
              <Languages className="w-3.5 h-3.5 text-indigo-500" />
              English Version (en-US)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {enMetrics.englishCount} words · {enMetrics.readingTimeMinutes} min
            </span>
          </div>

          {onChangeEnTitle && (
            <input
              type="text"
              value={enTitle || ''}
              onChange={(e) => onChangeEnTitle(e.target.value)}
              placeholder="English Article Title..."
              className="w-full text-base font-bold bg-transparent border-0 border-b border-slate-200/80 dark:border-white/[0.08] focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none py-1"
            />
          )}

          {activeMode === 'edit' ? (
            <textarea
              ref={rightTextareaRef}
              value={enContent}
              onChange={(e) => onChangeEn(e.target.value)}
              onScroll={handleRightScroll}
              placeholder="Type or translate English text here..."
              className="w-full flex-1 min-h-[420px] bg-transparent font-mono text-sm leading-relaxed text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none resize-none"
            />
          ) : (
            <div className="flex-1 min-h-[420px] overflow-y-auto pr-2 text-sm leading-relaxed">
              <MarkdownViewer content={enContent || '*(No English content yet)*'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
