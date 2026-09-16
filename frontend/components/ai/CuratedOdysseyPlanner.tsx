'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { AiCuratedPathVO } from '@/lib/types';
import { useTranslation } from '@/lib/i18n-client';
import { Compass, Sparkles, Loader2, CheckCircle, Circle, ArrowRight, Clock, BookOpen, Share2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/lib/toast';

const PRESET_GOALS = [
  { label: 'Java 25 高并发攻坚', goal: '深入攻坚 Java 25 虚拟线程、Project Loom 与现代微服务并发底座' },
  { label: 'Next.js 14 空间美学', goal: '学习 Next.js 14 App Router、React 18 RSC 与 Three.js 现代前端空间美学' },
  { label: '环球旅行与人文足迹', goal: '探索站长 Hayden 的环球摄影旅程、城市漫步与真实时空记录' },
  { label: '数字花园长效思考', goal: '理解数字花园 Seedling -> Budding -> Evergreen 的长效复利心智哲学' },
];

export function CuratedOdysseyPlanner() {
  const { locale } = useTranslation();
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [pathData, setPathData] = useState<AiCuratedPathVO | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleGenerate = async (targetGoal?: string) => {
    const activeGoal = (targetGoal ?? goal).trim();
    if (!activeGoal || loading) return;
    setLoading(true);

    try {
      const res = await api.generateReadingPath({ goal: activeGoal });
      setPathData(res);
      setCompletedSteps([]);
    } catch (err) {
      console.error('Failed to generate reading path:', err);
      toast.error(locale === 'en' ? 'Failed to generate path. Please retry.' : '生成航线失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (order: number) => {
    setCompletedSteps((prev) =>
      prev.includes(order) ? prev.filter((o) => o !== order) : [...prev, order]
    );
  };

  return (
    <div className="w-full rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl space-y-6">
      {/* 头部标题 */}
      <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <h3 className="font-bold text-base text-foreground font-mono">
              CURATED ODYSSEY // 定制漫游路线规划器
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {locale === 'en'
              ? 'Tell Hayden AI your learning goal or topic interest, and get a tailored curriculum roadmap.'
              : '告诉外脑你的学习目标或探索兴趣，AI 将基于站内常青知识库为你编排专属进阶导读航线。'}
          </p>
        </div>
      </div>

      {/* 预设方向快捷胶囊 */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-muted-foreground">快速探索推荐意图：</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_GOALS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setGoal(p.goal);
                handleGenerate(p.goal);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-white/[0.04] hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/30 transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 输入框与生成按钮 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder={locale === 'en' ? 'E.g., Master high-concurrency Java 25 & Virtual Threads...' : '例如：想从零搞懂 Java 25 虚拟线程与现代微服务并发架构...'}
          className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200/90 dark:border-white/[0.1] text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        <button
          type="button"
          onClick={() => handleGenerate()}
          disabled={loading || !goal.trim()}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{locale === 'en' ? 'Plan Odyssey' : '生成航线'}</span>
        </button>
      </div>

      {/* 路线结果展示区 */}
      {pathData && (
        <div className="space-y-4 pt-4 border-t border-slate-200/70 dark:border-white/[0.06] animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <span>{pathData.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {pathData.estimatedTotalTime}
                </span>
              </h4>
              <p className="text-xs text-muted-foreground">{pathData.description}</p>
            </div>

            <div className="text-xs font-mono text-muted-foreground">
              进度: {completedSteps.length} / {pathData.steps?.length || 0}
            </div>
          </div>

          {/* 步骤卡片流 */}
          <div className="space-y-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-emerald-500/60 before:to-sky-500/60 pl-8">
            {pathData.steps?.map((step) => {
              const isDone = completedSteps.includes(step.order);
              return (
                <div
                  key={step.order}
                  className={`relative p-4 rounded-2xl border transition-all duration-200 space-y-2 ${
                    isDone
                      ? 'bg-emerald-500/[0.04] border-emerald-500/30 opacity-75'
                      : 'bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.06] hover:border-emerald-500/40'
                  }`}
                >
                  {/* 左侧时间线节点小圆球 */}
                  <button
                    type="button"
                    onClick={() => toggleStep(step.order)}
                    className="absolute -left-[27px] top-4 p-0.5 rounded-full bg-background border border-emerald-500 text-emerald-500 hover:scale-110 transition-transform cursor-pointer"
                  >
                    {isDone ? <CheckCircle className="w-3.5 h-3.5 fill-emerald-500 text-background" /> : <Circle className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {step.stepTitle}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {step.readingTime}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {step.purpose}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
                    <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[260px]">
                      核心攻坚: 《{step.postTitle}》
                    </span>
                    <Link
                      href={`/blog/${step.postSlug}`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <span>启程阅读</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
