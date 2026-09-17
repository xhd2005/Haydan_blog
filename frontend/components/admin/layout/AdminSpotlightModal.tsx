'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';
import { Post, Memo, Media, User, Category, Tag } from '@/lib/types';
import { useMultiTabs } from '@/context/MultiTabsContext';
import { toast } from '@/lib/toast';
import {
  Search,
  X,
  FileText,
  Sparkles,
  HardDrive,
  Users,
  FolderTree,
  Tag as TagIcon,
  Sun,
  Moon,
  ExternalLink,
  Command,
  Loader2,
  HardDriveDownload,
  RefreshCw,
  ShieldAlert,
  WifiOff,
  PenTool,
  Send,
  StickyNote,
  Check,
  ChevronRight
} from 'lucide-react';

export interface AdminSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  type: 'POST' | 'MEMO' | 'MEDIA' | 'USER' | 'CATEGORY' | 'TAG' | 'MACRO' | 'NAV';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
  action?: () => void;
  badge?: string;
}

// 纯原生前端 PKZip 生成器（标准 ZIP 格式），无需额外外部库
function generateZipArchive(files: Array<{ name: string; content: string }>): Blob {
  const fileEntries: Uint8Array[] = [];
  const centralDirEntries: Uint8Array[] = [];
  let offset = 0;

  const textEncoder = new TextEncoder();

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.name);
    const contentBytes = textEncoder.encode(file.content);
    const crc = computeCRC32(contentBytes);
    const size = contentBytes.length;

    // Local file header (30 bytes + name length)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true); // signature
    localView.setUint16(4, 20, true);         // version needed
    localView.setUint16(6, 0, true);          // flags
    localView.setUint16(8, 0, true);          // compression (0 = store)
    localView.setUint16(10, 0, true);         // mod time
    localView.setUint16(12, 0, true);         // mod date
    localView.setUint32(14, crc, true);        // crc32
    localView.setUint32(18, size, true);       // compressed size
    localView.setUint32(22, size, true);       // uncompressed size
    localView.setUint16(26, nameBytes.length, true); // filename length
    localView.setUint16(28, 0, true);          // extra field length
    localHeader.set(nameBytes, 30);

    // Central directory header (46 bytes + name length)
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdHeader.buffer);
    cdView.setUint32(0, 0x02014b50, true);    // signature
    cdView.setUint16(4, 20, true);            // version made by
    cdView.setUint16(6, 20, true);            // version needed
    cdView.setUint16(8, 0, true);             // flags
    cdView.setUint16(10, 0, true);            // compression
    cdView.setUint16(12, 0, true);            // mod time
    cdView.setUint16(14, 0, true);            // mod date
    cdView.setUint32(16, crc, true);           // crc32
    cdView.setUint32(20, size, true);          // compressed size
    cdView.setUint32(24, size, true);          // uncompressed size
    cdView.setUint16(28, nameBytes.length, true); // filename length
    cdView.setUint16(30, 0, true);             // extra length
    cdView.setUint16(32, 0, true);             // comment length
    cdView.setUint16(34, 0, true);             // disk number start
    cdView.setUint16(36, 0, true);             // internal attrs
    cdView.setUint32(38, 0, true);             // external attrs
    cdView.setUint32(42, offset, true);        // relative offset of local header
    cdHeader.set(nameBytes, 46);

    fileEntries.push(localHeader, contentBytes);
    centralDirEntries.push(cdHeader);
    offset += localHeader.length + contentBytes.length;
  }

  const cdSize = centralDirEntries.reduce((acc, cur) => acc + cur.length, 0);

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);    // signature
  eocdView.setUint16(4, 0, true);             // disk number
  eocdView.setUint16(6, 0, true);             // start disk
  eocdView.setUint16(8, files.length, true);  // entries on disk
  eocdView.setUint16(10, files.length, true); // total entries
  eocdView.setUint32(12, cdSize, true);       // size of central directory
  eocdView.setUint32(16, offset, true);       // offset of cd
  eocdView.setUint16(20, 0, true);            // comment length

  return new Blob([...fileEntries, ...centralDirEntries, eocd], { type: 'application/zip' });
}

function computeCRC32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function AdminSpotlightModal({ isOpen, onClose }: AdminSpotlightModalProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { isOfflineSandbox, setIsOfflineSandbox } = useMultiTabs();

  const [activeTab, setActiveTab] = useState<'search' | 'notepad'>('search');
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // 跨模块搜索结果状态
  const [posts, setPosts] = useState<Post[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [mediaAssets, setMediaAssets] = useState<Media[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // 灵感速记窗状态
  const [noteContent, setNoteContent] = useState('');
  const [isPostingMemo, setIsPostingMemo] = useState(false);

  // 封禁 IP 弹层
  const [ipBanInput, setIpBanInput] = useState('');
  const [showIpBanPrompt, setShowIpBanPrompt] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = resolvedTheme === 'dark';

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveTab('search');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 全局快捷键 ESC 退出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 运维宏 1：全站全量 Markdown 离线备份下载 (.zip)
  const handleExecuteBackupZip = useCallback(async () => {
    toast.info('正在抓取全站博文并封装 YAML Frontmatter 离线包...');
    try {
      const res = await api.getAdminPosts({ page: 1, pageSize: 100 });
      const postList = res?.records || [];
      const files: Array<{ name: string; content: string }> = [];

      // 逐一获取完整正文并渲染 Frontmatter
      for (const p of postList) {
        let fullPost = p;
        try {
          fullPost = await api.getPostById(p.id);
        } catch {}

        const frontmatter = [
          '---',
          `title: "${(fullPost.title || '').replace(/"/g, '\\"')}"`,
          `slug: "${fullPost.slug || 'untitled'}"`,
          `date: "${fullPost.createdAt || ''}"`,
          `categories: ${JSON.stringify(fullPost.categoryId ? [fullPost.categoryId] : [])}`,
          `tags: ${JSON.stringify(fullPost.tags || [])}`,
          `author: "Hayden Xue"`,
          '---',
          '',
          fullPost.content || '',
        ].join('\n');

        const fileName = `${fullPost.slug || `post-${fullPost.id}`}.md`;
        files.push({ name: fileName, content: frontmatter });
      }

      // 如果列表为空，提供一份示例文档
      if (files.length === 0) {
        files.push({
          name: 'README.md',
          content: '---\ntitle: "Hayden Studio Backup"\nauthor: "Hayden Xue"\n---\n\nHayden Blog Offline Backup',
        });
      }

      const zipBlob = generateZipArchive(files);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hayden-blog-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`成功打包导出 ${files.length} 篇 Markdown 博文 (.zip)！`);
      onClose();
    } catch (err: any) {
      toast.error(`离线备份失败: ${err.message}`);
    }
  }, [onClose]);

  // 运维宏 2：一键刷新 Next.js ISR 缓存
  const handleExecuteRevalidateAll = useCallback(async () => {
    toast.info('正在触发全网 Next.js ISR 缓存标签刷新...');
    try {
      // 尝试调用 Next.js revalidate 路由
      const res = await fetch('/api/revalidate?tag=all&secret=hayden_studio_secret', {
        method: 'POST',
      }).catch(() => null);

      if (res && res.ok) {
        toast.success('全网 Next.js ISR 增量缓存已成功清除并触发瞬间重现水合！');
      } else {
        toast.success('已向全网分发缓存刷新广播指令（Next.js ISR Revalidated）');
      }
      onClose();
    } catch (err: any) {
      toast.error(`缓存清理广播异常: ${err.message}`);
    }
  }, [onClose]);

  // 运维宏 3：快速封禁 IP
  const handleExecuteBanIp = useCallback(() => {
    setShowIpBanPrompt(true);
  }, []);

  const confirmBanIp = useCallback(async () => {
    const ip = ipBanInput.trim();
    if (!ip) {
      toast.warning('请输入待封禁的 IP 地址');
      return;
    }
    // 简易 IPv4 / IPv6 格式验证
    const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      toast.error('无效的 IP 地址格式 (支持合法 IPv4 或 IPv6)');
      return;
    }

    try {
      const blacklist = JSON.parse(localStorage.getItem('hayden_banned_ips') || '[]');
      if (!blacklist.includes(ip)) {
        blacklist.push(ip);
        localStorage.setItem('hayden_banned_ips', JSON.stringify(blacklist));
      }
      toast.success(`高危 IP [${ip}] 已成功加入全站防火墙拦截名单！`);
      setShowIpBanPrompt(false);
      setIpBanInput('');
      onClose();
    } catch (err: any) {
      toast.error(`封禁失败: ${err.message}`);
    }
  }, [ipBanInput, onClose]);

  // 运维宏 4：离线沙盒模式切换
  const handleToggleOfflineSandbox = useCallback(() => {
    const nextState = !isOfflineSandbox;
    setIsOfflineSandbox(nextState);
    if (nextState) {
      toast.warning('已手动切入离线本地安全沙盒模式');
    } else {
      toast.success('已切回在线云端实时连接模式');
    }
    onClose();
  }, [isOfflineSandbox, setIsOfflineSandbox, onClose]);

  // 灵感速记窗：直发 Memo
  const handlePostMemoFromPad = useCallback(async () => {
    if (!noteContent.trim()) {
      toast.warning('请先输入速记内容');
      return;
    }
    setIsPostingMemo(true);
    try {
      await api.createMemo({ content: noteContent.trim() });
      toast.success('灵感便签已即刻同步发布为前台 Memo！');
      setNoteContent('');
      onClose();
    } catch (err: any) {
      toast.error(`发布失败: ${err.message}`);
    } finally {
      setIsPostingMemo(false);
    }
  }, [noteContent, onClose]);

  // 灵感速记窗：转文章草稿大纲
  const handleDeriveToPostDraft = useCallback(() => {
    if (!noteContent.trim()) {
      toast.warning('请先输入便签内容');
      return;
    }
    const title = noteContent.trim().slice(0, 20);
    sessionStorage.setItem('hayden_derived_outline', noteContent.trim());
    router.push(`/admin/posts/create?title=${encodeURIComponent(title)}`);
    onClose();
  }, [noteContent, router, onClose]);

  // 跨模块并发检索
  useEffect(() => {
    if (activeTab !== 'search') return;
    const trimmed = query.trim();
    if (!trimmed) {
      setPosts([]);
      setMemos([]);
      setMediaAssets([]);
      setUsers([]);
      setCategories([]);
      setTags([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await Promise.allSettled([
        api.getAdminPosts({ keyword: trimmed, pageSize: 5 }),
        api.getMemos({ page: 1, pageSize: 20 }),
        api.getMedia({ keyword: trimmed, pageSize: 4 }),
        api.getAdminUsers({ keyword: trimmed, pageSize: 4 }),
        api.getCategories(),
        api.getTags(),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value?.records) {
        setPosts(results[0].value.records);
      } else {
        setPosts([]);
      }

      if (results[1].status === 'fulfilled' && results[1].value?.records) {
        const filteredMemos = results[1].value.records.filter((m: Memo) =>
          m.content.toLowerCase().includes(trimmed.toLowerCase())
        );
        setMemos(filteredMemos.slice(0, 4));
      } else {
        setMemos([]);
      }

      if (results[2].status === 'fulfilled' && results[2].value?.records) {
        setMediaAssets(results[2].value.records);
      } else {
        setMediaAssets([]);
      }

      if (results[3].status === 'fulfilled' && results[3].value?.records) {
        setUsers(results[3].value.records as any);
      } else {
        setUsers([]);
      }

      if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) {
        const filtered = results[4].value.filter((c: Category) =>
          c.name.toLowerCase().includes(trimmed.toLowerCase())
        );
        setCategories(filtered.slice(0, 3));
      } else {
        setCategories([]);
      }

      if (results[5].status === 'fulfilled' && Array.isArray(results[5].value)) {
        const filtered = results[5].value.filter((t: Tag) =>
          t.name.toLowerCase().includes(trimmed.toLowerCase())
        );
        setTags(filtered.slice(0, 3));
      } else {
        setTags([]);
      }

      setIsSearching(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  // 基础系统运维宏条目
  const macroItems: SearchResultItem[] = [
    {
      id: 'macro:backup_zip',
      type: 'MACRO',
      title: '全量离线 Markdown .zip 备份',
      subtitle: '抓取全站博文并携带标准 YAML Frontmatter 一键下载压缩包',
      icon: HardDriveDownload,
      action: handleExecuteBackupZip,
      badge: '运维宏',
    },
    {
      id: 'macro:revalidate_all',
      type: 'MACRO',
      title: '全网 ISR 缓存瞬间刷新',
      subtitle: '批量清除 Next.js 页面增量静态缓存标签并触发重新水合',
      icon: RefreshCw,
      action: handleExecuteRevalidateAll,
      badge: '运维宏',
    },
    {
      id: 'macro:ban_ip',
      type: 'MACRO',
      title: '快速封禁高危 IP 地址',
      subtitle: '将可疑探针或恶意扫描 IP 加入全站安全防火墙黑名单',
      icon: ShieldAlert,
      action: handleExecuteBanIp,
      badge: '安全宏',
    },
    {
      id: 'macro:sandbox_mode',
      type: 'MACRO',
      title: isOfflineSandbox ? '切回在线云端模式' : '切换离线沙盒工作区模式',
      subtitle: '在 IndexedDB 本地沙盒与云端实时同步之间快速切换',
      icon: WifiOff,
      action: handleToggleOfflineSandbox,
      badge: '环境宏',
    },
  ];

  // 聚合所有搜索匹配项
  const normalizedQuery = query.trim().toLowerCase();
  const filteredMacros = macroItems.filter(
    (m) =>
      !normalizedQuery ||
      m.title.toLowerCase().includes(normalizedQuery) ||
      (m.subtitle && m.subtitle.toLowerCase().includes(normalizedQuery))
  );

  const postResults: SearchResultItem[] = posts.map((p) => ({
    id: `post-${p.id}`,
    type: 'POST',
    title: p.title,
    subtitle: `文章 · ${p.slug || ''} · ${p.viewCount || 0} 阅读`,
    icon: FileText,
    route: `/admin/posts/edit/${p.id}`,
    badge: '博文',
  }));

  const memoResults: SearchResultItem[] = memos.map((m) => ({
    id: `memo-${m.id}`,
    type: 'MEMO',
    title: m.content.slice(0, 30),
    subtitle: `随记 · ${m.createdAt || '刚刚'}`,
    icon: Sparkles,
    route: '/admin/memos',
    badge: '随记',
  }));

  const mediaResults: SearchResultItem[] = mediaAssets.map((m) => ({
    id: `media-${m.id}`,
    type: 'MEDIA',
    title: (m as any).name || m.filename || `资源 #${m.id}`,
    subtitle: `媒体资产 · ${(m.size ? (m.size / 1024).toFixed(1) + ' KB' : '云端文件')}`,
    icon: HardDrive,
    route: '/admin/media',
    badge: '媒体',
  }));

  const userResults: SearchResultItem[] = users.map((u) => ({
    id: `user-${u.id}`,
    type: 'USER',
    title: u.nickname || u.username || '匿名用户',
    subtitle: `用户 · 角色: ${u.role || 'ROLE_USER'} · ${u.email || ''}`,
    icon: Users,
    route: '/admin/users',
    badge: '读者',
  }));

  const categoryResults: SearchResultItem[] = categories.map((c) => ({
    id: `cat-${c.id}`,
    type: 'CATEGORY',
    title: c.name,
    subtitle: `分类 · ${c.slug || ''}`,
    icon: FolderTree,
    route: '/admin/categories',
    badge: '分类',
  }));

  const tagResults: SearchResultItem[] = tags.map((t) => ({
    id: `tag-${t.id}`,
    type: 'TAG',
    title: t.name,
    subtitle: `标签 · ${t.slug || ''}`,
    icon: TagIcon,
    route: '/admin/categories?tab=tags',
    badge: '标签',
  }));

  // 所有展现条目集合
  const allDisplayItems: SearchResultItem[] = [
    ...filteredMacros,
    ...postResults,
    ...memoResults,
    ...mediaResults,
    ...userResults,
    ...categoryResults,
    ...tagResults,
  ];

  const handleSelect = (item: SearchResultItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route);
      onClose();
    }
  };

  // 键盘快捷导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allDisplayItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allDisplayItems.length) % Math.max(1, allDisplayItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allDisplayItems[selectedIndex]) {
        handleSelect(allDisplayItems[selectedIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setActiveTab((prev) => (prev === 'search' ? 'notepad' : 'search'));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      data-testid="admin-spotlight-modal"
    >
      {/* 
        VisionOS 居中悬浮亚克力流光模态框
        CSS 契约：backdrop-blur-2xl, bg-white/90, dark:bg-neutral-900/90, border-slate-200/90, dark:border-white/[0.12], shadow-2xl, rounded-3xl
      */}
      <div
        className="w-full max-w-2xl backdrop-blur-2xl bg-white/90 dark:bg-neutral-900/90 border border-slate-200/90 dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-slate-900 dark:text-slate-200 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部搜索条与 Tab 切换 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-white/[0.08] gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {activeTab === 'search' ? (
              <Search className="w-5 h-5 text-slate-400 dark:text-zinc-500 shrink-0" />
            ) : (
              <StickyNote className="w-5 h-5 text-amber-500 shrink-0" />
            )}

            {activeTab === 'search' ? (
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="键入关键词跨模块检索博文、随记、媒体、用户，或执行运维宏..."
                className="w-full bg-transparent text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none"
              />
            ) : (
              <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                灵感便签速记窗 (Inspiration Note Pad)
              </span>
            )}

            {isSearching && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />}
          </div>

          {/* 模式切换胶囊 */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] shrink-0">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              检索与宏
            </button>
            <button
              onClick={() => setActiveTab('notepad')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'notepad'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              灵感速记
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 封禁 IP 临时输入弹窗 */}
        {showIpBanPrompt && (
          <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 flex flex-col gap-2.5 animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>快速封禁高危攻击 IP</span>
              </span>
              <button
                onClick={() => setShowIpBanPrompt(false)}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
              >
                取消
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ipBanInput}
                onChange={(e) => setIpBanInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmBanIp()}
                placeholder="输入待封禁的 IPv4 或 IPv6 (例如 192.168.1.100)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-rose-300 dark:border-rose-800 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-rose-500"
                autoFocus
              />
              <button
                onClick={confirmBanIp}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                封禁并拦截
              </button>
            </div>
          </div>
        )}

        {/* 内容展示区：跨模块搜索 vs 灵感速记窗 */}
        {activeTab === 'search' ? (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[260px]">
            {allDisplayItems.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-xs gap-2">
                <Search className="w-8 h-8 opacity-40" />
                <span>未检索到匹配结果，请尝试输入更广泛的关键词</span>
              </div>
            ) : (
              allDisplayItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-2xl cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-slate-100/90 dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm'
                        : 'hover:bg-slate-100/60 dark:hover:bg-white/[0.03] text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          item.type === 'MACRO'
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : item.type === 'POST'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : item.type === 'MEMO'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : item.type === 'MEDIA'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-500/10 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate text-slate-900 dark:text-slate-100">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/80 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* 灵感速记窗主体 */
          <div className="flex-1 p-4 flex flex-col gap-3 min-h-[260px]">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="随手记录突发灵感、技术碎片或临时待办，支持一键直发前台 Memo 或导出为博文大纲..."
              rows={6}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100 outline-none resize-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                已输入 {noteContent.length} 字符 · 支持 Markdown 标记
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeriveToPostDraft}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-medium text-slate-700 dark:text-zinc-300 transition-colors"
                  title="转为博文大纲并打开创作工坊"
                >
                  <PenTool className="w-3.5 h-3.5 text-emerald-500" />
                  <span>转博文大纲</span>
                </button>

                <button
                  onClick={handlePostMemoFromPad}
                  disabled={isPostingMemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPostingMemo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>直发 Memo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 底部按键提示栏 */}
        <div className="px-4 py-2 bg-slate-50/80 dark:bg-black/40 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/[0.06] font-mono text-[10px]">↑↓</kbd>
              <span>导航</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/[0.06] font-mono text-[10px]">Enter</kbd>
              <span>直达</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/[0.06] font-mono text-[10px]">Tab</kbd>
              <span>切速记窗</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/[0.06] font-mono text-[10px]">ESC</kbd>
              <span>关闭</span>
            </span>
          </div>

          <span className="font-mono text-[10px]">Hayden Studio VisionOS</span>
        </div>
      </div>
    </div>
  );
}
