'use client';

import React from 'react';
import { 
  Database, 
  Zap, 
  Cloud, 
  Cpu, 
  Bot, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Activity
} from 'lucide-react';
import { MiddlewareHealthStatus, MiddlewareServiceInfo } from '@/lib/middlewareHealthCheck';

interface MiddlewareHealthCapsulesProps {
  health: MiddlewareHealthStatus;
  isPinging?: boolean;
  onRefreshAll: () => void;
}

function getServiceIcon(key: MiddlewareServiceInfo['key']) {
  switch (key) {
    case 'database':
      return Database;
    case 'redis':
      return Zap;
    case 'minio':
      return Cloud;
    case 'aiService':
      return Bot;
    case 'systemResource':
      return Cpu;
    default:
      return Activity;
  }
}

function getStatusIndicator(status: MiddlewareServiceInfo['status'], latencyMs: number) {
  if (status === 'DOWN') {
    return {
      dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
      textColor: 'text-rose-600 dark:text-rose-400',
      badgeClass: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold',
      text: '离线 (DOWN)',
    };
  }
  if (status === 'SLOW' || latencyMs > 100) {
    return {
      dotColor: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
      textColor: 'text-amber-600 dark:text-amber-400',
      badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
      text: '延迟较高 (SLOW)',
    };
  }
  return {
    dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold',
    text: '健康 (UP)',
  };
}

export function MiddlewareHealthCapsules({
  health,
  isPinging = false,
  onRefreshAll,
}: MiddlewareHealthCapsulesProps) {
  const services = Object.values(health);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-500" />
          <h3 className="font-bold text-slate-900 dark:text-white text-xs">
            核心中间件与关键服务延迟悬浮探活
          </h3>
        </div>
        <button
          type="button"
          onClick={onRefreshAll}
          disabled={isPinging}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
          <span>{isPinging ? '测速探活中...' : '并发测速探活'}</span>
        </button>
      </div>

      {/* 五大胶囊卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {services.map((item) => {
          const Icon = getServiceIcon(item.key);
          const indicator = getStatusIndicator(item.status, item.latencyMs);

          return (
            <div
              key={item.key}
              className="p-3.5 rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all hover:border-cyan-500/30 group relative overflow-hidden"
            >
              {/* 顶部指示行 */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-black/40 text-slate-700 dark:text-zinc-300 group-hover:text-cyan-500 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className={`w-2 h-2 rounded-full ${indicator.dotColor} animate-pulse`} />
                  <span className={`font-bold ${indicator.textColor}`}>
                    {item.latencyMs}ms
                  </span>
                </div>
              </div>

              {/* 中间标题与角色 */}
              <div className="space-y-0.5 mb-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {item.name}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                  {item.role}
                </p>
              </div>

              {/* 底部详细指标 */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                <span className={`px-1.5 py-0.2 rounded border ${indicator.badgeClass}`}>
                  {item.status}
                </span>
                <span className="truncate max-w-[90px]">
                  {item.details ? String(Object.values(item.details)[0]) : 'Normal'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
