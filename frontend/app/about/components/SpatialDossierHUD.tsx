'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpatialEntityId } from './ThreePhysicalGlassStage';
import { Journey, Timeline, SiteSetting } from '@/lib/types';
import { X, Sparkles, ArrowRight, ArrowLeft, Mail, Github, Check, Compass, Code2, Cpu, Camera, Layers, Server, Layout, MapPin, ArrowUpRight } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import Image from 'next/image';
import Link from 'next/link';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';

interface SpatialDossierHUDProps {
  entityId: SpatialEntityId | null;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  journeys?: Journey[];
  timelines?: Timeline[];
  settings?: SiteSetting | null;
}

export function SpatialDossierHUD({
  entityId,
  onClose,
  onNavigate,
  journeys = [],
  settings,
}: SpatialDossierHUDProps) {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const contactEmail = 'haydenxue@example.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    toast.success(locale === 'en' ? 'Email copied' : '站长邮箱已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate('prev');
      if (e.key === 'ArrowRight') onNavigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);

  if (!entityId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-end sm:p-6 p-2">
        {/* 背景轻量环境遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm pointer-events-auto"
        />

        {/* 悬浮 HUD 极客档案抽屉 */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl liquid-glass-card shadow-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 border border-slate-200/80 dark:border-white/15"
        >
          {/* 顶栏控制岛 */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SPATIAL HUD // 3D ENTITY INSPECTOR</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('prev')}
                className="liquid-glass-pill p-1.5 rounded-full hover:scale-105 transition-transform"
                title="切换上一实体 (←)"
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={() => onNavigate('next')}
                className="liquid-glass-pill p-1.5 rounded-full hover:scale-105 transition-transform"
                title="切换下一实体 (→)"
              >
                <ArrowRight className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={onClose}
                className="liquid-glass-pill p-1.5 rounded-full hover:scale-105 transition-transform text-muted-foreground hover:text-foreground"
                title="关闭视窗 (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 实体动态详情渲染 */}
          <div className="space-y-6 flex-1">
            {entityId === 'central-prism' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden relative liquid-glass-pill p-1 shrink-0">
                    <Image
                      src={settings?.avatar || DEFAULT_AVATAR}
                      alt="Hayden Xue"
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">IDENTITY MATRIX</span>
                    <h2 className="text-2xl font-extrabold text-foreground font-sans">Hayden Xue</h2>
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      FULL-STACK ARCHITECT · DIGITAL GARDENER
                    </p>
                  </div>
                </div>

                <blockquote className="text-base sm:text-lg font-serif italic text-foreground leading-relaxed p-4 rounded-2xl liquid-glass-pill">
                  “追求极简与克制，在不确定中构建高确定性的全栈工程与智能体系统。代码是逻辑的诗歌，而旅途与胶片则是生命的刻度。”
                </blockquote>

                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  <p>
                    这里是 Hayden Xue 的个人数字避难所与心智实验场。穿梭于高并发分布式系统底座、3D 空间计算交互与真实高山旷野之间。
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleCopyEmail}
                    className="liquid-glass-pill px-4 py-2 rounded-full inline-flex items-center gap-2 text-xs font-mono"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Mail className="w-3.5 h-3.5" />}
                    <span>{copied ? 'COPIED' : contactEmail}</span>
                  </button>
                  <a
                    href="https://github.com/xhd2005"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="liquid-glass-pill px-4 py-2 rounded-full inline-flex items-center gap-2 text-xs font-mono"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GITHUB</span>
                  </a>
                </div>
              </div>
            )}

            {entityId === 'epoch-1' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">EPOCH 01 // 2018 — 2020</span>
                    <h2 className="text-xl font-bold text-foreground">启程 · 代码萌芽与极客探索</h2>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  写下第一行系统级代码，钻研算法底层原理、操作系统内核与开源世界。在纯粹的好奇心驱动下，打下坚实的计算机科学工程底座。
                </p>
                <div className="p-4 rounded-2xl liquid-glass-pill text-xs font-mono space-y-1.5">
                  <div className="text-foreground font-semibold">CORE ARCHIVES:</div>
                  <div className="text-muted-foreground">· Linux 内核机制与虚拟内存</div>
                  <div className="text-muted-foreground">· 数据结构、算法与网络协议栈</div>
                  <div className="text-muted-foreground">· 开源世界初探与系统级 Hello World</div>
                </div>
              </div>
            )}

            {entityId === 'epoch-2' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">EPOCH 02 // 2021 — 2023</span>
                    <h2 className="text-xl font-bold text-foreground">架构深耕 · 企业级分布式与高并发</h2>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  深耕微服务治理、Spring 生态与云原生架构，面对千万级高并发流量，以百炼成钢的工程美学打磨系统韧性与零故障稳定性。
                </p>
                <div className="p-4 rounded-2xl liquid-glass-pill text-xs font-mono space-y-1.5">
                  <div className="text-foreground font-semibold">ENGINEERING PILLARS:</div>
                  <div className="text-muted-foreground">· Java 21 虚拟线程与千万级吞吐吞吐优化</div>
                  <div className="text-muted-foreground">· 分布式一致性算法与 Kafka 流处理</div>
                  <div className="text-muted-foreground">· 微服务链路高可用降级与容灾架构</div>
                </div>
              </div>
            )}

            {entityId === 'epoch-3' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">EPOCH 03 // 2023 — 2025</span>
                    <h2 className="text-xl font-bold text-foreground">旷野与世界 · 高山徒步与摄影漫游</h2>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  走出屏幕与机房，走向川西雪山与辽阔旷野。用 35mm 胶片机捕捉光影瞬息，在自然洪荒中体悟微小与永恒，为冰冷代码注入空间灵性。
                </p>
                <div className="p-4 rounded-2xl liquid-glass-pill text-xs font-mono space-y-1.5">
                  <div className="text-foreground font-semibold">VISTAS & FRAMES:</div>
                  <div className="text-muted-foreground">· 川西高原与四姑娘山长途徒步</div>
                  <div className="text-muted-foreground">· 中画幅胶片光学色彩与真实光影刻度</div>
                  <div className="text-muted-foreground">· 空间与生命的广阔体验反哺造物哲学</div>
                </div>
              </div>
            )}

            {entityId === 'epoch-4' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">EPOCH 04 // 2026 — NOW</span>
                    <h2 className="text-xl font-bold text-foreground">当下造物 · 数字避难所与心智花园</h2>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  全栈独立造物：构建 100% 真实数据驱动、双主题液态玻璃美学与 AI 数字心智共存的个人数字花园，对抗速朽与噪音。
                </p>
                <div className="p-4 rounded-2xl liquid-glass-pill text-xs font-mono space-y-1.5">
                  <div className="text-foreground font-semibold">GARDEN ARCHITECTURE:</div>
                  <div className="text-muted-foreground">· WebGL 物理折射与 3D 空间交互舞台</div>
                  <div className="text-muted-foreground">· 真实足迹三维地球仪与遥感大圆飞行航线</div>
                  <div className="text-muted-foreground">· 100% 真实生活驱动与云端对象存储架构</div>
                </div>
              </div>
            )}

            {entityId === 'toolkit-arch' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">SYSTEM ARCHITECTURE</span>
                    <h2 className="text-xl font-bold text-foreground">Java 21 · 分布式微服务与云原生存储</h2>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  构建在复杂高并发与网络分区下坚如磐石的后端系统。深度整合 Java 21 虚拟线程、Spring 生态与 MinIO / S3 分布式对象存储。
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl liquid-glass-pill">Java 21 Virtual Threads</div>
                  <div className="p-2.5 rounded-xl liquid-glass-pill">Spring Boot 3.x</div>
                  <div className="p-2.5 rounded-xl liquid-glass-pill">Kafka Stream Engine</div>
                  <div className="p-2.5 rounded-xl liquid-glass-pill">MinIO / S3 Storage</div>
                </div>
              </div>
            )}

            {entityId === 'toolkit-spatial' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
                    <Layout className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">CREATIVE ENGINEERING</span>
                    <h2 className="text-xl font-bold text-foreground">Three.js · 空间计算与流体界面</h2>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  打破传统死板排版，基于 WebGL 物理折射着色器、Three.js 3D 渲染与 Next.js 14 App Router，打造如同呼吸般温润流动的空间交互体验。
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl liquid-glass-pill">Three.js WebGL Engine</div>
                  <div className="p-2.5 rounded-xl liquid-glass-pill">MeshPhysicalMaterial</div>
                  <div className="p-2.5 rounded-xl liquid-glass-pill">Next.js 14 SSR</div>
                  <div className="p-2.5 rounded-xl liquid-glass-pill">Framer Motion Parallax</div>
                </div>
              </div>
            )}

            {entityId === 'journeys-ring' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">GEOSPATIAL TRAJECTORY</span>
                    <h2 className="text-xl font-bold text-foreground">真实行旅与高山旷野足迹</h2>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  所有点标严格关联数据库中已发布的真实旅行记录（`journeys`）。点击即可直达对应的游记详情页。
                </p>
                <div className="space-y-2">
                  {journeys.slice(0, 3).map((j) => (
                    <Link
                      key={j.id}
                      href={`/journey/${j.slug || j.id}`}
                      className="p-3 rounded-2xl liquid-glass-pill flex items-center justify-between group hover:scale-[1.02] transition-transform"
                    >
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-bold text-foreground">{j.title}</span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                    </Link>
                  ))}
                </div>
                <Link
                  href="/journey"
                  className="block text-center py-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  进入 3D 卫星地球仪足迹剧场 →
                </Link>
              </div>
            )}
          </div>

          {/* 底部导航提示 */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>PRESS ESC TO CLOSE</span>
            <span>HAYDEN XUE © 2026</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
