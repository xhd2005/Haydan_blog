import { cookies, headers } from 'next/headers';
import { Locale, translate } from './i18n-shared';

/**
 * 在 Next.js 14 服务端组件 (Server Component) 中安全提取当前语言
 * 优先读取 NEXT_LOCALE Cookie，若无则尝试从 accept-language 请求头嗅探，最后降级为 'zh'
 */
export function getServerLocale(): Locale {
  try {
    const cookieStore = cookies();
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
    if (cookieLocale === 'zh' || cookieLocale === 'en') {
      return cookieLocale;
    }

    const headerStore = headers();
    const acceptLanguage = headerStore.get('accept-language');
    if (acceptLanguage && acceptLanguage.toLowerCase().startsWith('en')) {
      return 'en';
    }
  } catch {
    // 在纯静态预渲染构建期某些上下文可能无法访问 headers/cookies
  }
  return 'zh';
}

/**
 * 为服务端组件提供翻译上下文对象
 */
export function getServerTranslation() {
  const locale = getServerLocale();
  return {
    locale,
    t: (key: string, defaultText?: string) => translate(locale, key, defaultText),
  };
}
