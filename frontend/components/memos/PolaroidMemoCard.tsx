'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { Memo } from '@/lib/types';
import { api } from '@/lib/api';
import { SafeImage } from '@/components/SafeImage';
import confetti from 'canvas-confetti';
import { Heart, RotateCw, MapPin, Calendar, Camera, Sparkles, Pin } from 'lucide-react';

interface PolaroidMemoCardProps {
  memo: Memo;
  index: number;
}

export function PolaroidMemoCard({ memo, index }: PolaroidMemoCardProps) {
  const { locale, t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const [likes, setLikes] = useState(memo.likeCount || 0);
  const [isLiked, setIsLiked] = useState(false);

  // 解析配图
  let imageUrls: string[] = [];
  if (memo.images) {
    try {
      imageUrls = JSON.parse(memo.images);
    } catch {
      if (memo.images.startsWith('http') || memo.images.startsWith('/')) {
        imageUrls = [memo.images];
      }
    }
  }

  // 计算微倾斜角度以产生真实拍立得散落质感
  const tiltAngles = [-1.5, 1.2, -0.8, 1.6, -1.2, 0.9];
  const tilt = tiltAngles[index % tiltAngles.length];

  // 双击相纸触发爱心微粒子爆炸动效
  const handleDoubleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // 喷射爱心微粒子
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 25,
      spread: 60,
      origin: { x, y },
      colors: ['#ef4444', '#ec4899', '#f43f5e', '#fb7185'],
      shapes: ['circle'],
      scalar: 0.9,
    });

    if (!isLiked) {
      setIsLiked(true);
      setLikes((prev) => prev + 1);
      try {
        await api.likeMemo(memo.id);
      } catch (err) {
        console.error('Like memo failed', err);
      }
    }
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  const dateStr = memo.createdAt?.split('T')[0] || '';
  const timeStr = memo.createdAt?.split('T')[1]?.slice(0, 5) || '';

  return (
    <div
      style={{ perspective: 1200 }}
      className="w-full select-none"
    >
      <div
        onDoubleClick={handleDoubleClick}
        style={{
          transformStyle: 'preserve-3d',
          transform: `${isFlipped ? 'rotateY(180deg)' : ''} rotateZ(${tilt}deg)`,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="relative w-full min-h-[400px] rounded-2xl bg-card border-8 border-white dark:border-neutral-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden p-3"
      >
        {/* ================= 正面 (Front: Polaroid Image & Memo) ================= */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="w-full h-full flex flex-col justify-between"
        >
          <div className="space-y-3">
            {/* 拍立得相框照片区域 */}
            {imageUrls.length > 0 ? (
              <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                <SafeImage
                  src={imageUrls[0]}
                  alt="Polaroid Memory"
                  aspectRatio="1/1"
                  containerClassName="w-full h-full"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                {memo.isPinned === 1 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-mono flex items-center gap-1 shadow-md">
                    <Pin className="w-3 h-3" />
                    PINNED
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-44 rounded-lg bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-transparent border border-border flex items-center justify-center p-4 text-center">
                <p className="text-xs font-serif italic text-muted-foreground">
                  “From the East, toward the unknown.”
                </p>
              </div>
            )}

            {/* 文字正文手记 */}
            <div className="pt-2 px-1">
              <p className="text-sm font-sans text-foreground leading-relaxed whitespace-pre-wrap">
                {memo.content}
              </p>
            </div>
          </div>

          {/* 底部参数与翻转按钮 */}
          <div className="pt-4 px-1 mt-auto flex items-center justify-between border-t border-border/40 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-500" />
                {dateStr}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick(e);
                }}
                className={`flex items-center gap-1 text-[11px] font-mono transition-colors ${
                  isLiked ? 'text-rose-500' : 'hover:text-rose-500'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                {likes}
              </button>
            </div>

            <button
              onClick={handleFlip}
              title={t('polaroid.flip')}
              className="p-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground hover:text-emerald-500 transition-colors flex items-center gap-1 text-[11px] font-mono"
            >
              <RotateCw className="w-3 h-3" />
              <span>3D</span>
            </button>
          </div>
        </div>

        {/* ================= 背面 (Back: EXIF Specs & Meta) ================= */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 w-full h-full bg-neutral-900 text-neutral-100 p-6 flex flex-col justify-between rounded-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-neutral-200">
                  {t('polaroid.meta_title')}
                </span>
              </div>
              <button
                onClick={handleFlip}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 参数列表 */}
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between text-neutral-400">
                <span>{t('polaroid.date')}</span>
                <span className="text-neutral-200">{dateStr} {timeStr}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>{t('polaroid.location')}</span>
                <span className="text-emerald-400">{memo.location || 'Hangzhou · East'}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>{t('polaroid.lens')}</span>
                <span className="text-neutral-200">35mm f/1.8 Prime</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>ISO & Exposure</span>
                <span className="text-neutral-200">ISO 200 · 1/250s</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Curator</span>
                <span className="text-cyan-400 font-semibold">Hayden Xue</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/80">
              <p className="text-[11px] text-neutral-400 italic font-serif leading-relaxed">
                “摄影是光线的记忆，随记是心绪的锚点。在流逝的时光中打捞值得回味的微光。”
              </p>
            </div>
          </div>

          <div className="text-[10px] font-mono text-neutral-500 text-center pt-2">
            HAYDEN_MEMO_ID #{memo.id} · DOUBLE_CLICK_HEARTS
          </div>
        </div>
      </div>
    </div>
  );
}
