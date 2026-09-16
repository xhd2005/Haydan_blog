'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

function AdminNowProxy() {
  const router = useRouter();

  useEffect(() => {
    // 此时此刻模块已跟随前台下线收敛，平滑重定向至控制台概览
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-slate-500 dark:text-zinc-400">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>此时此刻模块已下线收敛，正在重定向至控制台...</span>
      </div>
    </div>
  );
}

export default function AdminNowPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-slate-500 dark:text-zinc-400">
          <span>Loading...</span>
        </div>
      }
    >
      <AdminNowProxy />
    </Suspense>
  );
}
