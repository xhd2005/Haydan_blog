'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AiAssistantModal } from '@/components/ai/AiAssistantModal';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';

interface SiteLayoutShellProps {
  children: React.ReactNode;
}

export function SiteLayoutShell({ children }: SiteLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  // 专属隐秘暗门快捷键：Cmd+Shift+L / Ctrl+Shift+L 全局唤醒站长管理通道
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        const userRaw = localStorage.getItem('hayden_user') || localStorage.getItem('howard_user');
        const token = localStorage.getItem('hayden_token') || localStorage.getItem('howard_token');
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

  if (isAdminRoute) {
    // 后台路由：彻底不渲染前台 Navbar、Footer 与 AiAssistantModal，移除 max-w-6xl 与内边距约束，提供 100vw/100vh 独立画布
    return (
      <div className="w-full min-h-screen">
        {children}
      </div>
    );
  }

  // 前台路由：正常渲染 Navbar、具有受控宽度的 main 内容容器、Footer 与伴读助手
  return (
    <>
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>
      <Footer />
      <AiAssistantModal />
    </>
  );
}
