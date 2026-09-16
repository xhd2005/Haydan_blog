import React from 'react';
import { CenteredPageLoader } from '@/components/ui/loading/CenteredPageLoader';

/**
 * 博客手记列表页加载中状态 (Blog Loading)
 */
export default function BlogLoading() {
  return (
    <CenteredPageLoader
      title="博客手记 · THOUGHTS & ESSAYS"
      subtitle="From the East, toward the unknown."
    />
  );
}
