'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Timeline } from '@/lib/types';
import { 
  Milestone, 
  ChevronDown, 
  ChevronUp, 
  GitCommit, 
  ShieldAlert, 
  Mountain, 
  Sparkles, 
  Calendar,
  BookOpen,
  Filter
} from 'lucide-react';

interface CinematicLivingChronicleActProps {
  timelines?: Timeline[];
}

interface ChronicleItem {
  id: number | string;
  year: string;
  title: string;
  subtitle?: string;
  category: string;
  description: string;
  milestone?: string;
  tags?: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export function CinematicLivingChronicleAct({ timelines = [] }: CinematicLivingChronicleActProps) {
  // 优质预设纪元（当 CMS 后台尚未录入数据时提供高雅兜底，严格保持 Hayden Xue 真实成长史）
  const presetEpochs: ChronicleItem[] = [
    {
      id: 'p-2026',
      year: '2026',
      title: '筑园 · 空间数字花园与 Agentic 自主智能体',
      subtitle: '全面重塑 Hayden Xue 个人旗舰级数字花园，交融微服务与自主工作流。',
      category: '开源造物',
      description:
        '将沉淀多年的分布式系统工程与 Agentic AI 自主协作架构深度结合。个人网站不仅是一张数字名片，更是一座带有生命律动、可自主进化的心智花园。以极客之心雕琢每一个像素与微秒。',
      milestone: '落成双主题空间计算花园与多智能体伴读体系，开源个人知识图谱。',
      tags: ['Agentic AI', 'Next.js 14', '空间计算', '数字花园 2.0'],
      icon: Sparkles,
    },
    {
      id: 'p-2023',
      year: '2023',
      title: '旷野 · 川西雪线重装徒步与胶片沉淀',
      subtitle: '背上重装行囊深入川西贡嘎与格聂雪线，在海拔 4,700 米垭口校准内心的步频与呼吸。',
      category: '旷野探索',
      description:
        '在稀薄冰冷的空气中，每一次翻山都是与自我的漫长对话。大自然不言不语，却展现着宇宙最深邃的秩序。从那一刻起，代码不再仅仅是冰冷的逻辑，而是带着旷野温度的数字手艺。',
      milestone: '完成多条川西高海拔艰险徒步路线，沉淀上百张真实 35mm 胶片摄影。',
      tags: ['35mm 胶片', '贡嘎转山', '重装徒步', '极简心智'],
      icon: Mountain,
    },
    {
      id: 'p-2021',
      year: '2021',
      title: '淬炼 · 千万级高并发洪峰与弹性架构',
      subtitle: '主导核心数据密集型管线架构演进，在千万级 QPS 洪峰冲击下磨炼系统韧性。',
      category: '架构演进',
      description:
        '生产环境是最好的试金石。当成百上千个微服务节点面对瞬时海量洪峰涌入，唯有敬畏每一微秒的 CPU 调度和每一字节的堆内存分配。这一阶段铸就了我对高可用弹性架构与第一性原理的终身信仰。',
      milestone: '保障核心业务系统 99.999% SLA，实现高并发场景全年零重大故障。',
      tags: ['千万级 QPS', '混沌工程', '零拷贝 I/O', '流量削峰治理'],
      icon: ShieldAlert,
    },
    {
      id: 'p-2018',
      year: '2018',
      title: '萌芽 · 算法本源与分布式底层探索',
      subtitle: '敲下第一行分布式系统代码，开启对底层数据结构与高并发网络世界的探索。',
      category: '认知跃迁',
      description:
        '在高校实验室无数个深夜里，我第一次被分布式共识算法的严谨对称性深深震撼。那时的执念很简单：探寻一行行机器指令如何在跨越网络的世界中永不言弃地达成一致。',
      milestone: '首个开源高性能缓存中间件原型诞生，奠定底层系统兴趣。',
      tags: ['ACM 算法', 'Java 基础', '操作系统内核', '网络协议'],
      icon: GitCommit,
    },
  ];

  // 如果数据库中存有 timelines 真实数据，则优先映射数据库数据，并平滑混合展示
  const combinedChronicles: ChronicleItem[] = timelines.length > 0
    ? timelines.map((t) => ({
        id: t.id,
        year: t.year || '2026',
        title: t.title,
        subtitle: t.description?.slice(0, 50) + '...',
        category: '架构演进',
        description: t.description || '',
        milestone: `CMS 后台记录 · 排序优先级 ${t.sortOrder}`,
        tags: ['真实记录', 'CMS 同步'],
        icon: Sparkles,
      }))
    : presetEpochs;

  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [expandedIds, setExpandedIds] = useState<Record<string | number, boolean>>({
    [combinedChronicles[0]?.id]: true,
  });

  const categories = ['全部', '架构演进', '旷野探索', '认知跃迁', '开源造物'];

  const filteredChronicles = activeCategory === '全部'
    ? combinedChronicles
    : combinedChronicles.filter((c) => c.category === activeCategory);

  const toggleExpand = (id: string | number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section id="act-chronicle" className="relative py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* 章节导引 */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20">
            <Milestone className="w-3.5 h-3.5" />
            ACT 03 · THE LIVING CHRONICLE TIMELINE
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-serif tracking-tight text-slate-900 dark:text-white">
            跃迁：动态时空纪元长卷
          </h2>
        </div>
        <p className="text-sm font-mono text-slate-500 dark:text-neutral-400 max-w-sm">
          记录从算法萌芽、千万级洪峰淬炼，到雪线漫游与自主建园的完整成长轨迹。
        </p>
      </div>

      {/* 分类筛选标签栏 */}
      <div className="mb-10 flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3 h-3 text-emerald-500" />
          <span>分类过滤:</span>
        </span>
        {categories.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all duration-200 ${
                isSelected
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 font-bold'
                  : 'bg-white/80 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 时间轴纵向树状长卷 */}
      <div className="relative border-l-2 border-slate-200 dark:border-white/[0.08] ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-8">
        {filteredChronicles.map((item) => {
          const isExpanded = !!expandedIds[item.id];
          const Icon = item.icon;
          return (
            <div key={item.id} className="relative group">
              
              {/* 时间轴光标节点 */}
              <div className="absolute -left-[31px] sm:-left-[47px] top-4 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white dark:bg-[#090a0f] border-2 border-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* 纪元主卡片 */}
              <div
                className="rounded-[24px] p-6 sm:p-7
                  bg-white/85 dark:bg-[#0f1117]/85 backdrop-blur-2xl
                  border border-slate-200/80 dark:border-white/[0.08]
                  shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* 卡片顶栏 */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
                      {item.year}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-neutral-400 border border-slate-200/60 dark:border-white/[0.06]">
                      {item.category}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="inline-flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>{isExpanded ? '收起纪元手记' : '展开深层手记'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* 纪元主标题 */}
                <h3 className="mt-3 text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                {/* 简要综述 */}
                {item.subtitle && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {item.subtitle}
                  </p>
                )}

                {/* 展开的深层手记内容 */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.05] space-y-3">
                    <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04]">
                      <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                        EPOCH REFLECTION · 历史沉思
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                        {item.description}
                      </p>
                    </div>

                    {/* 里程碑注脚 */}
                    {item.milestone && (
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-neutral-400">
                        <span className="text-emerald-500">❖</span>
                        <span>{item.milestone}</span>
                      </div>
                    )}

                    {/* 标签 */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-[11px] font-mono bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border border-slate-200/60 dark:border-white/[0.06]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
}
