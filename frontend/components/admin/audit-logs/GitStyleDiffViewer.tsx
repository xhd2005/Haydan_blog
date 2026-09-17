'use client';

import React, { useState, useMemo } from 'react';
import { GitCompare, Columns, AlignJustify, Copy, Check } from 'lucide-react';
import { toast } from '@/lib/toast';

interface DiffLine {
  type: 'add' | 'delete' | 'equal';
  content: string;
  beforeLineNum?: number;
  afterLineNum?: number;
}

interface GitStyleDiffViewerProps {
  before?: string;
  after?: string;
  title?: string;
}

/**
 * 逐行 LCS 文本差异计算引擎
 */
function computeLineDiff(beforeText: string = '', afterText: string = ''): DiffLine[] {
  const allBeforeLines = beforeText.split('\n');
  const allAfterLines = afterText.split('\n');

  // 如果两者完全相同
  if (beforeText === afterText) {
    return allBeforeLines.map((line, idx) => ({
      type: 'equal',
      content: line,
      beforeLineNum: idx + 1,
      afterLineNum: idx + 1,
    }));
  }

  // 防 OOM 保护：单次计算行数上限 1000 行
  const MAX_DIFF_LINES = 1000;
  const isTruncated = allBeforeLines.length > MAX_DIFF_LINES || allAfterLines.length > MAX_DIFF_LINES;
  const beforeLines = allBeforeLines.slice(0, MAX_DIFF_LINES);
  const afterLines = allAfterLines.slice(0, MAX_DIFF_LINES);

  // 采用动态规划 LCS 矩阵
  const m = beforeLines.length;
  const n = afterLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (beforeLines[i - 1] === afterLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯生成 diff 列表
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
      result.unshift({
        type: 'equal',
        content: beforeLines[i - 1],
        beforeLineNum: i,
        afterLineNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'add',
        content: afterLines[j - 1],
        afterLineNum: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: 'delete',
        content: beforeLines[i - 1],
        beforeLineNum: i,
      });
      i--;
    }
  }

  if (isTruncated) {
    result.push({
      type: 'equal',
      content: `... [差异行数过大，已截断仅展示前 ${MAX_DIFF_LINES} 行对比] ...`,
    });
  }

  return result;
}

export function GitStyleDiffViewer({
  before = '',
  after = '',
  title = '数据变更 Diff 检视 (Before vs After)',
}: GitStyleDiffViewerProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState(false);

  const diffLines = useMemo(() => computeLineDiff(before, after), [before, after]);

  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    diffLines.forEach((l) => {
      if (l.type === 'add') additions++;
      if (l.type === 'delete') deletions++;
    });
    return { additions, deletions };
  }, [diffLines]);

  const handleCopyRawDiff = async () => {
    try {
      const raw = diffLines
        .map((l) => {
          const prefix = l.type === 'add' ? '+ ' : l.type === 'delete' ? '- ' : '  ';
          return `${prefix}${l.content}`;
        })
        .join('\n');
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      toast.success('已复制 Git 补丁格式 Diff 到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-950 text-slate-100 overflow-hidden shadow-md text-xs font-mono">
      {/* Diff 控制栏 */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200 text-xs font-sans">{title}</span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              +{stats.additions}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              -{stats.deletions}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 模式切换 */}
          <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              title="逐行统一视图 (Unified)"
              className={`px-2 py-1 rounded text-[10px] font-sans flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'unified'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlignJustify className="w-3 h-3" />
              <span>逐行</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              title="双栏分屏视图 (Split)"
              className={`px-2 py-1 rounded text-[10px] font-sans flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span>分栏</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyRawDiff}
            title="复制 Diff 补丁"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Diff 内容视图 */}
      <div className="max-h-80 overflow-y-auto overflow-x-auto p-2 leading-relaxed custom-scrollbar select-text text-[11px]">
        {viewMode === 'unified' ? (
          /* Unified 逐行视图 */
          <div className="space-y-0.5 min-w-max">
            {diffLines.map((line, idx) => {
              const isAdd = line.type === 'add';
              const isDel = line.type === 'delete';

              return (
                <div
                  key={idx}
                  className={`flex items-start rounded px-2 py-0.5 transition-colors ${
                    isAdd
                      ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-400'
                      : isDel
                      ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-400'
                      : 'text-slate-400 hover:bg-white/[0.02]'
                  }`}
                >
                  {/* 行号列 */}
                  <span className="w-8 text-right pr-2 text-slate-600 select-none opacity-60 text-[10px]">
                    {line.beforeLineNum ?? ''}
                  </span>
                  <span className="w-8 text-right pr-2 text-slate-600 select-none opacity-60 text-[10px]">
                    {line.afterLineNum ?? ''}
                  </span>
                  {/* 操作符标志 */}
                  <span
                    className={`w-4 select-none font-bold ${
                      isAdd ? 'text-emerald-400' : isDel ? 'text-rose-400' : 'text-slate-600'
                    }`}
                  >
                    {isAdd ? '+' : isDel ? '-' : ' '}
                  </span>
                  {/* 行文本内容 */}
                  <span className="flex-1 whitespace-pre-wrap break-all font-mono">
                    {line.content || ' '}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Split 双栏分屏视图 */
          <div className="grid grid-cols-2 gap-2 min-w-[500px]">
            {/* 左侧：Before (旧版本) */}
            <div className="border-r border-slate-800 pr-2 space-y-0.5">
              <div className="text-[10px] text-slate-500 font-sans pb-1 mb-1 border-b border-slate-800">
                修改前 (Before)
              </div>
              {before.split('\n').map((line, idx) => (
                <div
                  key={`b-${idx}`}
                  className="flex items-start text-rose-300 bg-rose-950/20 px-2 py-0.5 rounded"
                >
                  <span className="w-6 text-right pr-2 text-slate-600 select-none text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre-wrap break-all flex-1">{line || ' '}</span>
                </div>
              ))}
            </div>

            {/* 右侧：After (新版本) */}
            <div className="pl-2 space-y-0.5">
              <div className="text-[10px] text-slate-500 font-sans pb-1 mb-1 border-b border-slate-800">
                修改后 (After)
              </div>
              {after.split('\n').map((line, idx) => (
                <div
                  key={`a-${idx}`}
                  className="flex items-start text-emerald-300 bg-emerald-950/20 px-2 py-0.5 rounded"
                >
                  <span className="w-6 text-right pr-2 text-slate-600 select-none text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre-wrap break-all flex-1">{line || ' '}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
