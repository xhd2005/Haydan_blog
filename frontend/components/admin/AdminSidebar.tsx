'use client';

import React from 'react';
import { FloatingAcrylicDock, FloatingAcrylicDockProps } from './layout/FloatingAcrylicDock';
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
  Activity,
  Layers,
  HardDrive,
} from 'lucide-react';

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

export interface AdminSidebarProps extends FloatingAcrylicDockProps {}

export function AdminSidebar(props: AdminSidebarProps) {
  return <FloatingAcrylicDock {...props} />;
}
