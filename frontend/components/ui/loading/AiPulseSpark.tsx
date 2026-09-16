'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AiPulseSparkProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Hayden Xue 专属 AI 思考与流式推理星芒脉冲微动效 (AiPulseSpark)
 */
export function AiPulseSpark({ label = 'AI 正在深度思考...', className = '', size = 'sm' }: AiPulseSparkProps) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-mono text-emerald-600 dark:text-emerald-400 ${className}`}>
      <span className="relative flex items-center justify-center">
        <span className="absolute w-full h-full rounded-full bg-emerald-400/40 animate-ping" />
        <Sparkles className={`${iconSize} animate-spin text-emerald-500`} style={{ animationDuration: '3s' }} />
      </span>
      {label && <span className="animate-pulse font-medium tracking-wide">{label}</span>}
    </div>
  );
}
