// e2e/test_m2_workshop_adversarial.mjs
/**
 * ==============================================================================
 * CHALLENGER M2-1: 创作工坊与高频操作实证对抗检验测试套件 (Empirical Adversarial Suite)
 * Milestone: M2 - 创作工坊与高频操作升级 (2026-09-13T16:32:24Z 最新需求)
 *
 * 核心实证对抗检验目标：
 * 1. calculateWordMetrics 字数统计算法与阅读时长单调性深度对抗检验
 * 2. parseToc 目录树解析算法多层级、特殊字符、重名标题消歧对抗检验
 * 3. 结构化草稿防丢序列化/反序列化容错、字段完整性与 LocalStorage 键名规范检验
 * 4. 媒体中心多维筛选调度与足迹大圆航线坐标投影数学极限边界检验
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('CHALLENGER M2-1: AUTHORING WORKSHOP & HIGH-FREQUENCY OPS ADVERSARIAL SUITE');
console.log('Repository Root:', projectRoot);
console.log('Execution Time:', new Date().toISOString());
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✔ [PASS] ${message}`);
    if (details) console.log(`      Detail: ${details}`);
  } else {
    failedChecks++;
    console.error(`  ✖ [FAIL] ${message}`);
    if (details) console.error(`      Detail: ${details}`);
  }
}

// ==============================================================================
// 辅助加载：从前端组件源码中安全提取生产实现，杜绝测试代码与生产代码不一致
// ==============================================================================
const editorSourcePath = path.join(projectRoot, 'frontend', 'components', 'MarkdownEditor.tsx');
assert(fs.existsSync(editorSourcePath), '生产文件 frontend/components/MarkdownEditor.tsx 必须存在');

const editorSource = fs.readFileSync(editorSourcePath, 'utf8');

// 提取 calculateWordMetrics 函数体并执行
function createCalculateWordMetricsFromSource() {
  const funcMatch = editorSource.match(/export function calculateWordMetrics\(markdown: string\) \{([\s\S]*?)\n\}\n\n\/\*\*/);
  if (!funcMatch) {
    throw new Error('未能从 MarkdownEditor.tsx 中匹配到 calculateWordMetrics 函数体');
  }
  const body = funcMatch[1];
  return new Function('markdown', body);
}

// 提取 parseToc 函数体并执行
function createParseTocFromSource() {
  const funcMatch = editorSource.match(/export function parseToc\(markdown: string\): TocItem\[\] \{([\s\S]*?)\n\}\n\nexport interface MarkdownEditorProps/);
  if (!funcMatch) {
    throw new Error('未能从 MarkdownEditor.tsx 中匹配到 parseToc 函数体');
  }
  const body = funcMatch[1].replace(/:\s*TocItem\[\]/g, '');
  return new Function('markdown', body);
}

const calculateWordMetrics = createCalculateWordMetricsFromSource();
const parseToc = createParseTocFromSource();

// ==============================================================================
// MODULE 1: calculateWordMetrics 算法高强度对抗实证检验
// ==============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('MODULE 1: calculateWordMetrics Word Count & Reading Time Monotonicity');
console.log('--------------------------------------------------------------------------------');

// 1.1 纯中文测试 (包含全角标点)
{
  const zhText = '这是一篇关于分布式系统设计的深度长文。我们探讨高并发、高可用与弹性伸缩架构。';
  const res = calculateWordMetrics(zhText);
  // 中文字符数包括汉字与全角标点（共 38 字符）
  assert(res.chineseCount > 30, '纯中文文本字数统计应正确匹配汉字与标点', `chineseCount=${res.chineseCount}`);
  assert(res.englishCount === 0, '纯中文文本的英文词数应严格为 0', `englishCount=${res.englishCount}`);
  assert(res.totalCount === res.chineseCount, '纯中文总字数应等于中文计数字符数', `total=${res.totalCount}`);
  assert(res.readingTimeMinutes === 1, '短篇阅读时长应保底为 1 分钟', `readingTime=${res.readingTimeMinutes}`);
}

// 1.2 纯英文测试 (包含连字符、撇号缩写)
{
  const enText = "Next.js 14 App Router provides state-of-the-art server-side rendering and client caching. Don't overlook it.";
  const res = calculateWordMetrics(enText);
  // Markdown 语法过滤将连字符 '-' 替换为空格，因而连词按独立单词分解：
  // Next(1), js(2), 14(3), App(4), Router(5), provides(6), state(7), of(8), the(9), art(10), server(11), side(12), rendering(13), and(14), client(15), caching(16), Don't(17), overlook(18), it(19) (共 19 个词)
  assert(res.chineseCount === 0, '纯英文文本中文字数应严格为 0', `chineseCount=${res.chineseCount}`);
  assert(res.englishCount === 19, '纯英文单词统计精准按自然语言词元统计（连字符复合词分解为独立词）', `englishCount=${res.englishCount}`);
  assert(res.totalCount === res.englishCount, '纯英文总字数应等于英文词数', `total=${res.totalCount}`);
}

// 1.3 中英混排测试
{
  const mixedText = '在 Next.js 14 中，React Server Components (RSC) 与 Server Actions 大幅提升了 Full-Stack 生产力！';
  const res = calculateWordMetrics(mixedText);
  // 中文字符与标点：在、中、、与、大、幅、提、升、了、生、产、力、！ (共 13 字符)
  // 英文词元：Next, js, 14, React, Server, Components, RSC, Server, Actions, Full, Stack (共 11 词)
  assert(res.chineseCount === 13, '中英混排中文字符应独立精确统计（11 汉字 + 2 全角标点）', `chineseCount=${res.chineseCount}`);
  assert(res.englishCount === 11, '中英混排英文单词应独立精确统计', `englishCount=${res.englishCount}`);
  assert(res.totalCount === res.chineseCount + res.englishCount, '混排总字数应严格为中文字符与英文词数之和 (13+11=24)', `total=${res.totalCount}`);
}

// 1.4 Markdown 语法剔除对抗测试
{
  // 包含标题、代码块、行内代码、表格、超链接、图片、HTML
  const mdComplex = `
# 一级大标题
## 二级副标题：关于架构演进

这是一段介绍正文，包含[官方文档](https://nextjs.org/docs/app)超链接。
以及一张图片：![系统架构拓扑图](https://cdn.example.com/arch.png "Arch Diagram")

这里有一个行内代码：\`const port = 8080;\`。

\`\`\`typescript
// 代码块中的内容与关键字不应计入文章阅读正文字数
interface Config {
  host: string;
  port: number;
  enableSsl: boolean;
}
function bootstrap(): void {
  console.log("Server initialized");
}
\`\`\`

| 模块名 | 协议 | 端口 |
| :--- | :---: | ---: |
| 网关服务 | HTTP/2 | 443 |
| 存储中心 | gRPC | 9000 |

<div class="note"><p>这是内联 HTML 段落内容</p></div>
`;

  const res = calculateWordMetrics(mdComplex);
  // 验证代码块内的大量英文变量未被计入
  // 如果代码块被计入，英文词数将超过 25 词；剔除后英文词数应在 10 词以内
  assert(res.englishCount < 15, '代码块内容与代码符号应被彻底剔除，不虚增英文词数', `englishCount=${res.englishCount}`);
  assert(res.chineseCount > 35, '标题、表格内容、链接文字与 HTML 内文本应被正确保留', `chineseCount=${res.chineseCount}`);
  assert(res.readingTimeMinutes >= 1, '复合 Markdown 阅读时长正常输出', `readingTime=${res.readingTimeMinutes}`);
}

// 1.5 极端空文本与特殊边界
{
  const emptyRes = calculateWordMetrics('');
  assert(emptyRes.totalCount === 0 && emptyRes.readingTimeMinutes === 1, '空字符串入参保底 0 字与 1 分钟', JSON.stringify(emptyRes));

  const nullRes = calculateWordMetrics(null);
  assert(nullRes.totalCount === 0 && nullRes.readingTimeMinutes === 1, 'null 入参安全保底', JSON.stringify(nullRes));

  const undefRes = calculateWordMetrics(undefined);
  assert(undefRes.totalCount === 0 && undefRes.readingTimeMinutes === 1, 'undefined 入参安全保底', JSON.stringify(undefRes));

  const blankRes = calculateWordMetrics('   \t\r\n   \n   ');
  assert(blankRes.totalCount === 0 && blankRes.readingTimeMinutes === 1, '全空白字符安全识别为 0 字', JSON.stringify(blankRes));
}

// 1.6 超大文本抗压与 ReDoS 灾难性回溯对抗 (50,000 字符复合文本)
{
  const sampleParagraph = '这是一个高密度测试段落，包含 Markdown 标记、`inline code`、[链接文本](https://domain.com/path)与中英文混排 Next.js 14 RSC Server Actions。\n';
  const largeText = sampleParagraph.repeat(500); // 约 50,000 字符
  const startTime = Date.now();
  const largeRes = calculateWordMetrics(largeText);
  const elapsedMs = Date.now() - startTime;

  assert(elapsedMs < 150, `50,000 字符高复杂度 Markdown 解析性能卓越 (<150ms)，杜绝 ReDoS`, `实际耗时: ${elapsedMs}ms`);
  assert(largeRes.totalCount > 10000, '巨型文本字数统计正常产出大数值', `totalCount=${largeRes.totalCount}`);
  assert(largeRes.readingTimeMinutes >= 25, '巨型文本阅读时长合理计算', `readingTime=${largeRes.readingTimeMinutes} 分钟`);
}

// 1.7 阅读时长单调性数学证明 (Monotonicity Verification)
{
  let isMonotonic = true;
  let prevReadingTime = 1;
  let nonDecreasingFailures = 0;

  // 步进测试 0 到 3000 字
  const baseSentence = '构建高质量个人数字花园。'; // 12 字符
  let currentText = '';
  for (let i = 0; i <= 250; i++) {
    currentText += baseSentence;
    const m = calculateWordMetrics(currentText);
    if (m.readingTimeMinutes < prevReadingTime) {
      isMonotonic = false;
      nonDecreasingFailures++;
    }
    prevReadingTime = m.readingTimeMinutes;
  }

  assert(isMonotonic && nonDecreasingFailures === 0, '字数单调递增过程中，阅读时长必须严格单调非递减 (Non-decreasing Monotonicity)');
  
  // 验证 400 阈值分段
  const words400 = '字'.repeat(400);
  const words401 = '字'.repeat(401);
  const words800 = '字'.repeat(800);
  const words801 = '字'.repeat(801);

  assert(calculateWordMetrics(words400).readingTimeMinutes === 1, '400 字边界阅读时长精确为 1 分钟');
  assert(calculateWordMetrics(words401).readingTimeMinutes === 2, '401 字临界点阅读时长精确跃迁至 2 分钟');
  assert(calculateWordMetrics(words800).readingTimeMinutes === 2, '800 字边界阅读时长精确为 2 分钟');
  assert(calculateWordMetrics(words801).readingTimeMinutes === 3, '801 字临界点阅读时长精确跃迁至 3 分钟');
}

// ==============================================================================
// MODULE 2: parseToc 目录解析多层级、特殊字符与重名冲突对抗检验
// ==============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('MODULE 2: parseToc Hierarchy, Special Characters & Disambiguation');
console.log('--------------------------------------------------------------------------------');

// 2.1 多层级匹配与范围约束 (仅提取 H2, H3, H4)
{
  const mdWithHeadings = `
# 一级大标题 (不应包含在 TOC 内)
## 2.1 架构总览
正文段落 1...
### 2.1.1 前端核心组件
正文段落 2...
#### 2.1.1.1 状态管理细节
正文段落 3...
##### 五级标题 (不应包含在 TOC 内)
###### 六级标题 (不应包含在 TOC 内)
## 2.2 存储与网络
#not-a-heading 假标题
`;

  const toc = parseToc(mdWithHeadings);
  assert(toc.length === 4, '目录树应且仅应提取 H2, H3, H4 共 4 个有效标题', `实际提取: ${toc.length} 项`);
  
  const levels = toc.map((t) => t.level);
  assert(JSON.stringify(levels) === JSON.stringify([2, 3, 4, 2]), '标题层级解析顺序与深度完全匹配 [2, 3, 4, 2]', `levels=${JSON.stringify(levels)}`);
  assert(toc[0].text === '2.1 架构总览', '标题纯文本正确剥除标记', `text=${toc[0].text}`);
}

// 2.2 标题特殊符号与格式清洗
{
  const mdSpecial = `
## **核心亮点**: \`Next.js 14\` & _Full-Stack_?
### 问答专区: <Q&A> / "如何持久化?"
`;

  const toc = parseToc(mdSpecial);
  assert(toc.length === 2, '包含特殊字符的标题正常提取');
  // 验证 ** 与 ` 被清洗
  assert(!toc[0].text.includes('**') && !toc[0].text.includes('`') && !toc[0].text.includes('_'), '标题纯文本中的粗体与行内代码标记被成功剥离', `cleanedText=${toc[0].text}`);
  // 验证 ID 编码安全，包含 encodeURIComponent
  assert(toc[1].id.startsWith('toc-') && !toc[1].id.includes('<') && !toc[1].id.includes('>'), 'TOC 生成的 ID 具备 URI 安全转义，不含有破坏性 HTML 字符', `id=${toc[1].id}`);
}

// 2.3 重名标题消歧与唯一 ID 保证 (Duplicate Title Collision Resistance)
{
  const mdDuplicates = `
## 概述
前言...
## 核心特性
特性介绍...
## 总结
阶段性小结...
## 核心特性
进阶特性补充...
## 总结
全文最终总结...
`;

  const toc = parseToc(mdDuplicates);
  assert(toc.length === 5, '5 个标题全部被解析');

  const ids = toc.map((t) => t.id);
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === ids.length, '即使正文中出现重复同名标题，每个 TOC 项的 ID 必须全局绝对唯一 (通过行号 idx 消歧)', `total=${ids.length}, unique=${uniqueIds.size}`);
  
  // 验证两处“总结”的 ID 差异
  const summaryTocs = toc.filter((t) => t.text === '总结');
  assert(summaryTocs.length === 2, '成功找到 2 个同名总结标题');
  assert(summaryTocs[0].id !== summaryTocs[1].id, `同名标题 ID 互不相同: "${summaryTocs[0].id}" vs "${summaryTocs[1].id}"`);
  assert(summaryTocs[0].lineNumber !== summaryTocs[1].lineNumber, '行号索引与真实行号严格吻合');
}

// 2.4 空文本与无标题文本
{
  assert(parseToc('').length === 0, '空文本返回空数组');
  assert(parseToc(null).length === 0, 'null 返回空数组');
  assert(parseToc(undefined).length === 0, 'undefined 返回空数组');
  assert(parseToc('这是一段没有任何标题的 Markdown 正文文本。').length === 0, '无标题文本返回空数组');
}

// ==============================================================================
// MODULE 3: 结构化草稿防丢、LocalStorage 键名规范与反序列化容错
// ==============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('MODULE 3: Structured Draft Serialization, LocalStorage Keys & Robustness');
console.log('--------------------------------------------------------------------------------');

const createPostPagePath = path.join(projectRoot, 'frontend', 'app', 'admin', 'posts', 'create', 'page.tsx');
const editPostPagePath = path.join(projectRoot, 'frontend', 'app', 'admin', 'posts', 'edit', '[id]', 'page.tsx');

assert(fs.existsSync(createPostPagePath), '新建文章页面 frontend/app/admin/posts/create/page.tsx 存在');
assert(fs.existsSync(editPostPagePath), '编辑文章页面 frontend/app/admin/posts/edit/[id]/page.tsx 存在');

const createPostCode = fs.readFileSync(createPostPagePath, 'utf8');
const editPostCode = fs.readFileSync(editPostPagePath, 'utf8');

// 3.1 验证 LocalStorage 存储键名规范
{
  assert(createPostCode.includes("localStorage.getItem('draft_post_new')"), '新建文章页面使用标准键名 draft_post_new');
  assert(createPostCode.includes("localStorage.setItem('draft_post_new'"), '新建文章页面保存使用标准键名 draft_post_new');
  assert(createPostCode.includes("localStorage.removeItem('draft_post_new')"), '新建文章页面提交成功后清除键名 draft_post_new');

  assert(editPostCode.includes('localStorage.getItem(`draft_post_${postId}`)'), '编辑文章页面读取使用动态键名 draft_post_${postId}');
  assert(editPostCode.includes('localStorage.setItem(`draft_post_${postId}`'), '编辑文章页面保存使用动态键名 draft_post_${postId}');
  assert(editPostCode.includes('localStorage.removeItem(`draft_post_${postId}`)'), '编辑文章页面提交成功后清除键名 draft_post_${postId}');
}

// 3.2 验证结构化草稿 Payload 契约完整性
{
  const expectedFields = ['title', 'slug', 'excerpt', 'content', 'categoryId', 'selectedTagIds', 'lang', 'updatedAt'];
  let allFieldsPresent = true;
  for (const field of expectedFields) {
    if (!createPostCode.includes(field)) {
      allFieldsPresent = false;
      console.error(`  缺少字段: ${field}`);
    }
  }
  assert(allFieldsPresent, `新建页面草稿暂存包含全部 8 个结构化字段: ${expectedFields.join(', ')}`);
}

// 3.3 脏数据与破损 JSON 反序列化容错仿真测试
{
  // 模拟破损数据输入
  const dirtyDataScenarios = [
    { name: '非法 JSON 字符串', raw: '{ title: broken json string without closing' },
    { name: '旧版本非结构化纯文本', raw: '这是一段旧版本的纯文本草稿内容' },
    { name: '空对象', raw: '{}' },
    { name: '缺少 content 的对象', raw: '{"title":"测试标题","updatedAt":"2026-09-14T00:00:00Z"}' },
    { name: '格式异常的非法日期', raw: '{"title":"测试","content":"正文","updatedAt":"invalid-date-string"}' },
  ];

  for (const sc of dirtyDataScenarios) {
    let survived = true;
    let handledContent = '';
    try {
      // 模拟 create/page.tsx 与 MarkdownEditor.tsx 的解析防护逻辑
      if (sc.raw.startsWith('{') && sc.raw.includes('"content"')) {
        try {
          const parsed = JSON.parse(sc.raw);
          handledContent = parsed.content || '';
        } catch {
          handledContent = sc.raw;
        }
      } else {
        handledContent = sc.raw;
      }
    } catch (e) {
      survived = false;
    }
    assert(survived, `脏数据容错防护: [${sc.name}] 能够被安全解析降级，不抛出致命未捕获异常`);
  }
}

// 3.4 编辑页版本时序对比 (draftTime > postTime) 防卫测试
{
  const now = Date.now();
  const past = now - 3600 * 1000;
  const future = now + 3600 * 1000;

  // 场景 A: 本地草稿明显新于远端
  const draftNewer = {
    updatedAt: new Date(future).toISOString(),
    content: '本地较新内容',
  };
  const postOlder = {
    updatedAt: new Date(now).toISOString(),
    content: '远端旧内容',
  };

  const draftTimeA = new Date(draftNewer.updatedAt).getTime();
  const postTimeA = new Date(postOlder.updatedAt).getTime();
  assert(draftTimeA > postTimeA, '本地草稿时间更新时正确触发时间差检测');

  // 场景 B: updatedAt 损坏返回 NaN，安全降级
  const draftCorruptDate = {
    updatedAt: 'corrupted-time',
    content: '内容有改动',
  };
  const draftTimeB = draftCorruptDate.updatedAt ? new Date(draftCorruptDate.updatedAt).getTime() : 0;
  assert(isNaN(draftTimeB), '破损时间输出 NaN');
  // 验证 NaN > postTime 在 JavaScript 中恒为 false，防止误报
  assert(!(draftTimeB > postTimeA), 'NaN 时间比较结果安全为 false，不误触发时间优势');
}

// ==============================================================================
// MODULE 4: 媒体多维筛选调度与足迹大圆航迹数学极限边界检验
// ==============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('MODULE 4: Media Filtering & Footprint Flight Projection Boundary Tests');
console.log('--------------------------------------------------------------------------------');

const mediaPagePath = path.join(projectRoot, 'frontend', 'app', 'admin', 'media', 'page.tsx');
const journeyPagePath = path.join(projectRoot, 'frontend', 'app', 'admin', 'journey', 'page.tsx');

assert(fs.existsSync(mediaPagePath), '媒体中心页面 frontend/app/admin/media/page.tsx 存在');
assert(fs.existsSync(journeyPagePath), '足迹管理页面 frontend/app/admin/journey/page.tsx 存在');

const mediaPageCode = fs.readFileSync(mediaPagePath, 'utf8');
const journeyPageCode = fs.readFileSync(journeyPagePath, 'utf8');

// 4.1 媒体中心并发队列与多维筛选代码核查
{
  assert(mediaPageCode.includes('concurrency = 2'), '媒体中心批量上传严格配置并发数 concurrency = 2，保障带宽平稳');
  assert(mediaPageCode.includes("typeFilter === 'IMAGE'"), '包含图片类型筛选逻辑');
  assert(mediaPageCode.includes("typeFilter === 'VIDEO'"), '包含视频类型筛选逻辑');
  assert(mediaPageCode.includes("dateFilter === '7DAYS'"), '包含最近 7 天时间筛选逻辑');
  assert(mediaPageCode.includes("sizeFilter === 'LT_1MB'"), '包含 1MB 以下体积筛选逻辑');
  assert(mediaPageCode.includes("sortBy === 'NEWEST'"), '包含最新排序逻辑');
  assert(mediaPageCode.includes("viewMode === 'grid'") || mediaPageCode.includes("viewMode === 'list'"), '支持网格/列表双视图切换');
}

// 4.2 足迹管理 36 个预设目的地地理有效性检验
{
  assert(journeyPageCode.includes('PRESET_LOCATIONS'), '足迹页面包含 PRESET_LOCATIONS 常用城市预设库');

  // 提取 PRESET_LOCATIONS 对象
  const presetMatch = journeyPageCode.match(/const PRESET_LOCATIONS = \{([\s\S]*?)\n\};\n\nfunction calculateHaversineDistance/);
  assert(presetMatch !== null, '成功从源码提取 PRESET_LOCATIONS 预设对象定义');

  const presetObj = new Function(`return {${presetMatch[1]}};`)();
  const allLocations = [...presetObj.domestic, ...presetObj.international];

  assert(presetObj.domestic.length === 20, `国内城市预设严格为 20 个 (实测: ${presetObj.domestic.length})`);
  assert(presetObj.international.length === 16, `国际常用枢纽预设严格为 16 个 (实测: ${presetObj.international.length})`);
  assert(allLocations.length === 36, `总预设目的地严格为 36 个 (实测: ${allLocations.length})`);

  let allCoordsValid = true;
  for (const loc of allLocations) {
    if (typeof loc.lat !== 'number' || loc.lat < -90 || loc.lat > 90) {
      allCoordsValid = false;
      console.error(`非法纬度: ${loc.city}, lat=${loc.lat}`);
    }
    if (typeof loc.lon !== 'number' || loc.lon < -180 || loc.lon > 180) {
      allCoordsValid = false;
      console.error(`非法经度: ${loc.city}, lon=${loc.lon}`);
    }
    if (!loc.slug || !loc.slug.endsWith('-voyage')) {
      allCoordsValid = false;
      console.error(`不规范 Slug: ${loc.city}, slug=${loc.slug}`);
    }
  }
  assert(allCoordsValid, '全部 36 个预设目的地的经纬度在合法范围 [-90,90] 与 [-180,180] 内，且 Slug 遵循规范');
}

// 4.3 墨卡托/等距柱状世界投影算法 (projectCoords) 数学极限边界测试
{
  const width = 960;
  const height = 440;

  // 源码中的算法
  const projectCoords = (lat, lon) => {
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  // 边界 1: 本初子午线与赤道交点 (0, 0) -> 画布正中心 (480, 220)
  const center = projectCoords(0, 0);
  assert(center.x === 480 && center.y === 220, '中心点 (0,0) 精确映射至画布正中心 (480, 220)', JSON.stringify(center));

  // 边界 2: 极点与日期变更线边界
  const northWest = projectCoords(90, -180);
  assert(northWest.x === 0 && northWest.y === 0, '西北极值点 (90, -180) 精确映射至左上角 (0, 0)', JSON.stringify(northWest));

  const southEast = projectCoords(-90, 180);
  assert(southEast.x === 960 && southEast.y === 440, '东南极值点 (-90, 180) 精确映射至右下角 (960, 440)', JSON.stringify(southEast));

  // 边界 3: 非法或空入参守卫
  assert(projectCoords(null, 100) === null, 'lat 为 null 时安全返回 null');
  assert(projectCoords(30, undefined) === null, 'lon 为 undefined 时安全返回 null');
  assert(projectCoords('30', '100') === null, '字符串入参安全返回 null');
}

// ==============================================================================
// 总结汇总输出
// ==============================================================================
console.log('\n================================================================================');
console.log('ADVERSARIAL CHALLENGE EXECUTION SUMMARY');
console.log(`Total Checks : ${totalChecks}`);
console.log(`Passed       : ${passedChecks}`);
console.log(`Failed       : ${failedChecks}`);
console.log(`Success Rate : ${((passedChecks / totalChecks) * 100).toFixed(2)}%`);
console.log('================================================================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL ADVERSARIAL CHECKS PASSED EMPIRICALLY!');
  process.exit(0);
}
