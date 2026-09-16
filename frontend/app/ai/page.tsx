import { Metadata } from 'next';
import { Suspense } from 'react';
import { HaydenAiNexus } from './HaydenAiNexus';
import { api } from '@/lib/api';
import { PageVisualsConfig } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Into the Unknown · Hayden AI 数字外脑 | Hayden Xue',
  description: '直连 DeepSeek 官方大模型深度思考链与数字花园全栈知识库，探索未知，协同共生。',
};

export default async function AiPage() {
  let pageVisuals: PageVisualsConfig = {};
  try {
    // 采用 500ms 竞速超时，确保即便后端冷启动或离线时，SSR 也能瞬间输出首屏骨架
    const settingsPromise = api.getSettings();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 500));
    const settings = await Promise.race([settingsPromise, timeoutPromise]);
    if (settings?.pageVisualsJson) {
      pageVisuals = JSON.parse(settings.pageVisualsJson);
    }
  } catch (err) {
    // 优雅降级使用默认全栈配置
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfbfd] dark:bg-[#090a0f]" />}>
      <HaydenAiNexus initialVisual={pageVisuals.ai} />
    </Suspense>
  );
}
