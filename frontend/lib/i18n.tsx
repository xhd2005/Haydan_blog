'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Locale, DICTIONARY, translate } from './i18n-shared';

export type { Locale };
export { DICTIONARY, translate };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, defaultText?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'zh',
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ 
  children,
  initialLocale = 'zh'
}: { 
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // 客户端挂载后检测本地存储与 Cookie 是否一致
    const saved = (localStorage.getItem('NEXT_LOCALE') || localStorage.getItem('hayden_locale') || localStorage.getItem('howard_locale')) as Locale;
    if ((saved === 'zh' || saved === 'en') && saved !== locale) {
      setLocaleState(saved);
      document.cookie = `NEXT_LOCALE=${saved}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('hayden_locale', newLocale);
    localStorage.setItem('NEXT_LOCALE', newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  const toggleLocale = () => {
    const nextLocale = locale === 'zh' ? 'en' : 'zh';
    setLocale(nextLocale);
  };

  const t = (key: string, defaultText?: string): string => {
    return translate(locale, key, defaultText);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useTranslation() {
  return useContext(I18nContext);
}
