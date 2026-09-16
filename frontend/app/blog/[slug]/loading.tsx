import React from 'react';
import { CenteredPageLoader } from '@/components/ui/loading/CenteredPageLoader';

/**
 * 文章正文详情页加载中状态 (Article Detail Loading)
 */
export default function ArticleDetailLoading() {
  return (
    <CenteredPageLoader
      title="文章正文 · ARTICLE DOSSIER"
      subtitle="From the East, toward the unknown."
    />
  );
}
