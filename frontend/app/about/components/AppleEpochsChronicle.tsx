'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AppleFluidFlipCard } from './AppleFluidFlipCard';
import { Compass, GitCommit, ShieldAlert, Mountain, Sparkles, Milestone } from 'lucide-react';
import { Timeline } from '@/lib/types';

interface AppleEpochsChronicleProps {
  timelines?: Timeline[];
}

export function AppleEpochsChronicle({ timelines = [] }: AppleEpochsChronicleProps) {
  const epochs = [
    {
      badge: 'EPOCH 01 · 2018',
      year: '2018',
      title: '萌芽 · 算法与分布式本源',
      subtitle: '敲下第一行分布式 Hello World，开启对数据结构与高并发底层世界的探索。',
      icon: GitCommit,
      tags: ['ACM 算法', 'Java 基础', '操作系统内核', '网络协议'],
      reflection:
        '2018 年，在高校实验室无数个深夜里，我第一次被分布式共识算法的严谨对称性深深震撼。那时的执念很简单：探寻一行行机器指令如何在跨越网络的世界中永不言弃地达成一致。',
      milestone: '首个开源高性能缓存中间件原型诞生，奠定底层系统兴趣。',
    },
    {
      badge: 'EPOCH 02 · 2021',
      year: '2021',
      title: '淬炼 · 亿级洪峰与弹性架构',
      subtitle: '主导核心数据密集型管线架构演进，在千万级 QPS 洪峰冲击下磨炼系统韧性。',
      icon: ShieldAlert,
      tags: ['千万级 QPS', '混沌工程', '零拷贝 I/O', '流量削峰治理'],
      reflection:
        '真实生产环境是最好的试金石。当成百上千个微服务节点面对瞬时海量洪峰涌入，唯有敬畏每一微秒的 CPU 调度和每一字节的堆内存分配。这一阶段铸就了我对高可用弹性架构与第一性原理的终身信仰。',
      milestone: '保障核心业务系统 99.999% SLA，实现高并发场景全年零重大故障。',
    },
    {
      badge: 'EPOCH 03 · 2023',
      year: '2023',
      title: '旷野 · 川西雪线与胶片沉淀',
      subtitle: '背上重装行囊深入川西贡嘎与格聂雪线，在海拔 4,700 米垭口校准内心的步频与呼吸。',
      icon: Mountain,
      tags: ['35mm 胶片', '贡嘎转山', '重装徒步', '极简心智'],
      reflection:
        '在稀薄冰冷的空气中，每一次翻山都是与自我的漫长对话。大自然不言不语，却展现着宇宙最深邃的秩序。从那一刻起，代码不再仅仅是冷冰冰的逻辑，而是带着旷野温度的数字手艺。',
      milestone: '完成多条川西高海拔艰险徒步路线，沉淀上百张真实胶片摄影。',
    },
    {
      badge: 'EPOCH 04 · 2026',
      year: '2026',
      title: '筑园 · 数字心智与自主智能',
      subtitle: '将沉淀多年的分布式架构与 Agentic AI 自主工作流交融，打造属于 Hayden Xue 的纯净数字花园。',
      icon: Sparkles,
      tags: ['Agentic AI', 'Next.js 14', '空间计算', '数字花园 2.0'],
      reflection:
        '2026 年，个人网站不再只是一张名片，而是一座充满生命力的数字花园。每一次提交都是种下一颗思想的种子。以开源之心回馈社区，以匠人之心雕琢每一个像素与字节。',
      milestone: '全面落成个人旗舰级数字花园，构建自主进化的 Agentic 个人基座。',
    },
  ];

  return (
    <section className="relative py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 章节导引 */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20">
            <Milestone className="w-3.5 h-3.5" />
            ACT 03 · CHRONO EPOCHS
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-serif tracking-tight text-slate-900 dark:text-white">
            四大时空纪元交错画卷
          </h2>
        </div>
        <p className="text-sm font-mono text-slate-500 dark:text-neutral-400 max-w-sm">
          记录从算法萌芽、高并发洪峰淬炼，到雪线漫游与数字筑园的成长全景。
        </p>
      </div>

      {/* 2x2 纪元翻转卡片展台 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {epochs.map((epoch) => {
          const IconComponent = epoch.icon;
          return (
            <AppleFluidFlipCard
              key={epoch.year}
              badge={epoch.badge}
              flipLabel="翻转纪元手记"
              frontContent={
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono tracking-widest text-slate-400 dark:text-neutral-500 block">
                          TIMELINE EPOCH
                        </span>
                        <h4 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                          {epoch.title}
                        </h4>
                      </div>
                    </div>
                    <span className="text-3xl font-serif italic text-slate-200 dark:text-neutral-800 font-bold">
                      {epoch.year}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                    {epoch.subtitle}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {epoch.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-100/80 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              }
              backContent={
                <div className="space-y-4 text-xs font-mono text-slate-300">
                  <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
                    <span className="text-emerald-400 font-semibold">{epoch.badge} · FIELD NOTES</span>
                    <span className="text-slate-400">EPOCH REFLECTION</span>
                  </div>

                  <p className="text-slate-200 leading-relaxed font-sans text-xs">
                    “{epoch.reflection}”
                  </p>

                  <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/20 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
                      KEY MILESTONE / 里程碑
                    </span>
                    <p className="text-white text-xs font-sans">
                      {epoch.milestone}
                    </p>
                  </div>
                </div>
              }
            />
          );
        })}
      </div>
    </section>
  );
}
