'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { LanguageToggle } from './LanguageToggle';
import { CommandPalette } from './CommandPalette';
import { AuthModal } from './AuthModal';
import { SafeImage } from './SafeImage';
import { 
  Sun, 
  Moon, 
  Search, 
  Menu, 
  X, 
  User as UserIcon,
  LogOut,
  Sparkles
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const checkUser = () => {
    const raw = localStorage.getItem('hayden_user') || localStorage.getItem('howard_user');
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
    localStorage.removeItem('howard_token');
    localStorage.removeItem('hayden_user');
    localStorage.removeItem('howard_user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.blog'), href: '/blog' },
    { name: t('nav.projects'), href: '/projects' },
    { name: t('nav.journey'), href: '/journey' },
    { name: t('nav.now'), href: '/now' },
    { name: t('nav.memos'), href: '/memos' },
    { name: t('nav.links'), href: '/links' },
    { name: t('nav.about'), href: '/about' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link 
            href="/" 
            className="group flex items-center gap-2 font-bold tracking-wider text-base sm:text-lg transition-transform hover:scale-[1.02]"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span className="tracking-widest uppercase text-foreground group-hover:text-emerald-500 transition-colors">
              HAYDEN XUE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.href === '/' 
                ? pathname === '/' 
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'text-foreground bg-secondary shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label={t('nav.search_tooltip')}
              title={t('nav.search_tooltip')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/80 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground">Cmd K</span>
            </button>

            {/* Language Switcher */}
            <LanguageToggle />

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={t('nav.theme_toggle')}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>
            )}

            {/* Reader User Auth */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-border text-xs">
                <Link
                  href="/profile"
                  title={t('nav.profile')}
                  className="flex items-center gap-1.5 hover:opacity-85 transition-opacity"
                >
                  <SafeImage
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'}
                    alt={currentUser.nickname || 'Avatar'}
                    aspectRatio="1/1"
                    containerClassName="w-6 h-6 rounded-full overflow-hidden border border-border shrink-0"
                  />
                  <span className="text-muted-foreground hover:text-foreground font-medium truncate max-w-[80px]">
                    {currentUser.nickname || currentUser.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title={t('nav.logout_tooltip')}
                  className="p-1 text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{t('nav.login')}</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label={t('nav.open_menu')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-border bg-background/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-1">
              {navLinks.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'text-foreground bg-secondary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    {link.name}
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

      {/* Global Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Global Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={() => checkUser()} />
    </>
  );
}
