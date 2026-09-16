'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Post, Journey } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Search,
  ArrowRight,
  BookOpen,
  Compass,
  Tag,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  X,
  Zap,
  Calendar,
  MapPin,
  Clock,
  Layers,
  Lightbulb,
  FileText,
  ChevronRight,
  Filter
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface SpotlightExploreViewProps {
  posts: Post[];
  journeys: Journey[];
}

// 灵感探究推荐提问
const PRESET_QUERIES = [
  {
    label: '全栈架构哲学',
    query: 'Hayden 在全栈架构与系统工程上有哪些核心哲学？',
    hint: '探讨系统确定性、虚拟线程与微服务演进',
    icon: Layers,
  },
  {
    label: '川西旷野足迹',
    query: '站长在川西高原与雪山旷野有哪些旅行漫游记录？',
    hint: '探寻折多山、新都桥与大地摄影足迹',
    icon: Compass,
  },
  {
    label: '现代化 Web 美学',
    query: '博客的前端技术选型与交互美学原则是什么？',
    hint: 'Next.js 14、Tailwind 与 Apple / Linear 级动效',
    icon: Zap,
  },
  {
    label: '数字花园理念',
    query: '数字花园和生活沉淀对于 Hayden 意味着什么？',
    hint: '关于心流、个人知识管理与长期造物',
    icon: Lightbulb,
  },
];

export function SpotlightExploreView({ posts, journeys }: SpotlightExploreViewProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { t, locale } = useI18n();
  const isDark = resolvedTheme === 'dark';

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'posts' | 'journeys'>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  // AI 研读罗盘状态
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<{ name: string; message: string; status: string } | null>(null);
  const [aiCitations, setAiCitations] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  // 快捷键聚焦搜索：按 '/' 或 'Cmd+K' 快速对焦
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        if (e.key === 'Escape') {
          inputRef.current?.blur();
        }
        return;
      }
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 毫秒级即时语义与关键词透视索引匹配
  const { filteredPosts, filteredJourneys } = useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) {
      return {
        filteredPosts: posts.slice(0, 6),
        filteredJourneys: journeys.slice(0, 4),
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

      // 提取全站文章与足迹上下文线索以辅助研读
      const contextSummaries = posts
        .slice(0, 10)
        .map((p) => `【文章】《${p.title}》(分类:${p.category?.name || '无'}): ${p.excerpt || ''}`)
        .join('\n');
      const journeySummaries = journeys
        .slice(0, 6)
        .map((j) => `【足迹】${j.city} (${j.country}): ${j.description || j.title}`)
        .join('\n');

      const systemContext = `你是站长 Hayden Xue 的全站语义研读罗盘与智能数字分身。
请以知性、通透、深邃且克制的工程师语调，基于 Hayden 的全站文章与真实足迹回答问题。
全站已知部分语料参考：
${contextSummaries}
${journeySummaries}

回答要求：
1. 观点明确，逻辑结构清晰，可使用精炼小标题或有序列表；
2. 如果涉及具体文章或城市足迹，在正文中自然引用并引导读者探索；
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
            setAiError('AI 罗盘研读服务暂时离线或未配置密钥。以下为您展现匹配的原著切片：');
          }
        );
      } catch (err: any) {
        setAiStreaming(false);
        setAiError('研读解析请求遇到阻碍，请检查网络连接或稍后重试。');
      }
    },
    [posts, journeys]
  );

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

  const totalResults = filteredPosts.length + filteredJourneys.length;

  return (
    <div className="w-full min-h-screen bg-[#fbfbfd] dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* 顶部 Hero 区域 */}
      <section className="relative pt-24 sm:pt-32 pb-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* 微光徽章 */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 mb-6 shadow-xs backdrop-blur-sm animate-in fade-in duration-500">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>SPOTLIGHT SEMANTIC COMPASS · 语义透视</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight font-sans">
          全站智能语义研读罗盘
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-sans">
          基于 Hayden Xue 的真实博文、足迹航线与灵感记忆。键入任何技术疑思或生活哲学，AI 毫秒级生成提炼研读摘要，并精准导向原著。
        </p>

        {/* 沉浸式微光透视搜索台 (Raycast / Apple Spotlight 风格) */}
        <div className="mt-8 sm:mt-10 max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center p-2 rounded-2xl sm:rounded-3xl bg-white/85 dark:bg-neutral-900/80 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] focus-within:border-emerald-500/60 dark:focus-within:border-emerald-500/50 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300"
          >
            <div className="pl-3.5 pr-2 text-slate-400 dark:text-zinc-500">
              <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="探讨全栈微服务、虚拟线程，或搜索 Hayden 的川西游记与摄影手记..."
              className="flex-1 bg-transparent py-2.5 px-2 text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none font-sans"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors mr-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={aiStreaming || !query.trim()}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-neutral-900 font-semibold text-xs sm:text-sm shadow-md disabled:opacity-40 transition-all cursor-pointer"
            >
              {aiStreaming ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">研读中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                  <span>探究</span>
                </>
              )}
            </button>
          </form>

          {/* 底部键盘快捷提示 */}
          <div className="mt-2.5 flex items-center justify-between px-3 text-[11px] font-mono text-slate-600 dark:text-zinc-400">
            <span>按 <kbd className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-zinc-300 font-bold">/</kbd> 或 <kbd className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-zinc-300 font-bold">Cmd+K</kbd> 快速激活搜索</span>
            <span>已透视全站 {posts.length} 篇博文 · {journeys.length} 个足迹点</span>
          </div>
        </div>

        {/* 预设灵感探究推荐卡片 */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 max-w-4xl mx-auto text-left">
          {PRESET_QUERIES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handlePresetClick(item.query)}
                className="group p-3 sm:p-3.5 rounded-2xl bg-white/70 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-800/80 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 leading-normal">
                  {item.hint}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 主体交互视口 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">
        {/* AI 研读罗盘输出区 (若存在输出或正在流式生成) */}
        {(aiStreaming || aiAnswer || aiError) && (
          <section className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-neutral-900/70 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.12] shadow-xl animate-in fade-in-50 duration-300">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 flex items-center justify-center shadow-xs shrink-0">
                  <BrandLogo size={18} variant="white" animated glow={false} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>AI 罗盘深度研读报告</span>
                    {aiStreaming && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-normal text-slate-900 dark:text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white animate-ping" />
                        思考撰写中...
                      </span>
                    )}
                  </h2>
                  {activeQuestion && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                      探究议题: “{activeQuestion}”
                    </p>
                  )}
                </div>
              </div>

              {/* 动作区：复制 / 重新解析 */}
              <div className="flex items-center gap-1.5">
                {aiAnswer && (
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="复制研读摘要"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={() => activeQuestion && triggerAiExplore(activeQuestion)}
                  disabled={aiStreaming}
                  className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-40 cursor-pointer"
                  title="重新解析"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 工具调用动态微光胶囊 */}
            {toolStatus && (
              <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-zinc-300 shadow-2xs">
                {toolStatus.status === 'running' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900 dark:text-white shrink-0" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
                <span className="font-medium">{toolStatus.message || '正在全站知识拓扑中检索...'}</span>
              </div>
            )}

            {/* AI 生成内容 */}
            {aiError && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 mb-4">
                {aiError}
              </div>
            )}

            <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed font-sans prose-p:my-2 prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-slate-900 dark:prose-a:text-white hover:prose-a:underline">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiAnswer || (aiStreaming ? '正在调阅全站记忆与知识拓扑，请稍候...' : '')}
              </ReactMarkdown>
            </div>

            {/* 关联知识底座与引用原著卡片群 */}
            {aiCitations && aiCitations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                    关联知识底座与原著引用 ({aiCitations.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">GARDEN CITATIONS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiCitations.map((citation) => {
                    const cleanUrl = (citation.url || `/blog/${citation.slug || ''}`).replace(
                      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g,
                      ''
                    );
                    return (
                      <button
                        key={citation.id || citation.url}
                        type="button"
                        onClick={() => router.push(cleanUrl)}
                        className="group p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 text-left transition-all cursor-pointer flex flex-col justify-between"
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
                        <div className="mt-2.5 flex items-center justify-end text-[11px] font-medium text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          <span>查看原著</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 结果分栏过滤与标题 */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {query.trim() ? `透视匹配结果 (${totalResults})` : '全站核心精选脉络'}
            </h2>
            {query.trim() && (
              <span className="text-xs font-mono text-slate-600 dark:text-zinc-400">
                关键字: “{query.trim()}”
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeCategory === 'ALL'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              全部 ({totalResults})
            </button>
            <button
              onClick={() => setActiveCategory('posts')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeCategory === 'posts'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              博文 ({filteredPosts.length})
            </button>
            <button
              onClick={() => setActiveCategory('journeys')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeCategory === 'journeys'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              足迹 ({filteredJourneys.length})
            </button>
          </div>
        </div>

        {/* 结果网格 */}
        <div className="space-y-6">
          {/* 博文矩阵 */}
          {(activeCategory === 'ALL' || activeCategory === 'posts') && filteredPosts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>技术文章与造物沉淀</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug || post.id}`}
                    className="group p-5 rounded-3xl bg-white/70 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-800/80 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        {post.category?.name ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            {post.category.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">ESSAY</span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed font-sans">
                        {post.excerpt || '深度全栈工程、系统设计与技术哲学思考。'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {Array.isArray(post.tags) &&
                          post.tags.slice(0, 3).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-zinc-400"
                            >
                              #{tag.name}
                            </span>
                          ))}
                      </div>
                      <span className="group-hover:translate-x-1 transition-transform text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                        阅读原著
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 足迹矩阵 */}
          {(activeCategory === 'ALL' || activeCategory === 'journeys') && filteredJourneys.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-emerald-500" />
                <span>地理足迹与旷野航图</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredJourneys.map((journey) => (
                  <Link
                    key={journey.id}
                    href={`/journey/${journey.slug || journey.id}`}
                    className="group p-4 rounded-3xl bg-white/70 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-800/80 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          {journey.city}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {journey.country}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-200 line-clamp-1">
                        {journey.title || `${journey.city} 漫游手记`}
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {journey.description || '真实地理足迹与胶片摄影瞬间。'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>查看航图与摄影</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 空结果提示 */}
          {totalResults === 0 && (
            <div className="p-12 text-center rounded-3xl bg-white/50 dark:bg-neutral-900/30 border border-dashed border-slate-300 dark:border-white/10 space-y-3">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                未找到与 “{query}” 相关的直接文章或足迹。
              </p>
              <button
                onClick={() => setQuery('')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                清空关键字并浏览全部脉络
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
