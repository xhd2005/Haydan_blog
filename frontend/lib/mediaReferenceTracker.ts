/**
 * mediaReferenceTracker.ts
 * 
 * 媒体资产反向引用追踪与在用防删锁 (Media Reverse References & In-Use Deletion Lock)
 * 遵从 AGENTS.md 准则 (破坏性批处理防误触红线 & 死链防御)
 * 对应 Milestone 4 (Content Creation & Media Hub)
 */

import { Media, Post, Memo, SiteSetting } from './types';
import { normalizeMediaUrl } from './media-url';

export interface MediaReferenceInfo {
  url: string;
  isLocked: boolean;
  usedInPosts: Array<{ id: number; title: string; slug?: string }>;
  usedInMemos: Array<{ id: number; summary: string }>;
  usedInSettings: string[];
}

export interface RecycledMediaAsset extends Media {
  recycleAt: number;
  purgeAfterDays: number;
  originalId: number;
}

const RECYCLE_BIN_STORAGE_KEY = 'hayden_media_recycle_bin';

/**
 * 提取媒体资产的多种可能引用形式（原始直链、规范化公网直链、阿里云流媒体代理路径、相对路径与文件名）
 */
export function getMediaUrlVariants(mediaUrl: string): string[] {
  if (!mediaUrl) return [];
  const raw = mediaUrl.trim();
  const variants = new Set<string>();
  variants.add(raw);

  try {
    const norm = normalizeMediaUrl(raw);
    if (norm) variants.add(norm);
  } catch {}

  try {
    const decoded = decodeURIComponent(raw);
    if (decoded) variants.add(decoded);
  } catch {}

  // 阿里云 OSS 官方直链映射为 view 代理
  const ossMatch = raw.match(/^https?:\/\/[a-z0-9-]+\.(?:oss|s3\.oss)-[a-z0-9-]+\.aliyuncs\.com\/(.+)$/i);
  if (ossMatch && ossMatch[1]) {
    variants.add(`/api/media/view/${ossMatch[1]}`);
    variants.add(ossMatch[1]);
  }

  // 路径与文件名截取（用于匹配相对路径）
  try {
    const urlObj = new URL(raw, 'http://localhost');
    if (urlObj.pathname && urlObj.pathname.length > 1) {
      variants.add(urlObj.pathname);
      const subPath = urlObj.pathname.replace(/^\/[^/]+/, '');
      if (subPath && subPath.length > 2) {
        variants.add(subPath);
      }
    }
  } catch {
    if (raw.startsWith('/')) {
      variants.add(raw);
    }
  }

  return Array.from(variants).filter((v) => v.length > 2);
}

/**
 * 严格全量水合反向扫描指定媒体直链的在用引用情况
 */
export function checkMediaReferences(
  mediaUrl: string,
  hydratedPosts: Array<{ id: number; title: string; slug?: string; cover?: string; content?: string }>,
  memos: Memo[] = [],
  settings?: SiteSetting | null
): MediaReferenceInfo {
  if (!mediaUrl) {
    return {
      url: '',
      isLocked: false,
      usedInPosts: [],
      usedInMemos: [],
      usedInSettings: [],
    };
  }

  const normalizedUrl = mediaUrl.trim();
  const variants = getMediaUrlVariants(normalizedUrl);
  const isMatch = (target?: string | null) => {
    if (!target) return false;
    return variants.some((v) => target.includes(v));
  };

  const usedInPosts: Array<{ id: number; title: string; slug?: string }> = [];
  const usedInMemos: Array<{ id: number; summary: string }> = [];
  const usedInSettings: string[] = [];

  // 1. 扫描全部博文封面与正文
  for (const post of hydratedPosts) {
    const hasCover = isMatch(post.cover);
    const hasContent = isMatch(post.content);
    if (hasCover || hasContent) {
      usedInPosts.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
      });
    }
  }

  // 2. 扫描随记配图
  for (const memo of memos) {
    const memoImages = memo.images;
    const hasImageMatch =
      typeof memoImages === 'string'
        ? isMatch(memoImages)
        : Array.isArray(memoImages)
        ? (memoImages as string[]).some((img) => isMatch(img))
        : false;

    if (hasImageMatch) {
      usedInMemos.push({
        id: memo.id,
        summary: memo.content ? memo.content.slice(0, 30) : '随记配图',
      });
    }
  }

  // 3. 扫描全局设置（站长头像、Hero 封面等）
  if (settings) {
    if (isMatch(settings.avatar)) {
      usedInSettings.push('站长头像 (settings.avatar)');
    }
    if (isMatch(settings.logo)) {
      usedInSettings.push('站点 Logo (settings.logo)');
    }
    if (isMatch(settings.heroVideoUrl)) {
      usedInSettings.push('主页 Hero 视频背景 (settings.heroVideoUrl)');
    }
    if (isMatch(settings.bgMusicUrl)) {
      usedInSettings.push('背景音乐 (settings.bgMusicUrl)');
    }
  }

  const isLocked = usedInPosts.length > 0 || usedInMemos.length > 0 || usedInSettings.length > 0;

  return {
    url: normalizedUrl,
    isLocked,
    usedInPosts,
    usedInMemos,
    usedInSettings,
  };
}

/**
 * 在用防删锁校验守卫：被引用资源严格禁止删除
 */
export function assertMediaCanBeDeleted(refInfo: MediaReferenceInfo): void {
  if (refInfo.isLocked) {
    const count = (refInfo.usedInPosts.length + refInfo.usedInMemos.length) || refInfo.usedInSettings.length || 1;
    throw new Error(
      `[MEDIA LOCK ACTIVE] 该图片正在被 ${count} 篇博文或随记引用，已触发在用防删锁，禁止删除`
    );
  }
}

/**
 * Media GC 孤立僵尸文件扫描：筛选全站未被任何实体引用的废弃资产
 */
export function scanOrphanMediaAssets(
  allMedia: Media[],
  hydratedPosts: Array<{ id: number; title: string; slug?: string; cover?: string; content?: string }>,
  memos: Memo[] = [],
  settings?: SiteSetting | null
): Media[] {
  return allMedia.filter((media) => {
    const ref = checkMediaReferences(media.url, hydratedPosts, memos, settings);
    return !ref.isLocked;
  });
}

/**
 * 读取回收站中的资产
 */
export function getRecycleBinAssets(): RecycledMediaAsset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECYCLE_BIN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read recycle bin:', err);
    return [];
  }
}

/**
 * 移入回收站软删除冷冻 30 天
 */
export function moveToRecycleBin(assets: Media[]): RecycledMediaAsset[] {
  if (typeof window === 'undefined') return [];
  const currentBin = getRecycleBinAssets();
  const now = Date.now();

  const newItems: RecycledMediaAsset[] = assets.map((a) => ({
    ...a,
    originalId: a.id,
    recycleAt: now,
    purgeAfterDays: 30,
  }));

  // 幂等防重
  const existingIds = new Set(currentBin.map((item) => item.id));
  const merged = [...currentBin];
  for (const item of newItems) {
    if (!existingIds.has(item.id)) {
      merged.push(item);
    }
  }

  try {
    localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('Failed to update recycle bin:', err);
  }

  return newItems;
}

/**
 * 从回收站恢复资产
 */
export function restoreFromRecycleBin(assetIds: number[]): RecycledMediaAsset[] {
  if (typeof window === 'undefined') return [];
  const currentBin = getRecycleBinAssets();
  const idSet = new Set(assetIds);
  const remaining = currentBin.filter((a) => !idSet.has(a.id));
  const restored = currentBin.filter((a) => idSet.has(a.id));

  try {
    localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.error('Failed to restore from recycle bin:', err);
  }

  return restored;
}

/**
 * 彻底物理清空回收站资产
 */
export function purgeFromRecycleBin(assetIds: number[]): void {
  if (typeof window === 'undefined') return;
  const currentBin = getRecycleBinAssets();
  const idSet = new Set(assetIds);
  const remaining = currentBin.filter((a) => !idSet.has(a.id));

  try {
    localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.error('Failed to purge recycle bin:', err);
  }
}
