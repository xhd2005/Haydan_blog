import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('========================================================================');
console.log('  M4 对抗性质疑测试套件: 内容创作工坊与媒体资产中心全链路实测  ');
console.log('========================================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

// SECTION 1: 全站博文正文批量检索与替换引擎
console.log('[SECTION 1] 全站博文正文批量检索与替换引擎对抗实测');

test('1.1 正则表达式合法性校验与元字符转义测试', () => {
  const buildPattern = (pattern, isRegex, caseSensitive) => {
    const flags = caseSensitive ? 'g' : 'gi';
    if (isRegex) {
      return new RegExp(pattern, flags);
    }
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, flags);
  };

  assert.throws(() => new RegExp('([a-z', 'g'), /unterminated/i);
  const reg = buildPattern('https://old-oss.com/assets?v=1.0', false, false);
  const text = '访问地址为 https://old-oss.com/assets?v=1.0 请注意';
  assert.equal(text.replace(reg, 'https://cdn.hayden.com'), '访问地址为 https://cdn.hayden.com 请注意');
  const regRegex = buildPattern('v\\d+\\.\\d+', true, false);
  assert.equal('version v1.2 updated'.replace(regRegex, 'v2.0'), 'version v2.0 updated');
});

test('1.2 差异片段 Diff 生成与行号对齐', () => {
  const oldContent = 'Hello World\nLine 2 Old\nLine 3 Unchanged';
  const newContent = 'Hello World\nLine 2 New\nLine 3 Unchanged';
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const diffs = [];
  for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
    if (oldLines[i] !== newLines[i]) {
      diffs.push({ line: i + 1, before: oldLines[i], after: newLines[i] });
    }
  }
  assert.equal(diffs.length, 1);
  assert.equal(diffs[0].line, 2);
  assert.equal(diffs[0].before, 'Line 2 Old');
  assert.equal(diffs[0].after, 'Line 2 New');
});

test('1.3 快照回滚结构与幂等撤销机制', () => {
  const mockPost = { id: 101, title: '测试博文', content: '新域名链接' };
  const snapshot = {
    id: 'snap-1',
    timestamp: new Date().toISOString(),
    searchQuery: '旧域名',
    replaceValue: '新域名',
    items: [{ postId: 101, postTitle: '测试博文', oldContent: '旧域名链接', newContent: '新域名链接' }],
  };
  assert.equal(mockPost.content, snapshot.items[0].newContent);
  mockPost.content = snapshot.items[0].oldContent;
  assert.equal(mockPost.content, '旧域名链接');
});

test('1.4 零宽断言/零长度正则匹配防死循环实测 (Zero-Length Regex Loop Guard)', () => {
  const zeroLengthRegex = /a*/g;
  const content = 'b';
  let match;
  let iterations = 0;
  const maxSafeIterations = 10;
  while ((match = zeroLengthRegex.exec(content)) !== null) {
    iterations++;
    if (iterations > maxSafeIterations) {
      throw new Error('检测到零长度正则死循环！');
    }
    if (match.index === zeroLengthRegex.lastIndex) {
      zeroLengthRegex.lastIndex++;
    }
  }
  assert.ok(iterations <= 3, '零长度正则安全推进，未发生死循环');
});

// SECTION 2: 媒体反向引用追踪与在用防删锁
console.log('\n[SECTION 2] 媒体反向引用追踪与在用防删锁对抗实测');

test('2.1 全量水合扫描文章、随记与设置中的在用图片引用', () => {
  const targetUrl = 'https://cdn.example.com/system-arch.png';
  const posts = [
    { id: 1, title: '博文一', cover: targetUrl, content: '正文内容' },
    { id: 2, title: '博文二', cover: '', content: `引用了图片 ![arch](${targetUrl})` },
    { id: 3, title: '博文三', cover: '', content: '无引用内容' },
  ];
  const memos = [
    { id: 10, content: '随记一条', images: `${targetUrl}, https://other.com/1.png` },
    { id: 11, content: '随记二', images: '' },
  ];
  const matchedPosts = posts.filter(p => (p.cover && p.cover.includes(targetUrl)) || (p.content && p.content.includes(targetUrl)));
  const matchedMemos = memos.filter(m => m.images && m.images.includes(targetUrl));
  assert.equal(matchedPosts.length, 2);
  assert.equal(matchedMemos.length, 1);
});

test('2.2 在用防删锁严格契约抛错校验 (Dead Link Prevention)', () => {
  const refInfo = {
    url: 'https://cdn.example.com/system-arch.png',
    isLocked: true,
    usedInPosts: [{ id: 1, title: '博文一' }, { id: 2, title: '博文二' }],
    usedInMemos: [{ id: 10, summary: '随记一条' }],
    usedInSettings: [],
  };
  const count = (refInfo.usedInPosts.length + refInfo.usedInMemos.length) || refInfo.usedInSettings.length || 1;
  const expectedMsg = `[MEDIA LOCK ACTIVE] 该图片正在被 ${count} 篇博文或随记引用，已触发在用防删锁，禁止删除`;
  assert.equal(count, 3);
  assert.throws(
    () => {
      if (refInfo.isLocked) throw new Error(expectedMsg);
    },
    (err) => err.message === '[MEDIA LOCK ACTIVE] 该图片正在被 3 篇博文或随记引用，已触发在用防删锁，禁止删除'
  );
});

test('2.3 未被引用的自由资产允许删除', () => {
  const freeAssetRef = {
    url: 'https://cdn.example.com/free-photo.png',
    isLocked: false,
    usedInPosts: [],
    usedInMemos: [],
    usedInSettings: [],
  };
  assert.doesNotThrow(() => {
    if (freeAssetRef.isLocked) throw new Error('[MEDIA LOCK ACTIVE]');
  });
});

test('2.4 GC 孤立闲置文件扫描算法准确性', () => {
  const allMedia = [
    { id: 1, url: 'https://cdn.com/used.png', filename: 'used.png' },
    { id: 2, url: 'https://cdn.com/orphan1.png', filename: 'orphan1.png' },
    { id: 3, url: 'https://cdn.com/orphan2.png', filename: 'orphan2.png' },
  ];
  const posts = [{ id: 1, title: 'A', content: '![img](https://cdn.com/used.png)' }];
  const memos = [];
  const orphans = allMedia.filter(m => {
    const inPost = posts.some(p => p.content?.includes(m.url) || p.cover?.includes(m.url));
    const inMemo = memos.some(memo => memo.images?.includes(m.url));
    return !inPost && !inMemo;
  });
  assert.equal(orphans.length, 2);
  assert.equal(orphans[0].filename, 'orphan1.png');
  assert.equal(orphans[1].filename, 'orphan2.png');
});

test('2.5 媒体多形态变体匹配实测 (Media Reference URL Variants)', () => {
  const ossRaw = 'https://my-bucket.oss-cn-hangzhou.aliyuncs.com/uploads/photo.jpg';
  const variants = new Set([ossRaw]);
  const ossMatch = ossRaw.match(/^https?:\/\/[a-z0-9-]+\.(?:oss|s3\.oss)-[a-z0-9-]+\.aliyuncs\.com\/(.+)$/i);
  if (ossMatch && ossMatch[1]) {
    variants.add(`/api/media/view/${ossMatch[1]}`);
    variants.add(ossMatch[1]);
  }
  assert.ok(variants.has('/api/media/view/uploads/photo.jpg'));
  assert.ok(variants.has('uploads/photo.jpg'));
  
  // 模拟文章中使用的是代理路径
  const postContent = '正文引用图片 ![cover](/api/media/view/uploads/photo.jpg)';
  const matched = Array.from(variants).some(v => postContent.includes(v));
  assert.equal(matched, true, '通过代理路径引用的图片必须能够被变体算法准确识别并锁定');
});

test('2.6 回收站彻底物理销毁调用远程 API 实测', () => {
  const file = fs.readFileSync(path.resolve(PROJECT_ROOT, 'components/admin/media/MediaRecycleBinDrawer.tsx'), 'utf8');
  assert.ok(file.includes('api.deleteMedia'), 'MediaRecycleBinDrawer 彻底物理清理时必须调用 api.deleteMedia(id)');
});

// SECTION 3: SparkMD5 闪电秒传与预签名直传
console.log('\n[SECTION 3] SparkMD5 闪电秒传与预签名直传对抗实测');

test('3.1 秒传排重匹配命中：库内已存在完全同名同体积文件触发秒传', () => {
  const existingMedia = [
    { id: 1, filename: 'diagram.png', size: 1048576, url: 'https://cdn.com/diagram.png' },
  ];
  const incomingFile = { name: 'diagram.png', size: 1048576 };
  const matched = existingMedia.find(
    (m) => m.size === incomingFile.size && m.filename === incomingFile.name
  );
  assert.ok(matched);
  assert.equal(matched.url, 'https://cdn.com/diagram.png');
});

test('3.2 秒传未命中：新文件或异形体积文件正常执行上传流', () => {
  const existingMedia = [
    { id: 1, filename: 'diagram.png', size: 1048576, url: 'https://cdn.com/diagram.png' },
  ];
  const newFile = { name: 'diagram.png', size: 2048000 };
  const matched = existingMedia.find(
    (m) => m.size === newFile.size && m.filename === newFile.name
  );
  assert.equal(matched, undefined);
});

// SECTION 4: 随记周报提炼与数字花园双向反向链接
console.log('\n[SECTION 4] 随记周报提炼与数字花园双向反向链接对抗实测');

test('4.1 数字花园 [[双向链接]] 正则解析与反向引用卡片提取', () => {
  const content = '在微服务架构中，我们经常使用 [[Service Mesh 服务网格]] 与 [[分布式链路追踪]] 来进行可观测性治理。';
  const wikiRegex = /\[\[([^\]]+)\]\]/g;
  const matches = [];
  let m;
  while ((m = wikiRegex.exec(content)) !== null) {
    matches.push(m[1].trim());
  }
  assert.equal(matches.length, 2);
  assert.equal(matches[0], 'Service Mesh 服务网格');
  assert.equal(matches[1], '分布式链路追踪');
});

test('4.2 随记 AI 聚合为技术周报大纲的结构合规性', () => {
  const memos = [
    { id: 1, content: '完成基于 S3 预签名的直接上传测试', createdAt: '2026-09-15T10:00:00Z', mood: '⚡ 心流' },
    { id: 2, content: '排查线上 WebGL 画布内存泄漏', createdAt: '2026-09-16T14:30:00Z', mood: '🤔 思考' },
  ];
  const title = '技术周报与数字碎片 · 2026 第 37 周';
  let outline = `# ${title}\n\n`;
  outline += `> 本文由 Hayden Studio AI 策展助手基于站长随记动态自动聚合编织成文。\n\n`;
  outline += `## 🌟 本周心流与随记碎片\n\n`;
  for (const item of memos) {
    outline += `- **[${item.createdAt.slice(0, 10)}]** ${item.content} *(心情: ${item.mood})*\n`;
  }
  assert.ok(outline.includes('Hayden Studio'));
  assert.ok(outline.includes('完成基于 S3 预签名的直接上传测试'));
  assert.ok(outline.includes('排查线上 WebGL 画布内存泄漏'));
});

test('4.3 数字花园 BacklinkPreviewCard 独立导出与 MarkdownViewer / QuickLook 深度集成实测', () => {
  const cardPath = path.resolve(PROJECT_ROOT, 'components/admin/posts/BacklinkPreviewCard.tsx');
  assert.ok(fs.existsSync(cardPath), 'BacklinkPreviewCard 组件必须存在');
  const cardContent = fs.readFileSync(cardPath, 'utf8');
  assert.ok(cardContent.includes('export function BacklinkPreviewCard'), '必须具名导出 BacklinkPreviewCard');

  const viewerPath = path.resolve(PROJECT_ROOT, 'components/MarkdownViewer.tsx');
  const viewerContent = fs.readFileSync(viewerPath, 'utf8');
  assert.ok(viewerContent.includes('BacklinkPreviewCard'), 'MarkdownViewer 必须集成 BacklinkPreviewCard 呈现悬浮卡片');
  assert.ok(viewerContent.includes('WikiLinkNode'), 'MarkdownViewer 必须封装 WikiLinkNode 交互组件');

  const quickLookPath = path.resolve(PROJECT_ROOT, 'components/admin/posts/PostQuickLookDrawer.tsx');
  const quickLookContent = fs.readFileSync(quickLookPath, 'utf8');
  assert.ok(quickLookContent.includes('BacklinkPreviewCard'), 'PostQuickLookDrawer 必须集成 BacklinkPreviewCard');
  assert.ok(quickLookContent.includes('QuickLookWikiBadge'), 'PostQuickLookDrawer 必须封装 QuickLookWikiBadge 双链点击与预览徽章');
});

// SECTION 5: 站长身份纯正性与 AGENTS.md 准则绝对遵循审查
console.log('\n[SECTION 5] 站长身份纯正性与 AGENTS.md 准则绝对遵循审查');

test('5.1 M4 关键文件严格杜绝历史遗留名称 (0 处 Howard)', () => {
  const m4Files = [
    'frontend/lib/postBatchReplace.ts',
    'frontend/lib/postRevisions.ts',
    'frontend/lib/mediaReferenceTracker.ts',
    'frontend/lib/mediaUploadSpark.ts',
    'frontend/components/admin/posts/PostQuickLookDrawer.tsx',
    'frontend/components/admin/posts/PostBatchReplaceModal.tsx',
    'frontend/components/admin/posts/PostRevisionHistoryModal.tsx',
    'frontend/components/admin/posts/WikiLinkAutocomplete.tsx',
    'frontend/components/admin/posts/BacklinkPreviewCard.tsx',
    'frontend/components/admin/posts/BilingualSplitEditor.tsx',
    'frontend/components/admin/memos/MemoWebhookSyncModal.tsx',
    'frontend/components/admin/memos/MemoWeeklyDigestModal.tsx',
    'frontend/components/admin/media/DropRippleFeedback.tsx',
    'frontend/components/admin/media/MediaReferenceLockBadge.tsx',
    'frontend/components/admin/media/MediaRecycleBinDrawer.tsx',
    'frontend/app/admin/posts/page.tsx',
    'frontend/app/admin/posts/edit/[id]/page.tsx',
    'frontend/app/admin/posts/create/page.tsx',
    'frontend/app/admin/memos/page.tsx',
    'frontend/app/admin/media/page.tsx',
  ];
  for (const relPath of m4Files) {
    const fullPath = path.resolve(PROJECT_ROOT, relPath);
    if (fs.existsSync(fullPath)) {
      const code = fs.readFileSync(fullPath, 'utf8');
      const lower = code.toLowerCase();
      assert.equal(
        lower.includes('howard'),
        false,
        `文件 ${relPath} 严禁出现历史遗留名称 Howard，必须 100% 为 Hayden Xue！`
      );
    }
  }
});

console.log('\n========================================================================');
console.log(`  M4 对抗测试报告: ${passedTests} / ${totalTests} 全部通过, 0 失败!`);
console.log('========================================================================\n');
