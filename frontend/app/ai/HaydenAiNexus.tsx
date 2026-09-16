'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast, confirmModal } from '@/lib/toast';
import { AiChatRequest, AiCitationItem, PageVisualItem } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AiCinematicIntro } from './AiCinematicIntro';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  Sparkles,
  Loader2,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Terminal,
  Brain,
  ArrowUp,
  Square,
  Atom,
  BookOpen,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Trash2,
  Edit2,
  Download,
  Volume2,
  VolumeX,
  MessageSquare,
  Clock,
  Play,
  Pause,
  X,
  Search as SearchIcon,
} from 'lucide-react';

interface ToolCallStep {
  name: string;
  message?: string;
  status: string;
  at: number;
}

export interface NexusMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  isThinkingOpen?: boolean;
  thinkingTimeMs?: number;
  toolCalls?: ToolCallStep[];
  citations?: AiCitationItem[];
  createdAt: number;
}

export interface AiSession {
  id: string;
  title: string;
  messages: NexusMessage[];
  createdAt: number;
  updatedAt: number;
}

const SESSIONS_STORAGE_KEY = 'hayden_ai_sessions_v2';
const ACTIVE_SESSION_STORAGE_KEY = 'hayden_ai_active_session_v2';

const DEFAULT_PRESET_PROMPTS = [
  {
    icon: '⚡',
    label: '全栈高并发架构',
    prompt: '请向我系统介绍站长 Hayden Xue 个人博客系统的全栈架构选型、Java 25 虚拟线程高吞吐并发设计与双主题三维美学原则。',
  },
  {
    icon: '🌲',
    label: '常青博文深度索引',
    prompt: '请从 Hayden 的数字花园常青博文（Evergreen Notes）中精选 3 篇最具工程深度的文章，并深度剖析其核心洞察。',
  },
  {
    icon: '🏔️',
    label: '川西高山徒步摄影',
    prompt: '分享一下你在川西高原徒步中难忘的摄影经历与感悟，你的地理探索哲学是什么？',
  },
  {
    icon: '💡',
    label: '数字花园构建初心',
    prompt: '在大模型速朽时代，为什么坚持纯手工打造高度自主、真诚纯粹的个人数字花园与智能外脑？',
  },
];

// 代码块高亮与一键复制组件
function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('代码已复制到剪贴板');
    } catch {
      toast.error('复制失败，请手动选取');
    }
  };

  return (
    <div className="relative my-3 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.12] bg-slate-900/90 text-slate-100 font-mono text-xs shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-white/[0.08] text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold uppercase tracking-wider">{language || 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="复制代码"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto leading-relaxed scrollbar-thin">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export function HaydenAiNexus({ initialVisual }: { initialVisual?: PageVisualItem }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const { theme } = useTheme();
  const { locale } = useI18n();
  const isEn = locale === 'en';

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomTextareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainScrollContainerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const initialFiredRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUserNearBottomRef = useRef(true);
  const drainIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 动态视觉与背景配置（支持客户端从 API 即时同步最新后台设置）
  const [visual, setVisual] = useState<PageVisualItem | undefined>(initialVisual);
  const [isIntroComplete, setIsIntroComplete] = useState(false);

  // 会话管理状态
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 状态变量
  const [modelDisplayName, setModelDisplayName] = useState('DeepSeek-Flash');
  const [aiOnline, setAiOnline] = useState(true);

  // DeepThink (深度思考) 与 Search (站内检索) 双开关
  const [deepThinkEnabled, setDeepThinkEnabled] = useState(true);
  const [searchEnabled, setSearchEnabled] = useState(true);

  // 消息流与输入
  const [messages, setMessages] = useState<NexusMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 背景多媒体控制
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  // 打字机流式平滑缓冲区队列
  const typewriterQueueRef = useRef<string[]>([]);
  const activeStreamingMsgIdRef = useRef<string | null>(null);
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 配额状态（来自后端首包拦截）
  const [quotaInfo, setQuotaInfo] = useState<{ minuteRemaining?: number; dayRemaining?: number; maxTokens?: number } | null>(null);

  // 灵感占位提示词轮播库与打字机定格动效
  const INSPIRATION_PROMPTS = useMemo(() => [
    '向 Hayden AI 探讨 Java 21 虚拟线程与高吞吐架构选型...',
    '探索站长 Hayden 的 3D 足迹航线与川西/东京旅行哲学...',
    '解读《数字花园发刊词》与现代极简主义工程实践...',
    '咨询 Next.js 14 响应式前端与全栈 AI 原生系统演进...',
  ], []);

  const [placeholderText, setPlaceholderText] = useState('');

  // CMS 动态配置标题与副标
  const displayTitle = visual?.customTitle || initialVisual?.customTitle || 'Into the Unknown';
  const displayDesc = visual?.customDesc || initialVisual?.customDesc || (isEn ? 'Explore the digital garden and neural mind of Hayden Xue' : '探索未知 · 数字心智与全栈知识中枢');
  const displayPlaceholder = visual?.customPlaceholder || initialVisual?.customPlaceholder || (isEn ? 'Ask anything, explore together' : 'Ask anything, explore together');

  // 对话框入场定格与占位提示语逐字打字机轮播
  useEffect(() => {
    if (input.trim().length > 0) return;
    let promptIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timer: NodeJS.Timeout;

    const tick = () => {
      const currentFullText = INSPIRATION_PROMPTS[promptIndex % INSPIRATION_PROMPTS.length];
      if (!isDeleting) {
        charIndex++;
        setPlaceholderText(currentFullText.slice(0, charIndex));
        if (charIndex >= currentFullText.length) {
          isDeleting = true;
          timer = setTimeout(tick, 3800); // 键入完成定格停留 3.8 秒
          return;
        }
        timer = setTimeout(tick, 45); // 逐字打字机流式
      } else {
        charIndex -= 2;
        if (charIndex <= 0) {
          charIndex = 0;
          isDeleting = false;
          promptIndex++;
          timer = setTimeout(tick, 500); // 擦除完成稍作停顿开启下一条
          return;
        }
        setPlaceholderText(currentFullText.slice(0, charIndex));
        timer = setTimeout(tick, 25);
      }
    };

    timer = setTimeout(tick, isIntroComplete ? 200 : 1200);
    return () => clearTimeout(timer);
  }, [INSPIRATION_PROMPTS, isIntroComplete, input]);

  // 同步最新后台视觉设置
  useEffect(() => {
    api.getSettings().then((st) => {
      if (st?.pageVisualsJson) {
        try {
          const cfg = JSON.parse(st.pageVisualsJson);
          if (cfg.ai) {
            setVisual(cfg.ai);
          }
        } catch {}
      }
    }).catch(() => {});
  }, []);

  // 1. 初始化读取本地所有历史会话（默认进入全新空白对话，不主动展示旧会话）
  useEffect(() => {
    let existingSessions: AiSession[] = [];
    try {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (raw) {
        const parsed: AiSession[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          existingSessions = parsed;
        }
      }
    } catch {}

    // 默认始终开启全新空白会话，保障首屏绝对纯净居中
    const newSessionId = `session-${Date.now()}`;
    const freshSession: AiSession = {
      id: newSessionId,
      title: '新探索会话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(existingSessions.length > 0 ? [freshSession, ...existingSessions] : [freshSession]);
    setCurrentSessionId(newSessionId);
    setMessages([]);
  }, []);

  // 2. 同步当前会话变更到 localStorage
  const saveSessionMessages = (sessionId: string, newMessages: NexusMessage[]) => {
    const targetId = sessionId || currentSessionId || `session-${Date.now()}`;
    setSessions((prevSessions) => {
      const idx = prevSessions.findIndex((s) => s.id === targetId);
      let updatedSessions: AiSession[];
      if (idx >= 0) {
        let title = prevSessions[idx].title;
        // 如果标题是默认标题且已有用户消息，自动提取首条提问为标题
        if (
          (title === '新探索会话' || title === 'New Session') &&
          newMessages.length > 0 &&
          newMessages[0].role === 'user'
        ) {
          const raw = newMessages[0].content.replace(/[\r\n]+/g, ' ').trim();
          title = raw.length > 24 ? raw.slice(0, 24) + '...' : raw;
        }
        updatedSessions = [...prevSessions];
        updatedSessions[idx] = {
          ...prevSessions[idx],
          title,
          messages: newMessages,
          updatedAt: Date.now(),
        };
      } else {
        const firstUser = newMessages.find((m) => m.role === 'user');
        const raw = firstUser ? firstUser.content.replace(/[\r\n]+/g, ' ').trim() : '';
        const autoTitle = raw ? (raw.length > 24 ? raw.slice(0, 24) + '...' : raw) : '新探索会话';
        const newSession: AiSession = {
          id: targetId,
          title: autoTitle,
          messages: newMessages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        updatedSessions = [newSession, ...prevSessions];
      }
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, targetId);
      } catch {}
      return updatedSessions;
    });
  };

  // 3. 切换会话
  const handleSwitchSession = (session: AiSession) => {
    if (isStreaming) {
      toast.info('AI 正在推演回答中，请稍候切换或先点击中止');
      return;
    }
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setInput('');
    try {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, session.id);
    } catch {}
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // 4. 新建会话（防止连续点击堆叠空会话）
  const handleCreateNewSession = () => {
    if (isStreaming) {
      toast.info('AI 正在回答中，请等待完成或点击中止');
      return;
    }
    if (messages.length === 0) {
      toast.info('当前已处于新探索空间');
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
      return;
    }
    const newSessionId = `session-${Date.now()}`;
    const newSession: AiSession = {
      id: newSessionId,
      title: '新探索会话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => {
      const updated = [newSession, ...prev];
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, newSessionId);
      } catch {}
      return updated;
    });
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setInput('');
    toast.success('已开启新探索空间');
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // 5. 删除会话（严格遵守破坏性操作防误触红线，接入 confirmModal variant: danger）
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSession = sessions.find((s) => s.id === sessionId);
    const sessionTitle = targetSession?.title || '此会话';

    const confirmed = await confirmModal({
      title: '删除探索会话',
      message: `确定要删除会话「${sessionTitle}」吗？对话记录将被永久移除且不可恢复。`,
      confirmText: '确认删除',
      cancelText: '取消',
      variant: 'danger',
    });
    if (!confirmed) return;

    if (sessions.length <= 1) {
      // 最后一个会话仅重置清空内容
      setMessages([]);
      saveSessionMessages(sessionId, []);
      toast.info('已重置当前探索空间');
      return;
    }
    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));
    } catch {}

    if (sessionId === currentSessionId) {
      const nextSession = filtered[0];
      setCurrentSessionId(nextSession.id);
      setMessages(nextSession.messages || []);
      try {
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, nextSession.id);
      } catch {}
    }
    toast.success('已删除会话记录');
  };

  // 6. 重命名会话
  const handleStartRename = (session: AiSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === sessionId ? { ...s, title: editingTitle.trim() } : s));
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setEditingSessionId(null);
    toast.success('会话重命名成功');
  };

  // 7. 清空全部历史会话（接入 confirmModal 严密保护，杜绝原生 window.confirm）
  const handleClearAllSessions = async () => {
    const confirmed = await confirmModal({
      title: '清空历史探索记录',
      message: '确定要清空所有历史对话记录吗？全站会话上下文将彻底抹除且不可撤销。',
      confirmText: '彻底清空',
      cancelText: '取消',
      variant: 'danger',
    });
    if (!confirmed) return;

    const newSessionId = `session-${Date.now()}`;
    const freshSession: AiSession = {
      id: newSessionId,
      title: '新探索会话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions([freshSession]);
    setCurrentSessionId(newSessionId);
    setMessages([]);
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([freshSession]));
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, newSessionId);
    } catch {}
    toast.success('已清空全部会话');
  };

  // 中止当前推演流
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (drainIntervalRef.current) {
      clearInterval(drainIntervalRef.current);
      drainIntervalRef.current = null;
    }
    typewriterQueueRef.current = [];
    setIsStreaming(false);
    activeStreamingMsgIdRef.current = null;
    setMessages((latest) => {
      saveSessionMessages(currentSessionId, latest);
      return latest;
    });
    toast.info('已中止当前推演生成');
  };

  // 8. 导出当前会话为标准 Frontmatter Markdown 资产
  const handleExportMarkdown = () => {
    if (messages.length === 0) {
      toast.info('当前会话暂无对话内容可导出');
      return;
    }
    const currentSession = sessions.find((s) => s.id === currentSessionId);
    const title = currentSession?.title || 'Hayden AI Dialogue';
    const dateStr = new Date().toISOString().split('T')[0];

    const frontmatter = [
      '---',
      `title: "${title.replace(/"/g, '\\"')}"`,
      `date: "${dateStr}"`,
      'categories: ["AI Explorations"]',
      'tags: ["Hayden Xue", "DeepThink", "Digital Garden"]',
      'author: "Hayden Xue"',
      '---\n\n',
    ].join('\n');

    let body = `# ${title}\n\n> 导出于 Hayden Xue 数字外脑中枢 · ${new Date().toLocaleString()}\n\n---\n\n`;

    messages.forEach((msg) => {
      if (msg.role === 'user') {
        body += `### 🧑‍💻 读者提问\n\n${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        body += `### 🤖 Hayden AI 回复\n\n`;
        if (msg.reasoning) {
          body += `> **深度思考推演链**：\n>\n> ${msg.reasoning.split('\n').join('\n> ')}\n\n`;
        }
        body += `${msg.content}\n\n`;
        if (msg.citations && msg.citations.length > 0) {
          body += `**引证常青博文**：\n`;
          msg.citations.forEach((c) => {
            body += `- [《${c.title}》](${c.url || `/blog/${c.slug}`})\n`;
          });
          body += `\n`;
        }
        body += `---\n\n`;
      }
    });

    const fullContent = frontmatter + body;
    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hayden-ai-${currentSessionId}-${dateStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('已导出标准 Markdown 资产');
  };

  // 获取后端 AI 状态
  useEffect(() => {
    api.getAiStatus()
      .then((status) => {
        if (status) {
          setAiOnline(!!status.enabled);
          if (status.model) {
            if (status.model.includes('pro')) {
              setModelDisplayName('DeepSeek-V4-Pro');
            } else if (status.model.includes('flash')) {
              setModelDisplayName('DeepSeek-Flash');
            } else {
              setModelDisplayName(status.model);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // 监听容器滚动，实时感知用户是否停留在底部，避免干扰用户回看历史
  const handleContainerScroll = (e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const isNear = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    isUserNearBottomRef.current = isNear;
  };

  // 启动打字机平滑排队消费器 (Adaptive Typewriter Queue Ticker)
  useEffect(() => {
    const interval = setInterval(() => {
      const targetId = activeStreamingMsgIdRef.current;
      if (!targetId || typewriterQueueRef.current.length === 0) return;

      // 根据队列积压长度自适应调整消费速率：积压多时提速，积压少时保持优雅拟人节奏
      const qLen = typewriterQueueRef.current.length;
      const step = qLen > 30 ? 6 : qLen > 15 ? 3 : qLen > 6 ? 2 : 1;
      const popped = typewriterQueueRef.current.splice(0, step).join('');

      setMessages((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((m) => m.id === targetId);
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            content: (updated[idx].content || '') + popped,
          };
        }
        return updated;
      });

      // 仅在用户位于底部附近时平滑自动贴底滚动，杜绝 55Hz smooth-scroll 强占动画引擎导致的卡顿抖动
      if (isUserNearBottomRef.current && mainScrollContainerRef.current) {
        mainScrollContainerRef.current.scrollTop = mainScrollContainerRef.current.scrollHeight;
      }
    }, 18);

    typewriterTimerRef.current = interval;
    return () => clearInterval(interval);
  }, []);

  // 自适应多行高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 180)}px`;
  };

  // 文本域键盘输入监听 (Enter 发送，Shift+Enter 换行)
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 发送消息
  const handleSend = async (presetText?: string) => {
    const text = (presetText ?? input).trim();
    if (!text || isStreaming) return;

    if (!presetText) {
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      if (bottomTextareaRef.current) bottomTextareaRef.current.style.height = 'auto';
    }

    const assistantId = `msg-${Date.now()}`;
    const userMsg: NexusMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };

    const thinkingStartTime = Date.now();
    const assistantMsg: NexusMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      reasoning: '',
      isThinkingOpen: true,
      toolCalls: [],
      citations: [],
      createdAt: Date.now(),
    };

    const updatedMessages = [...messages, userMsg, assistantMsg];
    setMessages(updatedMessages);
    saveSessionMessages(currentSessionId, updatedMessages);
    setIsStreaming(true);

    activeStreamingMsgIdRef.current = assistantId;
    typewriterQueueRef.current = [];

    // 重置并触发单次平滑滚动至底部
    isUserNearBottomRef.current = true;
    requestAnimationFrame(() => {
      if (mainScrollContainerRef.current) {
        mainScrollContainerRef.current.scrollTo({
          top: mainScrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    });

    // 建立中止控制器
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 识别日常问候语（如你好、hi、在吗等），不盲目追加系统推演指令
    const isSimpleGreeting = /^(你好|您好|哈喽|嗨|hi|hello|hey|在吗|在么|早上好|下午好|晚上好)[!！?？~～\s]*$/i.test(text.trim());

    // 构建上下文，带入 DeepThink 与 Search 开关
    const systemDirective = isSimpleGreeting
      ? ''
      : [
          deepThinkEnabled ? '[指令：请启动深度推演思维链 (DeepThinking)，展示系统级严密推理]' : '',
          searchEnabled ? '[指令：请检索站内知识库，精准引用站长 Hayden Xue 的已发布博文与足迹]' : '',
        ].filter(Boolean).join('\n');

    const combinedPrompt = systemDirective ? `${systemDirective}\n\n${text}` : text;

    // 严格过滤掉尾部空 assistant 占位消息，避免外部 API 返回 HTTP 400 Bad Request
    const chatReq: AiChatRequest = {
      prompt: combinedPrompt,
      messages: updatedMessages
        .filter((m) => m.role !== 'assistant' || (m.content && m.content.trim().length > 0))
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content })),
    };

    try {
      await api.streamAiChat(chatReq, {
        signal: controller.signal,
        onQuota: (quota: any) => {
          if (quota) {
            setQuotaInfo({
              minuteRemaining: quota.minuteRemaining,
              dayRemaining: quota.dayRemaining,
              maxTokens: quota.maxTokens,
            });
          }
        },
        onThinking: (thinkingDelta: string) => {
          if (!deepThinkEnabled) return;
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.findIndex((m) => m.id === assistantId);
            if (lastIdx >= 0) {
              const prevMsg = updated[lastIdx];
              const elapsed = Math.round((Date.now() - thinkingStartTime) / 100) / 10;
              updated[lastIdx] = {
                ...prevMsg,
                reasoning: (prevMsg.reasoning || '') + thinkingDelta,
                thinkingTimeMs: elapsed,
                isThinkingOpen: true,
              };
            }
            return updated;
          });
          if (isUserNearBottomRef.current && mainScrollContainerRef.current) {
            mainScrollContainerRef.current.scrollTop = mainScrollContainerRef.current.scrollHeight;
          }
        },
        onContent: (contentDelta: string) => {
          // 采用 Unicode 代码点迭代，杜绝 Unicode surrogate pair (如 emoji/高阶字符) 被按双字节截断产生乱码
          for (const char of contentDelta) {
            typewriterQueueRef.current.push(char);
          }
        },
        onCitations: (citations: AiCitationItem[]) => {
          if (!searchEnabled) return;
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.findIndex((m) => m.id === assistantId);
            if (lastIdx >= 0) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                citations,
              };
            }
            return updated;
          });
        },
        onToolStatus: (toolStatus: any) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.findIndex((m) => m.id === assistantId);
            if (lastIdx >= 0) {
              const currentTools = updated[lastIdx].toolCalls || [];
              const existingIdx = currentTools.findIndex((t) => t.name === toolStatus.name);
              const step: ToolCallStep = {
                name: toolStatus.name,
                message: toolStatus.message,
                status: toolStatus.status || 'running',
                at: Date.now(),
              };
              if (existingIdx >= 0) {
                currentTools[existingIdx] = step;
              } else {
                currentTools.push(step);
              }
              updated[lastIdx] = {
                ...updated[lastIdx],
                toolCalls: [...currentTools],
              };
            }
            return updated;
          });
        },
        onDone: () => {
          // 等待队列平滑清空完毕
          if (drainIntervalRef.current) {
            clearInterval(drainIntervalRef.current);
          }
          const drainCheck = setInterval(() => {
            if (typewriterQueueRef.current.length === 0) {
              clearInterval(drainCheck);
              drainIntervalRef.current = null;
              setIsStreaming(false);
              activeStreamingMsgIdRef.current = null;
              abortControllerRef.current = null;
              setMessages((latest) => {
                saveSessionMessages(currentSessionId, latest);
                return latest;
              });
            }
          }, 30);
          drainIntervalRef.current = drainCheck;
        },
        onError: (err: any) => {
          setIsStreaming(false);
          activeStreamingMsgIdRef.current = null;
          abortControllerRef.current = null;
          if (drainIntervalRef.current) {
            clearInterval(drainIntervalRef.current);
            drainIntervalRef.current = null;
          }
          toast.error('AI 响应中断: ' + (err?.message || '服务异常'));
        },
      });
    } catch (err: any) {
      setIsStreaming(false);
      activeStreamingMsgIdRef.current = null;
      abortControllerRef.current = null;
      if (drainIntervalRef.current) {
        clearInterval(drainIntervalRef.current);
        drainIntervalRef.current = null;
      }
      toast.error('请求失败: ' + (err?.message || '未知错误'));
    }
  };

  const handleToggleThinking = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isThinkingOpen: !m.isThinkingOpen } : m))
    );
  };

  const copyMessageContent = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('已复制完整回复');
    } catch {
      toast.error('复制失败');
    }
  };

  useEffect(() => {
    if (initialPrompt && !initialFiredRef.current) {
      initialFiredRef.current = true;
      setIsIntroComplete(true);
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const hasMessages = messages.length > 0;

  // 当开屏仪式就绪完成后，自动聚焦输入框，沉浸式欢迎探索
  useEffect(() => {
    if (isIntroComplete && !hasMessages && !isSidebarOpen) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isIntroComplete, hasMessages, isSidebarOpen]);

  // 全局快捷键响应：Esc 关闭抽屉/中断推演、Ctrl/Cmd+Shift+O 开合抽屉、Ctrl/Cmd+K 新建会话
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'Escape') {
        if (isSidebarOpen) {
          e.preventDefault();
          setIsSidebarOpen(false);
          return;
        }
        if (isStreaming) {
          e.preventDefault();
          handleStopGeneration();
          return;
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K') && !isInput) {
        e.preventDefault();
        handleCreateNewSession();
        return;
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSidebarOpen, isStreaming]);

  // 会话时间线分组 (今天 / 过去7天 / 更早) + 关键字搜索过滤
  const groupedSessions = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    const filtered = sessionSearch.trim()
      ? sessions.filter((s) => s.title.toLowerCase().includes(sessionSearch.toLowerCase().trim()))
      : sessions;

    const today: AiSession[] = [];
    const pastWeek: AiSession[] = [];
    const older: AiSession[] = [];

    filtered.forEach((s) => {
      const diff = now - s.updatedAt;
      if (diff < oneDay) {
        today.push(s);
      } else if (diff < sevenDays) {
        pastWeek.push(s);
      } else {
        older.push(s);
      }
    });

    return [
      { title: isEn ? 'Today' : '今天', list: today },
      { title: isEn ? 'Previous 7 Days' : '过去 7 天', list: pastWeek },
      { title: isEn ? 'Earlier' : '更早以前', list: older },
    ].filter((g) => g.list.length > 0);
  }, [sessions, isEn, sessionSearch]);

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-0 bg-[#fbfbfd] dark:bg-[#08090d] text-slate-900 dark:text-neutral-100 flex flex-col transition-colors selection:bg-blue-500/20 font-sans overflow-hidden">
      
      {/* ================= 0. 电影感开屏入场仪式（类似足迹页长镜头） ================= */}
      {!initialPrompt && (
        <AiCinematicIntro
          title={displayTitle}
          onComplete={() => setIsIntroComplete(true)}
        />
      )}

      {/* ================= 1. 动态全景背景多媒体层（视频/图片/微晶深空） ================= */}
      <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none select-none">
        {visual?.bgUrl && visual?.bgType === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={visual.bgUrl}
              autoPlay
              loop
              muted={isVideoMuted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            />
            {/* 液态玻璃透光遮罩层 (Liquid Glass Scrim with subtle iridescent hue) */}
            <div className="absolute inset-0 bg-slate-950/40 dark:bg-[#06080e]/65 backdrop-blur-[1.5px]" />
            {/* 环境透光光晕 */}
            <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-3xl" />
          </>
        ) : visual?.bgUrl && visual?.bgType === 'image' ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={visual.bgUrl}
              alt="Workspace Background"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            />
            <div className="absolute inset-0 bg-slate-950/40 dark:bg-[#06080e]/65 backdrop-blur-[1.5px]" />
            <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-3xl" />
          </>
        ) : (
          <>
            {/* 默认微晶星轨网格与环境透光光晕 (Translucent Caustic Ambient Glow) */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0c_1px,transparent_1px)] [background-size:28px_28px] opacity-70" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-blue-500/20 via-cyan-500/15 to-transparent blur-3xl opacity-80 dark:opacity-40" />
            <div className="absolute top-1/3 left-1/4 w-[450px] h-[350px] bg-gradient-to-tr from-violet-500/15 via-indigo-500/10 to-transparent blur-3xl opacity-60 dark:opacity-30" />
            <div className="absolute bottom-10 right-10 w-[600px] h-[350px] bg-gradient-to-t from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl opacity-60 dark:opacity-25" />
          </>
        )}
      </div>

      {/* ================= 1.5 历史会话左下角紧凑微浮窗 (VisionOS / Raycast Popover, z-[60]) ================= */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* 轻量无感知透光背景遮罩 (10% 透光，不破坏居中大画面的通透感，点击窗口外部或按 Esc 瞬间顺滑收起) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-[55] bg-black/10 dark:bg-black/25 backdrop-blur-[1.5px]"
            />

            {/* 浮动卡片本体：自左下角胶囊向右上方微弹绽放，升华至 380px VisionOS 液态玻璃悬浮晶体窗 */}
            <motion.aside
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 14 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              style={{ transformOrigin: 'bottom left' }}
              className="fixed bottom-16 left-4 sm:left-6 z-[60] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[72vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0c0f1d]/80 backdrop-blur-2xl sm:backdrop-blur-3xl saturate-180 border border-white/80 dark:border-white/[0.16] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_24px_55px_-12px_rgba(0,0,0,0.18)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.2),0_28px_65px_-15px_rgba(0,0,0,0.85)] overflow-hidden select-none transition-all"
            >
              {/* 顶部镜面菲涅尔反射光线 (VisionOS Specular Highlight) */}
              <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/40 to-transparent pointer-events-none rounded-t-3xl" />
              {/* 微透镜漫反射渐变层 */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.15] via-transparent to-black/[0.03] dark:from-white/[0.05] dark:to-transparent pointer-events-none rounded-2xl sm:rounded-3xl" />

              {/* 卡片顶部标头 */}
              <div className="pt-4 px-4 pb-3 flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.08] relative z-10">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-neutral-200">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="tracking-tight">会话档案</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/15">
                    {sessions.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                  title="关闭 (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* "+ 新建会话" 与搜索过滤 */}
              <div className="p-3.5 space-y-2.5 relative z-10">
                <button
                  type="button"
                  onClick={handleCreateNewSession}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-blue-500/25 border border-white/20 transition-all cursor-pointer relative overflow-hidden group"
                >
                  {/* 按钮微光弧 */}
                  <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
                  <Plus className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-90" />
                  <span>新建探索会话</span>
                </button>

                {/* 会话过滤搜索框 (会话数 >= 3 时展示) */}
                {sessions.length >= 3 && (
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                    <input
                      type="text"
                      value={sessionSearch}
                      onChange={(e) => setSessionSearch(e.target.value)}
                      placeholder="搜索历史会话..."
                      className="w-full pl-8 pr-7 py-2 rounded-xl text-xs bg-slate-100/70 dark:bg-white/[0.05] backdrop-blur-md border border-slate-200/60 dark:border-white/[0.08] focus:border-blue-500/80 dark:focus:border-blue-400/80 outline-none text-foreground placeholder-slate-400 dark:placeholder-neutral-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all"
                    />
                    {sessionSearch && (
                      <button
                        type="button"
                        onClick={() => setSessionSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 text-xs p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 会话列表流 */}
              <div className="flex-1 overflow-y-auto px-3 py-1 space-y-2.5 scrollbar-thin relative z-10">
                {groupedSessions.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 dark:text-neutral-500 font-light">
                    {sessionSearch ? '未找到相关会话' : '暂无历史会话'}
                  </div>
                ) : (
                  groupedSessions.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1">
                      <div className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500 font-semibold">
                        {group.title}
                      </div>
                      {group.list.map((s) => {
                        const isActive = s.id === currentSessionId;
                        const isEditing = s.id === editingSessionId;

                        return (
                          <div
                            key={s.id}
                            onClick={() => handleSwitchSession(s)}
                            className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                              isActive
                                ? 'bg-blue-500/15 dark:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(59,130,246,0.15)] backdrop-blur-sm'
                                : 'text-slate-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/[0.06] border border-transparent hover:border-slate-200/60 dark:hover:border-white/[0.08] backdrop-blur-xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-1">
                              <MessageSquare className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-400 dark:text-neutral-500 group-hover:text-slate-600 dark:group-hover:text-neutral-300'}`} />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={() => handleSaveRename(s.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(s.id);
                                    if (e.key === 'Escape') setEditingSessionId(null);
                                  }}
                                  autoFocus
                                  className="w-full bg-white dark:bg-black/70 px-2 py-0.5 rounded-md text-xs text-foreground border border-blue-500 outline-none shadow-xs"
                                />
                              ) : (
                                <span className="truncate leading-tight">{s.title}</span>
                              )}
                            </div>

                            {/* 操作图标（重命名与删除） */}
                            {!isEditing && (
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleStartRename(s, e)}
                                  className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-white/90 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                  title="重命名"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSession(s.id, e)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-white/90 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                  title="删除会话"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* 底部综合操作矩阵 */}
              <div className="p-3 border-t border-slate-200/60 dark:border-white/[0.08] space-y-2.5 bg-slate-50/60 dark:bg-white/[0.02] backdrop-blur-md relative z-10">
                {/* 优雅配额微气泡 */}
                {quotaInfo && (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-[10px] text-blue-700 dark:text-blue-300 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>今日推理配额</span>
                    </span>
                    <span className="font-semibold">剩余 {quotaInfo.dayRemaining ?? '-'} 次</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* 导出 Markdown 资产 */}
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    disabled={!hasMessages}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                      hasMessages
                        ? 'bg-white/80 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/15 border-slate-200/80 dark:border-white/[0.12] text-slate-700 dark:text-neutral-200 shadow-xs cursor-pointer active:scale-95'
                        : 'bg-slate-100/50 dark:bg-white/[0.02] border-transparent text-slate-400 dark:text-neutral-600 cursor-not-allowed opacity-60'
                    }`}
                    title={hasMessages ? '导出当前会话为标准 Markdown 资产' : '暂无对话可导出'}
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" />
                    <span>导出会话</span>
                  </button>

                  {/* 清空历史 */}
                  <button
                    type="button"
                    onClick={handleClearAllSessions}
                    className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 transition-all cursor-pointer active:scale-95"
                    title="清空所有历史会话档案"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>清空</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-neutral-500 pt-0.5 px-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${aiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="truncate max-w-[170px]">{modelDisplayName}</span>
                  </span>
                  <span>Esc / Cmd+Shift+O</span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================= 2. 顶部微光操作条（仅在配置背景视频时展示，适配全局 Navbar 空间） ================= */}
      {visual?.bgType === 'video' && visual?.bgUrl && (
        <header className="relative z-30 w-full pt-18 sm:pt-22 pb-2 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex items-center justify-end pointer-events-none transition-all">
          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              type="button"
              onClick={toggleVideoPlayback}
              className="p-1.5 rounded-full text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-white/60 dark:bg-white/[0.05] border border-white/20 transition-all cursor-pointer text-xs backdrop-blur-md"
              title={isVideoPlaying ? '暂停背景视频' : '播放背景视频'}
            >
              {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsVideoMuted(!isVideoMuted)}
              className="p-1.5 rounded-full text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-white/60 dark:bg-white/[0.05] border border-white/20 transition-all cursor-pointer text-xs backdrop-blur-md"
              title={isVideoMuted ? '取消静音' : '静音'}
            >
              {isVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </header>
      )}

      {/* ================= 3. 核心主画布（物理绝对居中，解耦抽屉） ================= */}
      <div className="relative z-10 flex-1 flex flex-col w-full min-h-0 overflow-hidden">
        <section
          role="region"
          aria-label="Hayden AI 对话交互中枢"
          ref={mainScrollContainerRef}
          onScroll={handleContainerScroll}
          className="relative flex-1 flex flex-col h-full min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto scrollbar-thin scroll-pt-28"
        >
          {/* ================= A. 首屏极简黄金比例居中状态 ================= */}
          <AnimatePresence mode="wait">
            {!hasMessages && (
              <motion.div
                key="hero-view"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40, filter: 'blur(8px)', transition: { duration: 0.35, ease: 'easeInOut' } }}
                className="flex-1 flex flex-col items-center justify-center w-full my-auto py-2 sm:py-3 lg:py-6"
              >
                {/* 居中核心 BrandLogo 与大标题水平排布 (左右分布，与开场动画丝滑对应定格，无多余中文副标) */}
                <motion.div
                  initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-center gap-3 sm:gap-4.5 mb-5 sm:mb-6 lg:mb-8 select-none"
                >
                  <div className="shrink-0 flex items-center justify-center text-slate-900 dark:text-white">
                    <BrandLogo
                      size={44}
                      variant="monochrome"
                      animated={false}
                      glow={false}
                      className="text-slate-900 dark:text-white"
                    />
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-slate-900 dark:text-white drop-shadow-sm selection:text-blue-500 font-serif">
                    {displayTitle}
                  </h1>
                </motion.div>

                {/* 高透光液态玻璃输入胶囊 (Liquid Glass Translucent Capsule - max-w-3xl) */}
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.97, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.15, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-3xl relative group"
                >
                  {/* 外层高光发光环 */}
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 opacity-30 group-hover:opacity-100 group-focus-within:opacity-100 blur-xl transition-all duration-700 pointer-events-none" />

                  {/* 液态玻璃主体 */}
                  <div className="relative rounded-3xl p-4 sm:p-5 lg:p-6 bg-white/75 dark:bg-[#0c0e18]/70 backdrop-blur-2xl sm:backdrop-blur-3xl saturate-180 border border-slate-200/90 dark:border-white/[0.18] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_20px_50px_-10px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.2),0_24px_60px_-15px_rgba(0,0,0,0.7)] transition-all duration-300 focus-within:border-blue-400/80 dark:focus-within:border-blue-400/70 focus-within:ring-4 focus-within:ring-blue-500/15">
                    
                    {/* 顶部镜面菲涅尔反射弧线 */}
                    <div className="absolute inset-x-10 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/40 to-transparent pointer-events-none rounded-t-3xl" />
                    {/* 微透镜漫反射渐变 */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.12] via-transparent to-black/[0.04] dark:from-white/[0.04] dark:to-transparent pointer-events-none" />

                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleTextareaKeyDown}
                      placeholder={input ? '' : (placeholderText ? `${placeholderText}` : displayPlaceholder)}
                      rows={2}
                      className="w-full bg-transparent text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 text-sm sm:text-base md:text-lg resize-none outline-none leading-relaxed selection:bg-blue-500/30"
                    />

                    {/* 控制条底部操作按钮 (DeepThink / Search / 向上圆纽按键) */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50 dark:border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        {/* DeepThink 开关 */}
                        <button
                          type="button"
                          onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            deepThinkEnabled
                              ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/50 shadow-sm shadow-blue-500/10'
                              : 'bg-white/50 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 border border-white/20'
                          }`}
                        >
                          <Atom className={`w-3.5 h-3.5 ${deepThinkEnabled ? 'animate-spin-slow text-blue-500' : ''}`} />
                          <span>DeepThink</span>
                        </button>

                        {/* Search 站内知识库检索开关 */}
                        <button
                          type="button"
                          onClick={() => setSearchEnabled(!searchEnabled)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            searchEnabled
                              ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/10'
                              : 'bg-white/50 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 border border-white/20'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Search</span>
                        </button>
                      </div>

                      {/* 向上发送箭头圆形按键 / 停止按钮 */}
                      {isStreaming ? (
                        <button
                          type="button"
                          onClick={handleStopGeneration}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="停止生成"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>停止</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSend()}
                          disabled={!input.trim()}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            input.trim()
                              ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-lg shadow-blue-500/30 cursor-pointer'
                              : 'bg-blue-500/25 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* 快捷推荐提示词胶囊 */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-full max-w-3xl mt-4 sm:mt-5 lg:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
                >
                  {DEFAULT_PRESET_PROMPTS.map((topic, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(topic.prompt)}
                      className="group flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-white/60 dark:bg-white/[0.04] hover:bg-white/95 dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.1] hover:border-blue-400/50 dark:hover:border-blue-400/50 shadow-xs hover:shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95"
                    >
                      <span className="transition-transform group-hover:scale-110">{topic.icon}</span>
                      <span className="font-medium">{topic.label}</span>
                    </button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= B. 对话进行时的多轮推演流 (Messages Stream) ================= */}
          {hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex-1 w-full pt-24 sm:pt-28 pb-40 space-y-7"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full space-y-3"
                >
                  {msg.role === 'user' ? (
                    /* 用户提问气泡：高透蔚蓝液态晶体 */
                    <div className="flex justify-end">
                      <div className="relative max-w-[85%] px-5 py-3.5 rounded-3xl bg-blue-600/80 dark:bg-blue-600/40 text-white shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_12px_28px_rgba(37,99,235,0.25)] backdrop-blur-2xl sm:backdrop-blur-3xl saturate-180 border border-blue-400/50 dark:border-blue-400/30 text-base leading-relaxed selection:bg-white/20 overflow-hidden">
                        {/* 菲涅尔顶边高光 */}
                        <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
                        <div className="relative z-10 whitespace-pre-wrap break-words">{msg.content}</div>
                      </div>
                    </div>
                  ) : (
                    /* 助手回复卡片：液态玻璃容器 */
                    <div className="flex flex-col space-y-4">
                      {/* DeepThink 深度思考过程折叠器 */}
                      {msg.reasoning && (
                        <div className="relative rounded-2xl overflow-hidden border border-white/60 dark:border-white/[0.12] bg-white/50 dark:bg-[#0c0e17]/50 backdrop-blur-2xl saturate-150 text-xs shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_6px_20px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_25px_rgba(0,0,0,0.4)]">
                          {/* 顶边高光 */}
                          <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/25 to-transparent pointer-events-none" />
                          <button
                            type="button"
                            onClick={() => handleToggleThinking(msg.id)}
                            className="w-full px-4 py-2.5 flex items-center justify-between text-slate-700 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-blue-500 animate-pulse" />
                              <span className="font-semibold">
                                {isStreaming && !msg.content ? '正在深度推演思考链...' : '已完成深度推演'}
                              </span>
                              {msg.thinkingTimeMs && (
                                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                                  ({msg.thinkingTimeMs}s)
                                </span>
                              )}
                            </div>
                            {msg.isThinkingOpen ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {msg.isThinkingOpen && (
                            <div className="px-4 pb-3.5 pt-1.5 text-slate-600 dark:text-neutral-300 font-mono text-[11px] sm:text-xs leading-relaxed border-t border-slate-200/50 dark:border-white/[0.06] whitespace-pre-wrap bg-slate-50/30 dark:bg-black/20">
                              {msg.reasoning}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 正文文本渲染卡片：液态玻璃容器 */}
                      <div className="relative rounded-3xl p-5 sm:p-6 bg-white/60 dark:bg-[#0c0e17]/55 backdrop-blur-2xl sm:backdrop-blur-3xl saturate-180 border border-white/70 dark:border-white/[0.14] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_12px_36px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15),0_16px_40px_rgba(0,0,0,0.55)] transition-all overflow-hidden">
                        {/* 顶边镜面菲涅尔反射光晕 */}
                        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/35 to-transparent pointer-events-none" />
                        {/* 内部微漫反射 */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.12] via-transparent to-black/[0.02] dark:from-white/[0.03] dark:to-transparent pointer-events-none" />
                        <div className="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed font-normal relative z-10">
                          {msg.content ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ node, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const codeString = String(children).replace(/\n$/, '');
                                  return match ? (
                                    <CodeBlock language={match[1]} value={codeString} />
                                  ) : (
                                    <code
                                      className="px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-white/10 font-mono text-xs text-blue-600 dark:text-blue-400"
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            isStreaming && (
                              <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-sm py-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                <span>思考就绪，正在组织回答...</span>
                              </div>
                            )
                          )}
                        </div>

                        {/* 站内真实知识溯源引证 (Garden Citations) */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-white/[0.06] space-y-2.5 relative z-10">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-400">
                              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                              <span>站内引证文献 (Garden Citations)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.citations.map((cite, idx) => (
                                <Link
                                  key={idx}
                                  href={cite.url || `/blog/${cite.slug}`}
                                  target="_blank"
                                  className="group flex flex-col p-3 rounded-xl border border-white/40 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] hover:bg-white/80 dark:hover:bg-white/[0.06] hover:border-blue-500/40 transition-all shadow-xs"
                                >
                                  <div className="flex items-center justify-between text-xs font-medium text-slate-800 dark:text-neutral-200 group-hover:text-blue-500 transition-colors">
                                    <span className="truncate">{cite.title}</span>
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0" />
                                  </div>
                                  {cite.excerpt && (
                                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-2 mt-1">
                                      {cite.excerpt}
                                    </p>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 底部小工具条（复制答案 / 导出） */}
                        {msg.content && !isStreaming && (
                          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/40 dark:border-white/[0.04] relative z-10">
                            <button
                              type="button"
                              onClick={() => copyMessageContent(msg.id, msg.content)}
                              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === msg.id ? '已复制' : '复制全文'}</span>
                            </button>
                            <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                              Hayden AI · DeepThink
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </section>
      </div>

      {/* ================= 4. 对话进行时的底部悬浮液态玻璃输入框 (Smooth Spring Docked) ================= */}
      <AnimatePresence>
        {hasMessages && (
          <motion.div
            key="docked-input"
            initial={{ opacity: 0, y: 50, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed bottom-4 left-0 right-0 z-30 px-4 pointer-events-none"
          >
            <div className="max-w-4xl mx-auto w-full pointer-events-auto">
              <div className="relative rounded-2xl sm:rounded-3xl p-3.5 bg-white/65 dark:bg-[#0d1017]/65 backdrop-blur-2xl sm:backdrop-blur-3xl saturate-180 border border-white/70 dark:border-white/[0.16] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_18px_45px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.7)] transition-all focus-within:border-blue-400/70 focus-within:ring-4 focus-within:ring-blue-500/15">
                
                {/* 顶部镜面菲涅尔反射弧线 */}
                <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/40 to-transparent pointer-events-none rounded-t-2xl" />

                <textarea
                  ref={bottomTextareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder={isStreaming ? 'AI 正在推演回答...' : '追问或探讨更多技术细节... (Enter 发送)'}
                  rows={1}
                  className="w-full bg-transparent text-slate-900 dark:text-neutral-100 placeholder-slate-500 dark:placeholder-neutral-400 text-sm sm:text-base resize-none outline-none leading-relaxed max-h-32 selection:bg-blue-500/30"
                />

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/50 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                        deepThinkEnabled
                          ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/50 shadow-xs'
                          : 'bg-white/40 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 hover:text-slate-900 border border-white/20'
                      }`}
                    >
                      <Atom className="w-3 h-3" />
                      <span>DeepThink</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSearchEnabled(!searchEnabled)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                        searchEnabled
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-400/50 shadow-xs'
                          : 'bg-white/40 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 hover:text-slate-900 border border-white/20'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>Search</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isStreaming ? (
                      <button
                        type="button"
                        onClick={handleStopGeneration}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="停止生成"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>停止</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSend()}
                        disabled={!input.trim()}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          input.trim()
                            ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-500/30 cursor-pointer'
                            : 'bg-blue-500/20 text-white/40 cursor-not-allowed'
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ================= 4. 左下角悬浮会话档案胶囊按钮 (Bottom-Left Capsule Trigger) ================= */}
      <div className="fixed bottom-5 left-4 sm:left-6 z-40">
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className={`group relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-2xl sm:backdrop-blur-3xl saturate-180 transition-all duration-300 cursor-pointer shadow-lg active:scale-95 border ${
            isSidebarOpen
              ? 'bg-blue-600 text-white shadow-blue-500/35 border-blue-400/60 ring-2 ring-blue-400/30'
              : 'bg-white/75 dark:bg-[#0c0f1d]/75 hover:bg-white/90 dark:hover:bg-[#121629]/90 text-slate-700 dark:text-neutral-200 border-white/80 dark:border-white/[0.16] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7),0_10px_25px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_30px_rgba(0,0,0,0.6)] hover:border-blue-400/50'
          }`}
          title={isSidebarOpen ? '收起会话档案 (Cmd+Shift+O)' : '查看会话档案 (Cmd+Shift+O)'}
        >
          {/* 胶囊顶部微反射高光 */}
          <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/40 to-transparent pointer-events-none rounded-t-full" />
          <Clock className={`w-3.5 h-3.5 transition-transform duration-300 ${isSidebarOpen ? 'text-white rotate-12' : 'text-blue-500 dark:text-blue-400 group-hover:rotate-12'}`} />
          <span className="tracking-tight">会话档案</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold transition-colors ${
            isSidebarOpen
              ? 'bg-white/25 text-white'
              : 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/15'
          }`}>
            {sessions.length}
          </span>
        </button>
      </div>
    </div>
  );
}
