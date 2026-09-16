'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/lib/i18n-client';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { AiChatMessage, AiChatRequest } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Quote,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  Terminal,
  Compass,
  Palette,
  Brain,
  Lock,
  Zap,
  LogIn,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { AuthModal } from '@/components/AuthModal';
import { readAuthUserRaw } from '@/lib/storage-keys';

/**
 * 知识库引用项
 */
export interface CitationItem {
  id: number;
  title: string;
  slug: string;
  maturity?: string;
  excerpt?: string;
  url?: string;
}

/**
 * 工具执行状态
 */
export interface ToolStatus {
  name: string;
  message: string;
  status: 'running' | 'completed' | 'error';
}

/**
 * 指令动作负载
 */
export interface ActionPayload {
  action: string;
  route?: string;
  theme?: string;
  reason?: string;
}

/**
 * 扩展消息模型，包含工具状态、引用元数据与指令动作
 */
export interface ExtendedAiChatMessage extends AiChatMessage {
  toolStatus?: ToolStatus;
  citations?: CitationItem[];
  action?: ActionPayload;
}

/**
 * Markdown 代码块组件，提供深色容器、编程语言标牌与一键复制代码功能
 */
function CodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const codeContent = String(children).replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');
  const rawLang = match ? match[1] : '';
  const langDisplay = rawLang ? rawLang.toUpperCase() : 'CODE';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div className="relative my-3 rounded-xl border border-white/[0.08] bg-neutral-900/90 shadow-lg overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-950/70 border-b border-white/[0.06] select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-mono text-[10px] text-neutral-400 font-semibold tracking-wider flex items-center gap-1">
            <Terminal className="w-3 h-3 text-emerald-400" />
            {langDisplay}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.06] transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[12px] font-mono leading-relaxed text-emerald-300/90 bg-neutral-950/80 selection:bg-emerald-500/30">
        <code>{codeContent}</code>
      </pre>
    </div>
  );
}

/**
 * Hayden AI 伴读助手抽屉组件 (Cursor / Arc 风格 Sidebar Co-pilot)
 */
export function AiAssistantModal() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { locale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ExtendedAiChatMessage[]>([
    {
      role: 'assistant',
      content:
        locale === 'en'
          ? "Hello! I am **Hayden AI**, the digital twin of Hayden Xue. Ask me anything about system architecture, AI agent research notes, or explore the digital garden together! ✨"
          : '你好！我是 **Hayden AI**，全栈开发者 Hayden Xue 的专属数字分身。你可以向我追问系统架构、AI智能体技术手记，或探索数字花园的成熟度哲学！✨',
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [articleIdContext, setArticleIdContext] = useState<number | null>(null);
  const [aiModel, setAiModel] = useState('deepseek-v4-flash');
  const [aiOnline, setAiOnline] = useState(true);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{
    allowed: boolean;
    dayRemaining: number;
    minuteRemaining: number;
    clientType: string;
    reason?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkUserAndQuota = async () => {
    const raw = readAuthUserRaw();
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }

    try {
      const q = await api.getAiQuota();
      if (q) {
        setQuotaInfo(q);
      }
    } catch {
      // 忽略
    }
  };

  // 异步加载后端 AI 状态与用户配额
  useEffect(() => {
    api
      .getAiStatus()
      .then((res) => {
        if (res?.model) {
          setAiModel(res.model);
        }
        setAiOnline(res?.enabled ?? true);
      })
      .catch(() => {
        setAiModel('deepseek-v4-flash');
        setAiOnline(true);
      });

    checkUserAndQuota();
    window.addEventListener('auth-change', checkUserAndQuota);
    return () => window.removeEventListener('auth-change', checkUserAndQuota);
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkUserAndQuota();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // 全局快捷键 Cmd+J / Ctrl+J 与 Esc 监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => inputRef.current?.focus(), 150);
          }
          return next;
        });
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 监听文章正文划词追问事件
  useEffect(() => {
    const handleSpark = (e: CustomEvent<{ selectedText: string; articleId?: number }>) => {
      setIsOpen(true);
      if (e.detail?.selectedText) {
        setSelectedContext(e.detail.selectedText);
        // 自动在输入框预填针对该段落的深入追问意图
        setInput((prev) => {
          if (!prev.trim()) {
            return locale === 'en'
              ? 'Please explain the technical principles and core concepts of this section in context.'
              : '请结合本文背景解析这段内容的技术原理与核心思想。';
          }
          return prev;
        });
      }
      if (e.detail?.articleId) {
        setArticleIdContext(e.detail.articleId);
      }
      setTimeout(() => inputRef.current?.focus(), 200);
    };
    window.addEventListener('open-hayden-ai' as any, handleSpark);
    return () => window.removeEventListener('open-hayden-ai' as any, handleSpark);
  }, [locale]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend && !selectedContext) return;
    if (isStreaming) return;

    if (!currentUser) {
      toast.info(locale === 'en' ? 'Please sign in to chat with Hayden AI' : '请先登录读者账号后再体验 AI 智能伴读');
      setAuthModalOpen(true);
      return;
    }

    const userMessageContent = selectedContext
      ? `> "${selectedContext}"\n\n${textToSend || (locale === 'en' ? 'Please elaborate and explain this section.' : '请为我精讲这段内容并延伸解析。')}`
      : textToSend;

    const newMessages: ExtendedAiChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessageContent },
    ];

    setMessages(newMessages);
    setInput('');
    const currentSelected = selectedContext;
    setSelectedContext(null);
    setIsStreaming(true);

    // 预留 assistant 消息用于流式拼接与状态载入
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const chatReq: AiChatRequest = {
      messages: newMessages.map(({ role, content }) => ({ role, content })),
      prompt: textToSend,
      selectedText: currentSelected || undefined,
      articleId: articleIdContext || undefined,
    };

    let streamBuffer = '';
    try {
      await api.streamAiChat(
        chatReq,
        (chunk: string) => {
          streamBuffer += chunk;

          // 提取并隔离所有结构化 JSON 事件 (tool_status / citations / action / thinking)
          const jsonEventRegex = /\{"type"\s*:\s*"(tool_status|citations|action|thinking)"[\s\S]*?\}/g;
          let match;
          while ((match = jsonEventRegex.exec(streamBuffer)) !== null) {
            const rawJson = match[0];
            try {
              const parsed = JSON.parse(rawJson);
              if (parsed && typeof parsed.type === 'string') {
                if (parsed.type === 'thinking') {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        reasoning: (updated[lastIndex].reasoning || '') + (parsed.delta || ''),
                      };
                    }
                    return updated;
                  });
                } else if (parsed.type === 'tool_status') {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        toolStatus: {
                          name: parsed.name,
                          message: parsed.message,
                          status: parsed.status || 'running',
                        },
                      };
                    }
                    return updated;
                  });
                } else if (parsed.type === 'citations') {
                  // 2. 知识库引用卡片事件
                  const cites: CitationItem[] = Array.isArray(parsed.data) ? parsed.data : [];
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        citations: cites,
                      };
                    }
                    return updated;
                  });
                } else if (parsed.type === 'action') {
                  // 3. 指令动作事件 (路由跳转 / 主题切换)
                  const actionPayload: ActionPayload = parsed;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        action: actionPayload,
                      };
                    }
                    return updated;
                  });

                  // 自动联动触发
                  if (actionPayload.action === 'switch_theme' && actionPayload.theme) {
                    const mode = actionPayload.theme;
                    setTheme(mode);
                    toast.success(
                      mode === 'dark'
                        ? (locale === 'en' ? 'Switched to Obsidian Dark mode' : '已为你切换至深曜石暗黑模式')
                        : (locale === 'en' ? 'Switched to Porcelain Light mode' : '已为你切换至高定白瓷明亮模式')
                    );
                  } else if (actionPayload.action === 'navigate_site' && actionPayload.route) {
                    const route = actionPayload.route;
                    toast.info((locale === 'en' ? 'Navigator: Heading to ' : '站点领航员: 正在前往 ') + route);
                    setTimeout(() => {
                      router.push(route);
                    }, 600);
                  }
                }
              }
            } catch {}
          }

          // 净化正文：剔除提取到的完整 JSON 块、可能未闭合的末尾 {"type" 碎片，以及本地域名
          const cleanContent = streamBuffer
            .replace(/\{"type"\s*:\s*"(tool_status|citations|action|thinking)"[\s\S]*?\}/g, '')
            .replace(/\{"type"[\s\S]*$/g, '')
            .replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '');

          // 文本增量更新到最后一条助手消息
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: cleanContent.trimStart(),
              };
            }
            return updated;
          });
        },
        () => {
          setIsStreaming(false);
          checkUserAndQuota();
        },
        (err) => {
          setIsStreaming(false);
          checkUserAndQuota();
          if (err?.code === 401 || err?.message === 'UNAUTHORIZED' || err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
            toast.info(locale === 'en' ? 'Session expired or not logged in, please sign in' : '登录已失效或尚未登录，请先登录后再体验 AI 伴读');
            setAuthModalOpen(true);
            return;
          }
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content:
                  updated[lastIndex].content ||
                  (locale === 'en'
                    ? 'Failed to connect to Hayden AI engine. Please retry later.'
                    : '抱歉，未能成功连接到 Hayden AI 服务，请稍后再试。'),
              };
            }
            return updated;
          });
        }
      );
    } catch {
      setIsStreaming(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          locale === 'en'
            ? 'Conversation cleared. How can I accompany your thinking today?'
            : '已清空对话记录。今天想聊些什么？',
      },
    ]);
    setSelectedContext(null);
  };

  return (
    <>
      {/* 右下角全局悬浮灵动胶囊：可随时呼出/折叠抽屉 */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
          }
        }}
        title={t('ai.fab_tooltip')}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-white/90 hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-800 text-slate-900 dark:text-white shadow-xl hover:shadow-2xl border border-slate-200/90 dark:border-white/10 backdrop-blur-md transition-all duration-300 group hover:scale-105 cursor-pointer ${
          isOpen ? 'sm:opacity-0 sm:pointer-events-none sm:scale-90' : 'opacity-100'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <BrandLogo size={16} variant="white" animated glow={false} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-slate-900 dark:bg-white animate-ping" />
        </div>
        <span className="text-xs font-bold font-mono tracking-wide hidden sm:inline text-slate-900 dark:text-white">
          Hayden AI
        </span>
        <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-white/10 rounded border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-neutral-300">
          ⌘J
        </kbd>
      </button>

      {/* 移动端轻量点击收起遮罩 (桌面端 sm:hidden，绝不遮挡左侧博文阅读视野) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden transition-opacity duration-300"
        />
      )}

      {/* Cursor / Arc 风格右侧伴读轻量毛玻璃抽屉 (Sidebar Co-pilot) */}
      <aside
        aria-label="Hayden AI Co-pilot"
        className={`fixed top-0 right-0 bottom-0 h-screen z-50 w-full sm:w-[420px] flex flex-col backdrop-blur-2xl bg-neutral-950/85 dark:bg-neutral-950/90 border-l border-white/[0.08] shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* 外脑控制台顶部极光发线 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent z-10" aria-hidden="true" />
        {/* 顶部 Header：标题、模型状态指示灯与折叠/重置按钮 */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08] bg-neutral-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center shadow-xs shrink-0">
              <BrandLogo size={18} variant="white" animated glow={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-neutral-100 tracking-wide font-mono">
                  {t('ai.modal_title')}
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/10">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      aiOnline ? 'bg-white animate-pulse' : 'bg-neutral-500'
                    }`}
                  />
                  {aiModel}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">
                {t('ai.modal_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClear}
              title={t('ai.clear')}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="收起伴读抽屉 (Esc)"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors flex items-center gap-1 text-xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-neutral-400">
                Esc
              </kbd>
            </button>
          </div>
        </div>

        {/* 未登录访客拦截横幅 */}
        {!currentUser && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs flex items-center justify-between gap-3 text-amber-200 shrink-0 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-amber-300 block">未登录访客模式</span>
                <span className="text-amber-200/80">登录读者账号即可开启每日 15 次 AI 深度伴读</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[11px] transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>立即登录</span>
            </button>
          </div>
        )}

        {/* 划词追问选中文本引用卡片 (Quote Card) */}
        {selectedContext && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-start justify-between gap-2 shadow-sm animate-fade-in shrink-0">
            <div className="flex items-start gap-2 overflow-hidden">
              <Quote className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="overflow-hidden">
                <span className="font-mono text-[10px] text-emerald-400 font-semibold block">
                  {t('ai.spark_desc')}
                </span>
                <p className="text-neutral-300 text-xs line-clamp-2 italic font-serif leading-relaxed">
                  “{selectedContext}”
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedContext(null)}
              title="取消引用"
              className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 消息对话列表（深空星轨氛围底） */}
        <div className="relative flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
          <div className="starfield pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <BrandLogo size={14} variant="white" animated glow={false} />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-950/40 font-sans'
                    : 'bg-white/[0.04] border border-white/[0.08] text-neutral-200 rounded-tl-none shadow-sm'
                }`}
              >
                {/* 1. 工具执行动效胶囊 */}
                {msg.toolStatus && (
                  <div
                    className={`mb-2.5 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-300 ${
                      msg.toolStatus.status === 'running'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse'
                        : 'bg-white/[0.04] border border-white/[0.08] text-neutral-400'
                    }`}
                  >
                    {msg.toolStatus.status === 'running' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
                        <span className="font-semibold truncate">{msg.toolStatus.message}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{msg.toolStatus.message}</span>
                      </>
                    )}
                  </div>
                )}

                {/* 2. 消息正文 */}
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm space-y-2 leading-relaxed">
                    {msg.reasoning && (
                      <div className="not-prose mb-3 rounded-xl border border-white/10 bg-black/40 overflow-hidden text-[11px] font-mono">
                        <div className="px-3 py-1.5 bg-white/[0.04] text-neutral-400 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <Brain className="w-3.5 h-3.5 animate-pulse" />
                            <span>🧠 深度思考推理 (Reasoning)</span>
                          </span>
                        </div>
                        <div className="p-3 text-neutral-400 whitespace-pre-wrap leading-relaxed border-t border-white/[0.06] border-l-2 border-emerald-500/50 max-h-48 overflow-y-auto">
                          {msg.reasoning}
                        </div>
                      </div>
                    )}

                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match && !String(children).includes('\n');
                          if (isInline) {
                            return (
                              <code
                                className="px-1.5 py-0.5 rounded bg-white/[0.08] text-emerald-300 font-mono text-[11px] border border-white/[0.06]"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }
                          return (
                            <CodeBlock className={className}>
                              {children}
                            </CodeBlock>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {/* 打字机流式光标动效 */}
                    {isStreaming && index === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-pulse ml-1 align-middle rounded-sm shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* 3. Bento 风格知识引用卡片 */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 font-semibold tracking-wide">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                        {locale === 'en' ? 'Knowledge Citations' : '数字花园知识库出处'} ({msg.citations.length})
                      </span>
                      <span className="text-[10px] text-neutral-500 font-normal">True RAG</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.citations.map((cite, cIdx) => {
                        const mat = (cite.maturity || 'SEEDLING').toUpperCase();
                        let badgeLabel = '🌱 萌芽 (Seedling)';
                        let badgeStyle = 'text-amber-300 bg-amber-500/10 border-amber-500/25';
                        if (mat.includes('EVERGREEN') || mat.includes('TREE')) {
                          badgeLabel = '🌲 常青 (Evergreen)';
                          badgeStyle = 'text-teal-300 bg-teal-500/10 border-teal-500/25';
                        } else if (mat.includes('BUDDING') || mat.includes('GROWING')) {
                          badgeLabel = '🌿 生长 (Budding)';
                          badgeStyle = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';
                        }

                        return (
                          <div
                            key={cIdx}
                            onClick={() => {
                              const targetUrl = (cite.url || (cite.slug ? `/blog/${cite.slug}` : '')).replace(
                                /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g,
                                ''
                              );
                              if (targetUrl) {
                                router.push(targetUrl);
                              }
                            }}
                            className="p-3 rounded-xl border border-white/[0.08] bg-neutral-900/40 hover:bg-emerald-500/[0.06] hover:border-emerald-500/30 transition-all cursor-pointer group shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                                {badgeLabel}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400 group-hover:text-emerald-300 flex items-center gap-1 transition-colors">
                                {locale === 'en' ? 'Read' : '阅读全文'}
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-neutral-100 group-hover:text-emerald-200 mt-1.5 transition-colors line-clamp-1">
                              《{cite.title}》
                            </h4>
                            {cite.excerpt && (
                              <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed italic font-serif">
                                {cite.excerpt}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. 指令动作卡片 */}
                {msg.action && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {msg.action.action === 'navigate_site' && msg.action.route && (
                      <button
                        type="button"
                        onClick={() => router.push(msg.action!.route!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 transition-all active:scale-95 shadow-sm"
                      >
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span>直达页面：{msg.action.route}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    {msg.action.action === 'switch_theme' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-white/[0.04] border border-white/[0.08] text-neutral-300">
                        <Palette className="w-3.5 h-3.5 text-cyan-400" />
                        <span>已执行明暗主题切换</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 快捷推荐追问列表 */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-neutral-900/30 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar shrink-0">
          <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
            Suggested:
          </span>
          {[
            t('ai.quick_1'),
            t('ai.quick_2'),
            t('ai.quick_3'),
          ].map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              disabled={isStreaming}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-emerald-500/10 hover:text-emerald-300 border border-white/[0.08] hover:border-emerald-500/30 text-neutral-300 whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* 底部输入框与发送栏 */}
        <div className="p-3 border-t border-white/[0.08] bg-neutral-950/60 backdrop-blur-md shrink-0 space-y-2">
          {/* 配额指示状态胶囊 */}
          <div className="flex items-center justify-between text-[11px] font-mono px-1">
            {currentUser?.role === 'ADMIN' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>站长专属 · 无限额度伴读</span>
              </span>
            ) : currentUser ? (
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  (quotaInfo?.dayRemaining ?? 15) <= 3 ? 'text-amber-400' : 'text-neutral-400'
                }`}
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>
                  今日剩余额度: <strong className="text-neutral-200">{quotaInfo?.dayRemaining ?? 15}</strong> 次
                </span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1 text-amber-400/90 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>未登录 (0 次可用) · 点击登录解锁</span>
              </button>
            )}

            <span className="text-[10px] text-neutral-500 hidden sm:inline">
              Cmd+J 呼出 · Esc 折叠
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentUser ? t('ai.input_placeholder') : '请先登录读者账号后再提问...'}
              disabled={isStreaming}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-neutral-100 placeholder:text-neutral-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/60 focus:border-emerald-500/50 focus:shadow-[0_0_24px_rgba(16,185,129,0.15)] transition-all font-sans"
            />
            <button
              type="submit"
              disabled={isStreaming || (!input.trim() && !selectedContext)}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-emerald-950/50 cursor-pointer active:scale-95"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-100" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </aside>

      {/* 读者登录弹窗 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => checkUserAndQuota()}
      />
    </>
  );
}
