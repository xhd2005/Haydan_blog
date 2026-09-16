'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
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
  Play, 
  Pause, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';

interface CinematicHeroActProps {
  avatarUrl?: string;
  onExploreClick?: () => void;
  videoUrl?: string;
  imageUrl?: string;
  bgType?: 'video' | 'image' | 'obsidian';
  titleLine1?: string;
  titleLine2?: string;
  fontFamilyLine1?: string;
  fontFamilyLine2?: string;
  customFontLine1?: string;
  customFontLine2?: string;
}

export function CinematicHeroAct({
  avatarUrl = DEFAULT_AVATAR,
  onExploreClick,
  videoUrl,
  imageUrl,
  bgType = 'obsidian',
  titleLine1 = 'Engineering Elegance,',
  titleLine2 = 'Wandering in Nature.',
  fontFamilyLine1 = 'sans',
  fontFamilyLine2 = 'handwrite',
  customFontLine1,
  customFontLine2,
}: CinematicHeroActProps) {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const email = 'haydenxue@example.com';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  // 动态时钟
  const [timeStr, setTimeStr] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('zh-CN', {
          hour12: false,
          timeZone: 'Asia/Shanghai',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3D 鼠标磁吸微视差
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-7, 7]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const isVideoMode = bgType === 'video' && !!videoUrl && !videoError;
  const isImageMode = bgType === 'image' && !!imageUrl;

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

  // 字体样式解析函数
  const getFontClassLine1 = () => {
    if (customFontLine1) return '';
    switch (fontFamilyLine1) {
      case 'sans':
      case 'modernSans':
        return 'font-modernSans tracking-tight font-extrabold';
      case 'playfair':
        return 'font-playfair font-semibold tracking-normal';
      case 'serif':
        return 'font-serif font-normal';
      case 'mono':
        return 'font-mono tracking-tight font-semibold';
      case 'handwrite':
        return 'font-handwrite font-normal tracking-wide';
      default:
        return 'font-modernSans tracking-tight font-extrabold';
    }
  };

  const getFontClassLine2 = () => {
    if (customFontLine2) return '';
    switch (fontFamilyLine2) {
      case 'handwrite':
        return 'font-handwrite font-normal tracking-wide text-[1.12em]';
      case 'dancing':
        return 'font-dancing font-normal tracking-wide text-[1.1em]';
      case 'playfair':
        return 'font-playfair italic font-medium tracking-normal';
      case 'serif':
        return 'font-serif italic font-normal';
      case 'sans':
      case 'modernSans':
        return 'font-modernSans font-bold tracking-tight';
      case 'mono':
        return 'font-mono font-semibold tracking-tight';
      default:
        return 'font-handwrite font-normal tracking-wide text-[1.12em]';
    }
  };

  // 字符级拆解动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.35,
      },
    },
  };

  const charVariants = {
    hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const line2Variants = {
    hidden: { opacity: 0, x: -28, y: 14, filter: 'blur(8px)', scale: 0.96 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        duration: 0.85,
        delay: 0.95,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section 
      id="act-hero" 
      className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden bg-[#fbfbfd] dark:bg-[#050608] transition-colors duration-500"
    >
      
      {/* ================= 1. 彻底告别雾蒙蒙：纯净黑曜石微晶深空 (Crystal Obsidian Void) ================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        
        {/* ① 纯黑曜石深空底色 */}
        <div className="absolute inset-0 bg-[#fbfbfd] dark:bg-[#050608]" />

        {/* ② 极细微晶星辰点阵（0% 模糊，激光级通透，类似 Linear / Apple Pro） */}
        <div 
          className="absolute inset-0 opacity-[0.45] dark:opacity-[0.22]"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            color: 'rgb(148, 163, 184)',
          }}
        />

        {/* ③ 极轻微的微光聚焦点（无杂色散斑，无多层发灰毛玻璃） */}
        <div 
          className="absolute inset-0 opacity-60 dark:opacity-35"
          style={{
            background: 'radial-gradient(circle at 50% 38%, rgba(16, 185, 129, 0.12) 0%, rgba(20, 184, 166, 0.04) 40%, transparent 70%)',
          }}
        />

        {/* ④ 若开启视频模式：超清播放与边缘羽化 */}
        {isVideoMode && (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => setVideoError(true)}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${
                videoLoaded ? 'opacity-85 dark:opacity-65' : 'opacity-0'
              } filter contrast-[1.05] brightness-[0.95]`}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050608]/40 to-[#050608] hidden dark:block" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-[#fbfbfd] block dark:hidden" />
          </div>
        )}

        {/* ⑤ 若开启图片模式 */}
        {isImageMode && !isVideoMode && (
          <div className="relative w-full h-full">
            <Image
              src={imageUrl!}
              alt="Hayden Xue Background"
              fill
              priority
              className="object-cover opacity-75 dark:opacity-40 filter contrast-[1.05]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050608]/50 to-[#050608] hidden dark:block" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-[#fbfbfd] block dark:hidden" />
          </div>
        )}
      </div>

      {/* ================= 2. 前景杂志排版与核心内容 ================= */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        
        {/* ① 实时生命体征脉搏胶囊 (Living Pulse Pill) */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-7 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-mono
            bg-white/90 dark:bg-[#0d0f17]/90 backdrop-blur-md
            border border-slate-200/90 dark:border-white/[0.12]
            shadow-sm text-slate-800 dark:text-slate-200"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="tracking-wide font-semibold text-emerald-600 dark:text-emerald-400">LIVING PULSE</span>
          <span className="text-slate-300 dark:text-neutral-700">|</span>
          <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-500" />
            {timeStr || '18:00:00'}
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-neutral-700">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <MapPin className="w-3 h-3 text-emerald-500" />
            30°39&apos;N 104°04&apos;E · 川西前哨
          </span>
        </motion.div>

        {/* ② 呼吸肖像光环 (Portrait with Breathing Halo) */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-7 group"
        >
          {/* 外圈微呼吸极光 */}
          <div className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-sky-500/25 blur-md opacity-70 group-hover:opacity-100 transition duration-700" />
          
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-white/90 dark:bg-white/10 backdrop-blur-md shadow-xl">
            <div className="relative w-full h-full rounded-full overflow-hidden border border-emerald-500/40">
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

          {/* 肖像状态角标 */}
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-lg border-2 border-white dark:border-[#050608]">
            <Radio className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* ③ 站长身份纯正性标识 (Identity Anchor) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono tracking-widest uppercase font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/10 border border-emerald-500/30">
            <Sparkles className="w-3 h-3" />
            Hayden Xue · Architect & Digital Garden
          </div>

          {/* ④ 「序章交响」字符级入场动效与 3D 磁吸视差标题 */}
          <motion.div
            style={{ rotateX, rotateY, transformPerspective: 1000 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="cursor-default py-2 select-none"
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.75rem] leading-[1.12] sm:leading-[1.08] tracking-tight">
              
              {/* 第一句：工程理性逐字激光雕琢升起 (按词分组避免折行切字，浅色模式无黑雾阴影) */}
              <motion.span
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={customFontLine1 ? { fontFamily: customFontLine1 } : undefined}
                className={`block text-slate-900 dark:text-white dark:drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] ${getFontClassLine1()}`}
              >
                {titleLine1.split(' ').map((word, wIdx) => (
                  <span key={wIdx} className="inline-block whitespace-nowrap mr-[0.25em] last:mr-0">
                    {Array.from(word).map((char, cIdx) => (
                      <motion.span
                        key={`${char}-${cIdx}`}
                        variants={charVariants}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </span>
                ))}
              </motion.span>

              {/* 第二句：自然旷野山风拂过流体流光展开 */}
              <motion.span
                variants={line2Variants}
                initial="hidden"
                animate="visible"
                style={customFontLine2 ? { fontFamily: customFontLine2 } : undefined}
                className={`block mt-2 sm:mt-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent dark:drop-shadow-[0_2px_16px_rgba(16,185,129,0.3)] ${getFontClassLine2()}`}
              >
                {titleLine2}
              </motion.span>
            </h1>
          </motion.div>

          {/* ⑤ 纯净宣言 */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="pt-2 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 font-sans font-light max-w-2xl mx-auto leading-relaxed"
          >
            在代码与分布式架构中雕琢高并发秩序，在川西雪山与东亚旷野中校准生命心智。
            这里是 <strong className="font-semibold text-slate-900 dark:text-white">Hayden Xue</strong> 的数字心智展台与造物实录。
          </motion.p>
        </motion.div>

        {/* ⑥ 交互行动岛 (Action Pill Dock) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.35 }}
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
            <span>开启电影长卷叙事</span>
            <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium font-mono
              bg-white/90 dark:bg-[#0d0f17]/90 backdrop-blur-md
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

      {/* 3. 电影视频控制微型胶囊（仅在视频模式下显示） */}
      {isVideoMode && (
        <div className="absolute right-4 bottom-4 sm:right-8 sm:bottom-6 z-20">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? '暂停背景视频' : '播放背景视频'}
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-mono
              bg-white/80 dark:bg-[#0d0f17]/80 backdrop-blur-xl
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
