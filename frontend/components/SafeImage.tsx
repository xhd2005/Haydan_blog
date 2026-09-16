'use client';

import React, { useState, useEffect } from 'react';
import { ImageOff, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_COVER } from '@/lib/media-defaults';
import { normalizeMediaUrl } from '@/lib/media-url';

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
  fallbackSrc = DEFAULT_COVER,
  ...props
}: SafeImageProps) {
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const normalizedInitial = normalizeMediaUrl(src) || fallbackSrc;
  const [imgSrc, setImgSrc] = useState(normalizedInitial);

  useEffect(() => {
    const normalized = normalizeMediaUrl(src) || fallbackSrc;
    setImgSrc(normalized);
    setLoaded(false);
    setError(false);

    // 3.5秒超时安全网：若网络延迟较大或客户端未触发 onLoad，强制平滑展现防止永久骨架屏白屏
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, [src, fallbackSrc]);

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
      {/* 骨架屏 Skeleton 脉冲占位 */}
      {!loaded && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/40 dark:bg-zinc-800/40 pointer-events-none transition-opacity duration-300">
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
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`w-full h-full object-cover transition-all duration-300 ease-out ${
            loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-80 scale-[1.01] blur-[1px]'
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
}

export default SafeImage;
