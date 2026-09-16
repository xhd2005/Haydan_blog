'use client';

import React, { useRef, useState } from 'react';
import { Post } from '@/lib/types';
import { useTranslation } from '@/lib/i18n-client';
import { InlineMicroLens } from '@/components/ai/InlineMicroLens';
import { SharePosterModal } from '@/components/poster/SharePosterModal';
import { FloatingReadingToolbar } from '@/components/blog/FloatingReadingToolbar';

interface ArticleInteractiveWrapperProps {
  post: Post;
  children: React.ReactNode;
}

export function ArticleInteractiveWrapper({ post, children }: ArticleInteractiveWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { locale } = useTranslation();
  const [showPoster, setShowPoster] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');

  const fontSizeClass = {
    sm: 'prose-sm',
    base: 'prose-base',
    lg: 'prose-lg',
    xl: 'prose-xl',
  }[fontSize];

  return (
    <div className="space-y-6">
      {/* 正文容器（支持字号动态缩放与挂载划词原地显微镜伴读） */}
      <div 
        ref={containerRef} 
        className={`relative transition-all duration-200 ${fontSizeClass}`}
      >
        {children}
        <InlineMicroLens containerRef={containerRef} articleId={post.id} />
      </div>

      {/* 屏幕底部悬浮微光阅读工具胶囊 */}
      <FloatingReadingToolbar
        articleId={post.id}
        initialLikes={post.likeCount}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        onOpenPoster={() => setShowPoster(true)}
        locale={locale}
      />

      {/* 分享海报模态框 */}
      <SharePosterModal
        post={post}
        isOpen={showPoster}
        onClose={() => setShowPoster(false)}
      />
    </div>
  );
}
