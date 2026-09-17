/**
 * postRevisions.ts
 * 
 * 博文历史版本与时光机快照系统 (Post Revisions & Time Travel)
 * 遵从 AGENTS.md 准则
 * 对应 Milestone 4 (Content Creation & Media Hub)
 */

export interface PostRevision {
  id: string;
  postId: number;
  title: string;
  content: string;
  timestamp: string;
  wordCount: number;
  note: string;
}

export interface DiffLine {
  type: 'same' | 'added' | 'removed';
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

const REVISIONS_PREFIX = 'hayden_post_revisions_';

export function getPostRevisionsKey(postId: number): string {
  return `${REVISIONS_PREFIX}${postId}`;
}

/**
 * 获取指定文章的历史版本列表（按时间倒序）
 */
export function getPostRevisions(postId: number): PostRevision[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getPostRevisionsKey(postId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read post revisions:', err);
    return [];
  }
}

/**
 * 保存一次版本快照（最多保留 25 次历史版本）
 */
export function savePostRevision(
  postId: number,
  title: string,
  content: string,
  note = '自动快照'
): PostRevision {
  const revisions = getPostRevisions(postId);
  const now = new Date().toISOString();
  
  // 简易去重：如果最近一次快照内容完全一致且在 30 秒内，避免重复刷版
  if (revisions.length > 0) {
    const latest = revisions[0];
    if (latest.title === title && latest.content === content) {
      return latest;
    }
  }

  const newRevision: PostRevision = {
    id: `rev-${postId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    postId,
    title,
    content,
    timestamp: now,
    wordCount: content.length,
    note,
  };

  const updated = [newRevision, ...revisions].slice(0, 25);
  try {
    localStorage.setItem(getPostRevisionsKey(postId), JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save post revision:', err);
  }

  return newRevision;
}

/**
 * 删除单个历史版本
 */
export function deletePostRevision(postId: number, revisionId: string): void {
  if (typeof window === 'undefined') return;
  const revisions = getPostRevisions(postId);
  const updated = revisions.filter(r => r.id !== revisionId);
  try {
    localStorage.setItem(getPostRevisionsKey(postId), JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete post revision:', err);
  }
}

/**
 * 计算两个文本版本的行级对比差异 (Git-style Diff)
 */
export function computeRevisionDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];
  const diff: DiffLine[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);
  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    if (oldIdx < oldLines.length && newIdx < newLines.length && oldLine === newLine) {
      diff.push({
        type: 'same',
        text: oldLine,
        oldLineNumber: oldIdx + 1,
        newLineNumber: newIdx + 1,
      });
      oldIdx++;
      newIdx++;
    } else if (newIdx < newLines.length && (oldIdx >= oldLines.length || !oldLines.includes(newLine))) {
      diff.push({
        type: 'added',
        text: newLine,
        newLineNumber: newIdx + 1,
      });
      newIdx++;
    } else if (oldIdx < oldLines.length && (newIdx >= newLines.length || !newLines.includes(oldLine))) {
      diff.push({
        type: 'removed',
        text: oldLine,
        oldLineNumber: oldIdx + 1,
      });
      oldIdx++;
    } else {
      // 两边均有不同行
      if (oldIdx < oldLines.length) {
        diff.push({
          type: 'removed',
          text: oldLines[oldIdx],
          oldLineNumber: oldIdx + 1,
        });
        oldIdx++;
      }
      if (newIdx < newLines.length) {
        diff.push({
          type: 'added',
          text: newLines[newIdx],
          newLineNumber: newIdx + 1,
        });
        newIdx++;
      }
    }

    // 防御性硬上限，避免超大文本死循环
    if (diff.length > 2000) {
      diff.push({
        type: 'same',
        text: '... (差异内容过多，已截断显示)',
      });
      break;
    }
  }

  return diff;
}
