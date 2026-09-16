'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '@/lib/api';
import { Media, SiteSetting } from '@/lib/types';
import { toast } from '@/lib/toast';
import { SafeImage } from '@/components/SafeImage';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import {
  HardDrive,
  Upload,
  Image as ImageIcon,
  Film,
  Copy,
  Trash2,
  Search,
  RotateCw,
  Loader2,
  Eye,
  Check,
  X,
  Cloud,
  CheckCircle2,
  Play,
  FileCheck,
  Maximize2,
  Minimize2,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  ArrowUpDown,
  Filter,
  CheckCircle,
} from 'lucide-react';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface UploadTask {
  id: string;
  file: File;
  filename: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  errorMsg?: string;
}

export default function MediaAdminPage() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // 视图模式：网格 (grid) 或 列表 (list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 多维筛选维度
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | '7DAYS' | '30DAYS' | 'YEAR'>('ALL');
  const [sizeFilter, setSizeFilter] = useState<'ALL' | 'LT_1MB' | '1MB_5MB' | 'GT_5MB'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'SIZE_DESC' | 'NAME'>('NEWEST');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 拖拽与批量上传任务队列状态
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);
  const [taskPanelMinimized, setTaskPanelMinimized] = useState(false);
  const isProcessingQueue = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 存储后端动态配置与连通性测试
  const [settings, setSettings] = useState<SiteSetting | null>(null);
  const [testingStorage, setTestingStorage] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{ success?: boolean; message?: string; latencyMs?: number } | null>(null);

  // 灯箱/大图视频预览 Modal
  const [previewItem, setPreviewItem] = useState<Media | null>(null);

  // 删除确认 Modal
  const [deletingItem, setDeletingItem] = useState<Media | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const storageType = (settings?.storageType || 'oss').toLowerCase();
  const isOss = storageType === 'oss' || storageType === 'aliyun_oss';
  const isMinio = storageType === 'minio';
  const isLocal = storageType === 'local';

  const nodeTitle = isOss ? '阿里云 OSS 生产节点' : isMinio ? 'MinIO 对象存储节点' : '本地持久化存储';
  const nodeEndpoint = isOss ? (settings?.ossEndpoint || 'oss-cn-beijing.aliyuncs.com') : isMinio ? (settings?.minioEndpoint || '49.233.166.212:9000') : '/app/uploads';
  const bucketName = isOss ? (settings?.ossBucket || 'haydenblog') : isMinio ? (settings?.minioBucket || 'hayden-blog') : 'Local Disk';
  const protocolName = isOss ? 'Aliyun OSS' : isMinio ? 'S3 兼容' : '本地磁盘';

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.getMedia({
        page,
        pageSize,
        keyword: searchKeyword.trim() || undefined,
      });
      if (res && Array.isArray(res.records)) {
        setMediaList(res.records);
        setTotal(res.total || 0);
      } else {
        setMediaList([]);
        setTotal(0);
      }
    } catch (err: any) {
      toast.error(err.message || '获取媒体列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMedia();
  };

  // 测试激活存储引擎的连通性
  const handleTestStorage = async () => {
    setTestingStorage(true);
    setStorageStatus(null);
    try {
      const res = isOss ? await api.testOss() : await api.testMinio();
      setStorageStatus(res);
      if (res.success) {
        toast.success(`${nodeTitle}连通就绪！往返延迟: ${res.latencyMs || 0}ms`);
      } else {
        toast.error(`${nodeTitle}连通失败: ${res.message}`);
      }
    } catch (err: any) {
      setStorageStatus({ success: false, message: err.message });
      toast.error(err.message || '连通性测试请求失败');
    } finally {
      setTestingStorage(false);
    }
  };

  // 批量并发任务队列调度引擎 (并发数: 2)
  const processUploadQueue = async (tasks: UploadTask[]) => {
    if (isProcessingQueue.current) return;
    isProcessingQueue.current = true;

    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    const getNextPending = () => {
      return Array.from(taskMap.values()).find((t) => t.status === 'pending') || null;
    };

    const uploadSingle = async (task: UploadTask) => {
      task.status = 'uploading';
      task.progress = 15;
      setUploadQueue(Array.from(taskMap.values()));

      const timer = setInterval(() => {
        task.progress = Math.min(90, task.progress + 15);
        setUploadQueue(Array.from(taskMap.values()));
      }, 300);

      try {
        const res = await api.uploadMedia(task.file);
        clearInterval(timer);
        task.status = 'success';
        task.progress = 100;
        task.url = res.url;
        setUploadQueue(Array.from(taskMap.values()));
      } catch (err: any) {
        clearInterval(timer);
        task.status = 'error';
        task.errorMsg = err.message || '上传失败';
        setUploadQueue(Array.from(taskMap.values()));
      }
    };

    const concurrency = 2;
    const workers = Array.from({ length: concurrency }).map(async () => {
      while (true) {
        const next = getNextPending();
        if (!next) break;
        await uploadSingle(next);
      }
    });

    await Promise.all(workers);
    isProcessingQueue.current = false;
    fetchMedia();
  };

  // 文件批量直传处理
  const handleUploadFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newTasks: UploadTask[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 200 * 1024 * 1024) {
        toast.error(`文件 "${file.name}" 超过 200MB 大小限制`);
        continue;
      }

      newTasks.push({
        id: `task_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        file,
        filename: file.name,
        size: file.size,
        status: 'pending',
        progress: 0,
      });
    }

    if (newTasks.length === 0) return;

    setUploadQueue((prev) => {
      const updated = [...prev, ...newTasks];
      setTimeout(() => processUploadQueue(updated), 50);
      return updated;
    });
    setTaskPanelOpen(true);
    setTaskPanelMinimized(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('已复制 CDN 访问直链至剪贴板');
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    try {
      await api.deleteMedia(deletingItem.id);
      toast.success(`媒体 "${deletingItem.filename}" 已成功删除`);
      setDeletingItem(null);
      fetchMedia();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 多维筛选与排序计算
  const filteredList = useMemo(() => {
    let list = [...mediaList];

    // 1. 类型筛选
    if (typeFilter === 'IMAGE') {
      list = list.filter((item) => {
        const isVid = item.mimeType?.startsWith('video/') || item.filename?.match(/\.(mp4|webm|mov)$/i);
        return !isVid;
      });
    } else if (typeFilter === 'VIDEO') {
      list = list.filter((item) => {
        const isVid = item.mimeType?.startsWith('video/') || item.filename?.match(/\.(mp4|webm|mov)$/i);
        return isVid;
      });
    }

    // 2. 日期区间筛选
    if (dateFilter !== 'ALL') {
      const now = Date.now();
      list = list.filter((item) => {
        if (!item.createdAt) return false;
        const itemTime = new Date(item.createdAt).getTime();
        if (dateFilter === '7DAYS') return now - itemTime <= 7 * 86400 * 1000;
        if (dateFilter === '30DAYS') return now - itemTime <= 30 * 86400 * 1000;
        if (dateFilter === 'YEAR') return new Date(item.createdAt).getFullYear() === new Date().getFullYear();
        return true;
      });
    }

    // 3. 文件体积筛选
    if (sizeFilter === 'LT_1MB') {
      list = list.filter((item) => (item.size || 0) < 1024 * 1024);
    } else if (sizeFilter === '1MB_5MB') {
      list = list.filter((item) => (item.size || 0) >= 1024 * 1024 && (item.size || 0) <= 5 * 1024 * 1024);
    } else if (sizeFilter === 'GT_5MB') {
      list = list.filter((item) => (item.size || 0) > 5 * 1024 * 1024);
    }

    // 4. 排序规则
    list.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      }
      if (sortBy === 'OLDEST') {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tA - tB;
      }
      if (sortBy === 'SIZE_DESC') {
        return (b.size || 0) - (a.size || 0);
      }
      if (sortBy === 'NAME') {
        return (a.filename || '').localeCompare(b.filename || '');
      }
      return 0;
    });

    return list;
  }, [mediaList, typeFilter, dateFilter, sizeFilter, sortBy]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  // 上传队列统计
  const uploadSuccessCount = uploadQueue.filter((t) => t.status === 'success').length;
  const isUploadingActive = uploadQueue.some((t) => t.status === 'uploading' || t.status === 'pending');

  return (
    <div className="w-full space-y-5">
      {/* 统一规范头部 */}
      <AdminPageHeader
        title="媒体资产管理中心 (Media Hub)"
        description="统一管理云端对象存储与媒体资产库，支持 200MB 大视频与图片批量直传、多维筛选、列表/网格双视图与 CDN 直链。"
        icon={HardDrive}
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold border border-cyan-500/20">
            TOTAL: {total} 资产
          </span>
        }
        breadcrumbs={[
          { label: 'Studio', href: '/admin/dashboard' },
          { label: '创作工坊', href: '/admin/posts' },
          { label: '媒体中心' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestStorage}
              disabled={testingStorage}
              className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer"
            >
              {testingStorage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5 text-cyan-500" />}
              <span>{testingStorage ? '连通探测中...' : `测试 ${isOss ? '阿里云 OSS' : isMinio ? 'MinIO' : '本地存储'} 连通性`}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>上传多媒体素材</span>
            </button>
          </div>
        }
      />

      {/* 1. 存储状态 Bento 卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-foreground">{nodeTitle}</span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px]" title={nodeEndpoint}>
              {nodeEndpoint}
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
            ONLINE
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground">存储空间 (Bucket)</span>
            <p className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px]" title={bucketName}>
              {bucketName} · 公开可读
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground font-mono text-[10px]">
            {protocolName}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground">容量吞吐支持</span>
            <p className="text-[11px] font-mono text-muted-foreground">
              最大 200MB / 视频与多图并发直传
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/20">
            200 MB
          </div>
        </div>
      </div>

      {/* 连通探测响应指示 */}
      {storageStatus && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
            storageStatus.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{storageStatus.message || (storageStatus.success ? `${nodeTitle}探测就绪` : '探测握手失败')}</span>
          </div>
          {storageStatus.latencyMs !== undefined && (
            <span className="font-mono text-[11px]">往返耗时: {storageStatus.latencyMs} ms</span>
          )}
        </div>
      )}

      {/* 2. 宽幅拖拽上传区域 (支持多选) */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-8 rounded-3xl border-2 border-dashed transition-all text-center space-y-3 cursor-pointer select-none ${
          dragActive
            ? 'border-emerald-500 bg-emerald-500/5 scale-[0.99]'
            : 'border-border bg-secondary/20 hover:bg-secondary/35'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*,video/mp4,video/webm"
          onChange={(e) => handleUploadFiles(e.target.files)}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
          {isUploadingActive ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">
            {isUploadingActive
              ? `队列处理中：已完成 ${uploadSuccessCount} / ${uploadQueue.length} 个文件`
              : '点击选择或拖拽多个图片/视频文件至此处批量上传'}
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            支持同时选中多张 JPG/PNG/WebP/GIF 图片与 MP4/WebM 视频，多任务队列并发直传云端对象存储
          </p>
        </div>
      </div>

      {/* 3. 多维筛选与控制工具栏 */}
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col gap-3.5 text-xs shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 筛选 Pills (类型) */}
          <div className="flex items-center p-1 rounded-xl bg-secondary border border-border">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              全部类型
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('IMAGE')}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer ${
                typeFilter === 'IMAGE'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>图片</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('VIDEO')}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer ${
                typeFilter === 'VIDEO'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>视频</span>
            </button>
          </div>

          {/* 视图模式切换与刷新 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-secondary border border-border">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="网格视图"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="列表视图"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 关键字搜索框 */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索文件名 / 路径..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={fetchMedia}
                title="刷新媒体列表"
                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </form>
          </div>
        </div>

        {/* 次级多维筛选栏：日期区间、文件体积、排序规则 */}
        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            {/* 日期区间 */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>时间：</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-secondary text-foreground rounded-lg px-2 py-1 border border-border focus:outline-none"
              >
                <option value="ALL">全部时间</option>
                <option value="7DAYS">最近 7 天</option>
                <option value="30DAYS">最近 30 天</option>
                <option value="YEAR">本年度 (2026)</option>
              </select>
            </div>

            {/* 体积筛选 */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Filter className="w-3.5 h-3.5 text-cyan-500" />
              <span>体积：</span>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value as any)}
                className="bg-secondary text-foreground rounded-lg px-2 py-1 border border-border focus:outline-none"
              >
                <option value="ALL">全部体积</option>
                <option value="LT_1MB">&lt; 1 MB</option>
                <option value="1MB_5MB">1 MB ~ 5 MB</option>
                <option value="GT_5MB">&gt; 5 MB</option>
              </select>
            </div>

            {/* 排序规则 */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
              <span>排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-secondary text-foreground rounded-lg px-2 py-1 border border-border focus:outline-none font-medium"
              >
                <option value="NEWEST">最新上传优先</option>
                <option value="OLDEST">最早上传优先</option>
                <option value="SIZE_DESC">体积最大优先</option>
                <option value="NAME">按文件名 A-Z</option>
              </select>
            </div>
          </div>

          <div className="text-muted-foreground font-mono">
            当前筛选呈现 <strong className="text-foreground">{filteredList.length}</strong> / {total} 项
          </div>
        </div>
      </div>

      {/* 4. 媒体资产呈现（网格视图与列表视图） */}
      {loading && mediaList.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 mx-auto text-emerald-500 animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Loading Cloud Assets...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-16 rounded-3xl bg-card border border-dashed border-border text-center space-y-3">
          <HardDrive className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h4 className="text-sm font-semibold text-foreground">未找到匹配的媒体资产</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            请尝试调整搜索关键词或筛选条件，或点击上方区域上传新的多媒体资源
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* 网格视图 */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredList.map((item) => {
            const isVideo = item.mimeType?.startsWith('video/') || item.filename?.match(/\.(mp4|webm|mov)$/i);

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-card hover:bg-card/95 border border-border hover:border-emerald-500/40 shadow-sm transition-all overflow-hidden flex flex-col"
              >
                {/* 媒体缩略展示区 */}
                <div className="relative aspect-video bg-black/90 overflow-hidden flex items-center justify-center">
                  {isVideo ? (
                    <div className="relative w-full h-full">
                      <video
                        src={item.url}
                        muted
                        playsInline
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-cyan-400 text-[10px] font-mono font-bold border border-white/10">
                        VIDEO
                      </span>
                    </div>
                  ) : (
                    <SafeImage
                      src={item.url}
                      alt={item.filename}
                      aspectRatio="16/9"
                      containerClassName="w-full h-full"
                    />
                  )}

                  {/* 悬浮操作浮层 */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      title="预览原图 / 播放视频"
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item.url)}
                      title="复制 CDN 直链"
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      title="删除该资产"
                      className="p-2 rounded-xl bg-rose-500/70 hover:bg-rose-500 text-white backdrop-blur-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 卡片底部元数据 */}
                <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <h5 className="font-semibold text-foreground truncate text-[11px]" title={item.filename}>
                      {item.filename}
                    </h5>
                    <p className="text-[10px] font-mono text-muted-foreground truncate" title={item.url}>
                      {item.objectKey || item.url}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1.5 border-t border-border/60">
                    <span className="font-medium text-foreground/80">{formatBytes(item.size)}</span>
                    <span>{item.createdAt ? item.createdAt.substring(0, 10) : '近期上传'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 列表视图 */
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="p-3.5 w-24">预览</th>
                  <th className="p-3.5">文件名与直链</th>
                  <th className="p-3.5">格式类型</th>
                  <th className="p-3.5">文件体积</th>
                  <th className="p-3.5">上传时间</th>
                  <th className="p-3.5 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredList.map((item) => {
                  const isVideo = item.mimeType?.startsWith('video/') || item.filename?.match(/\.(mp4|webm|mov)$/i);
                  return (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3">
                        <div
                          className="w-16 h-10 rounded-lg overflow-hidden bg-black/80 flex items-center justify-center cursor-pointer border border-border"
                          onClick={() => setPreviewItem(item)}
                        >
                          {isVideo ? (
                            <Play className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className="p-3 max-w-sm">
                        <div className="font-semibold text-foreground truncate" title={item.filename}>
                          {item.filename}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate" title={item.url}>
                          {item.url}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-secondary border border-border">
                          {isVideo ? 'VIDEO' : 'IMAGE'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {formatBytes(item.size)}
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {item.createdAt ? item.createdAt.substring(0, 10) : '-'}
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="预览"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item.url)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="复制 CDN 直链"
                        >
                          <Copy className="w-3.5 h-3.5 text-emerald-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. 分页导航条 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border text-xs font-mono">
          <span className="text-muted-foreground">
            第 {page} / {totalPages} 页 (共 {total} 个资产)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border disabled:opacity-40 transition-colors cursor-pointer"
            >
              上一页
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border disabled:opacity-40 transition-colors cursor-pointer"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 6. 右下角批量上传任务管理器浮窗 */}
      {taskPanelOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl bg-card/95 dark:bg-neutral-900/95 backdrop-blur-md border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-3 border-b border-border flex items-center justify-between bg-secondary/50">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-foreground">上传任务队列</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                {uploadSuccessCount} / {uploadQueue.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTaskPanelMinimized(!taskPanelMinimized)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title={taskPanelMinimized ? '展开面板' : '最小化面板'}
              >
                {taskPanelMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTaskPanelOpen(false);
                  if (!isUploadingActive) setUploadQueue([]);
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title="关闭面板"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!taskPanelMinimized && (
            <div className="max-h-72 overflow-y-auto p-2.5 space-y-2 custom-scrollbar text-xs">
              {uploadQueue.map((task) => (
                <div
                  key={task.id}
                  className="p-2 rounded-xl bg-secondary/40 border border-border space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      {task.file.type.startsWith('video/') ? (
                        <Film className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                      <span className="truncate font-medium text-foreground text-[11px]" title={task.filename}>
                        {task.filename}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {task.status === 'uploading' && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      )}
                      {task.status === 'success' && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {task.status === 'error' && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      )}
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatBytes(task.size)}
                      </span>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        task.status === 'error'
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      }`}
                      style={{ width: `${task.status === 'error' ? 100 : task.progress}%` }}
                    />
                  </div>

                  {task.errorMsg && (
                    <div className="text-[10px] text-rose-500 truncate">{task.errorMsg}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 预览灯箱 Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-card border border-border overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-foreground truncate max-w-md">
                  {previewItem.filename}
                </span>
                <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono text-[10px]">
                  {formatBytes(previewItem.size)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewItem.url)}
                  className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-500" />
                  <span>复制 CDN 直链</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
              {previewItem.mimeType?.startsWith('video/') || previewItem.filename?.match(/\.(mp4|webm|mov)$/i) ? (
                <video
                  src={previewItem.url}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-auto rounded-xl shadow-2xl"
                />
              ) : (
                <img
                  src={previewItem.url}
                  alt={previewItem.filename}
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl"
                />
              )}
            </div>

            <div className="p-3 bg-secondary/40 border-t border-border font-mono text-[11px] text-muted-foreground truncate px-4">
              直链 URL: <span className="text-foreground select-all">{previewItem.url}</span>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 space-y-4 shadow-2xl text-foreground text-xs">
            <h3 className="text-base font-bold text-rose-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>确认删除该媒体资产？</span>
            </h3>

            <p className="text-muted-foreground leading-relaxed">
              您确定要从云端对象存储中心永久删除资产{' '}
              <span className="font-semibold text-foreground font-mono">
                "{deletingItem.filename}"
              </span>{' '}
              吗？此操作将清除云端对象与记录，博文中若引用该直链将无法继续显示。
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>确认永久删除</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

