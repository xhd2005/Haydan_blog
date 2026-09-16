'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

function AdminTimelineProxy() {
  const router = useRouter();

  useEffect(() => {
    // 平滑平移至履历与造物工作台 timeline Tab，保留历史外部链接 100% 兼容无感知且无 404
    router.replace('/admin/projects?tab=timeline');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-slate-500 dark:text-zinc-400">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>正在接入履历与造物工作台 (成长编年史)...</span>
      </div>
    </div>
  );
}

export default function AdminTimelinePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500 dark:text-zinc-400 font-mono">
          正在载入履历与造物工作台 (成长编年史)...
        </div>
      }
    >
      <AdminTimelineProxy />
    </Suspense>
  );
}
