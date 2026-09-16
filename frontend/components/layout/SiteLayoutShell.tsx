'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import { RouteProgressBar } from '@/components/ui/RouteProgressBar';
import { LoadingVisualsConfig } from '@/lib/types';
import { api } from '@/lib/api';

interface SiteLayoutShellProps {
  children: React.ReactNode;
}

export function SiteLayoutShell({ children }: SiteLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [loadingConfig, setLoadingConfig] = useState<LoadingVisualsConfig | undefined>(undefined);

  // 加载 CMS 外观与开屏动效配置
  useEffect(() => {
    api.getSettings()
      .then((res) => {
        const json = res?.pageVisualsJson;
        if (json) {
          try {
            const parsed = JSON.parse(json);
            if (parsed?.loading) {
              setLoadingConfig(parsed.loading);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);


  // 专属隐秘暗门快捷键：Cmd+Shift+L / Ctrl+Shift+L 全局唤醒站长管理通道
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        const userRaw = localStorage.getItem('hayden_user');
        const token = localStorage.getItem('hayden_token');
        let user: any = null;
        try {
          user = userRaw ? JSON.parse(userRaw) : null;
        } catch {}

        let tokenRole = '';
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1] || ''));
            tokenRole = payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : '');
          } catch {}
        }
        const role = user?.role || tokenRole;
        const isAdmin = role === 'ROLE_ADMIN' || role === 'ADMIN';

        if (token && isAdmin) {
          toast.success(t('nav.admin_verified') || '站长身份已确认，正在进入 Studio 控制台...');
          router.push('/admin/dashboard');
        } else {
          toast.info(t('nav.admin_prompt') || '已唤起站长专属入口，请先登录管理员账号');
          router.push('/admin/login');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, t]);

  const isAdminRoute = pathname === '/admin' || pathname?.startsWith('/admin/');
  const isHomePage = pathname === '/';
  const isBlogListPage = pathname === '/blog';
  const isProjectListPage = pathname === '/projects';
  const isJourneyListPage = pathname === '/journey';
  const isArticleDetailPage = pathname?.startsWith('/blog/') && pathname !== '/blog';
  const isJourneyDetailPage = pathname?.startsWith('/journey/') && pathname !== '/journey';
  const isProjectDetailPage = pathname?.startsWith('/projects/') && pathname !== '/projects';

  const isMemosPage = pathname === '/memos';
  const isLinksPage = pathname === '/links';
  const isGraphPage = pathname === '/graph';
  const isAiPage = pathname === '/ai' || pathname?.startsWith('/ai/');
  const isAboutPage = pathname === '/about';
  const isExplorePage = pathname === '/explore';

  // 100vw 通栏全景路由（首页、博客、项目、足迹、随记、友链、图谱、AI、关于、探索）
  const isFullBleedPage =
    isHomePage ||
    isBlogListPage ||
    isProjectListPage ||
    isJourneyListPage ||
    isArticleDetailPage ||
    isJourneyDetailPage ||
    isProjectDetailPage ||
    isMemosPage ||
    isLinksPage ||
    isGraphPage ||
    isAiPage ||
    isAboutPage ||
    isExplorePage;

  // 仅足迹地图剧场与 AI 数字外脑作为独立的 100svh 舞台；其余页面回归现代杂志流式排版与 Footer 呈现
  const isImmersive100SvhPage = isJourneyListPage || isAiPage;

  if (isAdminRoute) {
    // 后台路由：彻底不渲染前台 Navbar、Footer 与 AiAssistantModal，移除 max-w-6xl 与内边距约束，提供 100vw/100vh 独立画布
    return (
      <div className="w-full min-h-screen">
        <RouteProgressBar enabled={loadingConfig?.enableRouteProgress !== false} />
        {children}
      </div>
    );
  }

  // 前台路由：正常渲染 Navbar、具有受控宽度的 main 内容容器、Footer 与伴读助手，并注入全局动态环境光斑
  return (
    <div className={`relative min-h-screen flex flex-col ${isImmersive100SvhPage ? 'overflow-hidden h-screen' : 'overflow-x-clip'}`}>
      <RouteProgressBar enabled={loadingConfig?.enableRouteProgress !== false} />
      <AmbientGlow />
      <Navbar />
      <main
        className={`flex-1 w-full ${
          isImmersive100SvhPage
            ? 'h-full min-h-0 flex flex-col'
            : isFullBleedPage
            ? 'w-full'
            : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 md:pb-16'
        }`}
      >
        {children}
      </main>
      {!isImmersive100SvhPage && !isAboutPage && !isAiPage && <Footer />}
    </div>
  );
}
