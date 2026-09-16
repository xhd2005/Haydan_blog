import React from 'react';
import { CenteredPageLoader } from '@/components/ui/loading/CenteredPageLoader';

/**
 * 友链圈子页加载中状态 (Friends Links Loading)
 */
export default function LinksLoading() {
  return (
    <CenteredPageLoader
      title="星标友链 · FRIENDSHIP CONSTELLATION"
      subtitle="From the East, toward the unknown."
    />
  );
}
