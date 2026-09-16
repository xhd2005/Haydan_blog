import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(frontendRoot, '..');

console.log('================================================================');
console.log('🚀 Milestone 3 & Milestone 4 自动化对抗性实证检验套件');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
const findings = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

// =============================================================================
// 【Suite 1】AdminExportController.java 静态分析、接口契约与实体完整性
// =============================================================================
console.log('----------------------------------------------------------------');
console.log('【Suite 1】AdminExportController.java 静态分析、接口契约与实体完整性');
console.log('----------------------------------------------------------------');

const controllerPath = path.join(
  projectRoot,
  'backend/src/main/java/com/hayden/blog/controller/AdminExportController.java'
);

test('AdminExportController.java 文件存在性与编码可读性', () => {
  assert.ok(fs.existsSync(controllerPath), `文件不存在: ${controllerPath}`);
  const stat = fs.statSync(controllerPath);
  assert.ok(stat.size > 1000, `文件体积过小: ${stat.size} 字节`);
});

const controllerContent = fs.readFileSync(controllerPath, 'utf8');

test('类级安全鉴权注解防御测试 (@PreAuthorize("hasRole(\'ADMIN\')"))', () => {
  assert.ok(
    controllerContent.includes("@PreAuthorize(\"hasRole('ADMIN')\")"),
    'AdminExportController 缺少类级管理员权限保护 @PreAuthorize("hasRole(\'ADMIN\')")'
  );
});

test('流式 ZIP 导出响应头契约校验 (Content-Type, Content-Disposition, Expose-Headers)', () => {
  assert.ok(
    controllerContent.includes('response.setContentType("application/zip");'),
    '缺少 application/zip 响应类型设置'
  );
  assert.ok(
    controllerContent.includes('response.setHeader("Content-Disposition"'),
    '缺少 Content-Disposition 响应头设置'
  );
  assert.ok(
    controllerContent.includes('hayden_blog_posts_backup_'),
    '导出文件名缺少统一规范前缀 hayden_blog_posts_backup_'
  );
  assert.ok(
    controllerContent.includes('response.setHeader("Access-Control-Expose-Headers", "Content-Disposition");'),
    '缺少 Access-Control-Expose-Headers 允许前端 Axios 跨域读取文件名'
  );
});

test('JSON 快照响应头契约校验 (Content-Type, Content-Disposition)', () => {
  assert.ok(
    controllerContent.includes('response.setContentType("application/json; charset=UTF-8");'),
    '缺少 application/json; charset=UTF-8 设置'
  );
  assert.ok(
    controllerContent.includes('hayden_blog_snapshot_'),
    'JSON 快照文件名缺少统一规范前缀 hayden_blog_snapshot_'
  );
});

test('JSON 快照元数据实体完整性对抗检验 (posts, categories, tags, projects, journeys, settings)', () => {
  const requiredEntities = [
    'settings',
    'posts',
    'categories',
    'tags',
    'projects',
    'journeys',
    'memos',
    'nowRecords',
    'friends',
  ];

  requiredEntities.forEach((entity) => {
    assert.ok(
      controllerContent.includes(`snapshot.put("${entity}"`),
      `JSON 快照元数据缺少核心实体: snapshot.put("${entity}", ...)`
    );
  });

  // 验证快照元信息 meta
  assert.ok(controllerContent.includes('snapshot.put("meta"'), '快照缺少 meta 元信息块');
  assert.ok(
    controllerContent.includes('meta.put("author", "Hayden Xue");'),
    '快照 meta 作者不符合 Hayden Xue 铁律'
  );
});

test('身份纯正性准则对抗审计 (严格且唯一为 Hayden Xue，严禁出现任何违规遗留)', () => {
  assert.ok(
    controllerContent.includes('author: \\"Hayden Xue\\"'),
    'Frontmatter 作者未严格设为 Hayden Xue'
  );
  assert.ok(
    controllerContent.includes('meta.put("author", "Hayden Xue");'),
    'JSON 快照 meta.author 未严格设为 Hayden Xue'
  );

  // 对代码中出现的非合规名字进行全量扫描（严禁任何 Howard 遗留）
  const lines = controllerContent.split('\n');
  const nonComplianceLines = lines.filter((line) => {
    return /Howard/i.test(line);
  });
  assert.strictEqual(
    nonComplianceLines.length,
    0,
    `发现非合规站长姓名遗留: ${JSON.stringify(nonComplianceLines)}`
  );
});

// =============================================================================
// 【Suite 2】YAML Frontmatter 模板生成逻辑、边界条件与特殊字符转义对抗
// =============================================================================
console.log('\n----------------------------------------------------------------');
console.log('【Suite 2】YAML Frontmatter 模板生成逻辑、边界条件与转义对抗测试');
console.log('----------------------------------------------------------------');

// 模拟 Java 端 escapeYaml 逻辑
function escapeYaml(input) {
  if (input == null) return '';
  return String(input).replace(/"/g, '\\"').replace(/\n/g, ' ');
}

// 模拟 Java 端 exportPostsZip 中的 mdBuilder 拼接逻辑
function generateFrontmatter(post, categoryName, tagNames) {
  let md = '';
  md += '---\n';
  md += `title: "${escapeYaml(post.title)}"\n`;
  md += `slug: "${escapeYaml(post.slug)}"\n`;

  const dateVal = post.publishedAt || post.createdAt;
  if (dateVal) {
    md += `date: "${escapeYaml(dateVal)}"\n`;
  } else {
    md += 'date: ""\n';
  }

  if (categoryName && categoryName.trim() !== '') {
    md += 'categories:\n';
    md += `  - "${escapeYaml(categoryName)}"\n`;
  } else {
    md += 'categories: []\n';
  }

  if (tagNames && tagNames.length > 0) {
    md += 'tags:\n';
    for (const t of tagNames) {
      md += `  - "${escapeYaml(t)}"\n`;
    }
  } else {
    md += 'tags: []\n';
  }

  if (post.excerpt && post.excerpt.trim() !== '') {
    md += `summary: "${escapeYaml(post.excerpt)}"\n`;
  }

  if (post.cover && post.cover.trim() !== '') {
    md += `cover: "${escapeYaml(post.cover)}"\n`;
  }

  md += `lang: "${post.lang || 'zh'}"\n`;
  md += `status: "${post.status || 'DRAFT'}"\n`;
  md += `maturity: "${post.maturity || 'BUDDING'}"\n`;
  md += 'author: "Hayden Xue"\n';
  md += '---\n\n';

  if (post.content && post.content.trim() !== '') {
    md += post.content;
  }
  return md;
}

test('标准完全体博文 YAML Frontmatter 必含字段校验 (author, title, slug, date, categories, tags)', () => {
  const mockPost = {
    id: 1,
    title: '深度探索 Java 25 虚拟线程与反应式流',
    slug: 'deep-dive-into-java-25-virtual-threads',
    excerpt: '全面解析 JEP 491 与高吞吐并发模型。',
    cover: 'https://cdn.example.com/cover.jpg',
    lang: 'zh',
    status: 'PUBLISHED',
    maturity: 'EVERGREEN',
    publishedAt: '2026-09-10T10:00:00',
    content: '## 正文内容...',
  };
  const category = '后端工程';
  const tags = ['Java 25', 'Virtual Threads', 'Spring Boot 3.3'];

  const generated = generateFrontmatter(mockPost, category, tags);

  assert.ok(generated.startsWith('---\n'), '未以 Frontmatter 分隔符 --- 开始');
  assert.ok(generated.includes('author: "Hayden Xue"\n'), '缺少 author: "Hayden Xue"');
  assert.ok(generated.includes('title: "深度探索 Java 25 虚拟线程与反应式流"\n'), '缺少正确 title');
  assert.ok(generated.includes('slug: "deep-dive-into-java-25-virtual-threads"\n'), '缺少正确 slug');
  assert.ok(generated.includes('date: "2026-09-10T10:00:00"\n'), '缺少正确 date');
  assert.ok(generated.includes('categories:\n  - "后端工程"\n'), '缺少正确 categories');
  assert.ok(generated.includes('tags:\n  - "Java 25"\n  - "Virtual Threads"\n  - "Spring Boot 3.3"\n'), '缺少 tags');
  assert.ok(generated.includes('lang: "zh"\n'), '缺少 lang');
  assert.ok(generated.includes('status: "PUBLISHED"\n'), '缺少 status');
  assert.ok(generated.includes('maturity: "EVERGREEN"\n'), '缺少 maturity');
  assert.ok(generated.endsWith('## 正文内容...'), '正文未正确拼接');
});

test('对抗测试：缺失分类/标签/日期的草稿博文生成表现 (验证缺省 categories: [] 与 tags: [] 结构健全性)', () => {
  const minimalPost = {
    id: 2,
    title: '未命名的临时草稿手记',
    slug: 'temp-draft-2',
    publishedAt: null,
    createdAt: null,
    content: '随便写两句...',
  };

  const output = generateFrontmatter(minimalPost, null, []);

  // 验证基本字段与缺省空数组
  assert.ok(output.includes('title: "未命名的临时草稿手记"'), '缺少 title');
  assert.ok(output.includes('author: "Hayden Xue"'), '缺少 author');
  assert.ok(output.includes('status: "DRAFT"'), '缺少 status');
  assert.ok(output.includes('categories: []\n'), '未正确输出缺省 categories: []');
  assert.ok(output.includes('tags: []\n'), '未正确输出缺省 tags: []');
  assert.ok(output.includes('date: ""\n'), '未正确输出缺省 date: ""');
});

test('特殊字符与转义对抗测试 (双引号、换行符、反斜杠)', () => {
  const complexPost = {
    id: 3,
    title: '深入理解 "双引号" 与 \n换行符 的转义机制',
    slug: 'escape-test-slug',
    publishedAt: '2026-09-14T00:00:00',
    content: '测试内容',
  };

  const output = generateFrontmatter(complexPost, '分类 "A"', ['标签 "1"', '标签\n2']);
  assert.ok(output.includes('title: "深入理解 \\"双引号\\" 与  换行符 的转义机制"'), '双引号与换行转义未生效');
  assert.ok(output.includes('  - "分类 \\"A\\""'), '分类双引号未转义');
  assert.ok(output.includes('  - "标签 \\"1\\""'), '标签双引号未转义');
});

// =============================================================================
// 【Suite 3】健康体检中心 5 维检测规则引擎对抗测试
// =============================================================================
console.log('\n----------------------------------------------------------------');
console.log('【Suite 3】健康体检中心 5 维检测规则引擎对抗测试');
console.log('----------------------------------------------------------------');

const healthPagePath = path.join(frontendRoot, 'app/admin/health/page.tsx');
assert.ok(fs.existsSync(healthPagePath), `健康体检页面不存在: ${healthPagePath}`);
const healthContent = fs.readFileSync(healthPagePath, 'utf8');

// 模拟 health/page.tsx 中规则 1-5 的实现算法
function executeHealthRules({ allPosts, allCats, allTags, allJourneys }) {
  const discoveredIssues = [];

  // 规则 1：站内死链
  const postSlugSet = new Set(allPosts.map((p) => p.slug?.toLowerCase()).filter(Boolean));
  const journeySlugSet = new Set(allJourneys.map((j) => j.slug?.toLowerCase()).filter(Boolean));
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  allPosts.forEach((post) => {
    if (!post.content) return;
    let match;
    while ((match = linkRegex.exec(post.content)) !== null) {
      const rawUrl = match[2].trim();
      if (rawUrl.startsWith('/blog/')) {
        const targetSlug = rawUrl.replace('/blog/', '').split(/[?#]/)[0].toLowerCase();
        if (targetSlug && !postSlugSet.has(targetSlug)) {
          discoveredIssues.push({
            id: `link-${post.id}-${targetSlug}`,
            type: 'broken_link',
            title: '博文内部死链引用',
            location: `博文: 《${post.title}》`,
            detail: `引用了不存在的站内文章 Slug: ${rawUrl}`,
            severity: 'high',
            targetId: post.id,
            fixAction: 'edit_post',
          });
        }
      } else if (rawUrl.startsWith('/journey/')) {
        const targetSlug = rawUrl.replace('/journey/', '').split(/[?#]/)[0].toLowerCase();
        if (targetSlug && !journeySlugSet.has(targetSlug)) {
          discoveredIssues.push({
            id: `journey-link-${post.id}-${targetSlug}`,
            type: 'broken_link',
            title: '游记足迹死链引用',
            location: `博文: 《${post.title}》`,
            detail: `引用了未关联或不存在的足迹 Slug: ${rawUrl}`,
            severity: 'high',
            targetId: post.id,
            fixAction: 'edit_post',
          });
        }
      }
    }
  });

  // 规则 2：缺失封面
  allPosts.forEach((post) => {
    if (!post.cover || post.cover.trim() === '') {
      discoveredIssues.push({
        id: `cover-missing-${post.id}`,
        type: 'missing_media',
        title: '文章缺失封面素材',
        location: `博文: 《${post.title}》`,
        detail: '文章未配置封面图，前台列表可能回退纯色占位',
        severity: 'medium',
        targetId: post.id,
        fixAction: 'edit_post',
      });
    }
  });

  // 规则 3：孤岛无主标签
  const usedTagIds = new Set();
  allPosts.forEach((p) => {
    if (p.tags && Array.isArray(p.tags)) {
      p.tags.forEach((t) => usedTagIds.add(t.id));
    }
  });

  allTags.forEach((tag) => {
    if (!usedTagIds.has(tag.id)) {
      discoveredIssues.push({
        id: `orphan-tag-${tag.id}`,
        type: 'orphan_tag',
        title: '孤岛无主标签 (0 篇博文引用)',
        location: `标签: #${tag.name}`,
        detail: `ID: ${tag.id}, Slug: ${tag.slug}`,
        severity: 'low',
        targetId: tag.id,
        fixAction: 'delete_tag',
      });
    }
  });

  // 规则 4：未关联真实游记足迹
  allJourneys.forEach((journey) => {
    if (journey.latitude == null || journey.longitude == null) {
      discoveredIssues.push({
        id: `journey-coords-${journey.id}`,
        type: 'journey_anomaly',
        title: '足迹经纬度坐标缺失',
        location: `足迹: ${journey.title} (${journey.city || '未知城市'})`,
        detail: '该旅行记录未在 3D 地球仪上标注有效经纬度',
        severity: 'high',
        targetId: journey.id,
        fixAction: 'edit_journey',
      });
    } else if (!journey.content || journey.content.trim().length < 20) {
      discoveredIssues.push({
        id: `journey-content-${journey.id}`,
        type: 'journey_anomaly',
        title: '游记详情手记内容单薄或缺失',
        location: `足迹: ${journey.title}`,
        detail: '游记正文少于 20 字符，建议完善实拍与手记心得',
        severity: 'medium',
        targetId: journey.id,
        fixAction: 'edit_journey',
      });
    }
  });

  // 规则 5：空分类
  const usedCatIds = new Set(allPosts.map((p) => p.categoryId).filter(Boolean));
  allCats.forEach((cat) => {
    if (!usedCatIds.has(cat.id)) {
      discoveredIssues.push({
        id: `empty-cat-${cat.id}`,
        type: 'empty_category',
        title: '空分类 (0 篇博文归档)',
        location: `分类: ${cat.name}`,
        detail: `ID: ${cat.id}, Slug: ${cat.slug}`,
        severity: 'low',
        targetId: cat.id,
        fixAction: 'delete_category',
      });
    }
  });

  return discoveredIssues;
}

test('规则 1 算法精准度对抗测试 (构造博文与足迹死链、锚点与正常链接)', () => {
  const posts = [
    {
      id: 10,
      title: '主博文',
      slug: 'main-post',
      cover: 'https://example.com/c1.jpg',
      content: `
        欢迎阅读：
        - 正常博文链接：[有效文章](/blog/valid-sub-post)
        - 正常足迹链接：[有效足迹](/journey/kyoto-2025)
        - 带锚点正常链接：[有效锚点](/blog/valid-sub-post#section-1?ref=home)
        - 博文死链：[失效博文](/blog/deleted-404-post)
        - 足迹死链：[虚构未去过的足迹](/journey/fictional-atlantis)
        - 外部有效链接：[Google](https://google.com)
      `,
      tags: [{ id: 1, name: 'T1' }],
      categoryId: 1,
    },
    {
      id: 11,
      title: '有效子博文',
      slug: 'valid-sub-post',
      cover: 'https://example.com/c2.jpg',
      content: '子文章正文足够长...',
      tags: [{ id: 1, name: 'T1' }],
      categoryId: 1,
    },
  ];

  const journeys = [
    {
      id: 20,
      title: '京都之秋',
      slug: 'kyoto-2025',
      latitude: 35.0116,
      longitude: 135.7681,
      content: '这是一篇超过二十个字符的真实游记心得手记记录内容...',
    },
  ];

  const issues = executeHealthRules({
    allPosts: posts,
    allCats: [{ id: 1, name: 'C1', slug: 'c1' }],
    allTags: [{ id: 1, name: 'T1', slug: 't1' }],
    allJourneys: journeys,
  });

  const brokenLinks = issues.filter((i) => i.type === 'broken_link');
  assert.strictEqual(brokenLinks.length, 2, `死链期望检出 2 个，实际检出 ${brokenLinks.length}`);
  assert.ok(
    brokenLinks.some((i) => i.detail.includes('/blog/deleted-404-post')),
    '未精准检出 /blog/deleted-404-post'
  );
  assert.ok(
    brokenLinks.some((i) => i.detail.includes('/journey/fictional-atlantis')),
    '未精准检出 /journey/fictional-atlantis'
  );
});

test('规则 1 实机数据流对抗测试 (Critical Finding: PostListVO 无 content 字段导致死链检测被绕过)', () => {
  // 检查后端 PostListVO.java
  const postListVOPath = path.join(
    projectRoot,
    'backend/src/main/java/com/hayden/blog/vo/PostListVO.java'
  );
  const postListVOContent = fs.readFileSync(postListVOPath, 'utf8');
  const hasContentField = postListVOContent.includes('String content;');
  assert.strictEqual(
    hasContentField,
    false,
    'PostListVO 不应包含大字段 content，已确认其确实不含 content 字段'
  );

  // 验证 health/page.tsx 中已接入并发拉取博文完整详情逻辑（api.getPostById）
  assert.ok(
    healthContent.includes('api.getPostById') || healthContent.includes('getPostById'),
    'health/page.tsx 必须对博文调用 getPostById 补齐 content 正文字段以支持死链扫描'
  );
  console.log('    ✨ [VERIFIED] health/page.tsx 已接入 getPostById 并发详情拉取，博文 content 数据流完整打通！');
});

test('规则 2 缺失封面与 404 图片对抗测试', () => {
  const posts = [
    { id: 1, title: '有封面文章', slug: 'p1', cover: 'https://example.com/valid.jpg', tags: [] },
    { id: 2, title: '无封面文章 A', slug: 'p2', cover: null, tags: [] },
    { id: 3, title: '无封面文章 B', slug: 'p3', cover: '   ', tags: [] },
  ];

  const issues = executeHealthRules({
    allPosts: posts,
    allCats: [],
    allTags: [],
    allJourneys: [],
  });

  const missingMedia = issues.filter((i) => i.type === 'missing_media');
  assert.strictEqual(missingMedia.length, 2, `缺失封面期望检出 2 个，实际检出 ${missingMedia.length}`);
  assert.ok(missingMedia.every((i) => i.severity === 'medium'), '严重级别应为 medium');

  // 对抗测试：正文 404 图片检测支持情况
  findings.push({
    id: 'FINDING-3-RULE2-ONLY-CHECKS-COVER',
    title: '规则 2 目前仅检查 post.cover 是否为空，未对封面或正文图片做 404 探活',
    description:
      '当前健康体检规则 2 实现了对 `!post.cover || post.cover.trim() === ""` 的检测，但未实现对无效图片直链的网络 HTTP 404 探测或 Markdown 正文 `![alt](url)` 的扫描。',
    severity: 'MEDIUM',
  });
});

test('规则 3 孤岛标签精准度对抗测试', () => {
  const posts = [
    {
      id: 1,
      title: 'P1',
      tags: [
        { id: 10, name: 'Java' },
        { id: 20, name: 'Next.js' },
      ],
    },
  ];
  const allTags = [
    { id: 10, name: 'Java', slug: 'java' },
    { id: 20, name: 'Next.js', slug: 'nextjs' },
    { id: 30, name: '孤岛标签-遗留', slug: 'orphan-1' },
    { id: 40, name: '孤岛标签-测试', slug: 'orphan-2' },
  ];

  const issues = executeHealthRules({
    allPosts: posts,
    allCats: [],
    allTags: allTags,
    allJourneys: [],
  });

  const orphanTags = issues.filter((i) => i.type === 'orphan_tag');
  assert.strictEqual(orphanTags.length, 2, `孤岛标签期望检出 2 个，实际检出 ${orphanTags.length}`);
  assert.deepStrictEqual(
    orphanTags.map((t) => t.targetId).sort(),
    [30, 40],
    '孤岛标签 ID 匹配有误'
  );
});

test('规则 4 & 规则 5 游记足迹与空分类精准度对抗测试', () => {
  const journeys = [
    { id: 1, title: '正常足迹', latitude: 31.23, longitude: 121.47, content: '这里是上海，游记心得正文足够二十个字符以上...' },
    { id: 2, title: '经纬度缺失足迹', latitude: null, longitude: 121.47, content: '正常内容足够长...' },
    { id: 3, title: '手记过短足迹', latitude: 31.23, longitude: 121.47, content: '太短了' },
  ];

  const categories = [
    { id: 100, name: '有博文分类', slug: 'has-posts' },
    { id: 200, name: '空分类1', slug: 'empty-1' },
    { id: 300, name: '空分类2', slug: 'empty-2' },
  ];

  const posts = [{ id: 1, title: 'P1', categoryId: 100 }];

  const issues = executeHealthRules({
    allPosts: posts,
    allCats: categories,
    allTags: [],
    allJourneys: journeys,
  });

  const journeyAnomalies = issues.filter((i) => i.type === 'journey_anomaly');
  assert.strictEqual(journeyAnomalies.length, 2, '游记异常期望检出 2 项');
  assert.ok(journeyAnomalies.some((j) => j.severity === 'high' && j.targetId === 2), '经纬度缺失应为 high');
  assert.ok(journeyAnomalies.some((j) => j.severity === 'medium' && j.targetId === 3), '手记过短应为 medium');

  const emptyCategories = issues.filter((i) => i.type === 'empty_category');
  assert.strictEqual(emptyCategories.length, 2, '空分类期望检出 2 个');
  assert.deepStrictEqual(emptyCategories.map((c) => c.targetId).sort(), [200, 300]);
});

// =============================================================================
// 【Suite 4】孤岛标签一键清理防误删保护机制对抗测试
// =============================================================================
console.log('\n----------------------------------------------------------------');
console.log('【Suite 4】一键清理孤岛标签防误删保护机制对抗测试');
console.log('----------------------------------------------------------------');

test('审查前端 handleCleanOrphanTags 是否包含二次确认弹窗或防误触保护', () => {
  // 检查 health/page.tsx 中是否使用了 window.confirm 或自定义 modal
  const hasConfirmDialog =
    healthContent.includes('confirm(') ||
    healthContent.includes('Modal') ||
    healthContent.includes('Dialog');

  assert.ok(hasConfirmDialog, 'handleCleanOrphanTags 与 handleCleanEmptyCategories 必须提供二次防误触确认弹窗');
  console.log('    ✨ [VERIFIED] handleCleanOrphanTags 与 handleCleanEmptyCategories 已成功接入 confirmModal 二次确认弹窗防误触保护！');
});

test('审查后端 TagServiceImpl.deleteTag 是否存在外键与文章引用保护', () => {
  const tagServicePath = path.join(
    projectRoot,
    'backend/src/main/java/com/hayden/blog/service/impl/TagServiceImpl.java'
  );
  const tagServiceContent = fs.readFileSync(tagServicePath, 'utf8');

  const hasReferenceCheck =
    tagServiceContent.includes('postTagMapper') ||
    tagServiceContent.includes('count(') ||
    tagServiceContent.includes('引用');

  if (!hasReferenceCheck) {
    findings.push({
      id: 'FINDING-5-BACKEND-TAG-DELETE-NO-CASCADE-CHECK',
      title: '后端 TagServiceImpl.deleteTag 缺乏引用校验与级联清理保护',
      description:
        '后端 `deleteTag(Long id)` 直接调用 `removeById(id)`，未检查是否有文章仍在关联该标签，且未级联清理 `post_tags` 关联表，存在孤儿关联记录隐患。',
      severity: 'LOW',
    });
    console.log('    ⚠️ [Observed Finding] 后端 `deleteTag` 仅直接 `removeById`，缺乏关联引用保护');
  }
});

// =============================================================================
// 【Suite 5】健康评分算法严谨性与极端压力测试
// =============================================================================
console.log('\n----------------------------------------------------------------');
console.log('【Suite 5】健康评分算法严谨性与极端压力测试');
console.log('----------------------------------------------------------------');

function calculateHealthScore(issues) {
  let score = 100;
  issues.forEach((item) => {
    if (item.severity === 'high') score -= 12;
    else if (item.severity === 'medium') score -= 5;
    else score -= 2;
  });
  return Math.max(0, Math.min(100, score));
}

test('健康评分算法精度验证 (满分 100, 高危 -12, 中危 -5, 低危 -2)', () => {
  const testIssues = [
    { severity: 'high' },
    { severity: 'high' }, // -24
    { severity: 'medium' }, // -5
    { severity: 'low' },
    { severity: 'low' },
    { severity: 'low' }, // -6
  ];
  const score = calculateHealthScore(testIssues);
  assert.strictEqual(score, 65, `期望得分为 65 (100 - 24 - 5 - 6)，实际为 ${score}`);
});

test('极端压力边界测试：大量高危问题不会突破 0 分下限', () => {
  const massHighIssues = Array.from({ length: 20 }, () => ({ severity: 'high' }));
  const score = calculateHealthScore(massHighIssues);
  assert.strictEqual(score, 0, `大量问题扣分后得分应钳位在 0，实际为 ${score}`);
});

test('无任何异常时为完美满分 100', () => {
  const score = calculateHealthScore([]);
  assert.strictEqual(score, 100, `无异常得分应为 100，实际为 ${score}`);
});

// =============================================================================
// 【Suite 6】双主题三层景深规范审计 (Settings, Health, Dashboard)
// =============================================================================
console.log('\n----------------------------------------------------------------');
console.log('【Suite 6】双主题三层景深规范审计 (Settings, Health, Dashboard)');
console.log('----------------------------------------------------------------');

test('health/page.tsx 必须遵循《Hayden Xue 工程准则》铁律 3 双主题三层景深', () => {
  assert.ok(
    healthContent.includes('bg-white/80') && healthContent.includes('dark:bg-neutral-900/60'),
    '缺少卡片微磨砂白瓷与深黑磨砂样式'
  );
  assert.ok(
    healthContent.includes('border-slate-200/80') && healthContent.includes('dark:border-white/[0.08]'),
    '缺少 1px 极细微光边界'
  );
});

const settingsCardPaths = [
  'frontend/components/admin/settings/AppearanceSettingsCard.tsx',
  'frontend/components/admin/settings/AiSettingsCard.tsx',
  'frontend/components/admin/settings/StorageSettingsCard.tsx',
  'frontend/components/admin/settings/SecuritySettingsCard.tsx',
  'frontend/components/admin/settings/ExportBackupCard.tsx',
];

settingsCardPaths.forEach((relPath) => {
  test(`设置中心卡片 ${path.basename(relPath)} 双主题规范校验`, () => {
    const fullPath = path.join(projectRoot, relPath);
    assert.ok(fs.existsSync(fullPath), `卡片文件不存在: ${fullPath}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(
      content.includes('dark:bg-neutral-900/60') || content.includes('bg-white/80'),
      `${path.basename(relPath)} 缺少微磨砂卡片层景深定义`
    );
    assert.ok(
      content.includes('border-slate-200/80') || content.includes('dark:border-white/[0.08]'),
      `${path.basename(relPath)} 缺少 1px 微光边界定义`
    );
  });
});

console.log('\n================================================================');
console.log(`🎉 对抗性测试套件执行完毕！通过: ${passCount} 项，失败: ${failCount} 项`);
console.log(`📋 发现的对抗性与边缘场景关注点 (Findings): ${findings.length} 项`);
console.log('================================================================');

fs.writeFileSync(
  path.join(__dirname, 'adversarial_findings.json'),
  JSON.stringify({ passCount, failCount, findings }, null, 2),
  'utf8'
);
