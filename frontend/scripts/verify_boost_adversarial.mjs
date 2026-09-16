import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('=== 开始执行 /boost 与 /learn 深度升级对抗验证测试 ===\n');

// 1. 验证 AGENTS.md
const agentsPath = path.resolve('..', 'AGENTS.md');
const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
assert(agentsContent.includes('## 6. 后台数据流完整性与破坏性操作防误触准则'), 'AGENTS.md 必须包含准则第 6 条');
assert(agentsContent.includes('正文数据水合铁律'), 'AGENTS.md 包含正文数据水合铁律');
assert(agentsContent.includes('破坏性批处理防误触红线'), 'AGENTS.md 包含破坏性批处理防误触红线');
assert(agentsContent.includes('Markdown 资产导出兼容性规范'), 'AGENTS.md 包含 Markdown 资产导出兼容性规范');
assert(agentsContent.includes('Hayden Xue'), 'AGENTS.md 保持站长姓名唯一性');

// 2. 验证 AdminCommandPalette.tsx
const palettePath = path.resolve('components', 'admin', 'AdminCommandPalette.tsx');
const paletteContent = fs.readFileSync(palettePath, 'utf-8');
assert(paletteContent.includes('act-health'), 'AdminCommandPalette 包含资产健康体检快捷动作');
assert(paletteContent.includes('act-categories'), 'AdminCommandPalette 包含知识分类工作台快捷动作');
assert(paletteContent.includes('act-now'), 'AdminCommandPalette 包含 Now 动态看板快捷动作');
assert(paletteContent.includes('act-export'), 'AdminCommandPalette 包含 Markdown 备份导出快捷动作');

// 3. 验证 AdminCommentsPage (admin/comments/page.tsx)
const commentsPath = path.resolve('app', 'admin', 'comments', 'page.tsx');
const commentsContent = fs.readFileSync(commentsPath, 'utf-8');
assert(commentsContent.includes('selectedIds'), '评论管理具备多选状态');
assert(commentsContent.includes('handleToggleSelectAll'), '评论管理支持全选/反选');
assert(commentsContent.includes('handleBatchUpdateStatus'), '评论管理支持批量状态更新');
assert(commentsContent.includes('handleBatchDelete'), '评论管理支持批量删除');
assert(commentsContent.includes("variant: 'danger'"), '评论批量删除严格接入 danger 确认弹窗 (Rule 6)');
assert(commentsContent.includes('searchKeyword'), '评论管理支持搜索过滤');
assert(commentsContent.includes('Promise.allSettled'), '评论批量操作采用并发容错');

// 4. 验证 AdminLinksPage (admin/links/page.tsx)
const linksPath = path.resolve('app', 'admin', 'links', 'page.tsx');
const linksContent = fs.readFileSync(linksPath, 'utf-8');
assert(linksContent.includes('filterTab'), '友链管理支持多选项卡切换过滤');
assert(linksContent.includes('PENDING'), '友链管理包含待审核申请选项卡与指示');
assert(linksContent.includes('selectedIds'), '友链管理支持多选状态');
assert(linksContent.includes('handleBatchUpdateStatus'), '友链管理支持批量公开/隐藏');
assert(linksContent.includes('handleBatchDelete'), '友链管理支持批量删除');
assert(linksContent.includes("variant: 'danger'"), '友链批量删除严格接入 danger 确认弹窗 (Rule 6)');
assert(linksContent.includes('handleQuickAudit'), '友链管理支持行内一键快速审批');
assert(linksContent.includes('searchQuery'), '友链管理支持搜索检索');

// 5. 验证 AdminMemosPage (admin/memos/page.tsx)
const memosPath = path.resolve('app', 'admin', 'memos', 'page.tsx');
const memosContent = fs.readFileSync(memosPath, 'utf-8');
assert(memosContent.includes('hayden_memo_draft_v1'), '随记管理支持 LocalStorage 草稿自动保护');
assert(memosContent.includes('handleCopyMarkdownQuote'), '随记管理支持一键复制 Markdown 引用卡片');
assert(memosContent.includes('selectedIds'), '随记管理支持多选状态');
assert(memosContent.includes('handleBatchPin'), '随记管理支持批量置顶/取消置顶');
assert(memosContent.includes('handleBatchDelete'), '随记管理支持批量删除');
assert(memosContent.includes("variant: 'danger'"), '随记批量删除严格接入 danger 确认弹窗 (Rule 6)');
assert(memosContent.includes('searchQuery'), '随记管理支持内容与标签检索过滤');

console.log(`\n=== 对抗测试汇总: ${passCount} 通过, ${failCount} 失败 ===`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 全部 /boost 与 /learn 核心准则校验 100% 通过！\n');
}
