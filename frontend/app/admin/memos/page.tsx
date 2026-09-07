'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Memo } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import {
  MessageSquareQuote,
  Plus,
  Trash2,
  Pin,
  MapPin,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Sparkles,
  Upload,
  X
} from 'lucide-react';

export default function AdminMemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State for creating
  const [content, setContent] = useState('');
  const [images, setImages] = useState('');
  const [location, setLocation] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleUploadMemoImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('请选择图片文件');
      return;
    }
    setUploadingImage(true);
    try {
      const media = await api.uploadMedia(file);
      const curList = images ? images.split(',').map((s) => s.trim()).filter(Boolean) : [];
      curList.push(media.url);
      setImages(curList.join(', '));
      toast.success('随记配图上传成功！');
    } catch (err: any) {
      toast.error(err.message || '上传配图失败');
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const fetchMemos = async () => {
    setLoading(true);
    try {
      const res = await api.getMemos({ page: 1, pageSize: 100 });
      setMemos(res.records || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.createMemo({
        content: content.trim(),
        images: images.trim() || undefined,
        location: location.trim() || undefined,
        isPinned: isPinned ? 1 : 0,
      });
      setContent('');
      setImages('');
      setLocation('');
      setIsPinned(false);
      toast.success('随记动态发布成功！');
      await fetchMemos();
    } catch (err: any) {
      toast.error(err.message || '发布随记失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (memo: Memo) => {
    try {
      await api.togglePinMemo(memo.id);
      toast.success(memo.isPinned ? '已取消置顶随记' : '已置顶该条随记');
      await fetchMemos();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal({
      title: '删除随记确认',
      message: '确定要删除这条随记动态吗？此操作不可逆。',
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteMemo(id);
      setMemos(memos.filter((m) => m.id !== id));
      toast.success('随记已成功删除');
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl text-xs">
      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <MessageSquareQuote className="w-6 h-6 text-emerald-500" />
            <span>随记微动态管理 (Memos)</span>
          </h1>
          <p className="text-muted-foreground mt-0.5">
            记录日常灵感碎片、所思所感、摄影速记与即时打卡，前台将以时间线与瀑布流展示。
          </p>
        </div>
        <div className="text-muted-foreground font-mono">共 {memos.length} 条随记</div>
      </div>

      {/* Instant Creator Form */}
      <form onSubmit={handleCreate} className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>即时发布新动态</span>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          placeholder="有什么新鲜事或突然冒出的设计灵感？支持 Markdown 语法..."
          className="w-full p-3 rounded-2xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary border border-border">
              <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={images}
                onChange={(e) => setImages(e.target.value)}
                placeholder="附带图片链接 (多张用英文逗号隔开)"
                className="w-full bg-transparent text-foreground text-xs focus:outline-none"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadMemoImage}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-card hover:bg-background border border-border text-foreground font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Upload className="w-3.5 h-3.5" />}
                <span>本地传图</span>
              </button>
            </div>

            {images && (
              <div className="flex flex-wrap gap-2 pt-1">
                {images.split(',').map((url, idx) => {
                  const trimmed = url.trim();
                  if (!trimmed) return null;
                  return (
                    <div key={idx} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-border">
                      <img src={trimmed} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const list = images.split(',').map((s) => s.trim()).filter(Boolean);
                          list.splice(idx, 1);
                          setImages(list.join(', '));
                        }}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除该图"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary border border-border">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="地点打卡 (如：深圳 · 科技园)"
              className="w-full bg-transparent text-foreground text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-border text-foreground focus:ring-0"
            />
            <Pin className="w-3.5 h-3.5 text-amber-500" />
            <span>首页与时间线置顶显示</span>
          </label>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-5 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>发布随记</span>
          </button>
        </div>
      </form>

      {/* Memos List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">已发布随记动态</h2>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>加载随记数据中...</span>
          </div>
        ) : memos.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
            暂无随记，在上方发布第一条吧！
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memos.map((memo) => {
              const imgList = memo.images ? memo.images.split(',').map((u) => u.trim()).filter(Boolean) : [];
              return (
                <div
                  key={memo.id}
                  className={`p-5 rounded-3xl bg-card border transition-all flex flex-col justify-between gap-3 ${
                    memo.isPinned === 1 ? 'border-amber-500/40 shadow-sm bg-amber-500/5' : 'border-border'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{memo.createdAt?.replace('T', ' ').substring(0, 16)}</span>
                      </div>
                      {memo.isPinned === 1 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                          <Pin className="w-2.5 h-2.5" /> 已置顶
                        </span>
                      )}
                    </div>

                    <p className="text-foreground whitespace-pre-wrap leading-relaxed text-xs">
                      {memo.content}
                    </p>

                    {/* Images preview */}
                    {imgList.length > 0 && (
                      <div className="flex gap-2 pt-1 flex-wrap">
                        {imgList.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-14 h-14 rounded-xl overflow-hidden border border-border relative bg-secondary hover:opacity-80"
                          >
                            <img src={url} alt="memo-pic" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}

                    {memo.location && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        <span>{memo.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60">
                    <button
                      onClick={() => handleTogglePin(memo)}
                      title={memo.isPinned === 1 ? '取消置顶' : '置顶展示'}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        memo.isPinned === 1
                          ? 'border-amber-500/40 text-amber-500 hover:bg-amber-500/10'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(memo.id)}
                      title="删除随记"
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
