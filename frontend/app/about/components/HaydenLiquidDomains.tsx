'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { SeamlessLoopVideo } from './SeamlessLoopVideo';
import { Sparkles, ArrowUpRight, Server, Eye, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function HaydenLiquidDomains() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={containerRef}
      className="relative w-full py-20 sm:py-28 px-4 sm:px-8 lg:px-12 bg-black text-white overflow-hidden"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {/* 小标题 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-400 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
              <span>04 // Core Disciplines</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif text-white">
              What We Architect
            </h2>
          </div>
          <p className="text-xs font-mono text-neutral-400 max-w-sm sm:text-right">
            COMPREHENSIVE FULL-STACK MASTERY & SPATIAL CRAFTSMANSHIP
          </p>
        </motion.div>

        {/* 2-Column Grid of Liquid Glass Cards with Videos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Architecture & Distributed Systems */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:bg-white/[0.02] transition-all group"
          >
            <div className="space-y-6">
              {/* 嵌入视频容器 */}
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-white/[0.08] bg-neutral-950">
                <SeamlessLoopVideo
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
                  className="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-3 left-3 liquid-glass px-3 py-1 rounded-full text-[10px] font-mono text-neutral-300">
                  DISTRIBUTED & CLOUD
                </div>
              </div>

              {/* 卡片正文 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <Server className="w-3.5 h-3.5 text-neutral-300" />
                  <span>DOMAIN 01 // ARCHITECTURE</span>
                </div>
                <h3 className="text-2xl font-serif text-white group-hover:text-neutral-200 transition-colors">
                  High-Throughput & Cloud-Native Systems
                </h3>
                <p className="text-sm text-neutral-300 font-sans font-light leading-relaxed">
                  深入 Java 21 虚拟线程体系、Spring 生态与分布式存储（MinIO / S3）。构建具备千万级吞吐、极低长尾延迟与高弹性灾备能力的高韧性云原生架构。
                </p>
              </div>

              {/* 特性清单 */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Virtual Threading</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>S3 / MinIO Cluster</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Reactive Streams</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>100% Zero Fake Data</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400">STATUS: PROD CERTIFIED</span>
              <Link
                href="/projects"
                className="text-xs font-mono text-white inline-flex items-center gap-1 hover:underline"
              >
                <span>INSPECT PROJECTS</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Spatial UI & Creative Engineering */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:bg-white/[0.02] transition-all group"
          >
            <div className="space-y-6">
              {/* 嵌入视频容器 */}
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-white/[0.08] bg-neutral-950">
                <SeamlessLoopVideo
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4"
                  className="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-3 left-3 liquid-glass px-3 py-1 rounded-full text-[10px] font-mono text-neutral-300">
                  SPATIAL & CREATIVE
                </div>
              </div>

              {/* 卡片正文 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <Eye className="w-3.5 h-3.5 text-neutral-300" />
                  <span>DOMAIN 02 // INTERACTION</span>
                </div>
                <h3 className="text-2xl font-serif text-white group-hover:text-neutral-200 transition-colors">
                  Liquid Glass UI & Spatial Graphics
                </h3>
                <p className="text-sm text-neutral-300 font-sans font-light leading-relaxed">
                  借鉴 VisionOS 折射透镜、Three.js 3D 渲染与 Framer Motion 视差流体。将数字界面化作温润可触的三维舞台，消除人与屏幕之间的生硬隔阂。
                </p>
              </div>

              {/* 特性清单 */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Liquid Glass Shader</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Three.js Spatial Web</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>rAF Crossfade Video</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Instrument Serif Motion</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400">STATUS: ACTIVE EXPERIMENT</span>
              <Link
                href="/explore"
                className="text-xs font-mono text-white inline-flex items-center gap-1 hover:underline"
              >
                <span>OPEN EXPLORER</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
