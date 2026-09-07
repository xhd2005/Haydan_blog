'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { api } from '@/lib/api';
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
  PanelRightClose,
  Loader2,
  Terminal,
} from 'lucide-react';

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
  const { locale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 异步加载后端 AI 状态
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
  }, []);

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

    const userMessageContent = selectedContext
      ? `> "${selectedContext}"\n\n${textToSend || (locale === 'en' ? 'Please elaborate and explain this section.' : '请为我精讲这段内容并延伸解析。')}`
      : textToSend;

    const newMessages: AiChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessageContent },
    ];

    setMessages(newMessages);
    setInput('');
    const currentSelected = selectedContext;
    setSelectedContext(null);
    setIsStreaming(true);

    // 预留 assistant 消息用于流式拼接
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const chatReq: AiChatRequest = {
      messages: newMessages,
      prompt: textToSend,
      selectedText: currentSelected || undefined,
      articleId: articleIdContext || undefined,
    };

    try {
      await api.streamAiChat(
        chatReq,
        (chunk: string) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + chunk,
              };
            }
            return updated;
          });
        },
        () => {
          setIsStreaming(false);
        },
        (err) => {
          setIsStreaming(false);
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
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-xl hover:shadow-emerald-500/25 border border-emerald-400/30 backdrop-blur-md transition-all duration-300 group hover:scale-105 ${
          isOpen ? 'sm:opacity-0 sm:pointer-events-none sm:scale-90' : 'opacity-100'
        }`}
      >
        <div className="relative">
          <Sparkles className="w-4 h-4 animate-pulse text-cyan-200" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </div>
        <span className="text-xs font-bold font-mono tracking-wide hidden sm:inline">
          Hayden AI
        </span>
        <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-black/30 rounded border border-white/20 text-emerald-100">
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
        className={`fixed top-0 right-0 bottom-0 h-screen z-50 w-full sm:w-[400px] flex flex-col backdrop-blur-2xl bg-neutral-950/85 dark:bg-neutral-950/90 border-l border-white/[0.08] shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* 顶部 Header：标题、模型状态指示灯与折叠/重置按钮 */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08] bg-neutral-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-neutral-100 tracking-wide font-mono">
                  {t('ai.modal_title')}
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      aiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
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
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="收起伴读抽屉 (Esc)"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors flex items-center gap-1 text-xs"
            >
              <ChevronRight className="w-4 h-4" />
              <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-neutral-400">
                Esc
              </kbd>
            </button>
          </div>
        </div>

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

        {/* 消息对话列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-950/40 font-sans'
                    : 'bg-white/[0.04] border border-white/[0.08] text-neutral-200 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm space-y-2 leading-relaxed">
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
        <div className="p-3 border-t border-white/[0.08] bg-neutral-950/60 backdrop-blur-md shrink-0">
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
              placeholder={t('ai.input_placeholder')}
              disabled={isStreaming}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-neutral-100 placeholder:text-neutral-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/60 transition-all font-sans"
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
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-2 px-1">
            <span>Cmd+J 呼出 · Esc 折叠</span>
            <span>支持正文划词追问</span>
          </div>
        </div>
      </aside>
    </>
  );
}
