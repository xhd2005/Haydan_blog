import React from 'react';
import { CenteredPageLoader } from '@/components/ui/loading/CenteredPageLoader';

/**
 * 全局通用路由加载：居中、极简无框、左侧 Logo + 右侧文字左右分布
 */
export default function Loading() {
  return (
    <CenteredPageLoader
      title="HAYDEN XUE · DIGITAL GARDEN"
      subtitle="From the East, toward the unknown."
    />
  );
}
