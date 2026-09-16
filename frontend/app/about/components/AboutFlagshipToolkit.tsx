'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Terminal, Server, Layout, Eye, Cloud, CheckCircle2 } from 'lucide-react';

interface ToolItem {
  name: string;
  category: string;
  desc: string;
  icon: any;
  techs: string[];
}

const TOOLKIT_CATEGORIES: ToolItem[] = [
  {
    name: 'Backend Architecture · 分布式高并发',
    category: 'BACKEND ARCHITECTURE',
    desc: '基于 Java 21 虚拟线程体系与 Spring Boot 3 构建高吞吐、微秒级响应与高弹性微服务后端。',
    icon: Server,
    techs: ['Java 21 Virtual Threads', 'Spring Boot 3', 'Kafka Streams', 'PostgreSQL / Redis'],
  },
  {
    name: 'Fluid Frontend · 现代流体前端',
    category: 'MODERN FRONTEND',
    desc: '基于 Next.js 14 App Router 服务端流式渲染，结合 Framer Motion 视差流体微交互。',
    icon: Layout,
    techs: ['Next.js 14 SSR', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    name: 'Spatial Graphics · 3D 与地理空间',
    category: 'CREATIVE GRAPHICS',
    desc: '融合 Three.js 3D 空间粒子、苹果液态玻璃物理折射与 MapLibre GL 遥感卫星地球剧场。',
    icon: Eye,
    techs: ['Three.js WebGL', 'MapLibre GL GIS', 'Liquid Glass Shader', 'VisionOS Lens'],
  },
  {
    name: 'Cloud Storage · 云原生对象存储',
    category: 'CLOUD-NATIVE INFRA',
    desc: '解耦本地单一依赖，深度集成兼容 S3 协议的 MinIO 分布式对象存储与自动化容器编排。',
    icon: Cloud,
    techs: ['MinIO / AWS S3', 'Docker Container', 'Linux Kernel Optimization', 'CI/CD Flow'],
  },
];

export function AboutFlagshipToolkit() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-60px' });

  return (
    <section ref={containerRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
          <Terminal className="w-3.5 h-3.5" />
          <span>The Toolkit // 造物利器</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
          系统工程架构与全栈造物武器库
        </h2>
        <p className="text-xs sm:text-sm font-mono text-muted-foreground">
          PRODUCTION-TESTED TECHNOLOGIES & CREATIVE INSTRUMENTS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {TOOLKIT_CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="liquid-glass-card rounded-3xl p-6 sm:p-7 space-y-5 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono tracking-wider text-muted-foreground">
                    {cat.category}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-foreground font-sans group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {cat.name}
                </h3>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {cat.desc}
                </p>
              </div>

              {/* 核心技术标签 */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                {cat.techs.map((tech, i) => (
                  <span
                    key={i}
                    className="liquid-glass-pill px-3 py-1 rounded-full text-[11px] font-mono text-slate-700 dark:text-neutral-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
