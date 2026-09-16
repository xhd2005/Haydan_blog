'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { X, Loader2, User, Lock, Mail, Sparkles, ShieldAlert, KeyRound, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 验证码防刷状态
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // 拉取图形验证码
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

  // 检测当前是否需要验证码
  const checkCaptchaStatus = async (userTarget?: string) => {
    try {
      const res = await api.getCaptchaStatus(userTarget);
      if (res?.captchaRequired) {
        setCaptchaRequired(true);
        await fetchCaptcha();
      }
    } catch {
      // 忽略
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'login') {
      checkCaptchaStatus();
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login' && captchaRequired && !captchaCode.trim()) {
      setError(t('auth.captcha_required', '请输入图形验证码'));
      return;
    }

    setLoading(true);

    try {
      let accessToken = '';
      if (mode === 'login') {
        const res = await api.login({
          username,
          password,
          captchaKey: captchaRequired ? captchaKey : undefined,
          captchaCode: captchaRequired ? captchaCode.trim() : undefined,
        });
        accessToken = res.accessToken;
        localStorage.setItem('hayden_token', res.accessToken);
        localStorage.setItem('hayden_user', JSON.stringify(res));
      } else {
        const res = await api.register({ username, password, nickname, email });
        accessToken = res.accessToken;
        localStorage.setItem('hayden_token', res.accessToken);
        localStorage.setItem('hayden_user', JSON.stringify(res));
      }
      if (accessToken) {
        document.cookie = `hayden_token=${encodeURIComponent(accessToken)}; path=/; max-age=604800; SameSite=Lax`;
      }
      onSuccess?.();
      onClose();
      // 触发全局自定义事件通知 Navbar 刷新
      window.dispatchEvent(new Event('auth-change'));
    } catch (err: any) {
      const errMsg = err.message || t('auth.error_fallback');
      setError(errMsg);

      if (
        mode === 'login' &&
        (errMsg.includes('验证码') ||
          errMsg.includes('防刷') ||
          errMsg.includes('防护') ||
          err.code === 400)
      ) {
        setCaptchaRequired(true);
        fetchCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Reader Community</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {mode === 'login' ? t('auth.login_title') : t('auth.register_title')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {mode === 'login' ? t('auth.login_subtitle') : t('auth.register_subtitle')}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground">{t('auth.username')}</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => {
                  if (mode === 'login' && username.trim()) {
                    checkCaptchaStatus(username.trim());
                  }
                }}
                required
                placeholder={t('auth.username_placeholder')}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('auth.password_placeholder')}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 读者登录验证码防刷模块 */}
          {mode === 'login' && captchaRequired && (
            <div className="space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('auth.captcha', '图形验证码')}</span>
                </label>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                  {t('auth.security_notice', '安全防护中')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    value={captchaCode}
                    onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                    maxLength={4}
                    required={captchaRequired}
                    placeholder={t('auth.captcha_placeholder', '请输入验证码')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono uppercase tracking-wider focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={captchaLoading}
                  title={t('auth.refresh_captcha', '点击刷新')}
                  className="h-[38px] px-1.5 rounded-xl border border-border bg-card hover:bg-secondary transition-colors overflow-hidden flex items-center justify-center relative cursor-pointer group shrink-0"
                >
                  {captchaImage ? (
                    <img
                      src={captchaImage}
                      alt="captcha"
                      className="h-full w-auto object-contain rounded-lg group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${captchaLoading ? 'animate-spin' : ''}`} />
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="font-medium text-foreground">{t('auth.nickname')}</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t('auth.nickname_placeholder')}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{mode === 'login' ? t('auth.login_btn') : t('auth.register_btn')}</span>
          </button>
        </form>

        {/* Switch mode */}
        <div className="text-center pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-4 transition-colors"
          >
            {mode === 'login' ? t('auth.no_account') : t('auth.have_account')}
          </button>
        </div>
      </div>
    </div>
  );
}
