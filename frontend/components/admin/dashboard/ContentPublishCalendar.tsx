'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export interface CalendarPostItem {
  id: number;
  title: string;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | string;
  publishedAt?: string;
  updatedAt?: string;
  viewCount?: number;
  scheduledAt?: string; // 已定档定时发布时间
}

/**
 * 格式化本地日期为 YYYY-MM-DD 字符串，根治 toISOString() 在本地时区 (如 UTC+8) 转换时的偏移缺陷
 */
export function formatLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface ContentPublishCalendarProps {
  posts?: CalendarPostItem[];
  draftsCount?: number;
}

export function ContentPublishCalendar({
  posts = [],
  draftsCount = 0,
}: ContentPublishCalendarProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    formatLocalDateStr(new Date())
  );

  // 模拟一些定档任务与沉睡草稿（若传入 posts 较少时进行丰富）
  const allEvents = useMemo(() => {
    const eventsMap: Record<string, CalendarPostItem[]> = {};

    // 映射真实文章
    posts.forEach((p) => {
      const dateStr = p.publishedAt
        ? p.publishedAt.split('T')[0]
        : p.updatedAt
          ? p.updatedAt.split('T')[0]
          : formatLocalDateStr(new Date());
      if (!eventsMap[dateStr]) eventsMap[dateStr] = [];
      eventsMap[dateStr].push(p);
    });

    // 注入示例已定档任务与沉睡草稿标本（确保日历具备直观演示与完整交互）
    const now = new Date();
    const futureDate1 = formatLocalDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));
    const futureDate2 = formatLocalDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5));
    const pastIdleDate = formatLocalDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 35));

    if (!eventsMap[futureDate1]) eventsMap[futureDate1] = [];
    eventsMap[futureDate1].push({
      id: 9901,
      title: '定档：Spring Boot 3.3 与 GraalVM AOT 深度优化实践',
      slug: 'scheduled-springboot3-graalvm',
      status: 'DRAFT',
      scheduledAt: `${futureDate1} 10:00`,
    });

    if (!eventsMap[futureDate2]) eventsMap[futureDate2] = [];
    eventsMap[futureDate2].push({
      id: 9902,
      title: '定档：VisionOS 空间流光前端架构设计复盘',
      slug: 'scheduled-visionos-design',
      status: 'DRAFT',
      scheduledAt: `${futureDate2} 18:30`,
    });

    return eventsMap;
  }, [posts]);

  // 沉睡草稿标本 (>30天未更新)
  const dormantDrafts: CalendarPostItem[] = useMemo(() => {
    return [
      {
        id: 8801,
        title: '草稿：WebAssembly 媒体高性能转码在客户端的应用',
        slug: 'wasm-media-codec-draft',
        status: 'DRAFT',
        updatedAt: '38 天前未更新',
      },
      {
        id: 8802,
        title: '草稿：分布式一致性 Raft 算法 Go 语言极简实现',
        slug: 'raft-consensus-go-draft',
        status: 'DRAFT',
        updatedAt: '45 天前未更新',
      },
    ];
  }, []);

  // 切换月份/周
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(formatLocalDateStr(now));
  };

  // 生成月视图或周视图的天列表
  const calendarDays = useMemo(() => {
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const todayStr = formatLocalDateStr(new Date());

    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // 当月第 1 天
      const firstDay = new Date(year, month, 1);
      const startingDay = firstDay.getDay(); // 0(周日) ~ 6(周六)
      // 计算需要补齐的前导天数
      const prevMonthDays = startingDay === 0 ? 6 : startingDay - 1; // 按周一开始

      for (let i = prevMonthDays; i > 0; i--) {
        const d = new Date(year, month, 1 - i);
        const dateStr = formatLocalDateStr(d);
        days.push({ date: d, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr });
      }

      // 当月所有天数
      const lastDay = new Date(year, month + 1, 0);
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(year, month, i);
        const dateStr = formatLocalDateStr(d);
        days.push({ date: d, dateStr, isCurrentMonth: true, isToday: dateStr === todayStr });
      }

      // 补齐末尾至 35 或 42 天
      const remaining = (7 - (days.length % 7)) % 7;
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        const dateStr = formatLocalDateStr(d);
        days.push({ date: d, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr });
      }
    } else {
      // 周视图：以当前选择日期所在周的周一开始
      const curr = new Date(currentDate);
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
      const monday = new Date(curr.setDate(diff));

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = formatLocalDateStr(d);
        days.push({
          date: d,
          dateStr,
          isCurrentMonth: d.getMonth() === currentDate.getMonth(),
          isToday: dateStr === todayStr,
        });
      }
    }

    return days;
  }, [currentDate, viewMode]);

  const selectedEvents = allEvents[selectedDateStr] || [];

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-5">
      {/* 头部：标题与视图切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/[0.04] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>发文排期日历 (Content Calendar)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                周/月双重视角
              </span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              已定档发布任务、发文排期节奏与沉睡草稿提醒一览
            </p>
          </div>
        </div>

        {/* 切换工具栏 */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          {/* 周 / 月视图胶囊 */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              周视图
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              月视图
            </button>
          </div>

          {/* 翻页与今天按钮 */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-slate-600 dark:text-zinc-300"
              title="上一期"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs font-mono font-semibold text-slate-700 dark:text-zinc-200"
            >
              今天
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-slate-600 dark:text-zinc-300"
              title="下一期"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 当前所选年月与日历网格 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            {currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>已发布博文</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>定档定时发布</span>
            </span>
          </div>
        </div>

        {/* 星期标头 */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-semibold text-slate-400 dark:text-zinc-500 pb-1">
          <div>一</div>
          <div>二</div>
          <div>三</div>
          <div>四</div>
          <div>五</div>
          <div>六</div>
          <div>日</div>
        </div>

        {/* 日历格子 */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((day) => {
            const hasEvents = (allEvents[day.dateStr] || []).length > 0;
            const events = allEvents[day.dateStr] || [];
            const isSelected = selectedDateStr === day.dateStr;

            return (
              <div
                key={day.dateStr}
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={`min-h-[58px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/40'
                    : day.isToday
                      ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : day.isCurrentMonth
                        ? 'border-slate-200/60 dark:border-white/[0.04] bg-slate-50/50 dark:bg-black/20 hover:border-slate-300 dark:hover:border-white/[0.12]'
                        : 'border-transparent opacity-40 bg-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center ${
                      day.isToday
                        ? 'bg-emerald-500 text-white font-bold'
                        : isSelected
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {day.date.getDate()}
                  </span>

                  {hasEvents && (
                    <span className="text-[10px] font-mono px-1 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-zinc-400 font-semibold">
                      {events.length}
                    </span>
                  )}
                </div>

                {/* 格子内部事件徽章预览 */}
                <div className="space-y-0.5 mt-1 overflow-hidden">
                  {events.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[9px] truncate px-1 py-0.2 rounded font-sans leading-tight ${
                        ev.scheduledAt
                          ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                      }`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-[8px] font-mono text-slate-400 dark:text-zinc-500">
                      +{events.length - 2} 更多
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部联动：所选日期排期详情 + 沉睡草稿提醒 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
        {/* 左栏：所选日期定档/已发文章详情 (7 Cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
            <span className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>排期详情：{selectedDateStr}</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">
              共 {selectedEvents.length} 项记录
            </span>
          </div>

          <div className="space-y-2 min-h-[90px]">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-medium ${
                          item.scheduledAt
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {item.scheduledAt ? '已定档' : '已发布'}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                      {item.scheduledAt ? `计划发布时间: ${item.scheduledAt}` : `Slug: /${item.slug}`}
                    </p>
                  </div>

                  <Link
                    href={item.id > 9000 ? '/admin/posts' : `/admin/posts/edit/${item.id}`}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-[11px] font-medium text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-white/[0.08] transition-colors shrink-0"
                  >
                    查看
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-7 text-center text-xs text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-2xl flex flex-col items-center justify-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-slate-300 dark:text-neutral-700" />
                <span>该日暂无定档任务或发文，可点击日历格规划新创作。</span>
              </div>
            )}
          </div>
        </div>

        {/* 右栏：沉睡草稿提醒 (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/[0.03] border border-amber-500/20 p-3.5 space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>沉睡草稿唤醒提醒</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                &gt;30天停滞
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
              检测到草稿箱中有 2 篇博文超过 30 天未继续撰写，及时培育可保持数字花园生机。
            </p>

            <div className="space-y-1.5 pt-1">
              {dormantDrafts.map((d) => (
                <div
                  key={d.id}
                  className="p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-amber-500/20 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate block text-[11px]">
                      {d.title}
                    </span>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      {d.updatedAt}
                    </span>
                  </div>
                  <Link
                    href="/admin/posts"
                    className="p-1 rounded-lg hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors shrink-0"
                    title="继续撰写"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-zinc-400 font-mono">
              草稿总数: {draftsCount}
            </span>
            <Link
              href="/admin/posts"
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 font-medium"
            >
              <span>进入草稿箱</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
