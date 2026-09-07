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
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAuditLogs({
        page,
        pageSize,
        module: moduleFilter || undefined,
        keyword: keyword.trim() || undefined,
      });
      setLogs(res.records || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast.error(err.message || '获取审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, moduleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6 max-w-6xl text-xs">
      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            <span>系统安全与操作审计日志 (Audit Logs)</span>
          </h1>
          <p className="text-muted-foreground mt-0.5">
            全量记录站长及管理端关键内容增删改查流水、登录认证历史、操作耗时与安全异常告警。
          </p>
        </div>
        <div className="text-muted-foreground font-mono">共记录审计流水：{total} 条</div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索操作人、动作或请求参数..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            搜索
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none"
          >
            <option value="">全部业务模块</option>
            <option value="文章管理">文章管理</option>
            <option value="分类管理">分类管理</option>
            <option value="标签管理">标签管理</option>
            <option value="用户管理">用户管理</option>
            <option value="系统设置">系统设置</option>
            <option value="随记管理">随记管理</option>
            <option value="文件上传">文件上传</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4">执行时间</th>
                <th className="py-3.5 px-4">操作人</th>
                <th className="py-3.5 px-4">客户端 IP</th>
                <th className="py-3.5 px-4">业务模块</th>
                <th className="py-3.5 px-4">操作行为</th>
                <th className="py-3.5 px-4">耗时</th>
                <th className="py-3.5 px-4">状态</th>
                <th className="py-3.5 px-4 text-right">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    正在拉取审计日志流水...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    未检索到符合条件的审计日志
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === 1;
                  const isExpanded = expandedId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-secondary/20 transition-colors">
                        {/* Time */}
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>

                        {/* Username */}
                        <td className="py-3 px-4 font-semibold text-foreground">
                          @{log.username || 'ANONYMOUS'}
                        </td>

                        {/* Client IP */}
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          {log.clientIp}
                        </td>

                        {/* Module */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-foreground">
                            {log.module}
                          </span>
                        </td>

                        {/* Operation */}
                        <td className="py-3 px-4 text-foreground font-medium">
                          {log.operation}
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          {log.durationMs}ms
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 成功
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                              <XCircle className="w-3.5 h-3.5" /> 异常
                            </span>
                          )}
                        </td>

                        {/* Expand / Details */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title="查看请求明细"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-secondary/30">
                          <td colSpan={8} className="p-4 space-y-2 border-b border-border">
                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                              <span className="font-mono flex items-center gap-1">
                                <Terminal className="w-3 h-3 text-primary" />
                                请求方法：{log.method}
                              </span>
                              {!isSuccess && log.errorMsg && (
                                <span className="text-rose-500 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  错误信息：{log.errorMsg}
                                </span>
                              )}
                            </div>

                            {log.params && (
                              <div>
                                <div className="text-[10px] text-muted-foreground mb-1 font-semibold">请求入参 / 载荷 (Payload)：</div>
                                <pre className="p-3 rounded-xl bg-background border border-border font-mono text-[11px] text-foreground overflow-x-auto whitespace-pre-wrap max-h-40">
                                  {log.params}
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              显示第 {(page - 1) * pageSize + 1} 至 {Math.min(page * pageSize, total)} 条，共 {total} 条流水
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-secondary border border-border hover:bg-secondary/80 disabled:opacity-40 transition-opacity"
              >
                上一页
              </button>
              <span className="font-mono">
                {page} / {Math.ceil(total / pageSize)}
              </span>
              <button
                type="button"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg bg-secondary border border-border hover:bg-secondary/80 disabled:opacity-40 transition-opacity"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
