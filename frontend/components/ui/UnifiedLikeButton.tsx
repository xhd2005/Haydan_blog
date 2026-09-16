'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { readAuthUserRaw } from '@/lib/storage-keys';
import { useI18n } from '@/lib/i18n';

export interface UnifiedLikeButtonProps {
  targetType: 'POST' | 'MEMO' | 'COMMENT' | 'JOURNEY' | 'PROJECT';
  targetId: number;
  initialLikes?: number;
  initialLiked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pill' | 'ghost' | 'icon';
  className?: string;
  showCount?: boolean;
  onLikedChange?: (liked: boolean, count: number) => void;
}

export function UnifiedLikeButton({
  targetType,
  targetId,
  initialLikes = 0,
  initialLiked = false,
  size = 'md',
  variant = 'pill',
  className = '',
  showCount = true,
  onLikedChange,
}: UnifiedLikeButtonProps) {
  const { t } = useI18n();
  const [likes, setLikes] = useState<number>(initialLikes);
  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [isHovered, setIsHovered] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  // 同步属性变化
  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  // 若未传入 initialLiked，尝试查询批量点赞状态（已登录用户）
  useEffect(() => {
    const raw = readAuthUserRaw();
    if (raw && initialLiked === undefined) {
      api.getLikeBatchStatus(targetType, [targetId])
        .then((res) => {
          if (res && res[String(targetId)] !== undefined) {
            setLiked(Boolean(res[String(targetId)]));
          }
        })
        .catch(() => {});
    }
  }, [targetType, targetId, initialLiked]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;

    const nextLiked = !liked;
    const prevCount = likes;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    // 乐观更新
    setLiked(nextLiked);
    setLikes(nextCount);
    if (nextLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 900);
    }
    if (onLikedChange) {
      onLikedChange(nextLiked, nextCount);
    }

    try {
      setLoading(true);
      const res = await api.toggleLike(targetType, targetId);
      if (res && typeof res.liked === 'boolean') {
        setLiked(res.liked);
        setLikes(res.likeCount);
        if (onLikedChange) {
          onLikedChange(res.liked, res.likeCount);
        }
      }
    } catch (err) {
      // 失败回退
      setLiked(!nextLiked);
      setLikes(prevCount);
      if (onLikedChange) {
        onLikedChange(!nextLiked, prevCount);
      }
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <motion.button
          type="button"
          onClick={handleToggle}
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.12 }}
          aria-label={liked ? '取消点赞' : '点赞'}
          className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
            liked
              ? 'text-rose-500 bg-rose-500/10'
              : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'
          }`}
        >
          <Heart
            className={`${iconSizes} transition-all duration-300 ${
              liked ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </motion.button>
        {showCount && (
          <span className={`font-mono text-xs font-semibold ml-1 ${liked ? 'text-rose-500' : 'text-muted-foreground'}`}>
            {likes}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <motion.button
        type="button"
        onClick={handleToggle}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.03 }}
        aria-label={liked ? '取消喜欢' : '点亮喜欢'}
        className={`group relative inline-flex items-center rounded-full font-medium transition-all duration-300 shadow-xs select-none border ${sizeClasses} ${
          liked
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:bg-rose-500/20 dark:border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
            : 'bg-card hover:bg-rose-500/10 border-border hover:border-rose-500/30 text-muted-foreground hover:text-rose-500'
        }`}
      >
        <motion.div
          animate={{ scale: liked ? [1, 1.35, 1] : 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Heart
            className={`${iconSizes} transition-colors duration-300 ${
              liked ? 'fill-rose-500 text-rose-500' : 'group-hover:text-rose-500'
            }`}
          />
        </motion.div>

        {showCount && (
          <span className="font-mono font-semibold tracking-tight">
            {likes}
          </span>
        )}
      </motion.button>

      {/* 浮空心形粒子动效 */}
      <AnimatePresence>
        {animating && (
          <motion.div
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -28, scale: 1.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="absolute left-1/2 -top-3 -translate-x-1/2 pointer-events-none flex items-center gap-0.5 text-xs font-bold text-rose-500 font-mono z-20"
          >
            <span>+1</span>
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
