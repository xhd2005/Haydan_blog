'use client';

import React, { useState } from 'react';
import { FriendApplyRequest } from '@/lib/types';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import {
  X,
  Send,
  Copy,
  Check,
  Info,
  ShieldAlert,
  Sparkles,
  Search,
  Activity,
  Zap,
} from 'lucide-react';

interface FriendApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FriendApplyModal({ isOpen, onClose, onSuccess }: FriendApplyModalProps) {
  const { locale } = useI18n();
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // 表单状态
  const [form, setForm] = useState<FriendApplyRequest>({
    name: '',
    url: '',
    avatar: '',
    description: '',
    category: '独立博客', // 默认分类兜底
  });

  // 智能预检解析状态
  const [inspecting, setInspecting] = useState(false);
  const [inspectPing, setInspectPing] = useState<number | null>(null);

  // 防抖狂点锁定状态
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  if (!isOpen) return null;

  // 站长 Hayden Xue 站点信息
  const siteConfig = {
    name: 'Hayden Xue',
    title: 'Hayden Xue // 数字花园',
    url: 'https://haydenxue.com',
    avatar: 'https://haydenxue.com/avatar.png',
    description: '追求极简与克制，在不确定中构建高确定性的全栈工程与智能体系统。',
  };

  const codeSnippets = {
    markdown: `- 名称: ${siteConfig.name}\n- 链接: ${siteConfig.url}\n- 图标: ${siteConfig.avatar}\n- 描述: ${siteConfig.description}`,
    html: `<a href="${siteConfig.url}" title="${siteConfig.description}" target="_blank">\n  <img src="${siteConfig.avatar}" alt="${siteConfig.name}" width="40" height="40" />\n  <span>${siteConfig.name}</span>\n</a>`,
    json: JSON.stringify(siteConfig, null, 2),
  };

  const handleCopy = (format: 'markdown' | 'html' | 'json') => {
    navigator.clipboard.writeText(codeSnippets[format]);
    setCopiedFormat(format);
    toast.success(locale === 'zh' ? '已复制本站挂载代码' : 'Code copied to clipboard');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // 智能一键解析/预检友链站点元数据
  const handleAutoInspect = async () => {
    const trimmedUrl = form.url.trim();
    if (!trimmedUrl) {
      toast.error(locale === 'zh' ? '请先输入网站链接' : 'Please input site URL first');
      return;
    }

    setInspecting(true);
    setInspectPing(null);

    try {
      const res = await api.inspectFriendSite(trimmedUrl);
      if (res) {
        setForm((prev) => ({
          ...prev,
          url: res.url || prev.url,
          name: res.name ? res.name : prev.name,
          description: res.description ? res.description : prev.description,
          avatar: res.avatar ? res.avatar : prev.avatar,
        }));

        if (res.responseTimeMs) {
          setInspectPing(res.responseTimeMs);
        }

        toast.success(
          locale === 'zh'
            ? `智能解析成功！探活延迟 ${res.responseTimeMs || 30}ms，已自动填充信息。`
            : `Site inspected successfully (${res.responseTimeMs || 30}ms)! Form prefilled.`
        );
      }
    } catch (err: any) {
      toast.error(
        err.message ||
          (locale === 'zh' ? '智能解析受限，请直接手动补全信息' : 'Inspection failed, please fill manually.')
      );
    } finally {
      setInspecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 防刷与防抖锁定：1.5 秒内禁止重复触发
    const now = Date.now();
    if (submitting || now - lastSubmitTime < 1500) {
      toast.error(locale === 'zh' ? '正在处理中，请勿重复点击' : 'Please do not submit repeatedly');
      return;
    }

    if (!form.name.trim()) {
      toast.error(locale === 'zh' ? '请填写网站名称' : 'Site name is required');
      return;
    }

    const trimmedUrl = form.url.trim();
    if (!trimmedUrl) {
      toast.error(locale === 'zh' ? '请填写网站链接' : 'Site URL is required');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      toast.error(locale === 'zh' ? '网站链接必须以 http:// 或 https:// 开头' : 'URL must start with http:// or https://');
      return;
    }

    if (form.avatar && form.avatar.trim().toLowerCase().startsWith('javascript:')) {
      toast.error(locale === 'zh' ? '非法头像链接协议' : 'Invalid avatar URL protocol');
      return;
    }

    setSubmitting(true);
    setLastSubmitTime(now);

    try {
      const payload: FriendApplyRequest = {
        name: form.name.trim(),
        url: trimmedUrl,
        avatar: form.avatar?.trim() || undefined,
        description: form.description?.trim() || undefined,
        category: form.category?.trim() || '独立博客',
      };

      await api.applyFriend(payload);
      toast.success(
        locale === 'zh'
          ? '友链申请已成功送达！审核通过后将即刻上线并开启健康探活。'
          : 'Link application submitted! Will be listed after review.'
      );
      if (onSuccess) onSuccess();
      onClose();
      setForm({ name: '', url: '', avatar: '', description: '', category: '独立博客' });
      setInspectPing(null);
    } catch (err: any) {
      toast.error(err.message || (locale === 'zh' ? '提交失败，请稍后重试' : 'Submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white/95 dark:bg-neutral-900/95 border border-slate-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 font-sans">
              <Send className="w-4 h-4 text-emerald-500" />
              <span>{locale === 'zh' ? '申请交换友链' : 'Apply for Friend Link'}</span>
            </h2>
            <p className="text-xs text-muted-foreground font-sans">
              {locale === 'zh'
                ? '欢迎优质独立博客、开源作者与全栈同好互相挂载，共同编织开放 Web 知识网络'
                : 'Join Hayden Xue’s decentralized digital garden neighborhood.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. 本站信息与一键复制卡片 */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5 font-sans">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              {locale === 'zh' ? '本站挂载信息 (建议先在贵站添加本博客)' : 'Our Site Info (Please add us first)'}
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => handleCopy('markdown')}
                className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedFormat === 'markdown' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                Markdown
              </button>
              <button
                type="button"
                onClick={() => handleCopy('html')}
                className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedFormat === 'html' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                HTML
              </button>
              <button
                type="button"
                onClick={() => handleCopy('json')}
                className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedFormat === 'json' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                JSON
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-muted-foreground pt-1">
            <div><span className="text-foreground font-semibold">名称:</span> {siteConfig.name}</div>
            <div><span className="text-foreground font-semibold">网址:</span> {siteConfig.url}</div>
            <div className="sm:col-span-2 truncate"><span className="text-foreground font-semibold">简介:</span> {siteConfig.description}</div>
          </div>
        </div>

        {/* 2. 申请表单 */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 网址输入行 + 智能解析按钮 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground font-sans">
                {locale === 'zh' ? '网站链接 (URL) *' : 'Site URL *'}
              </label>
              {inspectPing !== null && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-3 h-3" />
                  <span>探活 Ping: {inspectPing}ms</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://yourblog.com"
                className="flex-1 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-white/10 text-foreground font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleAutoInspect}
                disabled={inspecting || !form.url.trim()}
                className="px-4 py-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-mono font-bold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                {inspecting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
                    <span>解析中</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>智能解析</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground font-sans">
                {locale === 'zh' ? '网站名称 *' : 'Site Name *'}
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例如: 某某的数字花园"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-white/10 text-foreground font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground font-sans">
                {locale === 'zh' ? '分类标签' : 'Category'}
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-white/10 text-foreground font-mono focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="独立博客">独立博客 (INDEPENDENT_BLOG)</option>
                <option value="极客同好">极客同好 (GEEK_PEER)</option>
                <option value="开源先锋">开源先锋 (OPEN_SOURCE)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground font-sans">
              {locale === 'zh' ? '头像 / Favicon 图标链接' : 'Avatar URL'}
            </label>
            <input
              type="url"
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              placeholder="https://example.com/avatar.png"
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-white/10 text-foreground font-mono focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground font-sans">
              {locale === 'zh' ? '网站描述' : 'Site Description'}
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={locale === 'zh' ? '一句话介绍你的站点或创作方向...' : 'Brief description of your blog...'}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-white/10 text-foreground font-mono focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* 底部按钮与安全须知 */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
              <span>{locale === 'zh' ? '提交后将自动入库审核队列并开启探活' : 'Auto health-check will be triggered'}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-foreground font-semibold transition-colors cursor-pointer"
              >
                {locale === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>{locale === 'zh' ? '提交中...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{locale === 'zh' ? '立即提交' : 'Submit'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
