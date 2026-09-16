'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { SeamlessLoopVideo } from './SeamlessLoopVideo';
import { Cpu, Eye, Sparkles, Binary, Compass, Layers } from 'lucide-react';

export function HaydenLiquidPhilosophy() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={containerRef}
      className="relative w-full py-20 sm:py-28 px-4 sm:px-8 lg:px-12 bg-black text-white overflow-hidden"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.8 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-400 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>03 // Innovation & Vision</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif text-white">
            Dual Pillar Philosophy
          </h2>
          <p className="text-xs font-mono text-neutral-400">
            WHERE SYSTEM RIGOR MEETS SPATIAL POETICS
          </p>
        </motion.div>

        {/* 左右分栏：4:3 视频容器 + 双栏文本网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* 4:3 几何循环视频 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/[0.08] bg-neutral-950 shadow-xl"
          >
            <SeamlessLoopVideo
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 liquid-glass rounded-xl p-3 text-[11px] font-mono text-neutral-300">
              ABSTRACT DYNAMICS // 4:3 RATIO
            </div>
          </motion.div>

          {/* 右侧双栏卡片网格 */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Pillar I */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 hover:bg-white/[0.03] transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="p-2.5 rounded-xl bg-white/[0.05] text-white">
                    <Binary className="w-4 h-4 text-neutral-200" />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">PILLAR 01</span>
                </div>
                <h3 className="text-xl font-serif text-white">
                  System Rigor · 确定性架构
                </h3>
                <p className="text-sm text-neutral-300 font-sans font-light leading-relaxed">
                  系统工程的核心在于对抗熵增。基于 Spring Boot 虚拟线程、响应式流与分布式一致性算法，构建在高负载与网络分区下依然坚如磐石的基础设施。
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-neutral-400">
                JAVA 21 · KAFKA · DOCKER · MINIO
              </div>
            </motion.div>

            {/* Pillar II */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 hover:bg-white/[0.03] transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="p-2.5 rounded-xl bg-white/[0.05] text-white">
                    <Compass className="w-4 h-4 text-neutral-200" />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">PILLAR 02</span>
                </div>
                <h3 className="text-xl font-serif text-white">
                  Spatial Poetry · 空间诗性
                </h3>
                <p className="text-sm text-neutral-300 font-sans font-light leading-relaxed">
                  软件不仅是冷峻的逻辑，亦是可感知的精神容器。借鉴苹果液体玻璃与 35mm 胶片的光影质感，让每次指尖触碰与滚动都蕴含流体般的生命张力。
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-neutral-400">
                VISIONOS LENS · THREE.JS · FRAMER MOTION
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
