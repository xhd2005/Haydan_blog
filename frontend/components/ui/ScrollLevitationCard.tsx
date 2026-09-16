'use client';

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface ScrollLevitationCardProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
  glowColor?: string;
}

/**
 * 3D 滚轮错峰飘浮悬空卡片 (Scroll-driven Staggered Levitation Card)
 * 
 * 参考 grail-app.com 顶级交互美学：
 * 1. 随滚轮滚动产生 3D 空间微俯仰 (rotateX) 与缩放景深 (scale)；
 * 2. 依据索引计算错峰位移 (Parallax Stagger Y)，产生在失重流体中漂浮的灵动层次；
 * 3. 鼠标交互 3D 视差 Tilt 倾斜与动态环境光斑追随。
 */
export function ScrollLevitationCard({
  children,
  index = 0,
  className = '',
  glowColor = 'rgba(16, 185, 129, 0.2)',
}: ScrollLevitationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // 1. 滚轮驱动 3D 视差物理计算
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  });

  // 根据列索引错峰计算 Y 轴速度差
  const col = index % 3;
  const yShift = col === 1 ? [-24, 28] : col === 2 ? [16, -20] : [-12, 14];

  const y = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : yShift);
  const rotateX = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], shouldReduceMotion ? [0, 0, 0, 0] : [5, 0, 0, -3]);
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], shouldReduceMotion ? [1, 1, 1, 1] : [0.96, 1, 1, 0.97]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.85, 1, 1, 0.9]);

  // 2. 鼠标悬停 3D 视差 Tilt 与光斑跟随
  const [mouseTilt, setMouseTilt] = useState({ rx: 0, ry: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || shouldReduceMotion) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // 计算鼠标微倾斜角度 (±7deg)
    const rx = -((y / rect.height) - 0.5) * 14;
    const ry = ((x / rect.width) - 0.5) * 14;
    setMouseTilt({ rx, ry });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMouseTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative h-full ${className}`}
      style={{ perspective: 1200 }}
    >
      {/* 1. 滚轮驱动视差与失重浮动层 */}
      <motion.div
        style={{
          y,
          rotateX,
          scale,
          opacity,
          transformStyle: 'preserve-3d',
        }}
        className="relative h-full w-full will-change-transform"
      >
        {/* 2. 鼠标跟随 3D 视差 Tilt 交互层 */}
        <motion.div
          animate={{
            rotateX: isHovered ? mouseTilt.rx : 0,
            rotateY: isHovered ? mouseTilt.ry : 0,
            z: isHovered ? 16 : 0,
          }}
          transition={{
            rotateX: { duration: 0.12, ease: 'easeOut' },
            rotateY: { duration: 0.12, ease: 'easeOut' },
            z: { duration: 0.3, ease: 'easeOut' },
          }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative h-full w-full rounded-3xl"
        >
          {/* 动态失重悬空环境光晕 (Ambient Levitation Halo) */}
          <div
            className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
            style={{
              background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 70%)`,
            }}
            aria-hidden="true"
          />

          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
