'use client';

import React, { useState } from 'react';
import { ImageOff, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  aspectRatio?: '16/9' | '21/9' | '4/3' | '1/1' | 'auto' | string;
  containerClassName?: string;
  fallbackSrc?: string;
}

export function SafeImage({
  src,
  alt = '',
  aspectRatio = 'auto',
  className = '',
  containerClassName = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  ...props
}: SafeImageProps) {
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '16/9':
        return 'aspect-[16/9]';
      case '21/9':
        return 'aspect-[21/9]';
      case '4/3':
        return 'aspect-[4/3]';
      case '1/1':
        return 'aspect-square';
      case 'auto':
      default:
        return '';
    }
  };

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setError(true);
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-secondary/80 dark:bg-zinc-800/80 ${getAspectClass()} ${containerClassName}`}
    >
      {/* 骨架屏 Skeleton 脉冲占位（防止图片解码前发生布局抖动 CLS） */}
      {!loaded && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/60 dark:bg-zinc-800/60 animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
      )}

      {/* 图片加载失败兜底占位 */}
      {error ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground bg-secondary/50 dark:bg-zinc-900/50">
          <ImageOff className="w-6 h-6 opacity-40" />
          <span className="text-[11px] opacity-60">{t('image.load_failed')}</span>
        </div>
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[1.02] blur-sm'
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
}

export default SafeImage;
