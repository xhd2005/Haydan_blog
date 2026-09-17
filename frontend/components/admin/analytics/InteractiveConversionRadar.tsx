'use client';

import React, { useState, useMemo } from 'react';
import { Target, Copy, ExternalLink, ThumbsUp, MessageSquare, Share2, Sparkles, TrendingUp } from 'lucide-react';

interface RadarDimension {
  key: string;
  name: string;
  icon: any;
  value: number; // 原始数值
  displayValue: string;
  score: number; // 0-100 用于雷达多边形
  benchmark: number; // 基准对比分数
  growth: string;
}

export function InteractiveConversionRadar() {
  const [activeDimKey, setActiveDimKey] = useState<string | null>(null);

  // 五维互动转化指标
  const dimensions: RadarDimension[] = useMemo(() => [
    {
      key: 'code_copy',
      name: '代码块复制',
      icon: Copy,
      value: 1420,
      displayValue: '1,420 次',
      score: 88,
      benchmark: 65,
      growth: '+24.5%',
    },
    {
      key: 'external_links',
      name: '参考外链点击',
      icon: ExternalLink,
      value: 860,
      displayValue: '860 次',
      score: 74,
      benchmark: 58,
      growth: '+18.2%',
    },
    {
      key: 'like_rate',
      name: '点赞互动率',
      icon: ThumbsUp,
      value: 680,
      displayValue: '5.8%',
      score: 82,
      benchmark: 50,
      growth: '+12.0%',
    },
    {
      key: 'comment_rate',
      name: '评论探讨发生率',
      icon: MessageSquare,
      value: 245,
      displayValue: '2.4%',
      score: 70,
      benchmark: 45,
      growth: '+15.6%',
    },
    {
      key: 'social_share',
      name: '社交转发传播',
      icon: Share2,
      value: 390,
      displayValue: '390 次',
      score: 65,
      benchmark: 40,
      growth: '+9.8%',
    },
  ], []);

  // 雷达图几何计算 (5 边形)
  const size = 260;
  const center = size / 2;
  const radius = center - 35;
  const total = dimensions.length;

  const getCoordinates = (index: number, score: number) => {
    // 从顶部正上方 (-90deg) 开始
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (score / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // 生成当前分数的多边形路径
  const polygonPoints = dimensions
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.score);
      return `${x},${y}`;
    })
    .join(' ');

  // 生成基准多边形路径
  const benchmarkPoints = dimensions
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.benchmark);
      return `${x},${y}`;
    })
    .join(' ');

  // 背景同心多边形
  const webPolygons = [25, 50, 75, 100].map((level) => {
    return dimensions
      .map((_, i) => {
        const { x, y } = getCoordinates(i, level);
        return `${x},${y}`;
      })
      .join(' ');
  });

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-5">
      {/* 头部：标题与综合转化指数 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/[0.04] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>读者互动转化雷达 (Engagement Radar)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                五维深度追踪
              </span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              深度追踪代码块复制、外链探访、读者点赞与评论探讨发生率
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            <span className="text-slate-600 dark:text-zinc-400">本站转化表现</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-zinc-600 inline-block" />
            <span className="text-slate-400 dark:text-zinc-500">行业基准值</span>
          </span>
        </div>
      </div>

      {/* 核心双栏：左侧雷达几何画布，右侧维度明细卡 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* 左侧：SVG 五维雷达图 (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 select-none">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
              <defs>
                <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
                </radialGradient>
              </defs>

              {/* 背景网状多边形 */}
              {webPolygons.map((pts, idx) => (
                <polygon
                  key={idx}
                  points={pts}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200/80 dark:text-white/[0.06]"
                  strokeDasharray="2 2"
                />
              ))}

              {/* 轴线 */}
              {dimensions.map((_, i) => {
                const { x, y } = getCoordinates(i, 100);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-200 dark:text-white/[0.08]"
                  />
                );
              })}

              {/* 行业基准对比多边形 (灰色虚线) */}
              <polygon
                points={benchmarkPoints}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="text-slate-400 dark:text-zinc-600"
              />

              {/* 实际表现多边形 (紫色发光) */}
              <polygon
                points={polygonPoints}
                fill="url(#radarFill)"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="drop-shadow-md"
              />

              {/* 顶点数据圆圈 */}
              {dimensions.map((d, i) => {
                const { x, y } = getCoordinates(i, d.score);
                const isActive = activeDimKey === d.key;

                return (
                  <g key={d.key}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 6 : 4}
                      className="fill-white dark:fill-neutral-900 stroke-purple-500 transition-all cursor-pointer"
                      strokeWidth={isActive ? 3 : 2}
                      onMouseEnter={() => setActiveDimKey(d.key)}
                      onMouseLeave={() => setActiveDimKey(null)}
                    />
                  </g>
                );
              })}

              {/* 顶点名称文字 */}
              {dimensions.map((d, i) => {
                const { x, y } = getCoordinates(i, 118);
                const isActive = activeDimKey === d.key;

                return (
                  <text
                    key={d.key}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-[9px] font-mono transition-colors cursor-pointer ${
                      isActive
                        ? 'fill-purple-600 dark:fill-purple-400 font-bold'
                        : 'fill-slate-500 dark:fill-zinc-400'
                    }`}
                    onMouseEnter={() => setActiveDimKey(d.key)}
                    onMouseLeave={() => setActiveDimKey(null)}
                  >
                    {d.name}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 右侧：五维明细与环比增长列表 (7 Cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          {dimensions.map((dim) => {
            const Icon = dim.icon;
            const isActive = activeDimKey === dim.key;

            return (
              <div
                key={dim.key}
                onMouseEnter={() => setActiveDimKey(dim.key)}
                onMouseLeave={() => setActiveDimKey(null)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs cursor-pointer ${
                  isActive
                    ? 'border-purple-500/60 bg-purple-500/10 shadow-xs'
                    : 'border-slate-200/80 dark:border-white/[0.04] bg-slate-50/70 dark:bg-black/30 hover:border-slate-300 dark:hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl border transition-colors ${
                    isActive
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{dim.name}</span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                        <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                        <span>{dim.growth}</span>
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                      雷达指数: {dim.score} 分 (基准: {dim.benchmark})
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {dim.displayValue}
                  </div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400">
                    转化达成
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
