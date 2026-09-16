'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Code2, Cpu, Camera, Layers, Quote, Sparkles } from 'lucide-react';

interface Epoch {
  period: string;
  tag: string;
  title: string;
  enTitle: string;
  desc: string;
  quote: string;
  icon: any;
  color: string;
  bg: string;
  highlights: string[];
}

const EPOCHS: Epoch[] = [
  {
    period: '2018 — 2020',
    tag: 'EPOCH 01',
    title: '启程 · 代码萌芽与极客探索',
    enTitle: 'GENESIS // THE FIRST BYTE',
    desc: '写下第一行系统级代码，钻研算法底层原理、操作系统内核与开源世界。体会协同创造带来的纯粹快乐。',
    quote: '所有的远方与系统架构，都始于一次纯粹好奇心驱动的 Hello World。',
    icon: Code2,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-400/10',
    highlights: ['Linux 内核探索与底层算法沉淀', '开源社区协同与极客工具链萌芽'],
  },
  {
    period: '2021 — 2023',
    tag: 'EPOCH 02',
    title: '架构深耕 · 企业级分布式与高并发',
    enTitle: 'SYSTEM RIGOR // DISTRIBUTED SCALES',
    desc: '深耕微服务治理、Spring 生态与云原生架构，面对千万级高并发流量，以严苛的工程美学打磨系统韧性。',
    quote: '优雅的架构绝非空想设计，而是在复杂性泥潭中百炼成钢的工程结晶。',
    icon: Cpu,
    color: 'text-indigo-500 dark:text-indigo-400',
    bg: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    highlights: ['Java 虚拟线程高并发与分布式一致性', '响应式系统与微服务全链路高可用保障'],
  },
  {
    period: '2023 — 2025',
    tag: 'EPOCH 03',
    title: '旷野与世界 · 高山徒步与摄影漫游',
    enTitle: 'WILDERNESS // 35MM FRAMES',
    desc: '走出屏幕与机房，走向川西雪山与辽阔旷野。用 35mm 胶片机捕捉光影瞬息，在自然洪荒中体悟微小与永恒。',
    quote: '站在海拔四千米的风口，方知代码之外，世界浩瀚无穷。',
    icon: Camera,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-400/10',
    highlights: ['横跨川西、高原与东亚腹地的真实足迹', '中画幅胶片质感与自然光影记录'],
  },
  {
    period: '2026 — NOW',
    tag: 'EPOCH 04',
    title: '当下造物 · 数字避难所与心智花园',
    enTitle: 'SANCTUARY // DIGITAL GARDEN',
    desc: '全栈独立造物：构建 100% 真实数据驱动、双主题液态玻璃美学与 AI 数字心智共存的个人数字花园。',
    quote: '建造属于自己的心智避难所，对抗瞬息万变与信息的速朽。',
    icon: Layers,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    highlights: ['全站液态玻璃微动效与三维深度景深', '真实数据驱动与 CMS 独立控制台'],
  },
];

function EpochCard({ epoch, idx }: { epoch: Epoch; idx: number }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const Icon = epoch.icon;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setRotateX((0.5 - y) * 8);
    setRotateY((x - 0.5) * 8);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
      className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-5 flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* 卡片顶部标签 */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${epoch.bg} ${epoch.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase block">
                {epoch.tag}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground font-sans">
                {epoch.title}
              </h3>
            </div>
          </div>
          <span className="liquid-glass-pill px-3 py-1 rounded-full text-xs font-mono text-muted-foreground self-start">
            {epoch.period}
          </span>
        </div>

        {/* 阐述 */}
        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-normal">
          {epoch.desc}
        </p>

        {/* 亮点清单 */}
        <div className="space-y-1.5 pt-1">
          {epoch.highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 名言引用 */}
      <div className="flex items-start gap-2 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-xs sm:text-sm text-muted-foreground font-serif italic">
        <Quote className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 shrink-0 mt-0.5" />
        <span>“{epoch.quote}”</span>
      </div>
    </div>
  );
}

export function AboutFlagshipEpochs() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-60px' });

  return (
    <section ref={containerRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Growth Epochs // 时空纪元</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
          在工程沉淀、旷野行旅与独立造物中演进
        </h2>
        <p className="text-xs sm:text-sm font-mono text-muted-foreground">
          FOUR CORNERSTONE PERIODS OF ARCHITECTURE & CREATION
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {EPOCHS.map((epoch, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <EpochCard epoch={epoch} idx={idx} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
