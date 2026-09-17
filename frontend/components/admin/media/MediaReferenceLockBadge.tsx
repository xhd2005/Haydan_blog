'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Unlock, ExternalLink, ShieldCheck, FileText, MessageSquareQuote, Sliders } from 'lucide-react';
import { MediaReferenceInfo } from '@/lib/mediaReferenceTracker';

interface MediaReferenceLockBadgeProps {
  refInfo: MediaReferenceInfo;
}

export function MediaReferenceLockBadge({ refInfo }: MediaReferenceLockBadgeProps) {
  const [showPopover, setShowPopover] = useState(false);

  if (!refInfo.isLocked) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
        <Unlock className="w-2.5 h-2.5" />
        <span>未引用 (闲置)</span>
      </span>
    );
  }

  const totalCount =
    refInfo.usedInPosts.length + refInfo.usedInMemos.length + refInfo.usedInSettings.length;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowPopover(!showPopover);
        }}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 transition-colors"
      >
        <Lock className="w-2.5 h-2.5" />
        <span>在用锁定 ({totalCount})</span>
      </button>

      {showPopover && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-64 p-3 rounded-2xl bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xl text-xs space-y-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 border-b border-slate-100 dark:border-white/[0.05] pb-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>在用防删锁激活中</span>
          </div>

          <div className="space-y-1 text-[11px]">
            {refInfo.usedInPosts.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <FileText className="w-2.5 h-2.5" />
                  引用博文 ({refInfo.usedInPosts.length})
                </span>
                {refInfo.usedInPosts.slice(0, 3).map((p) => (
                  <div key={p.id} className="text-slate-700 dark:text-slate-300 truncate font-mono">
                    • {p.title}
                  </div>
                ))}
              </div>
            )}

            {refInfo.usedInMemos.length > 0 && (
              <div className="space-y-0.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <MessageSquareQuote className="w-2.5 h-2.5" />
                  引用随记 ({refInfo.usedInMemos.length})
                </span>
                {refInfo.usedInMemos.slice(0, 2).map((m) => (
                  <div key={m.id} className="text-slate-700 dark:text-slate-300 truncate">
                    • {m.summary}
                  </div>
                ))}
              </div>
            )}

            {refInfo.usedInSettings.length > 0 && (
              <div className="space-y-0.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Sliders className="w-2.5 h-2.5" />
                  系统配置引用
                </span>
                {refInfo.usedInSettings.map((s, idx) => (
                  <div key={idx} className="text-slate-700 dark:text-slate-300 truncate">
                    • {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-1.5 border-t border-slate-100 dark:border-white/[0.05] text-[10px] text-rose-500 font-medium">
            防死链安全守卫：必须先从引用处移除方可删除
          </div>
        </div>
      )}
    </div>
  );
}
