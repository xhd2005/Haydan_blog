'use client';

import React from 'react';
import { SkeletonBone, SkeletonText, SkeletonCard } from './LiquidShimmer';

/**
 * 语义化骨架屏：博客/文章卡片骨架
 */
export function PostCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* 封面图占位 */}
            <SkeletonBone className="aspect-[16/10] w-full rounded-2xl" />
            
            {/* 标签与日期胶囊 */}
            <div className="flex items-center gap-2">
              <SkeletonBone className="h-5 w-16 rounded-full" />
              <SkeletonBone className="h-4 w-24 rounded-full" />
            </div>

            {/* 标题 */}
            <SkeletonBone className="h-6 w-5/6 rounded-lg" />

            {/* 摘要 */}
            <SkeletonText lines={2} lastLineWidth="75%" />
          </div>

          {/* 底部作者与元信息 */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SkeletonBone className="w-6 h-6 rounded-full" />
              <SkeletonBone className="w-20 h-3.5 rounded-full" />
            </div>
            <SkeletonBone className="w-12 h-3.5 rounded-full" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

/**
 * 语义化骨架屏：文章详情页骨架
 */
export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-12 space-y-10">
      {/* 顶部元数据栏 */}
      <div className="space-y-5">
        <SkeletonBone className="h-4 w-28 rounded-full" />
        <SkeletonBone className="h-12 w-4/5 max-w-2xl rounded-2xl" />
        
        <div className="flex items-center gap-4 pt-2">
          <SkeletonBone className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <SkeletonBone className="h-4 w-24 rounded-full" />
            <SkeletonBone className="h-3 w-36 rounded-full" />
          </div>
        </div>
      </div>

      {/* 封面主视觉占位 */}
      <SkeletonBone className="aspect-[21/9] w-full rounded-3xl" />

      {/* 正文排版段落 */}
      <div className="space-y-8 pt-4">
        <div className="space-y-3">
          <SkeletonBone className="h-7 w-1/3 rounded-lg" />
          <SkeletonText lines={4} lastLineWidth="85%" />
        </div>

        <div className="space-y-3">
          <SkeletonText lines={5} lastLineWidth="60%" />
        </div>

        {/* 代码块占位 */}
        <SkeletonCard className="p-5 space-y-2">
          <SkeletonBone className="h-4 w-24 rounded-md" />
          <SkeletonBone className="h-3.5 w-3/4 rounded-md" />
          <SkeletonBone className="h-3.5 w-1/2 rounded-md" />
          <SkeletonBone className="h-3.5 w-4/5 rounded-md" />
        </SkeletonCard>

        <div className="space-y-3">
          <SkeletonBone className="h-7 w-2/5 rounded-lg" />
          <SkeletonText lines={4} lastLineWidth="70%" />
        </div>
      </div>
    </div>
  );
}

/**
 * 语义化骨架屏：后台管理表格骨架
 */
export function AdminTableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-4">
      {/* 搜索过滤栏骨架 */}
      <div className="flex items-center justify-between gap-4">
        <SkeletonBone className="h-9 w-64 rounded-xl" />
        <div className="flex items-center gap-2">
          <SkeletonBone className="h-9 w-24 rounded-xl" />
          <SkeletonBone className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* 表格主体 */}
      <div className="liquid-glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08]">
        {/* 表头 */}
        <div className="p-4 bg-slate-50/70 dark:bg-neutral-900/70 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBone key={c} className="h-4 w-20 rounded-md" />
          ))}
        </div>

        {/* 数据行 */}
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SkeletonBone className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1">
                  <SkeletonBone className="h-4 w-36 rounded-md" />
                  <SkeletonBone className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <SkeletonBone className="h-5 w-20 rounded-full" />
              <SkeletonBone className="h-4 w-28 rounded-md" />
              <div className="flex items-center gap-2">
                <SkeletonBone className="h-7 w-12 rounded-lg" />
                <SkeletonBone className="h-7 w-12 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 语义化骨架屏：仪表盘指标卡片
 */
export function MetricCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="p-5 flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonBone className="h-3.5 w-20 rounded-md" />
            <SkeletonBone className="h-7 w-28 rounded-lg" />
            <SkeletonBone className="h-3 w-16 rounded-md" />
          </div>
          <SkeletonBone className="w-12 h-12 rounded-2xl shrink-0" />
        </SkeletonCard>
      ))}
    </div>
  );
}
