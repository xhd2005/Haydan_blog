'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api';
import { clearAuthStorage } from '@/lib/storage-keys';
import { toast } from '@/lib/toast';
import { 
  Lock, 
  User as UserIcon, 
  Loader2, 
  ArrowRight, 
  ShieldAlert, 
  KeyRound, 
  RefreshCw, 
  Sun, 
  Moon, 
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Clock,
  BookOpen,
  Compass,
  Feather,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

/**
 * 漫游星尘微粒子背景 Canvas
 * 遵循 AGENTS.md 准则 3 & 4：提供动态视觉景深与优雅空间层次感，极低能耗
 */
function StarDustCanvas({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const count = 42;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -Math.random() * 0.28 - 0.06,
      size: Math.random() * 1.6 + 0.8,
      alpha: Math.random() * 0.45 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const colorRGB = isDark ? '52, 211, 153' : '16, 185, 129';
      const secColorRGB = isDark ? '56, 189, 248' : '100, 116, 139';

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.015;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const dynamicAlpha = Math.max(0.08, p.alpha * (0.6 + 0.4 * Math.sin(p.phase)));
        ctx.fillStyle = `rgba(${idx % 3 === 0 ? secColorRGB : colorRGB}, ${dynamicAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-60 dark:opacity-80 transition-opacity duration-700"
    />
  );
}

/**
 * 内容生态与创作沉淀面板 (StudioArchivePanel)
 * 摒弃中二的心电图与作战室词汇，转向踏实、优雅的创作者空间总览
 */
function StudioArchivePanel() {
  const [nodeTimeStr, setNodeTimeStr] = useState('18:00:00');
  const [uptimeDays, setUptimeDays] = useState(142);

  useEffect(() => {
    // 设定系统基准时间 (2026-04-26)
    const baseLaunchTimestamp = new Date('2026-04-26T00:00:00Z').getTime();

    const updateTime = () => {
      const now = Date.now();
      const diff = Math.max(0, now - baseLaunchTimestamp);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      setUptimeDays(days);

      const nowDate = new Date();
      const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setNodeTimeStr(timeFormatter.format(nowDate));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 pt-1 max-w-lg">
      {/* 顶部时钟与运行状态轻量状态条 */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-zinc-300">
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span>SHENZHEN · CST (UTC+8)</span>
          <span className="font-bold text-slate-900 dark:text-white tabular-nums">{nodeTimeStr}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>持续稳定运行 {uptimeDays} 天</span>
        </div>
      </div>

      {/* 4 个内容沉淀维度卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            title: '深度博文',
            enTitle: 'Longform Posts',
            desc: '技术洞见 · 工程沉淀 · 独立思考',
            icon: BookOpen,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
          },
          {
            title: '光影与漫游',
            enTitle: 'Photo & Journey',
            desc: '城市印记 · 旅途行迹 · 生活画幅',
            icon: Compass,
            color: 'text-teal-600 dark:text-teal-400',
            bg: 'bg-teal-500/10',
          },
          {
            title: '动态闪念',
            enTitle: 'Memos & Stream',
            desc: '即时灵感 · 碎片随想 · 日常记录',
            icon: Feather,
            color: 'text-cyan-600 dark:text-cyan-400',
            bg: 'bg-cyan-500/10',
          },
          {
            title: '全栈架构',
            enTitle: 'Architecture',
            desc: 'Next.js · Spring · MinIO · RAG',
            icon: Layers,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.07] backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/30 hover:bg-white/80 dark:hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{item.title}</h4>
                  <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">{item.enTitle}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* 底部架构技术轻量微胶囊标签 */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {[
          'Next.js 14 SSR',
          'Spring Boot 3 Core',
          'MinIO S3 Storage',
          'Qdrant Vector Engine',
        ].map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 px-2.5 py-1 rounded-lg bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.05]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // 验证码防刷状态 (保持原有连续输错 5 次触发安全锁机制)
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // 3D 鼠标视差 Tilt 与 Spotlight 状态
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  });
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, active: false });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 拉取最新图形验证码
  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const data = await api.getCaptcha();
      setCaptchaKey(data.captchaKey);
      setCaptchaImage(data.captchaImage || data.imageBase64);
      setCaptchaCode('');
    } catch (err: any) {
      console.error('拉取验证码失败:', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 检测当前 IP / 账号是否已被要求验证码
  const checkCaptchaStatus = async (userTarget?: string) => {
    try {
      const res = await api.getCaptchaStatus(userTarget);
      if (res?.captchaRequired) {
        setCaptchaRequired(true);
        await fetchCaptcha();
      }
    } catch {
      // 静默忽略
    }
  };

  useEffect(() => {
    checkCaptchaStatus();
  }, []);

  // 3D 视差 Tilt 鼠标移动处理
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const maxTilt = 6.5; // 最大倾斜角度
    const rotateX = -((mouseY - centerY) / centerY) * maxTilt;
    const rotateY = ((mouseX - centerX) / centerX) * maxTilt;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`,
      transition: 'transform 0.08s ease-out',
    });
    setSpotlight({ x: mouseX, y: mouseY, active: true });
  };

  const handleCardMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
      transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    });
    setSpotlight((prev) => ({ ...prev, active: false }));
  };

  // 键盘大写锁定检测
  const handleKeyModifier = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (captchaRequired && !captchaCode.trim()) {
      toast.error('请输入图形验证码');
      return;
    }

    setLoading(true);

    try {
      const res = await api.login({
        username,
        password,
        captchaKey: captchaRequired ? captchaKey : undefined,
        captchaCode: captchaRequired ? captchaCode.trim() : undefined,
      });

      clearAuthStorage();
      localStorage.setItem('hayden_token', res.accessToken);
      localStorage.setItem('hayden_user', JSON.stringify(res));
      document.cookie = `hayden_token=${encodeURIComponent(res.accessToken)}; path=/; max-age=604800; SameSite=Lax`;
      window.dispatchEvent(new Event('auth-change'));

      // 验证成功优雅仪式：绿色微粒子喷射
      setIsSuccess(true);
      toast.success('验证通过，欢迎进入工作台');

      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.62 },
          colors: ['#10b981', '#14b8a6', '#06b6d4', '#34d399', '#f59e0b'],
          disableForReducedMotion: true,
        });
      } catch {
        // 静默容错
      }

      // 提取目标跳转页面 (支持 from 参数)
      let targetUrl = '/admin/dashboard';
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const from = params.get('from');
        if (from && from.startsWith('/admin') && from !== '/admin/login') {
          targetUrl = from;
        }
      }

      // 平滑进入工作台控制台
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 550);
    } catch (err: any) {
      const errMsg = err.message || '登录失败，请检查账号密码';
      setError(errMsg);
      toast.error(errMsg);

      // 如果遇到验证码错误，或触发了连续输错安全防护
      if (
        errMsg.includes('验证码') ||
        errMsg.includes('防刷') ||
        errMsg.includes('防护') ||
        err.code === 400
      ) {
        setCaptchaRequired(true);
        fetchCaptcha();
      }
      setLoading(false);
    }
  };

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12 overflow-hidden bg-[#fbfbfd] dark:bg-[#090a0f] text-slate-900 dark:text-slate-200 transition-colors duration-500 selection:bg-emerald-500/20 selection:text-emerald-500">
      {/* 漫游星尘微粒子背景 Canvas */}
      <StarDustCanvas isDark={isDark} />

      {/* 几何微网格 SVG 背景与空间经纬坐标 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg
          className="w-full h-full opacity-60 dark:opacity-35"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="admin-login-grid"
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 44 0 L 0 0 0 44"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-slate-300/50 dark:text-white/[0.04]"
              />
              <circle
                cx="44"
                cy="44"
                r="1"
                className="fill-slate-400/40 dark:fill-emerald-400/25"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#admin-login-grid)" />
        </svg>

        {/* 极光放射呼吸渐变微光 (双主题分层景深) */}
        <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[850px] h-[550px] rounded-full bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[15%] w-[600px] h-[400px] rounded-full bg-cyan-500/10 dark:bg-emerald-500/8 blur-[100px] pointer-events-none" />
        <div className="absolute top-[30%] -left-[10%] w-[500px] h-[400px] rounded-full bg-teal-500/8 dark:bg-cyan-500/5 blur-[120px] pointer-events-none" />
      </div>

      {/* 右上角独立双主题自适应切换按钮 (白瓷微磨砂 / 深黑微光) */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={isDark ? '切换至白瓷浅色模式' : '切换至极客曜黑模式'}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#0c0d12]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.1] shadow-sm hover:shadow text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 transition-all duration-200 cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">白瓷浅色</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">深邃曜黑</span>
            </>
          )}
        </button>
      </div>

      {/* 居中双栏主容器 (收敛横向跨度，消除宽屏中间过宽与割裂感) */}
      <div className="relative z-10 w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-10 xl:gap-14 py-8">
        {/* 左侧创作者空间叙事区 (桌面端双栏展示) */}
        <div className="hidden lg:flex flex-1 flex-col justify-center gap-6 max-w-xl">
          <div className="space-y-4 relative">
            {/* 优雅创作者工作台标签 (无过度 ping 警报) */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              HAYDEN STUDIO // 创作者工作台
            </div>

            {/* 主标题：Hayden Studio · 数字空间 */}
            <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.14] text-slate-900 dark:text-white">
              Hayden Studio
              <span className="block bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-300 dark:via-teal-200 dark:to-cyan-300 bg-clip-text text-transparent">
                数字空间
              </span>
            </h2>

            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed max-w-md">
              全栈内容矩阵、影像媒体与知识网络的个人管理空间。
              在专注中打理数字资产，让文字与灵感自然生长。
            </p>

            {/* 内容生态与创作沉淀面板 */}
            <StudioArchivePanel />

            {/* 站长箴言 */}
            <p className="text-xs font-mono text-slate-400 dark:text-zinc-500 italic pt-1">
              “From the East, toward the unknown. —— Hayden Xue”
            </p>
          </div>
        </div>

        {/* 右侧 3D 视差流光卡片 (3D Tilt & Mouse Spotlight & Liquid Glass) */}
        <div
          ref={cardRef}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={tiltStyle}
          className="relative w-full max-w-md shrink-0 p-8 sm:p-9 rounded-3xl bg-white/85 dark:bg-[#0c0d12]/85 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] space-y-7 transition-all duration-200 will-change-transform overflow-hidden"
        >
        {/* 卡片表面跟随鼠标的聚光灯微反射 (Spotlight Radial Glow) */}
        {spotlight.active && (
          <div
            className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 340px at ${spotlight.x}px ${spotlight.y}px, rgba(16, 185, 129, 0.12), transparent 80%)`,
            }}
          />
        )}

        {/* 卡片顶部流光霓虹横条装饰 */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />

        {/* 标题与品牌标识 */}
        <div className="space-y-2.5 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.22)] mb-1">
            <BrandLogo size={38} animated glow />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Hayden Studio 控制台
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <Sparkles className="w-2.5 h-2.5" />
                V2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              数字空间全栈管理与高阶运营 · 站长访问通道
            </p>
          </div>
        </div>

        {/* 错误警示信息 */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 text-center font-medium animate-in fade-in zoom-in-95 duration-150 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          {/* 用户名输入 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center justify-between">
              <span>管理员账号</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">ROOT IDENTIFIER</span>
            </label>
            <div className="relative rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50/80 dark:bg-white/[0.03] transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => {
                  if (username.trim()) {
                    checkCaptchaStatus(username.trim());
                  }
                }}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
                placeholder="请输入站长账号 (Hayden)"
              />
            </div>
          </div>

          {/* 密码输入 (带密码可见性切换 & CapsLock 监测) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                访问密码
              </label>
              {capsLockActive && (
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  大写锁定已开启
                </span>
              )}
            </div>
            <div className="relative rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50/80 dark:bg-white/[0.03] transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyModifier}
                onKeyUp={handleKeyModifier}
                onBlur={() => setCapsLockActive(false)}
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
                placeholder="请输入管理员访问密码"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? '隐藏密码' : '显示密码'}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 图形验证码模块 (连续输错 5 次触发安全锁) */}
          {captchaRequired && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>安全防刷验证码</span>
                </label>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                  连续输错开启速率防护
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50/80 dark:bg-white/[0.03] transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={captchaCode}
                    onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                    maxLength={4}
                    required={captchaRequired}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-transparent text-sm font-mono tracking-widest uppercase text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
                    placeholder="4位验证码"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={captchaLoading}
                  title="点击刷新验证码"
                  className="h-[42px] px-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors overflow-hidden flex items-center justify-center relative cursor-pointer group shrink-0 shadow-sm"
                >
                  {captchaImage ? (
                    <img
                      src={captchaImage}
                      alt="验证码"
                      className="h-full w-auto object-contain rounded-lg group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <RefreshCw className={`w-4 h-4 text-slate-400 dark:text-zinc-400 ${captchaLoading ? 'animate-spin' : ''}`} />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 登录提交按钮 */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-85 cursor-pointer group relative overflow-hidden ${
              isSuccess
                ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                : 'bg-slate-900 hover:bg-black dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black'
            }`}
          >
            {/* 悬停光束流光微动效 */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent transition-transform pointer-events-none" />

            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在验证身份并连接工作台...</span>
              </>
            ) : isSuccess ? (
              <>
                <ShieldCheck className="w-4 h-4 animate-bounce" />
                <span>验证通过，正在进入工作台...</span>
              </>
            ) : (
              <>
                <span>进入创作工作台</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* 底部安全凭据标识 (严格遵循 Hayden Xue 身份纯正性) */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 font-mono relative z-10">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>AES-256 JWT Guard</span>
          </span>
          <span>Hayden Digital Garden · Hayden Xue</span>
        </div>
      </div>
    </div>
  </div>
  );
}
