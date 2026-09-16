'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { SafeImage } from '@/components/SafeImage';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  X, 
  BookOpen, 
  Upload, 
  Loader2, 
  Quote, 
  Check,
  FileText
} from 'lucide-react';

export interface ReadingNote {
  id?: string;
  title: string;
  author: string;
  cover?: string;
  progress: number;
  badge: string;
  quote: string;
  note?: string;
}

interface ReadingNotesEditorProps {
  notes: ReadingNote[];
  onChange: (notes: ReadingNote[]) => void;
}

const BADGE_PRESETS = [
  'BOOK · 4TH READING',
  'BOOK · IN PROGRESS',
  'PAPER · DEEP DIVE',
  '🌲 EVERGREEN',
  'CLASSIC · MUST READ',
  'ARCHITECTURE'
];

export function ReadingNotesEditor({ notes, onChange }: ReadingNotesEditorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [cover, setCover] = useState('');
  const [progress, setProgress] = useState(85);
  const [badge, setBadge] = useState('BOOK · IN PROGRESS');
  const [quote, setQuote] = useState('');
  const [note, setNote] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreateModal = () => {
    setEditingIdx(null);
    setTitle('');
    setAuthor('');
    setCover('');
    setProgress(75);
    setBadge('BOOK · IN PROGRESS');
    setQuote('');
    setNote('');
    setModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    const item = notes[idx];
    setEditingIdx(idx);
    setTitle(item.title);
    setAuthor(item.author || '');
    setCover(item.cover || '');
    setProgress(typeof item.progress === 'number' ? item.progress : 50);
    setBadge(item.badge || 'BOOK · IN PROGRESS');
    setQuote(item.quote || '');
    setNote(item.note || '');
    setModalOpen(true);
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查图片格式与体积
    if (!file.type.startsWith('image/')) {
      toast.warning('请选择图片文件 (JPG, PNG, WEBP, GIF)');
      return;
    }

    setUploadingCover(true);
    try {
      const res = await api.uploadMedia(file);
      if (res && res.url) {
        setCover(res.url);
        toast.success('封面图片已直传 MinIO 云端！');
      } else {
        toast.error('上传未返回可用直链');
      }
    } catch (err: any) {
      toast.error(err.message || '封面上传失败');
    } finally {
      setUploadingCover(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      toast.warning('书名与作者为必填项');
      return;
    }

    const newItem: ReadingNote = {
      id: editingIdx !== null ? notes[editingIdx].id : `reading-${Date.now()}`,
      title: title.trim(),
      author: author.trim(),
      cover: cover.trim() || undefined,
      progress: Math.min(100, Math.max(0, Number(progress) || 0)),
      badge: badge.trim() || 'BOOK · IN PROGRESS',
      quote: quote.trim(),
      note: note.trim() || undefined,
    };

    let next: ReadingNote[];
    if (editingIdx !== null) {
      next = [...notes];
      next[editingIdx] = newItem;
    } else {
      next = [...notes, newItem];
    }

    onChange(next);
    setModalOpen(false);
  };

  const handleDelete = (idx: number) => {
    const next = notes.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...notes];
    const temp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = temp;
    onChange(next);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === notes.length - 1) return;
    const next = [...notes];
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
          <BookOpen className="w-4 h-4 text-cyan-500" />
          <span className="font-semibold text-foreground text-sm">
            经典图书与精辟书摘 (Reading Notes)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-mono font-medium border border-cyan-500/20">
            {notes.length} 本精读
          </span>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加精读书摘</span>
        </button>
      </div>

      {/* 书摘卡片列表 */}
      {notes.length === 0 ? (
        <div className="p-8 rounded-2xl bg-secondary/30 border border-dashed border-border text-center space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/40 animate-pulse" />
          <p className="text-xs text-muted-foreground font-medium">暂无图书与精读书摘</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="text-xs text-cyan-600 hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> 点击添加第一本在证书籍
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((item, idx) => (
            <div
              key={item.id || idx}
              className="group relative p-4 rounded-2xl bg-card hover:bg-card/95 border border-border hover:border-cyan-500/30 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
            >
              {/* 左侧：封面缩略图与主要信息 */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-16 rounded-lg bg-secondary border border-border overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                  {item.cover ? (
                    <SafeImage
                      src={item.cover}
                      alt={item.title}
                      aspectRatio="3/4"
                      containerClassName="w-full h-full"
                    />
                  ) : (
                    <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                  )}
                </div>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-semibold border border-cyan-500/20 font-mono">
                      {item.badge}
                    </span>
                    <h4 className="font-semibold text-xs text-foreground truncate">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      · {item.author}
                    </span>
                  </div>

                  {item.quote && (
                    <p className="text-[11px] text-foreground/85 italic line-clamp-1 border-l-2 border-cyan-500/50 pl-2 leading-relaxed">
                      “{item.quote}”
                    </p>
                  )}

                  {item.note && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      笔记: {item.note}
                    </p>
                  )}

                  {/* 进度条 */}
                  <div className="flex items-center gap-3 pt-0.5">
                    <div className="h-1.5 w-32 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {item.progress}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 右侧操作按钮 */}
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
                  disabled={idx === notes.length - 1}
                  title="下移"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(idx)}
                  title="编辑书摘"
                  className="p-1 rounded-md text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  title="删除书摘"
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
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-5 text-foreground max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-500" />
                <span>{editingIdx !== null ? '编辑精读书摘' : '新增精读书摘'}</span>
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
              {/* 书名与作者 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">书名 (Title)</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="如: Designing Data-Intensive Applications"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">作者 (Author)</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="如: Martin Kleppmann"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* 封面图片直传 MinIO */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>封面图片 (Cover Image)</span>
                  <span className="text-[10px] text-muted-foreground">支持图片直传 MinIO 云端</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 rounded-lg bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
                    {cover ? (
                      <SafeImage
                        src={cover}
                        alt="Preview"
                        aspectRatio="3/4"
                        containerClassName="w-full h-full"
                      />
                    ) : (
                      <BookOpen className="w-5 h-5 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={cover}
                      onChange={(e) => setCover(e.target.value)}
                      placeholder="封面图片 URL (或点击右侧直传)"
                      className="w-full p-2 rounded-xl bg-secondary border border-border text-foreground font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleUploadCover}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {uploadingCover ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-cyan-500" />
                        )}
                        <span>{uploadingCover ? '直传中...' : '本地直传 MinIO'}</span>
                      </button>
                      {cover && (
                        <button
                          type="button"
                          onClick={() => setCover('')}
                          className="text-[10px] text-rose-500 hover:underline"
                        >
                          清除封面
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 徽标预设 */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">徽标状态 (Badge)</label>
                <div className="flex flex-wrap gap-1.5">
                  {BADGE_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBadge(p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        badge === p
                          ? 'bg-cyan-600 text-white shadow-sm'
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
                  className="w-full p-2 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 text-[11px]"
                />
              </div>

              {/* 阅读进度滑块 */}
              <div className="space-y-2 p-3 rounded-2xl bg-secondary/40 border border-border">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">阅读进度 (Progress)</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-bold text-xs">
                    {progress}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* 金句引用 */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-cyan-500" />
                  <span>精辟金句摘录 (Quote)</span>
                </label>
                <textarea
                  rows={2}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="摘录书中触动心智的关键金句..."
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 italic"
                />
              </div>

              {/* 读书笔记 */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>研读心得与章节 (Note)</span>
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="如: 精读第9章分布式复制与一致性共识约束..."
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
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
