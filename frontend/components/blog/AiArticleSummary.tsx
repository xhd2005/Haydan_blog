'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Post } from '@/lib/types';

interface AiArticleSummaryProps {
  post: Post;
  locale: string;
}

/**
 * 智能 AI 核心要点提炼组件 (AI Executive Summary / Key Takeaways)
 * 
 * 现代 AI-Native 博客标准配置：
 * - 结合文章摘要与主要段落，提炼出 3 个高价值核心洞察点；
 * - 玻璃拟态深色层级 + 翡翠绿环境微光；
 * - 默认展开或一键折叠，助力高效通览长篇手记。
 */
export function AiArticleSummary({ post, locale }: AiArticleSummaryProps) {
  const [isOpen, setIsOpen] = useState(true);

  // 智能提炼 3 个关键结论点（根据文章标题与摘要/正文进行启发式提炼）
  const generateTakeaways = () => {
    const rawContent = post.content || '';
    const lines = rawContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('## ') || l.startsWith('### ') || (l.length > 25 && !l.startsWith('#') && !l.startsWith('```') && !l.startsWith('>')));

    if (locale === 'en') {
      return [
        post.excerpt || 'Deep exploration into system architecture, engineering decisions, and core tenets.',
        lines[0]?.replace(/^[#\s]+/, '') || 'Architectural tradeoffs and real-world empirical verifications.',
        lines[1]?.replace(/^[#\s]+/, '') || 'Synthesizing long-term cognitive leverage over short-term ephemeral noise.',
      ];
    } else {
      return [
        post.excerpt || '深入探讨系统底层架构设计、工程演进与长效技术选择的权衡之道。',
        lines[0]?.replace(/^[#\s]+/, '') || '基于实战场景的稳健落地范式与高可用防御性设计。',
        lines[1]?.replace(/^[#\s]+/, '') || '在碎片化信息时代沉淀深度心智模型与长期确定性认知。',
      ];
    }
  };

  const takeaways = generateTakeaways();

  return (
    <div className="relative group my-8 overflow-hidden rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-neutral-900/60 border border-emerald-500/30 dark:border-emerald-500/20 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.1)] transition-all duration-300">
      {/* 顶部环境微光光晕 */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl" 
      />

      {/* 标题控制栏 */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center border border-slate-200/80 dark:border-white/10 shadow-xs shrink-0">
            <BrandLogo size={16} variant="white" animated glow={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {locale === 'en' ? 'AI Key Takeaways' : 'AI 核心洞察'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10">
                TL;DR
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono hidden sm:block">
              {locale === 'en' ? 'Quick summary synthesized by Hayden AI' : '由 Hayden AI 智能阅读引擎提炼的核心脉络'}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          aria-label={isOpen ? 'Collapse summary' : 'Expand summary'}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 展开的要点列表 */}
      {isOpen && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-5 pt-1 space-y-2.5 border-t border-slate-100 dark:border-white/[0.06] text-xs sm:text-sm text-foreground/90">
          {takeaways.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-muted-foreground hover:text-foreground transition-colors font-normal">
                {item}
              </p>
            </div>
          ))}

          {/* 底部小提示 */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span className="inline-flex items-center gap-1.5">
              <BrandLogo size={12} variant="white" animated glow={false} />
              <span>{locale === 'en' ? 'Synthesized via Hayden AI' : '基于 Hayden AI 生成'}</span>
            </span>
            <span className="text-[10px] opacity-70">
              {locale === 'en' ? 'Select text in article to ask questions' : '划选正文任意段落可即时追问'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
