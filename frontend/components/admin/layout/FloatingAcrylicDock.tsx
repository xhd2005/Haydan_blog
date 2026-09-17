'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { SafeImage } from '@/components/SafeImage';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useMultiTabs } from '@/context/MultiTabsContext';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  PenTool,
  Sparkles,
  FolderTree,
  Tag,
  Compass,
  FolderGit2,
  Clock,
  MessageSquareQuote,
  Users,
  Link2,
  Cpu,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  Activity,
  Layers,
  HardDrive,
  ShieldCheck,
  Wifi,
  WifiOff
} from 'lucide-react';

export interface FloatingAcrylicDockProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser?: any;
  onLogout: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// 主功能岛：创作与知识职能
export const MAIN_ISLAND_NAV = [
  {
    group: '指挥与创作',
    items: [
      { key: 'dashboard', label: '空间指挥', route: '/admin/dashboard', icon: LayoutDashboard, exact: true },
      { key: 'posts', label: '文章管理', route: '/admin/posts', icon: FileText, exact: true },
      { key: 'create-post', label: '新建文章', route: '/admin/posts/create', icon: PenTool },
      { key: 'memos', label: '灵感速记', route: '/admin/memos', icon: Sparkles },
      { key: 'media', label: '流光媒体', route: '/admin/media', icon: HardDrive },
    ]
  },
  {
    group: '知识星系与足迹',
    items: [
      { key: 'graph', label: '知识星系', route: '/admin/graph', icon: Layers },
      { key: 'categories', label: '分类标签', route: '/admin/categories', icon: FolderTree },
      { key: 'projects', label: '履历造物', route: '/admin/projects', icon: FolderGit2 },
      { key: 'journey', label: '旅行足迹', route: '/admin/journey', icon: Compass },
    ]
  },
  {
    group: '社区与互动',
    items: [
      { key: 'comments', label: '评论审核', route: '/admin/comments', icon: MessageSquareQuote },
      { key: 'users', label: '读者管理', route: '/admin/users', icon: Users },
      { key: 'links', label: '友链管理', route: '/admin/links', icon: Link2 },
    ]
  }
];

// 控制岛：系统体检、安全审计与系统设置
export const CONTROL_ISLAND_NAV = [
  { key: 'analytics', label: '访问分析', route: '/admin/analytics', icon: BarChart3 },
  { key: 'health', label: '系统体检', route: '/admin/health', icon: Activity },
  { key: 'audit-logs', label: '审计控制台', route: '/admin/audit-logs', icon: ShieldAlert },
  { key: 'settings', label: '系统设置', route: '/admin/settings', icon: Cpu },
];

export function FloatingAcrylicDock({
  collapsed,
  onToggleCollapse,
  currentUser,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}: FloatingAcrylicDockProps) {
  const pathname = usePathname();
  const { isOfflineSandbox } = useMultiTabs();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // 快捷键监听：Cmd+B / Ctrl+B 切换折叠
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        onToggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCollapse]);

  const authorName = currentUser?.nickname || currentUser?.username || 'Hayden Xue';

  return (
    <>
      {/* 移动端背景遮罩 */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 dark:bg-black/80 backdrop-blur-md lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* 
        macOS 悬浮流光亚克力独立双岛坞 
        CSS 契约包含：fixed, backdrop-blur-2xl, bg-white/80, dark:bg-neutral-900/60, border, border-slate-200/80, dark:border-white/[0.08], shadow-2xl, rounded-3xl
      */}
      <aside
        className={`fixed top-3.5 bottom-3.5 left-3.5 z-50 flex flex-col justify-between backdrop-blur-2xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-2xl rounded-3xl transition-all duration-300 ease-in-out select-none overflow-hidden ${
          mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-[120%] lg:translate-x-0'
        } ${collapsed ? 'w-[68px]' : 'w-[280px]'}`}
        data-testid="floating-acrylic-dock"
      >
        {/* ========================================================================= */}
        {/* 上岛：业务功能矩阵导航坞 (Main Island)                                  */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* 顶部 Brand 徽章区域 */}
          <div className="h-16 shrink-0 flex items-center justify-between px-3.5 border-b border-slate-200/80 dark:border-white/[0.08]">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 overflow-hidden group py-1"
              title="Hayden Studio 控制台"
            >
              <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-indigo-500/20 border border-emerald-500/30 dark:border-emerald-400/30 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(16,185,129,0.2)] group-hover:scale-105 transition-transform">
                <BrandLogo size={22} animated glow={false} />
                {/* 动态 Status Dot：翡翠绿（在线） / 琥珀橙（离线沙盒） */}
                <span
                  className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-900 transition-colors ${
                    isOfflineSandbox
                      ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse'
                      : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-ping-slow'
                  }`}
                  title={isOfflineSandbox ? '当前状态：离线本地安全沙盒' : '当前状态：在线云端实时连接'}
                />
              </div>

              {!collapsed && (
                <div className="flex flex-col min-w-0 transition-opacity duration-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tracking-wider text-slate-900 dark:text-white uppercase font-sans">
                      Hayden Studio
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOfflineSandbox ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 tracking-tight flex items-center gap-1 font-mono">
                    {isOfflineSandbox ? (
                      <>
                        <WifiOff className="w-2.5 h-2.5 text-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400">Offline Sandbox</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-2.5 h-2.5 text-emerald-500" />
                        <span>VisionOS · V2.0</span>
                      </>
                    )}
                  </span>
                </div>
              )}
            </Link>

            {/* 桌面端折叠切换胶囊 */}
            <button
              onClick={onToggleCollapse}
              title={collapsed ? '展开控制坞 (Cmd+B)' : '收起为 Mini Dock (Cmd+B)'}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 导航功能矩阵滚动区 */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-4 custom-scrollbar">
            {MAIN_ISLAND_NAV.map((group) => (
              <div key={group.group} className="space-y-1">
                {!collapsed ? (
                  <div className="px-2.5 pb-1 flex items-center justify-between">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-zinc-500">
                      {group.group}
                    </span>
                    <div className="h-px flex-1 ml-2 bg-gradient-to-r from-slate-200 dark:from-white/[0.08] to-transparent" />
                  </div>
                ) : (
                  <div className="h-px mx-2 my-1.5 bg-slate-200/80 dark:bg-white/[0.08]" />
                )}

                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? pathname === item.route
                      : pathname === item.route ||
                        (item.route !== '/admin/dashboard' && pathname.startsWith(item.route)) ||
                        (item.route === '/admin/categories' && pathname.startsWith('/admin/tags')) ||
                        (item.route === '/admin/projects' && pathname.startsWith('/admin/timeline'));

                    return (
                      <div key={item.route} className="relative">
                        <Link
                          href={item.route}
                          onClick={onCloseMobile}
                          onMouseEnter={() => setHoveredItem(item.key)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={`relative flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-medium transition-all duration-200 ${
                            isActive
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/[0.15] border border-emerald-500/30 dark:border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-semibold'
                              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-white/[0.06]'
                          } ${collapsed ? 'justify-center px-0 py-2.5' : ''}`}
                        >
                          {/* 激活微光柱 */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 dark:bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                          )}

                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-zinc-500'
                            }`}
                          />

                          {!collapsed && (
                            <span className="truncate tracking-wide">{item.label}</span>
                          )}
                        </Link>

                        {/* 折叠形态时的悬浮气泡提示 (Tooltip) */}
                        {collapsed && hoveredItem === item.key && (
                          <div className="absolute left-[72px] top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 rounded-xl bg-slate-900/90 dark:bg-neutral-800/95 text-white text-[11px] whitespace-nowrap shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            {item.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 下岛：站长控制与系统状态坞 (Control Island)                               */}
        {/* ========================================================================= */}
        <div className="shrink-0 p-2 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-black/20 space-y-2">
          {/* 控制矩阵导航小条 */}
          <div className="grid grid-cols-1 gap-0.5">
            {CONTROL_ISLAND_NAV.map((ctrl) => {
              const Icon = ctrl.icon;
              const isActive = pathname.startsWith(ctrl.route);
              return (
                <div key={ctrl.route} className="relative">
                  <Link
                    href={ctrl.route}
                    onClick={onCloseMobile}
                    onMouseEnter={() => setHoveredItem(ctrl.key)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/15 font-semibold'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100/80 dark:hover:bg-white/[0.05]'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-400" />
                    {!collapsed && <span className="truncate">{ctrl.label}</span>}
                  </Link>

                  {collapsed && hoveredItem === ctrl.key && (
                    <div className="absolute left-[72px] top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 rounded-xl bg-slate-900/90 dark:bg-neutral-800/95 text-white text-[11px] whitespace-nowrap shadow-xl border border-white/10 pointer-events-none">
                      {ctrl.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 前台直达按钮 */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? '返回博客前台' : undefined}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors ${
              collapsed ? 'justify-center px-0' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
              {!collapsed && <span className="truncate">返回博客前台</span>}
            </div>
          </Link>

          {/* 站长身份名片与安全退出 */}
          <div
            className={`flex items-center gap-2 p-1.5 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <SafeImage
                src={currentUser?.avatar || DEFAULT_AVATAR}
                alt={authorName}
                aspectRatio="1/1"
                containerClassName="w-7 h-7 rounded-xl overflow-hidden border border-slate-200 dark:border-white/20 shrink-0"
              />
              {!collapsed && (
                <div className="min-w-0 flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                    {authorName}
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    ROLE_ADMIN
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={onLogout}
                title="退出管理控制台"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
