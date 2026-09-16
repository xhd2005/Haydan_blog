'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
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
  Camera,
  MapPin
} from 'lucide-react';
import type { CitationItem, ToolStatus, ExtendedAiChatMessage } from '@/components/ai/AiAssistantModal';

interface ToolCallStep extends ToolStatus {
  at: number;
}

interface CenterMessage extends ExtendedAiChatMessage {
  toolCalls?: ToolCallStep[];
}

const PRESET_TOPICS = [
  {
    icon: '⚡',
    title: '全栈架构哲学',
    desc: '了解高并发、虚拟线程与微前端',
    prompt: '请用第一人称介绍一下你（Hayden Xue）构建这个数字花园的全栈系统架构选型与工程考量。',
  },
  {
    icon: '🌍',
    title: '足迹与地理探索',
    desc: '川西高原、高山徒步与城市漫游',
    prompt: 'Hayden，分享一下你在川西高原徒步或旅途中最难忘的一次摄影经历与感悟。',
  },
  {
    icon: '☕',
    title: '数字避难所初心',
    desc: '独立精神与长期主义建站观',
    prompt: '在这个快节奏时代，你为什么坚持打造这样一个高度自主、纯粹真实的数字花园？',
  },
];

export function NeuralDigitalTwin() {
  const router = useRouter();
  const { locale } = useI18n();
  const isEn = locale === 'en';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [aiModel, setAiModel] = useState('DeepSeek-V4-Flash');
  const [messages, setMessages] = useState<CenterMessage[]>([
    {
      role: 'assistant',
      content: isEn
        ? "Greetings! I am Hayden Xue's AI Digital Twin & Neural Memory Core. I am connected directly to Hayden's full-stack architecture, travel journals, and aesthetic philosophy. Ask me anything about my work, expeditions, or design creed."
        : '你好！我是站长 Hayden Xue 的 **AI 数字心智分身与 3D 记忆核心**。\n\n我已经同步融合了全站高并发架构笔记、旅行足迹与摄影手记。无论是探讨底层工程演进、探寻高山徒步心得，还是交流独立造物哲学，我都以第一人称随时与你真诚对谈。✨',
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. 获取后端 AI 状态
  useEffect(() => {
    api.getAiStatus()
      .then((status) => {
        if (status?.model) setAiModel(status.model);
      })
      .catch(() => {});
  }, []);

  // 2. 自动滚动消息流
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // 3. 发送消息
  const handleSend = (presetText?: string) => {
    const text = (presetText ?? input).trim();
    if (!text || isStreaming) return;
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
              last.toolCalls = currentTools;
              updated[updated.length - 1] = last;
              return updated;
            });
          }
        } else {
          setMessages((prev) => {
            const updated = [...prev];
            const last = { ...updated[updated.length - 1] };
            last.content += chunk;
            updated[updated.length - 1] = last;
            return updated;
          });
        }
      },
      () => {
        setIsStreaming(false);
      },
      (error: any) => {
        setIsStreaming(false);
      }
    );
  };

  // 4. 重置对谈
  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: isEn
          ? "Memory core refreshed. What would you like to explore next about Hayden's world?"
          : '神经记忆核心已复位。关于我的技术栈、旅行足迹或数字花园，你还想探索什么？',
      },
    ]);
  };

  // 5. Three.js 3D 悬浮神经元多面体核心
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 180);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 中心悬浮多面体
    const coreGroup = new THREE.Group();

    // 内核发光水晶球
    const innerGeo = new THREE.IcosahedronGeometry(18, 3);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // 外层量子纠缠网格
    const outerGeo = new THREE.IcosahedronGeometry(26, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    coreGroup.add(outerMesh);

    // 三大记忆神经星环
    const ring1Geo = new THREE.RingGeometry(38, 39, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ring2Geo = new THREE.RingGeometry(48, 49, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    coreGroup.add(ring2);

    scene.add(coreGroup);

    // 环绕光尘微粒
    const particleCount = 400;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 30 + Math.random() * 60;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.random() * Math.PI;
      pPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pPos[i * 3 + 2] = r * Math.cos(ph);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 1.5,
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(pGeo, pMat);
    coreGroup.add(particles);

    // 动画循环
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // 旋转与脉冲速度根据是否处于思考/流式回答中调整
      const spinSpeed = isStreaming ? 1.8 : 0.6;
      coreGroup.rotation.y = elapsed * 0.12 * spinSpeed;
      coreGroup.rotation.x = Math.sin(elapsed * 0.2) * 0.2;

      innerMesh.rotation.y = -elapsed * 0.2 * spinSpeed;
      outerMesh.rotation.z = elapsed * 0.15 * spinSpeed;

      const pulse = 1 + Math.sin(elapsed * (isStreaming ? 4 : 1.5)) * 0.05;
      innerMesh.scale.set(pulse, pulse, pulse);

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      pGeo.dispose();
      pMat.dispose();
    };
  }, [isStreaming]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[100svh] relative overflow-hidden bg-[#040509] text-slate-200 select-none flex flex-col justify-between pt-20 pb-4 px-4 sm:px-8"
    >
      {/* 3D 悬浮神经元光核背景层 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none -z-0 opacity-60 sm:opacity-80"
      />

      {/* 顶部 HUD 驾驶舱面板 */}
      <header className="flex items-center justify-between pointer-events-auto bg-neutral-900/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-white flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>NEURAL DIGITAL TWIN</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                1536D RAG
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              HAYDEN XUE MEMORY CORE // MODEL: {aiModel}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-xs font-mono"
            title="复位对话神经核"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">复位记忆</span>
          </button>
        </div>
      </header>

      {/* 中央主对话与投影终端容器 */}
      <div className="flex-1 w-full max-w-4xl mx-auto my-3 flex flex-col justify-between min-h-0 relative z-20">
        {/* 对话消息滚动流 */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 sm:pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-lg mt-1">
                  <Bot className="w-4 h-4 text-cyan-300" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed shadow-xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-neutral-900/90 backdrop-blur-2xl border border-white/15 text-slate-200 rounded-tl-xs'
                }`}
              >
                {/* Markdown 渲染 */}
                <div className="prose prose-invert prose-sm max-w-none break-words">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* 智能意图识别：快捷跳转站内实体 */}
                {msg.role === 'assistant' && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 mt-2 border-t border-white/10 text-[11px] font-mono">
                    <button
                      onClick={() => router.push('/blog')}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-400/30 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>查看技术博客</span>
                    </button>
                    <button
                      onClick={() => router.push('/journey')}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-400/30 transition-colors"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>足迹航线剧场</span>
                    </button>
                    <button
                      onClick={() => router.push('/memos')}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-rose-300 border border-rose-400/30 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      <span>暗房胶片随记</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-500/30 border border-blue-400/50 flex items-center justify-center shrink-0 shadow-lg mt-1">
                  <User className="w-4 h-4 text-blue-300" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 pl-11">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>神经突触激发中，正在生成第一人称心智切片...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 启发式引导提问词 (Preset Topics) */}
        {messages.length <= 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-3">
            {PRESET_TOPICS.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSend(item.prompt)}
                className="p-3 rounded-2xl bg-neutral-900/80 backdrop-blur-xl border border-white/10 hover:border-cyan-400/50 hover:bg-neutral-800/80 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 pt-1 font-sans">
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* 底部神经指令输入栏 */}
        <div className="pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-2xl p-2 rounded-2xl border border-white/20 shadow-2xl focus-within:border-cyan-400/60 transition-colors"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isEn ? "Ask Hayden's digital twin anything..." : "向 Hayden Xue 的数字分身提问..."}
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-mono font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all shrink-0 shadow-lg shadow-cyan-500/25"
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
      </div>

      {/* 底部 HUD 状态条 */}
      <footer className="flex items-center justify-between pointer-events-auto bg-neutral-900/80 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/10 text-xs font-mono text-slate-400 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>HAYDEN XUE MEMORY SPACE // 1ST-PERSON COPILOT</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span>GROUNDED IN REAL BLOG & JOURNEY DATA</span>
          <span className="text-slate-600">•</span>
          <span>AUTONOMOUS AGENT</span>
        </div>
      </footer>
    </div>
  );
}
