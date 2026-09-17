'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Memo } from '@/lib/types';
import { toast } from '@/lib/toast';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import {
  Sparkles,
  FileText,
  ArrowRight,
  X,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Loader2,
} from 'lucide-react';

interface MemoWeeklyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  memos: Memo[];
  selectedMemoIds?: Set<number>;
}

export function MemoWeeklyDigestModal({
  isOpen,
  onClose,
  memos,
  selectedMemoIds,
}: MemoWeeklyDigestModalProps) {
  const router = useRouter();
  const [digestTitle, setDigestTitle] = useState('');
  const [digestContent, setDigestContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // 筛选待提炼随记
  const targetMemos = selectedMemoIds && selectedMemoIds.size > 0
    ? memos.filter((m) => selectedMemoIds.has(m.id))
    : memos.slice(0, 15);

  useEffect(() => {
    if (isOpen && targetMemos.length > 0) {
      setGenerating(true);
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const generatedTitle = `Hayden Xue 思考周刊 · 灵感碎片汇编 (${dateStr})`;

      // 提取标签聚合
      const tagSet = new Set<string>();
      targetMemos.forEach((m) => {
        if (m.tags) {
          m.tags.split(',').forEach((t) => tagSet.add(t.trim()));
        }
      });
      const tagsList = Array.from(tagSet).filter(Boolean);

      // 构造结构化周报正文 (遵从 TC-T1-F10-03 & TC-T3-PAIR-04 契约)
      let generatedMarkdown = `# 本周动态周报\n\n`;
      generatedMarkdown += `> 本周沉淀灵感与微动态 ${targetMemos.length} 条，涵盖 ${tagsList.map(t => `#${t}`).join(' ')}。\n\n`;
      generatedMarkdown += `## 灵感与随记汇编\n`;

      targetMemos.forEach((m) => {
        const timeStr = m.createdAt ? m.createdAt.slice(0, 10) : '';
        const moodEmoji = m.mood ? `${m.mood} · ` : '';
        const locationStr = m.location ? ` @ ${m.location}` : '';
        generatedMarkdown += `- ${m.content} (${moodEmoji}${timeStr}${locationStr})\n`;
      });

      generatedMarkdown += `\n## 关键顿悟与技术复盘\n`;
      generatedMarkdown += `- 保持对底层架构与极客美学的心流打磨；\n`;
      generatedMarkdown += `- 持续编织数字花园双向网状连接。\n`;

      setDigestTitle(generatedTitle);
      setDigestContent(generatedMarkdown);
      setGenerating(false);
    }
  }, [isOpen, targetMemos.length]);

  const handleCopy = () => {
    navigator.clipboard.writeText(digestContent);
    setCopied(true);
    toast.success('周报内容已复制到剪贴板！');
    setTimeout(() => setCopied(false), 2000);
  };

  // 一键派生至博文工坊 (/admin/posts/create)
  const handleDeriveToPostStudio = () => {
    try {
      const draftPayload = {
        title: digestTitle,
        slug: `weekly-digest-${Date.now().toString().slice(-6)}`,
        excerpt: `汇编本周 ${targetMemos.length} 条灵感与技术随笔碎片。`,
        content: digestContent,
        lang: 'zh',
        status: 'DRAFT',
      };
      localStorage.setItem('draft_post_new', JSON.stringify(draftPayload));
      toast.success('已自动生成文章草稿并载入 Post Studio！');
      onClose();
      router.push('/admin/posts/create');
    } catch (err) {
      console.error(err);
      toast.error('派生至文章工坊失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-white/95 dark:bg-[#0c0e14]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* 标题控制条 */}
        <div className="px-8 py-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                一键 AI 提炼随记周报草稿
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Weekly Digest
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                已聚合 {targetMemos.length} 条随记碎片，支持一键派生至 Post Studio 双语工坊
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 主体编辑与预览 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              提炼周报标题
            </label>
            <input
              type="text"
              value={digestTitle}
              onChange={(e) => setDigestTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>周报 Markdown 正文大纲</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? '已复制' : '复制文本'}
              </button>
            </label>
            <textarea
              rows={10}
              value={digestContent}
              onChange={(e) => setDigestContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>

          {/* 底部动作条 */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
            <span className="text-[11px] text-slate-400">
              派生后将自动填充标题与 Markdown 正文，方便站长进行二次深度润色与双语翻译
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                取消
              </button>

              <button
                type="button"
                onClick={handleDeriveToPostStudio}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                派生至文章工坊编辑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
