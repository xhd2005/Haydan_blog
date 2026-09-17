'use client';

import React, { useState, useEffect } from 'react';
import {
  PostRevision,
  getPostRevisions,
  savePostRevision,
  deletePostRevision,
  computeRevisionDiff,
  DiffLine,
} from '@/lib/postRevisions';
import { toast, confirmModal } from '@/lib/toast';
import {
  History,
  RotateCcw,
  Clock,
  FileText,
  Trash2,
  X,
  Sparkles,
  CheckCircle,
  Plus,
} from 'lucide-react';

interface PostRevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  currentTitle: string;
  currentContent: string;
  onRestore: (title: string, content: string) => void;
}

export function PostRevisionHistoryModal({
  isOpen,
  onClose,
  postId,
  currentTitle,
  currentContent,
  onRestore,
}: PostRevisionHistoryModalProps) {
  const [revisions, setRevisions] = useState<PostRevision[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [snapshotNote, setSnapshotNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const loadRevisions = () => {
    const list = getPostRevisions(postId);
    setRevisions(list);
    if (list.length > 0 && !selectedRevisionId) {
      setSelectedRevisionId(list[0].id);
    }
  };

  useEffect(() => {
    if (isOpen && postId) {
      loadRevisions();
    }
  }, [isOpen, postId]);

  const selectedRevision = revisions.find((r) => r.id === selectedRevisionId) || null;

  // 手动创建新快照
  const handleCreateSnapshot = () => {
    if (!currentTitle && !currentContent) {
      toast.warning('文章标题与内容均为空，无法创建快照');
      return;
    }
    const note = snapshotNote.trim() || '手动快照';
    const newRev = savePostRevision(postId, currentTitle, currentContent, note);
    setSnapshotNote('');
    setShowNoteInput(false);
    toast.success('已成功保存当前文章版本快照！');
    loadRevisions();
    setSelectedRevisionId(newRev.id);
  };

  // 恢复版本
  const handleRestore = async (revision: PostRevision) => {
    const confirmed = await confirmModal({
      title: '恢复历史版本确认',
      message: `确定要将当前编辑内容恢复至快照 [${revision.note}] (${new Date(revision.timestamp).toLocaleString()}) 吗？当前未保存的修改可能会被覆盖。`,
      confirmText: '确认恢复此版本',
    });
    if (!confirmed) return;

    onRestore(revision.title, revision.content);
    toast.success(`已恢复至版本: ${revision.note}`);
    onClose();
  };

  // 删除单条版本
  const handleDelete = (revId: string) => {
    deletePostRevision(postId, revId);
    toast.info('已移除该版本快照');
    const updated = revisions.filter((r) => r.id !== revId);
    setRevisions(updated);
    if (selectedRevisionId === revId) {
      setSelectedRevisionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  if (!isOpen) return null;

  // 计算选定版本与当前内容的 Diff
  const diffLines: DiffLine[] = selectedRevision
    ? computeRevisionDiff(selectedRevision.content, currentContent)
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-white/95 dark:bg-[#0c0e14]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* 顶部标题栏 */}
        <div className="px-8 py-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                博文时光机与版本历史
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Time Travel Revisions
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                支持版本差异行级对比、快速时间旅行与一键回滚恢复
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showNoteInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={snapshotNote}
                  onChange={(e) => setSnapshotNote(e.target.value)}
                  placeholder="快照备注 (如：修改前暂存)..."
                  className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
                <button
                  onClick={handleCreateSnapshot}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => setShowNoteInput(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNoteInput(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                拍摄当前版本快照
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 主体分栏 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：版本快照列表 */}
          <div className="w-80 border-r border-slate-200/80 dark:border-white/[0.08] overflow-y-auto p-4 space-y-2 bg-slate-50/40 dark:bg-neutral-900/20">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              历史快照 ({revisions.length})
            </div>

            {revisions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                暂无历史快照，在编辑文章时将自动拍摄或点击右上角手动记录。
              </div>
            ) : (
              revisions.map((rev) => {
                const isSelected = rev.id === selectedRevisionId;
                return (
                  <div
                    key={rev.id}
                    onClick={() => setSelectedRevisionId(rev.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-200 shadow-sm'
                        : 'border-transparent hover:bg-slate-100/70 dark:hover:bg-white/[0.03] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs truncate max-w-[170px]">
                        {rev.note}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(rev.id);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
                        title="删除该快照"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{new Date(rev.timestamp).toLocaleTimeString()}</span>
                      <span>·</span>
                      <span>{rev.wordCount} 字</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 右侧：版本差异与恢复操作 */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0c0e14]">
            {selectedRevision ? (
              <>
                {/* 差异头部操作条 */}
                <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      与当前编辑态的比对差异 (左侧为该快照，高亮为改动)
                    </span>
                  </div>

                  <button
                    onClick={() => handleRestore(selectedRevision)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    恢复至此快照
                  </button>
                </div>

                {/* Diff 行级渲染区 */}
                <div className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-1">
                  {diffLines.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                      该快照与当前编辑内容完全一致，无行级变动。
                    </div>
                  ) : (
                    diffLines.map((line, idx) => {
                      if (line.type === 'same') {
                        return (
                          <div
                            key={idx}
                            className="px-3 py-1 rounded text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-all"
                          >
                            <span className="inline-block w-8 text-slate-300 dark:text-slate-600 select-none">
                              {line.newLineNumber || line.oldLineNumber}
                            </span>
                            {line.text}
                          </div>
                        );
                      }
                      if (line.type === 'added') {
                        return (
                          <div
                            key={idx}
                            className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-l-2 border-emerald-500 whitespace-pre-wrap break-all"
                          >
                            <span className="inline-block w-8 text-emerald-400 select-none">+</span>
                            {line.text}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={idx}
                          className="px-3 py-1 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border-l-2 border-rose-500 whitespace-pre-wrap break-all"
                        >
                          <span className="inline-block w-8 text-rose-400 select-none">-</span>
                          {line.text}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                请在左侧选择一个快照查看版本对比
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
