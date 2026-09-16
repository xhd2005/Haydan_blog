import React from 'react';
import { CenteredPageLoader } from '@/components/ui/loading/CenteredPageLoader';

/**
 * 开源造物列表页加载中状态 (Projects Loading)
 */
export default function ProjectsLoading() {
  return (
    <CenteredPageLoader
      title="开源造物 · ENGINEERING & ARTIFACTS"
      subtitle="From the East, toward the unknown."
    />
  );
}
