import { Locale, translate } from './i18n-shared';

/**
 * 在 Next.js 14 服务端预渲染 (SSG / ISR) 中提供默认基准语言（'zh'）
 * 彻底解耦 cookies() 与 headers() 调用，恢复全站静态预渲染与 ISR 缓存能力。
 * 客户端由 I18nProvider 在挂载后无缝接管用户的 Cookie / 本地偏好并即时响应切换。
 */
export function getServerLocale(): Locale {
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
