'use client';

import React, { useState, useRef } from 'react';
import { SafeImage } from '@/components/SafeImage';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { formatStardate } from '@/lib/stardate';
import { Sparkles, ShieldCheck, Radio, Award, Compass, Cpu, ExternalLink, Github, Terminal } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

interface Props {
  avatar?: string;
  slogan?: string;
}

export function ParallaxIdentityBentoCard({ avatar, slogan }: Props) {
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

    // Rotation angles (-10deg to +10deg for smooth Bento feel)
    const rx = (0.5 - y) * 16;
    const ry = (x - 0.5) * 16;

    setRotateX(rx);
    setRotateY(ry);
    setSpecular({
      x: x * 100,
      y: y * 100,
      opacity: 0.28,
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
    <div 
      className="w-full h-full"
      style={{ perspective: '1200px' }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative h-full flex flex-col justify-between rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm hover:shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out select-none group overflow-hidden"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.015 : 1}, ${isHovered ? 1.015 : 1}, 1)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Dynamic Specular Holographic Reflection Highlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-20"
          style={{
            background: `radial-gradient(circle at ${specular.x}% ${specular.y}%, rgba(255, 255, 255, ${specular.opacity}) 0%, transparent 60%)`,
          }}
        />

        {/* Ambient Subtle Glow on Hover */}
        <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 z-0" />

        {/* NFC Micro-Trace Background Pattern */}
        <div 
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-5 dark:opacity-10 z-0"
          style={{
            backgroundImage: `radial-gradient(#10b981 1.2px, transparent 1.2px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Card Header: Gold Smart Chip & NFC Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-border/70 relative z-10">
          {/* Gold Smart Chip Contacts */}
          <div className="relative w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 border border-amber-600/70 shadow-sm p-1 flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] opacity-60" />
            <div className="flex justify-between h-2 border-b border-amber-600/60">
              <div className="w-2 h-full border-r border-amber-600/60" />
              <div className="w-2 h-full border-l border-amber-600/60" />
            </div>
            <div className="flex justify-between h-2">
              <div className="w-2 h-full border-r border-amber-600/60" />
              <div className="w-2 h-full border-l border-amber-600/60" />
            </div>
          </div>

          {/* NFC Radio & Encrypted ID */}
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

        {/* Card Body: Avatar, Name & Professional Identity */}
        <div className="pt-5 flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
          {/* Avatar with Halo Ring */}
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 opacity-60 blur-sm group-hover:opacity-90 transition-opacity" />
            <SafeImage
              src={avatar || DEFAULT_AVATAR}
              alt="Hayden Xue"
              aspectRatio="1/1"
              containerClassName="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-background shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-background" />
            </span>
          </div>

          <div className="space-y-2 flex-1">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-2">
                <span>Hayden Xue</span>
                <Award className="w-5 h-5 text-emerald-500" />
              </h2>
              <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {locale === 'zh' ? '全栈系统架构师 · 数字花园建造者' : 'Full-Stack Architect & Digital Garden Builder'}
              </p>
            </div>

            {/* Verified Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Verified Architect
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-3 h-3" />
                Digital Garden
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

        {/* Card Footer: Barcode & Stardate Hologram */}
        <div className="mt-4 pt-3 border-t border-dashed border-border/60 flex items-center justify-between text-muted-foreground font-mono text-[10px] relative z-10">
          <div className="flex items-center gap-2">
            {/* Simulated barcode */}
            <div className="flex items-center gap-[2px] h-3.5">
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
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-600 dark:text-emerald-400 tracking-wider">
              {formatStardate(new Date())}
            </span>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              3D TILT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
