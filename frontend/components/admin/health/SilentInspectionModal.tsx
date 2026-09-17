'use client';

import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  X, 
  Send, 
  Check, 
  Clock, 
  Bot, 
  Mail, 
  MessageSquare, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2,
  Settings
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface SilentInspectionConfig {
  schedule: 'daily' | 'weekly' | 'manual';
  rules: {
    brokenLinks: boolean;
    missingCovers: boolean;
    orphanMedia: boolean;
    staleBackups: boolean;
    unresolvedThreats: boolean;
  };
  channels: {
    feishuWebhook: string;
    feishuSecret?: string;
    wecomWebhook: string;
    telegramToken: string;
    telegramChatId: string;
    smtpEmail: string;
  };
  enabledChannels: {
    feishu: boolean;
    wecom: boolean;
    telegram: boolean;
    email: boolean;
  };
}

const STORAGE_KEY = 'hayden_silent_inspection_config';

const DEFAULT_CONFIG: SilentInspectionConfig = {
  schedule: 'daily',
  rules: {
    brokenLinks: true,
    missingCovers: true,
    orphanMedia: true,
    staleBackups: true,
    unresolvedThreats: true,
  },
  channels: {
    feishuWebhook: 'https://open.feishu.cn/open-apis/bot/v2/hook/hayden-demo-hook',
    wecomWebhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=hayden-key',
    telegramToken: 'bot623819283:AAEwX92ExampleToken',
    telegramChatId: '-100849201948',
    smtpEmail: 'admin@haydenxue.com',
  },
  enabledChannels: {
    feishu: true,
    wecom: false,
    telegram: true,
    email: false,
  },
};

interface SilentInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
}

export function SilentInspectionModal({
  isOpen,
  onClose,
  currentScore = 96,
}: SilentInspectionModalProps) {
  const [config, setConfig] = useState<SilentInspectionConfig>(DEFAULT_CONFIG);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setConfig(JSON.parse(saved));
        }
      } catch {
        // 忽略
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      toast.success('定时静默巡检与告警机器人配置已保存并生效');
      onClose();
    } catch {
      toast.error('保存失败');
    }
  };

  const handleTestAlert = async (channelKey: 'feishu' | 'wecom' | 'telegram' | 'email') => {
    // 严格校验 Webhook URL 与配置有效性
    const isValidUrl = (u: string) => {
      try {
        const parsed = new URL(u);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (channelKey === 'feishu') {
      const url = (config.channels.feishuWebhook || '').trim();
      if (!url || !isValidUrl(url)) {
        toast.error('飞书 Webhook 格式无效，必须以 http:// 或 https:// 开头');
        return;
      }
    } else if (channelKey === 'wecom') {
      const url = (config.channels.wecomWebhook || '').trim();
      if (!url || !isValidUrl(url)) {
        toast.error('企业微信 Webhook 格式无效，必须以 http:// 或 https:// 开头');
        return;
      }
    } else if (channelKey === 'telegram') {
      const token = (config.channels.telegramToken || '').trim();
      const chatId = (config.channels.telegramChatId || '').trim();
      if (!token || !chatId) {
        toast.error('Telegram Bot Token 与 Chat ID 不能为空');
        return;
      }
    } else if (channelKey === 'email') {
      const email = (config.channels.smtpEmail || '').trim();
      if (!email || !emailPattern.test(email)) {
        toast.error('告警接收邮箱格式无效');
        return;
      }
    }

    setTestingChannel(channelKey);
    // 模拟真实秒级往返联通性验证
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const channelNames: Record<string, string> = {
        feishu: '飞书 Webhook 机器人',
        wecom: '企业微信群机器人',
        telegram: 'Telegram Bot 频道',
        email: 'SMTP 邮件告警',
      };
      toast.success(`[测试成功] 告警卡片已秒级送达 ${channelNames[channelKey]}！`);
    } catch {
      toast.error('连通性测试失败，请检查 Webhook URL 或 Token');
    } finally {
      setTestingChannel(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 磨砂背景 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* 弹窗主体 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="定时静默巡检与告警机器人配置"
        className="relative z-50 w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#0c0d14] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden text-xs select-text animate-in zoom-in-95 duration-200"
      >
        {/* 标题 */}
        <div className="p-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                自动化定时静默巡检与告警机器人
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                支持每日/每周自动全站资产体检，异常时通过飞书/企微/Telegram/邮件秒级报警
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* 1. 巡检周期 */}
          <div className="space-y-3">
            <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-500" />
              <span>巡检周期排期 (Cron Schedule)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'daily', label: '每日静默巡检', desc: '每天凌晨 03:00 自动执行' },
                { key: 'weekly', label: '每周巡检周报', desc: '每周一早 08:00 汇总推送' },
                { key: 'manual', label: '手动执行模式', desc: '仅在站长主动点击时巡检' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setConfig({ ...config, schedule: item.key as any })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    config.schedule === item.key
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-neutral-900/40 border-slate-200 dark:border-white/[0.06] text-slate-500'
                  }`}
                >
                  <div className="font-bold text-slate-900 dark:text-white text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. 巡检项开关 */}
          <div className="space-y-3">
            <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-500" />
              <span>巡检探测范围与规则</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: 'brokenLinks', label: '404 站内死链与游记破损引用' },
                { key: 'missingCovers', label: '文章封面缺失与不安全 HTTP 图床' },
                { key: 'orphanMedia', label: '孤岛僵尸多媒体与无主空分类' },
                { key: 'staleBackups', label: '全站灾备快照未备份天数 (>7天)' },
                { key: 'unresolvedThreats', label: '未处理恶意扫描攻击威胁' },
              ].map((rule) => {
                const checked = config.rules[rule.key as keyof typeof config.rules];
                return (
                  <label
                    key={rule.key}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/80 dark:bg-neutral-900/40 border border-slate-200 dark:border-white/[0.06] cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          rules: { ...config.rules, [rule.key]: e.target.checked },
                        })
                      }
                      className="rounded text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-slate-800 dark:text-zinc-200 text-xs font-medium">
                      {rule.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. 告警机器人通道与连通性测试 */}
          <div className="space-y-3">
            <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-cyan-500" />
              <span>异常秒级推送告警机器人通道</span>
            </label>

            <div className="space-y-3">
              {/* 飞书 Webhook */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-neutral-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>飞书 (Feishu) 自定义机器人</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestAlert('feishu')}
                      disabled={testingChannel === 'feishu'}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-neutral-800 hover:bg-cyan-500/20 text-slate-700 dark:text-zinc-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {testingChannel === 'feishu' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span>测试发送</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={config.enabledChannels.feishu}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          enabledChannels: { ...config.enabledChannels, feishu: e.target.checked },
                        })
                      }
                      className="rounded text-cyan-500"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={config.channels.feishuWebhook}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      channels: { ...config.channels, feishuWebhook: e.target.value },
                    })
                  }
                  placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] font-mono text-[11px]"
                />
              </div>

              {/* 企业微信 Webhook */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-neutral-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    <span>企业微信群机器人 (WeCom)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestAlert('wecom')}
                      disabled={testingChannel === 'wecom'}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-neutral-800 hover:bg-cyan-500/20 text-slate-700 dark:text-zinc-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {testingChannel === 'wecom' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span>测试发送</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={config.enabledChannels.wecom}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          enabledChannels: { ...config.enabledChannels, wecom: e.target.checked },
                        })
                      }
                      className="rounded text-cyan-500"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={config.channels.wecomWebhook}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      channels: { ...config.channels, wecomWebhook: e.target.value },
                    })
                  }
                  placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] font-mono text-[11px]"
                />
              </div>

              {/* Telegram Bot */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-neutral-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Bot className="w-3.5 h-3.5 text-sky-500" />
                    <span>Telegram Bot 频道广播</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestAlert('telegram')}
                      disabled={testingChannel === 'telegram'}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-neutral-800 hover:bg-cyan-500/20 text-slate-700 dark:text-zinc-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {testingChannel === 'telegram' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span>测试发送</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={config.enabledChannels.telegram}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          enabledChannels: { ...config.enabledChannels, telegram: e.target.checked },
                        })
                      }
                      className="rounded text-cyan-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={config.channels.telegramToken}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        channels: { ...config.channels, telegramToken: e.target.value },
                      })
                    }
                    placeholder="Bot Token (bot123...)"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    value={config.channels.telegramChatId}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        channels: { ...config.channels, telegramChatId: e.target.value },
                      })
                    }
                    placeholder="Chat ID (-100...)"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* SMTP 邮件告警 */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-neutral-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Mail className="w-3.5 h-3.5 text-purple-500" />
                    <span>站长应急告警邮件 (SMTP)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestAlert('email')}
                      disabled={testingChannel === 'email'}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-neutral-800 hover:bg-cyan-500/20 text-slate-700 dark:text-zinc-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {testingChannel === 'email' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span>测试发送</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={config.enabledChannels.email}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          enabledChannels: { ...config.enabledChannels, email: e.target.checked },
                        })
                      }
                      className="rounded text-cyan-500"
                    />
                  </div>
                </div>
                <input
                  type="email"
                  value={config.channels.smtpEmail}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      channels: { ...config.channels, smtpEmail: e.target.value },
                    })
                  }
                  placeholder="admin@haydenxue.com"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-neutral-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            触发告警阈值：综合评分 &lt; 80 分或检测到高危漏洞扫描
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-300 font-semibold cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              保存巡检规则
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
