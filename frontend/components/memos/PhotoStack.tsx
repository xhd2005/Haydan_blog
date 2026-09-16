'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Layers, Maximize2 } from 'lucide-react';

interface PhotoStackProps {
  images: string[];
  alt?: string;
  onOpen: (subIdx?: number) => void;
  priority?: boolean;
}

export function PhotoStack({ images, alt = 'Memo photos', onOpen, priority = false }: PhotoStackProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!images || images.length === 0) return null;

  const count = images.length;
  const frontImg = images[0];
  const secondImg = images[1] || frontImg;
  const thirdImg = images[2] || secondImg;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(0)}
      className="relative w-full aspect-[4/5] sm:aspect-[1/1] max-w-[420px] mx-auto flex items-center justify-center p-3 sm:p-5 select-none cursor-pointer group/stack"
    >
      {/* ======================================================== */}
      {/* 底层相纸 (Back Layer) - 向右微偏，悬浮时更大幅度散开     */}
      {/* ======================================================== */}
      {count >= 3 && (
        <motion.div
          animate={{
            rotate: isHovered ? 6.5 : 3.5,
            x: isHovered ? 14 : 6,
            y: isHovered ? 2 : 0,
            scale: 0.92,
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="absolute inset-x-8 inset-y-4 rounded-2xl overflow-hidden bg-neutral-900/60 border border-white/15 dark:border-white/10 shadow-lg shadow-black/20"
        >
          <Image
            src={thirdImg}
            alt={`${alt} 3`}
            fill
            className="object-cover opacity-75 blur-[0.4px] brightness-90 group-hover/stack:opacity-90 transition-opacity"
            sizes="(max-width: 768px) 60vw, 30vw"
          />
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* 中层相纸 (Middle Layer) - 向左微偏，悬浮时更大幅度散开   */}
      {/* ======================================================== */}
      {count >= 2 && (
        <motion.div
          animate={{
            rotate: isHovered ? -6.5 : -3.5,
            x: isHovered ? -14 : -6,
            y: isHovered ? -1 : 0,
            scale: 0.96,
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="absolute inset-x-6 inset-y-2 rounded-2xl overflow-hidden bg-neutral-900/80 border border-white/20 dark:border-white/10 shadow-xl shadow-black/25"
        >
          <Image
            src={secondImg}
            alt={`${alt} 2`}
            fill
            className="object-cover opacity-85 brightness-95 group-hover/stack:opacity-95 transition-opacity"
            sizes="(max-width: 768px) 70vw, 35vw"
          />
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* 顶层主相纸 (Front Layer) - 高清居中，带微抬升与多级阴影  */}
      {/* ======================================================== */}
      <motion.div
        animate={{
          scale: isHovered ? 1.02 : 1,
          y: isHovered ? -4 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-950 border border-white/30 dark:border-white/15 shadow-2xl shadow-black/30 z-10"
      >
        <Image
          src={frontImg}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 group-hover/stack:scale-104"
          sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 30vw"
          priority={priority}
        />

        {/* 顶部胶卷光圈高光 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-0 group-hover/stack:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
          <div className="flex justify-end">
            <span className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 shadow-md">
              <Maximize2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] font-mono text-white/90">点击展开全景暗房画廊</p>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 「Expand N」毛玻璃交互胶囊 (参考原型样式完全复刻)        */}
      {/* ======================================================== */}
      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(0);
        }}
        animate={{
          scale: isHovered ? 1.06 : 1,
          x: isHovered ? 4 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute right-2 sm:right-0 bottom-4 sm:bottom-6 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900/85 dark:bg-black/85 backdrop-blur-xl border border-white/20 text-white/95 text-xs font-mono font-medium shadow-2xl hover:bg-black hover:border-white/40 transition-all cursor-pointer select-none"
        title={`展开浏览全部 ${count} 张高保真照片`}
      >
        <Layers className="w-3.5 h-3.5 text-amber-400" />
        <span>Expand {count}</span>
      </motion.button>
    </div>
  );
}
