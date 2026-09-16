'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * 全站统一动效原语 (AGENTS.md 铁律 4: 微动效与微交互)
 *
 * 规范：
 * - 统一 whileInView 触发 + viewport={{ once: true }}，进入视口后只播放一次，避免反复重排；
 * - 自动尊重 prefers-reduced-motion（系统减弱动效时退化为纯淡入）；
 * - 统一缓动曲线 [0.16, 1, 0.3, 1]（与 Hero 字符揭示保持一致的电影感）。
 */

interface RevealStaggerProps {
  children: React.ReactNode;
  className?: string;
  /** 首个子项入场延迟 (秒) */
  delay?: number;
  /** 子项间隔 (秒) */
  stagger?: number;
}

/** 级联显现调度容器：子项需使用 RevealItem 以获得 stagger 节奏 */
export function RevealStagger({
  children,
  className = '',
  delay = 0,
  stagger = 0.09,
}: RevealStaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface RevealItemProps {
  children: React.ReactNode;
  className?: string;
  /** 垂直升起位移 (px) */
  y?: number;
}

/** 单卡升起淡入单元（配合 RevealStagger 使用） */
export function RevealItem({ children, className = '', y = 26 }: RevealItemProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** 独立区块标题揭示（无需外层 Stagger，可直接用于 section 标题） */
export function Reveal({
  children,
  className = '',
  y = 18,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
