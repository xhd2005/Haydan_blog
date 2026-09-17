'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  X, 
  Copy, 
  Check, 
  Terminal, 
  FileCode2, 
  User, 
  Globe, 
  AlertTriangle, 
  Ban, 
  CheckCircle2, 
  Unlock,
  Layers,
  Code
} from 'lucide-react';
import { AuditLog } from '@/lib/types';
import { ThreatDetectionResult } from '@/lib/auditThreatDetection';
import { ThreatBadge } from './ThreatBadge';
import { GitStyleDiffViewer } from './GitStyleDiffViewer';
import { toast, confirmModal } from '@/lib/toast';

interface AuditLogsInspectorDrawerProps {
  log: (AuditLog & { diff?: { before: string; after: string } }) | null;
  threat: ThreatDetectionResult;
  isBanned: boolean;
  onClose: () => void;
  onBanIp: (ip: string) => void;
  onUnbanIp: (ip: string) => void;
}

function formatJsonTree(raw: string | undefined): { formatted: string; isJson: boolean } {
  if (!raw || !raw.trim()) return { formatted: '(无请求参数快照)', isJson: false };
  try {
    const parsed = JSON.parse(raw);
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
  } catch {
    return { formatted: raw, isJson: false };
  }
}

export function AuditLogsInspectorDrawer({
  log,
  threat,
  isBanned,
  onClose,
  onBanIp,
  onUnbanIp,
}: AuditLogsInspectorDrawerProps) {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!log) return null;

  const isSuccess = log.status === 1;
  const isSiteAdmin = log.username === 'admin' || log.username?.toLowerCase().includes('hayden');

  // 生成真实 cURL 命令
  const generateCurlCommand = () => {
    const method = (log.method || 'POST').toUpperCase();
    const headers = [
      `-H "Content-Type: application/json"`,
      `-H "User-Agent: HaydenStudio/2.0"`,
      `-H "X-Forwarded-For: ${log.clientIp}"`,
    ];
    let cmd = `curl -X ${method} "https://haydenxue.com/api/admin/${log.module || 'action'}" \\\n  ` + headers.join(' \\\n  ');
    if (log.params && log.params.trim() && method !== 'GET') {
      cmd += ` \\\n  -d '${log.params.replace(/'/g, "'\\''")}'`;
    }
    return cmd;
  };

  const handleCopyJson = async () => {
    try {
      const { formatted } = formatJsonTree(log.params);
      await navigator.clipboard.writeText(formatted);
      setCopiedJson(true);
      toast.success('请求载荷 JSON 已复制');
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleCopyCurl = async () => {
    try {
      const curl = generateCurlCommand();
      await navigator.clipboard.writeText(curl);
      setCopiedCurl(true);
      toast.success('终端 cURL 命令已复制');
      setTimeout(() => setCopiedCurl(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleTriggerBan = async () => {
    const ok = await confirmModal({
      title: `确认封禁 IP 地址 [${log.clientIp}]？`,
      message: `该操作将在全系统网关与安全防线中生效，阻断来自该 IP 的所有后续访问请求。`,
      confirmText: '确认封禁并加入黑名单',
      cancelText: '取消',
      variant: 'danger',
    });
    if (ok) {
      onBanIp(log.clientIp);
    }
  };

  const handleTriggerUnban = async () => {
    const ok = await confirmModal({
      title: `解除封禁 IP 地址 [${log.clientIp}]？`,
      message: `解除后该 IP 将恢复对博客与 API 的正常访问权限。`,
      confirmText: '确认解封',
      cancelText: '取消',
      variant: 'danger',
    });
    if (ok) {
      onUnbanIp(log.clientIp);
    }
  };

  // 判断是否具备修改类 Diff 数据
  const hasDiffData = Boolean(
    log.diff?.before !== undefined && log.diff?.after !== undefined
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 磨砂背景遮罩 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* 抽屉主体 */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="审计日志全景详情"
        className="relative z-50 w-full sm:w-[640px] h-full bg-[#fcfcfd] dark:bg-[#0c0d14] border-l border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden select-text text-xs animate-in slide-in-from-right duration-200"
      >
        {/* 顶部 Header */}
        <div className="p-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              threat.isThreat 
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
            }`}>
              {threat.isThreat ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                  流水 #{log.id}
                </h3>
                {isSuccess ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    执行成功
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    异常告警
                  </span>
                )}
                {isBanned && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs">
                    IP 已封禁
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                <span>{new Date(log.createdAt).toLocaleString()}</span>
                <span className="text-slate-300 dark:text-zinc-600">•</span>
                <span className="text-[10px] text-slate-400 font-sans">
                  快捷键: <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-neutral-800 rounded font-mono">J/K</kbd> 切换, <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-neutral-800 rounded font-mono">Space</kbd> 抽屉, <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-neutral-800 rounded font-mono">Esc</kbd> 关闭
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              title="关闭抽屉 (Esc)"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 抽屉滚动内容 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* 1. 恶意探测特征与封禁处置条 */}
          {threat.isThreat && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ThreatBadge
                      threatType={threat.threatType}
                      riskLevel={threat.riskLevel}
                      matchedPattern={threat.matchedPattern}
                      size="md"
                    />
                    <span className="font-bold text-xs">检测到恶意扫描与攻击特征</span>
                  </div>
                  <p className="text-[11px] text-rose-600/90 dark:text-rose-400 leading-relaxed font-sans">
                    {threat.description || '该请求匹配到常见网络攻击模式或漏洞探测指纹，建议予以立即封禁。'}
                  </p>
                </div>

                <div className="shrink-0">
                  {isBanned ? (
                    <button
                      type="button"
                      onClick={handleTriggerUnban}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>解除封禁</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTriggerBan}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md hover:shadow-rose-600/20 transition-all cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>一键拉黑 IP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. 核心元数据卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">操作账号</span>
              <div className="font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-500" />
                <span>@{log.username || 'ANONYMOUS'}</span>
                {isSiteAdmin && (
                  <span className="text-[9px] px-1 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">
                    站长
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">业务模块</span>
              <div className="font-semibold text-slate-900 dark:text-white">
                {log.module}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">客户端 IP</span>
              <div className="font-mono text-slate-900 dark:text-white flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-cyan-500" />
                <span>{log.clientIp}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">方法与执行耗时</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-zinc-200 border border-slate-200/80 dark:border-white/[0.06]">
                  {log.method || 'POST'}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  log.durationMs < 100 
                    ? 'text-emerald-500 bg-emerald-500/10' 
                    : log.durationMs <= 500 
                    ? 'text-amber-500 bg-amber-500/10' 
                    : 'text-rose-500 bg-rose-500/10 font-bold'
                }`}>
                  {log.durationMs}ms
                </span>
              </div>
            </div>
          </div>

          {/* 3. 行为描述 */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200/80 dark:border-white/[0.08] space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">操作行为摘要</span>
            <p className="text-slate-900 dark:text-white font-medium text-xs leading-relaxed">
              {log.operation}
            </p>
          </div>

          {/* 4. Git-style 数据变更 Diff 检视器 (针对修改类日志或带 diff 的流水) */}
          {hasDiffData && (
            <div className="space-y-2">
              <GitStyleDiffViewer
                before={log.diff?.before}
                after={log.diff?.after}
                title="Git-style 数据变更 Diff 对比"
              />
            </div>
          )}

          {/* 5. 异常捕获堆栈 (若有) */}
          {log.status === 0 && log.errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>异常捕获堆栈与错误信息</span>
              </div>
              <pre className="p-3 rounded-xl bg-black/40 font-mono text-[11px] whitespace-pre-wrap text-rose-300 leading-relaxed overflow-x-auto">
                {log.errorMsg}
              </pre>
            </div>
          )}

          {/* 6. 请求入参 JSON 语法高亮树 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5 font-sans">
                <FileCode2 className="w-4 h-4 text-cyan-500" />
                <span>请求入参快照 (Payload Snapshot)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? '已复制' : '复制 JSON'}</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-72 custom-scrollbar leading-relaxed">
              <pre className="whitespace-pre-wrap selection:bg-cyan-500/30">
                {formatJsonTree(log.params).formatted}
              </pre>
            </div>
          </div>

          {/* 7. cURL 终端命令与 Request Headers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5 font-sans">
                <Terminal className="w-4 h-4 text-cyan-500" />
                <span>一键复制 cURL 调试命令</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCurl}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-emerald-500" /> : <Code className="w-3 h-3" />}
                <span>{copiedCurl ? '已复制 cURL' : '复制 cURL'}</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-950 p-3 font-mono text-[10px] text-cyan-300 overflow-x-auto leading-relaxed">
              <pre className="whitespace-pre-wrap break-all">
                {generateCurlCommand()}
              </pre>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">
              提示：可直接粘贴至 macOS 终端 / Linux Shell 中重现该请求上下文进行漏洞复现与联调。
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
