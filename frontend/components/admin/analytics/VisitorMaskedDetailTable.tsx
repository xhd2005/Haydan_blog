'use client';

import React, { useState, useMemo } from 'react';
import { ShieldCheck, Search, Globe, Laptop, Smartphone, Eye, Clock, ArrowUpRight, Lock } from 'lucide-react';

export interface VisitorLogEntry {
  id: string;
  ip: string;
  country: string;
  city: string;
  pageUrl: string;
  pageTitle: string;
  referrer: string;
  device: string;
  durationSeconds: number;
  visitedAt: string;
  status: number;
}

// 严格遵守 Oracle 契约与安全规范的 IP 末位脱敏算法
export function maskIp(ip: string): string {
  if (typeof ip !== 'string') return '***.***.***.***';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return ip.replace(/:[^:]+$/, ':****');
}

export function VisitorMaskedDetailTable() {
  const [keyword, setKeyword] = useState('');

  // 模拟真实访客流水日志（包含 IPv4 与 IPv6 样本）
  const logs: VisitorLogEntry[] = useMemo(() => [
    {
      id: 'vis-1',
      ip: '116.233.14.88',
      country: '中国',
      city: '上海',
      pageUrl: '/blog/nextjs-14-visionos-architecture',
      pageTitle: 'Next.js 14 空间流光与 3D WebGL 架构实录',
      referrer: 'Google 搜索',
      device: 'macOS · Chrome 128',
      durationSeconds: 142,
      visitedAt: '2026-09-17 09:58:24',
      status: 200,
    },
    {
      id: 'vis-2',
      ip: '133.242.18.204',
      country: '日本',
      city: '东京',
      pageUrl: '/journey/tokyo-shibuya',
      pageTitle: '东京·涉谷十字路口 光影漫步',
      referrer: 'GitHub Profile',
      device: 'iOS 18 · Safari Mobile',
      durationSeconds: 88,
      visitedAt: '2026-09-17 09:55:10',
      status: 200,
    },
    {
      id: 'vis-3',
      ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      country: '美国',
      city: '旧金山',
      pageUrl: '/blog/java21-virtual-threads-scaling',
      pageTitle: 'Java 21 虚拟线程在百万长连接中的落地演进',
      referrer: '直接键入 URL',
      device: 'macOS · Safari',
      durationSeconds: 310,
      visitedAt: '2026-09-17 09:51:02',
      status: 200,
    },
    {
      id: 'vis-4',
      ip: '218.17.202.91',
      country: '中国',
      city: '深圳',
      pageUrl: '/graph',
      pageTitle: '数字花园全景 3D 引力星系图谱',
      referrer: '掘金文章引用',
      device: 'Windows 11 · Edge 128',
      durationSeconds: 45,
      visitedAt: '2026-09-17 09:47:33',
      status: 200,
    },
    {
      id: 'vis-5',
      ip: '192.168.1.100',
      country: '中国',
      city: '北京',
      pageUrl: '/about',
      pageTitle: '关于 Hayden Xue 个人自述与数字空间',
      referrer: '直接键入 URL',
      device: 'macOS · Chrome 128',
      durationSeconds: 195,
      visitedAt: '2026-09-17 09:42:19',
      status: 200,
    },
    {
      id: 'vis-6',
      ip: '82.165.197.1',
      country: '德国',
      city: '柏林',
      pageUrl: '/blog/minio-cloud-native-storage',
      pageTitle: '深入浅出 MinIO 与云原生对象存储实战',
      referrer: 'Twitter / X',
      device: 'Linux · Firefox 130',
      durationSeconds: 220,
      visitedAt: '2026-09-17 09:36:45',
      status: 200,
    },
  ], []);

  // 过滤
  const filteredLogs = useMemo(() => {
    if (!keyword.trim()) return logs;
    const lower = keyword.toLowerCase();
    return logs.filter(
      (l) =>
        l.city.toLowerCase().includes(lower) ||
        l.country.toLowerCase().includes(lower) ||
        l.pageTitle.toLowerCase().includes(lower) ||
        l.referrer.toLowerCase().includes(lower)
    );
  }, [logs, keyword]);

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
      {/* 头部：标题与隐私合规徽章 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/[0.04] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>全网访客实时明细 (Visitor Stream Log)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>末位掩码脱敏已生效</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              严格遵循隐私保护准则，IPv4 统一掩码为 ***，IPv6 抹除末段主机标识
            </p>
          </div>
        </div>

        {/* 关键字搜索 */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索城市、文章或渠道..."
            className="w-full sm:w-60 pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* 访客明细表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/60 dark:border-white/[0.06] text-slate-400 dark:text-zinc-500 font-mono text-[11px]">
              <th className="py-2.5 px-3 font-semibold">访问时间</th>
              <th className="py-2.5 px-3 font-semibold">客户端脱敏 IP</th>
              <th className="py-2.5 px-3 font-semibold">地理位置</th>
              <th className="py-2.5 px-3 font-semibold">受访文章 / 页面</th>
              <th className="py-2.5 px-3 font-semibold">引流渠道</th>
              <th className="py-2.5 px-3 font-semibold">设备与终端</th>
              <th className="py-2.5 px-3 font-semibold text-right">停留时长</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filteredLogs.map((log) => {
              const maskedIpStr = maskIp(log.ip);

              return (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* 访问时间 */}
                  <td className="py-3 px-3 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                    {log.visitedAt}
                  </td>

                  {/* 客户端脱敏 IP */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 font-semibold text-[11px] border border-slate-200/60 dark:border-white/[0.04]">
                      {maskedIpStr}
                    </span>
                  </td>

                  {/* 地理位置 */}
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3 text-cyan-500" />
                      <span>{log.city} · {log.country}</span>
                    </span>
                  </td>

                  {/* 受访文章 / 页面 */}
                  <td className="py-3 px-3 max-w-xs truncate">
                    <a
                      href={log.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                      title={log.pageTitle}
                    >
                      <span className="truncate">{log.pageTitle}</span>
                      <ArrowUpRight className="w-3 h-3 shrink-0 opacity-60" />
                    </a>
                  </td>

                  {/* 引流渠道 */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {log.referrer}
                    </span>
                  </td>

                  {/* 设备与终端 */}
                  <td className="py-3 px-3 text-slate-500 dark:text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                    {log.device}
                  </td>

                  {/* 停留时长 */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {log.durationSeconds}s
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
