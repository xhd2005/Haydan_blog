'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Sparkles, 
  Layers, 
  Tag as TagIcon,
  Check,
  Link as LinkIcon,
  Flag
} from 'lucide-react';

export interface FocusTopic {
  id?: string;
  title: string;
  progress: number;
  badge: string;
  tags: string[];
  desc?: string;
  milestone?: string;
  link?: string;
}

interface FocusTopicsEditorProps {
  topics: FocusTopic[];
  onChange: (topics: FocusTopic[]) => void;
}

const BADGE_PRESETS = ['ACTIVE SPRINT', 'CORE SYSTEM', 'AI RETRIEVAL', 'ARCHITECTURE', 'HIGH CONCURRENCY'];

export function FocusTopicsEditor({ topics, onChange }: FocusTopicsEditorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(80);
  const [badge, setBadge] = useState('ACTIVE SPRINT');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [desc, setDesc] = useState('');
  const [milestone, setMilestone] = useState('');
  const [link, setLink] = useState('');

  const openCreateModal = () => {
    setEditingIdx(null);
    setTitle('');
    setProgress(80);
    setBadge('ACTIVE SPRINT');
    setTags(['Java 21', 'Spring Boot 3']);
    setTagInput('');
    setDesc('');
    setMilestone('');
    setLink('/projects');
    setModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    const item = topics[idx];
    setEditingIdx(idx);
    setTitle(item.title);
    setProgress(typeof item.progress === 'number' ? item.progress : 80);
    setBadge(item.badge || 'ACTIVE SPRINT');
    setTags(Array.isArray(item.tags) ? [...item.tags] : []);
    setTagInput('');
    setDesc(item.desc || '');
    setMilestone(item.milestone || '');
    setLink(item.link || '/projects');
    setModalOpen(true);
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = tagInput.trim();
    if (!val || tags.includes(val)) return;
    setTags([...tags, val]);
    setTagInput('');
  };

  const handleRemoveTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }

    const newItem: FocusTopic = {
      id: editingIdx !== null ? topics[editingIdx].id : `topic-${Date.now()}`,
      title: title.trim(),
      progress: Math.min(100, Math.max(0, Number(progress) || 0)),
      badge: badge.trim() || 'ACTIVE SPRINT',
      tags: tags.length > 0 ? tags : ['Dev'],
      desc: desc.trim() || undefined,
      milestone: milestone.trim() || undefined,
      link: link.trim() || undefined,
    };

    let next: FocusTopic[];
    if (editingIdx !== null) {
      next = [...topics];
      next[editingIdx] = newItem;
    } else {
      next = [...topics, newItem];
    }

    onChange(next);
    setModalOpen(false);
  };

  const handleDelete = (idx: number) => {
    const next = topics.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...topics];
    const temp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = temp;
    onChange(next);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === topics.length - 1) return;
    const next = [...topics];
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
          <Layers className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-foreground text-sm">
            当前工程攻坚专题 (Active Engineering Sprints)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-medium border border-emerald-500/20">
            {topics.length} 项进行中
          </span>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加攻坚专题</span>
        </button>
      </div>

      {/* 卡片列表 */}
      {topics.length === 0 ? (
        <div className="p-8 rounded-2xl bg-secondary/30 border border-dashed border-border text-center space-y-2">
          <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/40 animate-pulse" />
          <p className="text-xs text-muted-foreground font-medium">暂无攻坚专题项目</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> 点击添加第一个专题
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {topics.map((item, idx) => (
            <div
              key={item.id || idx}
              className="group relative p-4 rounded-2xl bg-card hover:bg-card/95 border border-border hover:border-emerald-500/30 shadow-sm transition-all flex flex-col justify-between space-y-3"
            >
              {/* 顶部标题与徽标 */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                      {item.badge}
                    </span>
                    <h4 className="font-semibold text-xs text-foreground truncate">
                      {item.title}
                    </h4>
                  </div>
                  {item.milestone && (
                    <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      <span>{item.milestone}</span>
                    </div>
                  )}
                  {item.desc && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  )}
                </div>

                {/* 操作按钮组 */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
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
                    disabled={idx === topics.length - 1}
                    title="下移"
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(idx)}
                    title="编辑专题"
                    className="p-1 rounded-md text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    title="删除专题"
                    className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 关联直达链接 */}
              {item.link && (
                <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-cyan-500" />
                  <span className="truncate">{item.link}</span>
                </div>
              )}

              {/* 技术栈标签 */}
              {Array.isArray(item.tags) && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
                  {item.tags.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
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
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>{editingIdx !== null ? '编辑工程攻坚专题' : '新增工程攻坚专题'}</span>
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
              {/* 标题 */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">专题标题 (Title)</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="如: Project Loom 虚拟线程高并发中枢"
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* 关键交付里程碑 */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-emerald-500" />
                  <span>当前攻坚关键里程碑 (Milestone)</span>
                </label>
                <input
                  type="text"
                  value={milestone}
                  onChange={(e) => setMilestone(e.target.value)}
                  placeholder="如: Sprint 2: 百万级虚拟线程长连接压测与滑动窗口限流"
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* 直达链接 */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-cyan-500" />
                  <span>成果直达链接 (Project / Post Link)</span>
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="如: /projects 或 /posts/loom-concurrency"
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* 状态徽标与快捷预设 */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">状态徽标 (Badge)</label>
                <div className="flex flex-wrap gap-1.5">
                  {BADGE_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBadge(p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        badge === p
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="或自定义输入徽标"
                  className="w-full p-2 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-[11px]"
                />
              </div>

              {/* 技术栈标签 */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-cyan-500" />
                  <span>技术栈标签 (Tags)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-secondary/50 border border-border min-h-[38px] items-center">
                  {tags.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-card border border-border text-foreground text-[11px]"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(i)}
                        className="text-muted-foreground hover:text-rose-500"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="输入标签按回车..."
                      className="w-full px-2 py-0.5 text-[11px] bg-transparent focus:outline-none text-foreground"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="p-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 方案要点简述 */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">架构方案简述 (Description)</label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="简述该专题的核心攻坚要点或关键收益..."
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* 底部按钮 */}
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
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
