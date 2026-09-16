'use client';

import React, { useState, useRef } from 'react';
import { SafeImage } from '@/components/SafeImage';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { formatStardate } from '@/lib/stardate';
import { Sparkles, ShieldCheck, Github, Cpu, Radio, Award, Compass, ExternalLink } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface Props {
  avatar?: string;
  slogan?: string;
}

export function ParallaxBadge3D({ avatar, slogan }: Props) {
  const { locale } = useI18n();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [specular, setSpecular] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1

    // Rotation angles (-12deg to +12deg)
    const rx = (0.5 - y) * 22;
    const ry = (x - 0.5) * 22;

    setRotateX(rx);
    setRotateY(ry);
    setSpecular({
      x: x * 100,
      y: y * 100,
      opacity: 0.35,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setSpecular({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div className="relative flex flex-col items-center py-6 select-none">
      {/* 1. Hanging Lanyard (织物挂绳与金属卡扣) */}
      <div className="relative flex flex-col items-center z-10 -mb-5 pointer-events-none">
        {/* Woven Strap Hanging from ceiling */}
        <div 
          className="w-7 h-16 sm:h-20 bg-neutral-900 border-x border-emerald-500/30 relative shadow-md"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #10b981 0, #10b981 1px, transparent 0, transparent 4px), repeating-linear-gradient(-45deg, #059669 0, #059669 1px, transparent 0, transparent 4px)`,
            backgroundColor: '#090a0f',
          }}
        >
          {/* Lanyard Center Stitch Line */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-emerald-400/40" />
        </div>

        {/* Metal Carabiner Clip (金属挂钩卡扣) */}
        <div className="relative -mt-1 flex flex-col items-center">
          {/* Metal ring */}
          <div className="w-9 h-5 rounded-md border-2 border-neutral-400 bg-gradient-to-b from-neutral-200 via-neutral-400 to-neutral-600 shadow-md flex items-center justify-center">
            <div className="w-5 h-2 rounded bg-neutral-900" />
          </div>
          {/* Swivel clip hook */}
          <div className="w-3.5 h-6 bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-400 border border-neutral-600 rounded-b-md shadow-sm" />
        </div>
      </div>

      {/* 2. 3D Parallax Card Container (Perspective Scene) */}
      <div 
        className="w-full max-w-sm sm:max-w-md"
        style={{ perspective: '1100px' }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-3xl p-6 sm:p-7 border border-emerald-500/40 bg-gradient-to-b from-card/95 via-card/90 to-card/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] transition-transform duration-200 ease-out cursor-pointer group"
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
            transformStyle: 'preserve-3d',
            boxShadow: isHovered 
              ? '0 0 35px rgba(16, 185, 129, 0.25), 0 25px 60px rgba(0, 0, 0, 0.5)' 
              : '0 0 20px rgba(16, 185, 129, 0.12), 0 15px 35px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Badge Top Hanging Punch Slot (工牌打孔槽) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-3.5 rounded-full bg-background border-2 border-border shadow-inner z-20" />

          {/* Dynamic Specular Holographic Reflection Highlight */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-30"
            style={{
              background: `radial-gradient(circle at ${specular.x}% ${specular.y}%, rgba(255, 255, 255, ${specular.opacity}) 0%, transparent 60%)`,
            }}
          />

          {/* NFC Antenna Micro-Trace Background Pattern (NFC 极客点阵纹理) */}
          <div 
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-10"
            style={{
              backgroundImage: `radial-gradient(#10b981 1.2px, transparent 1.2px)`,
              backgroundSize: '16px 16px',
            }}
          />

          {/* Card Header: Chip & NFC Indicator */}
          <div className="flex items-center justify-between pb-4 border-b border-border/70 relative z-10">
            {/* Gold Smart Chip Contacts (镀金芯片金手指) */}
            <div className="relative w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm p-1 flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] opacity-60" />
              <div className="flex justify-between h-2.5 border-b border-amber-600/60">
                <div className="w-2.5 h-full border-r border-amber-600/60" />
                <div className="w-2.5 h-full border-l border-amber-600/60" />
              </div>
              <div className="flex justify-between h-2.5">
                <div className="w-2.5 h-full border-r border-amber-600/60" />
                <div className="w-2.5 h-full border-l border-amber-600/60" />
              </div>
            </div>

            {/* Tech Badges & NFC Radio */}
            <div className="text-right font-mono space-y-0.5">
              <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>NFC :: RFID ENCRYPTED</span>
              </div>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                SER: HX-2026-ARCHITECT // LV.99
              </p>
            </div>
          </div>

          {/* Card Body: Avatar, Name, Title & Badges */}
          <div className="pt-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
            {/* Avatar with Halo Ring */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 opacity-70 blur-sm group-hover:opacity-100 transition-opacity" />
              <SafeImage
                src={avatar || DEFAULT_AVATAR}
                alt="Hayden Xue"
                aspectRatio="1/1"
                containerClassName="relative w-24 h-24 sm:w-26 sm:h-26 rounded-2xl overflow-hidden border-2 border-background shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background" />
              </span>
            </div>

            <div className="space-y-2 flex-1">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-2">
                  <span>Hayden Xue</span>
                  <Award className="w-5 h-5 text-emerald-500" />
                </h2>
                <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Full-Stack Architect & AI System Explorer
                </p>
              </div>

              {/* Verified Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  GitHub Verified Architect
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <Sparkles className="w-3 h-3" />
                  Digital Garden Maintainer
                </span>
              </div>
            </div>
          </div>

          {/* Motto Quote Section */}
          <div className="mt-5 pt-4 border-t border-border/70 relative z-10 text-center sm:text-left">
            <p className="font-serif italic text-sm text-foreground/90 leading-relaxed">
              “{slogan || (locale === 'en' ? 'From the East, toward the unknown.' : '基于东方，探索未知。')}”
            </p>
          </div>

          {/* Card Footer: Barcode & Security Hologram */}
          <div className="mt-4 pt-3 border-t border-dashed border-border/60 flex items-center justify-between text-muted-foreground font-mono text-[10px] relative z-10">
            <div className="flex items-center gap-2">
              {/* Simulated barcode */}
              <div className="flex items-center gap-[2px] h-4">
                <div className="w-[1.5px] h-full bg-foreground/60" />
                <div className="w-[3px] h-full bg-foreground/80" />
                <div className="w-[1px] h-full bg-foreground/40" />
                <div className="w-[2px] h-full bg-foreground/70" />
                <div className="w-[4px] h-full bg-foreground/90" />
                <div className="w-[1.5px] h-full bg-foreground/50" />
                <div className="w-[2.5px] h-full bg-foreground/80" />
              </div>
              <span className="tracking-widest">HX-2026-SYS</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400 tracking-wider">
                {formatStardate(new Date())}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                3D PERSPECTIVE ON
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] font-mono text-muted-foreground">
        {locale === 'zh' ? '✦ 鼠标悬浮倾斜体验轻量 CSS 3D 视差与微光反射' : '✦ Hover mouse to experience 3D perspective and dynamic specular sheen'}
      </p>
    </div>
  );
}
