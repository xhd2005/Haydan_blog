'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  Sparkles,
  Loader2,
  Check,
  Copy,
  PenTool,
  Cpu,
  Scissors,
  SpellCheck,
  Send,
  X,
  CornerDownLeft,
  ArrowDown,
} from 'lucide-react';

interface InlineAiCopilotProps {
  selectedText: string;
  onReplace: (newText: string) => void;
  onInsertBelow: (newText: string) => void;
  onClose: () => void;
  position?: { x: number; y: number } | null;
}

export function InlineAiCopilot({
  selectedText,
  onReplace,
  onInsertBelow,
  onClose,
  position,
}: InlineAiCopilotProps) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleAction = async (action: 'POLISH' | 'EXPAND' | 'GENERATE_CODE' | 'PROOFREAD' | 'CUSTOM') => {
    if (!selectedText.trim() && action !== 'CUSTOM') {
      toast.warning('请先选中文本');
      return;
    }

    setLoading(true);
    setActiveAction(action);
    try {
      const res = await api.editorAssist({
        text: selectedText,
        action,
        prompt: action === 'CUSTOM' ? customPrompt : undefined,
      });
      setResult(res.result);
      toast.success(res.explanation || '生成成功');
    } catch (err: any) {
      toast.error(err.message || '创作副驾生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div
      style={
        position
          ? {
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 60,
            }
          : undefined
      }
      className="animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="w-[320px] sm:w-[380px] p-3 rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-slate-200/90 dark:border-white/[0.12] backdrop-blur-2xl shadow-2xl text-xs space-y-2.5 text-slate-800 dark:text-neutral-200">
        {/* 头部标题与关闭 */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] font-bold tracking-tight">HAYDEN // EDITORIAL COPILOT</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 快捷操作胶囊按钮栏 */}
        {!result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleAction('POLISH')}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/60 dark:border-white/[0.06] font-medium transition-all text-left cursor-pointer"
              >
                {loading && activeAction === 'POLISH' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                ) : (
                  <PenTool className="w-3.5 h-3.5 text-blue-500" />
                )}
                <div>
                  <div className="text-[11px] font-semibold">精简润色</div>
                  <div className="text-[9px] text-slate-400 dark:text-neutral-500 font-normal">提升技术语言质感</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction('EXPAND')}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-white/[0.06] font-medium transition-all text-left cursor-pointer"
              >
                {loading && activeAction === 'EXPAND' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <div>
                  <div className="text-[11px] font-semibold">深度扩写</div>
                  <div className="text-[9px] text-slate-400 dark:text-neutral-500 font-normal">展开论据与系统逻辑</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction('GENERATE_CODE')}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-white/[0.06] font-medium transition-all text-left cursor-pointer"
              >
                {loading && activeAction === 'GENERATE_CODE' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                ) : (
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <div>
                  <div className="text-[11px] font-semibold">生成代码</div>
                  <div className="text-[9px] text-slate-400 dark:text-neutral-500 font-normal">Java 25 / TS 最佳实践</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction('PROOFREAD')}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/60 dark:border-white/[0.06] font-medium transition-all text-left cursor-pointer"
              >
                {loading && activeAction === 'PROOFREAD' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                ) : (
                  <SpellCheck className="w-3.5 h-3.5 text-amber-500" />
                )}
                <div>
                  <div className="text-[11px] font-semibold">技术校对</div>
                  <div className="text-[9px] text-slate-400 dark:text-neutral-500 font-normal">规范专有名词与错词</div>
                </div>
              </button>
            </div>

            {/* 自定义指令折叠输入框 */}
            <div className="pt-1">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full text-center text-[10px] text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors py-1 cursor-pointer"
                >
                  + 自定义自由创作指令...
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="输入自定义修改要求..."
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-xs outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAction('CUSTOM');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAction('CUSTOM')}
                    disabled={!customPrompt.trim() || loading}
                    className="p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 生成结果展示与确认采纳 */}
        {result && (
          <div className="space-y-2.5">
            <div className="max-h-48 overflow-y-auto p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] font-mono text-[11px] leading-relaxed whitespace-pre-wrap scrollbar-thin">
              {result}
            </div>

            {/* 操作条：替换选区 / 插入下方 / 重新生成 / 取消 */}
            <div className="flex items-center justify-between pt-1 gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onReplace(result);
                    toast.success('已替换选区');
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  <CornerDownLeft className="w-3 h-3" />
                  <span>替换选区</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onInsertBelow(result);
                    toast.success('已插入在下方');
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 font-medium text-[11px] transition-all cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" />
                  <span>插入下方</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="复制结果"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
