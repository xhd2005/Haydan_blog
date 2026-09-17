'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CoverPickerButton } from '@/components/admin/CoverPickerButton';
import { Category, Tag, Post } from '@/lib/types';
import { toast } from '@/lib/toast';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import {
  ArrowLeft,
  Save,
  Upload,
  Loader2,
  Languages,
  Unlink,
  Sparkles,
  Sprout,
  Edit3,
  RotateCcw,
  SlidersHorizontal,
  X,
  FileText,
  Tag as TagIcon,
  Folder,
  Globe,
  ImageIcon,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  History,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { triggerRevalidate } from '@/components/admin/revalidate';
import { AiPostCurationToolbar } from '@/components/admin/AiPostCurationToolbar';
import { BilingualTranslationStudioModal } from '@/components/admin/BilingualTranslationStudioModal';
import { BilingualSplitEditor } from '@/components/admin/posts/BilingualSplitEditor';
import { PostRevisionHistoryModal } from '@/components/admin/posts/PostRevisionHistoryModal';
import { savePostRevision } from '@/lib/postRevisions';
import { normalizeMediaUrl } from '@/lib/media-url';

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const postId = Number(params.id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [cover, setCover] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [maturity, setMaturity] = useState<'SEEDLING' | 'BUDDING' | 'EVERGREEN'>('BUDDING');
  const [featured, setFeatured] = useState(0);
  const [readingTime, setReadingTime] = useState(3);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [translationPostId, setTranslationPostId] = useState<number | null>(null);
  const [translationPost, setTranslationPost] = useState<{ id: number; title: string; slug: string; lang: string; status: string } | null>(null);
  const [candidatePosts, setCandidatePosts] = useState<Post[]>([]);
  const [deriving, setDeriving] = useState(false);
  const [aiRadarJson, setAiRadarJson] = useState('');
  const [translateStudioOpen, setTranslateStudioOpen] = useState(false);
  const [bilingualMode, setBilingualMode] = useState(false);
  const [enTitle, setEnTitle] = useState('');
  const [enContent, setEnContent] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  // 属性抽屉展开状态 (桌面端默认展开，方便随时配置封面与发布属性)
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [excerptOpen, setExcerptOpen] = useState(false);

  // 结构化草稿防丢状态
  const [draftAvailable, setDraftAvailable] = useState<any | null>(null);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadCandidates = (targetLang: string) => {
    api.getAdminPosts({ pageSize: 50, lang: targetLang }).then((res) => {
      setCandidatePosts((res.records || []).filter((p) => p.id !== postId));
    }).catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      api.getCategories().catch(() => []),
      api.getTags().catch(() => []),
      api.getPostById(postId),
    ]).then(([cats, tgs, post]) => {
      setCategories(cats);
      setTags(tgs);
      if (post) {
        setTitle(post.title || '');
        setSlug(post.slug || '');
        setExcerpt(post.excerpt || '');
        setContent(post.content || '');
        setCover(post.cover || '');
        setCategoryId(post.categoryId);
        setStatus(post.status as any || 'PUBLISHED');
        setFeatured(post.featured || 0);
        setReadingTime(post.readingTime || 3);
        setSeoTitle(post.seoTitle || '');
        setSeoDescription(post.seoDescription || '');
        if (post.maturity) {
          setMaturity(post.maturity as any);
        }
        const postLang = (post.lang === 'en' ? 'en' : 'zh');
        setLang(postLang);
        setTranslationPostId(post.translationPostId || null);
        if (post.translationPost) {
          setTranslationPost(post.translationPost);
        } else if (post.translationPostId) {
          setTranslationPost({
            id: post.translationPostId,
            title: post.translationPostTitle || `文章 #${post.translationPostId}`,
            slug: post.translationPostSlug || '',
            lang: postLang === 'zh' ? 'en' : 'zh',
            status: 'PUBLISHED',
          });
        }
        loadCandidates(postLang === 'zh' ? 'en' : 'zh');
        if (post.aiRadarJson) {
          setAiRadarJson(post.aiRadarJson);
        }
        if (post.tags) {
          setSelectedTagIds(post.tags.map((t) => t.id));
        }

        if (post.translationPostId) {
          api.getPostById(post.translationPostId).then((trans) => {
            if (trans) {
              setEnTitle(trans.title || '');
              setEnContent(trans.content || '');
            }
          }).catch(() => {});
        }
        if (post.title || post.content) {
          savePostRevision(postId, post.title || '', post.content || '', '载入快照');
        }

        // 检测本地是否存在比服务端更新的草稿
        try {
          const savedDraft = localStorage.getItem(`draft_post_${postId}`);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            const draftTime = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;
            const postTime = post.updatedAt
              ? new Date(post.updatedAt).getTime()
              : (post.createdAt ? new Date(post.createdAt).getTime() : 0);
            if (
              draftTime > postTime ||
              (parsed.content && parsed.content !== post.content) ||
              (parsed.title && parsed.title !== post.title)
            ) {
              setDraftAvailable(parsed);
            }
          }
        } catch (e) {
          console.error('Failed to parse local draft', e);
        }
      }
      setFetching(false);
    }).catch((err) => {
      toast.error('加载文章失败: ' + err.message);
      router.push('/admin/posts');
    });
  }, [postId, router]);

  // 2 秒防抖自动保存结构化草稿
  useEffect(() => {
    if (fetching) return;
    if (!title.trim() && !content.trim()) return;

    const timer = setTimeout(() => {
      const payload = {
        title,
        slug,
        excerpt,
        content,
        categoryId,
        selectedTagIds,
        lang,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`draft_post_${postId}`, JSON.stringify(payload));
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setDraftSavedTime(timeStr);
    }, 2000);

    return () => clearTimeout(timer);
  }, [fetching, postId, title, slug, excerpt, content, categoryId, selectedTagIds, lang]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await api.uploadMedia(file);
      setCover(media.url);
      toast.success('封面图片上传成功');
    } catch (err: any) {
      toast.error(err.message || '上传封面失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (submitStatus = status) => {
    if (!title.trim()) {
      toast.warning('请填写文章标题');
      return;
    }
    if (!content.trim()) {
      toast.warning('请填写文章正文内容');
      return;
    }

    setLoading(true);
    try {
      savePostRevision(postId, title, content, `保存更新 (${submitStatus})`);
      await api.updatePost(postId, {
        title,
        slug: slug || undefined,
        excerpt,
        content,
        cover,
        categoryId,
        tagIds: selectedTagIds,
        status: submitStatus,
        maturity,
        featured,
        readingTime,
        seoTitle,
        seoDescription,
        lang,
        translationPostId,
        aiRadarJson: aiRadarJson || undefined,
      });
      await triggerRevalidate(['/blog', '/', `/blog/${slug}`, 'layout'], 'posts');
      toast.success('文章已成功更新并刷新前台静态缓存！');
      localStorage.removeItem(`draft_post_${postId}`);
      setStatus(submitStatus);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkTranslation = () => {
    setTranslationPostId(null);
    setTranslationPost(null);
    toast.info('已解除关联，点击保存文章后生效');
  };

  const handleDeriveTranslation = async () => {
    setDeriving(true);
    try {
      const newPost = await api.deriveTranslation(postId);
      toast.success('译文草稿派生成功，正在跳转进入双栏编辑器...');
      if (newPost && newPost.id) {
        router.push(`/admin/posts/edit/${newPost.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || '派生失败');
    } finally {
      setDeriving(false);
    }
  };

  const toggleTag = (id: number) => {
    if (selectedTagIds.includes(id)) {
      setSelectedTagIds(selectedTagIds.filter((t) => t !== id));
    } else {
      setSelectedTagIds([...selectedTagIds, id]);
    }
  };

  if (fetching) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-xs font-mono">正在载入博文内容与版本数据...</span>
      </div>
    );
  }

  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name || '未分类';

  return (
    <div className="w-full space-y-5">
      {/* 统一规范头部 */}
      <AdminPageHeader
        title={`编辑文章 #${postId}`}
        description="沉浸式双栏对照创作工坊：修改标题、正文、分类标签、数字花园成熟度与 SEO 配置。"
        icon={Edit3}
        badge={
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
            status === 'PUBLISHED'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          }`}>
            {status === 'PUBLISHED' ? '● 已发布上线' : '○ 草稿箱中'}
          </span>
        }
        breadcrumbs={[
          { label: 'Studio', href: '/admin/dashboard' },
          { label: '创作工坊', href: '/admin/posts' },
          { label: `编辑 #${postId}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* 前台直达查看 */}
            {slug && status === 'PUBLISHED' && (
              <Link
                href={`/blog/${slug}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border transition-colors"
                title="在前台查看已发布的文章"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>前台预览</span>
              </Link>
            )}

            {/* 版本时光机快照对比 */}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="px-3 py-2 rounded-xl bg-card hover:bg-secondary text-foreground text-xs font-medium border border-border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="查看博文历史版本快照与差异对比"
            >
              <History className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">版本时光机</span>
            </button>

            {/* 双语镜像对照模式 */}
            <button
              type="button"
              onClick={() => setBilingualMode((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                bilingualMode
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'bg-card hover:bg-secondary border-border text-foreground'
              }`}
              title="切换双语分屏镜像滚动对照模式"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-500" />
              <span>双语对照</span>
            </button>

            {/* 属性抽屉开关按钮 */}
            <button
              type="button"
              onClick={() => setInspectorOpen((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                inspectorOpen
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'bg-card hover:bg-secondary border-border text-foreground'
              }`}
              title="展开/折叠文章发布属性面板"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>发布属性</span>
              <span className="hidden sm:inline-block text-[10px] opacity-75 font-mono">
                ({selectedCategoryName} · {selectedTagIds.length}标签)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('DRAFT')}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border transition-colors disabled:opacity-50 cursor-pointer"
            >
              转为草稿
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('PUBLISHED')}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>保存更新</span>
            </button>
          </div>
        }
      />

      {/* 草稿恢复提示 Banner */}
      {draftAvailable && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-semibold">检测到本地存在未提交的草稿（新于服务端版本）</span>
              <span className="text-muted-foreground ml-1 font-mono">
                (保存于 {new Date(draftAvailable.updatedAt || Date.now()).toLocaleTimeString('zh-CN', { hour12: false })})
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                包含文章标题「{draftAvailable.title || '无标题'}」及最新编辑状态，是否恢复？
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                if (draftAvailable.title) setTitle(draftAvailable.title);
                if (draftAvailable.slug) setSlug(draftAvailable.slug);
                if (draftAvailable.excerpt) setExcerpt(draftAvailable.excerpt);
                if (draftAvailable.content) {
                  setContent(draftAvailable.content);
                  setReadingTime(Math.max(1, Math.ceil(draftAvailable.content.length / 400)));
                }
                if (draftAvailable.categoryId) setCategoryId(draftAvailable.categoryId);
                if (draftAvailable.selectedTagIds) setSelectedTagIds(draftAvailable.selectedTagIds);
                if (draftAvailable.lang) setLang(draftAvailable.lang);
                setDraftAvailable(null);
                toast.success('已恢复本地草稿完整表单！');
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors cursor-pointer"
            >
              一键恢复
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(`draft_post_${postId}`);
                setDraftAvailable(null);
                toast.info('本地草稿已丢弃');
              }}
              className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer"
            >
              丢弃草稿
            </button>
          </div>
        </div>
      )}

      {/* AI 智能策展工作台 (Authoring Co-pilot) */}
      <AiPostCurationToolbar
        postId={postId}
        title={title}
        content={content}
        excerpt={excerpt}
        seoDescription={seoDescription}
        existingRadarJson={aiRadarJson}
        allTags={tags}
        selectedTagIds={selectedTagIds}
        onUpdateFields={({
          excerpt: newExcerpt,
          seoDescription: newSeo,
          aiRadarJson: newRadar,
          selectedTagIds: newTagIds,
          maturity: newMaturity,
        }) => {
          if (newExcerpt !== undefined) setExcerpt(newExcerpt);
          if (newSeo !== undefined) setSeoDescription(newSeo);
          if (newRadar !== undefined) setAiRadarJson(newRadar);
          if (newTagIds !== undefined) setSelectedTagIds(newTagIds);
          if (newMaturity !== undefined) setMaturity(newMaturity);
        }}
        onInsertContent={(snippet) => setContent((prev) => prev + snippet)}
        onOpenTranslateStudio={() => setTranslateStudioOpen(true)}
      />

      {/* 主创作区域 + 灵动属性抽屉 */}
      <div className="relative flex flex-col xl:flex-row items-start gap-6">
        {/* Main Editor Section (当属性栏折叠时独占 100% 宽幅视野) */}
        <div className={`w-full min-w-0 transition-all duration-300 space-y-4 ${
          inspectorOpen ? 'xl:flex-1' : 'w-full'
        }`}>
          {/* Notion 风格文章封面卡片 (Notion-style Post Cover Deck) */}
          {cover ? (
            <div className="group relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden border border-border bg-secondary/60 shadow-sm transition-all">
              <img
                src={normalizeMediaUrl(cover)}
                alt="Post Cover"
                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/cover-placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

              {/* 悬浮操作胶囊 */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <CoverPickerButton
                  onSelect={(url) => setCover(url)}
                  className="bg-black/60 hover:bg-black/80 text-white border-white/20 backdrop-blur-md shadow-md"
                />
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md text-[11px] font-semibold transition-colors shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? '上传中...' : '本地上传'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setCover('')}
                  className="p-1.5 rounded-xl bg-black/60 hover:bg-rose-600/80 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-colors cursor-pointer shadow-md"
                  title="移除文章封面"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-card border border-dashed border-border/80 hover:border-emerald-500/50 transition-colors shadow-xs">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>尚未设置封面大图（将在博客卡片与文章巨幕首屏展示）</span>
              </div>
              <div className="flex items-center gap-2">
                <CoverPickerButton onSelect={(url) => setCover(url)} />
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-[11px] font-medium transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? '上传中...' : '本地上传'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Hero 无框沉浸标题区 */}
          <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-sm space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入引人入胜的文章标题..."
              className="w-full text-2xl sm:text-3xl font-extrabold bg-transparent border-0 border-b border-transparent focus:border-emerald-500/50 text-foreground placeholder:text-muted-foreground/40 focus:outline-none transition-colors tracking-tight leading-tight py-1"
            />

            {/* 标题下方极速元信息与摘要展开开关 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/80 border border-border font-mono text-[11px] text-foreground">
                  <Globe className="w-3 h-3 text-emerald-500" />
                  {lang === 'zh' ? '中文 (ZH)' : 'English (EN)'}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/80 border border-border text-[11px] text-foreground">
                  <Folder className="w-3 h-3 text-indigo-500" />
                  {selectedCategoryName}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/80 border border-border font-mono text-[11px] text-muted-foreground">
                  /{slug || 'url-slug'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExcerptOpen((prev) => !prev)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <FileText className="w-3 h-3" />
                  <span>{excerptOpen ? '收起文章摘要' : excerpt ? '编辑摘要 (已填写)' : '+ 添加摘要简述'}</span>
                </button>
              </div>
            </div>

            {/* 可折叠摘要编辑框 */}
            {excerptOpen && (
              <div className="pt-2 animate-in fade-in duration-200">
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="简述文章核心观点（将展示在前台博客卡片预览与社交媒体分享卡片）..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-secondary/60 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                />
              </div>
            )}
          </div>

          {/* 全功能沉浸式 Markdown 核心编辑器 或 双语镜像对照编辑器 */}
          {bilingualMode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-600 dark:text-indigo-400">
                <span className="font-semibold flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  双语同步对照创作工坊：左侧为中文母本，右侧为英文译本（实时镜像比例平滑滚动）
                </span>
                <button
                  type="button"
                  onClick={() => setBilingualMode(false)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 font-medium transition-colors cursor-pointer"
                >
                  退出双语分屏
                </button>
              </div>
              <BilingualSplitEditor
                zhContent={lang === 'zh' ? content : enContent}
                enContent={lang === 'zh' ? enContent : content}
                onChangeZh={(val) => {
                  if (lang === 'zh') {
                    setContent(val);
                    setReadingTime(Math.max(1, Math.ceil(val.length / 400)));
                  } else {
                    setEnContent(val);
                  }
                }}
                onChangeEn={(val) => {
                  if (lang === 'zh') {
                    setEnContent(val);
                  } else {
                    setContent(val);
                    setReadingTime(Math.max(1, Math.ceil(val.length / 400)));
                  }
                }}
                zhTitle={lang === 'zh' ? title : enTitle}
                enTitle={lang === 'zh' ? enTitle : title}
                onChangeZhTitle={(val) => (lang === 'zh' ? setTitle(val) : setEnTitle(val))}
                onChangeEnTitle={(val) => (lang === 'zh' ? setEnTitle(val) : setTitle(val))}
              />
            </div>
          ) : (
            <MarkdownEditor
              value={content}
              onChange={(val) => {
                setContent(val);
                setReadingTime(Math.max(1, Math.ceil(val.length / 400)));
              }}
              draftKey={`draft_post_${postId}`}
              lastSavedTime={draftSavedTime}
            />
          )}
        </div>

        {/* 灵动发布属性抽屉 (Properties Inspector) */}
        {inspectorOpen && (
          <aside className="w-full xl:w-[380px] shrink-0 p-5 rounded-2xl bg-card border border-border text-xs space-y-5 shadow-lg animate-in slide-in-from-right-4 duration-300 sticky top-20">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-foreground">发布属性配置</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectorOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="收起抽屉"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 文章封面大图 (Cover Image) */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-secondary/40 border border-border/80">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>文章封面图片</span>
                </label>
                {cover && (
                  <button
                    type="button"
                    onClick={() => setCover('')}
                    className="text-[11px] text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    移除封面
                  </button>
                )}
              </div>

              {cover ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-border/80 bg-neutral-900 group">
                  <img
                    src={normalizeMediaUrl(cover)}
                    alt="Cover Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/cover-placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <CoverPickerButton onSelect={(url) => setCover(url)} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-border bg-background/50 text-center gap-1.5">
                  <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                  <span className="text-[11px] text-muted-foreground">尚未设置封面大图</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <CoverPickerButton
                  onSelect={(url) => setCover(url)}
                  className="flex-1 justify-center py-2"
                />
                <label className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-[11px] font-medium transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? '上传中...' : '本地上传'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* 数字花园成熟度 (Digital Garden Maturity) */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                <span>数字花园演化阶段</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'SEEDLING', label: '初芽 SEED', icon: '🌱' },
                  { value: 'BUDDING', label: '茁壮 BUD', icon: '🌿' },
                  { value: 'EVERGREEN', label: '常青 TREE', icon: '🌲' },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMaturity(m.value as any)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      maturity === m.value
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span className="text-[10px] scale-90">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 文章语言 (Language) */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-emerald-500" />
                <span>正文语言版本</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (translationPost && translationPost.lang === 'zh') {
                      toast.warning('文章语言不能与已关联的译文语言相同');
                      return;
                    }
                    setLang('zh');
                    loadCandidates('en');
                  }}
                  className={`py-2 px-3 rounded-xl font-medium text-xs border transition-colors flex items-center justify-center gap-1.5 ${
                    lang === 'zh'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>中文 (ZH)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (translationPost && translationPost.lang === 'en') {
                      toast.warning('文章语言不能与已关联的译文语言相同');
                      return;
                    }
                    setLang('en');
                    loadCandidates('zh');
                  }}
                  className={`py-2 px-3 rounded-xl font-medium text-xs border transition-colors flex items-center justify-center gap-1.5 ${
                    lang === 'en'
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>English (EN)</span>
                </button>
              </div>
            </div>

            {/* 关联双语译文 (Translation Linking) */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-indigo-500" />
                  <span>关联双语对偶博文</span>
                </label>
                {translationPostId && (
                  <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    已关联 #{translationPostId}
                  </span>
                )}
              </div>

              {translationPost ? (
                <div className="p-3 rounded-xl bg-secondary/60 border border-border space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-foreground text-xs truncate">
                        {translationPost.title}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground truncate">
                        /{translationPost.slug}
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                      translationPost.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {translationPost.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <Link
                      href={`/admin/posts/edit/${translationPost.id}`}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>跳转编辑对偶版</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleUnlinkTranslation}
                      className="text-[11px] text-rose-500 hover:underline flex items-center gap-0.5"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>解除关联</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      尚未绑定对偶译文版本：
                    </p>
                    <button
                      type="button"
                      onClick={handleDeriveTranslation}
                      disabled={deriving}
                      className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {deriving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>一键派生译文</span>
                    </button>
                  </div>

                  <select
                    value={translationPostId || ''}
                    onChange={(e) => {
                      const targetId = Number(e.target.value);
                      if (targetId) {
                        const found = candidatePosts.find((p) => p.id === targetId);
                        if (found) {
                          setTranslationPostId(found.id);
                          setTranslationPost({
                            id: found.id,
                            title: found.title,
                            slug: found.slug,
                            lang: found.lang || (lang === 'zh' ? 'en' : 'zh'),
                            status: found.status,
                          });
                          toast.success(`已关联「${found.title}」`);
                        }
                      } else {
                        setTranslationPostId(null);
                        setTranslationPost(null);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none"
                  >
                    <option value="">-- 手动选择候选博文关联 --</option>
                    {candidatePosts.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} {p.title} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">自定义永久链接 (URL Slug)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
                className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* 分类 */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-500" />
                <span>所属知识分类</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 标签 */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>文章标签 (已选 {selectedTagIds.length})</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-secondary/50 border border-border">
                {tags.map((t) => {
                  const selected = selectedTagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition-colors cursor-pointer ${
                        selected
                          ? 'bg-emerald-500 text-white font-medium'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 封面图片 */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                <span>封面配图 (Cover)</span>
              </label>
              <input
                type="text"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://... 或点击下方选择"
                className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono text-xs focus:outline-none"
              />
              <div className="pt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-colors text-xs">
                    <Upload className="w-3 h-3" />
                    <span>{uploading ? '上传中...' : '上传本地文件'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <CoverPickerButton onSelect={(url) => setCover(url)} />
                </div>
                {cover && (
                  <span className="text-[10px] text-emerald-500 font-mono">已配置封面</span>
                )}
              </div>
              {cover && (
                <div className="mt-2 aspect-video rounded-xl overflow-hidden border border-border bg-secondary shadow-sm">
                  <img src={cover} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* 置顶推荐 */}
            <div className="pt-2 border-t border-border space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={featured === 1}
                  onChange={(e) => setFeatured(e.target.checked ? 1 : 0)}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-foreground">置顶推荐至首页前排</span>
              </label>
            </div>

            {/* SEO 配置 */}
            <div className="pt-2 border-t border-border space-y-2">
              <h4 className="font-semibold text-foreground">SEO 与社交元数据</h4>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">SEO 标题 (Title Tag)</span>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="留空则默认使用文章标题"
                  className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">SEO 描述 (Meta Description)</span>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="留空则默认使用文章摘要"
                  rows={2}
                  className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none"
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 双语技术精译工作台模态框 */}
      <BilingualTranslationStudioModal
        open={translateStudioOpen}
        onClose={() => setTranslateStudioOpen(false)}
        sourcePost={{
          id: postId,
          title,
          excerpt,
          content,
          lang,
          slug,
          categoryId,
          tagIds: selectedTagIds,
        }}
        onSuccess={(newPostId) => {
          if (newPostId) {
            router.push(`/admin/posts/edit/${newPostId}`);
          }
        }}
      />

      {/* 博文历史版本时光机 */}
      <PostRevisionHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        postId={postId}
        currentTitle={title}
        currentContent={content}
        onRestore={(restoredTitle, restoredContent) => {
          setTitle(restoredTitle);
          setContent(restoredContent);
          toast.success('已成功恢复指定历史版本快照！');
        }}
      />
    </div>
  );
}
