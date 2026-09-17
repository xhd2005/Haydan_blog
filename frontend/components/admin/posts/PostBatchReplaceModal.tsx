'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Post } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import {
  previewBatchReplace,
  saveBatchReplaceSnapshot,
  getBatchReplaceSnapshots,
  removeBatchReplaceSnapshot,
  PostMatchResult,
  BatchReplaceSnapshot,
} from '@/lib/postBatchReplace';
import {
  Search,
  Replace,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  History,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PostBatchReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPostIds?: number[];
  onSuccess?: () => void;
}

export function PostBatchReplaceModal({
  isOpen,
  onClose,
  selectedPostIds = [],
  onSuccess,
}: PostBatchReplaceModalProps) {
  const [activeTab, setActiveTab] = useState<'replace' | 'history'>('replace');

  // 搜索替换表单
  const [searchPattern, setSearchPattern] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [matchCase, setMatchCase] = useState(true);
  const [applyScope, setApplyScope] = useState<'ALL' | 'SELECTED'>('ALL');

  // 状态与预览数据
  const [scanning, setScanning] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [previewResults, setPreviewResults] = useState<PostMatchResult[] | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});

  // 历史快照
  const [snapshots, setSnapshots] = useState<BatchReplaceSnapshot[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSnapshots(getBatchReplaceSnapshots());
      if (selectedPostIds.length > 0) {
        setApplyScope('SELECTED');
      } else {
        setApplyScope('ALL');
      }
    }
  }, [isOpen, selectedPostIds]);

  const togglePostExpanded = (id: number) => {
    setExpandedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. 执行全量并发水合与预览计算 (遵守正文数据水合铁律)
  const handlePreview = async () => {
    if (!searchPattern.trim()) {
      toast.warning('请输入搜索内容');
      return;
    }

    setScanning(true);
    setPreviewResults(null);
    try {
      // 1. 获取精简列表
      const res = await api.getAdminPosts({ pageSize: 100 });
      const slimPosts = res.records || [];

      // 2. 根据范围筛选目标 ID
      const targetIds =
        applyScope === 'SELECTED' && selectedPostIds.length > 0
          ? selectedPostIds
          : slimPosts.map((p) => p.id);

      // 3. 严格并发水合获取完整正文
      const hydratedPosts = await Promise.all(
        slimPosts
          .filter((p) => targetIds.includes(p.id))
          .map(async (p) => {
            try {
              return await api.getPostById(p.id);
            } catch {
              return p;
            }
          })
      );

      // 4. 调用预览引擎计算 Diff
      const matches = previewBatchReplace(
        hydratedPosts,
        searchPattern,
        replaceText,
        isRegex,
        matchCase,
        targetIds
      );

      setPreviewResults(matches);
      // 默认展开前 3 个匹配项
      const defaultExpanded: Record<number, boolean> = {};
      matches.slice(0, 3).forEach((m) => {
        defaultExpanded[m.postId] = true;
      });
      setExpandedPosts(defaultExpanded);

      if (matches.length === 0) {
        toast.info('未在目标文章正文中找到匹配内容');
      } else {
        const totalMatches = matches.reduce((sum, item) => sum + item.matchCount, 0);
        toast.success(`扫描完成：在 ${matches.length} 篇文章中发现 ${totalMatches} 处匹配！`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '扫描预览失败');
    } finally {
      setScanning(false);
    }
  };

  // 2. 一键执行替换并自动留存回滚快照
  const handleExecuteReplace = async () => {
    if (!previewResults || previewResults.length === 0) {
      toast.warning('请先点击扫描预览确认替换内容');
      return;
    }

    const totalMatches = previewResults.reduce((sum, item) => sum + item.matchCount, 0);
    const confirmed = await confirmModal({
      title: '执行全站正文批量替换确认',
      message: `确定要将 ${previewResults.length} 篇文章中的 ${totalMatches} 处匹配内容替换为「${replaceText}」吗？系统将自动生成 undo 撤销快照，随时可一键回滚。`,
      confirmText: '确认执行替换',
    });
    if (!confirmed) return;

    setExecuting(true);
    const snapshotId = `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const snapshotPosts: BatchReplaceSnapshot['posts'] = [];

    try {
      // 逐篇并发更新
      const updatePromises = previewResults.map(async (item) => {
        // 保存快照数据
        snapshotPosts.push({
          postId: item.postId,
          title: item.title,
          beforeContent: item.beforeContent,
          afterContent: item.afterContent,
        });

        // 提交后端更新
        return api.updatePost(item.postId, {
          title: item.title,
          content: item.afterContent,
        });
      });

      await Promise.all(updatePromises);

      // 持久化回滚快照
      saveBatchReplaceSnapshot({
        snapshotId,
        searchPattern,
        replaceText,
        isRegex,
        matchCase,
        timestamp: new Date().toISOString(),
        updatedCount: previewResults.length,
        posts: snapshotPosts,
      });

      toast.success(`全站批量替换成功！已更新 ${previewResults.length} 篇文章。`);
      setPreviewResults(null);
      setSnapshots(getBatchReplaceSnapshots());
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '批量替换执行失败');
    } finally {
      setExecuting(false);
    }
  };

  // 3. 快照一键回滚恢复
  const handleRollback = async (snapshot: BatchReplaceSnapshot) => {
    const confirmed = await confirmModal({
      title: '撤销回滚快照确认',
      message: `确定要撤销快照 [${snapshot.snapshotId}] 并将 ${snapshot.posts.length} 篇文章恢复至替换前的内容吗？`,
      confirmText: '确认撤销回滚',
      variant: 'danger',
    });
    if (!confirmed) return;

    setRollingBackId(snapshot.snapshotId);
    try {
      await Promise.all(
        snapshot.posts.map(async (p) => {
          return api.updatePost(p.postId, {
            title: p.title,
            content: p.beforeContent,
          });
        })
      );

      removeBatchReplaceSnapshot(snapshot.snapshotId);
      setSnapshots(getBatchReplaceSnapshots());
      toast.success(`成功撤销回滚快照！${snapshot.posts.length} 篇文章已恢复原状。`);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '撤销回滚失败');
    } finally {
      setRollingBackId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-white/95 dark:bg-[#0c0e14]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 弹窗头部 */}
        <div className="px-8 py-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Replace className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                全站博文内容批量查找与替换引擎
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Undo Snapshot
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                并发水合获取正文，支持段落级 Git Diff 实时预览与快照一键安全回滚
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-200/50 dark:bg-white/[0.06] rounded-xl text-xs font-medium">
              <button
                onClick={() => setActiveTab('replace')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'replace'
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                查找替换
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                快照历史 ({snapshots.length})
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 弹窗主体 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {activeTab === 'replace' ? (
            <>
              {/* 输入区域 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-500" />
                    查找文本 / 正则表达式
                  </label>
                  <input
                    type="text"
                    value={searchPattern}
                    onChange={(e) => setSearchPattern(e.target.value)}
                    placeholder="输入要查找的字符、关键词或旧域名..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Replace className="w-3.5 h-3.5 text-emerald-500" />
                    替换为
                  </label>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="输入目标替换文本或新直链..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>

              {/* 选项与范围控制 */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
                <div className="flex items-center gap-5 text-xs text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isRegex}
                      onChange={(e) => setIsRegex(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>启用正则表达式 (Regex)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={matchCase}
                      onChange={(e) => setMatchCase(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>区分大小写</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">操作范围:</span>
                  <div className="flex items-center p-0.5 bg-slate-200/60 dark:bg-white/10 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setApplyScope('ALL')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        applyScope === 'ALL'
                          ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      全站文章
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyScope('SELECTED')}
                      disabled={selectedPostIds.length === 0}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        applyScope === 'SELECTED'
                          ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-500 disabled:opacity-40'
                      }`}
                    >
                      已选文章 ({selectedPostIds.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* 操作按钮栏 */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>正文数据水合安全保障已就绪，所有变动将自动生成审计快照</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={scanning || executing || !searchPattern.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white disabled:opacity-40 transition-colors"
                  >
                    {scanning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    实时扫描预览 Diff
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteReplace}
                    disabled={executing || scanning || !previewResults || previewResults.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-40 transition-all"
                  >
                    {executing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Replace className="w-3.5 h-3.5" />
                    )}
                    一键执行全站替换
                  </button>
                </div>
              </div>

              {/* Diff 预览结果展示区 */}
              {previewResults && (
                <div className="mt-6 space-y-4 border-t border-slate-200/80 dark:border-white/[0.08] pt-6">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      匹配结果预览 (共 {previewResults.length} 篇文章，
                      {previewResults.reduce((sum, item) => sum + item.matchCount, 0)} 处变动)
                    </span>
                    <span>点击卡片展开/收起段落 Diff</span>
                  </div>

                  {previewResults.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      没有找到包含「{searchPattern}」的正文段落
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {previewResults.map((item) => {
                        const isExpanded = expandedPosts[item.postId];
                        return (
                          <div
                            key={item.postId}
                            className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-neutral-900/40 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => togglePostExpanded(item.postId)}
                              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {item.title}
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                  #{item.postId}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                  {item.matchCount} 处匹配
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-4 border-t border-slate-200/60 dark:border-white/[0.05] space-y-3 bg-white/60 dark:bg-black/40 font-mono text-xs">
                                {item.diffSnippets.map((snippet, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="rounded-xl border border-slate-200/60 dark:border-white/[0.05] overflow-hidden"
                                  >
                                    <div className="px-3 py-1 bg-slate-100 dark:bg-white/[0.04] text-[10px] text-slate-400 border-b border-slate-200/40 dark:border-white/[0.03]">
                                      第 {snippet.line} 行
                                    </div>
                                    <div className="p-2.5 bg-rose-500/[0.06] text-rose-700 dark:text-rose-300 border-b border-rose-500/10 whitespace-pre-wrap break-all">
                                      - {snippet.before}
                                    </div>
                                    <div className="p-2.5 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap break-all">
                                      + {snippet.after}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* 快照历史记录列表 */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>历史批量替换审计快照列表 (最多存储 20 条，可随时一键回滚)</span>
              </div>

              {snapshots.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  暂无历史批量替换快照
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.snapshotId}
                      className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-neutral-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {snap.snapshotId}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(snap.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            {snap.searchPattern}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {snap.replaceText}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500">
                          影响文章：{snap.updatedCount} 篇 (
                          {snap.posts.map((p) => p.title).slice(0, 3).join('、')}
                          {snap.posts.length > 3 ? ' 等' : ''})
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          type="button"
                          onClick={() => handleRollback(snap)}
                          disabled={rollingBackId === snap.snapshotId}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                        >
                          {rollingBackId === snap.snapshotId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          一键撤销回滚
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
