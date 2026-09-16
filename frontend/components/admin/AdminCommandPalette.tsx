'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';
import { Post } from '@/lib/types';
import { 
  Search, 
  X, 
  BarChart3, 
  FileText, 
  PenTool, 
  Sparkles, 
  ShieldAlert, 
  Sun, 
  Moon, 
  ExternalLink,
  ArrowRight,
  Command,
  Loader2,
  Activity,
  FolderTree,
  Clock,
  HardDrive
} from 'lucide-react';
import { ADMIN_MATRICES } from './AdminSidebar';

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  badge?: string;
}

export function AdminCommandPalette({ isOpen, onClose }: AdminCommandPaletteProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchedPosts, setSearchedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = resolvedTheme === 'dark';

  // 快捷动作指令库
  const quickActions: CommandItem[] = [
    {
      id: 'act-new-post',
      category: '快捷动作',
      title: '新建文章 (Markdown Studio)',
      subtitle: '跳转双栏沉浸式创作工坊',
      icon: PenTool,
      action: () => router.push('/admin/posts/create'),
      badge: '创作',
    },
    {
      id: 'act-new-memo',
      category: '快捷动作',
      title: '发布随记微动态',
      subtitle: '上传即时灵感与本地图片',
      icon: Sparkles,
      action: () => router.push('/admin/memos'),
      badge: '动态',
    },
    {
      id: 'act-analytics',
      category: '快捷动作',
      title: '查看全站访问分析',
      subtitle: '今日 PV/UV、来源分布与热榜',
      icon: BarChart3,
      action: () => router.push('/admin/analytics'),
      badge: '数据',
    },
    {
      id: 'act-audit',
      category: '快捷动作',
      title: '检查安全与审计日志',
      subtitle: '管理员登录流水与关键写操作',
      icon: ShieldAlert,
      action: () => router.push('/admin/audit-logs'),
      badge: '安全',
    },
    {
      id: 'act-health',
      category: '快捷动作',
      title: '全站资产健康体检 (Health Scan)',
      subtitle: '一键扫描内外死链、失效图片与孤岛数据',
      icon: Activity,
      action: () => router.push('/admin/health'),
      badge: '体检',
    },
    {
      id: 'act-categories',
      category: '快捷动作',
      title: '知识分类与标签工作台',
      subtitle: '同屏联动维护文章分类树与多维标签池',
      icon: FolderTree,
      action: () => router.push('/admin/categories'),
      badge: '分类',
    },
    {
      id: 'act-export',
      category: '快捷动作',
      title: '全站 Markdown 离线备份导出',
      subtitle: '打包下载全量博文 .zip 与系统快照',
      icon: HardDrive,
      action: () => router.push('/admin/settings'),
      badge: '备份',
    },
    {
      id: 'act-toggle-theme',
      category: '系统偏好',
      title: isDark ? '切换为白瓷浅色模式' : '切换为曜黑暗黑模式',
      subtitle: '调整控制台与全局色彩主题',
      icon: isDark ? Sun : Moon,
      action: () => setTheme(isDark ? 'light' : 'dark'),
      badge: '主题',
    },
    {
      id: 'act-visit-site',
      category: '系统偏好',
      title: '访问前台博客主页',
      subtitle: '新标签页打开 Hayden 博客前台',
      icon: ExternalLink,
      action: () => window.open('/', '_blank'),
      badge: '前台',
    },
  ];

  // 从五大矩阵提取全部路由导航条目
  const matrixItems: CommandItem[] = ADMIN_MATRICES.flatMap((matrix) =>
    matrix.items.map((item) => ({
      id: `nav-${item.href}`,
      category: matrix.name,
      title: item.title,
      subtitle: item.href,
      icon: item.icon,
      action: () => router.push(item.href),
      badge: matrix.enName.split(' ')[0],
    }))
  );

  // 搜索文章
  useEffect(() => {
    if (!query.trim()) {
      setSearchedPosts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingPosts(true);
      try {
        const res = await api.getAdminPosts({ keyword: query.trim(), pageSize: 5 });
        setSearchedPosts(res.records || []);
      } catch {
        setSearchedPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // 构建展示的命令列表
  const normalizedQuery = query.trim().toLowerCase();
  
  const filteredActions = quickActions.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(normalizedQuery))
  );

  const filteredMatrices = matrixItems.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.subtitle?.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery)
  );

  const postItems: CommandItem[] = searchedPosts.map((post) => ({
    id: `post-${post.id}`,
    category: '文章搜索结果',
    title: post.title,
    subtitle: `ID: #${post.id} · 状态: ${post.status} · 阅读: ${post.viewCount || 0}`,
    icon: FileText,
    action: () => router.push(`/admin/posts/edit/${post.id}`),
    badge: post.status === 'PUBLISHED' ? '已发布' : '草稿',
  }));

  const allFilteredItems: CommandItem[] = [
    ...filteredActions,
    ...filteredMatrices,
    ...postItems,
  ];

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allFilteredItems.length ? (prev + 1) % allFilteredItems.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allFilteredItems.length ? (prev - 1 + allFilteredItems.length) % allFilteredItems.length : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allFilteredItems[selectedIndex]) {
          allFilteredItems[selectedIndex].action();
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allFilteredItems, selectedIndex, onClose]);

  // 打开时自动聚焦输入框并重置选中
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#fcfcfd] dark:bg-[#0c0d12] border border-slate-200 dark:border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[80vh] text-slate-900 dark:text-slate-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 输入框顶部 */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02]">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="输入指令、矩阵路由或文章关键字搜索 (Cmd+K)..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none tracking-wide"
          />
          {loadingPosts && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />}
          {query && !loadingPosts && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200/70 dark:bg-white/[0.06] border border-slate-300/70 dark:border-white/[0.1] text-slate-600 dark:text-zinc-400">
            ESC 退出
          </kbd>
        </div>

        {/* 结果列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {allFilteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
              未找到与「{query}」匹配的指令或内容
            </div>
          ) : (
            allFilteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] font-medium'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-white/[0.06]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate text-slate-900 dark:text-zinc-200">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-zinc-400 border border-slate-200/50 dark:border-transparent">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-zinc-400 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部按键提示脚标 */}
        <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.08]">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.08]">↓</kbd>
              选择
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.08]">↵</kbd>
              执行
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500">
            <Command className="w-3 h-3" />
            <span>Hayden Studio Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
