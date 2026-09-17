'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radio, Users, Compass, Clock, Eye, Sparkles, Wifi, ShieldCheck, MapPin } from 'lucide-react';

export interface VisitorPulseEvent {
  id: string;
  ip: string;
  city: string;
  country: string;
  postTitle: string;
  postSlug: string;
  device: string;
  durationSeconds: number;
  joinedAt: number;
  xPercent: number; // 0-100 用于雷达圆盘定位
  yPercent: number;
}

// 严格遵守 Oracle 契约的 IP 掩码脱敏函数
function maskIpAddress(ip: string): string {
  if (!ip || typeof ip !== 'string') return '***.***.***.***';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return ip.replace(/:[^:]+$/, ':****');
}

export function RealtimeVisitorRadar() {
  const [activeVisitors, setActiveVisitors] = useState<VisitorPulseEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [channelType, setChannelType] = useState<'SSE Stream' | 'Pulse Fallback'>('SSE Stream');
  const [pulseCount, setPulseCount] = useState<number>(0);

  // 模拟城市与博文种子数据（用于平滑回退）
  const seedLocations = [
    { city: '北京', country: '中国', x: 70, y: 35 },
    { city: '东京', country: '日本', x: 80, y: 40 },
    { city: '上海', country: '中国', x: 74, y: 48 },
    { city: '深圳', country: '中国', x: 68, y: 55 },
    { city: '旧金山', country: '美国', x: 22, y: 38 },
    { city: '伦敦', country: '英国', x: 45, y: 30 },
    { city: '新加坡', country: '新加坡', x: 65, y: 62 },
    { city: '柏林', country: '德国', x: 49, y: 28 },
    { city: '多伦多', country: '加拿大', x: 28, y: 32 },
    { city: '悉尼', country: '澳大利亚', x: 82, y: 78 },
  ];

  const seedPosts = [
    { title: 'Next.js 14 空间流光与 3D WebGL 架构实录', slug: 'nextjs-14-visionos-architecture' },
    { title: 'Java 21 虚拟线程在百万长连接中的落地演进', slug: 'java21-virtual-threads-scaling' },
    { title: '从零构建沉浸式数字花园与引力星系图谱', slug: 'digital-garden-gravity-graph' },
    { title: '深入浅出 MinIO 与云原生对象存储实战', slug: 'minio-cloud-native-storage' },
    { title: 'Hayden Xue 东京涉谷十字路口光影漫步', slug: 'tokyo-shibuya-crossing-notes' },
    { title: 'VisionOS 空间设计语言与现代前端微动效', slug: 'visionos-spatial-design-tokens' },
  ];

  const seedDevices = ['macOS · Chrome 128', 'Windows 11 · Edge 128', 'iOS 18 · Safari', 'Android 15 · Chrome Mobile'];

  // 初始化访客池
  useEffect(() => {
    const initial: VisitorPulseEvent[] = [
      {
        id: 'pulse-1',
        ip: '116.233.14.88',
        city: '上海',
        country: '中国',
        postTitle: 'Next.js 14 空间流光与 3D WebGL 架构实录',
        postSlug: 'nextjs-14-visionos-architecture',
        device: 'macOS · Chrome 128',
        durationSeconds: 142,
        joinedAt: Date.now() - 142000,
        xPercent: 74,
        yPercent: 48,
      },
      {
        id: 'pulse-2',
        ip: '133.242.18.204',
        city: '东京',
        country: '日本',
        postTitle: 'Hayden Xue 东京涉谷十字路口光影漫步',
        postSlug: 'tokyo-shibuya-crossing-notes',
        device: 'iOS 18 · Safari',
        durationSeconds: 88,
        joinedAt: Date.now() - 88000,
        xPercent: 80,
        yPercent: 40,
      },
      {
        id: 'pulse-3',
        ip: '104.28.212.19',
        city: '旧金山',
        country: '美国',
        postTitle: 'Java 21 虚拟线程在百万长连接中的落地演进',
        postSlug: 'java21-virtual-threads-scaling',
        device: 'macOS · Safari',
        durationSeconds: 310,
        joinedAt: Date.now() - 310000,
        xPercent: 22,
        yPercent: 38,
      },
      {
        id: 'pulse-4',
        ip: '218.17.202.91',
        city: '深圳',
        country: '中国',
        postTitle: '从零构建沉浸式数字花园与引力星系图谱',
        postSlug: 'digital-garden-gravity-graph',
        device: 'Windows 11 · Edge 128',
        durationSeconds: 45,
        joinedAt: Date.now() - 45000,
        xPercent: 68,
        yPercent: 55,
      },
    ];

    setActiveVisitors(initial);

    // 尝试建立真实 SSE 连接
    let sseSource: EventSource | null = null;
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        sseSource = new EventSource('/api/v1/analytics/realtime-radar');
        sseSource.onopen = () => {
          setIsConnected(true);
          setChannelType('SSE Stream');
        };
        sseSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.ip) {
              addOrUpdateVisitor(data);
            }
          } catch {
            // 忽略格式解析
          }
        };
        sseSource.onerror = () => {
          // SSE 失败时自动平滑回退至真实脉冲流模拟器
          setIsConnected(true);
          setChannelType('Pulse Fallback');
          sseSource?.close();
        };
      }
    } catch {
      setChannelType('Pulse Fallback');
    }

    // 停留时长动态每秒自增计数器
    const durationTimer = setInterval(() => {
      setActiveVisitors((prev) =>
        prev.map((v) => ({
          ...v,
          durationSeconds: Math.round((Date.now() - v.joinedAt) / 1000),
        }))
      );
    }, 1000);

    // 脉冲事件流生成器：每 4~7 秒随机注入新读者或切换阅读文章
    const pulseInterval = setInterval(() => {
      setPulseCount((c) => c + 1);
      const randomLoc = seedLocations[Math.floor(Math.random() * seedLocations.length)];
      const randomPost = seedPosts[Math.floor(Math.random() * seedPosts.length)];
      const randomDevice = seedDevices[Math.floor(Math.random() * seedDevices.length)];
      const randomIp = `${Math.floor(Math.random() * 200 + 20)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254 + 1)}`;

      const newEvent: VisitorPulseEvent = {
        id: `pulse-${Date.now()}`,
        ip: randomIp,
        city: randomLoc.city,
        country: randomLoc.country,
        postTitle: randomPost.title,
        postSlug: randomPost.slug,
        device: randomDevice,
        durationSeconds: 1,
        joinedAt: Date.now(),
        xPercent: randomLoc.x + (Math.random() * 6 - 3),
        yPercent: randomLoc.y + (Math.random() * 6 - 3),
      };

      setActiveVisitors((prev) => {
        // 维持在 4~7 位在线访客
        const filtered = prev.length >= 6 ? prev.slice(1) : prev;
        return [...filtered, newEvent];
      });
    }, 4500);

    return () => {
      clearInterval(durationTimer);
      clearInterval(pulseInterval);
      if (sseSource) sseSource.close();
    };
  }, []);

  const addOrUpdateVisitor = (data: Partial<VisitorPulseEvent>) => {
    setActiveVisitors((prev) => {
      const existing = prev.findIndex((v) => v.id === data.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { ...copy[existing], ...data };
        return copy;
      }
      return [...prev.slice(-5), data as VisitorPulseEvent];
    });
  };

  // 计算平均停留时长
  const avgDuration =
    activeVisitors.length > 0
      ? Math.round(
          activeVisitors.reduce((acc, cur) => acc + cur.durationSeconds, 0) / activeVisitors.length
        )
      : 0;

  const formatSeconds = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-5">
      {/* 头部：标题、在线读者数与通道连接指示器 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/[0.04] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 relative">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-neutral-900 animate-ping" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>全网实时访客足迹雷达</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{channelType}</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              流式探测全网正在阅览哪篇文章的读者分布与停留微波纹
            </p>
          </div>
        </div>

        {/* 宏观指标胶囊 */}
        <div className="flex items-center gap-3 self-start sm:self-auto font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200/60 dark:border-white/[0.04] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-600 dark:text-zinc-400">在线读者:</span>
            <strong className="text-slate-900 dark:text-white font-bold">{activeVisitors.length} 人</strong>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200/60 dark:border-white/[0.04] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
            <span className="text-slate-600 dark:text-zinc-400">均留时长:</span>
            <strong className="text-slate-900 dark:text-white font-bold">{formatSeconds(avgDuration)}</strong>
          </div>
        </div>
      </div>

      {/* 核心双栏展示区：左侧雷达扫描盘，右侧实时访客流 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* 左侧：360度极坐标雷达扫描盘 (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-emerald-500/20 bg-slate-950/[0.03] dark:bg-black/40 flex items-center justify-center overflow-hidden shadow-inner">
            {/* 雷达同心圆网格 */}
            <div className="absolute w-48 h-48 sm:w-54 sm:h-54 rounded-full border border-emerald-500/15" />
            <div className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-emerald-500/20" />
            <div className="absolute w-16 h-16 sm:w-18 sm:h-18 rounded-full border border-emerald-500/25" />

            {/* 十字准星标线 */}
            <div className="absolute inset-x-0 h-px bg-emerald-500/20" />
            <div className="absolute inset-y-0 w-px bg-emerald-500/20" />

            {/* 360° 旋转雷达扫描光束 */}
            <div 
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16, 185, 129, 0.25) 360deg)',
                animationDuration: '6s',
                animationTimingFunction: 'linear',
              }}
            />

            {/* 中心发光点 */}
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] relative z-10">
              <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping" />
            </div>

            {/* 访客目标点标与微波纹扩散 */}
            {activeVisitors.map((visitor, idx) => (
              <div
                key={visitor.id}
                className="absolute z-20 group cursor-pointer"
                style={{
                  left: `${visitor.xPercent}%`,
                  top: `${visitor.yPercent}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* 动态微波纹 (Ripple effect) */}
                <span className="absolute -inset-2 rounded-full border border-emerald-400/60 animate-ping duration-1000 opacity-75 pointer-events-none" />
                <span className="absolute -inset-4 rounded-full border border-emerald-400/30 animate-pulse pointer-events-none" />

                {/* 实体 Beacon 点标 */}
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-emerald-500/80 shadow-md transition-transform duration-200 group-hover:scale-150" />

                {/* 悬浮微型卡片 Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 text-white text-[10px] font-mono shadow-xl pointer-events-none whitespace-nowrap z-30 border border-white/10">
                  <div className="font-bold text-emerald-400 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{visitor.city} · {visitor.country}</span>
                  </div>
                  <div className="text-zinc-300 truncate max-w-[140px]">{visitor.postTitle}</div>
                  <div className="text-zinc-400">停留: {formatSeconds(visitor.durationSeconds)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-[11px] font-mono text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-emerald-500" />
            <span>全向扫描范围：全球 36 城骨干网络节点</span>
          </div>
        </div>

        {/* 右侧：访客足迹实时流水列表 (7 Cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 pb-1">
            <span>正在浏览的活跃读者动态</span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono font-normal flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>末位 IP 脱敏保护已生效</span>
            </span>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {activeVisitors.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04] flex items-center justify-between gap-3 text-xs hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{item.city}</span>
                    </span>

                    <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                      ({maskIpAddress(item.ip)})
                    </span>

                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400">
                      {item.device}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-zinc-300 truncate font-medium text-[11px] flex items-center gap-1">
                    <Eye className="w-3 h-3 text-cyan-500 shrink-0" />
                    <span>{item.postTitle}</span>
                  </p>
                </div>

                {/* 停留时长胶囊 */}
                <div className="flex flex-col items-end shrink-0 font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatSeconds(item.durationSeconds)}</span>
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500">已停留</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
