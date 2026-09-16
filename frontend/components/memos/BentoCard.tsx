'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Memo } from '@/lib/types';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Heart,
  Share2,
  MapPin,
  Pin,
  Layers,
  Sparkles,
  Maximize2,
  Edit3,
  Compass,
} from 'lucide-react';
import { parseMemoImages } from './DarkroomLightbox';
import { PhotoStack } from './PhotoStack';

interface BentoCardProps {
  memo: Memo;
  index: number;
  isAdmin: boolean;
  onOpenLightbox: (memo: Memo, subIdx?: number) => void;
  onToggleLike: (memoId: number, e: React.MouseEvent) => void;
  onShare: (memoId: number, e: React.MouseEvent) => void;
  onTogglePin?: (memoId: number, e: React.MouseEvent) => void;
  onSelectTag?: (tag: string) => void;
  isLiked: boolean;
  likeCount: number;
  locale: string;
}

function getFilmBranding(id: number) {
  const stocks = [
    { brand: 'FUJIFILM', type: 'PROVIA 100F', dot: 'bg-emerald-500' },
    { brand: 'KODAK', type: 'PORTRA 400', dot: 'bg-amber-500' },
    { brand: 'ILFORD', type: 'HP5 400', dot: 'bg-slate-400' },
    { brand: 'FUJIFILM', type: 'VELVIA 50', dot: 'bg-rose-500' },
    { brand: 'KODAK', type: 'EKTACHROME', dot: 'bg-sky-500' },
  ];
  return stocks[Math.abs(id) % stocks.length];
}

export function BentoCard({
  memo,
  index,
  isAdmin,
  onOpenLightbox,
  onToggleLike,
  onShare,
  onTogglePin,
  onSelectTag,
  isLiked,
  likeCount,
  locale,
}: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const images = useMemo(() => parseMemoImages(memo.images), [memo.images]);
  const isPhoto = images.length > 0;
  const isMultiPhoto = images.length > 1;
  const isPinned = memo.isPinned === 1;
  const filmStock = useMemo(() => getFilmBranding(memo.id), [memo.id]);

  // 3D Tilt 视差计算
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rotateY = ((mouseX - width / 2) / (width / 2)) * 2.5;
    const rotateX = -((mouseY - height / 2) / (height / 2)) * 2.5;

    const glareX = (mouseX / width) * 100;
    const glareY = (mouseY / height) * 100;

    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.25), ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-2px)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out',
        }}
        className={`relative flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl transition-shadow duration-300 border ${
          isPinned
            ? 'bg-gradient-to-b from-amber-500/[0.04] to-white/70 dark:to-neutral-900/60 border-amber-500/30 dark:border-amber-400/25 shadow-md hover:shadow-xl'
            : 'bg-white/85 dark:bg-neutral-900/65 border-slate-200/70 dark:border-white/[0.08] shadow-xs hover:shadow-xl dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* 流光高光跟随 */}
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle 300px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.1), transparent 80%)`,
          }}
        />

        {/* 1. 多图形态：Photo Stack 拟真照片堆叠 */}
        {isMultiPhoto && (
          <div className="pt-2 px-2">
            <PhotoStack
              images={images}
              alt={memo.content.slice(0, 30)}
              onOpen={(subIdx) => onOpenLightbox(memo, subIdx || 0)}
              priority={index < 2}
            />
          </div>
        )}

        {/* 2. 单图形态：贴顶无内缩 Edge-to-Edge 大画幅 */}
        {images.length === 1 && (
          <div
            onClick={() => onOpenLightbox(memo, 0)}
            className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-neutral-950/20 cursor-pointer group/photo select-none"
          >
            <Image
              src={images[0]}
              alt={memo.content.slice(0, 30)}
              fill
              className="object-cover group-hover/photo:scale-104 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index < 2}
            />

            {/* 贴角胶卷微标 */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-mono border border-white/20 shadow-md">
              <span className={`w-1.5 h-1.5 rounded-full ${filmStock.dot}`} />
              <span>{filmStock.brand}</span>
              <span className="opacity-70">{filmStock.type}</span>
            </div>

            {/* 悬浮微光指示 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3.5">
              <span className="text-[11px] font-mono text-white/90">点击展开</span>
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        )}

        {/* 3. 卡片正文与信息区 (Padding 紧贴内容) */}
        <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
          {/* 纯文字便签的顶部微标 (仅在无图时显示) */}
          {!isPhoto && (
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-semibold text-foreground text-[11px]">NOTE</span>
              </div>
              <time className="text-[11px] font-mono">
                {new Date(memo.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            </div>
          )}

          {/* 正文呈现 */}
          <div>
            {isPhoto ? (
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
                {memo.content}
              </p>
            ) : (
              <div className="space-y-2">
                <span className="text-2xl leading-none font-serif text-amber-500/40 select-none block">
                  “
                </span>
                <p className="font-serif text-sm sm:text-base text-foreground leading-relaxed tracking-wide whitespace-pre-wrap">
                  {memo.content}
                </p>
                <div className="text-right">
                  <span className="font-serif italic text-xs text-muted-foreground/60">
                    — Hayden Xue
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 徽章行：地点、心情、天气、标签 */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.05] space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {isPinned && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold border border-amber-500/25">
                  <Pin className="w-2.5 h-2.5 fill-amber-500/30" />
                  <span>置顶</span>
                </span>
              )}

              {memo.location && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] border border-emerald-500/20 truncate max-w-[170px]">
                  <Compass className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{memo.location}</span>
                </span>
              )}

              {memo.mood && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] border border-amber-500/20">
                  {memo.mood}
                </span>
              )}

              {memo.weather && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] border border-blue-500/20">
                  {memo.weather}
                </span>
              )}

              {memo.tags &&
                memo.tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTag?.(t);
                      }}
                      className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground text-[10px] font-mono border border-slate-200/50 dark:border-white/5 cursor-pointer transition-colors"
                    >
                      #{t}
                    </button>
                  ))}
            </div>

            {/* 底部动作条 */}
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => onToggleLike(memo.id, e)}
                  type="button"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer group/like"
                  title="心动"
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-transform group-hover/like:scale-120 ${
                      isLiked ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'
                    }`}
                  />
                  {likeCount > 0 && (
                    <span className={`text-[11px] ${isLiked ? 'text-rose-500 font-bold' : ''}`}>
                      {likeCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={(e) => onShare(memo.id, e)}
                  type="button"
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="复制直达链接"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1 ml-1">
                    {onTogglePin && (
                      <button
                        onClick={(e) => onTogglePin(memo.id, e)}
                        type="button"
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
                        title={isPinned ? '取消置顶' : '设为置顶'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                    )}
                    <a
                      href="/admin/memos"
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                      title="在后台管理编辑"
                    >
                      <Edit3 className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {isPhoto && (
                <time className="text-[11px] text-muted-foreground/70">
                  {new Date(memo.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
