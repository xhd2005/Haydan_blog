'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Timeline } from '@/lib/types';
import { Terminal, Shield, Sparkles, Code2, Cpu, Camera, Layers, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface HaydenLiquidAboutProps {
  timelines?: Timeline[];
}

const EPOCHS = [
  {
    tag: '01 / GENESIS',
    period: '2018 — 2020',
    title: '代码萌芽与极客探索',
    desc: '写下第一行系统级代码，钻研算法底层原理、操作系统与网络协议。在开源世界中感受协同创造的纯粹快乐。',
    icon: Code2,
  },
  {
    tag: '02 / ARCHITECTURE',
    period: '2021 — 2023',
    title: '企业级分布式与高并发',
    desc: '深耕微服务治理、Spring 生态与云原生架构。以百炼成钢的工程严谨性支撑千万级并发与高韧性高可用系统。',
    icon: Cpu,
  },
  {
    tag: '03 / WILDERNESS',
    period: '2023 — 2025',
    title: '高山旷野与光影纪实',
    desc: '走向川西雪山与辽阔旷野，用 35mm 胶片捕捉瞬息光影。在自然洪荒中体悟微小与永恒，为理性代码注入空间灵性。',
    icon: Camera,
  },
  {
    tag: '04 / SANCTUARY',
    period: '2026 — NOW',
    title: '全栈独立造物与数字心智',
    desc: '构建 100% 真实数据驱动、液体玻璃三维美学与 AI 数字心智共存的个人数字避难所，对抗速朽与噪音。',
    icon: Layers,
  },
];

const METRICS = [
  { value: '8+', label: 'YEARS IN ARCHITECTURE', note: '系统工程与底层深耕' },
  { value: '100%', label: 'REAL DATA DRIVEN', note: '杜绝伪造，全站可视化管理' },
  { value: '15+', label: 'EXPLORED PROVINCES', note: '真实高山旷野足迹' },
  { value: '∞', label: 'CURIOSITY & CREATION', note: '独立造物与长青演进' },
];

export function HaydenLiquidAbout({ timelines }: HaydenLiquidAboutProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={containerRef}
      id="about-dossier"
      className="relative w-full py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-black text-white overflow-hidden"
    >
      {/* 极简网格环境与背景微光 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03)_0%,transparent_50%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-20 relative z-10">
        {/* 顶部声明与巨型衬线引用 */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-400 uppercase"
          >
            <Terminal className="w-3.5 h-3.5 text-neutral-400" />
            <span>01 // The Architect Ethos</span>
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-5xl md:text-6xl font-serif italic text-neutral-200 leading-[1.12] max-w-4xl font-normal"
          >
            “We build resilient systems not merely for function, but as an enduring sanctuary against the ephemeral.”
          </motion.blockquote>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg text-neutral-300 max-w-3xl leading-relaxed font-sans font-light"
          >
            我是 <strong className="text-white font-medium">Hayden Xue</strong>。一名穿梭于高并发分布式系统、空间交互美学与旷野光影的全栈架构师。在代码工程中追求确定性与严谨，在数字花园中栽种知识与心智，在荒野行旅中丈量大地与生命的本真。
          </motion.p>
        </div>

        {/* 四大关键指标 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {METRICS.map((item, idx) => (
            <div
              key={idx}
              className="liquid-glass rounded-2xl p-5 sm:p-6 space-y-2 hover:bg-white/[0.03] transition-all"
            >
              <div className="text-3xl sm:text-4xl font-serif text-white">{item.value}</div>
              <div className="text-[11px] font-mono tracking-wider text-neutral-400">{item.label}</div>
              <div className="text-xs text-neutral-400 font-sans">{item.note}</div>
            </div>
          ))}
        </motion.div>

        {/* 成长时空纪元 (4 Epochs) */}
        <div className="space-y-8 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif text-white">时空纪元 // Growth Epochs</h2>
              <p className="text-xs font-mono text-neutral-400 mt-1">
                A CHRONOLOGICAL EVOLUTION OF CRAFT & CONSCIOUSNESS
              </p>
            </div>
            <Link
              href="/journey"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
            >
              <span>EXPLORE ALL JOURNEYS</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {EPOCHS.map((epoch, idx) => {
              const Icon = epoch.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, delay: 0.2 + idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 hover:bg-white/[0.03] transition-all group"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white/[0.05] text-white">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono tracking-wider text-neutral-400">
                        {epoch.tag}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-neutral-400">{epoch.period}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-medium text-white group-hover:text-neutral-200 transition-colors">
                    {epoch.title}
                  </h3>

                  <p className="text-sm text-neutral-300 font-sans font-light leading-relaxed">
                    {epoch.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
