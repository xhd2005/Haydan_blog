import React from 'react';
import { CenteredPageLoader } from '@/components/ui/loading/CenteredPageLoader';

/**
 * 关于站长页加载中状态 (About Dossier Loading)
 */
export default function AboutLoading() {
  return (
    <CenteredPageLoader
      title="关于站长 · ARCHITECT & SYSTEM EXPLORER"
      subtitle="From the East, toward the unknown."
    />
  );
}
