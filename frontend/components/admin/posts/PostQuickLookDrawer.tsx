'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { api } from '@/lib/api';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { calculateWordMetrics } from '@/components/MarkdownEditor';
import { SafeImage } from '@/components/SafeImage';
import { BacklinkPreviewCard } from './BacklinkPreviewCard';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit3,
  Calendar,
  Eye,
  Clock,
  FileText,
  Tag as TagIcon,
  Folder,
  Layers,
  Sparkles,
  Link2,
  Loader2,
} from 'lucide-react';

interface PostQuickLookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number | null;
  postList: Post[];
  onSelectPost: (post: Post) => void;
}

function QuickLookWikiBadge({
  nodeName,
  postList,
  onSelectPost,
}: {
  nodeName: string;
  postList: Post[];
  onSelectPost: (post: Post) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const matched = postList.find(
    (p) =>
      p.title?.toLowerCase() === nodeName.toLowerCase() ||
      p.slug?.toLowerCase() === nodeName.toLowerCase()
  );

  const previewPost: Partial<Post> = matched || {
    title: nodeName,
    slug: encodeURIComponent(nodeName.toLowerCase().replace(/\s+/g, '-')),
    excerpt: `数字花园节点：「${nodeName}」。在博文正文中被作为双向链接反向引用。`,
    createdAt: new Date().toISOString(),
  };

  const handleMouseEnter = () => {
    const t = setTimeout(() => setShowPreview(true), 200);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    setShowPreview(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => {
          if (matched) onSelectPost(matched);
        }}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all select-none ${
          matched
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer shadow-sm'
            : 'bg-emerald-500/10 text-emerald-700/80 dark:text-emerald-300/80 border border-emerald-500/20 cursor-default'
        }`}
        title={matched ? `点击快速跳转至关联博文: ${matched.title}` : `数字花园节点: ${nodeName}`}
      >
        <Link2 className="w-3 h-3 text-emerald-500" />
        <span>[[{nodeName}]]</span>
        {matched && <span className="ml-0.5 text-[10px] opacity-70">↗</span>}
      </button>

      {showPreview && (
        <div className="absolute left-0 bottom-full mb-2 z-50 pointer-events-auto">
          <BacklinkPreviewCard post={previewPost} onClose={() => setShowPreview(false)} />
        </div>
      )}
    </div>
  );
}

export function PostQuickLookDrawer({
  isOpen,
  onClose,
  postId,
  postList,
  onSelectPost,
}: PostQuickLookDrawerProps) {
  const [hydratedPost, setHydratedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);

  const currentIndex = postList.findIndex((p) => p.id === postId);
  const currentPostSummary = currentIndex >= 0 ? postList[currentIndex] : null;

  // 水合获取完整文章内容 (严格遵循正文数据水合铁律)
  const fetchFullPost = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const full = await api.getPostById(id);
      setHydratedPost(full);
    } catch (err) {
      console.error('Failed to hydrate post in QuickLook:', err);
      // 降级使用 summary
      const fallback = postList.find((p) => p.id === id);
      setHydratedPost(fallback || null);
    } finally {
      setLoading(false);
    }
  }, [postList]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchFullPost(postId);
    } else {
      setHydratedPost(null);
    }
  }, [isOpen, postId, fetchFullPost]);

  // 上一篇 / 下一篇导航
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onSelectPost(postList[currentIndex - 1]);
    }
  }, [currentIndex, postList, onSelectPost]);

  const handleNext = useCallback(() => {
    if (currentIndex < postList.length - 1) {
      onSelectPost(postList[currentIndex + 1]);
    }
  }, [currentIndex, postList, onSelectPost]);

  // 全局 J / K / Esc 键盘快捷导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 若焦点处于输入框中，静默屏蔽
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !postId) return null;

  const displayPost = hydratedPost || currentPostSummary;
  const content = displayPost?.content || '';
  const metrics = calculateWordMetrics(content);

  // 提取正文中的 [[数字花园双链]]
  const wikiLinkMatches = Array.from(content.matchAll(/\[\[(.*?)\]\]/g)).map((m) => m[1]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 遮罩背景 */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-2xl bg-white/95 dark:bg-[#0d0e14]/95 backdrop-blur-2xl border-l border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col transform transition-all duration-300">
          {/* 顶栏控制条 */}
          <header className="px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                QuickLook 极速速览
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {currentIndex + 1} / {postList.length} (J/K 切换 · Esc 关闭)
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="上一篇 (K / ↑)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex >= postList.length - 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="下一篇 (J / ↓)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {displayPost && (
                <Link
                  href={`/admin/posts/edit/${displayPost.id}`}
                  className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  编辑
                </Link>
              )}
              <button
                onClick={onClose}
                className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                title="关闭 (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* 正文滚动区域 */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs">正在水合获取正文全量内容...</span>
              </div>
            ) : displayPost ? (
              <>
                {/* 封面图展示 */}
                {displayPost.cover && (
                  <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
                    <SafeImage
                      src={displayPost.cover}
                      alt={displayPost.title}
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs pointer-events-none">
                      <span className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20">
                        {displayPost.lang === 'en' ? 'English' : '简体中文'}
                      </span>
                      <span className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20">
                        {displayPost.status === 'PUBLISHED' ? '已发布' : '草稿'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 文章标题与 Slug */}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {displayPost.title}
                  </h1>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 font-mono">
                    /blog/{displayPost.slug}
                  </p>
                </div>

                {/* 核心指标 Bento 卡片 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08]">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <FileText className="w-3.5 h-3.5" />
                      中英总字数
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">
                      {metrics.totalCount.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08]">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      预估阅读
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">
                      {metrics.readingTimeMinutes} 分钟
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08]">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      创建时间
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {displayPost.createdAt ? new Date(displayPost.createdAt).toLocaleDateString() : '-'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08]">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Eye className="w-3.5 h-3.5" />
                      全站浏览量
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">
                      {displayPost.viewCount || 0}
                    </div>
                  </div>
                </div>

                {/* 摘要说明 */}
                {displayPost.excerpt && (
                  <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border-l-4 border-indigo-500 text-sm text-slate-600 dark:text-slate-300 italic">
                    {displayPost.excerpt}
                  </div>
                )}

                {/* 数字花园双向链接透出 */}
                {wikiLinkMatches.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      数字花园引用节点 ({wikiLinkMatches.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {wikiLinkMatches.map((nodeName, idx) => (
                        <QuickLookWikiBadge
                          key={idx}
                          nodeName={nodeName}
                          postList={postList}
                          onSelectPost={onSelectPost}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 正文 Markdown 渲染 */}
                <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    正文渲染预览
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                    <MarkdownViewer content={content || '*(暂无正文内容)*'} />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-400">未能找到文章信息</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
