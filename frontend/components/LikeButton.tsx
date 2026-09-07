'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  id: number;
  initialLikes?: number;
  type?: 'post' | 'memo';
}

export function LikeButton({ id, initialLikes = 0, type = 'post' }: LikeButtonProps) {
  const { t } = useI18n();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikes((prev) => prev + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1000);

    try {
      if (type === 'post') {
        await api.likePost(id);
      } else {
        await api.likeMemo(id);
      }
    } catch {
      // 静默处理或保持增量
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleLike}
        disabled={liked}
        className={`group relative inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 shadow-sm ${
          liked
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            : 'bg-secondary hover:bg-rose-500/10 border-border hover:border-rose-500/30 text-muted-foreground hover:text-rose-500'
        }`}
        title={liked ? t('like.liked') : t('like.action')}
      >
        <Heart
          className={`w-4 h-4 transition-transform duration-300 ${
            liked ? 'fill-rose-500 text-rose-500 scale-110' : 'group-hover:scale-125'
          }`}
        />
        <span className="font-mono font-semibold">{likes}</span>
      </button>

      {/* Floating heart animation */}
      {animating && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-rose-500 font-bold text-xs animate-bounce pointer-events-none">
          +1 ❤️
        </span>
      )}
    </div>
  );
}
