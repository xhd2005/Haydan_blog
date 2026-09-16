'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { SeamlessLoopVideo } from './SeamlessLoopVideo';
import { Sparkles, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

export function HaydenLiquidFeaturedVideo() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });

  return (
    <section
      id="featured-video"
      ref={containerRef}
      className="relative w-full py-16 sm:py-24 px-4 sm:px-8 lg:px-12 bg-black text-white overflow-hidden"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 小标题栏 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-400 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>02 // The Cinematic Experience</span>
          </div>
          <div className="text-xs font-mono text-neutral-400 hidden sm:block">
            ASPECT RATIO 16:9 // 4K CINEMATIC
          </div>
        </motion.div>

        {/* 16:9 比例视频剧场容器 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full aspect-[16/9] rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-white/[0.08] shadow-2xl bg-neutral-950 group"
        >
          {/* 无缝 500ms rAF 淡入淡出 Crossfade 视频 */}
          <SeamlessLoopVideo
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4"
            className="w-full h-full"
          />

          {/* 电影级微光暗角 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* 底部悬浮跨度 .liquid-glass 信息卡片 */}
          <div className="absolute inset-x-4 sm:inset-x-8 bottom-4 sm:bottom-8 z-10">
            <div className="liquid-glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Engineering Philosophy</span>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif text-white">
                  Crafting resilient digital spaces.
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 font-sans font-light leading-relaxed">
                  在复杂业务泥潭中提炼高内聚解耦逻辑，以微秒级性能基准衡量工程边界，用艺术级微动效重塑人机交互的温度。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/blog"
                  className="px-5 py-2.5 rounded-full bg-white text-neutral-950 hover:bg-neutral-200 transition-colors text-xs font-mono font-medium inline-flex items-center gap-2"
                >
                  <span>EXPLORE WRITINGS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/projects"
                  className="liquid-glass px-5 py-2.5 rounded-full text-white hover:text-neutral-200 transition-colors text-xs font-mono inline-flex items-center gap-2"
                >
                  <span>VIEW PROJECTS</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
