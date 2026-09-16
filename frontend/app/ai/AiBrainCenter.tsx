'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { AiChatRequest } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Compass,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Zap,
  Globe,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import type { CitationItem, ToolStatus, ExtendedAiChatMessage } from '@/components/ai/AiAssistantModal';

interface ToolCallStep extends ToolStatus {
  at: number;
}

interface CenterMessage extends ExtendedAiChatMessage {
  toolCalls?: ToolCallStep[];
}

const PRESET_PROMPTS = [
  {
    icon: '⚡',
    label: '博客架构与技术栈选型',
    prompt: '请介绍一下 Hayden Xue 这个博客系统的整体全栈系统架构、虚拟线程并发与前端双主题美学设计。',
  },
  {
    icon: '🌲',
    label: '核心博文深度推荐',
    prompt: '从数字花园中推荐 3 篇最具深度的高质量技术博文，并概括其核心见解。',
  },
  {
    icon: '🌍',
    label: '环球探索与摄影美学',
    prompt: 'Hayden 在足迹与随记中记录了哪些城市与摄影故事？站长的探索哲学是什么？',
  },
  {
    icon: '💡',
    label: '数字花园构建哲学',
    prompt: '为什么建造这个个人数字花园？在大模型时代，持续积累个人心智资产有什么长效价值？',
  },
];

export function AiBrainCenter() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale } = useI18n();
  const isEn = locale === 'en';

  const [aiModel, setAiModel] = useState('DeepSeek-V4-Flash');
  const [aiOnline, setAiOnline] = useState(true);

  // 对话流状态
  const [messages, setMessages] = useState<CenterMessage[]>([
    {
      role: 'assistant',
      content: isEn
        ? "Hello! I am Hayden's AI Digital Twin & Knowledge Copilot. I'm equipped with full-text RAG over Hayden Xue's blog articles, spatiotemporal journeys, and system design philosophies. How may I assist your exploration today?"
        : '你好！我是站长 Hayden Xue 的 **AI 数字分身与知识库副驾 (Copilot)**。\n\n我已全面连入数字花园全站博文、旅行足迹与高并发系统架构知识库。无论是探讨底层工程演进、检索具体篇章，还是探讨数字花园的构建哲学，我都随时乐意为你解答。✨',
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getAiStatus()
      .then((status) => {
        if (status) {
          setAiOnline(!!status.enabled);
          if (status.model) setAiModel(status.model);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = (presetText?: string) => {
    const text = (presetText ?? input).trim();
    if (!text || isStreaming) return;

    // 未登录拦截，直接弹出登录弹窗
    const token = typeof window !== 'undefined' ? localStorage.getItem('hayden_token') : null;
    if (!token) {
      toast.info(isEn ? 'Please sign in to chat with Hayden AI' : '请先登录读者账号后再体验 AI 智能伴读');
      setAuthModalOpen(true);
      return;
    }

    if (!presetText) setInput('');

    const userMsg: CenterMessage = { role: 'user', content: text };
    const assistantMsg: CenterMessage = { role: 'assistant', content: '', toolCalls: [] };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const chatReq: AiChatRequest = {
      prompt: text,
      messages: [...messages, userMsg].slice(-10).map((m) => ({ role: m.role, content: m.content })),
    };

    api.streamAiChat(
      chatReq,
      (chunk: string) => {
        let raw = chunk;
        if (raw.startsWith('data:')) {
          raw = raw.replace(/^data:\s*/, '');
        }
        if (!raw || raw === '[DONE]') return;

        const trimmed = raw.trim();
        let isJsonEvent = false;
        let parsed: any = null;
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed.type === 'string') {
              isJsonEvent = true;
            }
          } catch {
            isJsonEvent = false;
          }
        }

        if (isJsonEvent && parsed) {
          if (parsed.type === 'tool_status') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = { ...updated[updated.length - 1] };
              const currentTools = last.toolCalls || [];
              const existingIdx = currentTools.findIndex((t) => t.name === parsed.name);
              const newStep: ToolCallStep = {
                name: parsed.name,
                message: parsed.message,
                status: parsed.status || 'running',
                at: Date.now(),
              };
              if (existingIdx >= 0) {
                currentTools[existingIdx] = newStep;
              } else {
                currentTools.push(newStep);
              }
              last.toolCalls = [...currentTools];
              updated[updated.length - 1] = last;
              return updated;
            });
            return;
          }

          if (parsed.type === 'citations') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = { ...updated[updated.length - 1] };
              last.citations = Array.isArray(parsed.data) ? parsed.data : [];
              updated[updated.length - 1] = last;
              return updated;
            });
            return;
          }

          if (parsed.type === 'content' && typeof parsed.delta === 'string') {
            raw = parsed.delta;
          } else {
            return;
          }
        }

        setMessages((prev) => {
          const updated = [...prev];
          const last = { ...updated[updated.length - 1] };
          last.content = (last.content || '') + raw;
          updated[updated.length - 1] = last;
          return updated;
        });
      },
      () => setIsStreaming(false),
      (err) => {
        setIsStreaming(false);
        if (err?.code === 401 || err?.message === 'UNAUTHORIZED' || err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
          toast.info(isEn ? 'Session expired or not logged in, please sign in' : '登录已失效或尚未登录，请先登录后再体验 AI 伴读');
          setAuthModalOpen(true);
          return;
        }
        toast.error('AI 响应中断: ' + (err?.message || '网络或接口异常'));
      }
    );
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: isEn
          ? "Chat session reset. What would you like to explore next?"
          : '对话已重新开始。你可以随时点击上方快捷卡片或输入感兴趣的话题。',
      },
    ]);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-8 animate-fade-in">
      {/* 1. 顶部极简沉浸式 Hero 状态展台 */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-xl overflow-hidden">
        {/* 背景微环境光晕 */}
        <div className="pointer-events-none absolute -right-20 -top-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                HAYDEN XUE // DIGITAL TWIN & COPILOT
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-100">
              知识库副驾 · AI 数字分身
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
              {isEn
                ? 'Converse with Hayden Xue’s digital twin backed by full-text knowledge retrieval (RAG), architectural insights, and lived expedition logs.'
                : '以站长 Hayden Xue 的思考方式与技术栈为基底，支持站内博文真实溯源、架构解构与即时流式对话。'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>{aiModel}</span>
            </span>
            <button
              onClick={handleResetChat}
              className="p-2 rounded-2xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="重置对话"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 快捷探索灵感药丸 */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-white/[0.06] mt-6">
          <div className="text-[11px] font-mono text-muted-foreground mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>推荐探索话题 (Quick Starters)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                disabled={isStreaming}
                onClick={() => handleSend(item.prompt)}
                className="group p-3 rounded-2xl bg-slate-50/80 dark:bg-neutral-950/40 hover:bg-emerald-500/10 border border-slate-200/70 dark:border-white/[0.06] hover:border-emerald-500/30 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                    {item.label}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 主对话视窗 (Conversational Stream) */}
      <div className="p-4 sm:p-8 rounded-3xl bg-white/85 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm space-y-6 min-h-[420px]">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 sm:gap-4 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* 头像 */}
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  isUser
                    ? 'bg-foreground text-background'
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* 消息气泡 */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] space-y-3 ${
                  isUser
                    ? 'p-4 rounded-3xl rounded-tr-sm bg-emerald-600 text-white text-xs sm:text-sm font-medium leading-relaxed shadow-sm'
                    : 'p-5 sm:p-6 rounded-3xl rounded-tl-sm bg-slate-50/90 dark:bg-neutral-950/50 border border-slate-200/80 dark:border-white/[0.06] text-xs sm:text-sm text-slate-800 dark:text-neutral-200 leading-relaxed sm:leading-loose space-y-3'
                }`}
              >
                {/* 工具调用状态胶囊 */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1.5 pb-2 border-b border-border/40">
                    {msg.toolCalls.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground"
                      >
                        {step.status === 'running' ? (
                          <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        )}
                        <span>{step.message || step.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 正文 Markdown */}
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-white/10 prose-code:text-emerald-500 prose-code:font-mono">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || (isStreaming && idx === messages.length - 1 ? '思考检索中...' : '')}
                    </ReactMarkdown>
                  </div>
                )}

                {/* 知识库溯源引用卡片 (Citations) */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] space-y-2">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-emerald-500" />
                      <span>知识库引文溯源 ({msg.citations.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((cite, cIdx) => (
                        <a
                          key={cIdx}
                          href={cite.url || `/blog/${cite.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/cite p-2.5 rounded-xl bg-white dark:bg-neutral-900/80 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/40 text-xs flex items-center justify-between gap-2 transition-all"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-foreground truncate block group-hover/cite:text-emerald-500">
                              {cite.title}
                            </span>
                            {cite.excerpt && (
                              <span className="text-[10px] text-muted-foreground line-clamp-1">
                                {cite.excerpt}
                              </span>
                            )}
                          </div>
                          <ExternalLink className="w-3 h-3 text-muted-foreground group-hover/cite:text-emerald-500 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. 底部悬浮输入指令栏 (Docked Input Bar) */}
      <div className="relative p-2.5 sm:p-3 rounded-3xl bg-white/90 dark:bg-neutral-900/80 border border-slate-300/80 dark:border-white/[0.12] backdrop-blur-2xl shadow-xl flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          disabled={isStreaming}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={
            isStreaming
              ? 'AI 正在推理生成中...'
              : '问问 Hayden 关于高并发架构、数字花园建站心得或知识库检索...'
          }
          className="flex-1 px-4 py-2.5 bg-transparent border-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-sans"
        />

        <button
          type="button"
          disabled={!input.trim() || isStreaming}
          onClick={() => handleSend()}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          {isStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">发送</span>
        </button>
      </div>

      {/* 读者登录弹窗 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
