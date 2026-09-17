/**
 * postBatchReplace.ts
 * 
 * 全站博文正文批量查找替换引擎与快照撤销机制
 * 遵从 AGENTS.md 准则 (正文数据水合铁律 & 破坏性操作防误触)
 * 对应 Milestone 4 (Content Creation & Media Hub)
 */

export interface DiffSnippet {
  line: number;
  before: string;
  after: string;
}

export interface PostMatchResult {
  postId: number;
  title: string;
  slug?: string;
  matchCount: number;
  diffSnippets: DiffSnippet[];
  beforeContent: string;
  afterContent: string;
}

export interface BatchReplaceSnapshot {
  snapshotId: string;
  searchPattern: string;
  replaceText: string;
  isRegex: boolean;
  matchCase: boolean;
  timestamp: string;
  updatedCount: number;
  posts: Array<{
    postId: number;
    title: string;
    beforeContent: string;
    afterContent: string;
  }>;
}

const BATCH_REPLACE_SNAPSHOTS_KEY = 'hayden_post_batch_replace_snapshots';

/**
 * 校验并构造安全正则表达式
 */
export function buildSearchRegex(pattern: string, isRegex: boolean, matchCase: boolean): RegExp {
  if (!pattern || typeof pattern !== 'string') {
    throw new Error('搜索内容不能为空');
  }

  let regexSource = pattern;
  if (!isRegex) {
    // 对普通纯文本转义全部特殊正则元字符
    regexSource = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const flags = matchCase ? 'g' : 'gi';
  try {
    return new RegExp(regexSource, flags);
  } catch (err: any) {
    throw new Error(`无效的正则表达式: ${err.message}`);
  }
}

/**
 * 预览批量替换结果（必须传入水合过 full content 的博文对象）
 */
export function previewBatchReplace(
  hydratedPosts: Array<{ id: number; title: string; content?: string; slug?: string }>,
  searchPattern: string,
  replaceText: string,
  isRegex = false,
  matchCase = true,
  targetPostIds?: number[] | null
): PostMatchResult[] {
  const regex = buildSearchRegex(searchPattern, isRegex, matchCase);
  const results: PostMatchResult[] = [];
  const targetSet = targetPostIds && targetPostIds.length > 0 ? new Set(targetPostIds) : null;

  for (const post of hydratedPosts) {
    if (targetSet && !targetSet.has(post.id)) continue;

    const content = post.content || '';
    regex.lastIndex = 0;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      matches.push(match);
      if (!regex.global) break;
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }

    if (matches.length > 0) {
      const lines = content.split('\n');
      const diffSnippets: DiffSnippet[] = [];

      lines.forEach((line, idx) => {
        regex.lastIndex = 0;
        if (regex.test(line)) {
          regex.lastIndex = 0;
          diffSnippets.push({
            line: idx + 1,
            before: line,
            after: line.replace(regex, replaceText),
          });
        }
      });

      regex.lastIndex = 0;
      const afterContent = content.replace(regex, replaceText);

      results.push({
        postId: post.id,
        title: post.title,
        slug: post.slug,
        matchCount: matches.length,
        diffSnippets,
        beforeContent: content,
        afterContent,
      });
    }
  }

  return results;
}

/**
 * 获取本地存储的批量替换快照列表
 */
export function getBatchReplaceSnapshots(): BatchReplaceSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BATCH_REPLACE_SNAPSHOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read batch replace snapshots:', err);
    return [];
  }
}

/**
 * 保存批量替换快照至本地存储
 */
export function saveBatchReplaceSnapshot(snapshot: BatchReplaceSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    const snapshots = getBatchReplaceSnapshots();
    const updated = [snapshot, ...snapshots.filter(s => s.snapshotId !== snapshot.snapshotId)].slice(0, 20);
    localStorage.setItem(BATCH_REPLACE_SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save batch replace snapshot:', err);
  }
}

/**
 * 根据 snapshotId 获取单个快照
 */
export function getBatchReplaceSnapshotById(snapshotId: string): BatchReplaceSnapshot | null {
  const snapshots = getBatchReplaceSnapshots();
  return snapshots.find(s => s.snapshotId === snapshotId) || null;
}

/**
 * 删除指定快照
 */
export function removeBatchReplaceSnapshot(snapshotId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const snapshots = getBatchReplaceSnapshots();
    const updated = snapshots.filter(s => s.snapshotId !== snapshotId);
    localStorage.setItem(BATCH_REPLACE_SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove snapshot:', err);
  }
}
