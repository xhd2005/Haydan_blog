/**
 * 离线本地沙盒与云端三向合并 (Three-way Merge) 引擎
 */

export interface ThreeWayMergeConflict {
  line: number;
  base: string;
  local: string;
  cloud: string;
}

export interface ThreeWayMergeResult {
  hasConflict: boolean;
  conflicts: ThreeWayMergeConflict[];
  mergedContent: string;
}

/**
 * 智能三向合并计算函数
 */
export function computeThreeWayMerge(
  baseContent: string,
  localContent: string,
  cloudContent: string
): ThreeWayMergeResult {
  if (localContent === cloudContent) {
    return { hasConflict: false, conflicts: [], mergedContent: localContent };
  }
  if (localContent === baseContent) {
    return { hasConflict: false, conflicts: [], mergedContent: cloudContent };
  }
  if (cloudContent === baseContent) {
    return { hasConflict: false, conflicts: [], mergedContent: localContent };
  }

  const baseLines = (baseContent || '').split('\n');
  const localLines = (localContent || '').split('\n');
  const cloudLines = (cloudContent || '').split('\n');

  const maxLines = Math.max(baseLines.length, localLines.length, cloudLines.length);
  const conflicts: ThreeWayMergeConflict[] = [];
  const mergedLines: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const b = baseLines[i] !== undefined ? baseLines[i] : '';
    const l = localLines[i] !== undefined ? localLines[i] : '';
    const c = cloudLines[i] !== undefined ? cloudLines[i] : '';

    if (l === c) {
      mergedLines.push(l);
    } else if (l === b) {
      mergedLines.push(c);
    } else if (c === b) {
      mergedLines.push(l);
    } else {
      // 两侧均存在不同修改，产生冲突
      conflicts.push({ line: i + 1, base: b, local: l, cloud: c });
      mergedLines.push(
        `<<<<<<< 本地修改 (Local Sandbox)\n${l}\n=======\n${c}\n>>>>>>> 云端修改 (Remote Cloud)`
      );
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    mergedContent: mergedLines.join('\n'),
  };
}
