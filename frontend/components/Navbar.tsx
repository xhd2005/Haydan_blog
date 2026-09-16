'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { LanguageToggle } from './LanguageToggle';
import { LiquidSpotlightModal } from './search/LiquidSpotlightModal';
import { AuthModal } from './AuthModal';
import { SafeImage } from './SafeImage';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';
import { 
  Sun, 
  Moon, 
  Search, 
  Menu, 
  X, 
  User as UserIcon,
  LogOut,
  Sparkles,
  Globe
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const checkUser = () => {
    const raw = localStorage.getItem('hayden_user');
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkUser();
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('auth-change', checkUser);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('auth-change', checkUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('hayden_token');
    localStorage.removeItem('hayden_user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  // 全局快捷键监听：Cmd+K / Cmd+J / Ctrl+K / Ctrl+J / '/' 唤出液态玻璃透视窗口
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === '/') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };

    // 监听划词追问事件，统一唤醒液态玻璃研读罗盘
    const handleOpenAi = () => {
      setPaletteOpen(true);
    };

    // 全局唤起登录弹窗事件
    const handleOpenAuth = () => {
      setAuthModalOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-hayden-ai', handleOpenAi);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-hayden-ai', handleOpenAi);
      window.removeEventListener('open-auth-modal', handleOpenAuth);
    };
  }, []);

  // 自动响应 URL 参数拉起液态玻璃透视窗口 (例如 /?explore=true 或 /?search=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('explore') === 'true' || params.get('search') === 'true') {
        setPaletteOpen(true);
      }
    }
  }, [pathname]);

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.blog'), href: '/blog' },
    { name: t('nav.projects'), href: '/projects' },
    { name: t('nav.journey'), href: '/journey' },
    { name: t('nav.memos'), href: '/memos' },
    { name: t('nav.links'), href: '/links' },
    { name: t('nav.ai'), href: '/ai' },
    { name: t('nav.about'), href: '/about' },
  ];

  const isHeroTranslucent = (pathname === '/' && !isScrolled) || pathname === '/journey';

  return (
    <>
      <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex flex-col items-center pointer-events-none px-3 sm:px-6">
        <div
          className={`pointer-events-auto relative w-full max-w-6xl h-14 sm:h-15 rounded-full px-3 sm:px-5 lg:px-6 flex items-center justify-between transition-all duration-500 liquid-glass-lens ${
            isHeroTranslucent
              ? 'bg-neutral-950/35 dark:bg-neutral-950/45 border border-white/25 dark:border-white/20 shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.3),0_16px_44px_rgba(0,0,0,0.5)]'
              : isScrolled
              ? 'bg-white/75 dark:bg-[#0b0c13]/75 border border-slate-200/90 dark:border-white/[0.18] shadow-[inset_0_1px_2px_0_rgba(255,255,255,0.8),inset_0_-1px_1px_0_rgba(0,0,0,0.04),0_14px_40px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.22),inset_0_-1px_1px_0_rgba(0,0,0,0.5),0_16px_44px_rgba(0,0,0,0.7)]'
              : 'bg-white/65 dark:bg-[#0b0c13]/65 border border-slate-200/80 dark:border-white/[0.14] shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.7),0_10px_32px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.18),0_12px_36px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* 顶部菲涅尔镜面反射弧线 (VisionOS Specular Highlight) */}
          <div className="absolute inset-x-10 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/35 to-transparent pointer-events-none rounded-t-full" />
          {/* 微透镜凸面漫反射光晕 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.12] via-transparent to-black/[0.04] dark:from-white/[0.06] dark:to-transparent pointer-events-none" />

          {/* Brand */}
          <Link 
            href="/" 
            className="group shrink-0 flex items-center gap-2 sm:gap-2.5 font-bold tracking-wider text-sm sm:text-base transition-transform hover:scale-[1.02] whitespace-nowrap z-10"
          >
            <BrandLogo size={22} animated glow />
            <span className={`tracking-widest uppercase transition-colors whitespace-nowrap ${
              isHeroTranslucent
                ? 'text-white group-hover:text-emerald-400'
                : 'text-foreground group-hover:text-emerald-500'
            }`}>
              HAYDEN XUE
            </span>
          </Link>

          {/* Desktop Navigation (强制单行横排 whitespace-nowrap) */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0 z-10">
            {navLinks.map((link) => {
              const isActive = link.href === '/' 
                ? pathname === '/' 
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                    isHeroTranslucent
                      ? isActive
                        ? 'text-white bg-white/20 shadow-xs font-semibold backdrop-blur-md border border-white/20'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                      : isActive
                      ? 'text-foreground bg-secondary/80 shadow-xs font-semibold backdrop-blur-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <span className="whitespace-nowrap">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0 z-10">
            {/* Liquid Glass Spotlight Search Capsule Trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label={t('nav.search_tooltip')}
              title={t('nav.search_tooltip')}
              className={`group relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                isHeroTranslucent
                  ? 'text-white border border-white/25 bg-white/15 hover:bg-white/25 hover:border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
                  : 'text-foreground bg-white/70 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/[0.14] border border-slate-200/90 dark:border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-[11px] sm:text-xs tracking-wide">
                  {t('nav.explore') || '探索'}
                </span>
              </div>
              <kbd className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono ${
                isHeroTranslucent
                  ? 'bg-white/20 text-white/90 border border-white/20'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-white/10'
              }`}>
                ⌘K
              </kbd>
            </button>

            {/* Language Switcher */}
            <LanguageToggle
              className={isHeroTranslucent ? 'text-white/85 border-white/20 bg-white/10 hover:bg-white/20 hover:text-white' : ''}
            />

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={t('nav.theme_toggle')}
                className={`p-2 rounded-full transition-colors ${
                  isHeroTranslucent
                    ? 'text-white/85 hover:text-white hover:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className={`w-4 h-4 ${isHeroTranslucent ? 'text-slate-200' : 'text-slate-700'}`} />
                )}
              </button>
            )}

            {/* Reader User Auth */}
            {currentUser ? (
              <div className={`hidden sm:flex items-center gap-1.5 xl:gap-2 pl-1 border-l text-xs shrink-0 whitespace-nowrap ${
                isHeroTranslucent ? 'border-white/20' : 'border-border'
              }`}>
                <NotificationDrawer />
                <Link
                  href="/profile"
                  title={t('nav.profile')}
                  className="flex items-center gap-1.5 hover:opacity-85 transition-opacity shrink-0 whitespace-nowrap"
                >
                  <SafeImage
                    src={currentUser.avatar || DEFAULT_AVATAR}
                    alt={currentUser.nickname || 'Avatar'}
                    aspectRatio="1/1"
                    containerClassName="w-6 h-6 rounded-full overflow-hidden border border-border shrink-0"
                  />
                  <span className={`hidden xl:inline font-medium truncate max-w-[80px] whitespace-nowrap ${
                    isHeroTranslucent ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    {currentUser.nickname || currentUser.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title={t('nav.logout_tooltip')}
                  className={`p-1 transition-colors shrink-0 ${
                    isHeroTranslucent ? 'text-white/80 hover:text-rose-400' : 'text-muted-foreground hover:text-rose-500'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className={`hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 whitespace-nowrap ${
                  isHeroTranslucent
                    ? 'bg-white text-neutral-950 hover:bg-white/90 font-semibold shadow-md'
                    : 'bg-foreground text-background hover:opacity-90'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{t('nav.login')}</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isHeroTranslucent ? 'text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              aria-label={t('nav.open_menu')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown (悬浮液态玻璃浮岛) */}
        {mobileMenuOpen && (
          <div className={`pointer-events-auto w-full max-w-5xl mt-2.5 rounded-3xl backdrop-blur-2xl p-4 sm:p-5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 lg:hidden ${
            isHeroTranslucent
              ? 'bg-neutral-950/90 text-white border border-white/20'
              : 'bg-white/90 dark:bg-neutral-900/90 border border-white/50 dark:border-white/[0.12]'
          }`}>
            {/* 移动端品牌抬头 */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <BrandLogo size={20} animated={false} glow />
                <span className="font-bold tracking-wider text-xs uppercase text-foreground">
                  HAYDEN XUE
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                DIGITAL GARDEN
              </span>
            </div>

            {/* 移动端快速呼出液态透视搜索 */}
            <div className="mb-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPaletteOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  <span>{t('nav.explore') || '探索全站与透视搜索'}</span>
                </div>
                <span className="font-mono text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">⌘K</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1">
              {navLinks.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'text-foreground bg-secondary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-foreground font-medium flex items-center gap-1.5"
                  >
                    <span>{currentUser.nickname || currentUser.username}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t('nav.profile')}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-rose-500 font-medium underline">
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="text-emerald-500 font-medium"
                >
                  {t('nav.login')} / {t('nav.register')}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global VisionOS Liquid Glass Spotlight Modal */}
      <LiquidSpotlightModal isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Global Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={() => checkUser()} />
    </>
  );
}
