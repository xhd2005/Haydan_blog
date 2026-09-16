'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PenTool, 
  Sparkles, 
  Cpu, 
  Command, 
  Plus, 
  ArrowRight, 
  Send, 
  Loader2, 
  CheckCircle2, 
  ChevronDown,
  Layers,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface QuickActionIslandProps {
  aiModel?: string;
  onOpenPalette?: () => void;
  onMemoCreated?: () => void;
}

export function QuickActionIsland({
  aiModel = 'SenseNova / DeepSeek-V4',
  onOpenPalette,
  onMemoCreated,
}: QuickActionIslandProps) {
  const router = useRouter();

  // 快发随记轻量输入抽屉展开状态
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoContent, setMemoContent] = useState('');
  const [memoPosting, setMemoPosting] = useState(false);

  // 双语文章选择器展开状态
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // AI 状态检测中状态
  const [aiChecking, setAiChecking] = useState(false);
  const [activeModel, setActiveModel] = useState(aiModel);

  // 处理快发随记
  const handlePostMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoContent.trim()) return;

    setMemoPosting(true);
    try {
      await api.createMemo({
        content: memoContent.trim(),
        isPinned: 0,
      });
      toast.success('随记微动态发布成功！');
      setMemoContent('');
      setMemoOpen(false);
      if (onMemoCreated) onMemoCreated();
    } catch (err: any) {
      toast.error(err.message || '发布随记失败');
    } finally {
      setMemoPosting(false);
    }
  };

  // 快速测试 / 探测 AI 伴读大模型
  const handleCheckAi = async () => {
    setAiChecking(true);
    try {
      const res = await api.getAiStatus();
      if (res?.model) {
        setActiveModel(res.model);
      }
      toast.success(`AI 推理引擎状态正常：当前激活 ${res?.model || activeModel}`);
    } catch {
      toast.info('AI 智能体处于待命状态');
    } finally {
      setAiChecking(false);
    }
  };

  return (
    <div className="relative z-20 rounded-2xl p-3 bg-white/90 dark:bg-[#0c0d12]/90 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.4)] transition-all space-y-3">
      {/* 灵动岛核心工具栏胶囊群 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 左侧：灵动岛标识与双语博文一键新建 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold select-none">
            <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>创作快捷灵动岛</span>
          </div>

          {/* 一键新建双语博文 (带中英文快速分流) */}
          <div className="relative">
            <div className="inline-flex rounded-xl shadow-sm">
              <button
                type="button"
                onClick={() => router.push('/admin/posts/create')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl bg-slate-900 hover:bg-black dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>新建博文</span>
              </button>
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                title="选择创作语言版本"
                className="px-2 py-1.5 rounded-r-xl bg-slate-800 hover:bg-slate-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-black text-xs border-l border-slate-700 dark:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* 双语选择微气泡 */}
            {langMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-[#14151c] border border-slate-200 dark:border-white/[0.1] shadow-xl p-1.5 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setLangMenuOpen(false);
                    router.push('/admin/posts/create?lang=zh');
                  }}
                  className="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-200 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-mono text-[10px]">ZH</span>
                    <span>新建中文主文章</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setLangMenuOpen(false);
                    router.push('/admin/posts/create?lang=en');
                  }}
                  className="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-200 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 font-mono text-[10px]">EN</span>
                    <span>新建英文直译版本</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            )}
          </div>

          {/* 一键快发随记拍立得开关 */}
          <button
            type="button"
            onClick={() => setMemoOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              memoOpen
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-sm'
                : 'bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{memoOpen ? '收起随记发布' : '快发随记拍立得'}</span>
          </button>
        </div>

        {/* 右侧：AI 推理模型监控与全局 Cmd+K 唤醒 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI 推理模型监控卡片 */}
          <button
            type="button"
            onClick={handleCheckAi}
            disabled={aiChecking}
            title="点击探测 AI 伴读推理大模型运行状态"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-xs transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-500" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-zinc-400 text-[11px] hidden sm:inline">AI 模型:</span>
              <span className="font-mono text-slate-800 dark:text-zinc-200 font-medium">
                {activeModel.includes('SenseNova') ? 'SenseNova 4.0' : activeModel}
              </span>
            </div>
            {aiChecking ? (
              <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          {/* 全局命令面板一键呼出 */}
          <button
            type="button"
            onClick={() => {
              if (onOpenPalette) {
                onOpenPalette();
              } else {
                window.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
                );
              }
            }}
            title="呼出全局命令面板 (Cmd+K)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <Command className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline font-mono">Cmd+K</span>
          </button>
        </div>
      </div>

      {/* 快发随记微抽屉展开 */}
      {memoOpen && (
        <form
          onSubmit={handlePostMemo}
          className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="relative rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.02] p-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="在此记录今日微灵感、随笔摘抄或思考碎片（发布后自动同步至前台 3D 拍立得动态墙）..."
              rows={2}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none resize-none"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/[0.04] text-xs">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                {memoContent.length} 字 · 支持 Markdown
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/admin/memos')}
                  className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  进入随记工坊
                </button>

                <button
                  type="submit"
                  disabled={memoPosting || !memoContent.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {memoPosting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>发布随记</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
