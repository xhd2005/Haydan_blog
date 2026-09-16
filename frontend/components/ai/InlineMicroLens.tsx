'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { AiInlineLensResponse } from '@/lib/types';
import { useTranslation } from '@/lib/i18n-client';
import { Sparkles, Loader2, X, Compass, Zap, MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface InlineMicroLensProps {
  containerRef: React.RefObject<HTMLElement>;
  articleId?: number;
}

export function InlineMicroLens({ containerRef, articleId }: InlineMicroLensProps) {
  const { locale } = useTranslation();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [activeAction, setActiveAction] = useState<'DIGEST' | 'CRITICAL' | 'RESONANCE' | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiInlineLensResponse | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      // 如果当前弹出的显微镜卡片正在展示结果，点击卡片内部不清除选区
      if (cardRef.current && cardRef.current.contains(document.activeElement)) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        if (!result) {
          setPosition(null);
          setSelectedText('');
        }
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2) {
        if (!result) {
          setPosition(null);
          setSelectedText('');
        }
        return;
      }

      if (containerRef.current && containerRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const top = Math.max(rect.top - 12, 10);
        setPosition({
          x: rect.left + rect.width / 2,
          y: top,
        });
        setSelectedText(text);
        setResult(null);
        setActiveAction(null);
      }
    };

    const handleScroll = () => {
      if (!result) {
        setPosition(null);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, result]);

  const handleAction = async (actionType: 'DIGEST' | 'CRITICAL' | 'RESONANCE') => {
    if (!selectedText || loading) return;
    setActiveAction(actionType);
    setLoading(true);

    try {
      const res = await api.explainInline({
        selectedText,
        articleId,
        actionType,
      });
      setResult(res);
    } catch (err) {
      console.error('In-situ lens failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToDrawer = () => {
    const event = new CustomEvent('open-hayden-ai', {
      detail: {
        selectedText,
        articleId,
      },
    });
    window.dispatchEvent(event);
    setPosition(null);
    setResult(null);
  };

  const handleClose = () => {
    setPosition(null);
    setSelectedText('');
    setResult(null);
    setActiveAction(null);
  };

  if (!position) return null;

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 50,
      }}
      className="animate-fade-in"
    >
      {/* 阶段 1: 轻量微胶囊快捷操作条 */}
      {!result && (
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/95 dark:bg-neutral-900/95 border border-slate-200/90 dark:border-white/[0.12] backdrop-blur-xl shadow-xl dark:shadow-2xl text-xs select-none">
          <div className="flex items-center gap-1 pl-2 pr-1.5 py-0.5 text-[11px] font-mono font-semibold text-blue-600 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-500 dark:text-cyan-300" />
            <span className="hidden sm:inline">LENS</span>
          </div>

          <button
            type="button"
            onClick={() => handleAction('DIGEST')}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-blue-500/10 dark:hover:bg-emerald-500/20 text-slate-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-emerald-300 font-mono text-[11px] transition-colors cursor-pointer"
          >
            {loading && activeAction === 'DIGEST' ? <Loader2 className="w-3 h-3 animate-spin text-blue-500 dark:text-emerald-400" /> : null}
            <span>{locale === 'en' ? 'Digest' : '速解'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('CRITICAL')}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-amber-500/10 dark:hover:bg-amber-500/20 text-slate-700 dark:text-neutral-200 hover:text-amber-600 dark:hover:text-amber-300 font-mono text-[11px] transition-colors cursor-pointer"
          >
            {loading && activeAction === 'CRITICAL' ? <Loader2 className="w-3 h-3 animate-spin text-amber-500 dark:text-amber-400" /> : null}
            <span>{locale === 'en' ? 'Critical' : '思辨'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('RESONANCE')}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-sky-500/10 dark:hover:bg-sky-500/20 text-slate-700 dark:text-neutral-200 hover:text-sky-600 dark:hover:text-sky-300 font-mono text-[11px] transition-colors cursor-pointer"
          >
            {loading && activeAction === 'RESONANCE' ? <Loader2 className="w-3 h-3 animate-spin text-sky-500 dark:text-sky-400" /> : null}
            <span>{locale === 'en' ? 'Garden' : '共鸣'}</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-slate-200/60 dark:hover:bg-white/[0.1] text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 阶段 2: 原地显微镜展开气泡卡片 */}
      {result && (
        <div className="w-[300px] sm:w-[360px] p-4 rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-slate-200/90 dark:border-white/[0.12] backdrop-blur-2xl shadow-2xl text-xs space-y-3 animate-scale-in text-slate-800 dark:text-neutral-200">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.08] pb-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-blue-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-300" />
              <span>{result.title}</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 解构正文 */}
          <p className="text-[12px] leading-relaxed text-slate-700 dark:text-neutral-200 font-mono bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
            {result.digest}
          </p>

          {/* 站内共鸣文章推荐 */}
          {result.resonances && result.resonances.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                <Compass className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                <span>{locale === 'en' ? 'Related Garden Posts:' : '站内思想共鸣关联:'}</span>
              </span>
              <div className="space-y-1">
                {result.resonances.map((c, i) => (
                  <Link
                    key={i}
                    href={c.url || `/blog/${c.slug}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/[0.04] hover:bg-sky-500/10 border border-slate-200/60 dark:border-white/[0.05] hover:border-sky-500/30 text-[11px] font-mono text-slate-700 dark:text-neutral-300 hover:text-sky-600 dark:hover:text-sky-300 transition-colors group"
                  >
                    <span className="truncate">{c.title}</span>
                    <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 底部转入外脑深聊按钮 */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
              {locale === 'en' ? 'Need deep dive?' : '需要延伸讨论？'}
            </span>
            <button
              type="button"
              onClick={handleTransferToDrawer}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-emerald-500/20 hover:bg-blue-100 dark:hover:bg-emerald-500/30 text-blue-600 dark:text-emerald-300 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{locale === 'en' ? 'Ask Hayden AI' : '转入外脑深聊'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
