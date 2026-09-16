import React from 'react';
import { CenteredPageLoader } from '@/components/ui/loading/CenteredPageLoader';

/**
 * 开源项目详情页加载中状态 (Project Detail Loading)
 */
export default function ProjectDetailLoading() {
  return (
    <CenteredPageLoader
      title="造物详情 · PROJECT DOSSIER"
      subtitle="From the East, toward the unknown."
    />
  );
}
