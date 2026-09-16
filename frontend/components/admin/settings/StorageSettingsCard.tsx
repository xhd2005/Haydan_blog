'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SiteSetting } from '@/lib/types';
import { toast } from '@/lib/toast';
import {
  HardDrive,
  Cloud,
  Loader2,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
  Activity,
  AlertCircle,
} from 'lucide-react';

interface StorageSettingsCardProps {
  initialSettings?: Partial<SiteSetting>;
  onSaved?: () => void;
}

export function StorageSettingsCard({ initialSettings, onSaved }: StorageSettingsCardProps) {
  const [storageType, setStorageType] = useState<'minio' | 'local'>('minio');
  const [minioEndpoint, setMinioEndpoint] = useState('');
  const [minioBucket, setMinioBucket] = useState('');
  const [minioAccessKey, setMinioAccessKey] = useState('');
  const [minioSecretKey, setMinioSecretKey] = useState('');
  const [minioPublicUrl, setMinioPublicUrl] = useState('');

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [testingMinio, setTestingMinio] = useState(false);
  const [minioTestResult, setMinioTestResult] = useState<{
    success: boolean;
    message: string;
    bucketExists?: boolean;
    latencyMs?: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      if (initialSettings.storageType === 'local' || initialSettings.storageType === 'minio') {
        setStorageType(initialSettings.storageType);
      }
      setMinioEndpoint(initialSettings.minioEndpoint || '');
      setMinioBucket(initialSettings.minioBucket || '');
      setMinioAccessKey(initialSettings.minioAccessKey || '');
      setMinioSecretKey(initialSettings.minioSecretKey || '');
      setMinioPublicUrl(initialSettings.minioPublicUrl || '');
    }
  }, [initialSettings]);

  const handleTestMinio = async () => {
    setTestingMinio(true);
    setMinioTestResult(null);
    try {
      const res = await api.testMinio({
        endpoint: minioEndpoint,
        bucket: minioBucket,
        accessKey: minioAccessKey,
        secretKey: minioSecretKey,
      });
      setMinioTestResult(res);
      if (res.success) {
        toast.success(`MinIO 连通成功！往返延迟 ${res.latencyMs || 0}ms`);
      } else {
        toast.error(res.message || 'MinIO 连通测试未通过');
      }
    } catch (err: any) {
      setMinioTestResult({ success: false, message: err.message || '连通性测试请求超时' });
      toast.error(err.message || '测试请求失败');
    } finally {
      setTestingMinio(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const payload: Partial<SiteSetting> = {
        storageType,
        minioEndpoint,
        minioBucket,
        minioAccessKey,
        minioSecretKey,
        minioPublicUrl,
      };

      await api.updateSettings(payload);
      setSaved(true);
      toast.success('对象存储基建配置已保存即时生效！');
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || '保存存储设置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden transition-all">
      {/* 头部与操作栏 */}
      <div className="p-6 border-b border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>MinIO / S3 分布式对象存储基建</span>
              {saved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  <CheckCircle className="w-3 h-3" /> 已即时生效
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              解耦单机磁盘，将全站图片、视频媒体直传 MinIO 集群，支持预签名直传与 CDN 公开直链
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleTestMinio}
            disabled={testingMinio}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {testingMinio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
            <span>{testingMinio ? '探测中...' : '测试连通性'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{loading ? '正在保存...' : '保存存储设置'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 text-xs">
        {/* 测试反馈状态提示 */}
        {minioTestResult && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
              minioTestResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {minioTestResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500" />
              )}
              <span>{minioTestResult.success ? 'MinIO 服务连通正常' : 'MinIO 服务连通失败'}</span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed">
              {minioTestResult.message}
              {minioTestResult.latencyMs !== undefined && ` · 往返延迟: ${minioTestResult.latencyMs}ms`}
              {minioTestResult.bucketExists !== undefined &&
                ` · Bucket 状态: ${minioTestResult.bucketExists ? '已就绪' : '不存在 / 待初始化'}`}
            </p>
          </div>
        )}

        {/* 存储模式选择 */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-900 dark:text-white">全局存储模式 (Storage Mode)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                storageType === 'minio'
                  ? 'border-cyan-500 bg-cyan-500/5 ring-1 ring-cyan-500/20'
                  : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="storageType"
                value="minio"
                checked={storageType === 'minio'}
                onChange={() => setStorageType('minio')}
                className="sr-only"
              />
              <Cloud className="w-5 h-5 text-cyan-500" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">MinIO / S3 云端对象存储 (推荐)</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">支持预签名直传，自动生成云端公开 URL</div>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                storageType === 'local'
                  ? 'border-cyan-500 bg-cyan-500/5 ring-1 ring-cyan-500/20'
                  : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="storageType"
                value="local"
                checked={storageType === 'local'}
                onChange={() => setStorageType('local')}
                className="sr-only"
              />
              <HardDrive className="w-5 h-5 text-slate-500" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">本地服务器磁盘存储 (Local)</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">保存在服务器本地 uploads/ 静态路径</div>
              </div>
            </label>
          </div>
        </div>

        {/* 凭据表单 */}
        <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">MinIO Endpoint (服务端点)</label>
              <input
                type="text"
                value={minioEndpoint}
                onChange={(e) => setMinioEndpoint(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                placeholder="如 http://49.233.166.212:9000 或 http://localhost:9000"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">S3 兼容服务端点协议与端口</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">Bucket (存储桶名称)</label>
              <input
                type="text"
                value={minioBucket}
                onChange={(e) => setMinioBucket(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                placeholder="hayden-blog"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">存储桶标识，系统可自动探测创建</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">Access Key (访问密钥)</label>
              <input
                type="text"
                value={minioAccessKey}
                onChange={(e) => setMinioAccessKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                placeholder="minio_y3Qiwz"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 dark:text-zinc-300">Secret Key (私有密钥)</label>
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="text-[11px] text-slate-500 hover:text-cyan-500 flex items-center gap-1 cursor-pointer"
                >
                  {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSecretKey ? '隐藏' : '显示'}</span>
                </button>
              </div>
              <input
                type={showSecretKey ? 'text' : 'password'}
                value={minioSecretKey}
                onChange={(e) => setMinioSecretKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                placeholder="minio_BmrdeC"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-zinc-300">CDN 外部公开访问直链前缀 (Public CDN URL)</label>
            <input
              type="text"
              value={minioPublicUrl}
              onChange={(e) => setMinioPublicUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
              placeholder="http://49.233.166.212:9000/hayden-blog 或留空自动拼接"
            />
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              前台展示与 Markdown 插入图片时的访问地址，留空时将基于 Endpoint 和 Bucket 自动生成。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
