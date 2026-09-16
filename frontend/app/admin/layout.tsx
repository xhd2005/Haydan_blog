'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from '@/lib/toast';
import { readAuthToken, readAuthUserRaw, clearAuthStorage } from '@/lib/storage-keys';
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
  Command,
  ExternalLink
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [authorized, setAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 初始化侧边栏折叠记忆
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
      }
    } catch {}
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

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

    const token = readAuthToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const userRaw = readAuthUserRaw();
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
    clearAuthStorage();
    toast.info('已安全退出 Studio 管理控制台');
    router.push('/admin/login');
  };

  // 如果访问的是登录页面，直接铺满全屏，不渲染 Sidebar 和 Topbar，适配白瓷/曜黑双主题
  if (pathname === '/admin/login') {
    return (
      <div className="w-full min-h-screen bg-[#fcfcfd] dark:bg-[#090a0f] text-slate-900 dark:text-slate-200">
        {children}
      </div>
    );
  }

  // 权限检查中骨架等待态
  if (!authorized) {
    return (
      <div className="w-full min-h-screen bg-[#fcfcfd] dark:bg-[#090a0f] flex items-center justify-center text-slate-500 dark:text-zinc-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Verifying Studio Credentials & Session...</span>
        </div>
      </div>
    );
  }

  const plClass = collapsed ? 'lg:pl-[68px]' : 'lg:pl-[280px]';
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#090a0f] text-slate-900 dark:text-slate-200 antialiased selection:bg-emerald-500/20 selection:text-emerald-500 flex flex-col font-sans transition-colors duration-300">
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
        <header className="sticky top-0 z-30 h-14 shrink-0 bg-[#fcfcfd]/80 dark:bg-[#090a0f]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between px-4 sm:px-6 transition-colors duration-300">
          {/* 左侧：汉堡/折叠按钮 + 面包屑 */}
          <div className="flex items-center gap-3 min-w-0">
            {/* 移动端汉堡呼出侧边栏 */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              aria-label="打开侧边菜单"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* 动态面包屑导航（带 Suspense 保护支持 ?tab= 参数与去冗余） */}
            <Suspense
              fallback={
                <nav className="flex items-center gap-1.5 text-xs overflow-hidden">
                  <span className="text-slate-900 dark:text-zinc-200 font-semibold">Studio</span>
                </nav>
              }
            >
              <AdminBreadcrumbsInner />
            </Suspense>
          </div>

          {/* 右侧：快捷搜索面板呼出 + 主题切换 + 前台直达 + 退出 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 快速打开 Cmd+K 命令面板 */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition-all group cursor-pointer"
              title="全局命令面板 (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
              <span className="hidden md:inline text-slate-600 dark:text-zinc-400 font-normal">搜索与快捷指令...</span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200/80 dark:bg-white/[0.06] border border-slate-300/80 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>

            {/* 主题切换 */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? '切换至白瓷浅色模式' : '切换至极客曜黑模式'}
              className="p-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-600" />
              )}
            </button>

            {/* 前台主页快速跳转 */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="新标签页打开博客前台"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>前台主页</span>
            </Link>

            {/* 退出登录 */}
            <button
              onClick={handleLogout}
              title="退出登录"
              className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
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

function AdminBreadcrumbsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab');

  const breadcrumbs = useMemo(() => {
    if (!pathname) return [{ name: 'Studio', href: '/admin/dashboard' }];

    // 1. Dashboard 控制台概览：消除 Dashboard 同名冗余路径，仅保留 Studio > 控制台概览
    if (pathname === '/admin/dashboard') {
      return [
        { name: 'Studio', href: '/admin/dashboard' },
        { name: '控制台概览', href: '/admin/dashboard' },
      ];
    }

    // 2. 编辑文章特判
    if (pathname.includes('/admin/posts/edit/')) {
      return [
        { name: 'Studio', href: '/admin/dashboard' },
        { name: '内容创作与媒体', href: '/admin/posts' },
        { name: '编辑文章', href: pathname },
      ];
    }

    // 3. 知识分类工作台 (?tab= 与 /admin/tags 代理兼容)
    if (pathname === '/admin/categories' || pathname === '/admin/tags') {
      const activeTab = pathname === '/admin/tags' ? 'tags' : tab;
      const crumbs = [
        { name: 'Studio', href: '/admin/dashboard' },
        { name: '知识图谱与足迹', href: '/admin/categories' },
        { name: '知识分类工作台', href: '/admin/categories' },
      ];
      if (activeTab === 'tags') {
        crumbs.push({ name: '标签矩阵', href: '/admin/categories?tab=tags' });
      } else if (activeTab === 'categories') {
        crumbs.push({ name: '分类管理', href: '/admin/categories?tab=categories' });
      } else if (activeTab === 'overview') {
        crumbs.push({ name: '知识脉络', href: '/admin/categories?tab=overview' });
      }
      return crumbs;
    }

    // 4. 履历与造物工作台 (?tab= 与 /admin/timeline 代理兼容)
    if (pathname === '/admin/projects' || pathname === '/admin/timeline') {
      const activeTab = pathname === '/admin/timeline' ? 'timeline' : tab;
      const crumbs = [
        { name: 'Studio', href: '/admin/dashboard' },
        { name: '知识图谱与足迹', href: '/admin/categories' },
        { name: '履历与造物', href: '/admin/projects' },
      ];
      if (activeTab === 'timeline') {
        crumbs.push({ name: '成长编年史', href: '/admin/projects?tab=timeline' });
      } else if (activeTab === 'living') {
        crumbs.push({ name: '全景时光轴', href: '/admin/projects?tab=living' });
      } else if (activeTab === 'projects') {
        crumbs.push({ name: '精选造物', href: '/admin/projects?tab=projects' });
      }
      return crumbs;
    }

    // 6. 其他矩阵页面动态匹配
    for (const matrix of ADMIN_MATRICES) {
      for (const item of matrix.items) {
        if (
          item.exact
            ? pathname === item.href
            : pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
        ) {
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
  }, [pathname, tab]);

  return (
    <nav className="flex items-center gap-1.5 text-xs overflow-hidden">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        return (
          <React.Fragment key={`${crumb.name}-${crumb.href}-${idx}`}>
            {idx > 0 && (
              <ChevronRight className="w-3 h-3 text-slate-400 dark:text-zinc-600 shrink-0" />
            )}
            {isLast ? (
              <span className="text-slate-900 dark:text-zinc-200 font-semibold truncate max-w-[140px] sm:max-w-[200px]">
                {crumb.name}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors truncate hidden sm:inline"
              >
                {crumb.name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
