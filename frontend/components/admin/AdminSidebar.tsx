'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
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
  ShieldCheck,
  HardDrive,
  Layers,
  Activity
} from 'lucide-react';
import { SafeImage } from '@/components/SafeImage';
import { BrandLogo } from '@/components/ui/BrandLogo';

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
    name: '控制台与分析',
    enName: 'Console & Analytics',
    items: [
      { title: '控制台概览', href: '/admin/dashboard', icon: LayoutDashboard, exact: true },
      { title: '访问分析看板', href: '/admin/analytics', icon: BarChart3 },
      { title: '安全审计日志', href: '/admin/audit-logs', icon: ShieldAlert },
      { title: '资产健康体检', href: '/admin/health', icon: Activity },
    ],
  },
  {
    id: 'studio',
    name: '内容创作与媒体',
    enName: 'Creative Studio & Media',
    items: [
      { title: '文章管理', href: '/admin/posts', icon: FileText, exact: true },
      { title: '新建文章', href: '/admin/posts/create', icon: PenTool },
      { title: '随记微动态', href: '/admin/memos', icon: Sparkles },
      { title: '媒体资产中心', href: '/admin/media', icon: HardDrive },
    ],
  },
  {
    id: 'taxonomy',
    name: '知识图谱与足迹',
    enName: 'Knowledge & Footprints',
    items: [
      { title: '知识图谱', href: '/admin/graph', icon: Layers },
      { title: '知识分类工作台', href: '/admin/categories', icon: FolderTree },
      { title: '履历与造物', href: '/admin/projects', icon: FolderGit2 },
      { title: '旅行足迹', href: '/admin/journey', icon: Compass },
    ],
  },
  {
    id: 'community',
    name: '读者社区与互动',
    enName: 'Reader Community & Social',
    items: [
      { title: '评论审核', href: '/admin/comments', icon: MessageSquareQuote },
      { title: '读者管理', href: '/admin/users', icon: Users },
      { title: '友链管理', href: '/admin/links', icon: Link2 },
    ],
  },
  {
    id: 'ops',
    name: '系统设置与基建',
    enName: 'System Infrastructure',
    items: [
      { title: '系统与 AI 设置', href: '/admin/settings', icon: Cpu },
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

  // 快捷键监听：Cmd+B / Ctrl+B 切换折叠（输入框/文本域时免除拦截，防误触冲突）
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

  const sidebarWidthClass = collapsed ? 'w-[68px]' : 'w-[280px]';

  return (
    <>
      {/* 移动端背景遮罩 */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 dark:bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* 侧边栏主体 */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#fcfcfd] dark:bg-[#090a0f] border-r border-slate-200 dark:border-white/[0.08] transition-all duration-300 ease-in-out select-none ${
          mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'
        } ${sidebarWidthClass}`}
      >
        {/* 顶部 Brand 区域 */}
        <div className="h-14 shrink-0 flex items-center justify-between px-3.5 border-b border-slate-200 dark:border-white/[0.08] transition-colors duration-300">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 overflow-hidden group py-1"
            title="Hayden Studio 控制台"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/20 border border-emerald-500/25 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/40 transition-colors">
              <BrandLogo size={20} animated glow={false} />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                    Hayden Studio
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 tracking-tight">
                  V2.0 · Mission Console
                </span>
              </div>
            )}
          </Link>

          {/* 桌面端折叠切换按钮 */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? '展开侧边栏 (Cmd+B)' : '收起侧边栏 (Cmd+B)'}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* 中间职能矩阵导航区 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3.5 space-y-6 custom-scrollbar">
          {ADMIN_MATRICES.map((matrix) => (
            <div key={matrix.id} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 pb-1.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-zinc-500">
                      {matrix.name}
                    </span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-slate-300 dark:text-zinc-600">
                      {matrix.enName}
                    </span>
                  </div>
                  {/* 分组极光发线（任务控制台视觉分隔） */}
                  <div className="h-px bg-gradient-to-r from-emerald-500/30 via-slate-200 dark:via-white/[0.06] to-transparent" aria-hidden="true" />
                </div>
              )}
              {collapsed && (
                <div className="h-px mx-2 my-2 bg-slate-200 dark:bg-white/[0.06]" />
              )}

              <nav className="space-y-0.5">
                {matrix.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href ||
                      (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)) ||
                      (item.href === '/admin/categories' && pathname.startsWith('/admin/tags')) ||
                      (item.href === '/admin/projects' && pathname.startsWith('/admin/timeline'));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      title={collapsed ? `${matrix.name} · ${item.title}` : undefined}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'text-emerald-700 dark:text-white bg-emerald-500/10 dark:bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] font-semibold'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100/80 dark:hover:bg-white/[0.04]'
                      } ${collapsed ? 'justify-center px-0 py-2.5' : ''}`}
                    >
                      {/* 激活左侧微光竖条 */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 dark:bg-emerald-400 rounded-r shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      )}

                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-zinc-500'
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
        <div className="shrink-0 p-2 border-t border-slate-200 dark:border-white/[0.08] space-y-1 bg-[#fcfcfd] dark:bg-[#090a0f] transition-colors duration-300">
          {/* 返回前台博客 */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? '返回博客前台' : undefined}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors ${
              collapsed ? 'justify-center px-0' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
              {!collapsed && <span className="truncate">返回博客前台</span>}
            </div>
          </Link>

          {/* 站长信息卡片与退出 */}
          <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-100/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] transition-colors ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <SafeImage
                src={currentUser?.avatar || DEFAULT_AVATAR}
                alt={currentUser?.nickname || 'Hayden'}
                aspectRatio="1/1"
                containerClassName="w-6 h-6 rounded-full overflow-hidden border border-slate-300 dark:border-white/20 shrink-0"
              />
              {!collapsed && (
                <div className="min-w-0 flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser?.nickname || currentUser?.username || 'Hayden Xue'}
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
                className="p-1 rounded text-slate-400 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
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
