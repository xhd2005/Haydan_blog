'use client';

import React, { useRef, useState } from 'react';
import { Post } from '@/lib/types';
import { useTranslation } from '@/lib/i18n-client';
import { InlineAiSpark } from '@/components/ai/InlineAiSpark';
import { SharePosterModal } from '@/components/poster/SharePosterModal';
import { Sparkles, Share2, Sprout, GitCommit } from 'lucide-react';

interface ArticleInteractiveWrapperProps {
  post: Post;
  children: React.ReactNode;
}

export function ArticleInteractiveWrapper({ post, children }: ArticleInteractiveWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { locale, t } = useTranslation();
  const [showPoster, setShowPoster] = useState(false);

  const maturityLabel =
    post.maturity === 'EVERGREEN'
      ? t('maturity.evergreen')
      : post.maturity === 'SEEDLING'
      ? t('maturity.seedling')
      : t('maturity.budding');

  const revisionsText = t('maturity.revisions').replace(
    '{count}',
    String(post.revisionCount || 1)
  );

  return (
    <div className="space-y-6">
      {/* 思想成熟度与分享海报操作条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-xs">
        {/* 成熟度与浇灌修订日志 */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
            <Sprout className="w-3.5 h-3.5" />
            <span>{maturityLabel}</span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 text-muted-foreground font-mono text-[11px]">
            <GitCommit className="w-3 h-3 text-cyan-500" />
            <span>{revisionsText}</span>
          </span>
        </div>

        {/* 划词提示与海报生成按钮 */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-[11px] text-muted-foreground font-mono">
            {locale === 'en' ? 'Select text to ask AI' : '划选正文可追问 AI'}
          </span>
          <button
            onClick={() => setShowPoster(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background hover:bg-secondary text-foreground font-semibold border border-border shadow-sm hover:shadow transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('poster.btn')}</span>
          </button>
        </div>
      </div>

      {/* 正文容器（挂载划词追问伴读） */}
      <div ref={containerRef} className="relative">
        {children}
        <InlineAiSpark containerRef={containerRef} articleId={post.id} />
      </div>

      {/* 分享海报模态框 */}
      <SharePosterModal
        post={post}
        isOpen={showPoster}
        onClose={() => setShowPoster(false)}
      />
    </div>
  );
}
