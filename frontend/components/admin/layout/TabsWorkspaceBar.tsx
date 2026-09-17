'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiTabs, TabItem } from '@/context/MultiTabsContext';
import {
  X,
  LayoutDashboard,
  FileText,
  PenTool,
  Sparkles,
  HardDrive,
  Layers,
  Compass,
  FolderTree,
  Tag,
  FolderGit2,
  Clock,
  MessageSquareQuote,
  Users,
  Link2,
  Cpu,
  BarChart3,
  ShieldAlert,
  Activity,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  WifiOff
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  PenTool,
  Sparkles,
  HardDrive,
  Layers,
  Compass,
  FolderTree,
  Tag,
  FolderGit2,
  Clock,
  MessageSquareQuote,
  Users,
  Link2,
  Cpu,
  BarChart3,
  ShieldAlert,
  Activity,
};

export function TabsWorkspaceBar() {
  const router = useRouter();
  const {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    isOfflineSandbox,
  } = useMultiTabs();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTabs = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleTabClick = (tab: TabItem) => {
    if (tab.id !== activeTabId) {
      openTab(tab);
      router.push(tab.id);
    }
  };

  const handleClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    closeTab(id);
  };

  const mountedCount = tabs.filter((t) => t.domMounted).length;

  return (
    <div
      className="relative z-20 h-10 px-3 sm:px-4 bg-slate-100/70 dark:bg-black/30 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2 select-none overflow-hidden"
      data-testid="tabs-workspace-bar"
    >
      {/* 离线沙盒警告指示（若处于离线状态） */}
      {isOfflineSandbox && (
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-medium shrink-0 animate-pulse">
          <WifiOff className="w-3 h-3" />
          <span>离线沙盒已激活</span>
        </div>
      )}

      {/* 左滚动按钮（溢出时可用） */}
      <button
        onClick={() => scrollTabs(-180)}
        className="hidden sm:flex items-center justify-center w-5 h-7 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] shrink-0 transition-colors"
        title="向左滚动标签"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* 多标签主滑动条 */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const IconComponent = ICON_MAP[tab.icon || 'FileText'] || FileText;

          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`group relative flex items-center gap-2 h-7 px-3 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-neutral-800/90 text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/[0.12] shadow-sm font-semibold'
                  : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-white/[0.04]'
              }`}
              title={`${tab.title} (${tab.id})`}
            >
              {/* 脏状态发光指示点 */}
              {tab.isDirty && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse shrink-0"
                  title="未保存更改"
                />
              )}

              {/* 标签图标 */}
              <IconComponent
                className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-zinc-500'
                }`}
              />

              {/* 标签文本 */}
              <span className="truncate max-w-[120px] sm:max-w-[160px] text-[11px] tracking-wide">
                {tab.title}
              </span>

              {/* 关闭按钮 */}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => handleClose(e, tab.id)}
                  className="w-4 h-4 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100"
                  title="关闭标签"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 右滚动按钮 */}
      <button
        onClick={() => scrollTabs(180)}
        className="hidden sm:flex items-center justify-center w-5 h-7 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] shrink-0 transition-colors"
        title="向右滚动标签"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* 右侧保活统计与操作菜单 */}
      <div className="relative flex items-center gap-1.5 shrink-0 pl-1 border-l border-slate-200/80 dark:border-white/[0.08]">
        {/* LRU 保活计数胶囊 */}
        <span
          className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 dark:text-zinc-500 bg-slate-200/60 dark:bg-white/[0.04]"
          title="活跃保活 DOM 数量 (上限 6 个)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{mountedCount}/6 活跃</span>
        </span>

        {/* 菜单下拉触发 */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors"
          title="标签页操作"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* 下拉浮层 */}
        {menuOpen && (
          <div
            className="absolute right-0 top-9 z-50 w-44 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.12] shadow-2xl p-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              onClick={() => {
                closeOtherTabs(activeTabId);
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors flex items-center justify-between"
            >
              <span>关闭其他标签</span>
              <span className="text-[10px] font-mono text-slate-400">Alt+W</span>
            </button>
            <button
              onClick={() => {
                closeAllTabs();
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors"
            >
              <span>关闭全部标签</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
