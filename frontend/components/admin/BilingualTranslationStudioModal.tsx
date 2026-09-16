'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  X,
  Sparkles,
  Loader2,
  Languages,
  ArrowRight,
  Copy,
  Check,
  FileCheck2,
  StopCircle,
  BookOpen,
} from 'lucide-react';

export interface BilingualTranslationStudioModalProps {
  open: boolean;
  onClose: () => void;
  sourcePost: {
    id?: number;
    title: string;
    excerpt?: string;
    content: string;
    lang: 'zh' | 'en';
    slug?: string;
    categoryId?: number;
    tagIds?: number[];
  };
  onSuccess?: (newPostId?: number) => void;
}

export function BilingualTranslationStudioModal({
  open,
  onClose,
  sourcePost,
  onSuccess,
}: BilingualTranslationStudioModalProps) {
  const defaultTargetLang = sourcePost.lang === 'zh' ? 'en' : 'zh';
  const [targetLang, setTargetLang] = useState<'zh' | 'en'>(defaultTargetLang);
  
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedExcerpt, setTranslatedExcerpt] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [translatedSeo, setTranslatedSeo] = useState('');

  const [isStreaming, setIsStreaming] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    if (open) {
      setTargetLang(sourcePost.lang === 'zh' ? 'en' : 'zh');
      setTranslatedTitle('');
      setTranslatedExcerpt('');
      setTranslatedContent('');
      setTranslatedSeo('');
      setIsStreaming(false);
      setHasCompleted(false);
      setIsSubmitting(false);
      abortControllerRef.current = false;
    }
  }, [open, sourcePost]);

  const handleStartTranslate = async () => {
    if (!sourcePost.content.trim()) {
      toast.warning('源文章正文为空，无法进行智能翻译');
      return;
    }

    setIsStreaming(true);
    setHasCompleted(false);
    setTranslatedTitle('');
    setTranslatedExcerpt('');
    setTranslatedContent('');
    setTranslatedSeo('');
    abortControllerRef.current = false;

    toast.info('正在唤醒技术双语精译引擎...');

    try {
      await api.streamTranslatePost(
        {
          sourcePostId: sourcePost.id,
          title: sourcePost.title,
          excerpt: sourcePost.excerpt,
          content: sourcePost.content,
          targetLang,
        },
        // onMeta
        (meta) => {
          if (abortControllerRef.current) return;
          if (meta.title) setTranslatedTitle(meta.title);
          if (meta.excerpt) setTranslatedExcerpt(meta.excerpt);
          if (meta.seoDescription) setTranslatedSeo(meta.seoDescription);
        },
        // onDelta
        (delta) => {
          if (abortControllerRef.current) return;
          setTranslatedContent((prev) => prev + delta);
        },
        // onDone
        () => {
          setIsStreaming(false);
          setHasCompleted(true);
          toast.success('🎉 双语技术精译流已传输完毕！可进行微调或一键派生');
        },
        // onError
        (err) => {
          setIsStreaming(false);
          toast.error(err.message || '流式精译发生异常，已停止');
        }
      );
    } catch (err: any) {
      setIsStreaming(false);
      toast.error(err.message || '启动翻译失败');
    }
  };

  const handleStop = () => {
    abortControllerRef.current = true;
    setIsStreaming(false);
    toast.info('已手动中止翻译流传输');
  };

  const handleCopy = () => {
    if (!translatedContent) return;
    const fullText = `# ${translatedTitle}\n\n> ${translatedExcerpt}\n\n${translatedContent}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('译文已复制到剪贴板');
  };

  const handleDeriveAndLink = async () => {
    if (!translatedTitle.trim() || !translatedContent.trim()) {
      toast.warning('译文标题或正文不能为空');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 生成 Slug
      const baseSlug = sourcePost.slug
        ? `${sourcePost.slug}-${targetLang}`
        : translatedTitle.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');

      // 2. 创建新译文博文（草稿状态，便于站长二次审校）
      const newPostId = await api.createPost({
        title: translatedTitle.trim(),
        slug: baseSlug,
        excerpt: translatedExcerpt.trim() || undefined,
        content: translatedContent.trim(),
        lang: targetLang,
        translationPostId: sourcePost.id || null,
        status: 'DRAFT',
        categoryId: sourcePost.categoryId,
        tagIds: sourcePost.tagIds || [],
        maturity: 'BUDDING',
        seoTitle: translatedTitle.trim(),
        seoDescription: translatedSeo.trim() || translatedExcerpt.trim(),
      });

      // 3. 若源文章存在且尚未绑定，则回写反向绑定
      if (sourcePost.id && newPostId) {
        try {
          await api.updatePost(sourcePost.id, {
            translationPostId: newPostId,
          });
        } catch (linkErr) {
          console.warn('[Auto-link Warning]', linkErr);
        }
      }

      toast.success('双语译文草稿创建成功并已双向绑定！');
      onSuccess?.(newPostId);
      onClose();
    } catch (err: any) {
      toast.error(err.message || '派生创建译文失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-[#fbfbfd] dark:bg-[#0c0d14] border border-slate-200/80 dark:border-white/[0.08] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">AI 双语技术精译工作台</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Dual-Stream Studio
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                深度语义对齐技术上下文，流式输出技术译文、标题、摘要与 SEO 配置，一键派生双向关联。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Translation Control Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-white/[0.05] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-medium">源文语言:</span>
            <span className="px-2.5 py-1 rounded-lg bg-card border border-border font-mono font-semibold text-foreground">
              {sourcePost.lang === 'zh' ? '🇨🇳 中文 (ZH)' : '🇺🇸 English (EN)'}
            </span>

            <ArrowRight className="w-4 h-4 text-muted-foreground" />

            <span className="text-muted-foreground font-medium">目标语言:</span>
            <div className="flex rounded-lg border border-border bg-card p-0.5">
              <button
                type="button"
                onClick={() => setTargetLang('en')}
                disabled={isStreaming}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
                  targetLang === 'en'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                English (EN)
              </button>
              <button
                type="button"
                onClick={() => setTargetLang('zh')}
                disabled={isStreaming}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
                  targetLang === 'zh'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                中文 (ZH)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStop}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5 border border-rose-500/20 transition-colors"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>中止流式传输</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTranslate}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{translatedContent ? '重新流式翻译' : '开始智能技术精译'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dual Column Workspace */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-white/[0.08] overflow-hidden">
          
          {/* Left Column: Original Source Content */}
          <div className="flex flex-col h-[480px] md:h-[540px] bg-slate-50/50 dark:bg-black/20 overflow-hidden">
            <div className="px-5 py-2.5 bg-card/50 border-b border-border/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <span>源文对照 ({sourcePost.lang.toUpperCase()})</span>
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                约 {sourcePost.content.length} 字符
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Title</span>
                <h4 className="text-base font-bold text-foreground bg-card p-3 rounded-xl border border-border/60">
                  {sourcePost.title || '(无标题)'}
                </h4>
              </div>

              {sourcePost.excerpt && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Excerpt</span>
                  <p className="text-xs text-muted-foreground bg-card p-3 rounded-xl border border-border/60 leading-relaxed">
                    {sourcePost.excerpt}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Content Markdown</span>
                <div className="p-3.5 rounded-xl bg-card border border-border/60 text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {sourcePost.content}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Translation & Studio */}
          <div className="flex flex-col h-[480px] md:h-[540px] bg-white/50 dark:bg-neutral-900/30 overflow-hidden">
            <div className="px-5 py-2.5 bg-card/50 border-b border-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>技术译稿 Studio ({targetLang.toUpperCase()})</span>
                </span>
                {isStreaming && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    流式写入中...
                  </span>
                )}
                {hasCompleted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    <Check className="w-2.5 h-2.5" />
                    已完成
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {translatedContent && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? '已复制' : '复制译文'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Translated Title */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Translated Title</span>
                <input
                  type="text"
                  value={translatedTitle}
                  onChange={(e) => setTranslatedTitle(e.target.value)}
                  placeholder={isStreaming ? '正在生成译文标题...' : '译文标题将在此呈现，亦可人工微调...'}
                  className="w-full text-sm font-bold p-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Translated Excerpt */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Translated Excerpt & SEO</span>
                <textarea
                  value={translatedExcerpt}
                  onChange={(e) => setTranslatedExcerpt(e.target.value)}
                  rows={2}
                  placeholder={isStreaming ? '正在提取双语摘要与 SEO 描述...' : '译文摘要与 SEO 描述...'}
                  className="w-full text-xs p-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Translated Content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Translated Content Markdown</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    约 {translatedContent.length} 字符
                  </span>
                </div>
                
                <div className="relative">
                  <textarea
                    value={translatedContent}
                    onChange={(e) => setTranslatedContent(e.target.value)}
                    rows={12}
                    placeholder={
                      isStreaming
                        ? 'AI 正在对齐技术概念与代码注释，逐段流式翻译中...'
                        : '点击上方「开始智能技术精译」即可开启流式双语对照创作...'
                    }
                    className="w-full p-3.5 rounded-xl bg-card border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 leading-relaxed resize-y"
                  />
                  {isStreaming && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Streaming</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            派生后将自动在后台建立双语互相引用关系，前台读者可在多语言视角间无缝切换。
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleDeriveAndLink}
              disabled={isSubmitting || isStreaming || !translatedContent.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 shadow-md shadow-emerald-600/10 flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>正在派生并绑定...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>一键派生并自动绑定双向关联博文</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
