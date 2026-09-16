'use client';

import React, { useState } from 'react';
import { Sparkles, Cpu, Compass, Zap, ChevronDown, BookOpen, Quote, ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

interface MentalModel {
  id: string;
  number: string;
  titleZh: string;
  titleEn: string;
  axiomZh: string;
  axiomEn: string;
  reflectionZh: string;
  reflectionEn: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderHover: string;
  glowColor: string;
}

const MENTAL_MODELS: MentalModel[] = [
  {
    id: 'antientropy',
    number: '01',
    titleZh: '对抗熵增与数字花园',
    titleEn: 'Anti-Entropy & Digital Garden',
    axiomZh: '思想若不修剪便会荒芜；公开记录是最好的认知灌溉。',
    axiomEn: 'Thoughts left unpruned decay into chaos; public creation is the truest nourishment.',
    reflectionZh: '宇宙万物自发趋向混乱与无序。软件架构与个人心智的本质，都是在局部空间内以高密度能量投入构建出高度有序的确定性结构。数字花园不是死板的陈列馆，而是持续修剪、迭代、生长的活体系统。',
    reflectionEn: 'Systems naturally degrade into chaos. The true essence of both software architecture and intellectual mastery is investing deliberate energy to forge order. This digital garden is a living organism of continuous iteration.',
    icon: Sparkles,
    accentColor: 'text-emerald-500',
    borderHover: 'hover:border-emerald-500/40',
    glowColor: 'group-hover:from-emerald-500/10',
  },
  {
    id: 'first-principles',
    number: '02',
    titleZh: '第一性原理与系统重构',
    titleEn: 'First Principles & System Order',
    axiomZh: '穿透流行概念的迷雾，在不确定性中构建确定性系统。',
    axiomEn: 'Pierce the haze of buzzwords; engineer resilient certainty amid systemic flux.',
    reflectionZh: '不盲从现成教条与框架神话。回归到底层的物理与逻辑公理：数据流如何流动、状态如何收敛、故障边界如何隔离。从最基础的真理出发推演架构，赋予复杂系统在极端负载下的韧性。',
    reflectionEn: 'Reject dogma and superficial abstractions. Trace problems down to foundational axioms: how data flows, how state converges, and where failure boundaries lie. True architectural resilience springs from first principles.',
    icon: Cpu,
    accentColor: 'text-teal-500',
    borderHover: 'hover:border-teal-500/40',
    glowColor: 'group-hover:from-teal-500/10',
  },
  {
    id: 'rationality-empathy',
    number: '03',
    titleZh: '技术理性与人文温度',
    titleEn: 'Tech Rationality & Humanistic Warmth',
    axiomZh: '技术是坚硬的骨骼，人文与审美是流动的血液。',
    axiomEn: 'Technology constitutes rigid bone; humanities and beauty breathe vital blood.',
    reflectionZh: '代码是严密冰冷的逻辑具象，但软件的终极归宿是服务于鲜活具体的人。缺乏审美体验的工程是粗糙的工具，而缺乏人文体察的代码是机械的排列。坚持把极致的工艺、优雅的交互与对世界的真实体察注入系统。',
    reflectionEn: 'Code represents rigorous, unyielding logic, yet software exists to serve living human consciousness. Engineering devoid of aesthetic sensitivity is crude; code without humanistic empathy is merely clockwork.',
    icon: Compass,
    accentColor: 'text-indigo-500',
    borderHover: 'hover:border-indigo-500/40',
    glowColor: 'group-hover:from-indigo-500/10',
  },
  {
    id: 'praxis-craftsmanship',
    number: '04',
    titleZh: '知行躬行与建造者精神',
    titleEn: 'Praxis & The Builder Spirit',
    axiomZh: '不做旁观的挑剔评论家，做躬身入局的工匠建造者。',
    axiomEn: 'Shun passive critique; embrace the arena of creation as a disciplined craftsman.',
    reflectionZh: '世界不缺少置身事外的评头论足，缺少真正把双手弄脏、把想法变成可运行代码的建造者。真理不在抽象的辩论中显现，而在一次次编译、部署、攻坚与重构的实战反馈中自我澄明。',
    reflectionEn: 'The world overfloweth with spectator commentary. What matters is rolling up sleeves, entering the arena, and materializing ideas into working software. Understanding reveals itself through disciplined execution.',
    icon: Zap,
    accentColor: 'text-amber-500',
    borderHover: 'hover:border-amber-500/40',
    glowColor: 'group-hover:from-amber-500/10',
  },
];

export function MentalModelsMatrix() {
  const { locale } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {locale === 'zh' ? '认知基石与心智模型' : 'Cognitive Axioms & Mental Models'}
            </h3>
            <p className="text-xs font-mono text-muted-foreground">
              {locale === 'zh' ? '技术架构与人生哲思的双核锚点' : 'Core philosophical anchors guiding engineering & life'}
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block text-xs font-mono text-muted-foreground/80 bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
          4 MENTAL MODELS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MENTAL_MODELS.map((model) => {
          const Icon = model.icon;
          const isExpanded = expandedId === model.id;

          return (
            <div
              key={model.id}
              onClick={() => toggleExpand(model.id)}
              className={`group relative rounded-[28px] p-6 border border-white/80 dark:border-white/[0.12] bg-white/[0.65] dark:bg-[#0c0d16]/[0.60] backdrop-blur-2xl backdrop-saturate-[180%] shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.85),inset_0_-1.5px_1.5px_rgba(0,0,0,0.03),0_15px_35px_-10px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.22),inset_0_0_15px_rgba(16,185,129,0.03),0_20px_40px_-12px_rgba(0,0,0,0.6)] hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${model.borderHover}`}
            >
              {/* Subtle gradient hover wash */}
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${model.glowColor}`} />

              <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                {/* Header: Number & Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-muted-foreground tracking-widest">
                      // {model.number}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {locale === 'zh' ? model.titleZh : model.titleEn}
                    </h4>
                  </div>
                  <div className={`p-2 rounded-xl bg-card border border-border shadow-xs ${model.accentColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Axiom quote */}
                <div className="relative pl-3 border-l-2 border-primary/40 space-y-1">
                  <p className="font-serif italic text-sm text-foreground/90 font-medium leading-relaxed">
                    “{locale === 'zh' ? model.axiomZh : model.axiomEn}”
                  </p>
                </div>

                {/* Expand toggle info */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="group-hover:text-foreground transition-colors">
                    {isExpanded 
                      ? (locale === 'zh' ? '收起思考手记' : 'Collapse notes') 
                      : (locale === 'zh' ? '展开思考手记' : 'Read reflection')}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                </div>

                {/* Expandable reflection text */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3.5 rounded-2xl border border-border/40 space-y-2">
                        <div className="flex items-center gap-1.5 text-primary font-mono text-[10px] uppercase tracking-wider font-semibold">
                          <Quote className="w-3 h-3" />
                          <span>Architect&apos;s Note</span>
                        </div>
                        <p>{locale === 'zh' ? model.reflectionZh : model.reflectionEn}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
