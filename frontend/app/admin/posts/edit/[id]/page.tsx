'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Category, Tag, Post } from '@/lib/types';
import { toast } from '@/lib/toast';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { ArrowLeft, Save, Upload, Loader2, Languages, Unlink, Sparkles, Sprout } from 'lucide-react';

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

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
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
        if (post.tags) {
          setSelectedTagIds(post.tags.map((t) => t.id));
        }
      }
      setFetching(false);
    }).catch((err) => {
      toast.error('加载文章失败: ' + err.message);
      router.push('/admin/posts');
    });
  }, [postId, router]);

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
      });
      toast.success('文章已成功更新！');
      localStorage.removeItem(`draft_post_edit_${postId}`);
      router.push('/admin/posts');
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
    return <div className="py-20 text-center text-xs text-muted-foreground">正在加载文章内容...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts"
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">编辑文章 #{postId}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit('DRAFT')}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border transition-colors disabled:opacity-50"
          >
            转为草稿
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('PUBLISHED')}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-foreground hover:opacity-90 text-background text-xs font-medium transition-opacity shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>保存并发布</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="w-full text-2xl font-bold px-4 py-3 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />

          <MarkdownEditor
            value={content}
            onChange={(val) => {
              setContent(val);
              setReadingTime(Math.max(1, Math.ceil(val.length / 400)));
            }}
            draftKey={`post_edit_${postId}`}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">摘要简述 (Excerpt)</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-5 p-5 rounded-2xl bg-card border border-border text-xs">
          <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">
            文章发布属性
          </h3>

          {/* 文章语言 (Language) */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-emerald-500" />
              <span>文章语言</span>
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
                <span>关联双语译文</span>
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

                <div className="flex items-center justify-between pt-2 border-t border-border/60 gap-2">
                  <Link
                    href={`/admin/posts/edit/${translationPost.id}`}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>跳转编辑译文 &rarr;</span>
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
              <div className="space-y-2.5">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  当前文章尚未绑定双语译文。
                </p>

                <button
                  type="button"
                  onClick={handleDeriveTranslation}
                  disabled={deriving}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs border border-emerald-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {deriving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>一键派生{lang === 'zh' ? '英文版草稿' : '中文版草稿'}</span>
                </button>

                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-muted-foreground">或手动关联已有{lang === 'zh' ? '英文' : '中文'}文章：</span>
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
                          toast.success(`已选中「${found.title}」，保存文章后生效`);
                        }
                      }
                    }}
                    className="w-full p-2 rounded-xl bg-secondary border border-border text-foreground text-xs"
                  >
                    <option value="">-- 选择候选文章 --</option>
                    {candidatePosts.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} {p.title} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">URL Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">关联分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">文章标签</label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => {
                const selected = selectedTagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`px-2 py-0.5 rounded-md font-mono transition-colors ${
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

          {/* 思想成熟度选择 */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground flex items-center gap-1.5 text-xs">
                <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                <span>思想成熟度 (Digital Garden)</span>
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">{maturity}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'SEEDLING', label: '🌱 萌芽', desc: '初生灵感' },
                { value: 'BUDDING', label: '🌿 常青', desc: '持续迭代' },
                { value: 'EVERGREEN', label: '🌲 参天', desc: '成熟体系' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMaturity(item.value as any)}
                  className={`p-2 rounded-xl text-left border transition-all flex flex-col gap-0.5 ${
                    maturity === item.value
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="text-xs">{item.label}</span>
                  <span className="text-[9px] text-muted-foreground">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">封面图片 (Cover)</label>
            <input
              type="text"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
            />
            <div className="pt-1 flex items-center justify-between">
              <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-colors">
                <Upload className="w-3 h-3" />
                <span>{uploading ? '上传中...' : '上传本地图片'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {cover && (
                <span className="text-[10px] text-emerald-500 font-mono">已配置封面</span>
              )}
            </div>
            {cover && (
              <div className="mt-2 aspect-video rounded-xl overflow-hidden border border-border bg-secondary">
                <img src={cover} alt="Cover Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured === 1}
                onChange={(e) => setFeatured(e.target.checked ? 1 : 0)}
                className="rounded border-border"
              />
              <span className="font-medium text-foreground">设为置顶推荐文章</span>
            </label>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <h4 className="font-semibold text-foreground">SEO 配置</h4>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">SEO 标题</span>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">SEO 描述</span>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
                className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
