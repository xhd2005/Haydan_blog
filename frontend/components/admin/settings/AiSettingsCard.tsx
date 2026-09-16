'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SiteSetting, AiProviderConfig } from '@/lib/types';
import { toast } from '@/lib/toast';
import {
  Bot,
  Server,
  Sparkles,
  Zap,
  Check,
  Trash2,
  Plus,
  Loader2,
  Save,
  CheckCircle,
} from 'lucide-react';

const DEFAULT_AI_PROVIDERS: AiProviderConfig[] = [
  {
    id: 'deepseek-official',
    name: 'DeepSeek 官方 API (主力推荐)',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    apiKey: 'sk-093756b2a2e345a4bd34571cc816b0b9',
    models: ['deepseek-flash', 'deepseek-v4-pro'],
    defaultModel: 'deepseek-flash',
    enabled: true,
    isDefault: true,
    status: 'untested',
  },
  {
    id: 'sensenova-fleet',
    name: '商汤日日新 (SenseNova)',
    provider: 'sensenova',
    baseUrl: 'https://token.sensenova.cn/v1',
    apiKey: '',
    models: ['deepseek-v4-flash', 'deepseek-v4-pro', 'sensenova-6.8-flash-lite'],
    defaultModel: 'deepseek-v4-flash',
    enabled: true,
    isDefault: false,
    status: 'untested',
  },
  {
    id: 'siliconflow-fleet',
    name: '硅基流动 (SiliconFlow)',
    provider: 'siliconflow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: '',
    models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'],
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    enabled: false,
    isDefault: false,
    status: 'untested',
  },
];

interface AiSettingsCardProps {
  initialSettings?: Partial<SiteSetting>;
  onSaved?: () => void;
}

export function AiSettingsCard({ initialSettings, onSaved }: AiSettingsCardProps) {
  const [aiEnabled, setAiEnabled] = useState(1);
  const [aiProviders, setAiProviders] = useState<AiProviderConfig[]>(DEFAULT_AI_PROVIDERS);
  const [aiSystemPrompt, setAiSystemPrompt] = useState('');
  const [readerDailyAiQuota, setReaderDailyAiQuota] = useState(15);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      if (initialSettings.aiEnabled !== undefined) {
        setAiEnabled(initialSettings.aiEnabled);
      }
      if (initialSettings.readerDailyAiQuota !== undefined) {
        setReaderDailyAiQuota(initialSettings.readerDailyAiQuota);
      }
      if (initialSettings.aiSystemPrompt) {
        setAiSystemPrompt(initialSettings.aiSystemPrompt);
      }
      if (initialSettings.aiProvidersJson) {
        try {
          const parsed = JSON.parse(initialSettings.aiProvidersJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAiProviders(parsed);
          }
        } catch {}
      } else if (initialSettings.aiApiKey) {
        const initial = [...DEFAULT_AI_PROVIDERS];
        if (initialSettings.aiApiKey !== 'sk-093756b2a2e345a4bd34571cc816b0b9') {
          initial[1].apiKey = initialSettings.aiApiKey;
        }
        setAiProviders(initial);
      }
    }
  }, [initialSettings]);

  const handleTestProvider = async (provider: AiProviderConfig) => {
    if (!provider.baseUrl || !provider.apiKey) {
      toast.error(`请先填写 ${provider.name} 的 Base URL 与 API Key`);
      return;
    }
    setTestingProviderId(provider.id);
    try {
      const res = await api.testAiProvider({
        provider: provider.provider,
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        model: provider.defaultModel || provider.models[0],
      });
      setAiProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id
            ? {
                ...p,
                latencyMs: res.latencyMs,
                status: res.success ? 'online' : 'offline',
                models: res.availableModels?.length ? res.availableModels : p.models,
              }
            : p
        )
      );
      if (res.success) {
        toast.success(`${provider.name} 连通探测成功！延迟 ${res.latencyMs}ms`);
      } else {
        toast.error(`${provider.name} 探测失败: ${res.message}`);
      }
    } catch (err: any) {
      setAiProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, status: 'offline' } : p))
      );
      toast.error(`${provider.name} 探测异常: ${err?.message || '网络连接超时'}`);
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleSetDefaultProvider = (id: string) => {
    setAiProviders((prev) =>
      prev.map((p) => ({
        ...p,
        isDefault: p.id === id,
        enabled: p.id === id ? true : p.enabled,
      }))
    );
    const target = aiProviders.find((p) => p.id === id);
    if (target) {
      toast.success(`已将「${target.name}」设为主力大模型`);
    }
  };

  const handleToggleProviderEnabled = (id: string, enabled: boolean) => {
    setAiProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled } : p))
    );
  };

  const handleDeleteProvider = (id: string) => {
    if (aiProviders.length <= 1) {
      toast.error('至少需要保留一个 AI 服务商配置');
      return;
    }
    const target = aiProviders.find((p) => p.id === id);
    const remaining = aiProviders.filter((p) => p.id !== id);
    if (target?.isDefault && remaining.length > 0) {
      remaining[0].isDefault = true;
      remaining[0].enabled = true;
    }
    setAiProviders(remaining);
    toast.success(`已移除服务商「${target?.name || id}」`);
  };

  const handleAddProvider = (template: 'deepseek' | 'sensenova' | 'siliconflow' | 'custom') => {
    const id = `provider-${Date.now()}`;
    let newProvider: AiProviderConfig;
    if (template === 'deepseek') {
      newProvider = {
        id,
        name: 'DeepSeek 官方 API (新增)',
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
        apiKey: '',
        models: ['deepseek-flash', 'deepseek-v4-pro'],
        defaultModel: 'deepseek-flash',
        enabled: true,
        isDefault: false,
        status: 'untested',
      };
    } else if (template === 'sensenova') {
      newProvider = {
        id,
        name: '商汤日日新 (SenseNova 新增)',
        provider: 'sensenova',
        baseUrl: 'https://token.sensenova.cn/v1',
        apiKey: '',
        models: ['deepseek-v4-flash', 'deepseek-v4-pro', 'sensenova-6.8-flash-lite'],
        defaultModel: 'deepseek-v4-flash',
        enabled: true,
        isDefault: false,
        status: 'untested',
      };
    } else if (template === 'siliconflow') {
      newProvider = {
        id,
        name: '硅基流动 (SiliconFlow 新增)',
        provider: 'siliconflow',
        baseUrl: 'https://api.siliconflow.cn/v1',
        apiKey: '',
        models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'],
        defaultModel: 'deepseek-ai/DeepSeek-V3',
        enabled: true,
        isDefault: false,
        status: 'untested',
      };
    } else {
      newProvider = {
        id,
        name: '自定义 OpenAI 兼容服务商',
        provider: 'custom',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        models: ['gpt-4o-mini', 'gpt-4o'],
        defaultModel: 'gpt-4o-mini',
        enabled: true,
        isDefault: false,
        status: 'untested',
      };
    }
    setAiProviders((prev) => [...prev, newProvider]);
    toast.success(`已添加「${newProvider.name}」`);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const activeProvider = aiProviders.find((p) => p.isDefault && p.enabled) || aiProviders[0];
      const payload: Partial<SiteSetting> = {
        aiEnabled,
        readerDailyAiQuota: Number(readerDailyAiQuota) || 15,
        aiProvidersJson: JSON.stringify(aiProviders),
        aiBaseUrl: activeProvider?.baseUrl || '',
        aiModel: activeProvider?.defaultModel || '',
        aiApiKey: activeProvider?.apiKey || '',
        aiSystemPrompt,
      };

      await api.updateSettings(payload);
      setSaved(true);
      toast.success(`AI 外脑配置已保存即时生效！读者每日配额：${readerDailyAiQuota} 次/天`);
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || '保存 AI 设置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden transition-all">
      {/* 头部与保存操作 */}
      <div className="p-6 border-b border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>AI 智能体与推理集群 (SenseNova / DeepSeek)</span>
              {saved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  <CheckCircle className="w-3 h-3" /> 即时生效
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              纳管商汤日日新、DeepSeek 官方 API 等多模型推理集群，支持实时毫秒级探活与系统人设
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{loading ? '正在保存...' : '保存 AI 设置'}</span>
        </button>
      </div>

      <div className="p-6 space-y-6 text-xs">
        {/* 全局开关与快捷添加 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aiEnabled === 1}
                onChange={(e) => setAiEnabled(e.target.checked ? 1 : 0)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">前台 AI 伴读与外脑中枢开关</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">开启后前台支持 Cmd+J 伴读抽屉与独立 /ai 外脑全景中枢访问</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddProvider('deepseek')}
              className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ DeepSeek</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddProvider('sensenova')}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ 商汤日日新</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddProvider('siliconflow')}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ 硅基流动</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddProvider('custom')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-300 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ 自定义 API</span>
            </button>
          </div>
        </div>

        {/* 访问安全与每日配额限制策略 */}
        <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <Zap className="w-4 h-4 text-purple-500" />
              <span>全站 AI 额度配给与未登录防刷准则</span>
            </div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[11px] font-bold">
              <span>当前策略：读者 {readerDailyAiQuota} 次/天 · 未登录阻断 · 站长无限额</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 dark:text-zinc-300">
                  普通读者每日配额上限 (次/天)
                </label>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{readerDailyAiQuota} 次</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={1}
                value={readerDailyAiQuota}
                onChange={(e) => setReaderDailyAiQuota(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                登录读者每日可调用的 AI 伴读与问答次数。前台助手窗口实时显示剩余额度。
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-purple-500/10 space-y-1 text-[11px]">
              <div className="font-semibold text-slate-800 dark:text-zinc-200">全站三级阶梯安全防护体系</div>
              <ul className="space-y-0.5 text-slate-500 dark:text-zinc-400 list-disc list-inside">
                <li><strong className="text-rose-500">未登录访客</strong>：完全禁止调用大模型推理，点击自动引导登录</li>
                <li><strong className="text-purple-500">注册读者</strong>：滑动窗口限频 + 每日 {readerDailyAiQuota} 次专属伴读额度</li>
                <li><strong className="text-emerald-500">站长 (Hayden Xue)</strong>：全天候不限次、不限频与超长上下文豁免</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 服务商纳管池列表 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-purple-500" />
              <span>服务商纳管池 ({aiProviders.length})</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
              设为主力的服务商将即时接管全站 RAG 问答与流式伴读
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {aiProviders.map((provider) => {
              const isTesting = testingProviderId === provider.id;
              const isPrimary = provider.isDefault;

              return (
                <div
                  key={provider.id}
                  className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border transition-all ${
                    isPrimary
                      ? 'border-purple-500/60 shadow-md shadow-purple-500/5 ring-1 ring-purple-500/20'
                      : 'border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase ${
                          provider.provider === 'deepseek'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : provider.provider === 'sensenova'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                              : provider.provider === 'siliconflow'
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                                : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-zinc-300 border border-slate-200'
                        }`}
                      >
                        {provider.provider}
                      </span>

                      <input
                        type="text"
                        value={provider.name}
                        onChange={(e) =>
                          setAiProviders((prev) =>
                            prev.map((p) => (p.id === provider.id ? { ...p, name: e.target.value } : p))
                          )
                        }
                        className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:outline-none px-1 text-xs"
                      />

                      {isPrimary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-semibold">
                          <Sparkles className="w-3 h-3" />
                          <span>当前主力</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                          provider.status === 'online'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : provider.status === 'offline'
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                              : 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            provider.status === 'online'
                              ? 'bg-emerald-500 animate-pulse'
                              : provider.status === 'offline'
                                ? 'bg-rose-500'
                                : 'bg-slate-400'
                          }`}
                        />
                        <span>
                          {provider.status === 'online'
                            ? `在线 ${provider.latencyMs ? `· ${provider.latencyMs}ms` : ''}`
                            : provider.status === 'offline'
                              ? '异常 / 离线'
                              : '未探测'}
                        </span>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer ml-1" title="启用/停用">
                        <input
                          type="checkbox"
                          checked={provider.enabled}
                          onChange={(e) => handleToggleProviderEnabled(provider.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-slate-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                    <div className="space-y-1">
                      <label className="font-medium text-slate-700 dark:text-zinc-300">Base URL</label>
                      <input
                        type="text"
                        value={provider.baseUrl}
                        onChange={(e) =>
                          setAiProviders((prev) =>
                            prev.map((p) => (p.id === provider.id ? { ...p, baseUrl: e.target.value } : p))
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-slate-700 dark:text-zinc-300">API Key</label>
                      <input
                        type="password"
                        value={provider.apiKey || ''}
                        onChange={(e) =>
                          setAiProviders((prev) =>
                            prev.map((p) => (p.id === provider.id ? { ...p, apiKey: e.target.value } : p))
                          )
                        }
                        placeholder="sk-..."
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="font-medium text-slate-700 dark:text-zinc-300">主力推理模型 (Default Model)</label>
                      <input
                        type="text"
                        value={provider.defaultModel || ''}
                        onChange={(e) =>
                          setAiProviders((prev) =>
                            prev.map((p) => (p.id === provider.id ? { ...p, defaultModel: e.target.value } : p))
                          )
                        }
                        placeholder="deepseek-flash"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-slate-700 dark:text-zinc-300">可用模型池 (逗号分隔)</label>
                      <input
                        type="text"
                        value={(provider.models || []).join(', ')}
                        onChange={(e) => {
                          const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          setAiProviders((prev) =>
                            prev.map((p) => (p.id === provider.id ? { ...p, models: list } : p))
                          );
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestProvider(provider)}
                        disabled={isTesting || !provider.apiKey}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        <span>{isTesting ? '探测中...' : '测试连通性'}</span>
                      </button>

                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultProvider(provider.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-white/[0.08] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-purple-500" />
                          <span>设为主力模型</span>
                        </button>
                      )}
                    </div>

                    {aiProviders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="删除该服务商"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 系统人设与提示词 */}
        <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="font-semibold text-slate-900 dark:text-white">Hayden AI 数字分身全局人设与系统提示词 (System Prompt)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            定义伴读助手的思考基调、第一人称视角与回答规范，站内博文与真实足迹将在此基础上通过 RAG 自动拼合
          </p>
          <textarea
            value={aiSystemPrompt}
            onChange={(e) => setAiSystemPrompt(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs leading-relaxed focus:border-purple-500 focus:outline-none"
            placeholder="设定 Hayden AI 的对话风格、知识领域和座右铭..."
          />
        </div>
      </div>
    </div>
  );
}
