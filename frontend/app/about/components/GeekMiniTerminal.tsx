'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Terminal as TerminalIcon, 
  Sparkles, 
  CornerDownLeft, 
  Sun, 
  Moon, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Trash2,
  ExternalLink,
  Code2,
  Cpu,
  Compass,
  Activity
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/lib/toast';

interface OutputLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  content: React.ReactNode;
}

const AVAILABLE_COMMANDS = [
  'help',
  'neofetch',
  'matrix',
  'curl now',
  'skills',
  'stack',
  'journey',
  'philosophy',
  'ls',
  'cat manifesto.md',
  'sudo hire-hayden',
  'contact',
  'theme',
  'date',
  'clear',
];

export function GeekMiniTerminal() {
  const { locale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const terminalBodyRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const WELCOME_OUTPUT: OutputLine[] = useMemo(() => [
    {
      id: 'banner',
      type: 'system',
      content: (
        <pre className="font-mono text-[10px] sm:text-xs text-emerald-400 font-bold leading-tight select-none">
{`  _   _             _             __   __          
 | | | | __ _ _   _| | _____ _ __ \\ \\ / /   _  ___ 
 | |_| |/ _\` | | | | |/ / _ \\ '_ \\ \\ V / | | |/ _ \\
 |  _  | (_| | |_| |   <  __/ | | | | || |_| |  __/
 |_| |_|\\__,_|\\__, |_|\\_\\___|_| |_| |_| \\__,_|\\___|
              |___/                                `}
        </pre>
      ),
    },
    {
      id: 'welcome-msg',
      type: 'output',
      content: (
        <div className="space-y-1.5 text-xs text-zinc-300 font-mono">
          <p>
            Welcome to <span className="text-emerald-400 font-semibold">Hayden Xue&apos;s Geek Terminal Deck</span> (v2.6.0-pro).
          </p>
          <p className="text-zinc-400">
            {locale === 'zh'
              ? '输入 "help" 或点击下方快捷芯片执行指令；支持 "neofetch"、"matrix"、"curl now" 与 "sudo hire-hayden"。'
              : 'Type "help" or click quick chips below; supports "neofetch", "matrix", "curl now", and "sudo hire-hayden".'}
          </p>
        </div>
      ),
    },
  ], [locale]);

  const [outputs, setOutputs] = useState<OutputLine[]>(WELCOME_OUTPUT);

  // Auto scroll terminal body only (never scroll outer window or page on initial load)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [outputs]);

  const handleClear = () => {
    setOutputs([]);
    setInputVal('');
  };

  const handleCopyLogs = () => {
    const textToCopy = outputs
      .map((o) => {
        if (typeof o.content === 'string') return o.content;
        return '[Terminal Output Entry]';
      })
      .join('\n');
    navigator.clipboard.writeText(textToCopy || 'Hayden Xue Geek Terminal Deck v2.6.0');
    setCopied(true);
    toast.success(locale === 'en' ? 'Terminal session copied' : '终端日志已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    const newOutputs: OutputLine[] = [
      ...outputs,
      {
        id: `in-${Date.now()}-${Math.random()}`,
        type: 'input',
        content: trimmed,
      },
    ];

    const args = trimmed.split(' ');
    const command = args[0].toLowerCase();
    const subCommand = args.slice(1).join(' ').toLowerCase();

    switch (command) {
      case 'help': {
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          content: (
            <div className="space-y-1.5 text-xs font-mono text-zinc-300">
              <p className="text-emerald-400 font-bold mb-1">AVAILABLE COMMANDS // 核心指令集:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <div><span className="text-cyan-400 font-semibold">neofetch</span> : System & architect specs</div>
                <div><span className="text-cyan-400 font-semibold">matrix</span> : Digital stream rain</div>
                <div><span className="text-cyan-400 font-semibold">curl now</span> : Live stardate & pulse</div>
                <div><span className="text-cyan-400 font-semibold">skills / stack</span> : Full-stack radar</div>
                <div><span className="text-cyan-400 font-semibold">journey</span> : World footprints & coords</div>
                <div><span className="text-cyan-400 font-semibold">philosophy</span> : First principles axioms</div>
                <div><span className="text-cyan-400 font-semibold">ls</span> : List virtual directories</div>
                <div><span className="text-cyan-400 font-semibold">cat &lt;file&gt;</span> : Read virtual file</div>
                <div><span className="text-cyan-400 font-semibold">sudo hire-hayden</span> : Recruiter Easter Egg</div>
                <div><span className="text-cyan-400 font-semibold">contact</span> : Verified channels</div>
                <div><span className="text-cyan-400 font-semibold">theme</span> : Switch site theme</div>
                <div><span className="text-cyan-400 font-semibold">clear</span> : Clear terminal screen</div>
              </div>
            </div>
          ),
        });
        break;
      }

      case 'neofetch':
      case 'sysinfo': {
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          content: (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs font-mono py-1">
              <div className="sm:col-span-4 text-emerald-400 font-bold select-none leading-tight text-[11px]">
{`   ██╗  ██╗██╗   ██╗
   ██║  ██║╚██╗ ██╔╝
   ███████║ ╚████╔╝ 
   ██╔══██║  ╚██╔╝  
   ██║  ██║   ██║   
   ╚═╝  ╚═╝   ╚═╝   
 Hayden Xue OS 2.6`}
              </div>
              <div className="sm:col-span-8 space-y-1 text-zinc-300">
                <div className="font-bold text-emerald-400">hayden@voyager-node</div>
                <div className="text-zinc-500">----------------------</div>
                <div><span className="text-cyan-400 font-semibold">OS</span>: HaydenOS 2.6 LTS (x86_64 / aarch64)</div>
                <div><span className="text-cyan-400 font-semibold">Host</span>: Distributed High-Concurrency Edge</div>
                <div><span className="text-cyan-400 font-semibold">Kernel</span>: 6.8.0-hayden-virtual-threads</div>
                <div><span className="text-cyan-400 font-semibold">Uptime</span>: 2018 ~ 2026 (8 years craftsmanship)</div>
                <div><span className="text-cyan-400 font-semibold">Shell</span>: zsh 5.9 (hayden-terminal-deck)</div>
                <div><span className="text-cyan-400 font-semibold">Architecture</span>: Java 21 / Spring Boot 3 / Next.js 14</div>
                <div><span className="text-cyan-400 font-semibold">Memory</span>: 64GB Unified / 256GB ECC Distributed</div>
                <div className="pt-1 flex gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                  <span className="w-3 h-3 rounded bg-teal-500 inline-block" />
                  <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
                  <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
                  <span className="w-3 h-3 rounded bg-indigo-500 inline-block" />
                  <span className="w-3 h-3 rounded bg-violet-500 inline-block" />
                </div>
              </div>
            </div>
          ),
        });
        break;
      }

      case 'matrix': {
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          content: (
            <div className="p-3 rounded-xl bg-black/80 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono leading-relaxed space-y-1">
              <div className="flex items-center justify-between text-emerald-300 font-bold border-b border-emerald-900/60 pb-1">
                <span>MATRIX DIGITAL STREAM [CONNECTED]</span>
                <span className="animate-pulse">STREAMING 60FPS</span>
              </div>
              <p className="opacity-90">01001000 01100001 01111001 01100100 01100101 01101110 (HAYDEN)</p>
              <p className="text-emerald-300">01011000 01110101 01100101 (XUE) // CONCURRENCY: 1,000,000 QPS</p>
              <p className="opacity-80">01010110 01101001 01110010 01110100 01110101 01100001 01101100 (VIRTUAL THREADS)</p>
              <p className="text-teal-300">01010010 01100001 01100110 01110100 (RAFT CONSENSUS) == OK</p>
            </div>
          ),
        });
        break;
      }

      case 'curl': {
        if (subCommand === 'now' || subCommand === '/api/now') {
          newOutputs.push({
            id: `out-${Date.now()}`,
            type: 'output',
            content: (
              <pre className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 text-cyan-300 text-[11px] leading-relaxed overflow-x-auto">
{`{
  "status": 200,
  "architect": "Hayden Xue",
  "livingPulse": "ONLINE",
  "coordinates": "30°39'N 104°04'E (川西前哨)",
  "timezone": "Asia/Shanghai (UTC+8)",
  "currentFocus": "Crafting High-Performance Distributed Systems & Agentic AI",
  "heartbeatRate": "68 bpm",
  "systemHealth": "99.999% SLA Optimal"
}`}
              </pre>
            ),
          });
        } else {
          newOutputs.push({
            id: `out-${Date.now()}`,
            type: 'output',
            content: (
              <div className="text-zinc-400 text-xs font-mono">
                curl: try <span className="text-cyan-400">curl now</span> to inspect real-time stardate telemetry.
              </div>
            ),
          });
        }
        break;
      }

      case 'ls': {
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          content: (
            <div className="text-xs font-mono flex flex-wrap gap-4 text-zinc-300">
              <span className="text-sky-400 font-bold">drwxr-xr-x projects/</span>
              <span className="text-sky-400 font-bold">drwxr-xr-x journeys/</span>
              <span className="text-emerald-400 font-bold">-rw-r--r-- manifesto.md</span>
              <span className="text-emerald-400 font-bold">-rw-r--r-- tech-stack.json</span>
              <span className="text-purple-400 font-bold">-rwxr-xr-x hire-hayden.sh*</span>
            </div>
          ),
        });
        break;
      }

      case 'cat': {
        if (subCommand.includes('manifesto')) {
          newOutputs.push({
            id: `out-${Date.now()}`,
            type: 'output',
            content: (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs font-mono space-y-2 text-zinc-200">
                <div className="text-emerald-400 font-bold"># HAYDEN XUE FIRST-PRINCIPLES MANIFESTO</div>
                <p>1. 在代码中雕琢高并发秩序，在自然旷野中校准生命心智。</p>
                <p>2. 以最清澈的架构抽象承载高熵世界的复杂涌现。</p>
                <p>3. 敬畏每一微秒的 CPU 调度与每一字节的堆内存分配。</p>
              </div>
            ),
          });
        } else if (subCommand.includes('stack')) {
          newOutputs.push({
            id: `out-${Date.now()}`,
            type: 'output',
            content: (
              <pre className="text-[11px] text-emerald-300 bg-black/50 p-3 rounded-xl border border-emerald-900/60">
{`{
  "core": ["Java 21", "Spring Boot 3", "Go", "Raft", "Netty"],
  "frontend": ["Next.js 14", "React 18", "Three.js", "Tailwind CSS"],
  "ai": ["SenseNova", "DeepSeek", "Agentic Workflows", "RAG"],
  "storage": ["MinIO", "PostgreSQL", "Redis 7", "Kafka"]
}`}
              </pre>
            ),
          });
        } else {
          newOutputs.push({
            id: `out-${Date.now()}`,
            type: 'error',
            content: `cat: ${args[1] || 'file'}: No such file. Try "cat manifesto.md" or "cat tech-stack.json".`,
          });
        }
        break;
      }

      case 'skills':
      case 'stack': {
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          content: (
            <div className="space-y-1.5 text-xs font-mono text-zinc-300">
              <p className="text-emerald-400 font-bold">CORE ENGINEERING RADAR [2026]:</p>
              <div className="space-y-1 text-[11px]">
                <div>Java 21 / Spring Boot 3  <span className="text-emerald-400">[====================]</span> 96%</div>
                <div>TypeScript / Next.js 14  <span className="text-emerald-400">[====================]</span> 95%</div>
                <div>High-Concurrency & Raft  <span className="text-emerald-400">[=================== ]</span> 94%</div>
                <div>Three.js / WebGL Spatial <span className="text-teal-400">[==================  ]</span> 88%</div>
                <div>Agentic AI Workflows     <span className="text-cyan-400">[==================  ]</span> 90%</div>
                <div>PostgreSQL / Redis / MinIO<span className="text-indigo-400">[=================== ]</span> 93%</div>
              </div>
            </div>
          ),
        });
        break;
      }

      case 'philosophy': {
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          content: (
            <div className="space-y-1.5 text-xs font-mono text-zinc-300">
              <p className="text-emerald-400 font-bold">HAYDEN&apos;S PHILOSOPHY & MENTAL MODELS:</p>
              <div className="space-y-1 text-[11px]">
                <div><span className="text-cyan-400">[01. ANTIENTROPY]</span> 思想若不修剪便会荒芜；公开记录是最好的认知灌溉。</div>
                <div><span className="text-cyan-400">[02. FIRST PRINCIPLES]</span> 穿透流行迷雾，在不确定性中构建确定性系统。</div>
                <div><span className="text-cyan-400">[03. TECH & HUMANITY]</span> 技术是坚硬骨骼，人文与审美是流动的血液。</div>
                <div><span className="text-cyan-400">[04. PRAXIS]</span> 不做旁观的挑剔评论家，做躬身入局的工匠建造者。</div>
              </div>
            </div>
          ),
        });
        break;
      }

      case 'journey': {
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          content: (
            <div className="space-y-1.5 text-xs font-mono text-zinc-300">
              <p className="text-emerald-400 font-bold">HUMANISTIC FOOTPRINTS & COORDINATES:</p>
              <div className="space-y-1 text-[11px]">
                <div><span className="text-emerald-400">● SICHUAN EXPEDITION</span>: Mt. Gongga [4,768m pass, Western Sichuan]</div>
                <div><span className="text-cyan-400">● EXPLORED</span>: Shanghai, Beijing, Chengdu, Shenzhen, Hong Kong, Tokyo, Kyoto...</div>
                <div className="text-zinc-400">All footprints are 100% bound with real database archives. Check the Wilderness Act above.</div>
              </div>
            </div>
          ),
        });
        break;
      }

      case 'sudo': {
        if (subCommand === 'hire-hayden') {
          newOutputs.push({
            id: `out-${Date.now()}`,
            type: 'success',
            content: (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>[SUDO AUTHORIZATION GRANTED :: RECRUITER PORTAL]</span>
                </div>
                <p className="text-zinc-200">
                  🎉 Welcome! <span className="font-semibold text-white">Hayden Xue</span> is open to high-impact technical collaboration:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300 text-[11px]">
                  <li>Senior Full-Stack Architect / Distributed Tech Lead Roles</li>
                  <li>Agentic AI Workflows & High-Concurrency Systems</li>
                  <li>Open Source Engineering & Digital Garden Co-creation</li>
                </ul>
                <div className="pt-2 text-emerald-300 flex flex-wrap items-center gap-4 text-xs">
                  <span>📬 Email: <a href="mailto:haydenxue@example.com" className="underline hover:text-white font-bold">haydenxue@example.com</a></span>
                  <span>🐙 GitHub: <a href="https://github.com/xhd2005" target="_blank" rel="noreferrer" className="underline hover:text-white font-bold">@xhd2005</a></span>
                </div>
              </div>
            ),
          });
        } else {
          newOutputs.push({
            id: `out-${Date.now()}`,
            type: 'error',
            content: `sudo: unknown command "${subCommand}". Did you mean "sudo hire-hayden"?`,
          });
        }
        break;
      }

      case 'contact': {
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          content: (
            <div className="space-y-1 text-xs font-mono text-zinc-300">
              <p className="text-emerald-400 font-bold">VERIFIED CHANNELS // HAYDEN XUE:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                <div>• GitHub: <a href="https://github.com/xhd2005" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">@xhd2005</a></div>
                <div>• Email: <a href="mailto:haydenxue@example.com" className="text-cyan-400 hover:underline">haydenxue@example.com</a></div>
                <div>• Digital Garden: <span className="text-cyan-400">Hayden Xue Flagship Blog 2.0</span></div>
                <div>• Location: <span className="text-cyan-400">30°39&apos;N 104°04&apos;E (Chengdu)</span></div>
              </div>
            </div>
          ),
        });
        break;
      }

      case 'theme': {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          content: `Theme toggled to [${nextTheme.toUpperCase()}].`,
        });
        break;
      }

      case 'date': {
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          content: new Date().toISOString() + ' (UTC)',
        });
        break;
      }

      case 'clear': {
        setOutputs([]);
        setInputVal('');
        return;
      }

      default: {
        newOutputs.push({
          id: `out-${Date.now()}`,
          type: 'error',
          content: `Command not found: "${command}". Type "help" for a list of available commands.`,
        });
        break;
      }
    }

    setOutputs(newOutputs);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (history.length > 0 && historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx >= history.length) {
          setHistoryIdx(-1);
          setInputVal('');
        } else {
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const current = inputVal.trim().toLowerCase();
      if (!current) return;
      const match = AVAILABLE_COMMANDS.find((cmd) => cmd.startsWith(current));
      if (match) {
        setInputVal(match);
      }
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/[0.12] dark:border-emerald-500/30 bg-[#0c0d14] text-slate-100 shadow-2xl font-mono transition-all duration-300 ${
      isExpanded ? 'min-h-[580px]' : ''
    }`}>
      {/* ================= macOS 拟真窗口顶栏 ================= */}
      <div className="border-b border-white/[0.08] px-4 py-3 bg-[#11121c] flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          {/* macOS 3 交通灯交互按钮 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              title="清屏 (Clear)"
              className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-400 border border-rose-600 transition-colors flex items-center justify-center text-[8px] text-rose-950 opacity-90 group"
            >
              <span className="opacity-0 group-hover:opacity-100">✕</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              title="复位会话"
              className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-400 border border-amber-600 transition-colors flex items-center justify-center text-[8px] text-amber-950 opacity-90 group"
            >
              <span className="opacity-0 group-hover:opacity-100">−</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? '标准高度' : '全高展开'}
              className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 border border-emerald-600 transition-colors flex items-center justify-center text-[8px] text-emerald-950 opacity-90 group"
            >
              <span className="opacity-0 group-hover:opacity-100">+</span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/[0.1] mx-0.5" />

          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>hayden@geek-deck: ~ (v2.6.0-pro)</span>
          </div>
        </div>

        {/* 顶栏工具胶囊 */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
          <button
            type="button"
            onClick={handleCopyLogs}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors"
            title={isExpanded ? '收缩' : '全高展开'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <span className="hidden md:flex items-center gap-1 text-emerald-400 text-[10px] pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* ================= 终端屏幕主体 ================= */}
      <div 
        ref={terminalBodyRef}
        className={`p-5 sm:p-6 space-y-3 overflow-y-auto cursor-text text-xs transition-all duration-300 ${
          isExpanded ? 'min-h-[440px] max-h-[640px]' : 'min-h-[280px] max-h-[400px]'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {outputs.map((item) => (
          <div key={item.id} className="leading-relaxed">
            {item.type === 'input' ? (
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-emerald-400 font-bold">visitor@hayden-garden:~$</span>
                <span>{item.content}</span>
              </div>
            ) : item.type === 'error' ? (
              <div className="text-rose-400">{item.content}</div>
            ) : item.type === 'success' ? (
              <div className="text-emerald-300">{item.content}</div>
            ) : (
              <div>{item.content}</div>
            )}
          </div>
        ))}

        {/* 当前活跃输入提示行 */}
        <div className="flex items-center gap-2 text-zinc-300 pt-1">
          <span className="text-emerald-400 font-bold shrink-0">visitor@hayden-garden:~$</span>
          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none text-emerald-300 font-mono text-xs pr-4"
              autoComplete="off"
              spellCheck="false"
              placeholder="Type command or click quick chips..."
            />
            <span className="w-2 h-4 bg-emerald-400 animate-pulse -ml-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ================= 快捷指令芯片栏 (Quick Command Chips) ================= */}
      <div className="border-t border-white/[0.08] px-4 py-3 bg-[#0e0f17] flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-zinc-500 font-bold mr-1 text-[10px] uppercase tracking-wider">
            {locale === 'zh' ? '快捷芯片:' : 'QUICK CHIPS:'}
          </span>
          {[
            { label: 'neofetch', cmd: 'neofetch' },
            { label: 'matrix', cmd: 'matrix' },
            { label: 'curl now', cmd: 'curl now' },
            { label: 'stack', cmd: 'stack' },
            { label: 'journey', cmd: 'journey' },
            { label: 'philosophy', cmd: 'philosophy' },
            { label: 'hire-hayden', cmd: 'sudo hire-hayden' },
            { label: 'clear', cmd: 'clear' },
          ].map((chip) => (
            <button
              key={chip.cmd}
              type="button"
              onClick={() => handleCommand(chip.cmd)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 border border-white/[0.08] hover:border-emerald-500/40 transition-all text-[11px] font-mono shadow-sm active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="text-zinc-500 text-[10px] hidden lg:block">
          Press <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-zinc-300">[Enter]</kbd> to run · <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-zinc-300">[Tab]</kbd> to complete
        </div>
      </div>
    </div>
  );
}
