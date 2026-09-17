'use client';

import React, { useState } from 'react';
import { 
  FileArchive, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  FileText, 
  ExternalLink,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { GiantImageItem } from '@/lib/imageCompressionWorkshop';

interface GiantImageCompressionWorkshopProps {
  giantImages: GiantImageItem[];
  isCompressing: boolean;
  onCompressOne: (image: GiantImageItem) => Promise<void>;
  onCompressAll: () => Promise<void>;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function GiantImageCompressionWorkshop({
  giantImages,
  isCompressing,
  onCompressOne,
  onCompressAll,
}: GiantImageCompressionWorkshopProps) {
  const [compressingId, setCompressingId] = useState<number | string | null>(null);

  const totalOldBytes = giantImages.reduce((sum, img) => sum + img.size, 0);
  const estimatedNewBytes = Math.round(totalOldBytes * 0.28);
  const estimatedSavedBytes = totalOldBytes - estimatedNewBytes;

  const handleSingleCompress = async (img: GiantImageItem) => {
    setCompressingId(img.id);
    try {
      await onCompressOne(img);
    } finally {
      setCompressingId(null);
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
      {/* 头部摘要 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <FileArchive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>巨幅大图无损压缩转换工坊</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                {giantImages.length} 张待优化
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              扫描正文及封面中体积 &gt;1MB/2MB 大图，一键原地转换为 WebP 并无损重写博文引用直链
            </p>
          </div>
        </div>

        {giantImages.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-[10px] text-slate-400 font-mono">
                预计总节省: <span className="text-emerald-500 font-bold">{formatBytes(estimatedSavedBytes)}</span> (~72%)
              </div>
            </div>
            <button
              type="button"
              onClick={onCompressAll}
              disabled={isCompressing || compressingId !== null}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md hover:shadow-purple-600/25 cursor-pointer disabled:opacity-50"
            >
              {isCompressing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isCompressing ? '批量转码中...' : '一键全量转换 WebP'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 图片列表 */}
      {giantImages.length === 0 ? (
        <div className="py-10 text-center text-slate-400 space-y-1">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-70 mb-1" />
          <div className="font-semibold text-slate-700 dark:text-zinc-300">
            全站图片资产均已完成 WebP 现代格式化
          </div>
          <p className="text-[11px]">未检测到体积大于 2MB 的未经优化大图，首屏渲染指标处于最佳状态</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {giantImages.map((img) => {
            const isThisCompressing = compressingId === img.id;
            const newSize = Math.round(img.size * 0.28);
            const saved = img.size - newSize;

            return (
              <div
                key={img.id}
                className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/70 dark:border-white/[0.04] flex items-center justify-between gap-3 hover:border-purple-500/30 transition-all"
              >
                {/* 缩略图与信息 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-300/60 dark:border-white/[0.06] relative">
                    <img
                      src={img.url}
                      alt={img.name}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <ImageIcon className="w-5 h-5 text-slate-400 absolute pointer-events-none -z-10" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate font-mono">
                      {img.name}
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="text-rose-500 font-semibold">{formatBytes(img.size)}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-emerald-500 font-bold">{formatBytes(newSize)} (WebP)</span>
                      <span className="px-1 bg-emerald-500/10 text-emerald-600 rounded text-[9px]">
                        -72%
                      </span>
                    </div>

                    {img.usedInPosts.length > 0 && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                        <FileText className="w-3 h-3 text-cyan-500 shrink-0" />
                        <span className="truncate">
                          引用于: {img.usedInPosts.map((p) => p.title).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按键 */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSingleCompress(img)}
                    disabled={isThisCompressing || isCompressing}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500 text-purple-600 hover:text-white dark:text-purple-400 border border-purple-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isThisCompressing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                    <span>转码 WebP</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
