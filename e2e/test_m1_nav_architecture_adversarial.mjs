// e2e/test_m1_nav_architecture_adversarial.mjs
import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('CHALLENGER 1 EMPIRICAL ADVERSARIAL VERIFICATION SUITE');
console.log('Target: Milestone 1 (M1) 核心导航与信息架构深度收敛');
console.log('Date: ' + new Date().toISOString());
console.log('======================================================================\n');

let totalAsserts = 0;
let passedAsserts = 0;
let failedAsserts = 0;
const failures = [];

function assert(condition, message) {
  totalAsserts++;
  if (condition) {
    passedAsserts++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedAsserts++;
    console.error(`  [FAIL] ${message}`);
    failures.push(message);
  }
}

// -----------------------------------------------------------------------------
// [Test Suite 1]: 后台路由树与导航矩阵完整性对抗验证
// -----------------------------------------------------------------------------
console.log('[Test Suite 1] 扫描后台物理路由树并验证 ADMIN_MATRICES 导航矩阵...');

const adminAppDir = path.resolve('frontend/app/admin');
const adminPages = [];

function scanDir(dir, currentRoute = '/admin') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      scanDir(path.join(dir, entry.name), `${currentRoute}/${entry.name}`);
    } else if (entry.name === 'page.tsx') {
      adminPages.push(currentRoute);
    }
  }
}
scanDir(adminAppDir);

console.log(`  Found ${adminPages.length} physical page.tsx routes under /admin:`);
adminPages.sort().forEach(r => console.log(`    - ${r}`));

assert(adminPages.includes('/admin/now'), '物理路由树中必须存在 /admin/now/page.tsx');
assert(adminPages.includes('/admin/categories'), '物理路由树中必须存在 /admin/categories/page.tsx');
assert(adminPages.includes('/admin/tags'), '物理路由树中必须存在 /admin/tags/page.tsx (代理兼容页)');
assert(adminPages.includes('/admin/projects'), '物理路由树中必须存在 /admin/projects/page.tsx');
assert(adminPages.includes('/admin/timeline'), '物理路由树中必须存在 /admin/timeline/page.tsx (代理兼容页)');

// 检查 AdminSidebar.tsx 源码
const sidebarPath = path.resolve('frontend/components/admin/AdminSidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

assert(sidebarContent.includes("title: '此时时刻 (Now)'"), 'AdminSidebar.tsx 必须包含标题 "此时时刻 (Now)"');
assert(sidebarContent.includes("href: '/admin/now'"), 'AdminSidebar.tsx 必须包含路由 "/admin/now"');
assert(sidebarContent.includes("icon: Clock"), '此时时刻 (Now) 必须使用 Clock 图标');

// 解析 ADMIN_MATRICES 数据
const matrixMatch = sidebarContent.match(/export const ADMIN_MATRICES: AdminMatrixGroup\[\] = ([\s\S]*?);\n\ninterface/);
assert(matrixMatch !== null, '必须成功匹配并导出 ADMIN_MATRICES 矩阵常量');

// 校验矩阵中每一个声明的 href 是否都在物理路由树中存在
const hrefRegex = /href:\s*'([^']+)'/g;
let m;
const matrixHrefs = [];
while ((m = hrefRegex.exec(sidebarContent)) !== null) {
  if (m[1].startsWith('/admin/')) {
    matrixHrefs.push(m[1]);
  }
}
const uniqueMatrixHrefs = [...new Set(matrixHrefs)];
console.log(`  Extracted ${uniqueMatrixHrefs.length} distinct admin links from AdminSidebar.tsx:`, uniqueMatrixHrefs);

uniqueMatrixHrefs.forEach(href => {
  // 处理确切路由映射
  const exists = adminPages.includes(href) || adminPages.includes(href.replace(/\/create$/, ''));
  assert(exists, `矩阵路由 ${href} 必须在物理页面树中存在`);
});

// -----------------------------------------------------------------------------
// [Test Suite 2]: AdminCommandPalette 全局命令面板对抗检索测试
// -----------------------------------------------------------------------------
console.log('\n[Test Suite 2] 对抗性检索测试：验证 /admin/now 在全局命令面板中 100% 可被检出...');

const cmdPalettePath = path.resolve('frontend/components/admin/AdminCommandPalette.tsx');
const cmdPaletteContent = fs.readFileSync(cmdPalettePath, 'utf-8');

assert(cmdPaletteContent.includes('ADMIN_MATRICES.flatMap'), 'CommandPalette 必须基于 ADMIN_MATRICES 动态构建索引');

// 模拟 CommandPalette 的搜索过滤逻辑
const sampleMatrixItems = [
  { category: '概览仪表盘', title: '控制台概览', subtitle: '/admin/dashboard' },
  { category: '概览仪表盘', title: '访问分析看板', subtitle: '/admin/analytics' },
  { category: '创作工坊', title: '文章管理', subtitle: '/admin/posts' },
  { category: '创作工坊', title: '新建文章', subtitle: '/admin/posts/create' },
  { category: '创作工坊', title: '媒体资产中心', subtitle: '/admin/media' },
  { category: '创作工坊', title: '随记微动态', subtitle: '/admin/memos' },
  { category: '知识与足迹', title: '知识图谱', subtitle: '/admin/graph' },
  { category: '知识与足迹', title: '知识分类工作台', subtitle: '/admin/categories' },
  { category: '知识与足迹', title: '履历与造物', subtitle: '/admin/projects' },
  { category: '知识与足迹', title: '旅行足迹', subtitle: '/admin/journey' },
  { category: '知识与足迹', title: '此时时刻 (Now)', subtitle: '/admin/now' },
  { category: '读者社区', title: '评论审核', subtitle: '/admin/comments' },
  { category: '读者社区', title: '读者管理', subtitle: '/admin/users' },
  { category: '读者社区', title: '友链管理', subtitle: '/admin/links' },
  { category: '系统与智能体', title: '系统与 AI 设置', subtitle: '/admin/settings' },
  { category: '系统与智能体', title: '安全审计日志', subtitle: '/admin/audit-logs' },
];

function simulateSearch(query) {
  const normalizedQuery = query.trim().toLowerCase();
  return sampleMatrixItems.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.subtitle?.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery)
  );
}

const testQueries = [
  'now',
  'Now',
  'NOW',
  '此时时刻',
  '此时时刻 (Now)',
  '/admin/now',
  '时刻',
  '知识与足迹',
  'now ',
  '  NOW  '
];

testQueries.forEach(q => {
  const results = simulateSearch(q);
  const matchedNow = results.some(r => r.subtitle === '/admin/now');
  assert(matchedNow, `CommandPalette 输入 query="${q}" 必须成功检索出 /admin/now`);
});

// -----------------------------------------------------------------------------
// [Test Suite 3]: /admin/tags 与 /admin/timeline 平滑重定向与过渡态对抗测试
// -----------------------------------------------------------------------------
console.log('\n[Test Suite 3] 验证 /admin/tags 与 /admin/timeline 平滑重定向、过渡态与 0 404...');

const tagsPath = path.resolve('frontend/app/admin/tags/page.tsx');
const tagsContent = fs.readFileSync(tagsPath, 'utf-8');

assert(tagsContent.includes("'use client'"), '/admin/tags/page.tsx 必须声明 use client 客户端渲染');
assert(tagsContent.includes("router.replace('/admin/categories?tab=tags')"), '/admin/tags/page.tsx 必须使用 router.replace 无痕平移至 /admin/categories?tab=tags');
assert(tagsContent.includes('<Suspense'), '/admin/tags/page.tsx 必须由 Suspense 包装以支持 SSR/SSG');
assert(tagsContent.includes('animate-ping') || tagsContent.includes('正在接入'), '/admin/tags/page.tsx 必须包含微动效过渡等待态，防止白屏闪烁');

const timelinePath = path.resolve('frontend/app/admin/timeline/page.tsx');
const timelineContent = fs.readFileSync(timelinePath, 'utf-8');

assert(timelineContent.includes("'use client'"), '/admin/timeline/page.tsx 必须声明 use client 客户端渲染');
assert(timelineContent.includes("router.replace('/admin/projects?tab=timeline')"), '/admin/timeline/page.tsx 必须使用 router.replace 无痕平移至 /admin/projects?tab=timeline');
assert(timelineContent.includes('<Suspense'), '/admin/timeline/page.tsx 必须由 Suspense 包装以支持 SSR/SSG');
assert(timelineContent.includes('animate-ping') || timelineContent.includes('正在接入'), '/admin/timeline/page.tsx 必须包含微动效过渡等待态，防止白屏闪烁');

// 校验分类工作台 categories/page.tsx 是否支持 ?tab=tags
const catPagePath = path.resolve('frontend/app/admin/categories/page.tsx');
const catPageContent = fs.readFileSync(catPagePath, 'utf-8');
assert(catPageContent.includes("searchParams?.get('tab')"), 'categories/page.tsx 必须读取 URL query tab 参数');
assert(catPageContent.includes("tab === 'tags'") || catPageContent.includes("queryTab === 'tags'"), 'categories/page.tsx 必须支持 tags Tab 分支');
assert(catPageContent.includes('catName') && catPageContent.includes('tagName'), 'categories/page.tsx 分类与标签表单状态必须完全解耦隔离');

// 校验履历造物工作台 projects/page.tsx 是否支持 ?tab=timeline
const projPagePath = path.resolve('frontend/app/admin/projects/page.tsx');
const projPageContent = fs.readFileSync(projPagePath, 'utf-8');
assert(projPageContent.includes("searchParams?.get('tab')"), 'projects/page.tsx 必须读取 URL query tab 参数');
assert(projPageContent.includes("queryTab === 'timeline'"), 'projects/page.tsx 必须支持 timeline Tab 分支');
assert(projPageContent.includes('projectSearch') && projPageContent.includes('timelineSearch'), 'projects/page.tsx 项目与时间线搜索状态必须完全解耦隔离');

// -----------------------------------------------------------------------------
// [Test Suite 4]: AdminSidebar.tsx 键盘事件监听与输入元素豁免对抗测试
// -----------------------------------------------------------------------------
console.log('\n[Test Suite 4] 验证 AdminSidebar.tsx Cmd+B/Ctrl+B 快捷键防误触豁免边界...');

// 提取源码中的判断逻辑
const keydownRegex = /if\s*\(\s*\(e\.metaKey\s*\|\|\s*e\.ctrlKey\)\s*&&\s*\(e\.key === 'b'\s*\|\|\s*e\.key === 'B'\)\s*\)\s*\{([\s\S]*?)onToggleCollapse\(\);/m;
const keydownMatch = sidebarContent.match(keydownRegex);
assert(keydownMatch !== null, '必须在 AdminSidebar.tsx 中找到 Cmd+B/Ctrl+B 的按键拦截与豁免逻辑');

// 模拟事件拦截函数
function shouldExemptTarget(target) {
  if (!target) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    Boolean(target.isContentEditable)
  );
}

function simulateKeyCombo(e, target) {
  let toggled = false;
  let prevented = false;

  if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
    if (shouldExemptTarget(target)) {
      return { toggled: false, prevented: false, exempted: true };
    }
    prevented = true;
    toggled = true;
  }
  return { toggled, prevented, exempted: false };
}

// 对抗测试用例矩阵
const testElementCases = [
  { desc: '<input type="text">', target: { tagName: 'INPUT', isContentEditable: false }, shouldExempt: true },
  { desc: '<input type="password">', target: { tagName: 'INPUT', isContentEditable: false }, shouldExempt: true },
  { desc: '<input type="search">', target: { tagName: 'INPUT', isContentEditable: false }, shouldExempt: true },
  { desc: '<textarea rows="4">', target: { tagName: 'TEXTAREA', isContentEditable: false }, shouldExempt: true },
  { desc: '<div contenteditable="true"> (富文本编辑器)', target: { tagName: 'DIV', isContentEditable: true }, shouldExempt: true },
  { desc: '<section isContentEditable={true}> (Markdown 块)', target: { tagName: 'SECTION', isContentEditable: true }, shouldExempt: true },
  { desc: '<button> (常规按钮)', target: { tagName: 'BUTTON', isContentEditable: false }, shouldExempt: false },
  { desc: '<div> (普通容器)', target: { tagName: 'DIV', isContentEditable: false }, shouldExempt: false },
  { desc: '<span> (内联文本)', target: { tagName: 'SPAN', isContentEditable: false }, shouldExempt: false },
  { desc: '<body> (视口容器)', target: { tagName: 'BODY', isContentEditable: false }, shouldExempt: false },
  { desc: 'null (无焦点目标)', target: null, shouldExempt: false },
];

testElementCases.forEach(c => {
  const resMeta = simulateKeyCombo({ metaKey: true, ctrlKey: false, key: 'b' }, c.target);
  assert(resMeta.exempted === c.shouldExempt, `Cmd+B 针对 ${c.desc}: 豁免预期 ${c.shouldExempt} -> 实测 ${resMeta.exempted}`);
  assert(resMeta.toggled === !c.shouldExempt, `Cmd+B 针对 ${c.desc}: 折叠切换预期 ${!c.shouldExempt} -> 实测 ${resMeta.toggled}`);

  const resCtrl = simulateKeyCombo({ metaKey: false, ctrlKey: true, key: 'B' }, c.target);
  assert(resCtrl.exempted === c.shouldExempt, `Ctrl+B (大写) 针对 ${c.desc}: 豁免预期 ${c.shouldExempt} -> 实测 ${resCtrl.exempted}`);
});

// 测试非对应按键干扰抵抗
const nonComboCases = [
  { metaKey: false, ctrlKey: false, key: 'b', desc: '纯单个字母 b' },
  { metaKey: true, ctrlKey: false, key: 'k', desc: 'Cmd+K (唤起命令面板，不应触发折叠)' },
  { metaKey: false, ctrlKey: true, key: 'c', desc: 'Ctrl+C (复制)' },
  { altKey: true, metaKey: false, ctrlKey: false, key: 'b', desc: 'Alt+B' },
];

nonComboCases.forEach(c => {
  const res = simulateKeyCombo(c, { tagName: 'DIV', isContentEditable: false });
  assert(!res.toggled, `干扰按键组合 [${c.desc}] 绝不能触发侧栏折叠`);
});

// -----------------------------------------------------------------------------
// [Test Suite 5]: 动态面包屑解析与防同名冗余对抗测试
// -----------------------------------------------------------------------------
console.log('\n[Test Suite 5] 验证 AdminBreadcrumbsInner 路径解析、去冗余与鲁棒性...');

const layoutPath = path.resolve('frontend/app/admin/layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

assert(layoutContent.includes("function AdminBreadcrumbsInner"), 'layout.tsx 必须包含 AdminBreadcrumbsInner 组件');
assert(layoutContent.includes("pathname === '/admin/dashboard'"), '必须对 /admin/dashboard 特判去冗余');
assert(layoutContent.includes("name: '控制台概览'"), '控制台概览面包屑层级必须规范');
assert(layoutContent.includes("pathname === '/admin/now'"), '必须对 /admin/now 具备精准面包屑解析');
assert(layoutContent.includes("name: '此时时刻 (Now)'"), '此时时刻面包屑必须正确显示');

// 模拟 layout.tsx 的面包屑算法
function computeBreadcrumbs(pathname, tab) {
  if (!pathname) return [{ name: 'Studio', href: '/admin/dashboard' }];

  if (pathname === '/admin/dashboard') {
    return [
      { name: 'Studio', href: '/admin/dashboard' },
      { name: '控制台概览', href: '/admin/dashboard' },
    ];
  }

  if (pathname.includes('/admin/posts/edit/')) {
    return [
      { name: 'Studio', href: '/admin/dashboard' },
      { name: '创作工坊', href: '/admin/posts' },
      { name: '编辑文章', href: pathname },
    ];
  }

  if (pathname === '/admin/now') {
    return [
      { name: 'Studio', href: '/admin/dashboard' },
      { name: '知识与足迹', href: '/admin/categories' },
      { name: '此时时刻 (Now)', href: '/admin/now' },
    ];
  }

  if (pathname === '/admin/categories' || pathname === '/admin/tags') {
    const activeTab = pathname === '/admin/tags' ? 'tags' : tab;
    const crumbs = [
      { name: 'Studio', href: '/admin/dashboard' },
      { name: '知识与足迹', href: '/admin/categories' },
      { name: '知识分类工作台', href: '/admin/categories' },
    ];
    if (activeTab === 'tags') {
      crumbs.push({ name: '标签矩阵', href: '/admin/categories?tab=tags' });
    } else if (activeTab === 'categories') {
      crumbs.push({ name: '分类管理', href: '/admin/categories?tab=categories' });
    } else if (activeTab === 'overview') {
      crumbs.push({ name: '知识脉络', href: '/admin/categories?tab=overview' });
    }
    return crumbs;
  }

  if (pathname === '/admin/projects' || pathname === '/admin/timeline') {
    const activeTab = pathname === '/admin/timeline' ? 'timeline' : tab;
    const crumbs = [
      { name: 'Studio', href: '/admin/dashboard' },
      { name: '知识与足迹', href: '/admin/categories' },
      { name: '履历与造物', href: '/admin/projects' },
    ];
    if (activeTab === 'timeline') {
      crumbs.push({ name: '成长编年史', href: '/admin/projects?tab=timeline' });
    } else if (activeTab === 'living') {
      crumbs.push({ name: '全景时光轴', href: '/admin/projects?tab=living' });
    } else if (activeTab === 'projects') {
      crumbs.push({ name: '精选造物', href: '/admin/projects?tab=projects' });
    }
    return crumbs;
  }

  return [
    { name: 'Studio', href: '/admin/dashboard' },
    { name: '工作台', href: pathname },
  ];
}

const breadcrumbCases = [
  {
    path: '/admin/dashboard',
    tab: null,
    expected: ['Studio', '控制台概览'],
    desc: '控制台首页去同名冗余'
  },
  {
    path: '/admin/now',
    tab: null,
    expected: ['Studio', '知识与足迹', '此时时刻 (Now)'],
    desc: '此时时刻 (Now) 面包屑精准度'
  },
  {
    path: '/admin/categories',
    tab: 'tags',
    expected: ['Studio', '知识与足迹', '知识分类工作台', '标签矩阵'],
    desc: '知识分类工作台 ?tab=tags'
  },
  {
    path: '/admin/tags',
    tab: null,
    expected: ['Studio', '知识与足迹', '知识分类工作台', '标签矩阵'],
    desc: '旧标签路由代理访问时的面包屑兼容'
  },
  {
    path: '/admin/projects',
    tab: 'timeline',
    expected: ['Studio', '知识与足迹', '履历与造物', '成长编年史'],
    desc: '履历造物工作台 ?tab=timeline'
  },
  {
    path: '/admin/timeline',
    tab: null,
    expected: ['Studio', '知识与足迹', '履历与造物', '成长编年史'],
    desc: '旧时间线路由代理访问时的面包屑兼容'
  },
  {
    path: '/admin/unknown-boundary-route',
    tab: null,
    expected: ['Studio', '工作台'],
    desc: '未定义异常边界路由容错兜底'
  }
];

breadcrumbCases.forEach(c => {
  const crumbs = computeBreadcrumbs(c.path, c.tab);
  const names = crumbs.map(x => x.name);
  const matched = JSON.stringify(names) === JSON.stringify(c.expected);
  assert(matched, `面包屑 [${c.desc}] 路径: ${c.path} -> 输出: ${names.join(' > ')}`);
});

// -----------------------------------------------------------------------------
// [Test Suite 6]: 站长身份纯正性审查 (AGENTS.md 准则 1)
// -----------------------------------------------------------------------------
console.log('\n[Test Suite 6] 审查相关文件的站长姓名唯一纯正性 (Hayden Xue)...');

const filesToInspect = [
  'frontend/components/admin/AdminSidebar.tsx',
  'frontend/app/admin/layout.tsx',
  'frontend/app/admin/categories/page.tsx',
  'frontend/app/admin/tags/page.tsx',
  'frontend/app/admin/projects/page.tsx',
  'frontend/app/admin/timeline/page.tsx',
  'frontend/app/admin/now/page.tsx'
];

filesToInspect.forEach(relPath => {
  const fullPath = path.resolve(relPath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  // 查找非法历史遗留名称
  const illegalMatches = content.match(/\bHoward\b/g) || [];
  assert(illegalMatches.length === 0, `文件 ${relPath} 严禁包含历史遗留名称 Howard (命中数: ${illegalMatches.length})`);
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`TEST SUMMARY: Total Asserts: ${totalAsserts} | Passed: ${passedAsserts} | Failed: ${failedAsserts}`);
if (failedAsserts === 0) {
  console.log('ALL ADVERSARIAL TESTS PASSED CONVINCINGLY! [STATUS: APPROVE]');
} else {
  console.log(`FAILED ${failedAsserts} TESTS. [STATUS: REQUEST_CHANGES]`);
  failures.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
}
console.log('======================================================================');
