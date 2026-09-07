'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Milestone, 
  MessageSquareQuote, 
  Users, 
  Link2, 
  Cpu, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  LogOut, 
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { SafeImage } from '@/components/SafeImage';

export interface AdminNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export interface AdminMatrixGroup {
  id: string;
  name: string;
  enName: string;
  items: AdminNavItem[];
}

export const ADMIN_MATRICES: AdminMatrixGroup[] = [
  {
    id: 'overview',
    name: '概览仪表盘',
    enName: 'Overview & Analytics',
    items: [
      { title: '控制台概览', href: '/admin/dashboard', icon: LayoutDashboard, exact: true },
      { title: '访问分析看板', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'studio',
    name: '创作工坊',
    enName: 'Content Studio',
    items: [
      { title: '文章管理', href: '/admin/posts', icon: FileText, exact: true },
      { title: '新建文章', href: '/admin/posts/create', icon: PenTool },
      { title: '随记微动态', href: '/admin/memos', icon: Sparkles },
    ],
  },
  {
    id: 'taxonomy',
    name: '知识与足迹',
    enName: 'Taxonomy & Garden',
    items: [
      { title: '分类管理', href: '/admin/categories', icon: FolderTree },
      { title: '标签管理', href: '/admin/tags', icon: Tag },
      { title: '旅行足迹', href: '/admin/journey', icon: Compass },
      { title: '精选项目', href: '/admin/projects', icon: FolderGit2 },
      { title: 'Now 状态', href: '/admin/now', icon: Clock },
      { title: '成长轨迹', href: '/admin/timeline', icon: Milestone },
    ],
  },
  {
    id: 'community',
    name: '读者社区',
    enName: 'Community',
    items: [
      { title: '评论审核', href: '/admin/comments', icon: MessageSquareQuote },
      { title: '读者管理', href: '/admin/users', icon: Users },
      { title: '友链管理', href: '/admin/links', icon: Link2 },
    ],
  },
  {
    id: 'ops',
    name: '系统与智能体',
    enName: 'Settings & Ops',
    items: [
      { title: '系统与 AI 设置', href: '/admin/settings', icon: Cpu },
      { title: '安全审计日志', href: '/admin/audit-logs', icon: ShieldAlert },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: any;
  onLogout: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  currentUser,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // 快捷键监听：Cmd+B / Ctrl+B 切换折叠
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        onToggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCollapse]);

  const sidebarWidthClass = collapsed ? 'w-[68px]' : 'w-[260px]';

  return (
    <>
      {/* 移动端背景遮罩 */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* 侧边栏主体 */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#090a0f] border-r border-white/[0.08] transition-all duration-300 ease-in-out select-none ${
          mobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0'
        } ${sidebarWidthClass}`}
      >
        {/* 顶部 Brand 区域 */}
        <div className="h-14 shrink-0 flex items-center justify-between px-3.5 border-b border-white/[0.08]">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 overflow-hidden group py-1"
            title="Hayden Studio 控制台"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-500/30 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/50 transition-colors">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold tracking-wider text-white uppercase">
                    Hayden Studio
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-[10px] text-zinc-400 tracking-tight">
                  V2.0 · Linear Console
                </span>
              </div>
            )}
          </Link>

          {/* 桌面端折叠切换按钮 */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? '展开侧边栏 (Cmd+B)' : '收起侧边栏 (Cmd+B)'}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* 中间职能矩阵导航区 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-5 custom-scrollbar">
          {ADMIN_MATRICES.map((matrix) => (
            <div key={matrix.id} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-wider uppercase text-zinc-400">
                    {matrix.name}
                  </span>
                </div>
              )}
              {collapsed && (
                <div className="h-px mx-2 my-2 bg-white/[0.06]" />
              )}

              <nav className="space-y-0.5">
                {matrix.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      title={collapsed ? `${matrix.name} · ${item.title}` : undefined}
                      className={`relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'text-white bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      {/* 激活左侧微光竖条 */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-400 rounded-r shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      )}

                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'
                        }`}
                      />

                      {!collapsed && (
                        <span className="truncate tracking-wide">{item.title}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* 底部用户与操作栏 */}
        <div className="shrink-0 p-2 border-t border-white/[0.08] space-y-1 bg-[#090a0f]">
          {/* 返回前台博客 */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? '返回博客前台' : undefined}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
              collapsed ? 'justify-center px-0' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
              {!collapsed && <span className="truncate">返回博客前台</span>}
            </div>
          </Link>

          {/* 站长信息卡片与退出 */}
          <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <SafeImage
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'}
                alt={currentUser?.nickname || 'Hayden'}
                aspectRatio="1/1"
                containerClassName="w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0"
              />
              {!collapsed && (
                <div className="min-w-0 flex flex-col">
                  <span className="text-[11px] font-medium text-white truncate">
                    {currentUser?.nickname || currentUser?.username || 'Hayden Xue'}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
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
                className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
