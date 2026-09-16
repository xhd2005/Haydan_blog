'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Media } from '@/lib/types';
import { toast } from '@/lib/toast';
import {
  X,
  Search,
  Film,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** 选中媒体后回调（回填 URL 与媒体对象） */
  onSelect: (media: Media) => void;
  /** MIME 前缀过滤，默认仅视频 */
  mimePrefix?: string;
  title?: string;
}

/**
 * 媒体资产库选择器 (AGENTS.md 铁律 5: 云端对象存储优先)
 * 从 MinIO 媒体库中检索并一键选用已上传资产，消除手动粘贴直链的断点。
 */
export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  mimePrefix = 'video/',
  title = '从媒体资产库选择视频',
}: MediaPickerModalProps) {
  const [items, setItems] = useState<Media[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const pageSize = 12;

  const loadMedia = useCallback(async (targetPage: number, kw: string) => {
    setLoading(true);
    try {
      const res = await api.getMedia({ page: targetPage, pageSize, keyword: kw || undefined });
      const records = (res?.records || []).filter((m) =>
        mimePrefix ? (m.mimeType || '').startsWith(mimePrefix) : true
      );
      setItems(records);
      setTotal(res?.total || 0);
    } catch (err: any) {
      toast.error(err.message || '媒体库加载失败');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [mimePrefix]);

  // 打开时重置并加载首页
  useEffect(() => {
    if (open) {
      setPage(1);
      setKeyword('');
      setSelectedId(null);
      loadMedia(1, '');
    }
  }, [open, loadMedia]);

  // 搜索防抖
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setPage(1);
      loadMedia(1, keyword.trim());
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatSize = (size?: number) => {
    if (!size && size !== 0) return '—';
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-neutral-950 border border-slate-200/80 dark:border-white/[0.08] shadow-2xl animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部极光发线 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                MinIO 云端资产 · {mimePrefix.replace('/', '')} · 共 {total} 项
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="关闭 (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-200/70 dark:border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索文件名 / 对象键..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/70 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-xs font-mono">正在检索云端资产...</span>
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {items.map((media) => {
                const isSelected = selectedId === media.id;
                return (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => setSelectedId(media.id)}
                    onDoubleClick={() => onSelect(media)}
                    className={`group relative flex flex-col rounded-2xl overflow-hidden border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/50 hover:shadow-md'
                    }`}
                  >
                    {/* 视频缩略预览 */}
                    <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                      <video
                        src={media.url}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                        <Film className="w-2.5 h-2.5" />
                        {(media.mimeType || 'video').split('/')[1]?.toUpperCase()}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                        </div>
                      )}
                    </div>
                    {/* 元信息 */}
                    <div className="p-2.5 space-y-0.5 bg-white dark:bg-neutral-900/60">
                      <p className="text-[11px] font-semibold text-foreground truncate" title={media.filename}>
                        {media.filename}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {formatSize(media.size)} · {media.createdAt?.split('T')[0]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Film className="w-8 h-8 opacity-40" />
              <span className="text-xs">
                {keyword ? '未找到匹配的云端资产' : '媒体库暂无视频资产，请先在媒体中心上传'}
              </span>
            </div>
          )}
        </div>

        {/* Footer: Pagination + Confirm */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200/70 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => {
                const next = page - 1;
                setPage(next);
                loadMedia(next, keyword.trim());
              }}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                loadMedia(next, keyword.trim());
              }}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={selectedId === null}
            onClick={() => {
              const media = items.find((m) => m.id === selectedId);
              if (media) onSelect(media);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>选用此视频</span>
          </button>
        </div>
      </div>
    </div>
  );
}
