'use client';

import React, { useState } from 'react';
import { getBaseUrl } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  Download,
  FileArchive,
  FileCode,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Database,
  Sparkles,
} from 'lucide-react';

export function ExportBackupCard() {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const baseUrl = getBaseUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('hayden_token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${baseUrl}/api/admin/export/posts-zip`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`导出失败: HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hayden_blog_posts_backup_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('博文 .zip 归档包已生成并启动下载！每篇 Markdown 均注入规范 YAML Frontmatter（Author: Hayden Xue）');
    } catch (err: any) {
      toast.error(err.message || '下载博文压缩包失败');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadJson = async () => {
    setDownloadingJson(true);
    try {
      const baseUrl = getBaseUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('hayden_token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${baseUrl}/api/admin/export/snapshot-json`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`快照导出失败: HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hayden_blog_snapshot_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('全站元数据 JSON 快照导出成功，数据资产已安全落地！');
    } catch (err: any) {
      toast.error(err.message || '下载全站 JSON 快照失败');
    } finally {
      setDownloadingJson(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden transition-all">
      {/* 头部 */}
      <div className="p-6 border-b border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>全站数据资产与 Markdown 离线备份中心</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                <ShieldCheck className="w-3 h-3" /> 资产主权
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              一键流式导出全站 Markdown 博文与核心元数据，符合规范的永久可迁移数据资产
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 博文 ZIP 导出 */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <FileArchive className="w-5 h-5 text-amber-500" />
                <span>全量博文 .zip 打包归档</span>
              </div>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed text-xs">
                使用 Java 25 原生流式 ZipOutputStream 实时打包。每篇文章生成独立标准 Markdown（.md）文件，头部注入标准 YAML Frontmatter（包含 title, slug, categories, tags, summary, cover 以及 author: &quot;Hayden Xue&quot;）。
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={downloadingZip}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {downloadingZip ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{downloadingZip ? '正在流式打包生成 .zip...' : '一键打包下载全部博文 (.zip)'}</span>
              </button>
            </div>
          </div>

          {/* 全站 JSON 元数据快照导出 */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <FileCode className="w-5 h-5 text-blue-500" />
                <span>全站核心元数据 JSON 快照</span>
              </div>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed text-xs">
                导出站点结构化元数据快照（包含文章、双语关联、分类目录、标签网络、开源造物、旅行足迹、流动心智与站点系统全局配置），适合离线迁移与系统版本镜像备份。
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadJson}
                disabled={downloadingJson}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {downloadingJson ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{downloadingJson ? '正在生成快照 JSON...' : '一键导出全站快照 (.json)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 规范保障说明 */}
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-start gap-2.5 leading-relaxed">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <strong>《Hayden Xue 工程准则》数字资产主权保障</strong>：导出的 Markdown 文件已完整解耦数据库依赖，可直接迁移至 Obsidian、Notion 或静态站点生成器（Astro, Hugo, Next.js）；所有 Frontmatter 均已校验站长 Hayden Xue 唯一署名。
          </div>
        </div>
      </div>
    </div>
  );
}
