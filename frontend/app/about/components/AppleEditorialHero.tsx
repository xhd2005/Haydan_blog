'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, 
  MapPin, 
  Radio, 
  Compass, 
  ArrowDown, 
  Mail, 
  Check, 
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Video as VideoIcon
} from 'lucide-react';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';

interface AppleEditorialHeroProps {
  avatarUrl?: string;
  onExploreClick?: () => void;
  videoUrl?: string;
  imageUrl?: string;
  bgType?: 'video' | 'image';
}

export function AppleEditorialHero({
  avatarUrl = DEFAULT_AVATAR,
  onExploreClick,
  videoUrl,
  imageUrl,
  bgType = 'video',
}: AppleEditorialHeroProps) {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const email = 'haydenxue@example.com';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  // 兜底高质感云端流体与高山航拍视频 (支持真实 MinIO 优先)
  const activeVideoUrl = videoUrl || 'http://49.233.166.212:9000/hayden-blog/2026/09/4df56522a9d24456a1bd6322cc75cd0d.mp4';
  const activeImageUrl = imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2000&auto=format&fit=crop';
  const isVideoMode = bgType === 'video' && !videoError;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success(locale === 'en' ? 'Email copied to clipboard' : '站长邮箱已复制');
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 overflow-hidden min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center">
      
      {/* ================= 1. 全景电影级动态背景层 (Cinematic Video & Image Backdrop) ================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {isVideoMode ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={activeVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => setVideoError(true)}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${
                videoLoaded ? 'opacity-85 dark:opacity-60' : 'opacity-0'
              } scale-105 filter saturate-[1.1]`}
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={activeImageUrl}
              alt="Hayden Xue Background"
              fill
              priority
              className="object-cover opacity-70 dark:opacity-40 scale-105 filter saturate-[1.1]"
              sizes="100vw"
            />
          </div>
        )}

        {/* ================= 2. 智能自适应双主题电影滤镜 (Cinematic Depth Masking) ================= */}
        {/* 深色模式滤镜：黑金电影感暗角与向下羽化至纯净曜石黑 (#090a0f) */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-[#090a0f]/60 via-[#090a0f]/30 to-[#090a0f]" />
        <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(9,10,15,0.75)_100%)]" />

        {/* 浅色模式滤镜：凝脂白瓷微磨砂透镜，保证纯黑艺术大标题 100% 清晰通透，背景隐约呼吸流淌 */}
        <div className="block dark:hidden absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-[#fbfbfd]" />
        <div className="block dark:hidden absolute inset-0 backdrop-blur-[2.5px] bg-[#fbfbfd]/60" />
      </div>

      {/* 极轻量环境极光光斑 (Ambient Aurora Glow) */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[500px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-sky-500/15 dark:from-emerald-500/20 dark:via-cyan-500/15 dark:to-transparent rounded-full blur-3xl opacity-60" />

      {/* ================= 3. 苹果杂志排版前景内容 (Foreground Editorial) ================= */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        
        {/* ① 实时脉搏胶囊 (Living Pulse Pill) */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-mono
            bg-white/85 dark:bg-[#0f1117]/85 backdrop-blur-xl
            border border-slate-200/90 dark:border-white/[0.12]
            shadow-md text-slate-800 dark:text-slate-200"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="tracking-wide">LIVING PULSE</span>
          <span className="text-slate-300 dark:text-neutral-700">|</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">ONLINE</span>
          <span className="hidden sm:inline text-slate-300 dark:text-neutral-700">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <MapPin className="w-3 h-3 text-emerald-500" />
            30°39&apos;N 104°04&apos;E · 川西前哨
          </span>
        </motion.div>

        {/* ② 艺术肖像光环 (Portrait with Breathing Halo) */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-8 group"
        >
          {/* 外圈呼吸流光 */}
          <div className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-sky-500/25 blur-md opacity-75 group-hover:opacity-100 transition duration-700 animate-pulse" />
          
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-b from-white/95 to-white/60 dark:from-white/25 dark:to-white/5 backdrop-blur-md shadow-2xl">
            <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-emerald-500/40">
              <Image
                src={avatarUrl}
                alt="Hayden Xue"
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 112px, 128px"
              />
            </div>
          </div>

          {/* 肖像角标 */}
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-lg border-2 border-white dark:border-[#090a0f]">
            <Radio className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* ③ 站长身份纯正性标识 (Identity Anchor: Hayden Xue) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="space-y-3 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono tracking-widest uppercase font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/10 border border-emerald-500/30">
            <Sparkles className="w-3 h-3" />
            Hayden Xue · Dossier & Creative Garden
          </div>

          {/* ④ 巨幕杂志艺术标题 (Instrument Serif Italic Headline) */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-tight text-slate-900 dark:text-white leading-[1.1] sm:leading-[1.08] drop-shadow-sm">
            Engineering Elegance,<br className="hidden sm:block" />
            <span className="italic font-normal bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 dark:from-emerald-400 dark:via-teal-300 dark:to-sky-400 bg-clip-text text-transparent">
              Wandering in Nature.
            </span>
          </h1>

          {/* ⑤ 纯净杂志副标题宣言 */}
          <p className="pt-2 text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-200 font-sans font-light max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            在代码与分布式架构中雕琢高并发秩序，在川西雪山与东亚旷野中校准生命心智。
            这里是 <strong className="font-semibold text-slate-900 dark:text-white">Hayden Xue</strong> 的数字心智展台与造物实录。
          </p>
        </motion.div>

        {/* ⑥ 交互行动岛 (Action Pill Dock) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
          <button
            type="button"
            onClick={onExploreClick}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium
              bg-slate-900 text-white dark:bg-white dark:text-slate-950
              hover:bg-emerald-600 dark:hover:bg-emerald-400 dark:hover:text-slate-950
              shadow-xl hover:shadow-emerald-500/25 transition-all duration-300"
          >
            <span>探索核心心智画卷</span>
            <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium font-mono
              bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur-md
              text-slate-800 dark:text-slate-200
              border border-slate-200/90 dark:border-white/[0.12]
              hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-white/[0.05]
              shadow-md transition-all duration-200"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>已复制邮箱</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 text-slate-500" />
                <span>haydenxue@example.com</span>
              </>
            )}
          </button>

          <Link
            href="/journey"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium
              bg-emerald-50 dark:bg-emerald-950/50
              text-emerald-800 dark:text-emerald-300
              border border-emerald-300/80 dark:border-emerald-800/60
              hover:bg-emerald-100 dark:hover:bg-emerald-900/60
              shadow-sm transition-colors duration-200"
          >
            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>真实高山足迹</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        </motion.div>
      </div>

      {/* ================= 4. 苹果极简播放/暂停微型控制胶囊 (Apple Floating Media Pill) ================= */}
      {isVideoMode && (
        <div className="absolute right-4 bottom-4 sm:right-8 sm:bottom-6 z-20">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? '暂停背景视频' : '播放背景视频'}
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-mono
              bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-xl
              text-slate-700 dark:text-slate-300
              border border-slate-200/80 dark:border-white/[0.1]
              shadow-lg hover:border-emerald-500/50 transition-all duration-200"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-emerald-500" />
                <span className="hidden sm:inline">PAUSE CINEMA</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-500" />
                <span className="hidden sm:inline">PLAY CINEMA</span>
              </>
            )}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>
      )}
    </section>
  );
}
