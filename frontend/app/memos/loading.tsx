import React from 'react';
import { CenteredPageLoader } from '@/components/ui/loading/CenteredPageLoader';

/**
 * 随记漫谈页加载中状态 (Memos Loading)
 */
export default function MemosLoading() {
  return (
    <CenteredPageLoader
      title="随记漫谈 · MICRO LOGS & MOMENTS"
      subtitle="From the East, toward the unknown."
    />
  );
}
