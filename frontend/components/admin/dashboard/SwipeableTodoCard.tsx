'use client';

import React, { useState, useRef } from 'react';
import { Check, X, ExternalLink, ArrowRight } from 'lucide-react';

export interface TodoItemData {
  id: number;
  type: 'comment' | 'friend';
  title: string;
  subtitle?: string;
  content: string;
  url?: string;
  createdAt?: string;
}

interface SwipeableTodoCardProps {
  item: TodoItemData;
  onApprove: (id: number) => Promise<void> | void;
  onReject: (id: number) => Promise<void> | void;
}

export function SwipeableTodoCard({
  item,
  onApprove,
  onReject,
}: SwipeableTodoCardProps) {
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [dismissDirection, setDismissDirection] = useState<'left' | 'right' | null>(null);

  const startXRef = useRef<number>(0);
  const currentOffsetRef = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 80; // 消除触发阈值（像素）

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 忽略点击在按钮或链接上的事件
    if ((e.target as HTMLElement).closest('button, a')) return;

    setIsDragging(true);
    startXRef.current = e.clientX;
    currentOffsetRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startXRef.current;
    // 增加阻尼感
    const dampedDeltaX = deltaX > 0 
      ? Math.pow(deltaX, 0.85) * 2.2 
      : -Math.pow(Math.abs(deltaX), 0.85) * 2.2;

    currentOffsetRef.current = dampedDeltaX;
    setDragOffset(dampedDeltaX);
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // 忽略部分浏览器 releasePointerCapture 容错
    }

    const offset = currentOffsetRef.current;

    if (offset > SWIPE_THRESHOLD) {
      // 向右滑动超过阈值 -> 审核通过消除
      setDismissDirection('right');
      setIsDismissed(true);
      setTimeout(() => {
        onApprove(item.id);
      }, 250);
    } else if (offset < -SWIPE_THRESHOLD) {
      // 向左滑动超过阈值 -> 标记拒绝消除
      setDismissDirection('left');
      setIsDismissed(true);
      setTimeout(() => {
        onReject(item.id);
      }, 250);
    } else {
      // 未达到阈值，弹性回弹
      setDragOffset(0);
    }
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    setDragOffset(0);
  };

  // 手势提示背景色计算
  const rightSwipeRatio = Math.min(Math.max(dragOffset / SWIPE_THRESHOLD, 0), 1);
  const leftSwipeRatio = Math.min(Math.max(-dragOffset / SWIPE_THRESHOLD, 0), 1);

  if (isDismissed) {
    return (
      <div 
        className="transition-all duration-300 overflow-hidden h-0 opacity-0 my-0 py-0" 
        style={{ transform: dismissDirection === 'right' ? 'translateX(100%)' : 'translateX(-100%)' }}
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl select-none group touch-pan-y">
      {/* 手势滑动背景层 (Underlay) */}
      <div className="absolute inset-0 flex items-center justify-between px-5 rounded-2xl z-0 transition-colors">
        {/* 向右滑：通过绿色 */}
        <div 
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition-opacity"
          style={{ opacity: rightSwipeRatio }}
        >
          <div className="p-1.5 rounded-full bg-emerald-500/20">
            <Check className="w-4 h-4" />
          </div>
          <span>松手批准通过</span>
        </div>

        {/* 向左滑：拒绝红色 */}
        <div 
          className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-opacity ml-auto"
          style={{ opacity: leftSwipeRatio }}
        >
          <span>松手拒绝</span>
          <div className="p-1.5 rounded-full bg-rose-500/20">
            <X className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 待办卡片主体 (Card Surface) */}
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s',
          opacity: 1 - Math.abs(dragOffset) * 0.0015,
        }}
        className={`relative z-10 p-4 rounded-2xl bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors hover:border-slate-300 dark:hover:border-white/[0.14] ${
          isDragging ? 'cursor-grabbing shadow-lg' : 'cursor-grab'
        }`}
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-white">
              {item.title}
            </span>

            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-0.5 font-mono truncate max-w-xs"
              >
                <span>{item.url}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}

            {item.createdAt && (
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                {item.createdAt.replace('T', ' ').slice(0, 16)}
              </span>
            )}
          </div>

          <p className="text-slate-700 dark:text-zinc-300 line-clamp-2 leading-relaxed text-xs">
            {item.content}
          </p>

          <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
            <span className="inline-flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-zinc-500" />
              <span>支持左右滑动手势快速消除</span>
            </span>
          </div>
        </div>

        {/* 快捷点击操作按钮区 */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApprove(item.id);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs active:scale-95"
            title="批准通过"
          >
            <Check className="w-3.5 h-3.5" />
            <span>通过</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReject(item.id);
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs active:scale-95"
            title="拒绝该项"
          >
            <X className="w-3.5 h-3.5" />
            <span>拒绝</span>
          </button>
        </div>
      </div>
    </div>
  );
}
