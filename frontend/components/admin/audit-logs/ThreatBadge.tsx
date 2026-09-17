'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, Bug, Terminal } from 'lucide-react';
import { ThreatType, RiskLevel } from '@/lib/auditThreatDetection';

interface ThreatBadgeProps {
  threatType: ThreatType | string | null;
  riskLevel?: RiskLevel;
  matchedPattern?: string;
  size?: 'sm' | 'md';
}

export function ThreatBadge({
  threatType,
  riskLevel = 'HIGH',
  matchedPattern,
  size = 'sm',
}: ThreatBadgeProps) {
  if (!threatType) return null;

  let label = '安全威胁';
  let Icon = ShieldAlert;

  switch (threatType) {
    case 'PATH_TRAVERSAL':
      label = '路径遍历探测';
      Icon = AlertTriangle;
      break;
    case 'SQL_INJECTION':
      label = 'SQL 注入攻击';
      Icon = Bug;
      break;
    case 'SENSITIVE_PROBE':
      label = '敏感探针扫描';
      Icon = ShieldAlert;
      break;
    case 'MALICIOUS_SCANNER':
      label = '黑客扫描工具';
      Icon = Terminal;
      break;
    case 'ANOMALOUS_STATUS':
      label = '异常探测响应';
      Icon = AlertTriangle;
      break;
    default:
      label = String(threatType);
  }

  const isCritical = riskLevel === 'CRITICAL';

  return (
    <span
      title={matchedPattern ? `匹配特征: ${matchedPattern} (${riskLevel})` : `${label} (${riskLevel})`}
      className={`inline-flex items-center gap-1 font-mono font-bold rounded-lg border transition-all select-none ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${
        isCritical
          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.35)] animate-pulse'
          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
      }`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 text-rose-500' : 'w-3.5 h-3.5 text-rose-500'} />
      <span>{label}</span>
      {matchedPattern && (
        <span className="hidden sm:inline opacity-70 text-[9px] max-w-[90px] truncate">
          {matchedPattern}
        </span>
      )}
    </span>
  );
}
