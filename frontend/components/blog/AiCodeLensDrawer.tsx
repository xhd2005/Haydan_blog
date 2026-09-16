'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { AiCodeLensResponse } from '@/lib/types';
import { useTranslation } from '@/lib/i18n-client';
import { Sparkles, Loader2, AlertTriangle, Cpu, Tag, CheckCircle2 } from 'lucide-react';

export function useAiCodeLens(code: string, lang?: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lensData, setLensData] = useState<AiCodeLensResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'mechanism' | 'pitfalls' | 'concepts'>('mechanism');

  const toggle = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    if (!lensData) {
      setLoading(true);
      try {
        const res = await api.explainCode({
          code,
          lang: lang || 'code',
          context: '博文技术代码段',
        });
        setLensData(res);
      } catch (err) {
        console.error('Code lens failed:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return { isOpen, loading, lensData, activeTab, setActiveTab, toggle };
}

export function AiCodeLensButton({
  isOpen,
  loading,
  onToggle,
}: {
  isOpen: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  const { locale } = useTranslation();

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] ${
        isOpen
          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 shadow-sm'
          : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30'
      }`}
      title={locale === 'en' ? 'AI Architecture Lens' : 'AI 原地架构透视'}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
      ) : (
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
      )}
      <span>
        {isOpen
          ? (locale === 'en' ? 'Close Lens' : '收起透视')
          : (locale === 'en' ? 'AI Architecture' : 'AI 架构透视')}
      </span>
    </button>
  );
}

export function AiCodeLensPanel({
  isOpen,
  loading,
  lensData,
  activeTab,
  setActiveTab,
}: {
  isOpen: boolean;
  loading: boolean;
  lensData: AiCodeLensResponse | null;
  activeTab: 'mechanism' | 'pitfalls' | 'concepts';
  setActiveTab: (tab: 'mechanism' | 'pitfalls' | 'concepts') => void;
}) {
  const { locale } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="border-t border-zinc-200/80 dark:border-white/[0.08] bg-zinc-100/90 dark:bg-[#12131a] p-4 sm:p-5 space-y-4 animate-fade-in">
      {loading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-xs font-mono text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span>
            {locale === 'en'
              ? 'Analyzing runtime architecture & concurrency models...'
              : '正在深度推演底层运行时机制与并发避坑点...'}
          </span>
        </div>
      ) : lensData ? (
        <div className="space-y-4">
          {/* Tab 选项卡 */}
          <div className="flex items-center gap-2 border-b border-zinc-200/60 dark:border-white/[0.06] pb-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('mechanism')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'mechanism'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{locale === 'en' ? 'Under the Hood' : '底层原理解构'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pitfalls')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'pitfalls'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{locale === 'en' ? 'Pitfalls & Concurrency' : '并发与避坑'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('concepts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'concepts'
                  ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{locale === 'en' ? 'Garden Nexus' : '全栈图谱映射'}</span>
            </button>
          </div>

          {/* Tab 内容区 */}
          {activeTab === 'mechanism' && (
            <div className="space-y-2 text-xs leading-relaxed text-foreground/90 font-mono">
              <p className="p-3 rounded-xl bg-background/50 border border-border/40">
                {lensData.mechanism}
              </p>
              {lensData.advice && (
                <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{lensData.advice}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pitfalls' && (
            <div className="text-xs leading-relaxed text-foreground/90 font-mono space-y-2">
              <div className="p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-amber-700 dark:text-amber-300 whitespace-pre-line">
                {lensData.pitfalls}
              </div>
            </div>
          )}

          {activeTab === 'concepts' && (
            <div className="flex flex-wrap gap-2 pt-1">
              {lensData.relatedConcepts?.map((c, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                >
                  #{c}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs font-mono text-muted-foreground text-center py-4">
          {locale === 'en' ? 'Unable to generate lens at this time.' : '暂未解析出架构特征，请稍后重试。'}
        </div>
      )}
    </div>
  );
}
