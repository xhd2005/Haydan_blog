'use client';

import React, { useEffect, useState } from 'react';
import { Memo } from '@/lib/types';
import Image from 'next/image';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  MapPin,
  Sparkles,
  Layers,
} from 'lucide-react';

interface DarkroomLightboxProps {
  memo: Memo | null;
  subImgIndex: number;
  onClose: () => void;
  onSelectSubIndex: (idx: number) => void;
  onPrevMemo: () => void;
  onNextMemo: () => void;
  onToggleLike: (memoId: number, e: React.MouseEvent) => void;
  onShare: (memoId: number, e: React.MouseEvent) => void;
  isLiked: boolean;
  likeCount: number;
  locale: string;
}

export function parseMemoImages(imagesStr?: string): string[] {
  if (!imagesStr) return [];
  try {
    const parsed = JSON.parse(imagesStr);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && !!item.trim());
    }
  } catch {}
  return imagesStr.split(',').map((s) => s.trim()).filter(Boolean);
}

export function DarkroomLightbox({
  memo,
  subImgIndex,
  onClose,
  onSelectSubIndex,
  onPrevMemo,
  onNextMemo,
  onToggleLike,
  onShare,
  isLiked,
  likeCount,
  locale,
}: DarkroomLightboxProps) {
  useEffect(() => {
    if (!memo) return;
    const images = parseMemoImages(memo.images);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (images.length > 1 && subImgIndex < images.length - 1) {
          onSelectSubIndex(subImgIndex + 1);
        } else {
          onNextMemo();
        }
      } else if (e.key === 'ArrowLeft') {
        if (images.length > 1 && subImgIndex > 0) {
          onSelectSubIndex(subImgIndex - 1);
        } else {
          onPrevMemo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [memo, subImgIndex, onClose, onSelectSubIndex, onNextMemo, onPrevMemo]);

  if (!memo) return null;

  const images = parseMemoImages(memo.images);
  const currentImg = images[subImgIndex] || images[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-200 overflow-y-auto"
    >
      {/* 背后环境柔光色晕 (Ambient Diffused Glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-blue-500/10 blur-3xl pointer-events-none -z-10" />

      {/* ======================================================== */}
      {/* 居中一体化液态玻璃卡片 (Liquid Glass Window - max-w-3xl)  */}
      {/* ======================================================== */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full max-h-[86vh] flex flex-col rounded-3xl overflow-hidden bg-neutral-900/80 dark:bg-black/70 backdrop-blur-3xl border border-white/25 dark:border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.35)] animate-in zoom-in-95 duration-200 text-white"
      >
        {/* 右上角：毛玻璃退出按键 */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3.5 right-3.5 z-30 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white border border-white/20 backdrop-blur-md shadow-lg transition-all cursor-pointer"
          title="退出 (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 左上角：多图微型状态胶囊 */}
        {images.length > 1 && (
          <div className="absolute top-3.5 left-3.5 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90 text-xs font-mono shadow-md">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{subImgIndex + 1} / {images.length}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 上半段：高清相纸展示区 (高度适中，舒展自然)             */}
        {/* ======================================================== */}
        {currentImg ? (
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[420px] bg-black/50 overflow-hidden flex items-center justify-center">
            {/* 照片虚化背景底色 */}
            <div className="absolute inset-0 scale-110 opacity-30 blur-xl pointer-events-none">
              <Image src={currentImg} alt="Blur background" fill className="object-cover" />
            </div>

            {/* 高清主体照片 */}
            <div className="relative w-full h-full p-2">
              <Image
                src={currentImg}
                alt={memo.content.slice(0, 30) || 'Memo photo'}
                fill
                className="object-contain drop-shadow-xl"
                sizes="(max-width: 1024px) 100vw, 768px"
                priority
              />
            </div>

            {/* 左右切图液态微晶按键 (仅多图时显示) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => onSelectSubIndex(Math.max(0, subImgIndex - 1))}
                  disabled={subImgIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer border border-white/20 backdrop-blur-md shadow-lg"
                  title="上一张 (←)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onSelectSubIndex(Math.min(images.length - 1, subImgIndex + 1))}
                  disabled={subImgIndex === images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer border border-white/20 backdrop-blur-md shadow-lg"
                  title="下一张 (→)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        ) : (
          /* 纯文字时的诗意微徽章顶栏 */
          <div className="pt-8 pb-4 text-center">
            <span className="text-3xl font-serif text-amber-500/40 select-none">“</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 下半段：液态玻璃信息区 (作者、正文、徽章与互动)         */}
        {/* ======================================================== */}
        <div className="p-5 sm:p-6 space-y-3.5 bg-white/[0.03] backdrop-blur-md border-t border-white/10 overflow-y-auto">
          {/* 身份与发布时间 */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-sm">
                <div className="w-full h-full rounded-full overflow-hidden relative bg-neutral-950">
                  <Image src="/avatar.png" alt="Hayden Xue" fill className="object-cover" />
                </div>
              </div>
              <div>
                <span className="font-bold text-white text-xs">Hayden Xue</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block ml-1.5 animate-pulse" />
              </div>
            </div>

            <time className="text-[11px] text-white/60">
              {new Date(memo.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </div>

          {/* 徽章行：地点、心情、天气 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {memo.location && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-mono border border-emerald-500/25">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{memo.location}</span>
              </span>
            )}
            {memo.mood && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-mono border border-amber-500/25">
                {memo.mood}
              </span>
            )}
            {memo.weather && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-mono border border-blue-500/25">
                {memo.weather}
              </span>
            )}
            {memo.tags &&
              memo.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full bg-white/5 text-white/60 text-[10px] font-mono border border-white/10"
                  >
                    #{t}
                  </span>
                ))}
          </div>

          {/* 正文完整展现 */}
          <div className="pt-1">
            <p className="text-xs sm:text-sm text-white/95 leading-relaxed whitespace-pre-wrap font-sans max-h-36 overflow-y-auto pr-1">
              {memo.content}
            </p>
          </div>

          {/* 多图缩略轨 (仅在图片数量大于 1 时呈现) */}
          {images.length > 1 && (
            <div className="pt-2 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {images.map((imgUrl, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => onSelectSubIndex(sIdx)}
                  type="button"
                  className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    sIdx === subImgIndex
                      ? 'border-emerald-400 scale-105 shadow-md ring-2 ring-emerald-400/40'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image src={imgUrl} alt={`Thumb ${sIdx + 1}`} fill className="object-cover" sizes="44px" />
                </button>
              ))}
            </div>
          )}

          {/* 底部动作条 */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => onToggleLike(memo.id, e)}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    isLiked ? 'text-rose-500 fill-rose-500' : 'text-white/80'
                  }`}
                />
                <span>{likeCount > 0 ? likeCount : '心动'}</span>
              </button>

              <button
                onClick={(e) => onShare(memo.id, e)}
                type="button"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                title="复制直达链接"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-white/40">ESC 退出 · ←/→ 切图</div>
          </div>
        </div>
      </div>
    </div>
  );
}
