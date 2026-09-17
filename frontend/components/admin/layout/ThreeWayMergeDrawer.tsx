'use client';

import React, { useState, useMemo } from 'react';
import {
  GitMerge,
  X,
  AlertTriangle,
  Check,
  ArrowRight,
  SplitSquareVertical,
  Laptop,
  Cloud,
  FileCheck2,
  Undo2
} from 'lucide-react';
import {
  computeThreeWayMerge,
  ThreeWayMergeConflict,
  ThreeWayMergeResult,
} from '@/lib/threeWayMerge';

export { computeThreeWayMerge };
export type { ThreeWayMergeConflict, ThreeWayMergeResult };

export interface ThreeWayMergeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  baseContent: string;
  localContent: string;
  cloudContent: string;
  onResolve: (resolvedContent: string) => void;
}

export function ThreeWayMergeDrawer({
  isOpen,
  onClose,
  title = '离线与云端数据冲突仲裁',
  baseContent,
  localContent,
  cloudContent,
  onResolve,
}: ThreeWayMergeDrawerProps) {
  const [viewMode, setViewMode] = useState<'diff' | 'preview' | 'smart'>('diff');

  const { hasConflict, conflicts, mergedContent } = useMemo(() => {
    return computeThreeWayMerge(baseContent, localContent, cloudContent);
  }, [baseContent, localContent, cloudContent]);

  const [customDraft, setCustomDraft] = useState<string>(mergedContent);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      data-testid="three-way-merge-drawer"
    >
      <div
        className="w-full sm:w-[720px] lg:w-[860px] h-full backdrop-blur-2xl bg-white/95 dark:bg-neutral-900/95 border-l border-slate-200/90 dark:border-white/[0.12] shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-200 select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="h-16 shrink-0 px-6 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
                {hasConflict ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>检测到 {conflicts.length} 处冲突</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>无直接行级冲突 (可自动合并)</span>
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                本地 IndexedDB 沙盒快照与云端数据存在分支差异，请人工裁决仲裁方案。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 切换对比视图 */}
        <div className="px-6 py-2 border-b border-slate-200/60 dark:border-white/[0.06] bg-slate-50/50 dark:bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-white/[0.04]">
            <button
              onClick={() => setViewMode('diff')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'diff'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              三端分栏对比
            </button>
            <button
              onClick={() => setViewMode('smart')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'smart'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              合并结果编辑预览
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
            Base vs Local vs Cloud
          </span>
        </div>

        {/* 主体对比区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {viewMode === 'diff' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 本地沙盒版本 */}
              <div className="flex flex-col border border-emerald-500/30 rounded-2xl overflow-hidden bg-emerald-500/[0.02]">
                <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>本地离线沙盒 (Local)</span>
                  </span>
                  <button
                    onClick={() => onResolve(localContent)}
                    className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors"
                  >
                    选用此版本
                  </button>
                </div>
                <pre className="p-3 text-[11px] font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto text-slate-800 dark:text-zinc-200">
                  {localContent || '（空文档）'}
                </pre>
              </div>

              {/* 云端远程版本 */}
              <div className="flex flex-col border border-blue-500/30 rounded-2xl overflow-hidden bg-blue-500/[0.02]">
                <div className="px-3 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>云端最新同步 (Cloud)</span>
                  </span>
                  <button
                    onClick={() => onResolve(cloudContent)}
                    className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors"
                  >
                    选用此版本
                  </button>
                </div>
                <pre className="p-3 text-[11px] font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto text-slate-800 dark:text-zinc-200">
                  {cloudContent || '（空文档）'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span>合并草稿编辑器（可直接手动调整）</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  已标注局部差异标记
                </span>
              </label>
              <textarea
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                rows={16}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.1] font-mono text-xs text-slate-900 dark:text-zinc-100 outline-none leading-relaxed custom-scrollbar"
              />
            </div>
          )}

          {/* 冲突明细提示 */}
          {conflicts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>冲突行数定位清单</span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar text-[11px] font-mono">
                {conflicts.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-lg bg-white/70 dark:bg-black/40 border border-amber-500/20 text-slate-700 dark:text-zinc-300"
                  >
                    <span className="font-bold text-amber-600">第 {c.line} 行：</span>
                    <div className="pl-2">本地: {c.local}</div>
                    <div className="pl-2">云端: {c.cloud}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部决断操作条 */}
        <div className="h-16 shrink-0 px-6 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-black/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors"
          >
            暂不处理 (保留离线快照)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onResolve(localContent)}
              className="px-3 py-1.5 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium transition-colors"
            >
              强制保留本地
            </button>
            <button
              onClick={() => onResolve(cloudContent)}
              className="px-3 py-1.5 rounded-xl border border-blue-500/30 hover:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-medium transition-colors"
            >
              强制采用云端
            </button>
            <button
              onClick={() => onResolve(viewMode === 'smart' ? customDraft : mergedContent)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>智能合并并提交</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
