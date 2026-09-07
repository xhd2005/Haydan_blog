'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from '@/lib/toast';
import { 
  AdminSidebar, 
  ADMIN_MATRICES 
} from '@/components/admin/AdminSidebar';
import { AdminCommandPalette } from '@/components/admin/AdminCommandPalette';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronRight, 
  Sparkles,
  Command,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [authorized, setAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // 初始化侧边栏折叠记忆
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // 全局快捷键 Cmd+K / Ctrl+K 唤出 Studio 命令面板
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 严格权限鉴权
  useEffect(() => {
    if (pathname === '/admin/login') {
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem('hayden_token') || localStorage.getItem('howard_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const userRaw = localStorage.getItem('hayden_user') || localStorage.getItem('howard_user');
    let user: any = null;
    try {
      user = userRaw ? JSON.parse(userRaw) : null;
    } catch {}

    let tokenRole = '';
    try {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const payload = JSON.parse(atob(payloadBase64));
        tokenRole = payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : '');
      }
    } catch {}

    const role = user?.role || tokenRole;
    const isAdmin = role === 'ROLE_ADMIN' || role === 'ADMIN';

    if (!isAdmin) {
      toast.warning('无权访问 Studio 管理控制台：需要管理员角色 (ROLE_ADMIN)');
      router.push('/');
      return;
    }

    setCurrentUser(user);
    setAuthorized(true);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('hayden_token');
    localStorage.removeItem('howard_token');
    localStorage.removeItem('hayden_user');
    localStorage.removeItem('howard_user');
    toast.info('已安全退出 Studio 管理控制台');
    router.push('/admin/login');
  };

  // 动态面包屑解析
  const breadcrumbs = useMemo(() => {
    if (!pathname) return [{ name: 'Studio', href: '/admin/dashboard' }];

    if (pathname.includes('/admin/posts/edit/')) {
      return [
        { name: 'Studio', href: '/admin/dashboard' },
        { name: '创作工坊', href: '/admin/posts' },
        { name: '编辑文章', href: pathname },
      ];
    }

    for (const matrix of ADMIN_MATRICES) {
      for (const item of matrix.items) {
        if (item.exact ? pathname === item.href : (pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)))) {
          return [
            { name: 'Studio', href: '/admin/dashboard' },
            { name: matrix.name, href: matrix.items[0]?.href || '/admin/dashboard' },
            { name: item.title, href: item.href },
          ];
        }
      }
    }

    return [
      { name: 'Studio', href: '/admin/dashboard' },
      { name: '工作台', href: pathname },
    ];
  }, [pathname]);

  // 如果访问的是登录页面，直接铺满全屏，不渲染 Sidebar 和 Topbar
  if (pathname === '/admin/login') {
    return (
      <div className="w-full min-h-screen bg-[#090a0f] text-slate-200">
        {children}
      </div>
    );
  }

  // 权限检查中骨架等待态
  if (!authorized) {
    return (
      <div className="w-full min-h-screen bg-[#090a0f] flex items-center justify-center text-zinc-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Verifying Studio Credentials & Session...</span>
        </div>
      </div>
    );
  }

  const plClass = collapsed ? 'lg:pl-[68px]' : 'lg:pl-[260px]';

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-200 antialiased selection:bg-emerald-500/20 selection:text-emerald-400 flex flex-col font-sans">
      {/* 侧边栏 */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        currentUser={currentUser}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 主工作区 */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${plClass}`}>
        {/* 顶部控制台 Topbar */}
        <header className="sticky top-0 z-30 h-14 shrink-0 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-6">
          {/* 左侧：汉堡/折叠按钮 + 面包屑 */}
          <div className="flex items-center gap-3 min-w-0">
            {/* 移动端汉堡呼出侧边栏 */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="打开侧边菜单"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* 面包屑导航 */}
            <nav className="flex items-center gap-1.5 text-xs overflow-hidden">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.name}>
                    {idx > 0 && (
                      <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
                    )}
                    {isLast ? (
                      <span className="text-zinc-200 font-medium truncate max-w-[140px] sm:max-w-[200px]">
                        {crumb.name}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors truncate hidden sm:inline"
                      >
                        {crumb.name}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* 右侧：快捷搜索面板呼出 + 主题切换 + 前台直达 + 退出 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 快速打开 Cmd+K 命令面板 */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-xs text-zinc-400 hover:text-zinc-200 transition-all group"
              title="全局命令面板 (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              <span className="hidden md:inline text-zinc-400 font-normal">搜索与快捷指令...</span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] border border-white/[0.08] text-zinc-400">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>

            {/* 主题切换 */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="切换色彩主题"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {/* 前台主页快速跳转 */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="新标签页打开博客前台"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>前台主页</span>
            </Link>

            {/* 退出登录 */}
            <button
              onClick={handleLogout}
              title="退出登录"
              className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 内容主体视口 */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>

      {/* 全局命令面板 */}
      <AdminCommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}
