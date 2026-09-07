'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
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
  Trash2
} from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  draftKey?: string;
  minHeight?: string;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  draftKey,
  minHeight = '520px',
  placeholder = '在此输入 Markdown 正文... 支持直接粘贴/拖拽上传图片',
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [uploading, setUploading] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检查是否存在本地未提交的草稿
  useEffect(() => {
    if (!draftKey || typeof window === 'undefined') return;
    const saved = localStorage.getItem(`draft_${draftKey}`);
    if (saved && saved.trim() && saved !== value) {
      setHasSavedDraft(true);
    }
  }, [draftKey]);

  // 自动防丢失暂存 (防抖 2 秒)
  useEffect(() => {
    if (!draftKey || typeof window === 'undefined') return;
    if (!value || value.trim() === '') return;

    const timer = setTimeout(() => {
      localStorage.setItem(`draft_${draftKey}`, value);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastSavedTime(timeStr);
    }, 2000);

    return () => clearTimeout(timer);
  }, [value, draftKey]);

  // 恢复草稿
  const handleRestoreDraft = () => {
    if (!draftKey) return;
    const saved = localStorage.getItem(`draft_${draftKey}`);
    if (saved) {
      onChange(saved);
      setHasSavedDraft(false);
      toast.success('已成功恢复本地未保存的草稿');
    }
  };

  // 清除草稿
  const handleClearDraft = () => {
    if (!draftKey) return;
    localStorage.removeItem(`draft_${draftKey}`);
    setHasSavedDraft(false);
    setLastSavedTime(null);
    toast.info('本地暂存草稿已清除');
  };

  // 插入指定文本到光标处
  const insertText = useCallback((prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;

    const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  }, [onChange]);

  // 上传图片并插入 Markdown 语法
  const uploadAndInsertImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.warning('请选择图片格式文件');
      return;
    }
    setUploading(true);
    try {
      const media = await api.uploadMedia(file);
      const imageMd = `\n![${file.name.replace(/\.[^/.]+$/, '')}](${media.url})\n`;
      insertText(imageMd, '', '');
      toast.success('图片已成功上传并插入编辑器');
    } catch (err: any) {
      toast.error(err.message || '上传图片失败');
    } finally {
      setUploading(false);
    }
  };

  // 处理粘贴事件中的图片上传
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          uploadAndInsertImage(file);
          return;
        }
      }
    }
  };

  // 处理拖拽放置图片
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      e.preventDefault();
      uploadAndInsertImage(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAndInsertImage(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* 恢复草稿提醒 Banner */}
      {hasSavedDraft && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
          <span className="flex items-center gap-1.5 font-medium">
            <RotateCcw className="w-3.5 h-3.5" />
            检测到本地有未保存的暂存草稿，是否恢复？
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-2.5 py-1 rounded bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
            >
              恢复草稿
            </button>
            <button
              type="button"
              onClick={handleClearDraft}
              className="p-1 text-muted-foreground hover:text-rose-500 transition-colors"
              title="放弃并清除草稿"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Toolbar */}
      <div className="border-b border-border bg-secondary/40 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Formatting Buttons */}
        <div className="flex items-center flex-wrap gap-1">
          <button
            type="button"
            onClick={() => insertText('**', '**', '粗体文字')}
            title="粗体 (Ctrl+B)"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('*', '*', '斜体文字')}
            title="斜体 (Ctrl+I)"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            type="button"
            onClick={() => insertText('## ', '', '二级标题')}
            title="二级标题 (H2)"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('### ', '', '三级标题')}
            title="三级标题 (H3)"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            type="button"
            onClick={() => insertText('- ', '', '列表项')}
            title="无序列表"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('1. ', '', '有序列表项')}
            title="有序列表"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('- [ ] ', '', '任务列表项')}
            title="任务清单"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            type="button"
            onClick={() => insertText('> ', '', '引用文段')}
            title="引用块"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('`', '`', 'code')}
            title="行内代码"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('\n```ts\n', '\n```\n', '// 代码块')}
            title="多行代码块"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileCode className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('\n| 列 1 | 列 2 | 列 3 |\n| --- | --- | --- |\n| 文本 | 文本 | 文本 |\n')}
            title="插入表格"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('[', '](https://example.com)', '链接描述')}
            title="插入超链接"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="上传并插入图片"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <ImageIcon className="w-4 h-4" />}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* View Mode Switcher & Draft Status */}
        <div className="flex items-center gap-3 text-xs">
          {lastSavedTime && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <Save className="w-3 h-3 text-emerald-500" />
              已暂存 {lastSavedTime}
            </span>
          )}

          <div className="flex items-center rounded-lg bg-secondary/80 p-0.5 border border-border">
            <button
              type="button"
              onClick={() => setMode('split')}
              className={`p-1.5 rounded-md flex items-center gap-1 text-xs transition-colors ${
                mode === 'split' ? 'bg-background text-foreground shadow-xs font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="双栏分栏实时对照"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">双栏对照</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`p-1.5 rounded-md flex items-center gap-1 text-xs transition-colors ${
                mode === 'edit' ? 'bg-background text-foreground shadow-xs font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="纯编辑模式"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">仅编辑</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`p-1.5 rounded-md flex items-center gap-1 text-xs transition-colors ${
                mode === 'preview' ? 'bg-background text-foreground shadow-xs font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="纯预览模式"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">仅预览</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className={`grid transition-all ${
          mode === 'split' ? 'grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border' : 'grid-cols-1'
        }`}
        style={{ minHeight }}
      >
        {/* Editor Pane */}
        {(mode === 'split' || mode === 'edit') && (
          <div className="relative flex flex-col h-full bg-background/50">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              placeholder={placeholder}
              className="w-full h-full p-4 bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
              style={{ minHeight }}
            />
            {uploading && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                正在上传图片并插入...
              </div>
            )}
          </div>
        )}

        {/* Preview Pane */}
        {(mode === 'split' || mode === 'preview') && (
          <div 
            className="p-6 overflow-y-auto bg-card/60"
            style={{ maxHeight: mode === 'split' ? '700px' : undefined, minHeight }}
          >
            {value.trim() ? (
              <MarkdownViewer content={value} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground/60 italic py-20">
                实时渲染区：在左侧编辑 Markdown，内容将即时在此处呈现
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="border-t border-border bg-secondary/20 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
        <span>支持 GitHub Flavored Markdown (GFM) / 中英文微空格 / 代码高亮</span>
        <span>{value.length} 字符 · 预计阅读 {Math.max(1, Math.ceil(value.length / 400))} 分钟</span>
      </div>
    </div>
  );
}
