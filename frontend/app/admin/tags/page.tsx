'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

function AdminTagsProxy() {
  const router = useRouter();

  useEffect(() => {
    // 平滑平移至知识分类工作台标签矩阵 Tab，保留历史外部链接 100% 兼容无感知且无 404
    router.replace('/admin/categories?tab=tags');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-slate-500 dark:text-zinc-400">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>正在接入知识分类工作台 (标签矩阵)...</span>
      </div>
    </div>
  );
}

export default function AdminTagsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500 dark:text-zinc-400 font-mono">
          正在载入知识分类工作台 (标签矩阵)...
        </div>
      }
    >
      <AdminTagsProxy />
    </Suspense>
  );
}
