'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { AppleFluidFlipCard } from './AppleFluidFlipCard';
import { Journey } from '@/lib/types';
import { 
  Cpu, 
  Layers, 
  Camera, 
  MapPin, 
  Activity, 
  Clock, 
  Sparkles, 
  ArrowUpRight, 
  Code2, 
  Terminal, 
  ShieldCheck, 
  Compass,
  Zap,
  Globe
} from 'lucide-react';

interface AppleMindBentoGridProps {
  journeys?: Journey[];
}

export function AppleMindBentoGrid({ journeys = [] }: AppleMindBentoGridProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('zh-CN', {
          hour12: false,
          timeZone: 'Asia/Shanghai',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 读取真实游记记录（若有真实数据则采用第一篇，否则优雅兜底川西雪山）
  const fallbackJourney = {
    id: 0,
    title: '川西高海拔雪线漫游与贡嘎群峰',
    city: '甘孜',
    country: '中国',
    cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    slug: 'gongga-snow-mountain',
    description: '在零下 15 度的狂风中记录日照金山。徒步与代码同理：唯有专注脚下的步频与呼吸，才能翻越漫长的垭口。',
    createdAt: '',
    updatedAt: '',
  };
  const featuredJourney: Journey = journeys.length > 0 ? journeys[0] : fallbackJourney;

  return (
    <section className="relative py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 章节导引 */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <Layers className="w-3.5 h-3.5" />
            ACT 02 · CORE MIND BENTO
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-serif tracking-tight text-slate-900 dark:text-white">
            核心心智与多维造物展台
          </h2>
        </div>
        <p className="text-sm font-mono text-slate-500 dark:text-neutral-400 max-w-sm">
          轻触卡片右上角或正文即可 3D 翻转，探秘背后的架构手稿与旷野反思。
        </p>
      </div>

      {/* Bento Grid 2x2 响应式网格 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* ================= 1. 分布式架构蓝图卡片 (占 7 列) ================= */}
        <div className="md:col-span-7">
          <AppleFluidFlipCard
            badge="SYSTEM ARCHITECTURE"
            flipLabel="翻转架构手稿"
            frontContent={
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <Cpu className="w-8 h-8 p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20" />
                  <span className="text-xs font-mono tracking-widest">HIGH CONCURRENCY CORE</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
                    高并发分布式架构与第一性原理
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    深耕大规模分布式微服务、百万级 QPS 流量洪峰治理与高可用弹性系统。追求以最清澈的架构抽象应对高熵世界。
                  </p>
                </div>

                {/* 性能与量化指标胶囊 */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05]">
                    <div className="text-xs font-mono text-slate-400 dark:text-neutral-400">QPS PEAK</div>
                    <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">1,000,000+</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05]">
                    <div className="text-xs font-mono text-slate-400 dark:text-neutral-400">SLA RESILIENCE</div>
                    <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">99.999%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05]">
                    <div className="text-xs font-mono text-slate-400 dark:text-neutral-400">P99 LATENCY</div>
                    <div className="text-lg font-bold font-mono text-teal-600 dark:text-teal-400">&lt; 8.2ms</div>
                  </div>
                </div>
              </div>
            }
            backContent={
              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold border-b border-emerald-900/60 pb-2">
                  <Terminal className="w-4 h-4" />
                  <span>ARCHITECTURE BLUEPRINT SPEC (2026.REV)</span>
                </div>

                {/* ASCII 蓝图拓扑图 */}
                <pre className="p-3 rounded-xl bg-black/60 border border-emerald-500/20 text-[11px] leading-relaxed text-emerald-400/90 overflow-x-auto">
{`[Traffic Ingress] ---> [Zero-Trust Envoy Gateway]
                           |
       +-------------------+-------------------+
       | (Virtual Threads Dispatcher / Java 21) |
       +-------------------+-------------------+
                           |
            +--------------+--------------+
            |                             |
            v                             v
   [Raft Consensus Node]        [Disruptor Lock-Free Ring]
            |                             |
            +--------------+--------------+
                           |
               [Multi-Region Storage Tier]`}
                </pre>

                <div className="space-y-2 text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400">▪</span>
                    <span><strong>第一性原理</strong>：系统无状态化设计，计算与持久化严格隔离，背压与断路器协同保护。</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400">▪</span>
                    <span><strong>虚拟线程并发</strong>：利用 Java 21 Project Loom 彻底重构 I/O 密集型管线，内存开销骤降 80%。</span>
                  </div>
                </div>
              </div>
            }
          />
        </div>

        {/* ================= 2. 真实川西与东亚旷野胶片画卷 (占 5 列) ================= */}
        <div className="md:col-span-5">
          <AppleFluidFlipCard
            badge="WILDERNESS & FILM"
            flipLabel="翻转旷野手记"
            frontContent={
              <div className="space-y-4">
                {/* 胶片相框外罩 */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                  <Image
                    src={featuredJourney.cover || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop'}
                    alt={featuredJourney.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  {/* 胶片颗粒感遮罩与暗角 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* 胶片信息角标 */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] font-mono">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {featuredJourney.city ? `${featuredJourney.city} · ${featuredJourney.country}` : '川西 · 贡嘎雪线'}
                    </span>
                    <span className="opacity-75">35MM FILM</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-serif font-bold text-slate-900 dark:text-white line-clamp-1">
                    {featuredJourney.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-1 line-clamp-2 leading-relaxed">
                    {featuredJourney.description}
                  </p>
                </div>

                <div className="pt-1">
                  <Link
                    href={`/journey/${featuredJourney.slug}`}
                    className="no-flip inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>浏览真实游记详情</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            }
            backContent={
              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold border-b border-emerald-900/60 pb-2">
                  <Camera className="w-4 h-4" />
                  <span>WILDERNESS MANIFESTO · 旷野信条</span>
                </div>

                <p className="text-slate-300 leading-relaxed font-sans text-xs">
                  “在高海拔雪线的冷风中，所有多余的杂念都被剥离。唯有专注当下的呼吸与每一步落点。
                  这种心境与软件架构完全相通：最高级别的优雅，从来不是做加法，而是在无限的旷野中保持绝对的自律与克制。”
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20">
                    <div className="text-slate-400">HIGHEST PASS</div>
                    <div className="text-emerald-400 font-bold font-mono">4,768 m</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20">
                    <div className="text-slate-400">FILM CAMERA</div>
                    <div className="text-white font-bold font-mono">Leica M6 / TX-1</div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/journey"
                    className="no-flip inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                  >
                    <span>查看全部到访航迹 (3D 地球仪联动) →</span>
                  </Link>
                </div>
              </div>
            }
          />
        </div>

        {/* ================= 3. 实时心跳与系统时钟卡片 (占 5 列) ================= */}
        <div className="md:col-span-5">
          <div className="relative rounded-[26px] p-6 sm:p-8 h-full flex flex-col justify-between overflow-hidden
            bg-white/80 dark:bg-[#0f1117]/85 backdrop-blur-2xl
            border border-slate-200/80 dark:border-white/[0.08]
            shadow-lg">
            
            {/* 顶栏 */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
                <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                LIVING CHRONO · 实时心跳
              </span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">UTC+8</span>
            </div>

            {/* 中间大时钟 */}
            <div className="my-6 space-y-2">
              <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-tight text-slate-900 dark:text-white">
                {timeStr || '17:45:20'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                当前运行节拍 · 心跳速率 68 bpm · 系统运行稳健
              </p>
            </div>

            {/* 当前专注状态胶囊 */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 dark:text-neutral-400">CURRENT FOCUS</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">CRAFTING</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                全天候构建高性能分布式架构、Next.js 深度空间交互与个人开源数字花园。
              </p>
            </div>
          </div>
        </div>

        {/* ================= 4. 造物技术武器库矩阵 (占 7 列) ================= */}
        <div className="md:col-span-7">
          <div className="relative rounded-[26px] p-6 sm:p-8 h-full flex flex-col justify-between overflow-hidden
            bg-white/80 dark:bg-[#0f1117]/85 backdrop-blur-2xl
            border border-slate-200/80 dark:border-white/[0.08]
            shadow-lg">

            {/* 顶栏 */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40">
                <Zap className="w-3 h-3 text-teal-500" />
                CRAFT MATRIX · 造物武器库
              </span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">RADAR</span>
            </div>

            {/* 技术栈分类网格 */}
            <div className="my-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* 后端基座 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-2">
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block">
                  01 // BACKEND
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Java 21', 'Spring Boot 3', 'Go', 'Raft', 'Netty'].map((tech) => (
                    <span key={tech} className="px-2 py-0.5 rounded text-[11px] font-mono bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/[0.06]">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* 空间与前端 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-2">
                <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold block">
                  02 // FRONTEND
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Next.js 14', 'React 18', 'Three.js', 'Tailwind', 'Framer'].map((tech) => (
                    <span key={tech} className="px-2 py-0.5 rounded text-[11px] font-mono bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/[0.06]">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* 数据与 AI */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-2">
                <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-bold block">
                  03 // DATA & AI
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['PostgreSQL', 'Redis', 'Kafka', 'Agentic AI', 'MinIO'].map((tech) => (
                    <span key={tech} className="px-2 py-0.5 rounded text-[11px] font-mono bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/[0.06]">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 底栏信条 */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-neutral-500">
              <span>PRAGMATIC ENGINEERING</span>
              <span className="text-emerald-500 font-semibold">100% PRODUCTION READY</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
