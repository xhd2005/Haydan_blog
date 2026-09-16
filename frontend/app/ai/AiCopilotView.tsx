'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { AiChatRequest } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  BookOpen,
  MapPin,
  Camera,
  Clock,
  RotateCcw,
  Compass,
  ArrowRight
} from 'lucide-react';
import type { ToolStatus, ExtendedAiChatMessage } from '@/components/ai/AiAssistantModal';

interface CenterMessage extends ExtendedAiChatMessage {}

const PRESET_TOPICS = [
  {
    icon: '⚡',
    title: '全栈架构哲学',
    desc: '探讨高并发、虚拟线程与微前端',
    prompt: '请用第一人称介绍一下你构建这个博客系统的全栈架构选型与高并发工程考量。',
  },
  {
    icon: '🌍',
    title: '川西高山徒步与摄影',
    desc: '探访川西旷野与胶片摄影心流',
    prompt: 'Hayden，分享一下你在川西高原徒步或旅途中最难忘的一次摄影经历与感悟。',
  },
  {
    icon: '☕',
    title: '数字花园构建初心',
    desc: '独立精神与长期主义自留地',
    prompt: '在这个信息速朽的时代，你为什么坚持打造这样一个高度自主的数字花园？',
  },
];

export function AiCopilotView() {
  const router = useRouter();
  const { locale } = useI18n();
  const isEn = locale === 'en';

  const [aiModel, setAiModel] = useState('DeepSeek-V4-Flash');
  const [messages, setMessages] = useState<CenterMessage[]>([
    {
      role: 'assistant',
      content: isEn
        ? "Hello! I am Hayden Xue's AI Knowledge Copilot. I'm connected to all of Hayden's blog essays, travel expeditions, and architectural notes. How can I assist your exploration today?"
        : '你好！我是站长 Hayden Xue 的 **AI 数字分身与全站知识副驾**。\n\n我已经深度学习了全站高并发架构笔记、川西高原足迹与胶片摄影感悟。无论是探讨底层工程演进、探寻高山徒步心得，还是交流独立造物哲学，我都随时以第一人称真诚与你探讨。✨',
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取后端 AI 模型状态
  useEffect(() => {
    api.getAiStatus()
      .then((status) => {
        if (status?.model) setAiModel(status.model);
      })
      .catch(() => {});
  }, []);

  // 消息自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // 发送消息
  const handleSend = (presetText?: string) => {
    const text = (presetText ?? input).trim();
    if (!text || isStreaming) return;
    if (!presetText) setInput('');

    const userMsg: CenterMessage = { role: 'user', content: text };
    const assistantMsg: CenterMessage = { role: 'assistant', content: '' };
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

        setMessages((prev) => {
          const updated = [...prev];
          const last = { ...updated[updated.length - 1] };
          last.content += raw;
          updated[updated.length - 1] = last;
          return updated;
        });
      },
      () => {
        setIsStreaming(false);
      },
      (error: any) => {
        setIsStreaming(false);
      }
    );
  };

  // 重置对谈
  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: isEn
          ? "Conversation refreshed. What would you like to explore next about Hayden's work?"
          : '对话已复位。关于我的技术栈、旅行足迹或数字花园，你还想探索什么？',
      },
    ]);
  };

  return (
    <div className="w-full min-h-screen pb-24">
      {/* 顶部 Header */}
      <section className="pt-28 pb-10 text-center max-w-4xl mx-auto px-4 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>KNOWLEDGE COPILOT // 知识副驾</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-sans">
          数字分身与全站副驾
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-sans">
          深度连入全站博文、旅行足迹与高并发架构思考。以第一人称亲切交流，智能导引全站内容。
        </p>

        {/* 模型状态 */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground pt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>CONNECTED TO HAYDEN XUE KNOWLEDGE BASE ({aiModel})</span>
        </div>
      </section>

      {/* 主体会话流容器 */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        {/* 启发式引导提问卡片（对话未深入时展示） */}
        {messages.length <= 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {PRESET_TOPICS.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSend(item.prompt)}
                className="p-4 rounded-3xl bg-white/88 dark:bg-neutral-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] hover:border-blue-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 pt-1.5 font-sans">
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* 消息对话气泡列表 */}
        <div className="space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs border border-blue-500/20 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-3xl p-5 sm:p-6 text-sm sm:text-base leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-tr-xs shadow-md font-sans'
                    : 'bg-white/88 dark:bg-neutral-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] text-foreground rounded-tl-xs shadow-sm font-sans'
                }`}
              >
                <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none break-words font-sans">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* 智能站内实体导流药丸 */}
                {msg.role === 'assistant' && (
                  <div className="flex flex-wrap items-center gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs font-mono">
                    <button
                      onClick={() => router.push('/blog')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span>技术博客</span>
                    </button>
                    <button
                      onClick={() => router.push('/journey')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>足迹航线</span>
                    </button>
                    <button
                      onClick={() => router.push('/memos')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-rose-500" />
                      <span>摄影随记</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-2xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 pl-12">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>知识索引激发中，正在生成第一人称回应...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 底部浮动提问栏 */}
        <div className="pt-4 sticky bottom-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl p-2 rounded-2xl border border-slate-200/80 dark:border-white/[0.12] shadow-xl focus-within:border-blue-500 transition-colors"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isEn ? "Ask Hayden's digital copilot anything..." : "向 Hayden Xue 的数字分身提问..."}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none font-sans"
              disabled={isStreaming}
            />
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl text-muted-foreground hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              title="复位对话"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-sans font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all shrink-0 shadow-sm cursor-pointer"
            >
              {isStreaming ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>发送</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
