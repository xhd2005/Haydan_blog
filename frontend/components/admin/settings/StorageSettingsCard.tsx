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
  AlertCircle,
  Server,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface StorageSettingsCardProps {
  initialSettings?: Partial<SiteSetting>;
  onSaved?: () => void;
}

const ALIYUN_REGIONS = [
  { label: '华北2 (北京)', endpoint: 'https://oss-cn-beijing.aliyuncs.com', id: 'cn-beijing' },
  { label: '华东1 (杭州)', endpoint: 'https://oss-cn-hangzhou.aliyuncs.com', id: 'cn-hangzhou' },
  { label: '华东2 (上海)', endpoint: 'https://oss-cn-shanghai.aliyuncs.com', id: 'cn-shanghai' },
  { label: '华南1 (深圳)', endpoint: 'https://oss-cn-shenzhen.aliyuncs.com', id: 'cn-shenzhen' },
  { label: '华南3 (广州)', endpoint: 'https://oss-cn-guangzhou.aliyuncs.com', id: 'cn-guangzhou' },
  { label: '西南1 (成都)', endpoint: 'https://oss-cn-chengdu.aliyuncs.com', id: 'cn-chengdu' },
  { label: '中国香港', endpoint: 'https://oss-cn-hongkong.aliyuncs.com', id: 'cn-hongkong' },
  { label: '华北1 (青岛)', endpoint: 'https://oss-cn-qingdao.aliyuncs.com', id: 'cn-qingdao' },
  { label: '华北3 (张家口)', endpoint: 'https://oss-cn-zhangjiakou.aliyuncs.com', id: 'cn-zhangjiakou' },
];

export function StorageSettingsCard({ initialSettings, onSaved }: StorageSettingsCardProps) {
  const [storageType, setStorageType] = useState<'local' | 'minio' | 'oss'>('oss');

  // MinIO 配置字段
  const [minioEndpoint, setMinioEndpoint] = useState('');
  const [minioBucket, setMinioBucket] = useState('');
  const [minioAccessKey, setMinioAccessKey] = useState('');
  const [minioSecretKey, setMinioSecretKey] = useState('');
  const [minioPublicUrl, setMinioPublicUrl] = useState('');
  const [showMinioSecretKey, setShowMinioSecretKey] = useState(false);
  const [testingMinio, setTestingMinio] = useState(false);
  const [minioTestResult, setMinioTestResult] = useState<{
    success: boolean;
    message: string;
    bucketExists?: boolean;
    latencyMs?: number;
  } | null>(null);

  // 阿里云 OSS 专属配置字段
  const [ossEndpoint, setOssEndpoint] = useState('https://oss-cn-beijing.aliyuncs.com');
  const [ossBucket, setOssBucket] = useState('');
  const [ossAccessKey, setOssAccessKey] = useState('');
  const [ossSecretKey, setOssSecretKey] = useState('');
  const [ossPublicUrl, setOssPublicUrl] = useState('');
  const [showOssSecretKey, setShowOssSecretKey] = useState(false);
  const [testingOss, setTestingOss] = useState(false);
  const [ossTestResult, setOssTestResult] = useState<{
    success: boolean;
    message: string;
    bucketExists?: boolean;
    latencyMs?: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      if (initialSettings.storageType === 'local' || initialSettings.storageType === 'minio' || initialSettings.storageType === 'oss') {
        setStorageType(initialSettings.storageType as any);
      }
      // 回填 MinIO
      setMinioEndpoint(initialSettings.minioEndpoint || '');
      setMinioBucket(initialSettings.minioBucket || '');
      setMinioAccessKey(initialSettings.minioAccessKey || '');
      setMinioSecretKey(initialSettings.minioSecretKey || '');
      setMinioPublicUrl(initialSettings.minioPublicUrl || '');

      // 回填 阿里云 OSS
      if (initialSettings.ossEndpoint) setOssEndpoint(initialSettings.ossEndpoint);
      if (initialSettings.ossBucket) setOssBucket(initialSettings.ossBucket);
      if (initialSettings.ossAccessKey) setOssAccessKey(initialSettings.ossAccessKey);
      if (initialSettings.ossSecretKey) setOssSecretKey(initialSettings.ossSecretKey);
      if (initialSettings.ossPublicUrl) setOssPublicUrl(initialSettings.ossPublicUrl);
    }
  }, [initialSettings]);

  // 自动拼接推荐的阿里云 OSS Bucket 访问域名
  const handleAutoGenerateOssUrl = () => {
    if (!ossBucket.trim()) {
      toast.error('请先输入存储空间 (Bucket) 名称');
      return;
    }
    const cleanEp = ossEndpoint.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const genUrl = `https://${ossBucket.trim()}.${cleanEp}`;
    setOssPublicUrl(genUrl);
    toast.success('已自动拼装官方外网访问直链！');
  };

  // 测试 MinIO 连通性
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
      setMinioTestResult({ success: false, message: err.message || '连通性测试超时' });
      toast.error(err.message || '测试请求失败');
    } finally {
      setTestingMinio(false);
    }
  };

  // 测试 阿里云 OSS 连通性
  const handleTestOss = async () => {
    setTestingOss(true);
    setOssTestResult(null);
    try {
      const res = await api.testOss({
        endpoint: ossEndpoint,
        bucket: ossBucket,
        accessKey: ossAccessKey,
        secretKey: ossSecretKey,
      });
      setOssTestResult(res);
      if (res.success) {
        toast.success(`阿里云 OSS 连通成功！往返延迟 ${res.latencyMs || 0}ms`);
      } else {
        toast.error(res.message || '阿里云 OSS 连通测试未通过');
      }
    } catch (err: any) {
      setOssTestResult({ success: false, message: err.message || '连通性测试超时' });
      toast.error(err.message || '测试请求失败');
    } finally {
      setTestingOss(false);
    }
  };

  // 保存所有存储配置
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
        ossEndpoint,
        ossBucket,
        ossAccessKey,
        ossSecretKey,
        ossPublicUrl,
      };

      await api.updateSettings(payload);
      setSaved(true);
      toast.success('存储基建配置已保存并即时生效！');
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
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>全站对象存储与多媒体基建</span>
              {saved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  <CheckCircle className="w-3 h-3" /> 已即时生效
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              解耦单机文件存储，支持本地磁盘、自建 MinIO 集群与阿里云 OSS 独立配置与平滑切换
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {storageType === 'oss' && (
            <button
              type="button"
              onClick={handleTestOss}
              disabled={testingOss}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {testingOss ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{testingOss ? '探测中...' : '测试 OSS 连通性'}</span>
            </button>
          )}

          {storageType === 'minio' && (
            <button
              type="button"
              onClick={handleTestMinio}
              disabled={testingMinio}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {testingMinio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
              <span>{testingMinio ? '探测中...' : '测试 MinIO 连通性'}</span>
            </button>
          )}

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
        {/* 连通测试反馈 (阿里云 OSS) */}
        {storageType === 'oss' && ossTestResult && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
              ossTestResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {ossTestResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500" />
              )}
              <span>{ossTestResult.success ? '阿里云 OSS 连通正常' : '阿里云 OSS 连通失败'}</span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed">
              {ossTestResult.message}
              {ossTestResult.latencyMs !== undefined && ` · 往返延迟: ${ossTestResult.latencyMs}ms`}
            </p>
          </div>
        )}

        {/* 连通测试反馈 (MinIO) */}
        {storageType === 'minio' && minioTestResult && (
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
            </p>
          </div>
        )}

        {/* 存储模式选择（三选一独立卡片） */}
        <div className="space-y-2">
          <label className="font-semibold text-slate-900 dark:text-white">选择生效存储后端 (Storage Mode)</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 阿里云 OSS 模式 */}
            <label
              className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between gap-3 transition-all ${
                storageType === 'oss'
                  ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">阿里云 OSS</span>
                </div>
                <input
                  type="radio"
                  name="storageType"
                  value="oss"
                  checked={storageType === 'oss'}
                  onChange={() => setStorageType('oss')}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                阿里云官方对象存储，全国节点极速公网分发，大图秒开
              </p>
            </label>

            {/* 自建 MinIO 模式 */}
            <label
              className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between gap-3 transition-all ${
                storageType === 'minio'
                  ? 'border-cyan-500 bg-cyan-500/5 ring-1 ring-cyan-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <Server className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">自建 MinIO</span>
                </div>
                <input
                  type="radio"
                  name="storageType"
                  value="minio"
                  checked={storageType === 'minio'}
                  onChange={() => setStorageType('minio')}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                私有化 Docker / 集群部署，兼容 S3 协议，自主可控
              </p>
            </label>

            {/* 本地存储模式 */}
            <label
              className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between gap-3 transition-all ${
                storageType === 'local'
                  ? 'border-slate-500 bg-slate-500/5 ring-1 ring-slate-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">本地服务器磁盘</span>
                </div>
                <input
                  type="radio"
                  name="storageType"
                  value="local"
                  checked={storageType === 'local'}
                  onChange={() => setStorageType('local')}
                  className="w-4 h-4 text-slate-600 focus:ring-slate-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                保存在应用所在机器的 uploads/ 目录，无需任何额外配置
              </p>
            </label>
          </div>
        </div>

        {/* 阿里云 OSS 专有表单 */}
        {storageType === 'oss' && (
          <div className="space-y-4 pt-3 border-t border-slate-200/60 dark:border-white/[0.04] animate-fadeIn">
            <div className="flex items-center justify-between pb-1">
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Cloud className="w-4 h-4" />
                <span>阿里云 OSS 专属参数配置</span>
              </span>
              <span className="text-[11px] text-slate-400">独立保存，不与 MinIO 互相覆盖</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Endpoint 地域节点（下拉快捷选 + 自定义输入） */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700 dark:text-zinc-300">
                    地域节点 (Endpoint)
                  </label>
                  <div className="relative inline-block text-[11px]">
                    <select
                      onChange={(e) => {
                        if (e.target.value) setOssEndpoint(e.target.value);
                      }}
                      className="bg-transparent text-amber-600 dark:text-amber-400 font-medium cursor-pointer focus:outline-none border-b border-dashed border-amber-500/50 pb-0.5"
                    >
                      <option value="">快捷选择地域...</option>
                      {ALIYUN_REGIONS.map((r) => (
                        <option key={r.id} value={r.endpoint}>
                          {r.label} - {r.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  type="text"
                  value={ossEndpoint}
                  onChange={(e) => setOssEndpoint(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="https://oss-cn-beijing.aliyuncs.com"
                />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  对应 Bucket 概览中的【地域节点 (Endpoint)】，须带上 https://
                </p>
              </div>

              {/* Bucket 空间名称 */}
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">
                  存储空间名称 (Bucket Name)
                </label>
                <input
                  type="text"
                  value={ossBucket}
                  onChange={(e) => setOssBucket(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="例如: hayden-blog"
                />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  在阿里云 OSS 控制台创建的 Bucket 英文标识
                </p>
              </div>
            </div>

            {/* AccessKey ID & Secret */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">
                  RAM AccessKey ID
                </label>
                <input
                  type="text"
                  value={ossAccessKey}
                  onChange={(e) => setOssAccessKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="LTAI5tJtoKue65dgZByqfkfe"
                />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  建议使用拥有 AliyunOSSFullAccess 权限的 RAM 子用户密钥
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700 dark:text-zinc-300">
                    AccessKey Secret
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowOssSecretKey(!showOssSecretKey)}
                    className="text-[11px] text-slate-500 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
                  >
                    {showOssSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showOssSecretKey ? '隐藏' : '显示'}</span>
                  </button>
                </div>
                <input
                  type={showOssSecretKey ? 'text' : 'password'}
                  value={ossSecretKey}
                  onChange={(e) => setOssSecretKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="输入子用户的 AccessKey Secret"
                />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  留空保存时将保留已有密钥，安全隐蔽
                </p>
              </div>
            </div>

            {/* 公开访问 URL (Public URL) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 dark:text-zinc-300">
                  外网访问域名 (Bucket 域名 / CDN 自定义域名)
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateOssUrl}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>智能拼装推荐域名</span>
                </button>
              </div>
              <input
                type="text"
                value={ossPublicUrl}
                onChange={(e) => setOssPublicUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                placeholder="https://hayden-blog.oss-cn-beijing.aliyuncs.com"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                前台博文图片与封面加载地址；若绑定了 CDN 域名也可直接填写 CDN 域名（如 https://oss.yourdomain.com）
              </p>
            </div>
          </div>
        )}

        {/* 自建 MinIO 专有表单 */}
        {storageType === 'minio' && (
          <div className="space-y-4 pt-3 border-t border-slate-200/60 dark:border-white/[0.04] animate-fadeIn">
            <div className="flex items-center justify-between pb-1">
              <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Server className="w-4 h-4" />
                <span>自建 MinIO 集群参数配置</span>
              </span>
              <span className="text-[11px] text-slate-400">独立保存，不与阿里云 OSS 互相覆盖</span>
            </div>

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
                    onClick={() => setShowMinioSecretKey(!showMinioSecretKey)}
                    className="text-[11px] text-slate-500 hover:text-cyan-500 flex items-center gap-1 cursor-pointer"
                  >
                    {showMinioSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showMinioSecretKey ? '隐藏' : '显示'}</span>
                  </button>
                </div>
                <input
                  type={showMinioSecretKey ? 'text' : 'password'}
                  value={minioSecretKey}
                  onChange={(e) => setMinioSecretKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  placeholder="输入 MinIO 密码密钥"
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
        )}

        {/* 本地存储模式说明 */}
        {storageType === 'local' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/[0.04] text-slate-600 dark:text-zinc-400 space-y-1 animate-fadeIn">
            <p className="font-semibold text-slate-800 dark:text-zinc-200">ℹ️ 本地文件存储模式已就绪</p>
            <p className="text-[11px] leading-relaxed">
              文件将直接保存在服务器的 <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white">uploads/</code> 物理目录中，并通过 Nginx / 静态映射对外提供服务。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
