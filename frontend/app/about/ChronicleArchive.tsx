'use client';

import React, { useState, useRef } from 'react';
import { Timeline, SiteSetting } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import {
  Compass,
  Code2,
  Camera,
  Cpu,
  ShieldCheck,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Terminal,
  Key,
  Mail,
  Github,
  MapPin,
  Quote,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import Image from 'next/image';

interface ChronicleArchiveProps {
  timelines: Timeline[];
  settings: SiteSetting | null;
}

interface EpochItem {
  id: string;
  tag: string;
  period: string;
  title: string;
  enTitle: string;
  summary: string;
  quote: string;
  icon: any;
  coverImage: string;
  highlights: string[];
}

const EPOCHS: EpochItem[] = [
  {
    id: 'epoch-1',
    tag: 'EPOCH 01',
    period: '2018 — 2020',
    title: '启程 · 代码萌芽与极客探索',
    enTitle: 'GENESIS // THE FIRST BYTE',
    summary: '写下第一行系统级代码，钻研算法底层原理与操作系统内核。在开源世界中感受协同创造的纯粹快乐。',
    quote: '所有的远方与系统架构，都始于一次纯粹好奇心驱动的 Hello World。',
    icon: Code2,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
    highlights: [
      '沉浸于 Linux 内核原理、计算机系统架构与数据结构演进',
      '在开源社区提交首批 PR，构建早期高确定性系统原型',
      '确立独立思考与极客工匠精神的基本盘',
    ],
  },
  {
    id: 'epoch-2',
    tag: 'EPOCH 02',
    period: '2021 — 2023',
    title: '架构深耕 · 企业级分布式与高并发',
    enTitle: 'CRAFTSMANSHIP // DISTRIBUTED SCALE',
    summary: '深耕高并发分布式系统、微服务治理、Spring 生态与云原生架构，以严苛的工程美学衡量代码质量。',
    quote: '优雅的架构绝非空想设计，而是在复杂性泥潭中百炼成钢的工程结晶。',
    icon: Cpu,
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    highlights: [
      '设计支持万级 QPS 高并发核心分布式链路与高可用降级体系',
      '全链路压测、缓存一致性与零拷贝系统性能极致调优',
      '总结《现代分布式工程设计模式》技术随笔集',
    ],
  },
  {
    id: 'epoch-3',
    tag: 'EPOCH 03',
    period: '2023 — 2025',
    title: '旷野与世界 · 高山徒步与摄影漫游',
    enTitle: 'THE ODYSSEY // HIGH PLATEAU & FILM',
    summary: '走出屏幕与机房，走向川西雪山与辽阔旷野。用 35mm 胶片机捕捉光影瞬息，在自然洪荒中体悟微小与永恒。',
    quote: '站在海拔四千米的风口，方知代码之外，世界浩瀚无穷。',
    icon: Camera,
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    highlights: [
      '重装徒步贡嘎环线与川西秘境，记录数十个地理坐标与足迹',
      '拍摄数千张中画幅与 35mm 富士反转片，构建个人影像暗房库',
      '将地理漫游沉淀为可交互的 3D 遥感卫星足迹剧场',
    ],
  },
  {
    id: 'epoch-4',
    tag: 'EPOCH 04',
    period: '2026 — PRESENCE',
    title: '当下造物 · 数字避难所与心智花园',
    enTitle: 'THE GARDEN // AUTONOMOUS CREATION',
    summary: '全栈独立造物：构建 100% 真实数据驱动、双主题深度层级美学与 AI 数字心智共存的个人数字花园。',
    quote: '建造属于自己的心智避难所，对抗瞬息万变与信息的速朽。',
    icon: Layers,
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    highlights: [
      '彻底解耦前端展现与 CMS 后台，全站多媒体直连 MinIO / S3 分布式对象存储',
      '融入 Three.js 3D WebGL 空间引力星系与 100svh 电影级交互剧场',
      '接入第一人称 RAG 数字分身，长期沉淀个人心智资产',
    ],
  },
];

export function ChronicleArchive({ timelines, settings }: ChronicleArchiveProps) {
  const { locale } = useI18n();

  // 当前激活的时空纪元索引
  const [activeEpochIdx, setActiveEpochIdx] = useState<number>(3); // 默认高亮当下造物
  const currentEpoch = EPOCHS[activeEpochIdx];

  // 全息名片 3D 视差倾斜与翻转状态
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardTilt, setCardTilt] = useState<{ rx: number; ry: number; glareX: number; glareY: number }>({
    rx: 0,
    ry: 0,
    glareX: 50,
    glareY: 50,
  });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 2 - 1; // -1 ~ 1
    const py = (y / rect.height) * 2 - 1; // -1 ~ 1

    setCardTilt({
      rx: -py * 12, // 上下倾斜
      ry: px * 12,  // 左右倾斜
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
    });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  };

  return (
    <div className="w-full h-[100svh] relative overflow-hidden bg-[#06070a] text-slate-200 select-none flex flex-col justify-between pt-20 pb-5 px-4 sm:px-8">
      {/* 坐标格网与环境激光辉光底盘 */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* 顶部 HUD 状态栏 */}
      <header className="flex items-center justify-between pointer-events-auto bg-neutral-900/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-white flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>CHRONICLE ARCHIVE</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                VERIFIED 100%
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              IDENTITY: HAYDEN XUE // HISTORICAL EPOCHS
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>AUTONOMOUS CRAFTSMAN</span>
        </div>
      </header>

      {/* 中央主展厅：左侧全息名片 + 右侧时空纪元轴 */}
      <div className="flex-1 w-full max-w-7xl mx-auto my-3 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-0 overflow-hidden">
        {/* 左翼 (4.5 cols)：3D 物理视差全息名片 (Holographic Badge) */}
        <div className="lg:col-span-4 flex flex-col justify-center items-center p-2">
          <div
            ref={cardRef}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="w-full max-w-[340px] aspect-[4/5] perspective-1000 cursor-pointer relative group"
            onClick={() => setIsFlipped(!isFlipped)}
            title="点击翻转查看数字指纹与安全通道"
          >
            {/* 3D 旋转容器 */}
            <div
              className="w-full h-full relative rounded-3xl transition-transform duration-200 ease-out shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/20 overflow-hidden bg-neutral-900/90 backdrop-blur-2xl"
              style={{
                transform: `rotateX(${cardTilt.rx}deg) rotateY(${cardTilt.ry}deg) ${
                  isFlipped ? 'rotateY(180deg)' : ''
                }`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* 光栅反光衍射微光层 (Prismatic Sheen) */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity z-20"
                style={{
                  background: `radial-gradient(circle at ${cardTilt.glareX}% ${cardTilt.glareY}%, rgba(255,255,255,0.35) 0%, rgba(56,189,248,0.2) 25%, transparent 60%)`,
                }}
              />

              {/* 正面：Hayden Xue 空间全息名片 */}
              {!isFlipped && (
                <div className="w-full h-full p-6 flex flex-col justify-between relative z-10">
                  {/* 顶部身份徽章 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-300">
                        OFFICIAL PASS
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">ID: HX-8848</span>
                  </div>

                  {/* 中心个人肖像与纯正身份 */}
                  <div className="text-center space-y-3 my-auto">
                    <div className="w-24 h-24 mx-auto rounded-full p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-amber-400 shadow-xl relative">
                      <div className="w-full h-full rounded-full overflow-hidden relative bg-neutral-950">
                        <Image
                          src={settings?.avatar || '/avatar.png'}
                          alt="Hayden Xue"
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
                        Hayden Xue
                      </h2>
                      <div className="text-xs font-mono text-blue-400 font-medium tracking-wide">
                        Full-Stack Architect & Digital Gardener
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans px-2 italic">
                      “追求极简与克制，在不确定中构建高确定性的全栈工程与智能体系统。”
                    </p>
                  </div>

                  {/* 底部翻转提示 */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-blue-300">
                      <RotateCcw className="w-3 h-3" />
                      <span>CLICK TO FLIP BACK</span>
                    </span>
                    <span>PGP VERIFIED</span>
                  </div>
                </div>
              )}

              {/* 背面：数字指纹与安全通信矩阵 */}
              {isFlipped && (
                <div
                  className="w-full h-full p-6 flex flex-col justify-between relative z-10"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      <span>SECURITY KEY</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">RSA 4096</span>
                  </div>

                  {/* PGP 指纹与通讯 */}
                  <div className="my-auto space-y-4 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        PGP Fingerprint
                      </div>
                      <div className="p-2 rounded-xl bg-black/60 border border-white/10 text-[10px] text-cyan-300 font-mono tracking-widest break-all">
                        4A8B 92CF 01E3 7D98 52A1 B4C3 D90E F182 336A
                      </div>
                    </div>

                    <div className="space-y-2">
                      <a
                        href="https://github.com/xhd2005"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Github className="w-3.5 h-3.5 text-slate-400" />
                          <span>github.com/xhd2005</span>
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                      <a
                        href="mailto:haydenxue@example.com"
                        className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>haydenxue@example.com</span>
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>STATUS: ONLINE</span>
                    <span className="text-amber-300">CLICK TO FLIP FRONT</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右翼 (8 cols)：四大时空纪元编年轴 (Interactive Epochs Scrolly-Track) */}
        <div className="lg:col-span-8 bg-neutral-900/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* 顶部纪元标签导航器 */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 shrink-0 overflow-x-auto no-scrollbar">
            {EPOCHS.map((ep, idx) => (
              <button
                key={ep.id}
                onClick={() => setActiveEpochIdx(idx)}
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-medium transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                  activeEpochIdx === idx
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{ep.tag}</span>
                <span className="hidden sm:inline">· {ep.period}</span>
              </button>
            ))}
          </div>

          {/* 纪元核心高光展台 */}
          <div className="my-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
            {/* 左侧影像 */}
            <div className="md:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl">
              <Image
                src={currentEpoch.coverImage}
                alt={currentEpoch.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-xs font-mono text-white/90">
                {currentEpoch.enTitle}
              </div>
            </div>

            {/* 右侧纪元内容 */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold tracking-wider">
                  {currentEpoch.period} // {currentEpoch.tag}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-1">
                  {currentEpoch.title}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {currentEpoch.summary}
              </p>

              {/* 关键高光清单 */}
              <div className="space-y-2 pt-1">
                {currentEpoch.highlights.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* 纪元经典感悟 */}
              <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-xs text-amber-300/90 italic font-serif">
                <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>"{currentEpoch.quote}"</span>
              </div>
            </div>
          </div>

          {/* 底部前后纪元穿梭按钮 */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
            <button
              onClick={() => setActiveEpochIdx((prev) => (prev > 0 ? prev - 1 : EPOCHS.length - 1))}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREV EPOCH</span>
            </button>
            <span>
              EPOCH 0{activeEpochIdx + 1} OF 0{EPOCHS.length}
            </span>
            <button
              onClick={() => setActiveEpochIdx((prev) => (prev < EPOCHS.length - 1 ? prev + 1 : 0))}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <span>NEXT EPOCH</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 底部 HUD 状态条 */}
      <footer className="flex items-center justify-between pointer-events-auto bg-neutral-900/80 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/10 text-xs font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>© 2026 HAYDEN XUE. ALL RIGHTS RESERVED.</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span>SPATIOTEMPORAL ARCHIVES</span>
          <span className="text-slate-600">•</span>
          <span>100% LIVING MEMORY</span>
        </div>
      </footer>
    </div>
  );
}
