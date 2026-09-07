'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { Sparkles } from 'lucide-react';

interface InlineAiSparkProps {
  containerRef: React.RefObject<HTMLElement>;
  articleId?: number;
}

export function InlineAiSpark({ containerRef, articleId }: InlineAiSparkProps) {
  const { t } = useTranslation();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 3) {
        setPosition(null);
        setSelectedText('');
        return;
      }

        // 验证选区是否在文章容器内部
      if (containerRef.current && containerRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const top = Math.max(rect.top - 12, 10);
        setPosition({
          x: rect.left + rect.width / 2,
          y: top,
        });
        setSelectedText(text);
      } else {
        setPosition(null);
        setSelectedText('');
      }
    };

    const handleScroll = () => {
      setPosition(null);
    };

    document.addEventListener('mouseup', handleSelection);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef]);

  const handleAsk = () => {
    if (!selectedText) return;
    const event = new CustomEvent('open-hayden-ai', {
      detail: {
        selectedText,
        articleId,
      },
    });
    window.dispatchEvent(event);
    setPosition(null);
    setSelectedText('');
  };

  if (!position) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 50,
      }}
      className="animate-fade-in"
    >
      <button
        onClick={handleAsk}
        onMouseDown={(e) => e.preventDefault()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xl hover:shadow-emerald-500/30 border border-emerald-400/40 backdrop-blur-md transition-all duration-200 group hover:scale-105 cursor-pointer active:scale-95"
      >
        <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-spin-slow" />
        <span>{t('ai.spark_btn')}</span>
      </button>
    </div>
  );
}
