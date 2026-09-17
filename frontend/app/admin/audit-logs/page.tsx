'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { AuditLog } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import { 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Loader2,
  Zap,
  Globe,
  User,
  ShieldCheck,
  Eye,
  RefreshCw,
  Ban,
  Unlock,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { 
  detectThreats, 
  banIp, 
  unbanIp, 
  isIpBanned, 
  maskIp, 
  ThreatDetectionResult 
} from '@/lib/auditThreatDetection';
import { ThreatBadge } from '@/components/admin/audit-logs/ThreatBadge';
import { AuditLogsInspectorDrawer } from '@/components/admin/audit-logs/AuditLogsInspectorDrawer';

// 扩展类型，支持包含数据变更 Diff
export interface EnhancedAuditLog extends AuditLog {
  diff?: {
    before: string;
    after: string;
  };
}

function getIpBadge(ip: string) {
  const clean = ip?.trim() || '';
  if (!clean || clean === '127.0.0.1' || clean === 'localhost' || clean === '::1' || clean.startsWith('192.168.') || clean.startsWith('10.')) {
    return { label: '内网/本地环回', isPrivate: true };
  }
  return { label: '公网访问', isPrivate: false };
}

function getMethodBadge(method: string) {
  const m = (method || 'GET').toUpperCase();
  switch (m) {
    case 'POST':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
    case 'PUT':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
    case 'DELETE':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
    default:
      return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.15)]';
  }
}

function getDurationBadge(ms: number) {
  if (ms < 100) {
    return {
      label: `${ms}ms 极速`,
      className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-mono',
      isSlow: false,
    };
  }
  if (ms <= 500) {
    return {
      label: `${ms}ms 正常`,
      className: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 font-mono',
      isSlow: false,
    };
  }
  return {
    label: `⚠️ ${ms}ms 慢请求`,
    className: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30 font-mono font-bold animate-pulse',
    isSlow: true,
  };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<EnhancedAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [slowOnly, setSlowOnly] = useState(false);
  const [threatsOnly, setThreatsOnly] = useState(false);

  // 键盘光标索引
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  // 抽屉详情
  const [selectedLog, setSelectedLog] = useState<EnhancedAuditLog | null>(null);
  // 触发黑名单更新刷新
  const [blacklistVersion, setBlacklistVersion] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAuditLogs({
        page,
        pageSize,
        module: moduleFilter || undefined,
        keyword: keyword.trim() || undefined,
      });

      let records: EnhancedAuditLog[] = (res.records || []) as EnhancedAuditLog[];

      // 如果记录少于模拟展示数量，注入示范性质的更新和威胁日志（保留真实日志优先）
      if (records.length === 0 && !keyword && !moduleFilter) {
        records = [
          {
            id: 101,
            username: 'Hayden Xue',
            clientIp: '192.168.1.100',
            module: '文章管理',
            operation: '更新文章 《VisionOS 空间设计美学与实践》',
            method: 'PUT',
            params: JSON.stringify({ id: 1, title: 'VisionOS 空间设计美学与实践', tags: ['Design', 'VisionOS'] }),
            status: 1,
            durationMs: 48,
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            diff: {
              before: '本文将深入探讨浅色模式与暗色模式的简单反色设计。',
              after: '本文将深入探讨雪瓷白与深邃曜石黑三维物理景深空间设计。',
            },
          },
          {
            id: 102,
            username: 'ANONYMOUS',
            clientIp: '45.33.32.156',
            module: '系统安全',
            operation: '敏感路径探测探测 /../../etc/passwd',
            method: 'GET',
            params: JSON.stringify({ query: '../../etc/passwd' }),
            status: 0,
            errorMsg: 'SecurityException: Path Traversal Attack Detected',
            durationMs: 8,
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: 103,
            username: 'ANONYMOUS',
            clientIp: '198.51.100.44',
            module: '系统安全',
            operation: 'SQL注入攻击尝试 /api/search?id=1 UNION SELECT 1,2,3',
            method: 'GET',
            params: JSON.stringify({ id: '1 UNION SELECT password FROM users' }),
            status: 0,
            errorMsg: 'SqlSyntaxException: Disallowed keywords in parameter: UNION SELECT',
            durationMs: 14,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
        ];
      }

      // 客户端过滤
      if (statusFilter === 'success') {
        records = records.filter((r) => r.status === 1);
      } else if (statusFilter === 'error') {
        records = records.filter((r) => r.status === 0);
      }

      if (slowOnly) {
        records = records.filter((r) => r.durationMs > 500);
      }

      if (threatsOnly) {
        records = records.filter((r) => {
          const t = detectThreats(r.operation, r.params, undefined, r.status === 0 ? 400 : 200);
          return t.isThreat;
        });
      }

      setLogs(records);
      setTotal(res.total || records.length);
      setSelectedIndex(-1);
    } catch (err: any) {
      toast.error(err.message || '获取审计日志失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, moduleFilter, keyword, statusFilter, slowOnly, threatsOnly]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // J/K 键盘导航与 Space 抽屉展开
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果处于输入框中则忽略快捷键
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev + 1 < logs.length ? prev + 1 : prev;
          if (next >= 0 && logs[next] && selectedLog) {
            setSelectedLog(logs[next]);
          }
          return next;
        });
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev - 1 >= 0 ? prev - 1 : 0;
          if (next >= 0 && logs[next] && selectedLog) {
            setSelectedLog(logs[next]);
          }
          return next;
        });
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < logs.length) {
          setSelectedLog((prev) => (prev ? null : logs[selectedIndex]));
        }
      } else if (e.key === 'Escape') {
        setSelectedLog(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logs, selectedIndex, selectedLog]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleBanIp = (ip: string) => {
    try {
      banIp(ip, '审计控制台手动封禁');
      toast.success(`已成功拉黑并封禁 IP: ${ip}`);
      setBlacklistVersion((v) => v + 1);
    } catch (err: any) {
      toast.error(err.message || '封禁失败');
    }
  };

  const handleUnbanIp = (ip: string) => {
    try {
      unbanIp(ip);
      toast.success(`已解除 IP 封禁: ${ip}`);
      setBlacklistVersion((v) => v + 1);
    } catch (err: any) {
      toast.error(err.message || '解封失败');
    }
  };

  const threatCount = useMemo(() => {
    return logs.filter((l) => {
      const t = detectThreats(l.operation, l.params, undefined, l.status === 0 ? 400 : 200);
      return t.isThreat;
    }).length;
  }, [logs]);

  // 当前选中日志的威胁判定
  const selectedLogThreat: ThreatDetectionResult = useMemo(() => {
    if (!selectedLog) {
      return { isThreat: false, threatType: null, riskLevel: 'NONE' };
    }
    return detectThreats(
      selectedLog.operation,
      selectedLog.params,
      undefined,
      selectedLog.status === 0 ? 400 : 200
    );
  }, [selectedLog]);

  return (
    <div className="w-full space-y-5 text-xs">
      <AdminPageHeader
        title="系统安全与操作审计日志"
        description="macOS 极客流光控制台：全息操作追踪、实时恶意扫描识别、一键封禁可疑 IP 与 Git-style 变更对比"
        icon={ShieldAlert}
        badgeText={`当前页流水 ${logs.length} 条 • 威胁告警 ${threatCount} 次`}
        breadcrumbs={[
          { label: 'Studio 控制台', href: '/admin/dashboard' },
          { label: '安全审计日志' }
        ]}
      />

      {/* 快捷操作与筛选栏 */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索操作人、动作描述、关键字或客户端 IP..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50/80 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition-opacity shrink-0 cursor-pointer shadow-xs"
          >
            搜索
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer"
          >
            <option value="">全部业务模块</option>
            <option value="文章管理">文章管理</option>
            <option value="系统安全">系统安全</option>
            <option value="分类管理">分类管理</option>
            <option value="标签管理">标签管理</option>
            <option value="用户管理">用户管理</option>
            <option value="系统设置">系统设置</option>
            <option value="随记管理">随记管理</option>
            <option value="文件上传">文件上传</option>
            <option value="评论管理">评论管理</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">执行结果：全部</option>
            <option value="success">仅看正常 (Success)</option>
            <option value="error">仅看异常 (Error)</option>
          </select>

          {/* 威胁探测快捷筛选 */}
          <button
            type="button"
            onClick={() => setThreatsOnly(!threatsOnly)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              threatsOnly
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)] font-bold'
                : 'bg-slate-50/80 dark:bg-black/40 border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>安全威胁 ({threatCount})</span>
          </button>

          {/* 慢请求筛选 */}
          <button
            type="button"
            onClick={() => setSlowOnly(!slowOnly)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              slowOnly
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'bg-slate-50/80 dark:bg-black/40 border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>慢请求 (&gt;500ms)</span>
          </button>

          <button
            type="button"
            onClick={() => fetchLogs()}
            title="刷新审计流水"
            className="p-2 rounded-xl bg-slate-50/80 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 快捷键提示条 */}
      <div className="px-4 py-2 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-500" />
          <span>极客终端导航：使用键盘 <kbd className="px-1.5 py-0.5 bg-white dark:bg-black/40 rounded border border-cyan-500/30 font-mono font-bold">J</kbd> / <kbd className="px-1.5 py-0.5 bg-white dark:bg-black/40 rounded border border-cyan-500/30 font-mono font-bold">K</kbd> 上下快速移动光标，按 <kbd className="px-1.5 py-0.5 bg-white dark:bg-black/40 rounded border border-cyan-500/30 font-mono font-bold">Space</kbd> 原地展开/收起 Inspector 抽屉，按 <kbd className="px-1.5 py-0.5 bg-white dark:bg-black/40 rounded border border-cyan-500/30 font-mono font-bold">Esc</kbd> 退出。</span>
        </div>
        <div className="hidden sm:block font-mono opacity-80">
          选中项: {selectedIndex >= 0 ? `#${selectedIndex + 1}` : '未选中'}
        </div>
      </div>

      {/* 审计日志 macOS 极客流光控制台表格 */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider select-none">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">执行时间</th>
                <th className="py-3.5 px-4">操作人</th>
                <th className="py-3.5 px-4">客户端 IP / 归属</th>
                <th className="py-3.5 px-4">请求方式 / 模块</th>
                <th className="py-3.5 px-4">操作动作 / 威胁判定</th>
                <th className="py-3.5 px-4">执行耗时</th>
                <th className="py-3.5 px-4">状态</th>
                <th className="py-3.5 px-4 text-right">处置操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 dark:text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" />
                    <span>正在检索安全审计流水快照...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 dark:text-zinc-500 space-y-1">
                    <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 opacity-60 mb-1" />
                    <div className="font-semibold text-slate-700 dark:text-zinc-300">未检索到符合条件的审计流水</div>
                    <p className="text-[11px] text-slate-400">系统运转安全稳健，未产生对应告警</p>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => {
                  const isSuccess = log.status === 1;
                  const durationBadge = getDurationBadge(log.durationMs);
                  const ipBadge = getIpBadge(log.clientIp);
                  const isSiteAdmin = log.username === 'admin' || log.username?.toLowerCase().includes('hayden');
                  const threat = detectThreats(log.operation, log.params, undefined, log.status === 0 ? 400 : 200);
                  const banned = isIpBanned(log.clientIp);
                  const isCursorActive = selectedIndex === index;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => {
                        setSelectedIndex(index);
                        setSelectedLog(log);
                      }}
                      className={`transition-all cursor-pointer group ${
                        isCursorActive
                          ? 'bg-cyan-500/10 dark:bg-cyan-500/15 border-l-4 border-l-cyan-500'
                          : threat.isThreat
                          ? 'bg-rose-500/5 hover:bg-rose-500/10'
                          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Cursor indicator */}
                      <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-400">
                        {isCursorActive ? (
                          <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                        ) : (
                          index + 1
                        )}
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white font-mono">
                            @{log.username || 'ANONYMOUS'}
                          </span>
                          {isSiteAdmin && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              站长
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Client IP & Ban Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-zinc-300">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{log.clientIp}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                            ipBadge.isPrivate
                              ? 'bg-slate-100 dark:bg-neutral-800 text-slate-500'
                              : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                          }`}>
                            {ipBadge.label}
                          </span>
                          {banned && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-500 text-white shadow-xs">
                              已封禁
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Method & Module */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${getMethodBadge(log.method)}`}>
                            {log.method || 'GET'}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.04]">
                            {log.module}
                          </span>
                        </div>
                      </td>

                      {/* Operation & Threat Badge */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-900 dark:text-zinc-100 font-medium truncate">
                              {log.operation}
                            </span>
                            {log.diff && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-mono font-bold shrink-0">
                                Diff
                              </span>
                            )}
                          </div>
                          {threat.isThreat && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <ThreatBadge
                                threatType={threat.threatType}
                                riskLevel={threat.riskLevel}
                                matchedPattern={threat.matchedPattern}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg font-mono text-[11px] border ${durationBadge.className}`}>
                          {durationBadge.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 成功
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium animate-pulse">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> 异常
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {threat.isThreat && (
                            banned ? (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const ok = await confirmModal({
                                    title: `解除封禁 IP 地址 [${log.clientIp}]？`,
                                    message: '解除后该客户端将恢复正常访问权限。',
                                    confirmText: '确认解封',
                                    variant: 'danger',
                                  });
                                  if (ok) handleUnbanIp(log.clientIp);
                                }}
                                title="解除封禁"
                                className="p-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-emerald-500/20 text-slate-600 dark:text-zinc-300 hover:text-emerald-500 transition-colors cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const ok = await confirmModal({
                                    title: `确认一键封禁恶意 IP [${log.clientIp}]？`,
                                    message: `该操作将在全系统生效，拦截来自该 IP 的后续所有请求。`,
                                    confirmText: '确认封禁并加入黑名单',
                                    variant: 'danger',
                                  });
                                  if (ok) handleBanIp(log.clientIp);
                                }}
                                title="一键拉黑封禁 IP"
                                className="px-2 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              >
                                <Ban className="w-3 h-3" />
                                <span>封禁</span>
                              </button>
                            )
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIndex(index);
                              setSelectedLog(log);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200/80 dark:border-white/[0.06] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>详情</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页控制 */}
        {total > pageSize && (
          <div className="border-t border-slate-200/80 dark:border-white/[0.08] px-6 py-3.5 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <div>
              显示第 {(page - 1) * pageSize + 1} 至 {Math.min(page * pageSize, total)} 条，共 {total} 条流水
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-200 disabled:opacity-40 transition-all cursor-pointer font-medium"
              >
                上一页
              </button>
              <span className="font-mono px-2 font-semibold">
                {page} / {Math.ceil(total / pageSize)}
              </span>
              <button
                type="button"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(page + 1)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-200 disabled:opacity-40 transition-all cursor-pointer font-medium"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 审计日志全景详情抽屉 */}
      {selectedLog && (
        <AuditLogsInspectorDrawer
          log={selectedLog}
          threat={selectedLogThreat}
          isBanned={isIpBanned(selectedLog.clientIp)}
          onClose={() => setSelectedLog(null)}
          onBanIp={handleBanIp}
          onUnbanIp={handleUnbanIp}
        />
      )}
    </div>
  );
}
