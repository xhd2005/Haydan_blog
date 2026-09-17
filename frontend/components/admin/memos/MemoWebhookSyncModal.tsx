'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Memo } from '@/lib/types';
import { toast } from '@/lib/toast';
import {
  Webhook,
  Send,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  X,
  Smartphone,
  Bot,
  Terminal,
  Loader2,
} from 'lucide-react';

interface MemoWebhookSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
}

export function MemoWebhookSyncModal({
  isOpen,
  onClose,
  onSyncSuccess,
}: MemoWebhookSyncModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [source, setSource] = useState<'Telegram' | 'Feishu'>('Telegram');
  const [testContent, setTestContent] = useState('灵感：在移动端随时随地速记随笔 #移动速记 #架构');

  if (!isOpen) return null;

  const webhookEndpoint = typeof window !== 'undefined'
    ? `${window.location.origin}/api/memos/webhook?token=hayden_studio_secret_2026`
    : 'https://haydenxue.com/api/memos/webhook?token=hayden_studio_secret_2026';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('已复制到剪贴板！');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 模拟 Webhook 移动速记入库
  const handleSimulateWebhook = async () => {
    if (!testContent.trim()) {
      toast.warning('请输入模拟速记内容');
      return;
    }

    setSimulating(true);
    try {
      // 提取标签
      const tagRegex = /#([\w\u4e00-\u9fa5]+)/g;
      const extractedTags = Array.from(testContent.matchAll(tagRegex)).map((m) => m[1]);

      await api.createMemo({
        content: testContent.trim(),
        tags: extractedTags.join(', ') || undefined,
        location: `${source} 移动速记`,
        mood: '⚡ 心流',
        weather: '☀️ 晴',
      });

      toast.success(`[${source} Webhook] 移动速记入库成功！已自动提取 ${extractedTags.length} 个标签。`);
      onSyncSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '模拟入库失败');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#0c0e14]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="px-8 py-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Telegram / 飞书 Webhook 移动速记同步
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                支持移动端即时通信消息秒级直达个人随记数字花园
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 主体内容 */}
        <div className="p-8 space-y-6 text-xs">
          {/* Webhook 直连地址 */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              全域接收端点 (Universal Webhook Endpoint)
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 font-mono text-[11px] text-slate-700 dark:text-slate-300">
              <span className="flex-1 truncate select-all">{webhookEndpoint}</span>
              <button
                onClick={() => handleCopy(webhookEndpoint, 'endpoint')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                title="复制端点"
              >
                {copiedKey === 'endpoint' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 规范 Payload 示例 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-500" />
                支持的 JSON 规范契约
              </label>
              <span className="text-[10px] text-slate-400">自动解析 Telegram / 飞书标准 Bot 事件</span>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
{`{
  "source": "${source}",
  "messageId": 1024,
  "text": "持续优化 VisionOS 双岛坞组件 #前端架构 #设计",
  "timestamp": ${Date.now()}
}`}
            </pre>
          </div>

          {/* 交互式模拟发送演练 */}
          <div className="p-4 rounded-2xl bg-indigo-500/[0.04] border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                移动速记实战模拟沙盒
              </div>
              <div className="flex items-center p-0.5 bg-slate-200/60 dark:bg-white/10 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={() => setSource('Telegram')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    source === 'Telegram' ? 'bg-white dark:bg-neutral-800 text-indigo-600 font-semibold' : 'text-slate-500'
                  }`}
                >
                  Telegram Bot
                </button>
                <button
                  type="button"
                  onClick={() => setSource('Feishu')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    source === 'Feishu' ? 'bg-white dark:bg-neutral-800 text-indigo-600 font-semibold' : 'text-slate-500'
                  }`}
                >
                  飞书群机器人
                </button>
              </div>
            </div>

            <input
              type="text"
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="输入测试随记内容，支持 #标签..."
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                测试将真实创建一条标有 [{source} 移动速记] 的随记动态
              </span>
              <button
                type="button"
                onClick={handleSimulateWebhook}
                disabled={simulating}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {simulating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                模拟推送入库
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
