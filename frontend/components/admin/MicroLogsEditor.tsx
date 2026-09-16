'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Clock, 
  Calendar, 
  Sparkles, 
  Tag as TagIcon,
  Check
} from 'lucide-react';

export interface MicroLog {
  id?: string;
  date: string;
  tag: string;
  content: string;
}

interface MicroLogsEditorProps {
  logs: MicroLog[];
  onChange: (logs: MicroLog[]) => void;
}

const TAG_PRESETS = ['Architecture', 'Design System', 'Engineering', 'Milestone', 'Life', 'Research'];

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function MicroLogsEditor({ logs, onChange }: MicroLogsEditorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Form state
  const [date, setDate] = useState(getTodayString());
  const [tag, setTag] = useState('Architecture');
  const [content, setContent] = useState('');

  const openCreateModal = () => {
    setEditingIdx(null);
    setDate(getTodayString());
    setTag('Architecture');
    setContent('');
    setModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    const item = logs[idx];
    setEditingIdx(idx);
    setDate(item.date || getTodayString());
    setTag(item.tag || 'Architecture');
    setContent(item.content || '');
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      return;
    }

    const newItem: MicroLog = {
      id: editingIdx !== null ? logs[editingIdx].id : `log-${Date.now()}`,
      date: date.trim() || getTodayString(),
      tag: tag.trim() || 'Architecture',
      content: content.trim(),
    };

    let next: MicroLog[];
    if (editingIdx !== null) {
      next = [...logs];
      next[editingIdx] = newItem;
    } else {
      next = [...logs, newItem];
    }

    onChange(next);
    setModalOpen(false);
  };

  const handleDelete = (idx: number) => {
    const next = logs.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...logs];
    const temp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = temp;
    onChange(next);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === logs.length - 1) return;
    const next = [...logs];
    const temp = next[idx + 1];
    next[idx + 1] = next[idx];
    next[idx] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* 头部栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-foreground text-sm">
            近期生活与工程微日志 (Micro Logs)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-medium border border-amber-500/20">
            {logs.length} 条记录
          </span>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加微日志</span>
        </button>
      </div>

      {/* 微日志列表 */}
      {logs.length === 0 ? (
        <div className="p-8 rounded-2xl bg-secondary/30 border border-dashed border-border text-center space-y-2">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground/40 animate-pulse" />
          <p className="text-xs text-muted-foreground font-medium">暂无近期微日志</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="text-xs text-amber-600 hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> 点击发布第一条微日志
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((item, idx) => (
            <div
              key={item.id || idx}
              className="group relative p-3.5 rounded-2xl bg-card hover:bg-card/95 border border-border hover:border-amber-500/30 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* 日期胶囊 */}
                <div className="px-2.5 py-1 rounded-lg bg-secondary border border-border font-mono text-[11px] text-foreground font-semibold flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  <span>{item.date}</span>
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-medium border border-amber-500/20">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed break-words">
                    {item.content}
                  </p>
                </div>
              </div>

              {/* 右侧动作 */}
              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  title="上移"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === logs.length - 1}
                  title="下移"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(idx)}
                  title="编辑日志"
                  className="p-1 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  title="删除日志"
                  className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 弹窗模态框 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-5 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{editingIdx !== null ? '编辑微日志' : '新增微日志'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* 日期选择 */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>日志日期 (Date)</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* 分类标签 */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">分类标签 (Tag)</label>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTag(p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        tag === p
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="或自定义输入分类"
                  className="w-full p-2 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 text-[11px]"
                />
              </div>

              {/* 日志正文 */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">日志正文内容 (Content)</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="记录今天在架构设计、工程突破、技术思考或生活中的真实心智动态..."
                  className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              {/* 底部操作 */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>确定保存</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
