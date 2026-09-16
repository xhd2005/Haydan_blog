/**
 * Next.js ISR 按需增量静态缓存刷新客户端工具
 */

import { readAuthToken } from '@/lib/storage-keys';

export async function triggerRevalidate(paths: string | string[], tag?: string): Promise<void> {
  const pathList = Array.isArray(paths) ? paths : [paths];
  const token = typeof window !== 'undefined' ? readAuthToken() : '';

  const secret = 'isr-secret-token-2026';

  for (const p of pathList) {
    try {
      const effectiveTag = tag || (p.includes('blog') || p.includes('post') || p === '/' ? 'posts' : undefined);
      const url = `/api/revalidate?path=${encodeURIComponent(p)}${effectiveTag ? `&tag=${encodeURIComponent(effectiveTag)}` : ''}`;
      const headers: Record<string, string> = {
        'x-revalidate-secret': secret,
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ path: p, tag: effectiveTag }),
      });
      console.info(`[ISR Revalidate] Path ${p} (tag: ${effectiveTag}) triggered successfully.`);
    } catch (err) {
      console.warn(`[ISR Revalidate] Warning when revalidating ${p}:`, err);
    }
  }
}
