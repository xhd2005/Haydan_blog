'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { ShieldCheck, Lock, User as UserIcon, Loader2, ArrowRight, ShieldAlert, KeyRound, RefreshCw } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 验证码防刷状态
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // 拉取最新图形验证码
  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const data = await api.getCaptcha();
      setCaptchaKey(data.captchaKey);
      setCaptchaImage(data.captchaImage || data.imageBase64);
      setCaptchaCode('');
    } catch (err: any) {
      console.error('拉取验证码失败:', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 检测当前 IP / 账号是否已被要求验证码
  const checkCaptchaStatus = async (userTarget?: string) => {
    try {
      const res = await api.getCaptchaStatus(userTarget);
      if (res?.captchaRequired) {
        setCaptchaRequired(true);
        await fetchCaptcha();
      }
    } catch {
      // 静默忽略
    }
  };

  useEffect(() => {
    checkCaptchaStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (captchaRequired && !captchaCode.trim()) {
      toast.error('请输入图形验证码');
      return;
    }

    setLoading(true);

    try {
      const res = await api.login({
        username,
        password,
        captchaKey: captchaRequired ? captchaKey : undefined,
        captchaCode: captchaRequired ? captchaCode.trim() : undefined,
      });

      localStorage.setItem('hayden_token', res.accessToken);
      localStorage.setItem('howard_token', res.accessToken);
      localStorage.setItem('hayden_user', JSON.stringify(res));
      localStorage.setItem('howard_user', JSON.stringify(res));
      window.dispatchEvent(new Event('auth-change'));
      toast.success('登录成功，欢迎进入管理控制台');
      router.push('/admin/dashboard');
    } catch (err: any) {
      const errMsg = err.message || '登录失败，请检查账号密码';
      setError(errMsg);
      toast.error(errMsg);

      // 如果遇到验证码错误，或触发了连续输错安全防护
      if (
        errMsg.includes('验证码') ||
        errMsg.includes('防刷') ||
        errMsg.includes('防护') ||
        err.code === 400
      ) {
        setCaptchaRequired(true);
        fetchCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Hayden CMS 管理后台
          </h1>
          <p className="text-xs text-muted-foreground">
            请输入站长管理员凭据进行鉴权
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">用户名</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => {
                  if (username.trim()) {
                    checkCaptchaStatus(username.trim());
                  }
                }}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="请输入用户名"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">登录密码</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="请输入密码"
              />
            </div>
          </div>

          {/* 图形验证码模块 */}
          {captchaRequired && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>安全验证码</span>
                </label>
                <span className="text-[11px] text-amber-600 dark:text-amber-400">
                  连续输错开启安全防护
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={captchaCode}
                    onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                    maxLength={4}
                    required={captchaRequired}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm font-mono tracking-widest uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="4位验证码"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={captchaLoading}
                  title="点击刷新验证码"
                  className="h-[42px] px-2 rounded-xl border border-border bg-card hover:bg-secondary transition-colors overflow-hidden flex items-center justify-center relative cursor-pointer group shrink-0"
                >
                  {captchaImage ? (
                    <img
                      src={captchaImage}
                      alt="验证码"
                      className="h-full w-auto object-contain rounded-lg group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${captchaLoading ? 'animate-spin' : ''}`} />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                  </div>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>立即登录</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
