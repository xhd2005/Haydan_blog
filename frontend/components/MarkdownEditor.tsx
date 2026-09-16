'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  FileCode,
  Table,
  Link as LinkIcon,
  Image as ImageIcon,
  Columns,
  Edit3,
  Eye,
  RotateCcw,
  Save,
  Loader2,
  Trash2,
  ListTree,
  ChevronRight,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  AlignLeft,
  ChevronsUpDown,
} from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { InlineAiCopilot } from './admin/InlineAiCopilot';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

export interface TocItem {
  id: string;
  level: number;
  text: string;
  lineNumber: number;
}

/**
 * 高精度字数统计与阅读时长计算
 */
export function calculateWordMetrics(markdown: string) {
  if (!markdown) {
    return { chineseCount: 0, englishCount: 0, totalCount: 0, readingTimeMinutes: 1 };
  }

  // 剔除多行代码块与行内代码
  let clean = markdown.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
  // 剔除图片语法 ![alt](url)
  clean = clean.replace(/!\[.*?\]\(.*?\)/g, ' ');
  // 将链接语法 [text](url) 提取为 text
  clean = clean.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  // 剔除 HTML 标签与 Markdown 控制符
  clean = clean.replace(/<[^>]+>/g, ' ').replace(/[#*>\-_~`|=+\[\]\(\)\{\}\\]/g, ' ');

  // 统计中文字符数
  const zhMatches = clean.match(/[\u4e00-\u9fa5\u3000-\u303f\uff01-\uff60]/g);
  const chineseCount = zhMatches ? zhMatches.length : 0;

  // 统计英文单词数
  const enMatches = clean.match(/\b[a-zA-Z0-9_'-]+\b/g);
  const englishCount = enMatches ? enMatches.length : 0;

  const totalCount = chineseCount + englishCount;
  const readingTimeMinutes = Math.max(1, Math.ceil(totalCount / 400));

  return { chineseCount, englishCount, totalCount, readingTimeMinutes };
}

/**
 * 从 Markdown 正文提取 ##, ###, #### 目录层级
 */
export function parseToc(markdown: string): TocItem[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const items: TocItem[] = [];
  lines.forEach((lineText, idx) => {
    const match = lineText.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim().replace(/[*_`]/g, '');
      items.push({
        id: `toc-${idx}-${encodeURIComponent(text.slice(0, 15))}`,
        level,
        text,
        lineNumber: idx,
      });
    }
  });
  return items;
}

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  draftKey?: string;
  minHeight?: string;
  placeholder?: string;
  lastSavedTime?: string | null;
  onRestoreDraft?: () => void;
  onClearDraft?: () => void;
  hasDraftAvailable?: boolean;
  onToggleFullscreen?: (fullscreen: boolean) => void;
}

export function MarkdownEditor({
  value,
  onChange,
  draftKey,
  minHeight = '560px',
  placeholder = '在此开始书写... 支持直接粘贴/拖拽多张图片并发秒传，选中文本即可唤出 AI 灵动气泡',
  lastSavedTime: externalSavedTime,
  onRestoreDraft,
  onClearDraft,
  hasDraftAvailable = false,
  onToggleFullscreen,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'split' | 'zen' | 'preview'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [internalSavedTime, setInternalSavedTime] = useState<string | null>(null);
  const [internalDraftAvailable, setInternalDraftAvailable] = useState(false);
  const [showToc, setShowToc] = useState(false);

  // 选中文本悬浮气泡菜单 (Floating Selection Bubble Bar)
  const [bubbleMenu, setBubbleMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    start: number;
    end: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
    start: 0,
    end: 0,
  });

  // AI 创作副驾状态
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotSelection, setCopilotSelection] = useState({ text: '', start: 0, end: 0 });
  const [copilotPos, setCopilotPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const currentValueRef = useRef(value);

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  // 全屏切换监听与按键支持
  const toggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    onToggleFullscreen?.(next);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        onToggleFullscreen?.(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  // 选中文本监听 (唤起 Bubble Menu)
  const handleSelectText = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (end > start) {
      const selected = textarea.value.substring(start, end).trim();
      if (selected.length >= 1) {
        const rect = textarea.getBoundingClientRect();
        // 粗略估算光标相对位置
        const lineHeight = 24;
        const lineIndex = textarea.value.substring(0, start).split('\n').length;
        const relativeY = Math.min(Math.max(lineIndex * lineHeight - textarea.scrollTop + rect.top, rect.top + 40), rect.bottom - 40);

        setBubbleMenu({
          visible: true,
          x: rect.left + rect.width / 2,
          y: Math.max(90, relativeY - 45),
          text: selected,
          start,
          end,
        });
        return;
      }
    }
    setBubbleMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const handleOpenAiCopilot = (textToUse?: string) => {
    const textarea = textareaRef.current;
    const targetText = textToUse || bubbleMenu.text;
    const start = bubbleMenu.start;
    const end = bubbleMenu.end;

    setCopilotSelection({
      text: targetText || (textarea ? textarea.value.slice(0, 500) : ''),
      start,
      end,
    });

    if (textarea) {
      const rect = textarea.getBoundingClientRect();
      setCopilotPos({
        x: rect.left + rect.width / 2,
        y: Math.max(rect.top + 80, 100),
      });
    }
    setCopilotOpen(true);
    setBubbleMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleReplaceSelection = (newText: string) => {
    const { start, end } = copilotSelection;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const updated = before + newText + after;
    onChange(updated);
    setCopilotOpen(false);
  };

  const handleInsertBelow = (newText: string) => {
    const { end } = copilotSelection;
    const before = value.substring(0, end);
    const after = value.substring(end);
    const updated = before + '\n\n' + newText + '\n\n' + after;
    onChange(updated);
    setCopilotOpen(false);
  };

  // 基础 Markdown 快捷语法插入
  const insertText = (prefix: string, suffix = '', placeholderText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selected = text.substring(start, end);
    const replacement = selected || placeholderText;
    const updated = text.substring(0, start) + prefix + replacement + suffix + text.substring(end);

    onChange(updated);

    setTimeout(() => {
      textarea.focus();
      if (!selected && placeholderText) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholderText.length);
      } else {
        const cursor = start + prefix.length + replacement.length + suffix.length;
        textarea.setSelectionRange(cursor, cursor);
      }
    }, 10);
  };

  // 插入 Markdown 表格
  const insertTable = () => {
    const tableTemplate = `\n| 列标题 1 | 列标题 2 | 列标题 3 |\n| :--- | :---: | ---: |\n| 内容项 | 内容项 | ￥99.00 |\n| 内容项 | 内容项 | ￥199.00 |\n\n`;
    insertText('', '', tableTemplate);
  };

  // 上传图片并插入 Markdown 语法 (支持秒传与并发)
  const handleMultipleImageFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(`准备上传 ${files.length} 个多媒体资源...`);

    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : value.length;
    const end = textarea ? textarea.selectionEnd : value.length;

    let placeholders = '';
    const tempTokens: string[] = [];
    files.forEach((f, i) => {
      const token = `__UPLOADING_${Date.now()}_${i}__`;
      tempTokens.push(token);
      placeholders += `\n![正在上传 ${f.name}...](${token})\n`;
    });

    let currentText = value.substring(0, start) + placeholders + value.substring(end);
    onChange(currentText);

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const token = tempTokens[i];
      setUploadProgress(`正在上传第 ${i + 1}/${files.length} 张: ${file.name}`);

      try {
        const res = await api.uploadMedia(file);
        const imgMarkdown = `![${file.name.replace(/\.[^/.]+$/, '')}](${res.url})`;
        currentText = currentText.replace(`![正在上传 ${file.name}...](${token})`, imgMarkdown);
        onChange(currentText);
        successCount++;
      } catch (err: any) {
        toast.error(`上传 ${file.name} 失败: ` + (err.message || '网络异常'));
        currentText = currentText.replace(`\n![正在上传 ${file.name}...](${token})\n`, '');
        onChange(currentText);
      }
    }

    setUploading(false);
    setUploadProgress(null);
    if (successCount > 0) {
      toast.success(`成功上传并插入 ${successCount} 张图片！`);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const pastedFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault();
      handleMultipleImageFiles(pastedFiles);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const droppedFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          droppedFiles.push(files[i]);
        }
      }
      if (droppedFiles.length > 0) {
        e.preventDefault();
        handleMultipleImageFiles(droppedFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleMultipleImageFiles(Array.from(files));
      e.target.value = '';
    }
  };

  // 打字机垂直居中定焦
  const handleInputWithScroll = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    if (typewriterMode && textareaRef.current) {
      const textarea = textareaRef.current;
      const cursor = textarea.selectionStart;
      const lines = textarea.value.substring(0, cursor).split('\n');
      const lineHeight = 24;
      const targetScroll = Math.max(0, lines.length * lineHeight - textarea.clientHeight / 2);
      textarea.scrollTop = targetScroll;
    }
  };

  // 点击 TOC 目录项平滑滚动定位
  const handleClickToc = (item: TocItem) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const lines = value.split('\n');
      let charPos = 0;
      for (let i = 0; i < item.lineNumber; i++) {
        charPos += lines[i].length + 1;
      }
      textarea.focus();
      textarea.setSelectionRange(charPos, charPos + lines[item.lineNumber].length);
      const lineHeight = 24;
      textarea.scrollTop = Math.max(0, item.lineNumber * lineHeight - 120);
    }
  };

  const metrics = useMemo(() => calculateWordMetrics(value), [value]);
  const tocItems = useMemo(() => parseToc(value), [value]);
  const displayDraftAvailable = hasDraftAvailable || internalDraftAvailable;
  const displaySavedTime = externalSavedTime || internalSavedTime;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col rounded-3xl border border-slate-300/90 dark:border-white/[0.12] bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 shadow-2xl bg-white dark:bg-[#090a0f]' : 'w-full'
      }`}
    >
      {/* 顶部主工具栏 (Studio Header Toolbar) */}
      <div className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-black/30 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* 左侧：格式化指令动作条 */}
        <div className="flex items-center flex-wrap gap-1">
          <button
            type="button"
            onClick={() => insertText('**', '**', '粗体文字')}
            title="粗体 (Ctrl+B)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('*', '*', '斜体文字')}
            title="斜体 (Ctrl+I)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-white/[0.1] mx-1" />

          <button
            type="button"
            onClick={() => insertText('## ', '', '二级标题')}
            title="二级标题 (H2)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 font-bold transition-colors cursor-pointer"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('### ', '', '三级标题')}
            title="三级标题 (H3)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 font-bold transition-colors cursor-pointer"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-white/[0.1] mx-1" />

          <button
            type="button"
            onClick={() => insertText('- ', '', '列表项')}
            title="无序列表"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('1. ', '', '编号列表')}
            title="有序列表"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('- [ ] ', '', '待办清单任务')}
            title="任务清单"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-white/[0.1] mx-1" />

          <button
            type="button"
            onClick={() => insertText('> ', '', '引用金句或关键论点')}
            title="引用块"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('`', '`', '行内代码')}
            title="行内代码"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('```typescript\n', '\n```', '// 在此编写代码')}
            title="代码块"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={insertTable}
            title="插入 Markdown 表格"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('[', '](https://example.com)', '链接描述')}
            title="超链接"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="上传并插入图片 (或直接在正文中 Ctrl+V 粘贴)"
            className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* 右侧：模式切换、大纲与打字机状态 */}
        <div className="flex items-center gap-2 text-xs">
          {/* AI 灵动副驾呼出 */}
          <button
            type="button"
            onClick={() => handleOpenAiCopilot()}
            className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold transition-all cursor-pointer shadow-xs"
            title="唤出 AI 原地创作润色"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
            <span>AI 润色</span>
          </button>

          {/* 实时大纲 (TOC) 开关 */}
          <button
            type="button"
            onClick={() => setShowToc(!showToc)}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer border ${
              showToc
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold'
                : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 border-slate-300/80 dark:border-white/[0.08] hover:text-slate-900'
            }`}
            title="查看文章实时目录大纲"
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>大纲 ({tocItems.length})</span>
          </button>

          {/* 视口模式三态切换：双栏对照 | 极简禅居中 | 全景预览 */}
          <div className="flex items-center rounded-xl bg-slate-200/80 dark:bg-neutral-800 p-0.5 border border-slate-300/80 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => setMode('split')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs transition-all cursor-pointer ${
                mode === 'split'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
              title="双栏对照模式 (Split)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">双栏对照</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('zen')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs transition-all cursor-pointer ${
                mode === 'zen'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
              title="居中专注禅模式 (Zen Focus)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">居中禅模式</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs transition-all cursor-pointer ${
                mode === 'preview'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
              title="全屏前台真实效果预览"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">全景预览</span>
            </button>
          </div>

          {/* 全屏禅模式切换 */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isFullscreen
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 border-slate-300/80 dark:border-white/[0.08] hover:text-slate-900'
            }`}
            title={isFullscreen ? '退出全屏沉浸 (Esc)' : '进入全屏沉浸创作'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 写作与预览主画布视口 */}
      <div className="relative flex-1 flex flex-row overflow-hidden" style={{ minHeight }}>
        {/* 编辑与预览工作区 */}
        <div
          className={`flex-1 flex overflow-hidden transition-all ${
            mode === 'split' ? 'divide-x divide-slate-200/80 dark:divide-white/[0.08]' : ''
          }`}
        >
          {/* 编辑区 (双栏模式或禅模式) */}
          {(mode === 'split' || mode === 'zen') && (
            <div
              className={`relative flex flex-col h-full overflow-y-auto ${
                mode === 'zen' ? 'w-full max-w-4xl mx-auto px-4 sm:px-8 py-6' : 'flex-1 p-5'
              }`}
            >
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleInputWithScroll}
                onSelect={handleSelectText}
                onMouseUp={handleSelectText}
                onKeyUp={handleSelectText}
                onPaste={handlePaste}
                onDrop={handleDrop}
                placeholder={placeholder}
                className="w-full flex-1 bg-transparent font-mono text-[14px] leading-[1.8] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none resize-none selection:bg-emerald-500/20"
                style={{
                  minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight,
                }}
              />

              {/* 上传进度悬浮浮窗 */}
              {uploading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center gap-3 text-xs font-semibold z-20 animate-in fade-in">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <span>{uploadProgress || '正在直传对象存储...'}</span>
                </div>
              )}
            </div>
          )}

          {/* 实时渲染预览区 (双栏模式或纯预览模式) */}
          {(mode === 'split' || mode === 'preview') && (
            <div
              ref={previewContainerRef}
              className={`flex-1 overflow-y-auto ${
                mode === 'preview' ? 'max-w-4xl mx-auto p-8 sm:p-12' : 'p-6'
              } bg-slate-50/40 dark:bg-black/20`}
              style={{
                minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight,
              }}
            >
              {value.trim() ? (
                <MarkdownViewer content={value} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 dark:text-zinc-500 text-xs italic">
                  实时渲染区：在左侧输入 Markdown，内容将即时优雅呈现在此
                </div>
              )}
            </div>
          )}
        </div>

        {/* 侧边可折叠大纲 (TOC Drawer) */}
        {showToc && (
          <aside className="w-72 border-l border-slate-200/80 dark:border-white/[0.08] bg-slate-50/90 dark:bg-neutral-900/95 backdrop-blur-md p-4 flex flex-col justify-between overflow-y-auto text-xs animate-in slide-in-from-right duration-200 shrink-0 z-10">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ListTree className="w-4 h-4 text-emerald-500" />
                  <span>文章大纲树</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowToc(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {tocItems.length > 0 ? (
                <div className="space-y-1.5">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleClickToc(item)}
                      className={`w-full text-left py-1.5 px-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.04] transition-colors truncate block ${
                        item.level === 2 ? 'font-semibold' : item.level === 3 ? 'pl-4 text-[11px]' : 'pl-6 text-[10px]'
                      }`}
                      title={item.text}
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-[11px] text-slate-400 dark:text-zinc-500 space-y-1">
                  <p>暂未检测到标题大纲</p>
                  <p className="font-mono text-[10px]">输入 ## 或 ### 生成标题节点</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] text-[10px] text-slate-400 font-mono">
              共 {tocItems.length} 个结构标题节点
            </div>
          </aside>
        )}
      </div>

      {/* 底部悬浮信息与状态胶囊条 (Status Bar) */}
      <div className="border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/90 dark:bg-neutral-900/90 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-zinc-400 font-mono select-none">
        <div className="flex items-center gap-3">
          <span>中文: <b className="text-slate-800 dark:text-white font-bold">{metrics.chineseCount}</b> 字</span>
          <span>英文: <b className="text-slate-800 dark:text-white font-bold">{metrics.englishCount}</b> 词</span>
          <span>总计: <b className="text-emerald-600 dark:text-emerald-400 font-bold">{metrics.totalCount}</b> 字</span>
          <span>预计阅读: {metrics.readingTimeMinutes} 分钟</span>
        </div>

        <div className="flex items-center gap-3">
          {/* 打字机模式开关 */}
          <button
            type="button"
            onClick={() => setTypewriterMode(!typewriterMode)}
            className={`flex items-center gap-1 transition-colors cursor-pointer ${
              typewriterMode ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'hover:text-slate-800'
            }`}
            title="打字时光标自动垂直定焦居中"
          >
            <ChevronsUpDown className="w-3 h-3" />
            <span>打字机滚动: {typewriterMode ? '开启' : '关闭'}</span>
          </button>

          {/* 自动保存状态 */}
          {displaySavedTime && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Save className="w-3 h-3" />
              <span>已存本地: {displaySavedTime}</span>
            </span>
          )}

          <span>GFM 规范 · 支持拖拽/粘贴直接秒传</span>
        </div>
      </div>

      {/* 选中文本悬浮气泡条 (Floating Selection Bubble Bar) */}
      {bubbleMenu.visible && (
        <div
          className="fixed z-40 p-1 rounded-2xl bg-neutral-900 text-white shadow-2xl border border-white/20 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
          style={{
            left: Math.max(10, Math.min(window.innerWidth - 300, bubbleMenu.x - 140)),
            top: bubbleMenu.y,
          }}
        >
          <button
            type="button"
            onClick={() => {
              insertText('**', '**');
              setBubbleMenu((prev) => ({ ...prev, visible: false }));
            }}
            className="px-2 py-1 hover:bg-white/15 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="加粗"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => {
              insertText('*', '*');
              setBubbleMenu((prev) => ({ ...prev, visible: false }));
            }}
            className="px-2 py-1 hover:bg-white/15 rounded-lg text-xs italic transition-colors cursor-pointer"
            title="斜体"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => {
              insertText('`', '`');
              setBubbleMenu((prev) => ({ ...prev, visible: false }));
            }}
            className="px-2 py-1 hover:bg-white/15 rounded-lg text-xs font-mono transition-colors cursor-pointer"
            title="行内代码"
          >
            &lt;&gt;
          </button>
          <button
            type="button"
            onClick={() => {
              insertText('[', '](url)');
              setBubbleMenu((prev) => ({ ...prev, visible: false }));
            }}
            className="px-2 py-1 hover:bg-white/15 rounded-lg text-xs transition-colors cursor-pointer"
            title="链接"
          >
            🔗
          </button>
          <div className="w-px h-3.5 bg-white/20 mx-0.5" />
          <button
            type="button"
            onClick={() => handleOpenAiCopilot(bubbleMenu.text)}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
            <span>AI 润色</span>
          </button>
        </div>
      )}

      {/* AI 创作副驾浮窗 */}
      {copilotOpen && (
        <InlineAiCopilot
          selectedText={copilotSelection.text}
          position={copilotPos}
          onReplace={handleReplaceSelection}
          onInsertBelow={handleInsertBelow}
          onClose={() => setCopilotOpen(false)}
        />
      )}
    </div>
  );
}
