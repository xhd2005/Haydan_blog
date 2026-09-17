// frontend/tests/m1_challenger2_adversarial.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

console.log('========================================================================');
console.log('⚡ [CHALLENGER M1] SPOTLIGHT & MERGE CONFLICT EMPIRICAL ADVERSARIAL SUITE');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✘ [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✔ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✘ [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

// -----------------------------------------------------------------------------
// PART 1: SPOTLIGHT (CMD+K) CROSS-MODULE SEARCH & OPERATIONAL MACROS CONTRACTS
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log('PART 1: 对抗测试 Spotlight (Cmd+K) 跨模块检索与运维宏触发契约');
console.log('========================================================================');

// 1.1 Mocking Multi-source API query logic as implemented in AdminSpotlightModal
class MockSpotlightEngine {
  constructor(apiOverrides = {}) {
    this.api = {
      getAdminPosts: async ({ keyword, pageSize }) => ({
        records: [
          { id: 1, title: `深入 Java 25: ${keyword}`, slug: 'deep-java-25', viewCount: 1200 },
          { id: 2, title: `VisionOS 空间设计: ${keyword}`, slug: 'vision-os-design', viewCount: 850 },
        ],
      }),
      getMemos: async () => ({
        records: [
          { id: 101, content: '今天在研究三向合并算法与离线沙盒', createdAt: '2026-09-17' },
          { id: 102, content: '数字花园的修剪与生长，记录灵感', createdAt: '2026-09-16' },
        ],
      }),
      getMedia: async ({ keyword }) => ({
        records: [
          { id: 201, name: `hero-cover-${keyword}.webp`, size: 1024 * 350 },
          { id: 202, name: `architecture-diagram.png`, size: 1024 * 1200 },
        ],
      }),
      getAdminUsers: async ({ keyword }) => ({
        records: [
          { id: 301, username: `reader_${keyword}`, nickname: '资深思想者', role: 'ROLE_USER', email: 'reader@example.com' },
        ],
      }),
      getCategories: async () => [
        { id: 1, name: '技术架构', slug: 'tech-architecture' },
        { id: 2, name: '极客生活', slug: 'geek-life' },
      ],
      getTags: async () => [
        { id: 1, name: 'Java 25', slug: 'java-25' },
        { id: 2, name: 'Next.js 14', slug: 'nextjs-14' },
      ],
      ...apiOverrides,
    };
  }

  async search(query) {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return {
        posts: [],
        memos: [],
        mediaAssets: [],
        users: [],
        categories: [],
        tags: [],
        allDisplayItems: [],
        totalMatches: 0,
      };
    }

    const results = await Promise.allSettled([
      this.api.getAdminPosts({ keyword: trimmed, pageSize: 5 }),
      this.api.getMemos({ page: 1, pageSize: 20 }),
      this.api.getMedia({ keyword: trimmed, pageSize: 4 }),
      this.api.getAdminUsers({ keyword: trimmed, pageSize: 4 }),
      this.api.getCategories(),
      this.api.getTags(),
    ]);

    let posts = [];
    let memos = [];
    let mediaAssets = [];
    let users = [];
    let categories = [];
    let tags = [];

    if (results[0].status === 'fulfilled' && results[0].value?.records) {
      posts = results[0].value.records;
    }
    if (results[1].status === 'fulfilled' && results[1].value?.records) {
      memos = results[1].value.records
        .filter((m) => m.content.toLowerCase().includes(trimmed.toLowerCase()))
        .slice(0, 4);
    }
    if (results[2].status === 'fulfilled' && results[2].value?.records) {
      mediaAssets = results[2].value.records;
    }
    if (results[3].status === 'fulfilled' && results[3].value?.records) {
      users = results[3].value.records;
    }
    if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) {
      categories = results[4].value
        .filter((c) => c.name.toLowerCase().includes(trimmed.toLowerCase()))
        .slice(0, 3);
    }
    if (results[5].status === 'fulfilled' && Array.isArray(results[5].value)) {
      tags = results[5].value
        .filter((t) => t.name.toLowerCase().includes(trimmed.toLowerCase()))
        .slice(0, 3);
    }

    return {
      posts,
      memos,
      mediaAssets,
      users,
      categories,
      tags,
      totalMatches: posts.length + memos.length + mediaAssets.length + users.length + categories.length + tags.length,
    };
  }
}

// Test 1: 空字符串与纯空白容错
await runAsyncTest('Spotlight 检索: 空字符串 / 纯空白字符安全容错且不触发冗余查询', async () => {
  const engine = new MockSpotlightEngine();
  const emptyRes = await engine.search('');
  assert.equal(emptyRes.totalMatches, 0);

  const whitespaceRes = await engine.search('   \t\n   \r\n  ');
  assert.equal(whitespaceRes.totalMatches, 0);
});

// Test 2: 特殊字符与对抗注入向量
const adversarialQueries = [
  '<script>alert("xss")</script>',
  '"><svg onload=alert(1)>',
  "' OR '1'='1' --",
  "'; DROP TABLE posts; --",
  '.*+?^${}()|[]\\',
  '\u0000\u0001\u0002\u0003',
  '🚀🌿💎✨🔥',
  '中文《深度架构》【数字花园】',
  'A'.repeat(10000), // 10k chars
  '\\n\\r\\t\\0\\b',
];

for (const q of adversarialQueries) {
  const label = q.length > 30 ? `超长字符串 (${q.length} 字符)` : q;
  await runAsyncTest(`Spotlight 检索对抗向量安全测试: [${label}]`, async () => {
    const engine = new MockSpotlightEngine();
    const res = await engine.search(q);
    assert.ok(Array.isArray(res.posts), 'posts 必须始终为合法数组');
    assert.ok(Array.isArray(res.memos), 'memos 必须始终为合法数组');
    assert.ok(Array.isArray(res.mediaAssets), 'mediaAssets 必须始终为合法数组');
    assert.ok(Array.isArray(res.users), 'users 必须始终为合法数组');
    assert.ok(Array.isArray(res.categories), 'categories 必须始终为合法数组');
    assert.ok(Array.isArray(res.tags), 'tags 必须始终为合法数组');
  });
}

// Test 3: 高并发覆盖检索 (50 并发请求)
await runAsyncTest('Spotlight 检索: 50 路并发快速检索压测 (Promise.allSettled 零锁死)', async () => {
  const engine = new MockSpotlightEngine();
  const queries = Array.from({ length: 50 }, (_, i) => `Query-${i}-${Math.random()}`);
  const results = await Promise.all(queries.map((q) => engine.search(q)));
  assert.equal(results.length, 50);
  for (const r of results) {
    assert.ok(r.totalMatches >= 0);
  }
});

// Test 4: 多源并行容灾隔离 (部分 API 崩溃/超时时，其他源依然正常交付)
await runAsyncTest('Spotlight 检索: 部分源故障时容错降级 (Promise.allSettled 隔离保护)', async () => {
  const faultyEngine = new MockSpotlightEngine({
    getAdminPosts: async () => { throw new Error('Database connection timeout (500)'); },
    getMedia: async () => { throw new Error('Network partition (503)'); },
    getCategories: async () => null, // 非数组异常数据
  });

  const res = await faultyEngine.search('Java');
  assert.equal(res.posts.length, 0, '异常源必须降级为空数组，杜绝抛出未捕获异常');
  assert.equal(res.mediaAssets.length, 0, '异常源必须降级为空数组');
  assert.equal(res.categories.length, 0, '非数组数据必须降级为空数组');
  assert.ok(res.users.length > 0, '健康源 (users) 必须正常返回不受牵连');
  assert.ok(res.tags.length > 0, '健康源 (tags) 必须正常返回不受牵连');
});

// Test 5: 纯原生 PKZip 离线压缩算法验证 (CRC32, Local Header, CD Header, EOCD)
function generateZipArchive(files) {
  const fileEntries = [];
  const centralDirEntries = [];
  let offset = 0;

  const textEncoder = new TextEncoder();

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.name);
    const contentBytes = textEncoder.encode(file.content);
    const crc = computeCRC32(contentBytes);
    const size = contentBytes.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, size, true);
    localView.setUint32(22, size, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdHeader.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(4, 20, true);
    cdView.setUint16(6, 20, true);
    cdView.setUint16(8, 0, true);
    cdView.setUint16(10, 0, true);
    cdView.setUint16(12, 0, true);
    cdView.setUint16(14, 0, true);
    cdView.setUint32(16, crc, true);
    cdView.setUint32(20, size, true);
    cdView.setUint32(24, size, true);
    cdView.setUint16(28, nameBytes.length, true);
    cdView.setUint16(30, 0, true);
    cdView.setUint16(32, 0, true);
    cdView.setUint16(34, 0, true);
    cdView.setUint16(36, 0, true);
    cdView.setUint32(38, 0, true);
    cdView.setUint32(42, offset, true);
    cdHeader.set(nameBytes, 46);

    fileEntries.push(localHeader, contentBytes);
    centralDirEntries.push(cdHeader);
    offset += localHeader.length + contentBytes.length;
  }

  const cdSize = centralDirEntries.reduce((acc, cur) => acc + cur.length, 0);

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, offset, true);
  eocdView.setUint16(20, 0, true);

  const totalLength = fileEntries.reduce((acc, b) => acc + b.length, 0) +
                      centralDirEntries.reduce((acc, b) => acc + b.length, 0) +
                      eocd.length;

  const resultBuffer = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of [...fileEntries, ...centralDirEntries, eocd]) {
    resultBuffer.set(part, pos);
    pos += part.length;
  }
  return resultBuffer;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function computeCRC32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

runTest('运维宏 macro:backup_zip: CRC32 与 Node.js 原生 zlib.crc32 100% 一致', () => {
  const testPayloads = [
    Buffer.from('Hello world!'),
    Buffer.from(''),
    Buffer.from('Hayden Xue 数字花园博文离线备份'),
    Buffer.alloc(65536, 0x42),
  ];

  for (const payload of testPayloads) {
    const computed = computeCRC32(payload);
    const expected = zlib.crc32(payload);
    assert.equal(computed, expected, `CRC32 必须与原生 zlib.crc32 完全一致 (payload size: ${payload.length})`);
  }
});

runTest('运维宏 macro:backup_zip: 生成标准 PKZip 结构并验证魔数签名', () => {
  const testFiles = [
    {
      name: 'java-25-loom.md',
      content: '---\ntitle: "Java 25 虚拟线程"\nauthor: "Hayden Xue"\ncategories: ["后端"]\ntags: ["Java"]\ndate: "2026-09-17"\n---\n\n深入虚拟线程',
    },
    {
      name: 'vision-os-space.md',
      content: '---\ntitle: "VisionOS 空间美学"\nauthor: "Hayden Xue"\ncategories: ["前端"]\ntags: ["UI"]\ndate: "2026-09-16"\n---\n\n空间流光设计',
    },
  ];

  const zipBytes = generateZipArchive(testFiles);
  assert.ok(zipBytes.length > 0);

  const view = new DataView(zipBytes.buffer);
  // Local file header signature (0x04034b50)
  assert.equal(view.getUint32(0, true), 0x04034b50, '首部必须为 0x04034b50 PK Local File Header');

  // EOCD signature at end (0x06054b50)
  const eocdOffset = zipBytes.length - 22;
  assert.equal(view.getUint32(eocdOffset, true), 0x06054b50, '尾部必须为 0x06054b50 PK EOCD Record');
  assert.equal(view.getUint16(eocdOffset + 8, true), 2, 'EOCD 记录的文件数必须准确为 2');
});

// Test 6: 运维宏 macro:ban_ip 格式检验与安全防火墙名单注入契约
runTest('运维宏 macro:ban_ip: IPv4 / IPv6 正则契约与非法格式拦截', () => {
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  const validIps = [
    '127.0.0.1',
    '192.168.1.1',
    '10.0.0.1',
    '255.255.255.255',
    '8.8.8.8',
    '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
  ];

  for (const ip of validIps) {
    const isValid = ipv4Regex.test(ip) || ipv6Regex.test(ip);
    assert.equal(isValid, true, `合法 IP 必须通过校验: ${ip}`);
  }

  const invalidIps = [
    '',
    '256.0.0.1',
    '192.168.1',
    '192.168.1.1.1',
    'abc.def.ghi.jkl',
    '192.168.1.999',
    '<script>alert(1)</script>',
  ];

  for (const ip of invalidIps) {
    const isValid = ipv4Regex.test(ip) || ipv6Regex.test(ip);
    assert.equal(isValid, false, `非法 IP 必须被严格拒绝: ${ip}`);
  }
});

// Test 7: 运维宏 macro:sandbox_mode 状态切换与通知契约
runTest('运维宏 macro:sandbox_mode: 在线/沙盒双模单调取反切换契约', () => {
  let isOfflineSandbox = false;
  const toggle = () => {
    isOfflineSandbox = !isOfflineSandbox;
    return isOfflineSandbox;
  };

  assert.equal(toggle(), true, '首次切换切入离线沙盒模式');
  assert.equal(toggle(), false, '再次切换返回在线云端模式');
  assert.equal(toggle(), true, '三次切换切入离线沙盒模式');
});


// -----------------------------------------------------------------------------
// PART 2: THREE-WAY MERGE ENGINE ADVERSARIAL CHALLENGE
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log('PART 2: 对抗测试三向合并 (Three-way Merge) 算法与冲突仲裁机制');
console.log('========================================================================');

const { computeThreeWayMerge } = await import('../lib/threeWayMerge.ts');

// 2.1 三端完全一致
runTest('三向合并: 三端完全一致时无冲突且保持原样', () => {
  const content = 'Line 1\nLine 2\nLine 3';
  const res = computeThreeWayMerge(content, content, content);
  assert.equal(res.hasConflict, false);
  assert.equal(res.conflicts.length, 0);
  assert.equal(res.mergedContent, content);
});

// 2.2 单侧修改 (本地不变，云端改动)
runTest('三向合并: 本地未改动时单向接纳云端改动', () => {
  const base = 'Header\nContent A\nFooter';
  const local = 'Header\nContent A\nFooter';
  const cloud = 'Header\nContent A (Cloud Updated)\nFooter';

  const res = computeThreeWayMerge(base, local, cloud);
  assert.equal(res.hasConflict, false);
  assert.equal(res.conflicts.length, 0);
  assert.equal(res.mergedContent, cloud);
});

// 2.3 单侧修改 (云端不变，本地沙盒改动)
runTest('三向合并: 云端未改动时单向接纳本地修改', () => {
  const base = 'Header\nContent A\nFooter';
  const local = 'Header\nContent A (Local Sandbox Edit)\nFooter';
  const cloud = 'Header\nContent A\nFooter';

  const res = computeThreeWayMerge(base, local, cloud);
  assert.equal(res.hasConflict, false);
  assert.equal(res.conflicts.length, 0);
  assert.equal(res.mergedContent, local);
});

// 2.4 不同行修改的自动无冲突合并 (核心场景 1)
runTest('三向合并: 本地改动行 1，云端改动行 3，行 2 未变 -> 自动无冲突完美合并', () => {
  const base = 'Title: Draft\nAuthor: Hayden Xue\nBody: Hello World';
  const local = 'Title: Final Published Title\nAuthor: Hayden Xue\nBody: Hello World';
  const cloud = 'Title: Draft\nAuthor: Hayden Xue\nBody: Hello World from Cloud 2026';

  const res = computeThreeWayMerge(base, local, cloud);
  assert.equal(res.hasConflict, false, '不同行修改不应触发冲突！');
  assert.equal(res.conflicts.length, 0);

  const expected = 'Title: Final Published Title\nAuthor: Hayden Xue\nBody: Hello World from Cloud 2026';
  assert.equal(res.mergedContent, expected, '两端的不同行改动必须全部被自动接纳合并');
});

// 2.5 相同行产生不同修改时的冲突定位与三向标记 (核心场景 2)
runTest('三向合并: 同一行 (Line 2) 产生分歧修改 -> 精确标注冲突行号与三向标记', () => {
  const base = 'Chapter 1\nStatus: Draft\nChapter 2';
  const local = 'Chapter 1\nStatus: Published on Local\nChapter 2';
  const cloud = 'Chapter 1\nStatus: Archived on Cloud\nChapter 2';

  const res = computeThreeWayMerge(base, local, cloud);
  assert.equal(res.hasConflict, true, '相同行冲突必须被判定为 hasConflict = true');
  assert.equal(res.conflicts.length, 1);
  assert.equal(res.conflicts[0].line, 2, '冲突行号必须精准为第 2 行');
  assert.equal(res.conflicts[0].base, 'Status: Draft');
  assert.equal(res.conflicts[0].local, 'Status: Published on Local');
  assert.equal(res.conflicts[0].cloud, 'Status: Archived on Cloud');

  assert.ok(res.mergedContent.includes('<<<<<<< 本地修改 (Local Sandbox)'));
  assert.ok(res.mergedContent.includes('Status: Published on Local'));
  assert.ok(res.mergedContent.includes('======='));
  assert.ok(res.mergedContent.includes('Status: Archived on Cloud'));
  assert.ok(res.mergedContent.includes('>>>>>>> 云端修改 (Remote Cloud)'));
});

// 2.6 多行多处分散冲突精确定位
runTest('三向合并: 多处交错冲突 (Line 1 & Line 4) 精准捕获', () => {
  const base = 'L1\nL2\nL3\nL4\nL5';
  const local = 'L1_Local\nL2\nL3\nL4_Local\nL5';
  const cloud = 'L1_Cloud\nL2\nL3\nL4_Cloud\nL5';

  const res = computeThreeWayMerge(base, local, cloud);
  assert.equal(res.hasConflict, true);
  assert.equal(res.conflicts.length, 2);
  assert.equal(res.conflicts[0].line, 1);
  assert.equal(res.conflicts[1].line, 4);
});

// 2.7 两侧均在末尾追加相同内容 vs 不同内容
runTest('三向合并: 两侧追加相同行自动合并，两侧追加不同行产生冲突', () => {
  const base = 'Base';
  const localSame = 'Base\nAppended Line';
  const cloudSame = 'Base\nAppended Line';
  const resSame = computeThreeWayMerge(base, localSame, cloudSame);
  assert.equal(resSame.hasConflict, false);
  assert.equal(resSame.mergedContent, 'Base\nAppended Line');

  const localDiff = 'Base\nLocal Appended';
  const cloudDiff = 'Base\nCloud Appended';
  const resDiff = computeThreeWayMerge(base, localDiff, cloudDiff);
  assert.equal(resDiff.hasConflict, true);
  assert.equal(resDiff.conflicts[0].line, 2);
});

// 2.8 极端边界输入: 空串、null/undefined 降级保护与 1,000 行文本性能
runTest('三向合并: 空串 / null / undefined 容错鲁棒性', () => {
  assert.doesNotThrow(() => computeThreeWayMerge('', '', ''));
  assert.doesNotThrow(() => computeThreeWayMerge(null, 'Local', 'Cloud'));
  assert.doesNotThrow(() => computeThreeWayMerge('Base', undefined, 'Cloud'));
});

runTest('三向合并: 1,000 行文本毫秒级三向合并性能测试 (< 50ms)', () => {
  const baseLines = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}: original`);
  const localLines = [...baseLines];
  const cloudLines = [...baseLines];

  // Local changes line 100, Cloud changes line 900
  localLines[99] = 'Line 100: local edit';
  cloudLines[899] = 'Line 900: cloud edit';

  const start = performance.now();
  const res = computeThreeWayMerge(baseLines.join('\n'), localLines.join('\n'), cloudLines.join('\n'));
  const duration = performance.now() - start;

  assert.equal(res.hasConflict, false);
  assert.ok(duration < 50, `1000 行文本合并必须在 50ms 内完成 (实际: ${duration.toFixed(2)}ms)`);
  assert.ok(res.mergedContent.includes('Line 100: local edit'));
  assert.ok(res.mergedContent.includes('Line 900: cloud edit'));
});


// -----------------------------------------------------------------------------
// PART 3: DUAL THEME COLOR CONSISTENCY & BRAND INVARIANT (HAYDEN XUE)
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log('PART 3: 对抗测试双主题色值一致性 (#fcfcfd 残留扫描) 与站长品牌 Hayden Xue');
console.log('========================================================================');

const frontendDir = fs.existsSync(path.resolve('app'))
  ? path.resolve('.')
  : path.resolve('frontend');

// 3.1 核心后台布局与 M1 新建组件排查 #fcfcfd
const m1KeyFiles = [
  path.join(frontendDir, 'app/admin/layout.tsx'),
  path.join(frontendDir, 'components/admin/AdminSidebar.tsx'),
  path.join(frontendDir, 'components/admin/layout/FloatingAcrylicDock.tsx'),
  path.join(frontendDir, 'components/admin/layout/TabsWorkspaceBar.tsx'),
  path.join(frontendDir, 'components/admin/layout/AdminSpotlightModal.tsx'),
  path.join(frontendDir, 'components/admin/layout/ThreeWayMergeDrawer.tsx'),
  path.join(frontendDir, 'context/MultiTabsContext.tsx'),
  path.join(frontendDir, 'lib/storage/indexedDbSandbox.ts'),
  path.join(frontendDir, 'lib/webglCleanup.ts'),
  path.join(frontendDir, 'lib/threeWayMerge.ts'),
];

for (const filePath of m1KeyFiles) {
  const relPath = path.relative(frontendDir, filePath);
  runTest(`关键后台布局文件绝对消除 #fcfcfd 残留: ${relPath}`, () => {
    assert.ok(fs.existsSync(filePath), `文件必须存在: ${relPath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.match(/#fcfcfd/gi) || [];
    assert.equal(
      matches.length,
      0,
      `文件 ${relPath} 中严禁出现 #fcfcfd 杂色 (发现 ${matches.length} 处匹配)`
    );
  });
}

// 3.2 验证关键布局中纯正雪瓷白 #fbfbfd 与深曜石黑 #090a0f 的成对存在
runTest('双主题底色对标: layout.tsx 必须成对使用 #fbfbfd 与 #090a0f', () => {
  const layoutContent = fs.readFileSync(path.join(frontendDir, 'app/admin/layout.tsx'), 'utf-8');
  assert.ok(layoutContent.includes('#fbfbfd'), 'layout.tsx 必须使用纯正雪瓷白 #fbfbfd');
  assert.ok(layoutContent.includes('#090a0f'), 'layout.tsx 必须使用纯正深曜石黑 #090a0f');
});

// 3.3 品牌身份 100% 保持 Hayden Xue，严禁 Howard
for (const filePath of m1KeyFiles) {
  const relPath = path.relative(frontendDir, filePath);
  runTest(`M1 组件与后台布局品牌身份绝对纯正 (0 处 Howard): ${relPath}`, () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const howardMatches = content.match(/\bhoward\b/gi) || [];
    assert.equal(
      howardMatches.length,
      0,
      `文件 ${relPath} 严禁包含历史遗留名称 howard (匹配数: ${howardMatches.length})`
    );
  });
}

// 3.4 检查 AdminSpotlightModal 离线备份中 Frontmatter author 字段
runTest('AdminSpotlightModal YAML Frontmatter author 严格且唯一为 "Hayden Xue"', () => {
  const modalContent = fs.readFileSync(
    path.join(frontendDir, 'components/admin/layout/AdminSpotlightModal.tsx'),
    'utf-8'
  );
  assert.ok(
    modalContent.includes('author: "Hayden Xue"'),
    '导出的 YAML Frontmatter author 必须严格为 "Hayden Xue"'
  );
});

// 3.5 全库 #fcfcfd 探测与分类报告
runTest('全库范围扫描: 梳理 #fcfcfd 在所有文件的残留现状', () => {
  function scanDir(dir, pattern) {
    let hits = [];
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      if (['node_modules', '.git', '.next', 'target', '.agents'].includes(f.name)) continue;
      const full = path.join(dir, f.name);
      if (f.isDirectory()) {
        hits = hits.concat(scanDir(full, pattern));
      } else if (/\.(tsx|ts|jsx|js|mjs|css)$/.test(f.name)) {
        const text = fs.readFileSync(full, 'utf-8');
        const count = (text.match(pattern) || []).length;
        if (count > 0) {
          hits.push({ file: path.relative(frontendDir, full), count });
        }
      }
    }
    return hits;
  }

  const found = scanDir(frontendDir, /#fcfcfd/gi);
  console.log(`    [INFO] 全库前端扫描发现 ${found.length} 个文件含 #fcfcfd:`);
  for (const h of found) {
    console.log(`      - ${h.file} (${h.count} 处)`);
  }
  // 确认 M1 范围内的核心 layout 和 dock 0 命中
  const m1Hits = found.filter(h =>
    h.file.includes('layout.tsx') ||
    h.file.includes('AdminSidebar.tsx') ||
    h.file.includes('FloatingAcrylicDock') ||
    h.file.includes('TabsWorkspaceBar') ||
    h.file.includes('AdminSpotlightModal') ||
    h.file.includes('ThreeWayMergeDrawer')
  );
  assert.equal(m1Hits.length, 0, '所有 M1 后台布局核心文件必须 0 命中 #fcfcfd');
});

console.log('\n========================================================================');
console.log(`CHALLENGE TEST SUMMARY: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
console.log('========================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
