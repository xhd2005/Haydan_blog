'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { triggerRouteWebGLCleanup } from '@/lib/webglCleanup';
import { saveFormSnapshot } from '@/lib/storage/indexedDbSandbox';
import { toast } from '@/lib/toast';

export interface TabItem {
  id: string;              // 路由路径，如 '/admin/posts'
  title: string;           // 标签标题，如 '文章管理'
  icon?: string;           // 图标名称
  isDirty?: boolean;       // 表单脏状态
  lastActive: number;      // LRU 时间戳
  snapshot?: Record<string, any>; // 表单与光标快照
  domMounted?: boolean;    // 是否处于挂载活跃状态 (LRU 限制最多 6 个)
}

export interface MultiTabsContextValue {
  tabs: TabItem[];
  activeTabId: string;
  openTab: (tab: Omit<TabItem, 'lastActive'>) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  setTabDirty: (id: string, isDirty: boolean) => void;
  updateTabSnapshot: (id: string, snapshot: Record<string, any>) => void;
  isOfflineSandbox: boolean;
  setIsOfflineSandbox: (offline: boolean) => void;
}

const MAX_ACTIVE_TABS = 6;
const TABS_STORAGE_KEY = 'hayden_studio_workspace_tabs';

const MultiTabsContext = createContext<MultiTabsContextValue | null>(null);

// 路由到规范标题与图标的映射表
export const ROUTE_TAB_METADATA: Record<string, { title: string; icon: string }> = {
  '/admin/dashboard': { title: '空间指挥', icon: 'LayoutDashboard' },
  '/admin/analytics': { title: '访问分析', icon: 'BarChart3' },
  '/admin/audit-logs': { title: '审计控制台', icon: 'ShieldAlert' },
  '/admin/health': { title: '系统体检', icon: 'Activity' },
  '/admin/posts': { title: '文章管理', icon: 'FileText' },
  '/admin/posts/create': { title: '新建文章', icon: 'PenTool' },
  '/admin/memos': { title: '灵感速记', icon: 'Sparkles' },
  '/admin/media': { title: '流光媒体', icon: 'HardDrive' },
  '/admin/graph': { title: '知识星系', icon: 'Layers' },
  '/admin/categories': { title: '分类标签', icon: 'FolderTree' },
  '/admin/tags': { title: '标签矩阵', icon: 'Tag' },
  '/admin/projects': { title: '履历造物', icon: 'FolderGit2' },
  '/admin/timeline': { title: '时光年表', icon: 'Clock' },
  '/admin/journey': { title: '旅行足迹', icon: 'Compass' },
  '/admin/comments': { title: '评论审核', icon: 'MessageSquareQuote' },
  '/admin/users': { title: '读者管理', icon: 'Users' },
  '/admin/links': { title: '友链管理', icon: 'Link2' },
  '/admin/settings': { title: '系统设置', icon: 'Cpu' },
};

function getMetadataForRoute(route: string): { title: string; icon: string } {
  if (ROUTE_TAB_METADATA[route]) {
    return ROUTE_TAB_METADATA[route];
  }
  if (route.startsWith('/admin/posts/edit/')) {
    const id = route.split('/').pop();
    return { title: `编辑文章 #${id}`, icon: 'PenTool' };
  }
  const clean = route.replace('/admin/', '');
  return {
    title: clean.charAt(0).toUpperCase() + clean.slice(1),
    icon: 'FileText',
  };
}

export function MultiTabsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // 初始化标签页：默认包含控制台概览
  const [tabs, setTabs] = useState<TabItem[]>(() => {
    return [
      {
        id: '/admin/dashboard',
        title: '空间指挥',
        icon: 'LayoutDashboard',
        isDirty: false,
        lastActive: Date.now(),
        domMounted: true,
      },
    ];
  });

  const [activeTabId, setActiveTabId] = useState<string>('/admin/dashboard');
  const [isOfflineSandbox, setIsOfflineSandbox] = useState<boolean>(false);

  // 网络状态检测与沙盒模式同步
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOfflineSandbox(false);
      toast.success('网络已恢复连接，云端同步通道就绪');
    };

    const handleOffline = () => {
      setIsOfflineSandbox(true);
      toast.warning('检测到网络离线，已无缝切换至本地 IndexedDB 安全沙盒');
    };

    if (!navigator.onLine) {
      setIsOfflineSandbox(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // LRU 调度器：限制最多 MAX_ACTIVE_TABS (6) 个 DOM 保活挂载
  const enforceTabsLru = useCallback((tabList: TabItem[], currentActiveId: string): TabItem[] => {
    if (tabList.length <= MAX_ACTIVE_TABS) {
      return tabList.map((t) => ({ ...t, domMounted: true }));
    }

    // 按 lastActive 降序排序
    const sorted = [...tabList].sort((a, b) => b.lastActive - a.lastActive);
    const activeSet = new Set<string>();

    if (currentActiveId) {
      activeSet.add(currentActiveId);
    }

    for (const t of sorted) {
      if (activeSet.size >= MAX_ACTIVE_TABS) break;
      activeSet.add(t.id);
    }

    return tabList.map((t) => ({
      ...t,
      domMounted: activeSet.has(t.id),
    }));
  }, []);

  // 打开或激活标签页
  const openTab = useCallback(
    (tabInput: Omit<TabItem, 'lastActive'>) => {
      const now = Date.now();
      setActiveTabId(tabInput.id);

      setTabs((prev) => {
        const index = prev.findIndex((t) => t.id === tabInput.id);
        let updated: TabItem[];

        if (index >= 0) {
          updated = prev.map((t, idx) => {
            if (idx === index) {
              return {
                ...t,
                title: tabInput.title || t.title,
                icon: tabInput.icon || t.icon,
                isDirty: tabInput.isDirty !== undefined ? tabInput.isDirty : t.isDirty,
                lastActive: now,
                domMounted: true,
              };
            }
            return t;
          });
        } else {
          const meta = getMetadataForRoute(tabInput.id);
          const newTab: TabItem = {
            id: tabInput.id,
            title: tabInput.title || meta.title,
            icon: tabInput.icon || meta.icon,
            isDirty: !!tabInput.isDirty,
            lastActive: now,
            domMounted: true,
            snapshot: tabInput.snapshot,
          };
          updated = [...prev, newTab];
        }

        return enforceTabsLru(updated, tabInput.id);
      });
    },
    [enforceTabsLru]
  );

  // 关闭指定标签页
  const closeTab = useCallback(
    (id: string) => {
      // 1. 如果关闭的是 3D 页面，显式销毁 WebGL 上下文
      if (id.startsWith('/admin/graph') || id.startsWith('/admin/journey')) {
        triggerRouteWebGLCleanup(id);
      }

      setTabs((prev) => {
        const targetIndex = prev.findIndex((t) => t.id === id);
        if (targetIndex === -1) return prev;

        const wasActive = activeTabId === id;
        const updated = prev.filter((t) => t.id !== id);

        let nextActiveId = activeTabId;
        if (wasActive) {
          if (updated.length > 0) {
            const nextIndex = Math.min(targetIndex, updated.length - 1);
            nextActiveId = updated[nextIndex].id;
            updated[nextIndex].lastActive = Date.now();
            updated[nextIndex].domMounted = true;
          } else {
            nextActiveId = '';
          }
        }

        setActiveTabId(nextActiveId);

        if (wasActive && nextActiveId) {
          router.push(nextActiveId);
        } else if (wasActive && !nextActiveId) {
          router.push('/admin/dashboard');
        }

        return enforceTabsLru(updated, nextActiveId);
      });
    },
    [activeTabId, enforceTabsLru, router]
  );

  // 关闭其他标签页
  const closeOtherTabs = useCallback(
    (preserveId: string) => {
      setTabs((prev) => {
        // 清理被关闭的 3D 页面 WebGL 上下文
        prev.forEach((t) => {
          if (t.id !== preserveId && (t.id.startsWith('/admin/graph') || t.id.startsWith('/admin/journey'))) {
            triggerRouteWebGLCleanup(t.id);
          }
        });

        const preserved = prev.filter((t) => t.id === preserveId);
        if (preserved.length > 0) {
          preserved[0].domMounted = true;
          preserved[0].lastActive = Date.now();
        }
        setActiveTabId(preserveId);
        router.push(preserveId);
        return preserved;
      });
    },
    [router]
  );

  // 关闭全部标签页
  const closeAllTabs = useCallback(() => {
    setTabs((prev) => {
      prev.forEach((t) => {
        if (t.id.startsWith('/admin/graph') || t.id.startsWith('/admin/journey')) {
          triggerRouteWebGLCleanup(t.id);
        }
      });
      return [];
    });
    setActiveTabId('');
    router.push('/admin/dashboard');
  }, [router]);

  // 设置标签脏状态
  const setTabDirty = useCallback((id: string, isDirty: boolean) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDirty } : t))
    );
  }, []);

  // 更新快照并异步存入 IndexedDB 沙盒
  const updateTabSnapshot = useCallback((id: string, snapshot: Record<string, any>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, snapshot } : t))
    );

    if (snapshot && typeof snapshot === 'object') {
      saveFormSnapshot(
        id,
        snapshot.formData || snapshot,
        snapshot.cursorPosition || { start: 0, end: 0 },
        snapshot.scrollOffset || 0
      ).catch(() => {});
    }
  }, []);

  // 监听路由变化，自动打开或定位对应标签页
  useEffect(() => {
    if (!pathname || pathname === '/admin/login' || !pathname.startsWith('/admin')) {
      return;
    }

    const meta = getMetadataForRoute(pathname);
    openTab({
      id: pathname,
      title: meta.title,
      icon: meta.icon,
    });
  }, [pathname, openTab]);

  const value = useMemo<MultiTabsContextValue>(
    () => ({
      tabs,
      activeTabId,
      openTab,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      setTabDirty,
      updateTabSnapshot,
      isOfflineSandbox,
      setIsOfflineSandbox,
    }),
    [
      tabs,
      activeTabId,
      openTab,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      setTabDirty,
      updateTabSnapshot,
      isOfflineSandbox,
    ]
  );

  return <MultiTabsContext.Provider value={value}>{children}</MultiTabsContext.Provider>;
}

export function useMultiTabs(): MultiTabsContextValue {
  const ctx = useContext(MultiTabsContext);
  if (!ctx) {
    throw new Error('useMultiTabs must be used within a MultiTabsProvider');
  }
  return ctx;
}
