'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { SafeImage } from '@/components/SafeImage';
import { MovieItem } from '@/lib/types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Film, 
  Upload, 
  Loader2, 
  Quote, 
  Star,
  Clapperboard,
  Sparkles
} from 'lucide-react';

interface MoviesEditorProps {
  movies: MovieItem[];
  onChange: (movies: MovieItem[]) => void;
}

const BADGE_PRESETS = [
  '科幻经典',
  '殿堂之作',
  '人物传记',
  '胶片漫游',
  '悬疑解构',
  '人文叙事',
  '影院二刷'
];

export function MoviesEditor({ movies, onChange }: MoviesEditorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [director, setDirector] = useState('');
  const [year, setYear] = useState('');
  const [cover, setCover] = useState('');
  const [rating, setRating] = useState(9.0);
  const [badge, setBadge] = useState('科幻经典');
  const [quote, setQuote] = useState('');
  const [note, setNote] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreateModal = () => {
    setEditingIdx(null);
    setTitle('');
    setDirector('');
    setYear('2024');
    setCover('');
    setRating(9.0);
    setBadge('科幻经典');
    setQuote('');
    setNote('');
    setModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    const item = movies[idx];
    setEditingIdx(idx);
    setTitle(item.title);
    setDirector(item.director || '');
    setYear(item.year || '');
    setCover(item.cover || '');
    setRating(typeof item.rating === 'number' ? item.rating : 9.0);
    setBadge(item.badge || '科幻经典');
    setQuote(item.quote || '');
    setNote(item.note || '');
    setModalOpen(true);
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('请选择图片文件 (JPG, PNG, WEBP, GIF)');
      return;
    }

    setUploadingCover(true);
    try {
      const res = await api.uploadMedia(file);
      const url = typeof res === 'string' ? res : res?.url;
      if (url) {
        setCover(url);
        toast.success('海报封面上传成功！');
      } else {
        toast.error('上传响应缺少 URL');
      }
    } catch (err: any) {
      toast.error('封面上传失败: ' + (err?.message || '未知异常'));
    } finally {
      setUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('请填写电影名称');
      return;
    }

    const newItem: MovieItem = {
      id: editingIdx !== null ? movies[editingIdx]?.id || `movie-${Date.now()}` : `movie-${Date.now()}`,
      title: title.trim(),
      director: director.trim(),
      year: year.trim(),
      cover: cover.trim(),
      rating: Number(rating) || 9.0,
      badge: badge.trim(),
      quote: quote.trim(),
      note: note.trim(),
    };

    let updated: MovieItem[];
    if (editingIdx !== null) {
      updated = [...movies];
      updated[editingIdx] = newItem;
      toast.success(`已更新电影《${title}》`);
    } else {
      updated = [newItem, ...movies];
      toast.success(`已收录电影《${title}》`);
    }

    onChange(updated);
    setModalOpen(false);
  };

  const handleDelete = (idx: number) => {
    const item = movies[idx];
    if (confirm(`确定要移除电影《${item.title}》吗？`)) {
      const updated = movies.filter((_, i) => i !== idx);
      onChange(updated);
      toast.success('已移除该电影条目');
    }
  };

  const handleMove = (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= movies.length) return;
    const updated = [...movies];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Film className="w-4 h-4 text-rose-500" />
            <span>近期观影与私人放映厅 (Cinema Lounge)</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            可视化管理当前正在欣赏的电影、纪录片或剧集，包括海报、导演、评分与深度感悟
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加电影条目</span>
        </button>
      </div>

      {/* 列表渲染 */}
      {movies.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center space-y-2 bg-secondary/10">
          <Clapperboard className="w-8 h-8 mx-auto text-muted-foreground/50 animate-pulse" />
          <p className="text-xs text-muted-foreground">暂未录入任何观影记录，点击上方按钮添加第一部电影。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {movies.map((item, idx) => (
            <div
              key={item.id || idx}
              className="group relative p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-neutral-900/50 hover:border-rose-500/40 transition-all flex gap-3.5 items-start shadow-sm"
            >
              {/* 海报预览 */}
              <div className="w-18 h-26 rounded-xl overflow-hidden bg-secondary/40 shrink-0 border border-border/50 relative shadow-inner">
                {item.cover ? (
                  <SafeImage
                    src={item.cover}
                    alt={item.title}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-muted-foreground gap-1">
                    <Film className="w-4 h-4 opacity-40" />
                    <span>无海报</span>
                  </div>
                )}
              </div>

              {/* 详情 */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-semibold border border-rose-500/20">
                    {item.badge || '电影'}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{item.rating || 9.0}</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-foreground truncate">{item.title}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {item.director ? `导演: ${item.director}` : ''} {item.year ? `(${item.year})` : ''}
                </p>

                {item.quote && (
                  <p className="text-xs text-foreground/80 italic bg-secondary/30 p-1.5 rounded-lg line-clamp-2 border-l-2 border-rose-500">
                    “{item.quote}”
                  </p>
                )}

                {/* 底部操作工具条 */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30 cursor-pointer"
                      title="上移"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === movies.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30 cursor-pointer"
                      title="下移"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(idx)}
                      className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>编辑</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="p-1 rounded hover:bg-red-500/10 text-red-500 cursor-pointer"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 弹窗创建/编辑 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-background rounded-3xl border border-border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Film className="w-4 h-4 text-rose-500" />
                <span>{editingIdx !== null ? '编辑电影条目' : '添加电影'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">电影名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：星际穿越 (Interstellar)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border focus:outline-none focus:border-rose-500 text-foreground text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">导演 / 编剧</label>
                  <input
                    type="text"
                    placeholder="例如：Christopher Nolan"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border focus:outline-none focus:border-rose-500 text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">年份 / 地区</label>
                  <input
                    type="text"
                    placeholder="例如：2014"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border focus:outline-none focus:border-rose-500 text-foreground text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">推荐指数 / 评分 (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border focus:outline-none focus:border-rose-500 text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">类型徽章</label>
                  <input
                    type="text"
                    placeholder="例如：科幻经典"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border focus:outline-none focus:border-rose-500 text-foreground text-xs"
                  />
                </div>
              </div>

              {/* 徽章预设 */}
              <div className="flex flex-wrap gap-1.5">
                {BADGE_PRESETS.map((bp) => (
                  <button
                    key={bp}
                    type="button"
                    onClick={() => setBadge(bp)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono border transition-all cursor-pointer ${
                      badge === bp
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {bp}
                  </button>
                ))}
              </div>

              {/* 海报封面 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground">海报封面 URL / 本地上传</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://... 或点击右侧上传"
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary/40 border border-border focus:outline-none focus:border-rose-500 text-foreground text-xs font-mono"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadCover}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>上传海报</span>
                  </button>
                </div>
                {cover && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="w-10 h-14 rounded-lg overflow-hidden relative shrink-0 border border-border">
                      <SafeImage src={cover} alt="Preview" containerClassName="w-full h-full" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate flex-1">{cover}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">心动台词 / 一句话概括</label>
                <input
                  type="text"
                  placeholder="例如：爱不是人类发明的东西，它一直存在，且超越时空维度。"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border focus:outline-none focus:border-rose-500 text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">观影随记 / 深度感悟</label>
                <textarea
                  rows={3}
                  placeholder="记录这部电影带给你的思考、视觉震撼或情感共鸣..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border focus:outline-none focus:border-rose-500 text-foreground text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl hover:bg-secondary text-muted-foreground text-xs font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  保存电影
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
