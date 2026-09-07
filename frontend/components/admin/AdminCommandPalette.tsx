'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';
import { Post } from '@/lib/types';
import { 
  Search, 
  X, 
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
  Sun, 
  Moon, 
  ExternalLink,
  ArrowRight,
  Command,
  Loader2
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
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchedPosts, setSearchedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      id: 'act-toggle-theme',
      category: '系统偏好',
      title: theme === 'dark' ? '切换为亮色模式' : '切换为暗黑模式',
      subtitle: '调整控制台与前台全局色彩主题',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#0c0d12] border border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[80vh] text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 输入框顶部 */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="输入指令、矩阵路由或文章关键字搜索 (Cmd+K)..."
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none tracking-wide"
          />
          {loadingPosts && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />}
          {query && !loadingPosts && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] border border-white/[0.1] text-zinc-400">
            ESC 退出
          </kbd>
        </div>

        {/* 结果列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {allFilteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
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
                      ? 'bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate text-zinc-200">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <span className="text-[10px] text-zinc-400 truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部按键提示脚标 */}
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3 font-mono">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">↓</kbd>
              选择
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">↵</kbd>
              执行
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <Command className="w-3 h-3" />
            <span>Hayden Studio Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
