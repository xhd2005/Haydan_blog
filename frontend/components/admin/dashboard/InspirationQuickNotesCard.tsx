'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  Lightbulb,
  Send,
  FileEdit,
  Trash2,
  Copy,
  Sparkles,
  Check,
  Tag,
} from 'lucide-react';

interface QuickNote {
  id: string;
  content: string;
  category: string;
  createdAt: string;
}

const STORAGE_KEY = 'hayden_admin_quick_notes_v1';

const CATEGORIES = [
  { id: 'idea', label: '🌱 灵感闪念' },
  { id: 'thought', label: '💡 深度随笔' },
  { id: 'tech', label: '🛠️ 技术架构' },
  { id: 'todo', label: '📌 待办备忘' },
];

export function InspirationQuickNotesCard() {
  const router = useRouter();
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('idea');
  const [submittingMemo, setSubmittingMemo] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        // 初始默认指引便签
        const initial = [
          {
            id: 'init-1',
            content: '探索 Next.js 14 App Router 在边缘运行时下的流式水合优化方案',
            category: 'tech',
            createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          },
        ];
        setNotes(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch (e) {
      console.error('读取灵感便签失败', e);
    }
  }, []);

  const saveNotesToStorage = (updated: QuickNote[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('保存灵感便签失败', e);
    }
  };

  const handleAddNote = () => {
    if (!inputContent.trim()) {
      toast.warning('请输入灵感或备忘内容');
      return;
    }

    const newNote: QuickNote = {
      id: 'note-' + Date.now(),
      content: inputContent.trim(),
      category: selectedCategory,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    const updated = [newNote, ...notes];
    saveNotesToStorage(updated);
    setInputContent('');
    toast.success('灵感已收入便签盒');
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    saveNotesToStorage(updated);
    toast.info('已移除便签');
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success('便签内容已复制到剪贴板');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 一键发布为公开即时动态 (Memo)
  const handlePublishAsMemo = async (content: string) => {
    setSubmittingMemo(true);
    try {
      await api.createMemo({ content });
      toast.success('已一键同步发布到前台【此时此刻 (Memos)】动态！');
    } catch (err: any) {
      toast.error(err.message || '同步 Memo 失败');
    } finally {
      setSubmittingMemo(false);
    }
  };

  // 一键转为具备结构化大纲的博文草稿
  const handleConvertToDraftPost = (note: QuickNote) => {
    const rawContent = note.content.trim();
    const title = rawContent.length > 32 ? `${rawContent.slice(0, 32)}...` : rawContent;
    const catLabel = CATEGORIES.find((c) => c.id === note.category)?.label || '🌱 灵感闪念';

    // 生成结构化大纲 (Outline)，包含背景介绍、核心攻坚点、章节草稿骨架与架构复盘
    const structuredOutline = `# ${title}

> 摘要说明：本文基于数字花园灵感便签「${rawContent}」深度展开，构建生产级架构与工程实践方案。

## 1. 背景介绍与问题切入 (Background & Motivation)
- **便签灵感缘起**：${rawContent}（分类：${catLabel}）
- **核心业务痛点与技术诉求**：分析当下技术架构瓶颈与高并发/低延迟需求。
- **目标设定**：定义方案落地后的关键交付产物与 SLA 指标。

## 2. 核心架构设计与攻坚点 (Core Architecture & Key Breakthroughs)
- **分层拓扑结构**：明确底座驱动层、服务调度层与前端响应层的边界划分。
- **状态流转与数据一致性**：核心状态转移时序与容灾 Fallback 策略。
- **设计权衡 (Trade-offs)**：对比备选技术选型，阐明选型优势与取舍。

## 3. 生产实践与代码落地骨架 (Implementation & Engineering)
\`\`\`typescript
/**
 * 核心调度模块实现骨架
 * 遵循 Hayden Xue 博客工程设计准则
 */
export async function executeWorkflow(payload: Record<string, any>) {
  // 1. 前置参数校验与上下文准备
  if (!payload) {
    throw new Error('Workflow context payload is required');
  }

  // 2. 执行核心状态机转换
  console.log('[Workflow] Processing core milestone:', payload);

  // 3. 返回真实状态与执行结果
  return {
    success: true,
    author: 'Hayden Xue',
    timestamp: Date.now(),
  };
}
\`\`\`

## 4. 架构复盘与避坑指南 (Retrospective & Future Work)
- **核心踩坑记录**：开发调试过程中的关键防御点与边界考量。
- **性能基准与压测表现**：验证命令与预期性能指标。
- **演进路线规划**：下一阶段功能迭代路线。
`;

    // 存入 localStorage 以便 Post Studio (CreatePostPage) 秒级水合恢复
    try {
      localStorage.setItem(
        'draft_post_new',
        JSON.stringify({
          title,
          slug: title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, ''),
          content: structuredOutline,
          excerpt: `基于便签「${rawContent.slice(0, 50)}」提炼的结构化博文大纲草稿。`,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error('存储草稿大纲失败', e);
    }

    toast.success('已生成具备背景、核心攻坚点与代码骨架的博文大纲！');
    const encoded = encodeURIComponent(title);
    setTimeout(() => {
      router.push(`/admin/posts/create?title=${encoded}`);
    }, 300);
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.04] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>灵感便签快记盒 (Inspiration Box)</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                {notes.length} 条存盘
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              捕捉浮光掠影，支持本地自动防丢、一键转博文草稿或直发前台动态
            </p>
          </div>
        </div>
      </div>

      {/* 快捷录入区 */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleAddNote();
              }
            }}
            placeholder="记下一个绝妙想法或写作灵感... (Ctrl+Enter 快捷存盘)"
            rows={2}
            className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-50/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none resize-none"
          />

          <button
            type="button"
            onClick={handleAddNote}
            className="px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <span>收入</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 便签瀑布流列表 */}
      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {notes.length > 0 ? (
          notes.map((note) => {
            const cat = CATEGORIES.find((c) => c.id === note.category) || CATEGORIES[0];
            return (
              <div
                key={note.id}
                className="p-3 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.08] transition-all flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 font-mono">
                      {cat.label}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                      {note.createdAt}
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-zinc-200 leading-relaxed break-words text-[11px]">
                    {note.content}
                  </p>
                </div>

                {/* 快捷操作动作组 */}
                <div className="flex items-center gap-1 shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(note.content, note.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="复制内容"
                  >
                    {copiedId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePublishAsMemo(note.content)}
                    disabled={submittingMemo}
                    className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="直发前台此时此刻 (Memo)"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConvertToDraftPost(note)}
                    className="p-1 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="转为文章大纲草稿"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
            便签盒暂空，随时记下你的灵感火花
          </div>
        )}
      </div>
    </div>
  );
}
