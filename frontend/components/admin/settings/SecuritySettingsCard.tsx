'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { SiteSetting } from '@/lib/types';
import { toast } from '@/lib/toast';
import {
  ShieldCheck,
  KeyRound,
  ShieldAlert,
  Lock,
  Save,
  Loader2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface SecuritySettingsCardProps {
  initialSettings?: Partial<SiteSetting>;
  onSaved?: () => void;
}

export function SecuritySettingsCard({ initialSettings, onSaved }: SecuritySettingsCardProps) {
  const [icpNumber, setIcpNumber] = useState('');
  const [footerText, setFooterText] = useState('© 2026 Hayden Xue. All rights reserved.');
  const [commentModerationEnabled, setCommentModerationEnabled] = useState(1);
  const [adminCommentExempt, setAdminCommentExempt] = useState(1);

  // 修改密码表单
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setIcpNumber(initialSettings.icpNumber || '');
      setFooterText(initialSettings.footerText || '© 2026 Hayden Xue. All rights reserved.');
      if (initialSettings.commentModerationEnabled !== undefined) {
        setCommentModerationEnabled(initialSettings.commentModerationEnabled);
      }
      if (initialSettings.adminCommentExempt !== undefined) {
        setAdminCommentExempt(initialSettings.adminCommentExempt);
      }
    }
  }, [initialSettings]);

  const handleSaveSecurity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const payload: Partial<SiteSetting> = {
        icpNumber,
        footerText,
        commentModerationEnabled,
        adminCommentExempt,
      };

      await api.updateSettings(payload);
      setSaved(true);
      toast.success('安全合规与评论审核策略已保存即时生效！');
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || '保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.warning('请填写原密码与新密码');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('新密码长度不能少于 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('两次输入的新密码不一致');
      return;
    }

    setPwdLoading(true);
    setPwdSuccess(false);
    try {
      await api.changePassword({ oldPassword, newPassword });
      setPwdSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('管理员登录凭据修改成功，新密码已生效！');
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || '修改密码失败');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden transition-all">
      {/* 头部 */}
      <div className="p-6 border-b border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>安全防护、合规备案与站长凭据</span>
              {saved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  <CheckCircle className="w-3 h-3" /> 已保存
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              配置全站底部的法律合规备案、防暴力破解限流策略与管理员 BCrypt 密钥修改
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSaveSecurity()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{loading ? '正在保存...' : '保存合规信息'}</span>
        </button>
      </div>

      <div className="p-6 space-y-6 text-xs">
        {/* 页脚与备案信息 */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-2">
            <span>全站法律合规与版权签名</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">ICP 备案号 (ICP License)</label>
              <input
                type="text"
                value={icpNumber}
                onChange={(e) => setIcpNumber(e.target.value)}
                placeholder="如: 浙ICP备20260908号"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">页脚版权自述 (Footer Text)</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="© 2026 Hayden Xue. All rights reserved."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 评论先审后发安全策略 */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>全站读者评论内容审核与放行策略</span>
            </div>
            <Link
              href="/admin/comments"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>前往待审评论池</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-white/[0.04] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-medium text-slate-800 dark:text-zinc-200 text-xs">严格先审后发机制</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  开启后新发评论进入待审池，审核通过后才公开发布
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={commentModerationEnabled === 1}
                  onChange={(e) => setCommentModerationEnabled(e.target.checked ? 1 : 0)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-white/[0.04] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-medium text-slate-800 dark:text-zinc-200 text-xs">站长评论免审通道</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  站长 (Hayden Xue) 发表评论直接通过；关闭后站长评论也入审核池
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={adminCommentExempt === 1}
                  onChange={(e) => setAdminCommentExempt(e.target.checked ? 1 : 0)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 平台攻防安全与限流说明 */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
              <span>当前系统安全加固策略状态</span>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>查看安全审计日志</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px]">
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-white/[0.04] space-y-1">
              <div className="font-medium text-slate-700 dark:text-zinc-200">登录防爆破机制</div>
              <div className="text-slate-500 dark:text-zinc-400">连续 5 次密码错误触发 IP+账号锁定 15 分钟</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-white/[0.04] space-y-1">
              <div className="font-medium text-slate-700 dark:text-zinc-200">防刷验证码策略</div>
              <div className="text-slate-500 dark:text-zinc-400">异常频次自动激活验证码校验</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-white/[0.04] space-y-1">
              <div className="font-medium text-slate-700 dark:text-zinc-200">魔数文件校验</div>
              <div className="text-slate-500 dark:text-zinc-400">严格阻断恶意 HTML/SVG 脚本执行</div>
            </div>
          </div>
        </div>

        {/* 管理员密码修改独立表单 */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.04]">
          <form onSubmit={handleChangePassword} className="space-y-3 max-w-lg">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-500" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-xs">修改站长登录密码 (BCrypt 加密)</h4>
            </div>

            {pwdSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>密码修改成功！请妥善保存新密码。</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">原登录密码</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">新密码 (至少6位)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="至少6位安全密码"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="再次输入新密码"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {pwdLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{pwdLoading ? '正在更新凭据...' : '确认更新管理员密码'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
