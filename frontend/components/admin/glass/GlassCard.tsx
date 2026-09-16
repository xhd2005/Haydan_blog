'use client';

import React from 'react';
import clsx from 'clsx';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'surface' | 'interactive' | 'active';
  glow?: 'none' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({
  variant = 'default',
  glow = 'none',
  children,
  className,
  ...motionProps
}: GlassCardProps) {
  const glowClasses = {
    none: '',
    blue: 'hover:shadow-glow-blue border-blue-500/30 dark:border-blue-400/30',
    emerald: 'hover:shadow-glow-emerald border-emerald-500/30 dark:border-emerald-400/30',
    amber: 'hover:shadow-glow-amber border-amber-500/30 dark:border-amber-400/30',
    rose: 'hover:shadow-glow-rose border-rose-500/30 dark:border-rose-400/30',
    purple: 'hover:shadow-[0_0_24px_-2px_rgba(192,132,252,0.35)] border-purple-500/30 dark:border-purple-400/30',
  }[glow];

  const variantClasses = {
    default: 'vision-card rounded-2xl p-5',
    surface: 'vision-dock rounded-2xl p-5',
    interactive: 'vision-card rounded-2xl p-5 hover:translate-y-[-2px] cursor-pointer',
    active: 'vision-card rounded-2xl p-5 ring-2 ring-indigo-500/40 dark:ring-indigo-400/40',
  }[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        variantClasses,
        glowClasses,
        'relative overflow-hidden',
        className
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
