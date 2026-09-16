'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Post, Journey } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Search,
  Sparkles,
  X,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Compass,
  ArrowRight,
  FileText,
  MapPin,
  Tag,
  Layers,
  Zap,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface LiquidSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 灵感探究高频预设
const PRESET_TOPICS = [
  {
    label: '全栈架构哲学',
    query: 'Hayden 在全栈架构与系统工程上有哪些核心哲学？',
    hint: '系统确定性、虚拟线程与微服务演进',
    icon: Layers,
  },
  {
    label: '川西旷野足迹',
    query: '站长在川西高原与雪山旷野有哪些旅行漫游记录？',
    hint: '折多山、新都桥与大地摄影足迹',
    icon: Compass,
  },
  {
    label: '现代化 Web 美学',
    query: '博客的前端技术选型与交互美学原则是什么？',
    hint: 'Next.js 14、Tailwind 与 Apple 级液态质感',
    icon: Zap,
  },
  {
    label: '数字花园理念',
    query: '数字花园和生活沉淀对于 Hayden 意味着什么？',
    hint: '心流沉淀、知识管理与长期主义造物',
    icon: Lightbulb,
  },
];

export function LiquidSpotlightModal({ isOpen, onClose }: LiquidSpotlightModalProps) {
  const router = useRouter();
  const { t, locale } = useI18n();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'posts' | 'journeys'>('ALL');
  const [posts, setPosts] = useState<Post[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // AI 研读罗盘状态
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<{
    name: string;
    message: string;
    status: 'running' | 'completed' | 'error';
  } | null>(null);
  const [aiCitations, setAiCitations] = useState<{
    id: number | string;
    title: string;
    slug?: string;
    maturity?: string;
    excerpt?: string;
    url?: string;
  }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 打开时聚焦输入框并拉取内容池
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);

      // 加载全站博文与足迹数据
      if (posts.length === 0 && journeys.length === 0) {
        setLoadingInitial(true);
        Promise.all([
          api.getPosts({ page: 1, pageSize: 60 }).catch(() => ({ records: [] as Post[] })),
          api.getJourneys().catch(() => [] as Journey[]),
        ])
          .then(([pRes, jRes]) => {
            setPosts(pRes.records || []);
            setJourneys(jRes || []);
          })
          .finally(() => setLoadingInitial(false));
      }
    }
  }, [isOpen, posts.length, journeys.length]);

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 毫秒级即时语义与关键词透视索引匹配
  const { filteredPosts, filteredJourneys } = useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) {
      return {
        filteredPosts: posts.slice(0, 4),
        filteredJourneys: journeys.slice(0, 3),
      };
    }

    const keywords = cleanQ.split(/\s+/).filter(Boolean);

    const matchScore = (text: string = '') => {
      const lower = text.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) score += 1;
      }
      return score;
    };

    const matchedP = posts
      .map((p) => {
        const titleScore = matchScore(p.title) * 3;
        const excerptScore = matchScore(p.excerpt) * 2;
        const catScore = matchScore(p.category?.name) * 2;
        const tagScore = Array.isArray(p.tags)
          ? p.tags.reduce((acc, t) => acc + matchScore(t.name) * 2, 0)
          : 0;
        const total = titleScore + excerptScore + catScore + tagScore;
        return { post: p, score: total };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.post);

    const matchedJ = journeys
      .map((j) => {
        const titleScore = matchScore(j.title) * 3;
        const cityScore = matchScore(j.city) * 3;
        const descScore = matchScore(j.description) * 2;
        const total = titleScore + cityScore + descScore;
        return { journey: j, score: total };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.journey);

    return {
      filteredPosts: matchedP,
      filteredJourneys: matchedJ,
    };
  }, [posts, journeys, query]);

  // 发起 AI 语义透视研读
  const triggerAiExplore = useCallback(
    async (promptText: string) => {
      const prompt = promptText.trim();
      if (!prompt) return;

      setActiveQuestion(prompt);
      setAiAnswer('');
      setAiError(null);
      setToolStatus(null);
      setAiCitations([]);
      setAiStreaming(true);

      const contextSummaries = posts
        .slice(0, 10)
        .map((p) => `【文章】《${p.title}》(分类:${p.category?.name || '无'}): ${p.excerpt || ''}`)
        .join('\n');
      const journeySummaries = journeys
        .slice(0, 6)
        .map((j) => `【足迹】${j.city} (${j.country}): ${j.description || j.title}`)
        .join('\n');

      const systemContext = `你是站长 Hayden Xue 的全站语义研读罗盘与智能分身。
请以知性、通透且克制的工程师语调，基于 Hayden 的全站博文与真实足迹回答问题。
全站已知部分语料参考：
${contextSummaries}
${journeySummaries}

回答要求：
1. 逻辑精炼，观点明确，可使用小标题或列表；
2. 若涉及具体文章或足迹，在正文中自然引导；
3. 严格保持站长姓名 Hayden Xue；
4. 语言使用纯正中文。`;

      let buffer = '';
      try {
        await api.streamAiChat(
          {
            prompt: `${systemContext}\n\n读者提问: ${prompt}`,
          },
          (chunk) => {
            buffer += chunk;

            // 提取并隔离所有结构化 JSON 事件 (tool_status / citations / action)
            const jsonEventRegex = /\{"type"\s*:\s*"(tool_status|citations|action)"[\s\S]*?\}/g;
            let match;
            while ((match = jsonEventRegex.exec(buffer)) !== null) {
              const rawJson = match[0];
              try {
                const parsed = JSON.parse(rawJson);
                if (parsed && typeof parsed.type === 'string') {
                  if (parsed.type === 'tool_status') {
                    setToolStatus({
                      name: parsed.name,
                      message: parsed.message,
                      status: parsed.status || 'running',
                    });
                  } else if (parsed.type === 'citations' && Array.isArray(parsed.data)) {
                    setAiCitations(parsed.data);
                  }
                }
              } catch {}
            }

            // 净化正文：剔除 JSON 块、可能未闭合的尾部 JSON 碎片，以及本地开发端口地址
            const cleanText = buffer
              .replace(/\{"type"\s*:\s*"(tool_status|citations|action)"[\s\S]*?\}/g, '')
              .replace(/\{"type"[\s\S]*$/g, '')
              .replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '');

            setAiAnswer(cleanText.trimStart());
          },
          () => {
            setAiStreaming(false);
          },
          (err) => {
            console.error('AI Stream Error:', err);
            setAiStreaming(false);
            setAiError('AI 罗盘研读服务暂时离线，为您呈现匹配的博文与足迹原著：');
          }
        );
      } catch (err: any) {
        setAiStreaming(false);
        setAiError('研读解析遇到阻碍，请检查网络或稍后重试。');
      }
    },
    [posts, journeys]
  );

  // 监听博文正文划词追问事件，自动填充并触发罗盘深度研读
  useEffect(() => {
    const handleSpark = (e: any) => {
      const selectedText = e.detail?.selectedText;
      if (selectedText) {
        setQuery(`精讲：“${selectedText.slice(0, 80)}”`);
        triggerAiExplore(`请结合站长数字花园知识库，深度解析以下手记段落的技术原理与思想脉络：“${selectedText}”`);
      }
    };
    window.addEventListener('open-hayden-ai', handleSpark);
    return () => window.removeEventListener('open-hayden-ai', handleSpark);
  }, [triggerAiExplore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    triggerAiExplore(query);
  };

  const handlePresetClick = (q: string) => {
    setQuery(q);
    triggerAiExplore(q);
  };

  const handleCopy = () => {
    if (!aiAnswer) return;
    navigator.clipboard.writeText(aiAnswer);
    setCopied(true);
    toast.success('已复制 AI 研读摘要');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  if (!isOpen) return null;

  const totalCount = filteredPosts.length + filteredJourneys.length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 p-3 sm:p-4 bg-black/50 dark:bg-black/75 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      {/* 液态玻璃主视窗 (VisionOS Frosted Glass Card) */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-3xl bg-white/85 dark:bg-[#0c0d14]/85 backdrop-blur-3xl border border-white/70 dark:border-white/[0.14] shadow-[0_24px_70px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.75)] flex flex-col max-h-[84vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* 顶部菲涅尔镜面反射弧线 (VisionOS Specular Highlight) */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/40 to-transparent pointer-events-none rounded-t-full" />
        {/* 微透镜凸面漫反射环境光晕 */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.08] via-transparent to-black/[0.03] dark:from-white/[0.04] dark:to-transparent pointer-events-none" />

        {/* 顶部搜索输入条 */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center px-4 sm:px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] shrink-0"
        >
          <div className="flex items-center gap-2.5 mr-3 text-slate-400 dark:text-zinc-500">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Search className="w-4 h-4" />
            </div>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索博文、足迹，或键入任何思想议题由 AI 提炼研读..."
            className="flex-1 bg-transparent py-1 text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none font-sans"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors mr-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="submit"
              disabled={aiStreaming || !query.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-neutral-900 font-semibold text-xs shadow-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              {aiStreaming ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>研读中</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                  <span>探究</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="按 Esc 关闭"
            >
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-zinc-400">
                ESC
              </kbd>
              <X className="w-4 h-4 sm:hidden" />
            </button>
          </div>
        </form>

        {/* 视窗内容滚动区 */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6 custom-scrollbar">
          {/* AI 流式研读卡片 (若激活) */}
          {(aiStreaming || aiAnswer || aiError) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] shadow-xs animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 flex items-center justify-center shadow-xs shrink-0">
                    <BrandLogo size={16} variant="white" animated glow={false} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      AI 罗盘研读提炼
                      {aiStreaming && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white animate-ping" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {aiAnswer && (
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title="复制摘要"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button
                    onClick={() => activeQuestion && triggerAiExplore(activeQuestion)}
                    disabled={aiStreaming}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-40 cursor-pointer"
                    title="重新研读"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 工具调用动态微光胶囊 */}
              {toolStatus && (
                <div className="mb-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-zinc-300 shadow-2xs">
                  {toolStatus.status === 'running' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900 dark:text-white shrink-0" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                  <span className="font-medium truncate max-w-[320px] sm:max-w-md">
                    {toolStatus.message || '正在全站知识库与足迹拓扑检索...'}
                  </span>
                </div>
              )}

              {aiError && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 mb-3">
                  {aiError}
                </div>
              )}

              <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed font-sans prose-p:my-1.5 prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-slate-900 dark:prose-a:text-white hover:prose-a:underline">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiAnswer || (aiStreaming ? '正在聚合全站知识拓扑与游记手记，撰写研读摘要...' : '')}
                </ReactMarkdown>
              </div>

              {/* 关联知识底座与引用原著卡片群 */}
              {aiCitations && aiCitations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                      <Compass className="w-3 h-3 text-slate-900 dark:text-white" />
                      关联知识底座与原著引用 ({aiCitations.length})
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">GARDEN CITATIONS</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiCitations.map((citation) => {
                      const cleanUrl = (citation.url || `/blog/${citation.slug || ''}`).replace(
                        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g,
                        ''
                      );
                      return (
                        <button
                          key={citation.id || citation.url}
                          type="button"
                          onClick={() => handleNavigate(cleanUrl)}
                          className="group p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.04] hover:bg-slate-100/80 dark:hover:bg-white/[0.08] border border-slate-200/70 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 text-left transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:underline transition-colors line-clamp-1">
                                {citation.title}
                              </span>
                              {citation.maturity && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400 shrink-0">
                                  {citation.maturity}
                                </span>
                              )}
                            </div>
                            {citation.excerpt && (
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                {citation.excerpt}
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-end text-[10px] font-medium text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            <span>研读原著</span>
                            <ArrowRight className="w-3 h-3 ml-0.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 未输入状态：探究推荐灵感药丸 */}
          {!query.trim() && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  灵感探究推荐 (点击一键研读)
                </span>
                <span className="text-[10px] font-mono text-slate-400">HAYDEN MINDSTREAM</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_TOPICS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePresetClick(item.query)}
                      className="group p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 border border-slate-200/70 dark:border-white/[0.06] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 text-left transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                        {item.hint}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 结果分栏过滤 Tab */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {query.trim() ? `实时透视结果 (${totalCount})` : '全站精选脉络'}
              </span>
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-[11px]">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  activeTab === 'posts'
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                博文 ({filteredPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('journeys')}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  activeTab === 'journeys'
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                足迹 ({filteredJourneys.length})
              </button>
            </div>
          </div>

          {/* 内容展示列表 */}
          <div className="space-y-4">
            {/* 博文卡片 */}
            {(activeTab === 'ALL' || activeTab === 'posts') && filteredPosts.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  技术博文与文章
                </span>
                <div className="space-y-2">
                  {filteredPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => handleNavigate(`/blog/${post.slug || post.id}`)}
                      className="w-full text-left group p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.02] hover:bg-slate-100/90 dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.06] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {post.category?.name && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              {post.category.name}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {post.title}
                        </h4>
                        {post.excerpt && (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 leading-normal">
                            {post.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                        <span>阅读原著</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 足迹卡片 */}
            {(activeTab === 'ALL' || activeTab === 'journeys') && filteredJourneys.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-emerald-500" />
                  地理足迹与旷野航图
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredJourneys.map((journey) => (
                    <button
                      key={journey.id}
                      onClick={() => handleNavigate(`/journey/${journey.slug || journey.id}`)}
                      className="text-left group p-3 rounded-2xl bg-white/60 dark:bg-white/[0.02] hover:bg-slate-100/90 dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.06] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-xs transition-all flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{journey.city}</span>
                          <span className="text-[10px] font-mono text-slate-400">· {journey.country}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                          {journey.description || journey.title}
                        </p>
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 无结果反馈 */}
            {totalCount === 0 && !loadingInitial && (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-400 space-y-2 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                <Search className="w-6 h-6 mx-auto text-slate-400" />
                <p>未找到与 “{query}” 相关的直接博文或足迹。</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  您可直接点击右上角「探究」按钮，由 AI 针对该主题开展跨领域研读。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 底部 HUD 状态与快捷指引 */}
        <div className="px-5 py-2.5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>HAYDEN XUE · SPOTLIGHT COMPASS</span>
          </div>
          <div className="flex items-center gap-3">
            <span>回车或点击「探究」生成 AI 报告</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">ESC 退出</span>
          </div>
        </div>
      </div>
    </div>
  );
}
