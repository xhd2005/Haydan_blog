'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, Sparkles, Play, Pause, Volume2, VolumeX, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useI18n } from '@/lib/i18n';
import { HandwrittenSlogan } from './HandwrittenSlogan';
import { HeroSloganLine } from '@/lib/types';

interface Props {
  heroTitle?: string;
  heroSlogan?: string;
  heroDesc?: string;
  heroBgType?: string;
  heroVideoUrl?: string;
  heroSloganConfigJson?: string;
  announcementEnabled?: number;
  announcementText?: string;
  announcementLink?: string;
}

/**
 * 原生 Three.js WebGL 流光微粒离子场引擎
 * 具备三维正弦波流体动力学、鼠标视差引力阻尼与双主题自适应
 */
function HeroParticlesCanvas({ mousePos }: { mousePos: { x: number; y: number } }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 700;

    // 1. 场景与相机
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 48;

    // 2. 渲染器
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. 生成带柔和衰减的高斯微光纹理
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(52, 211, 153, 0.9)');
      grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    // 4. 离子微粒场生成 (2800 个空间三维微粒)
    const particleCount = 2800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);

    const palette = [
      new THREE.Color('#059669'), // Tranquil Jade
      new THREE.Color('#0d9488'), // Sage Teal
      new THREE.Color('#0284c7'), // Slate Indigo
      new THREE.Color('#64748b'), // Mountain Mist Slate
      new THREE.Color('#6ee7b7'), // Pale Mint Dew
      new THREE.Color('#f59e0b'), // Warm Starlight Amber
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // 空间跨度分布
      const x = (Math.random() - 0.5) * 110;
      const y = (Math.random() - 0.5) * 65;
      const z = (Math.random() - 0.5) * 55;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      initialPositions[i3] = x;
      initialPositions[i3 + 1] = y;
      initialPositions[i3 + 2] = z;

      phases[i] = Math.random() * Math.PI * 2;

      // 翡翠极光色阶随机混合
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const isDark = document.documentElement.classList.contains('dark');
    const material = new THREE.PointsMaterial({
      size: 1.5,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.85 : 0.65,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    // 5. 动画与流体仿真循环
    let animationFrameId: number;
    let clock = new THREE.Clock();

    let targetCameraX = 0;
    let targetCameraY = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // 微粒流体波动仿真
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const u = initialPositions[i3];
        const v = initialPositions[i3 + 1];
        const w = initialPositions[i3 + 2];
        const phase = phases[i];

        // 三维流动极光正弦波动
        posArray[i3 + 1] = v + Math.sin(elapsedTime * 0.8 + u * 0.05 + phase) * 2.2;
        posArray[i3] = u + Math.cos(elapsedTime * 0.5 + w * 0.04 + phase) * 1.5;
        posArray[i3 + 2] = w + Math.sin(elapsedTime * 0.6 + v * 0.06 + phase) * 1.8;
      }
      posAttr.needsUpdate = true;

      // 粒子星系整体轻微公转
      particlesMesh.rotation.y = elapsedTime * 0.03;
      particlesMesh.rotation.x = Math.sin(elapsedTime * 0.02) * 0.05;

      // 鼠标平滑阻尼插值
      targetCameraX = (mousePos.x * 0.15);
      targetCameraY = (-mousePos.y * 0.15);

      camera.position.x += (targetCameraX - camera.position.x) * 0.04;
      camera.position.y += (targetCameraY - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // 6. 响应式视口自适应
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || 700;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      particleTexture.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/**
 * 电影级全息 HUD 交互行动按钮 (Spotlight 光斑跟随 + 3D 视差 Tilt + 轻快触控)
 */
interface HeroActionButtonProps {
  href: string;
  className?: string;
  spotlightColor?: string;
  children: React.ReactNode;
}

function HeroActionButton({
  href,
  className = '',
  spotlightColor = 'rgba(16, 185, 129, 0.35)',
  children,
}: HeroActionButtonProps) {
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPos({ x, y });

    // 计算 3D 视差倾斜角度 (±8deg)
    const rx = -((y / rect.height) - 0.5) * 16;
    const ry = ((x / rect.width) - 0.5) * 16;
    setTilt({ rx, ry });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <Link
      ref={btnRef}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(6px)`
          : 'perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out',
      }}
      className={`group relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full overflow-hidden select-none active:scale-[0.96] ${className}`}
    >
      {/* 动态光斑跟随层 (Spotlight Hover) */}
      <div
        className="pointer-events-none absolute -inset-px rounded-full transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(130px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 75%)`,
        }}
        aria-hidden="true"
      />
      {/* 按钮内容层 */}
      <span className="relative z-10 inline-flex items-center gap-2.5">{children}</span>
    </Link>
  );
}

function resolveGradientClass(scheme: string = 'emerald', isVideoMode: boolean = false) {
  switch (scheme) {
    case 'cyan':
      return isVideoMode
        ? 'from-cyan-300 via-sky-200 to-blue-300'
        : 'from-cyan-700 via-sky-600 to-blue-600 dark:from-cyan-300 dark:via-sky-200 dark:to-blue-300';
    case 'violet':
      return isVideoMode
        ? 'from-violet-300 via-purple-200 to-fuchsia-300'
        : 'from-violet-700 via-purple-600 to-fuchsia-600 dark:from-violet-300 dark:via-purple-200 dark:to-fuchsia-300';
    case 'amber':
      return isVideoMode
        ? 'from-amber-200 via-orange-200 to-rose-200'
        : 'from-amber-600 via-orange-600 to-rose-600 dark:from-amber-200 dark:via-orange-200 dark:to-rose-200';
    case 'rose':
      return isVideoMode
        ? 'from-rose-200 via-pink-200 to-fuchsia-200'
        : 'from-rose-600 via-pink-600 to-fuchsia-600 dark:from-rose-200 dark:via-pink-200 dark:to-fuchsia-200';
    case 'monochrome':
      return isVideoMode
        ? 'from-white via-slate-100 to-slate-200'
        : 'from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-200';
    case 'emerald':
    default:
      return isVideoMode
        ? 'from-emerald-300 via-teal-200 to-cyan-300'
        : 'from-emerald-700 via-teal-600 to-cyan-600 dark:from-emerald-300 dark:via-teal-200 dark:to-cyan-300';
  }
}

export function HeroCinematicStage({
  heroTitle = 'From the East,',
  heroSlogan = 'toward the unknown.',
  heroDesc = "I'm Hayden Xue, a software developer and lifelong learner exploring technology, AI, and the world.",
  heroBgType = 'video',
  heroVideoUrl,
  heroSloganConfigJson,
  announcementEnabled,
  announcementText,
  announcementLink,
}: Props) {
  const { locale, t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [announcementDismissed, setAnnouncementDismissed] = useState(true);

  // 公告栏持久化关闭记忆：只要公告文本未更新，关闭后绝不重复打扰访客
  useEffect(() => {
    if (!announcementText) return;
    try {
      const dismissed = localStorage.getItem('hayden_dismissed_announcement');
      if (dismissed !== announcementText) {
        setAnnouncementDismissed(false);
      }
    } catch {
      setAnnouncementDismissed(false);
    }
  }, [announcementText]);

  const handleDismissAnnouncement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnnouncementDismissed(true);
    try {
      if (announcementText) {
        localStorage.setItem('hayden_dismissed_announcement', announcementText);
      }
    } catch {
      // ignore storage error
    }
  };

  // 视频模式严格由 CMS 配置驱动：未配置 heroVideoUrl 时自动回退 Three.js 流光微粒引擎
  const activeVideoUrl = heroVideoUrl;
  const isVideoMode = heroBgType !== 'particles' && !!heroVideoUrl && !videoError;

  // 解析多排标语定制配置，兼容默认双排兜底
  const sloganLines = useMemo<HeroSloganLine[]>(() => {
    if (heroSloganConfigJson) {
      try {
        const parsed = JSON.parse(heroSloganConfigJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // ignore parse error
      }
    }
    return [
      {
        id: 'line-1',
        text: heroTitle || 'From the East,',
        fontSize: 140,
        colorScheme: 'emerald',
        fontStyle: 'handwrite',
        strokeWidth: 2.0,
      },
      {
        id: 'line-2',
        text: heroSlogan || 'toward the unknown.',
        fontSize: 140,
        colorScheme: 'emerald',
        fontStyle: 'handwrite',
        strokeWidth: 2.0,
      },
    ];
  }, [heroSloganConfigJson, heroTitle, heroSlogan]);

  // 鼠标视差位置计算
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
    setMousePos({ x, y });
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

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full overflow-hidden min-h-screen flex items-center justify-center transition-all duration-700 bg-background"
    >
      {/* 1. 全幅高清背景层 (4K/HD 视频循环 或 Three.js WebGL 流光微粒) 直通屏幕顶端 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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
                videoLoaded ? 'opacity-100' : 'opacity-0'
              } scale-105 filter saturate-[1.08]`}
            />
            {/* 双主题统一轻量电影微膜：保持背景 100% 鲜活纯净、色彩通透，绝不透白底 */}
            <div className="absolute inset-0 bg-black/15 dark:bg-black/20 pointer-events-none" />
            {/* 仅在深色模式下保留微弱电影暗角增强暗夜沉浸感；浅色模式彻底纯净通透，杜绝灰白雾气 */}
            <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)] pointer-events-none" />
          </div>
        ) : (
          /* 真正的 Three.js WebGL 流光微粒引擎 */
          <div className="relative w-full h-full">
            <HeroParticlesCanvas mousePos={mousePos} />
            {/* 流光网格与深空渐变 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-slate-900/5 to-transparent pointer-events-none" />
          </div>
        )}

        {/* 底部纯净直出边界：彻底移除泛白渐变层，保持星空与离子微粒 100% 原始通透度 */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200/40 dark:via-white/10 to-transparent pointer-events-none z-10" />
      </div>

      {/* 2. Hero 前景展示内容区 (完美对齐全站 6xl 栅格，顶部为悬浮液态胶囊预留优雅留白) */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 space-y-6 sm:space-y-8">
        {/* 0. 浮光药丸微光公告徽标 (Floating Glass Pill Badge) */}
        <AnimatePresence>
          {!announcementDismissed && !!announcementEnabled && !!announcementText && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex"
            >
              <div className="group inline-flex items-center gap-1.5 pl-3.5 pr-1.5 py-1 rounded-full text-xs font-medium backdrop-blur-xl bg-neutral-950/45 dark:bg-neutral-950/60 border border-white/20 dark:border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-lg transition-all duration-300 text-white">
                {announcementLink ? (
                  <Link
                    href={announcementLink}
                    className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity text-white"
                  >
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform shrink-0" />
                    <span className="truncate max-w-[240px] sm:max-w-md font-medium text-white/95">{announcementText}</span>
                    <ArrowRight className="w-3 h-3 text-white/70 group-hover:translate-x-0.5 group-hover:text-white transition-all shrink-0" />
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 text-white">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate max-w-[240px] sm:max-w-md font-medium text-white/95">{announcementText}</span>
                  </div>
                )}

                {/* 独立一键关闭按钮 */}
                <button
                  onClick={handleDismissAnnouncement}
                  className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors shrink-0 ml-0.5"
                  aria-label={t('banner.close') || '关闭公告'}
                  title={t('banner.close') || '关闭公告'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* 多排联动 Apple「hello」艺术手写 / 现代多风格多色彩标语定制引擎 */}
        <div className="space-y-2 sm:space-y-4 w-full">
          <motion.h1
            className="w-full font-black tracking-tight text-foreground space-y-2 sm:space-y-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {sloganLines.map((line, idx) => {
              const delay = 0.1 + idx * 0.75;
              const isHandwrite = line.fontStyle === 'handwrite' || !line.fontStyle;
              const isSans = line.fontStyle === 'sans';
              const isSerif = line.fontStyle === 'serif';

              const gradientClass = resolveGradientClass(line.colorScheme, isVideoMode);
              const customGradientStyle =
                line.colorScheme === 'custom' && line.customColorStart && line.customColorEnd
                  ? { backgroundImage: `linear-gradient(to right, ${line.customColorStart}, ${line.customColorEnd})` }
                  : undefined;

              const lineMaxWidth = Math.max(
                480,
                Math.ceil((line.text || '').length * (line.fontSize || 140) * 0.58 + 120)
              );

              return (
                <div
                  key={line.id || idx}
                  style={{ maxWidth: `${lineMaxWidth}px` }}
                  className={`w-full ${idx > 0 && isHandwrite ? '-mt-1 sm:-mt-2 md:-mt-3' : ''}`}
                >
                  {isHandwrite ? (
                    <HandwrittenSlogan
                      text={line.text}
                      delay={delay}
                      fontSize={line.fontSize || 140}
                      strokeWidth={line.strokeWidth || 2.0}
                      colorScheme={line.colorScheme || 'emerald'}
                      customColorStart={line.customColorStart}
                      customColorEnd={line.customColorEnd}
                      cinematic={isVideoMode}
                      className="drop-shadow-md dark:drop-shadow-[0_6px_36px_rgba(16,185,129,0.45)]"
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
                      className={`block w-full font-black tracking-tight bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent leading-[1.08] select-none ${
                        isSans
                          ? 'font-sans font-extrabold'
                          : isSerif
                          ? 'font-serif font-bold italic'
                          : 'font-mono font-bold'
                      }`}
                      style={{
                        fontSize: `clamp(${Math.round((line.fontSize || 140) * 0.42)}px, 8vw, ${
                          line.fontSize || 140
                        }px)`,
                        ...customGradientStyle,
                      }}
                    >
                      {line.text}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.h1>
        </div>

        {/* Hayden Xue 简介 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 max-w-2xl"
        >
          <p className={`text-base sm:text-lg md:text-xl font-medium leading-relaxed ${
            isVideoMode
              ? 'text-neutral-100 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]'
              : 'text-slate-800 dark:text-neutral-200 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-none'
          }`}>
            {locale === 'en'
              ? (!heroDesc || heroDesc.includes('我是') ? t('home.hero_default_desc') : heroDesc)
              : (heroDesc || t('home.hero_default_desc'))}
          </p>
        </motion.div>

        {/* 交互按钮集群 (Spotlight 光斑跟随 + 3D 视差 Tilt + 轻快触控) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-4 pt-2"
        >
          {/* 按钮 1: 阅读我的思考 (流光翡翠高定晶体胶囊) */}
          <HeroActionButton
            href="/blog"
            spotlightColor="rgba(16, 185, 129, 0.45)"
            className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 dark:from-emerald-500 dark:via-teal-400 dark:to-teal-500 text-white dark:text-neutral-950 font-bold text-sm shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] dark:shadow-[0_0_24px_rgba(16,185,129,0.35)] border border-emerald-400/40 dark:border-emerald-300/50 hover:shadow-[0_12px_32px_-4px_rgba(16,185,129,0.6)] px-7"
          >
            {/* 顶部晶莹反光 */}
            <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
            {/* 流光横扫微动效 */}
            <span className="absolute -inset-x-full top-0 bottom-0 bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:translate-x-full duration-1000 ease-in-out transition-transform pointer-events-none" />
            <BookOpen className="w-4 h-4 text-white dark:text-neutral-950 transition-transform duration-300 group-hover:scale-110" />
            <span>{locale === 'en' ? 'Read My Thoughts' : '阅读我的思考'}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </HeroActionButton>

          {/* 按钮 2: 查看旅行足迹 (Compass 罗盘 45° 顺滑旋转 + 航海冷青色微光) */}
          <HeroActionButton
            href="/journey"
            spotlightColor="rgba(20, 184, 166, 0.35)"
            className="bg-white/80 dark:bg-neutral-900/60 text-foreground font-semibold text-sm border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-xs dark:shadow-md hover:border-teal-500/50 dark:hover:border-teal-400/50 hover:shadow-lg hover:shadow-teal-500/10"
          >
            <Compass className="w-4 h-4 text-teal-500 dark:text-teal-400 transition-transform duration-500 ease-out group-hover:rotate-45 group-hover:scale-110" />
            <span>{t('home.explore_journey')}</span>
          </HeroActionButton>

          {/* 按钮 3: 探索外脑 (高定流光白瓷/曜石微光胶囊) */}
          <HeroActionButton
            href="/about"
            spotlightColor="rgba(6, 182, 212, 0.35)"
            className="bg-white/80 dark:bg-neutral-900/60 text-foreground/90 font-semibold text-sm border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-xs hover:border-cyan-500/50 dark:hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10 px-6"
          >
            <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            <span>{t('home.explore_about')}</span>
          </HeroActionButton>
        </motion.div>
      </div>

      {/* 2.5 底部优雅滚动引导微动效 */}
      <div className="absolute bottom-5 sm:bottom-7 inset-x-0 z-20 flex flex-col items-center justify-center pointer-events-none opacity-80 select-none">
        <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/80 mb-0.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {locale === 'en' ? 'SCROLL TO EXPLORE' : '向下滚动探索'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
      </div>
    </div>
  );
}

