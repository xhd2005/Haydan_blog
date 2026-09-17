'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  X,
  Search,
  Check,
  Copy,
  CheckCheck,
  Filter,
  RotateCcw,
  Heart,
  Webhook,
  Columns,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { triggerRevalidate } from '@/components/admin/revalidate';
import { MemoWebhookSyncModal } from '@/components/admin/memos/MemoWebhookSyncModal';
import { MemoWeeklyDigestModal } from '@/components/admin/memos/MemoWeeklyDigestModal';

const DRAFT_STORAGE_KEY = 'hayden_memo_draft_v1';

export default function AdminMemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State for creating
  const [content, setContent] = useState('');
  const [images, setImages] = useState('');
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [tags, setTags] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // M4 Feature States: Modals, DragOver, Heart Ping, Likes
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [digestModalOpen, setDigestModalOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [heartPingId, setHeartPingId] = useState<number | null>(null);
  const [likedMemoIds, setLikedMemoIds] = useState<Set<number>>(new Set());

  // 多选与批处理
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  const MOOD_PRESETS = ['😊 愉快', '🤔 思考', '⚡ 心流', '🌙 夜思', '💡 灵感', '🍵 闲暇', '🎉 惊喜', '😶 放空'];
  const WEATHER_PRESETS = ['☀️ 晴朗', '⛅ 多云', '🌧️ 阴雨', '❄️ 初雪', '🌫️ 晨雾', '💨 微风'];

  // 草稿自动恢复
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.content) setContent(parsed.content);
        if (parsed.images) setImages(parsed.images);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.mood) setMood(parsed.mood);
        if (parsed.weather) setWeather(parsed.weather);
        if (parsed.tags) setTags(parsed.tags);
      }
    } catch {
      // ignore
    }
  }, []);

  // 草稿自动持久化
  useEffect(() => {
    if (content || images || location || mood || weather || tags) {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ content, images, location, mood, weather, tags })
        );
      } catch {
        // ignore
      }
    }
  }, [content, images, location, mood, weather, tags]);

  const clearDraft = () => {
    setContent('');
    setImages('');
    setLocation('');
    setMood('');
    setWeather('');
    setTags('');
    setIsPinned(false);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      toast.info('草稿已清空');
    } catch {
      // ignore
    }
  };

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

  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      const curList = images ? images.split(',').map((s) => s.trim()).filter(Boolean) : [];
      for (const file of files) {
        const media = await api.uploadMedia(file);
        if (media?.url) {
          curList.push(media.url);
        }
      }
      setImages(curList.join(', '));
      toast.success(`成功拖拽上传 ${files.length} 张随记拍立得配图！`);
    } catch (err: any) {
      toast.error(err.message || '拖拽图片上传失败');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchMemos = async () => {
    setLoading(true);
    try {
      const res = await api.getMemos({ page: 1, pageSize: 100 });
      setMemos(res.records || []);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '获取随记数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, []);

  // 搜索过滤
  const filteredMemos = useMemo(() => {
    if (!searchQuery.trim()) return memos;
    const q = searchQuery.trim().toLowerCase();
    return memos.filter((m) => {
      const contentMatch = m.content?.toLowerCase().includes(q);
      const tagMatch = m.tags?.toLowerCase().includes(q);
      const locMatch = m.location?.toLowerCase().includes(q);
      const moodMatch = m.mood?.toLowerCase().includes(q);
      return contentMatch || tagMatch || locMatch || moodMatch;
    });
  }, [memos, searchQuery]);

  // 全选/反选
  const isAllSelected = filteredMemos.length > 0 && filteredMemos.every((m) => selectedIds.has(m.id));
  const isSomeSelected = filteredMemos.some((m) => selectedIds.has(m.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredMemos.forEach((m) => next.add(m.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.createMemo({
        content: content.trim(),
        images: images.trim() || undefined,
        location: location.trim() || undefined,
        mood: mood.trim() || undefined,
        weather: weather.trim() || undefined,
        tags: tags.trim() || undefined,
        isPinned: isPinned ? 1 : 0,
      });
      clearDraft();
      toast.success('随记动态发布成功！');
      await triggerRevalidate(['/memos', '/']);
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
      await triggerRevalidate(['/memos', '/']);
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
      await triggerRevalidate(['/memos', '/']);
      setMemos(memos.filter((m) => m.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('随记已成功删除');
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  // 批量修改置顶
  const handleBatchPin = async (pinState: boolean) => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    const ids = Array.from(selectedIds);
    const targetMemos = memos.filter((m) => selectedIds.has(m.id) && (m.isPinned === 1) !== pinState);

    try {
      const results = await Promise.allSettled(
        targetMemos.map((m) => api.togglePinMemo(m.id))
      );
      const count = results.filter((r) => r.status === 'fulfilled').length;

      setMemos((prev) =>
        prev.map((m) => (selectedIds.has(m.id) ? { ...m, isPinned: pinState ? 1 : 0 } : m))
      );
      setSelectedIds(new Set());
      toast.success(`已批量将 ${count} 条随记${pinState ? '置顶' : '取消置顶'}`);
      await triggerRevalidate(['/memos', '/']);
    } catch (err: any) {
      toast.error(err.message || '批量操作失败');
    } finally {
      setBatchLoading(false);
    }
  };

  // 批量删除 (严格遵从 Rule 6 破坏性批处理防误触红线)
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = await confirmModal({
      title: '批量删除随记确认',
      message: `确定要彻底删除选中的 ${selectedIds.size} 条随记动态吗？此操作不可逆。`,
      confirmText: '确认批量删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    setBatchLoading(true);
    const ids = Array.from(selectedIds);

    try {
      const results = await Promise.allSettled(
        ids.map((id) => api.deleteMemo(id))
      );
      const count = results.filter((r) => r.status === 'fulfilled').length;

      setMemos((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
      toast.success(`成功批量删除 ${count} 条随记`);
      await triggerRevalidate(['/memos', '/']);
    } catch (err: any) {
      toast.error(err.message || '批量删除失败');
    } finally {
      setBatchLoading(false);
    }
  };

  // 一键复制 Markdown 引用卡片
  const handleCopyMarkdownQuote = (memo: Memo) => {
    const quote = `> [!NOTE]\n> ${memo.content}\n> \n> — Hayden Xue · ${memo.location || '随笔'} (${memo.createdAt?.substring(0, 10) || ''})\n`;
    navigator.clipboard.writeText(quote);
    setCopiedId(memo.id);
    toast.success('已复制随记 Markdown 引用格式！');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full space-y-5 text-xs">
      <AdminPageHeader
        title="随记微动态工坊 (Memos Studio)"
        description="即时记录生活碎片、打卡心流灵感，支持 LocalStorage 草稿保护、多维微标签与多选批处理"
        icon={MessageSquareQuote}
        badgeText={`已发布 ${memos.length} 条`}
        breadcrumbs={[
          { label: 'Studio 控制台', href: '/admin/dashboard' },
          { label: '随记微动态' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWebhookModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-card hover:bg-secondary text-foreground text-xs font-medium border border-border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="配置 Telegram / 飞书 移动端快捷速记 Webhook"
            >
              <Webhook className="w-3.5 h-3.5 text-blue-500" />
              <span>移动速记 Webhook</span>
            </button>
            <button
              type="button"
              onClick={() => setDigestModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="基于最近随记一键 AI 聚合生成每周技术周报"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI 提炼周报草稿</span>
            </button>
          </div>
        }
      />

      {/* Memo Creation Form / Frosted Launchpad */}
      <form
        onSubmit={handleCreate}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDropFiles}
        className={`p-6 rounded-3xl bg-card/80 backdrop-blur-xl border transition-all duration-300 space-y-4 shadow-lg ${
          isDraggingOver
            ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/20 scale-[1.005]'
            : 'border-border/80 hover:border-border'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>随记发射台 (Memos Frosted Launchpad)</span>
            <span className="text-[10px] text-muted-foreground font-normal hidden sm:inline">
              · 支持直接拖拽图片至卡片生成拍立得相册
            </span>
          </div>

          {(content || images || location) && (
            <button
              type="button"
              onClick={clearDraft}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>清空草稿</span>
            </button>
          )}
        </div>

        {/* 主文本框 */}
        <textarea
          required
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="此刻在想些什么？捕捉灵感、记录心流...(支持 LocalStorage 实时持久化防丢与图片拖拽投掷)"
          className="w-full p-4 rounded-2xl bg-secondary/70 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground resize-y leading-relaxed shadow-inner"
        />

        {/* 附件与定位 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 配图与上传 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/60 border border-border">
              <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={images}
                onChange={(e) => setImages(e.target.value)}
                placeholder="图片 URL (多张逗号分隔) 或点击右侧本地上传/直接拖放"
                className="w-full bg-transparent text-foreground text-xs focus:outline-none"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadMemoImage}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground text-[11px] font-medium hover:bg-secondary transition-colors shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Upload className="w-3.5 h-3.5" />}
                <span>本地传图</span>
              </button>
            </div>

            {/* 拍立得照片墙 (Polaroid Deck) */}
            {images && (
              <div className="flex flex-wrap gap-3 pt-2">
                {images.split(',').map((url, idx) => {
                  const trimmed = url.trim();
                  if (!trimmed) return null;
                  const rotateDeg = idx % 2 === 0 ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0';
                  return (
                    <div
                      key={idx}
                      className={`group relative p-1.5 pb-4 rounded-xl bg-white dark:bg-neutral-800 shadow-md border border-black/10 dark:border-white/10 transition-all duration-300 ${rotateDeg} w-20 flex flex-col items-center`}
                    >
                      {/* Polaroid Tape Accent */}
                      <div className="w-6 h-1.5 bg-amber-200/80 dark:bg-amber-400/40 rounded-xs mx-auto -mt-2.5 mb-1 shadow-xs" />
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-border/40">
                        <img src={trimmed} alt="polaroid" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] text-neutral-400 font-mono mt-1 scale-90">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const list = images.split(',').map((s) => s.trim()).filter(Boolean);
                          list.splice(idx, 1);
                          setImages(list.join(', '));
                        }}
                        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                        title="删除该拍立得照片"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 地点 */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/60 border border-border">
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

        {/* 心情与天气选择区 (Mood & Weather Bubbles) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* 心情气泡 */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-secondary/40 border border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium text-[11px]">随记心情 (Mood Bubbles)</span>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="自定义心情..."
                className="bg-background px-2 py-0.5 rounded-lg border border-border text-foreground text-[11px] w-28 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {MOOD_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m === mood ? '' : m)}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-all duration-200 cursor-pointer shadow-xs ${
                    mood === m
                      ? 'bg-amber-500/20 border-amber-500 border text-amber-600 dark:text-amber-400 font-bold scale-105'
                      : 'bg-card/80 border border-border text-muted-foreground hover:text-foreground hover:scale-105 hover:bg-secondary'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 天气气泡 */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-secondary/40 border border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium text-[11px]">随记天气 (Weather Bubbles)</span>
              <input
                type="text"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                placeholder="自定义天气..."
                className="bg-background px-2 py-0.5 rounded-lg border border-border text-foreground text-[11px] w-28 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {WEATHER_PRESETS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeather(w === weather ? '' : w)}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-all duration-200 cursor-pointer shadow-xs ${
                    weather === w
                      ? 'bg-blue-500/20 border-blue-500 border text-blue-600 dark:text-blue-400 font-bold scale-105'
                      : 'bg-card/80 border border-border text-muted-foreground hover:text-foreground hover:scale-105 hover:bg-secondary'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 标签输入 */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary border border-border">
          <span className="text-muted-foreground font-bold px-1">#</span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="随记标签 (多个标签用逗号分隔，如：摄影, 漫游, 灵感)"
            className="w-full bg-transparent text-foreground text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-border text-foreground focus:ring-0 cursor-pointer"
            />
            <Pin className="w-3.5 h-3.5 text-amber-500" />
            <span>首页与时间线置顶显示</span>
          </label>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-5 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>发布随记</span>
          </button>
        </div>
      </form>

      {/* Memos List & Management */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-foreground">已发布随记动态</h2>
            <span className="text-muted-foreground font-mono text-xs">
              共 {memos.length} 条
            </span>
          </div>

          {/* 搜索框与全选操作 */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索随记内容或标签..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {filteredMemos.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-3 py-1.5 rounded-xl border border-border bg-card text-foreground hover:bg-secondary text-xs shrink-0 cursor-pointer font-medium"
              >
                {isAllSelected ? '取消全选' : '全部选择'}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>加载随记数据中...</span>
          </div>
        ) : filteredMemos.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
            {searchQuery ? '未检索到匹配的随记' : '暂无随记，在上方发布第一条吧！'}
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 [column-fill:_balance]">
            {filteredMemos.map((memo) => {
              const imgList = memo.images ? memo.images.split(',').map((u) => u.trim()).filter(Boolean) : [];
              const isSelected = selectedIds.has(memo.id);

              return (
                <div
                  key={memo.id}
                  onDoubleClick={() => {
                    setHeartPingId(memo.id);
                    setLikedMemoIds((prev) => new Set(prev).add(memo.id));
                    toast.success('❤️ 已点赞收藏该条随记！');
                    setTimeout(() => setHeartPingId(null), 900);
                  }}
                  className={`break-inside-avoid relative group p-5 rounded-3xl bg-card/85 backdrop-blur-md border transition-all duration-300 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md cursor-pointer select-none mb-4 ${
                    isSelected
                      ? 'border-indigo-500/60 bg-indigo-500/5 ring-2 ring-indigo-500/20'
                      : memo.isPinned === 1
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-border/80 hover:border-border'
                  }`}
                >
                  {/* 双击点赞动效 */}
                  {heartPingId === memo.id && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                      <Heart className="w-16 h-16 text-rose-500 fill-rose-500 animate-ping drop-shadow-xl" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(memo.id)}
                          className="rounded border-border text-foreground focus:ring-0 cursor-pointer"
                        />
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{memo.createdAt?.replace('T', ' ').substring(0, 16)}</span>
                        </div>
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
                            onClick={(e) => e.stopPropagation()}
                            className="block w-14 h-14 rounded-xl overflow-hidden border border-border relative bg-secondary hover:opacity-80 transition-opacity"
                          >
                            <img src={url} alt="memo-pic" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* 徽章行：心情、天气、地点、标签 */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                      {memo.mood && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-[10px] border border-amber-500/20 shadow-xs">
                          {memo.mood}
                        </span>
                      )}
                      {memo.weather && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-[10px] border border-blue-500/20 shadow-xs">
                          {memo.weather}
                        </span>
                      )}
                      {memo.location && (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] border border-emerald-500/20 shadow-xs">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{memo.location}</span>
                        </span>
                      )}
                      {memo.tags &&
                        memo.tags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] border border-border"
                            >
                              #{t}
                            </span>
                          ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/60" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleCopyMarkdownQuote(memo)}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="复制为 Markdown 引用格式"
                    >
                      {copiedId === memo.id ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-medium">已复制引用</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制引用</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* 喜爱 / 点赞 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLikedMemoIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(memo.id)) {
                              next.delete(memo.id);
                            } else {
                              next.add(memo.id);
                              toast.success('❤️ 已收藏随记');
                            }
                            return next;
                          });
                        }}
                        title="点赞收藏随记 (也可双击卡片)"
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          likedMemoIds.has(memo.id)
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedMemoIds.has(memo.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePin(memo)}
                        title={memo.isPinned === 1 ? '取消置顶' : '置顶展示'}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          memo.isPinned === 1
                            ? 'border-amber-500/40 text-amber-500 hover:bg-amber-500/10'
                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(memo.id)}
                        title="删除随记"
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Batch Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.12] shadow-2xl animate-in slide-in-from-bottom-5">
          <span className="font-medium text-foreground text-xs pr-2 border-r border-border">
            已选择 <span className="text-primary font-bold">{selectedIds.size}</span> 条随记
          </span>

          <button
            type="button"
            disabled={batchLoading}
            onClick={() => handleBatchPin(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Pin className="w-3.5 h-3.5" />
            <span>批量置顶</span>
          </button>

          <button
            type="button"
            disabled={batchLoading}
            onClick={() => handleBatchPin(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>取消置顶</span>
          </button>

          <button
            type="button"
            disabled={batchLoading}
            onClick={handleBatchDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>彻底删除</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors ml-1 cursor-pointer"
            title="取消勾选"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 移动端 Webhook 配置与测试模态框 */}
      <MemoWebhookSyncModal
        isOpen={webhookModalOpen}
        onClose={() => setWebhookModalOpen(false)}
        onSyncSuccess={fetchMemos}
      />

      {/* AI 随记提炼周报模态框 */}
      <MemoWeeklyDigestModal
        isOpen={digestModalOpen}
        onClose={() => setDigestModalOpen(false)}
        memos={memos}
        selectedMemoIds={selectedIds}
      />
    </div>
  );
}
