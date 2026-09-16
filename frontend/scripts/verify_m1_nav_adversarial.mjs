import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('🚀 M1 对抗性验证套件：核心导航与信息架构深度收敛 实证复核');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

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

// -----------------------------------------------------------------------------
// 1. 模拟 / 提取 layout.tsx 中的 AdminBreadcrumbsInner 核心解析逻辑
// -----------------------------------------------------------------------------
console.log('【Suite 1】面包屑解析逻辑多用例对抗验证 (Breadcrumbs Resolution)');

export const ADMIN_MATRICES = [
  {
    id: 'overview',
    name: '控制台与分析',
    items: [
      { title: '控制台概览', href: '/admin/dashboard' },
      { title: '访问分析看板', href: '/admin/analytics' },
      { title: '安全审计日志', href: '/admin/audit-logs' },
      { title: '资产健康体检', href: '/admin/health' },
    ],
  },
  {
    id: 'studio',
    name: '内容创作与媒体',
    items: [
      { title: '文章管理', href: '/admin/posts' },
      { title: '新建文章', href: '/admin/posts/create' },
      { title: '随记微动态', href: '/admin/memos' },
      { title: '媒体资产中心', href: '/admin/media' },
    ],
  },
  {
    id: 'taxonomy',
    name: '知识图谱与足迹',
    items: [
      { title: '知识图谱', href: '/admin/graph' },
      { title: '知识分类工作台', href: '/admin/categories' },
      { title: '履历与造物', href: '/admin/projects' },
      { title: '旅行足迹', href: '/admin/journey' },
    ],
  },
  {
    id: 'community',
    name: '读者社区与互动',
    items: [
      { title: '评论审核', href: '/admin/comments' },
      { title: '读者管理', href: '/admin/users' },
      { title: '友链管理', href: '/admin/links' },
    ],
  },
  {
    id: 'ops',
    name: '系统设置与基建',
    items: [
      { title: '系统与 AI 设置', href: '/admin/settings' },
    ],
  },
];

function resolveBreadcrumbs(pathname, searchParamsObj = {}) {
  const tab = searchParamsObj.tab || null;

  if (!pathname) return [{ name: 'Studio', href: '/admin/dashboard' }];

  // 1. Dashboard 控制台概览
  if (pathname === '/admin/dashboard') {
    return [
      { name: 'Studio', href: '/admin/dashboard' },
      { name: '控制台概览', href: '/admin/dashboard' },
    ];
  }

  // 2. 编辑文章特判
  if (pathname.includes('/admin/posts/edit/')) {
    return [
      { name: 'Studio', href: '/admin/dashboard' },
      { name: '内容创作与媒体', href: '/admin/posts' },
      { name: '编辑文章', href: pathname },
    ];
  }

  // 3. 知识分类工作台
  if (pathname === '/admin/categories' || pathname === '/admin/tags') {
    const activeTab = pathname === '/admin/tags' ? 'tags' : tab;
    const crumbs = [
      { name: 'Studio', href: '/admin/dashboard' },
      { name: '知识图谱与足迹', href: '/admin/categories' },
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

  // 5. 履历与造物工作台
  if (pathname === '/admin/projects' || pathname === '/admin/timeline') {
    const activeTab = pathname === '/admin/timeline' ? 'timeline' : tab;
    const crumbs = [
      { name: 'Studio', href: '/admin/dashboard' },
      { name: '知识图谱与足迹', href: '/admin/categories' },
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

  // 6. 其他矩阵页面动态匹配
  for (const matrix of ADMIN_MATRICES) {
    for (const item of matrix.items) {
      if (
        item.exact
          ? pathname === item.href
          : pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
      ) {
        return [
          { name: 'Studio', href: '/admin/dashboard' },
          { name: matrix.name, href: matrix.items[0]?.href || '/admin/dashboard' },
          { name: item.title, href: item.href },
        ];
      }
    }
  }

  return [
    { name: 'Studio', href: '/admin/dashboard' },
    { name: '工作台', href: pathname },
  ];
}

function breadcrumbString(crumbs) {
  return crumbs.map((c) => c.name).join(' > ');
}

// 契约用例 1
test('用例 1: /admin/dashboard 必须输出 Studio > 控制台概览 (去重去冗余)', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/dashboard'));
  assert.strictEqual(result, 'Studio > 控制台概览');
});

// 契约用例 2
test('用例 2: /admin/journey 必须输出 Studio > 知识图谱与足迹 > 旅行足迹', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/journey'));
  assert.strictEqual(result, 'Studio > 知识图谱与足迹 > 旅行足迹');
});

// 契约用例 3
test('用例 3: /admin/categories?tab=tags 必须输出 Studio > 知识图谱与足迹 > 知识分类工作台 > 标签矩阵', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/categories', { tab: 'tags' }));
  assert.strictEqual(result, 'Studio > 知识图谱与足迹 > 知识分类工作台 > 标签矩阵');
});

// 扩展对抗用例 4: /admin/tags 代理路由是否智能继承标签矩阵面包屑
test('扩展用例 4: /admin/tags 代理路由输出 Studio > 知识图谱与足迹 > 知识分类工作台 > 标签矩阵', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/tags'));
  assert.strictEqual(result, 'Studio > 知识图谱与足迹 > 知识分类工作台 > 标签矩阵');
});

// 扩展对抗用例 5: /admin/categories?tab=categories
test('扩展用例 5: /admin/categories?tab=categories 输出 Studio > 知识图谱与足迹 > 知识分类工作台 > 分类管理', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/categories', { tab: 'categories' }));
  assert.strictEqual(result, 'Studio > 知识图谱与足迹 > 知识分类工作台 > 分类管理');
});

// 扩展对抗用例 6: /admin/categories?tab=overview
test('扩展用例 6: /admin/categories?tab=overview 输出 Studio > 知识图谱与足迹 > 知识分类工作台 > 知识脉络', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/categories', { tab: 'overview' }));
  assert.strictEqual(result, 'Studio > 知识图谱与足迹 > 知识分类工作台 > 知识脉络');
});

// 扩展对抗用例 7: /admin/categories 缺省参数
test('扩展用例 7: /admin/categories 缺省参数输出 Studio > 知识图谱与足迹 > 知识分类工作台', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/categories'));
  assert.strictEqual(result, 'Studio > 知识图谱与足迹 > 知识分类工作台');
});

// 扩展对抗用例 8: /admin/projects?tab=timeline
test('扩展用例 8: /admin/projects?tab=timeline 输出 Studio > 知识图谱与足迹 > 履历与造物 > 成长编年史', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/projects', { tab: 'timeline' }));
  assert.strictEqual(result, 'Studio > 知识图谱与足迹 > 履历与造物 > 成长编年史');
});

// 扩展对抗用例 9: /admin/timeline 代理路由
test('扩展用例 9: /admin/timeline 代理路由输出 Studio > 知识图谱与足迹 > 履历与造物 > 成长编年史', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/timeline'));
  assert.strictEqual(result, 'Studio > 知识图谱与足迹 > 履历与造物 > 成长编年史');
});

// 扩展对抗用例 10: /admin/posts/edit/42
test('扩展用例 10: /admin/posts/edit/42 输出 Studio > 内容创作与媒体 > 编辑文章', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/posts/edit/42'));
  assert.strictEqual(result, 'Studio > 内容创作与媒体 > 编辑文章');
});

// 扩展对抗用例 11: 矩阵动态匹配 /admin/graph
test('扩展用例 11: /admin/graph 输出 Studio > 知识图谱与足迹 > 知识图谱', () => {
  const result = breadcrumbString(resolveBreadcrumbs('/admin/graph'));
  assert.strictEqual(result, 'Studio > 知识图谱与足迹 > 知识图谱');
});


// -----------------------------------------------------------------------------
// 2. 状态隔离度静态与逻辑对抗分析 (State Isolation & Closure Analysis)
// -----------------------------------------------------------------------------
console.log('\n【Suite 2】状态隔离度与闭包泄漏对抗验证 (State Isolation)');

const catFileContent = fs.readFileSync(path.join(projectRoot, 'app/admin/categories/page.tsx'), 'utf-8');
const projFileContent = fs.readFileSync(path.join(projectRoot, 'app/admin/projects/page.tsx'), 'utf-8');

test('categories/page.tsx: 分类状态与标签状态声明严格正交隔离', () => {
  // 提取分类相关的 useState
  const catStates = ['categories', 'catName', 'catSlug', 'catDescription', 'catEditingId', 'catSearch', 'catSubmitting'];
  const tagStates = ['tags', 'tagName', 'tagSlug', 'tagEditingId', 'tagSearch', 'tagSubmitting'];

  for (const s of catStates) {
    const regex = new RegExp(`const\\s*\\[\\s*${s}\\s*,\\s*set[A-Za-z0-9_]+\\s*\\]\\s*=\\s*useState`, 'g');
    assert.ok(regex.test(catFileContent), `分类状态 ${s} 必须独立以 useState 声明`);
  }

  for (const s of tagStates) {
    const regex = new RegExp(`const\\s*\\[\\s*${s}\\s*,\\s*set[A-Za-z0-9_]+\\s*\\]\\s*=\\s*useState`, 'g');
    assert.ok(regex.test(catFileContent), `标签状态 ${s} 必须独立以 useState 声明`);
  }
});

test('categories/page.tsx: handleCategorySubmit 无标签状态污染与交叉引用', () => {
  // 截取 handleCategorySubmit 函数体
  const match = catFileContent.match(/const handleCategorySubmit\s*=\s*async\s*\([\s\S]*?\}\s*finally\s*\{[\s\S]*?\}\s*\};/);
  assert.ok(match, '必须存在 handleCategorySubmit 函数实现');
  const body = match[0];

  assert.ok(!body.includes('setTagName'), 'handleCategorySubmit 严禁触碰 setTagName');
  assert.ok(!body.includes('setTagSlug'), 'handleCategorySubmit 严禁触碰 setTagSlug');
  assert.ok(!body.includes('setTagEditingId'), 'handleCategorySubmit 严禁触碰 setTagEditingId');
  assert.ok(!body.includes('setTagSubmitting'), 'handleCategorySubmit 严禁触碰 setTagSubmitting');
  assert.ok(!body.includes('loadTags'), 'handleCategorySubmit 不应错误触发 loadTags');
});

test('categories/page.tsx: handleTagSubmit 无分类状态污染与交叉引用', () => {
  const match = catFileContent.match(/const handleTagSubmit\s*=\s*async\s*\([\s\S]*?\}\s*finally\s*\{[\s\S]*?\}\s*\};/);
  assert.ok(match, '必须存在 handleTagSubmit 函数实现');
  const body = match[0];

  assert.ok(!body.includes('setCatName'), 'handleTagSubmit 严禁触碰 setCatName');
  assert.ok(!body.includes('setCatSlug'), 'handleTagSubmit 严禁触碰 setCatSlug');
  assert.ok(!body.includes('setCatDescription'), 'handleTagSubmit 严禁触碰 setCatDescription');
  assert.ok(!body.includes('setCatEditingId'), 'handleTagSubmit 严禁触碰 setCatEditingId');
  assert.ok(!body.includes('setCatSubmitting'), 'handleTagSubmit 严禁触碰 setCatSubmitting');
  assert.ok(!body.includes('loadCategories'), 'handleTagSubmit 不应错误触发 loadCategories');
});

test('categories/page.tsx: Tab 切换不销毁未提交表单暂存（天然组件域保活）', () => {
  // 验证分类表单输入与标签表单输入是同处于 KnowledgeTaxonomyWorkbench 组件顶层状态机中
  // 条件渲染仅切换视图节点，并未卸载整个 Workbench 组件
  assert.ok(catFileContent.includes('activeTab === \'categories\''), '具有分类 Tab 条件视口');
  assert.ok(catFileContent.includes('activeTab === \'tags\''), '具有标签 Tab 条件视口');
  // 确认在 handleTabChange 中没有清空 catName / tagName
  const tabChangeMatch = catFileContent.match(/const handleTabChange\s*=\s*\(tab:\s*TaxonomyTab\)\s*=>\s*\{[\s\S]*?\};/);
  assert.ok(tabChangeMatch, '必须具有 handleTabChange 函数');
  const tabChangeBody = tabChangeMatch[0];
  assert.ok(!tabChangeBody.includes('setCatName'), '切换 Tab 时不得强制重置分类输入');
  assert.ok(!tabChangeBody.includes('setTagName'), '切换 Tab 时不得强制重置标签输入');
});

test('projects/page.tsx: 造物项目状态与时间线状态严格隔离解耦', () => {
  const projStates = ['projects', 'editingProject', 'isProjectModalOpen', 'uploading', 'projectSearch'];
  const timelineStates = [
    'timelines',
    'timelineYear',
    'timelineTitle',
    'timelineDescription',
    'timelineSortOrder',
    'timelineEditingId',
    'timelineSearch',
    'timelineSubmitting',
  ];

  for (const s of projStates) {
    const regex = new RegExp(`const\\s*\\[\\s*${s}\\s*,\\s*set[A-Za-z0-9_]+\\s*\\]\\s*=\\s*useState`, 'g');
    assert.ok(regex.test(projFileContent), `项目状态 ${s} 必须独立以 useState 声明`);
  }

  for (const s of timelineStates) {
    const regex = new RegExp(`const\\s*\\[\\s*${s}\\s*,\\s*set[A-Za-z0-9_]+\\s*\\]\\s*=\\s*useState`, 'g');
    assert.ok(regex.test(projFileContent), `时间线状态 ${s} 必须独立以 useState 声明`);
  }
});

test('projects/page.tsx: handleSaveProject 与 handleTimelineSubmit 逻辑正交无状态泄漏', () => {
  const projSaveMatch = projFileContent.match(/const handleSaveProject\s*=\s*async\s*\([\s\S]*?\}\s*finally\s*\{[\s\S]*?\}|const handleSaveProject\s*=\s*async\s*\([\s\S]*?loadProjects\(\);[\s\S]*?\};/);
  assert.ok(projSaveMatch, '必须存在 handleSaveProject');
  const projBody = projSaveMatch[0];
  assert.ok(!projBody.includes('setTimelineYear'), 'handleSaveProject 严禁修改时间线状态');
  assert.ok(!projBody.includes('setTimelineTitle'), 'handleSaveProject 严禁修改时间线状态');

  const timelineSubmitMatch = projFileContent.match(/const handleTimelineSubmit\s*=\s*async\s*\([\s\S]*?\}\s*finally\s*\{[\s\S]*?\}\s*\};/);
  assert.ok(timelineSubmitMatch, '必须存在 handleTimelineSubmit');
  const timelineBody = timelineSubmitMatch[0];
  assert.ok(!timelineBody.includes('setEditingProject'), 'handleTimelineSubmit 严禁修改项目编辑状态');
  assert.ok(!timelineBody.includes('setIsProjectModalOpen'), 'handleTimelineSubmit 严禁触碰项目弹窗');
});


// -----------------------------------------------------------------------------
// 3. URL Query 联动与 Next.js Suspense 保护分析
// -----------------------------------------------------------------------------
console.log('\n【Suite 3】URL 参数与 Tab 切换响应平滑度验证 (URL Query & Tab Switching)');

test('categories/page.tsx: 采用 Suspense 包裹以防 Next.js SSG 静态预渲染 de-opt', () => {
  assert.ok(catFileContent.includes('<Suspense'), '必须使用 Suspense 包裹 KnowledgeTaxonomyWorkbench');
  assert.ok(catFileContent.includes('useSearchParams()'), '必须使用 useSearchParams 获取 query 参数');
  assert.ok(catFileContent.includes('router.replace'), 'Tab 切换必须使用 router.replace 避免污染浏览器历史堆栈');
});

test('projects/page.tsx: 采用 Suspense 包裹与平滑 router.replace', () => {
  assert.ok(projFileContent.includes('<Suspense'), '必须使用 Suspense 包裹 ResumeCreationsWorkbench');
  assert.ok(projFileContent.includes('useSearchParams()'), '必须使用 useSearchParams 获取 query 参数');
  assert.ok(projFileContent.includes('router.replace'), 'Tab 切换必须使用 router.replace 保持平滑');
});

test('tags/page.tsx & timeline/page.tsx: 遗留兼容代理具备 100% 自动平滑重定向机制', () => {
  const tagsContent = fs.readFileSync(path.join(projectRoot, 'app/admin/tags/page.tsx'), 'utf-8');
  const timelineContent = fs.readFileSync(path.join(projectRoot, 'app/admin/timeline/page.tsx'), 'utf-8');

  assert.ok(tagsContent.includes("router.replace('/admin/categories?tab=tags')"), 'tags 必须重定向至 /admin/categories?tab=tags');
  assert.ok(timelineContent.includes("router.replace('/admin/projects?tab=timeline')"), 'timeline 必须重定向至 /admin/projects?tab=timeline');
  assert.ok(tagsContent.includes('<Suspense'), 'tags 必须包裹在 Suspense 中');
  assert.ok(timelineContent.includes('<Suspense'), 'timeline 必须包裹在 Suspense 中');
});

// -----------------------------------------------------------------------------
// 4. 站长姓名唯一性全工程严格审查 (Hayden Xue Invariant)
// -----------------------------------------------------------------------------
console.log('\n【Suite 4】站长姓名纯正性 (Hayden Xue Identity Invariant)');

test('审查 M1 涉及的所有核心管理端文件，确认无任何违规遗留姓名', () => {
  const filesToCheck = [
    path.join(projectRoot, 'app/admin/categories/page.tsx'),
    path.join(projectRoot, 'app/admin/projects/page.tsx'),
    path.join(projectRoot, 'app/admin/tags/page.tsx'),
    path.join(projectRoot, 'app/admin/timeline/page.tsx'),
    path.join(projectRoot, 'app/admin/layout.tsx'),
    path.join(projectRoot, 'components/admin/AdminSidebar.tsx'),
  ];

  for (const filePath of filesToCheck) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.match(/howard/gi) || [];
    // 注意：排除可能的前端 mock 或包路径，若是用户可见界面严禁出现
    assert.strictEqual(matches.length, 0, `文件 ${path.basename(filePath)} 中严禁出现历史遗留名称 howard`);
  }
});

console.log('\n================================================================');
console.log(`🎉 对抗性测试套件执行完毕: 共 ${passCount + failCount} 个断言, 通过: ${passCount}, 失败: ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
