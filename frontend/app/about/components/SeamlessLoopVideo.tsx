'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface SeamlessLoopVideoProps {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  muted?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  ariaLabel?: string;
}

/**
 * SeamlessLoopVideo
 * 遵循 RECREATION PROMPT 规范，基于原生 requestAnimationFrame 实现无缝 500ms 黑场淡入淡出循环
 * - onCanPlay: 500ms rAF 淡入 (0 -> 1)
 * - onTimeUpdate: 剩余时间 <= 0.55s 时，500ms rAF 淡出 (1 -> 0)
 * - onEnded: 设置 opacity 0，延时 100ms 重置 currentTime = 0 并自动播放，500ms rAF 淡入 (0 -> 1)
 */
export function SeamlessLoopVideo({
  src,
  poster,
  className = '',
  style,
  muted = true,
  autoPlay = true,
  playsInline = true,
  ariaLabel,
}: SeamlessLoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fadeAnimIdRef = useRef<number | null>(null);
  const isFadingOutRef = useRef(false);
  const isEndedHandledRef = useRef(false);

  // 清除进行中的 rAF
  const clearFadeAnim = useCallback(() => {
    if (fadeAnimIdRef.current !== null) {
      cancelAnimationFrame(fadeAnimIdRef.current);
      fadeAnimIdRef.current = null;
    }
  }, []);

  // rAF 淡入
  const fadeIn = useCallback(
    (duration = 500) => {
      clearFadeAnim();
      const video = videoRef.current;
      if (!video) return;

      const initialOpacity = parseFloat(video.style.opacity || '0');
      const start = performance.now();

      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const currentOpacity = initialOpacity + (1 - initialOpacity) * progress;
        if (videoRef.current) {
          videoRef.current.style.opacity = currentOpacity.toFixed(3);
        }
        if (progress < 1) {
          fadeAnimIdRef.current = requestAnimationFrame(step);
        } else {
          fadeAnimIdRef.current = null;
        }
      };

      fadeAnimIdRef.current = requestAnimationFrame(step);
    },
    [clearFadeAnim]
  );

  // rAF 淡出
  const fadeOut = useCallback(
    (duration = 500) => {
      clearFadeAnim();
      const video = videoRef.current;
      if (!video) return;

      const initialOpacity = parseFloat(video.style.opacity || '1');
      const start = performance.now();

      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const currentOpacity = initialOpacity * (1 - progress);
        if (videoRef.current) {
          videoRef.current.style.opacity = currentOpacity.toFixed(3);
        }
        if (progress < 1) {
          fadeAnimIdRef.current = requestAnimationFrame(step);
        } else {
          fadeAnimIdRef.current = null;
        }
      };

      fadeAnimIdRef.current = requestAnimationFrame(step);
    },
    [clearFadeAnim]
  );

  const handleCanPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (autoPlay) {
      video.play().catch(() => {
        // 浏览器自动播放限制静默降级
      });
    }
    fadeIn(500);
  }, [autoPlay, fadeIn]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const remaining = video.duration - video.currentTime;
    if (remaining <= 0.55 && !isFadingOutRef.current) {
      isFadingOutRef.current = true;
      fadeOut(500);
    }
  }, [fadeOut]);

  const handleEnded = useCallback(() => {
    if (isEndedHandledRef.current) return;
    isEndedHandledRef.current = true;

    const video = videoRef.current;
    if (!video) return;

    video.style.opacity = '0';

    setTimeout(() => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => {
          isFadingOutRef.current = false;
          isEndedHandledRef.current = false;
          fadeIn(500);
        })
        .catch(() => {
          isFadingOutRef.current = false;
          isEndedHandledRef.current = false;
        });
    }, 100);
  }, [fadeIn]);

  useEffect(() => {
    return () => {
      clearFadeAnim();
    };
  }, [clearFadeAnim]);

  return (
    <div className={`relative overflow-hidden bg-black ${className}`} style={style}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        autoPlay={autoPlay}
        playsInline={playsInline}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        aria-label={ariaLabel}
        className="w-full h-full object-cover select-none pointer-events-none"
        style={{
          opacity: 0,
          willChange: 'opacity',
        }}
      />
    </div>
  );
}
