'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AuditLog } from '@/lib/types';
import { toast } from '@/lib/toast';
import { 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Terminal, 
  Filter, 
  Loader2,
  Copy,
  Check,
  X,
  AlertTriangle,
  Zap,
  Globe,
  User,
  ShieldCheck,
  Eye,
  RefreshCw,
  FileCode2,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

function formatJsonTree(raw: string | undefined): { formatted: string; isJson: boolean } {
  if (!raw || !raw.trim()) return { formatted: '(无请求参数)', isJson: false };
  try {
    const parsed = JSON.parse(raw);
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
  } catch {
    return { formatted: raw, isJson: false };
  }
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
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'PUT':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'DELETE':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    default:
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  }
}

function getDurationBadge(ms: number) {
  if (ms < 200) {
    return {
      label: `${ms}ms`,
      className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      isSlow: false,
    };
  }
  if (ms <= 1000) {
    return {
      label: `${ms}ms`,
      className: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      isSlow: false,
    };
  }
  return {
    label: `⚠️ ${ms}ms 慢请求`,
    className: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 font-bold',
    isSlow: true,
  };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [slowOnly, setSlowOnly] = useState(false);

  // 抽屉详情查看
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAuditLogs({
        page,
        pageSize,
        module: moduleFilter || undefined,
        keyword: keyword.trim() || undefined,
      });
      let records = res.records || [];
      if (statusFilter === 'success') {
        records = records.filter((r) => r.status === 1);
      } else if (statusFilter === 'error') {
        records = records.filter((r) => r.status === 0);
      }
      if (slowOnly) {
        records = records.filter((r) => r.durationMs > 1000);
      }
      setLogs(records);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast.error(err.message || '获取审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, moduleFilter, statusFilter, slowOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleCopyJson = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('请求载荷 JSON 已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动选择复制');
    }
  };

  return (
    <div className="w-full space-y-5 text-xs">
      <AdminPageHeader
        title="系统安全与操作审计日志"
        description="实时记录管理端关键写操作流水、敏感参数脱敏快照、慢请求链路追踪与安全异常告警"
        icon={ShieldAlert}
        badgeText={`全量存档 ${total} 条流水`}
        breadcrumbs={[
          { label: 'Studio 控制台', href: '/admin/dashboard' },
          { label: '审计日志' }
        ]}
      />

      {/* 筛选与搜索工具栏 */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索操作人、动作描述或 IP..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50/80 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
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
            <option value="error">仅看异常告警 (Error)</option>
          </select>

          <button
            type="button"
            onClick={() => setSlowOnly(!slowOnly)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              slowOnly
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'bg-slate-50/80 dark:bg-black/40 border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>慢请求 (&gt;1000ms)</span>
          </button>

          <button
            type="button"
            onClick={() => fetchLogs()}
            title="刷新日志"
            className="p-2 rounded-xl bg-slate-50/80 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 审计日志高质感表格 */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">执行时间</th>
                <th className="py-3.5 px-4">操作人</th>
                <th className="py-3.5 px-4">客户端 IP</th>
                <th className="py-3.5 px-4">请求方式 / 模块</th>
                <th className="py-3.5 px-4">操作动作</th>
                <th className="py-3.5 px-4">执行耗时</th>
                <th className="py-3.5 px-4">状态</th>
                <th className="py-3.5 px-4 text-right">全景详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 dark:text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" />
                    <span>正在检索安全审计流水快照...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 dark:text-zinc-500 space-y-1">
                    <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 opacity-60 mb-1" />
                    <div className="font-semibold text-slate-700 dark:text-zinc-300">未检索到符合条件的审计流水</div>
                    <p className="text-[11px] text-slate-400">系统运转安全稳健，未产生对应告警</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === 1;
                  const durationBadge = getDurationBadge(log.durationMs);
                  const ipBadge = getIpBadge(log.clientIp);
                  const isSiteAdmin = log.username === 'admin' || log.username?.toLowerCase().includes('hayden');

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* Time */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white font-mono">
                            @{log.username || 'ANONYMOUS'}
                          </span>
                          {isSiteAdmin && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              站长
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Client IP */}
                      <td className="py-3 px-4">
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
                        </div>
                      </td>

                      {/* Method & Module */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${getMethodBadge(log.method)}`}>
                            {log.method || 'POST'}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.04]">
                            {log.module}
                          </span>
                        </div>
                      </td>

                      {/* Operation */}
                      <td className="py-3 px-4 text-slate-900 dark:text-zinc-100 font-medium max-w-xs truncate">
                        {log.operation}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg font-mono text-[11px] border ${durationBadge.className}`}>
                          {durationBadge.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 成功
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium animate-pulse">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> 异常告警
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200/80 dark:border-white/[0.06] text-[11px] font-semibold flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>展开详情</span>
                        </button>
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

      {/* 审计日志全景详情抽屉 (Inspection Drawer) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* 背景毛玻璃遮罩 */}
          <div
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* 抽屉主体 */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="审计日志详情"
            className="relative z-50 w-full sm:w-[580px] h-full bg-[#fcfcfd] dark:bg-[#0c0d14] border-l border-slate-200 dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden animate-slide-left select-text"
          >
            {/* 顶部 Header */}
            <div className="p-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-neutral-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>审计流水详情 #{selectedLog.id}</span>
                    {selectedLog.status === 1 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        执行成功
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        发生异常
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 抽屉内容区 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* 核心元数据卡片 */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">操作账号</span>
                  <div className="font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-500" />
                    <span>@{selectedLog.username || 'ANONYMOUS'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">业务模块</span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {selectedLog.module}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">客户端 IP 与归属</span>
                  <div className="font-mono text-slate-900 dark:text-white flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{selectedLog.clientIp}</span>
                    <span className="text-[10px] text-slate-500 font-sans">({getIpBadge(selectedLog.clientIp).label})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">请求方法与耗时</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getMethodBadge(selectedLog.method)}`}>
                      {selectedLog.method || 'POST'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getDurationBadge(selectedLog.durationMs).className}`}>
                      {selectedLog.durationMs}ms
                    </span>
                  </div>
                </div>
              </div>

              {/* 行为描述 */}
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-white/[0.08] space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">操作行为摘要</span>
                <p className="text-slate-900 dark:text-white font-medium text-xs leading-relaxed">
                  {selectedLog.operation}
                </p>
              </div>

              {/* 异常信息提示 */}
              {selectedLog.status === 0 && selectedLog.errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>异常捕获堆栈与错误信息</span>
                  </div>
                  <pre className="p-3 rounded-xl bg-black/30 font-mono text-[11px] whitespace-pre-wrap text-rose-300 leading-relaxed overflow-x-auto">
                    {selectedLog.errorMsg}
                  </pre>
                </div>
              )}

              {/* 请求入参 JSON 树状视图 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-cyan-500" />
                    <span>请求入参快照 (Payload Snapshot)</span>
                  </span>
                  {selectedLog.params && (
                    <button
                      type="button"
                      onClick={() => handleCopyJson(selectedLog.params || '')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? '已复制' : '复制 JSON'}</span>
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-96 custom-scrollbar leading-relaxed">
                  <pre className="whitespace-pre-wrap selection:bg-cyan-500/30">
                    {formatJsonTree(selectedLog.params).formatted}
                  </pre>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                  注：敏感密码、Token 与 API 密钥已通过后端 AOP 切面物理打码脱敏为 ******，确保日志留存安全合规。
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
