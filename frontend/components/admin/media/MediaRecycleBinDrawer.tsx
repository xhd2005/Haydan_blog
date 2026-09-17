'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Media } from '@/lib/types';
import {
  RecycledMediaAsset,
  getRecycleBinAssets,
  restoreFromRecycleBin,
  purgeFromRecycleBin,
  moveToRecycleBin,
} from '@/lib/mediaReferenceTracker';
import { toast, confirmModal } from '@/lib/toast';
import { SafeImage } from '@/components/SafeImage';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  Clock,
  Sparkles,
  ShieldAlert,
  HardDrive,
  CheckCircle,
} from 'lucide-react';

interface MediaRecycleBinDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orphanAssets: Media[];
  onRefresh: () => void;
}

export function MediaRecycleBinDrawer({
  isOpen,
  onClose,
  orphanAssets,
  onRefresh,
}: MediaRecycleBinDrawerProps) {
  const [activeTab, setActiveTab] = useState<'bin' | 'orphans'>('bin');
  const [recycledAssets, setRecycledAssets] = useState<RecycledMediaAsset[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const loadBin = () => {
    setRecycledAssets(getRecycleBinAssets());
  };

  useEffect(() => {
    if (isOpen) {
      loadBin();
      setSelectedIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 移入回收站 (软删除冷冻 30 天)
  const handleMoveOrphansToBin = async (assetsToMove: Media[]) => {
    if (assetsToMove.length === 0) return;
    const confirmed = await confirmModal({
      title: '移入回收站确认',
      message: `确定要将选中的 ${assetsToMove.length} 个未引用孤立资产移入回收站冷冻 30 天吗？冷冻期内可随时恢复。`,
      confirmText: '确认移入回收站',
    });
    if (!confirmed) return;

    moveToRecycleBin(assetsToMove);
    toast.success(`已成功将 ${assetsToMove.length} 个孤立资产移入回收站！`);
    loadBin();
    onRefresh();
    setActiveTab('bin');
  };

  // 恢复回收站资产
  const handleRestore = (ids: number[]) => {
    restoreFromRecycleBin(ids);
    toast.success(`已恢复 ${ids.length} 个资产到媒体库！`);
    loadBin();
    onRefresh();
    setSelectedIds([]);
  };

  // 彻底物理粉碎清空 (破坏性操作强制接入 danger 确认)
  const handlePermanentPurge = async (ids: number[]) => {
    const confirmed = await confirmModal({
      title: '彻底永久粉碎文件确认',
      message: `高危操作：确定要彻底物理粉碎并清空选中的 ${ids.length} 个文件吗？文件将从云端对象存储与元数据中彻底抹除，此操作绝对不可逆！`,
      confirmText: `确认彻底永久销毁 (${ids.length}个文件)`,
      variant: 'danger',
    });
    if (!confirmed) return;

    await Promise.allSettled(ids.map((id) => api.deleteMedia(id)));
    purgeFromRecycleBin(ids);
    toast.success(`已彻底销毁 ${ids.length} 个废弃资产！`);
    loadBin();
    onRefresh();
    setSelectedIds([]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-2xl bg-white/95 dark:bg-[#0d0e14]/95 backdrop-blur-2xl border-l border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col">
          {/* 顶栏 */}
          <header className="px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  媒体资产 GC 孤立回收站
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    30 Days Retention
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  自动识别全站死链与孤立资产，冷冻保护 30 天防误删
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* 标签栏切换 */}
          <div className="px-6 pt-3 flex items-center gap-3 border-b border-slate-200/60 dark:border-white/[0.05] text-xs">
            <button
              onClick={() => setActiveTab('bin')}
              className={`pb-3 font-semibold transition-all border-b-2 ${
                activeTab === 'bin'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              已在回收站 ({recycledAssets.length})
            </button>
            <button
              onClick={() => setActiveTab('orphans')}
              className={`pb-3 font-semibold transition-all border-b-2 ${
                activeTab === 'orphans'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              扫描出的孤立闲置资产 ({orphanAssets.length})
            </button>
          </div>

          {/* 资产列表 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'bin' ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>回收站内的文件将在 30 天后自动物理清理</span>
                  {recycledAssets.length > 0 && (
                    <button
                      onClick={() => handlePermanentPurge(recycledAssets.map((a) => a.id))}
                      className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                    >
                      清空全部回收站
                    </button>
                  )}
                </div>

                {recycledAssets.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    回收站当前为空，没有被软删除的文件。
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {recycledAssets.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-neutral-900/40 space-y-2 relative group"
                      >
                        <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-neutral-800">
                          <SafeImage src={item.url} alt={item.filename} className="w-full h-full object-cover" containerClassName="w-full h-full" />
                        </div>
                        <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {item.filename}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Clock className="w-2.5 h-2.5" />
                            保留 30 天
                          </span>
                          <button
                            onClick={() => handleRestore([item.id])}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            恢复
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    全站博文、随记与配置均未引用的废弃孤立资产
                  </span>
                  {orphanAssets.length > 0 && (
                    <button
                      onClick={() => handleMoveOrphansToBin(orphanAssets)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                    >
                      一键全部移入回收站
                    </button>
                  )}
                </div>

                {orphanAssets.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    健康体检完美！全站所有媒体资源均处于有效引用状态，无孤立僵尸文件。
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {orphanAssets.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-neutral-900/40 space-y-2 relative group"
                      >
                        <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-neutral-800">
                          <SafeImage src={item.url} alt={item.filename} className="w-full h-full object-cover" containerClassName="w-full h-full" />
                        </div>
                        <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {item.filename}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{item.size ? (item.size / 1024).toFixed(1) + ' KB' : '-'}</span>
                          <button
                            onClick={() => handleMoveOrphansToBin([item])}
                            className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            移入回收站
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
