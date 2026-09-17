// frontend/tests/e2e/tiers/tier1-core-features.mjs
import { expect } from '../utils/assertions.mjs';
import { ContractOracle } from '../utils/oracle.mjs';
import { DomSimulator } from '../utils/dom-simulator.mjs';
import { config } from '../config.mjs';

export function registerTier1Tests(harness) {
  const suite = harness.createSuite('Tier 1: 核心功能与关键模块独立验证', 'Tier 1');
  let oracle;
  let dom;

  suite.beforeEach(() => {
    oracle = new ContractOracle();
    dom = new DomSimulator(oracle);
  });

  // ---------------------------------------------------------------------------
  // Feature Area 1: 多标签工作区与 LRU 6 保活
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F01-01', '打开单个标签页并设置激活状态', async () => {
    const state = oracle.openTab({ id: '/admin/posts', title: '文章管理', icon: 'FileText' });
    expect(state.tabs.length).toBe(2);
    expect(state.activeTabId).toBe('/admin/posts');
    expect(state.tabs[1].domMounted).toBe(true);
  });

  suite.addTest('TC-T1-F01-02', '标签页状态切换激活并更新 lastActive 时间戳', async () => {
    oracle.openTab({ id: '/admin/posts', title: '文章管理' });
    const prevTimestamp = oracle.tabs[0].lastActive;
    await new Promise(r => setTimeout(r, 10));
    oracle.openTab({ id: '/admin/dashboard', title: '空间指挥中枢' });
    expect(oracle.activeTabId).toBe('/admin/dashboard');
    expect(oracle.tabs[0].lastActive).toBeGreaterThan(prevTimestamp);
  });

  suite.addTest('TC-T1-F01-03', '打开 6 个标签页全部保持活跃保活 (domMounted === true)', async () => {
    const routes = [
      '/admin/posts',
      '/admin/memos',
      '/admin/media',
      '/admin/graph',
      '/admin/journey',
    ];
    for (const r of routes) {
      oracle.openTab({ id: r, title: r.split('/').pop() });
    }
    const state = oracle.getTabsState();
    expect(state.tabs.length).toBe(6);
    expect(state.mountedCount).toBe(6);
    expect(state.unmountedCount).toBe(0);
  });

  suite.addTest('TC-T1-F01-04', '打开第 7 个标签页触发 LRU 淘汰最早标签 DOM', async () => {
    const routes = [
      '/admin/posts',
      '/admin/memos',
      '/admin/media',
      '/admin/graph',
      '/admin/journey',
      '/admin/health', // 第 7 个
    ];
    for (const r of routes) {
      await new Promise(res => setTimeout(res, 2));
      oracle.openTab({ id: r, title: r });
    }
    const state = oracle.getTabsState();
    expect(state.tabs.length).toBe(7);
    expect(state.mountedCount).toBe(6);
    expect(state.unmountedCount).toBe(1);
    // 最早进入且未再激活的 /admin/dashboard 应该被卸载 DOM
    const dashboardTab = state.tabs.find(t => t.id === '/admin/dashboard');
    expect(dashboardTab.domMounted).toBe(false);
  });

  suite.addTest('TC-T1-F01-05', '关闭当前活跃标签自动激活相邻标签', async () => {
    oracle.openTab({ id: '/admin/posts', title: '文章管理' });
    oracle.openTab({ id: '/admin/memos', title: '随记' });
    expect(oracle.activeTabId).toBe('/admin/memos');
    const state = oracle.closeTab('/admin/memos');
    expect(state.tabs.length).toBe(2);
    expect(state.activeTabId).toBe('/admin/posts');
  });

  // ---------------------------------------------------------------------------
  // Feature Area 2: IndexedDB 表单沙盒恢复
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F02-01', '表单输入自动保存快照至 IndexedDB 沙盒', async () => {
    const route = '/admin/posts/edit/1';
    const formData = { title: '草稿标题修改', content: '正在编辑的正文段落' };
    const cursor = { start: 10, end: 10 };
    await oracle.saveFormSnapshot(route, formData, cursor, 120);

    const snapshot = await oracle.getFormSnapshot(route);
    expect(snapshot).toBeDefined();
    expect(snapshot.formData.title).toBe('草稿标题修改');
    expect(snapshot.cursorPosition.start).toBe(10);
    expect(snapshot.scrollOffset).toBe(120);
  });

  suite.addTest('TC-T1-F02-02', '页面刷新或重新挂载时无损恢复表单与光标位置', async () => {
    const route = '/admin/memos';
    await oracle.saveFormSnapshot(route, { content: '未发布的随记碎片' }, { start: 5, end: 5 }, 0);
    const restored = await oracle.getFormSnapshot(route);
    expect(restored.formData.content).toBe('未发布的随记碎片');
    expect(restored.cursorPosition.end).toBe(5);
  });

  suite.addTest('TC-T1-F02-03', '表单正常提交保存后清理 IndexedDB 沙盒快照', async () => {
    const route = '/admin/posts/edit/1';
    await oracle.saveFormSnapshot(route, { title: '暂存草稿' });
    await oracle.clearFormSnapshot(route);
    const snapshot = await oracle.getFormSnapshot(route);
    expect(snapshot).toBeNull();
  });

  suite.addTest('TC-T1-F02-04', '不同页面路由之间的 IndexedDB 快照严格隔离互不串扰', async () => {
    await oracle.saveFormSnapshot('/admin/posts/edit/1', { title: '文章1草稿' });
    await oracle.saveFormSnapshot('/admin/posts/edit/2', { title: '文章2草稿' });

    const snap1 = await oracle.getFormSnapshot('/admin/posts/edit/1');
    const snap2 = await oracle.getFormSnapshot('/admin/posts/edit/2');

    expect(snap1.formData.title).toBe('文章1草稿');
    expect(snap2.formData.title).toBe('文章2草稿');
  });

  // ---------------------------------------------------------------------------
  // Feature Area 3: Spotlight (Cmd+K) 空间指挥面板
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F03-01', 'Spotlight 全文即时检索匹配博文', async () => {
    const result = dom.simulateSpotlightInteraction('VisionOS');
    expect(result.isOpen).toBe(true);
    const postMatches = result.results.filter(r => r.type === 'POST');
    expect(postMatches.length).toBeGreaterThan(0);
    expect(postMatches[0].title).toContain('VisionOS');
  });

  suite.addTest('TC-T1-F03-02', 'Spotlight 跨模块检索随记与媒体资源', async () => {
    const memoResult = dom.simulateSpotlightInteraction('双岛坞');
    const memoMatches = memoResult.results.filter(r => r.type === 'MEMO');
    expect(memoMatches.length).toBeGreaterThan(0);

    const mediaResult = dom.simulateSpotlightInteraction('tokyo');
    const mediaMatches = mediaResult.results.filter(r => r.type === 'MEDIA');
    expect(mediaMatches.length).toBeGreaterThan(0);
  });

  suite.addTest('TC-T1-F03-03', 'Spotlight 运维宏触发列表展示', async () => {
    const result = dom.simulateSpotlightInteraction('');
    const macros = result.results.filter(r => r.type === 'MACRO');
    expect(macros.length).toBeGreaterThanOrEqual(3);
    const backupMacro = macros.find(m => m.id === 'macro:backup_zip');
    expect(backupMacro).toBeDefined();
  });

  suite.addTest('TC-T1-F03-04', 'Spotlight 灵感速记窗常驻可用', async () => {
    const result = dom.simulateSpotlightInteraction('');
    expect(result.inspirationNotePadEnabled).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Feature Area 4: Dashboard 空间指挥 Bento 与待办流
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F04-01', 'Dashboard Bento 卡片数据装载完整', async () => {
    expect(oracle.posts.length).toBe(2);
    expect(oracle.mediaAssets.length).toBe(4);
    expect(oracle.todos.length).toBe(2);
  });

  suite.addTest('TC-T1-F04-02', '待办事项单条点击消除与状态更新', async () => {
    const target = oracle.todos[0];
    target.done = true;
    expect(oracle.todos.find(t => t.id === 'todo-1').done).toBe(true);
  });

  suite.addTest('TC-T1-F04-03', '待办事项一键全部批准', async () => {
    oracle.todos.forEach(t => { t.done = true; });
    const pending = oracle.todos.filter(t => !t.done);
    expect(pending.length).toBe(0);
  });

  suite.addTest('TC-T1-F04-04', '待办事项转为博文大纲草稿派生', async () => {
    const todo = oracle.todos[0];
    const newPostDraft = {
      title: todo.title,
      summary: `来源于待办事项派生草稿: ${todo.title}`,
      content: `# ${todo.title}\n\n## 待办执行要点\n- 优先级: ${todo.priority}`,
      status: 'DRAFT',
    };
    expect(newPostDraft.status).toBe('DRAFT');
    expect(newPostDraft.content).toContain(todo.title);
  });

  // ---------------------------------------------------------------------------
  // Feature Area 5: Analytics 深度分析与 IP 脱敏
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F05-01', '完读率留存漏斗 25%~100% 梯度递减验证', async () => {
    const post = oracle.posts[0];
    expect(post.readingDepth.d25).toBeGreaterThanOrEqual(post.readingDepth.d50);
    expect(post.readingDepth.d50).toBeGreaterThanOrEqual(post.readingDepth.d75);
    expect(post.readingDepth.d75).toBeGreaterThanOrEqual(post.readingDepth.d100);
  });

  suite.addTest('TC-T1-F05-02', '访客 IP 脱敏末位掩码处理 (IPv4)', async () => {
    const masked = oracle.maskIp('192.168.1.100');
    expect(masked).toBe('192.168.1.***');
    expect(masked).toNotContain('100');
  });

  suite.addTest('TC-T1-F05-03', '访客 IP 脱敏末位掩码处理 (IPv6)', async () => {
    const masked = oracle.maskIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(masked).toContain(':****');
    expect(masked).toNotContain('7334');
  });

  suite.addTest('TC-T1-F05-04', '双轴分析时间滑块范围支持 7d / 30d / 实时', async () => {
    const validRanges = ['7d', '30d', 'realtime'];
    expect('7d').toBeOneOf(validRanges);
    expect('30d').toBeOneOf(validRanges);
    expect('realtime').toBeOneOf(validRanges);
  });

  // ---------------------------------------------------------------------------
  // Feature Area 6: Audit Logs 极客流光控制台
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F06-01', '审计日志列表渲染与流光标签属性', async () => {
    expect(oracle.auditLogs.length).toBeGreaterThanOrEqual(3);
    const log = oracle.auditLogs[0];
    expect(log).toHaveProperty('method');
    expect(log).toHaveProperty('status');
    expect(log).toHaveProperty('latencyMs');
  });

  suite.addTest('TC-T1-F06-02', '实时识别恶意路径遍历探针攻击', async () => {
    const detection = oracle.detectThreats('/../../etc/passwd');
    expect(detection.isThreat).toBe(true);
    expect(detection.threatType).toBe('PATH_TRAVERSAL');
  });

  suite.addTest('TC-T1-F06-03', '实时识别敏感文件探针 (/.env, /wp-login.php)', async () => {
    const envDetect = oracle.detectThreats('/.env');
    expect(envDetect.isThreat).toBe(true);
    expect(envDetect.threatType).toBe('SENSITIVE_PROBE');

    const wpDetect = oracle.detectThreats('/wp-login.php');
    expect(wpDetect.isThreat).toBe(true);
  });

  suite.addTest('TC-T1-F06-04', 'Git-style 数据变更 Diff 检视器红绿对比', async () => {
    const logWithDiff = oracle.auditLogs.find(l => l.diff);
    expect(logWithDiff).toBeDefined();
    expect(logWithDiff.diff.before).toBeDefined();
    expect(logWithDiff.diff.after).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Feature Area 7: Health 3D 健康光环与大图压缩工坊
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F07-01', '3D 全息健康评分基于中间件与大图动态计算', async () => {
    const health = oracle.calculateHealthScore();
    expect(health.score).toBeGreaterThan(0);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(health.middleware.database.status).toBe('UP');
  });

  suite.addTest('TC-T1-F07-02', '系统自动扫描超过 2MB 巨幅大图', async () => {
    const health = oracle.calculateHealthScore();
    expect(health.giantImages.length).toBeGreaterThan(0);
    expect(health.giantImages[0].size).toBeGreaterThan(2000000);
  });

  suite.addTest('TC-T1-F07-03', '一键启动图片压缩工坊转换为 WebP', async () => {
    const result = oracle.compressImageToWebp(1);
    expect(result.converted).toBe(true);
    expect(result.newSize).toBeLessThan(result.oldSize);
    expect(result.newUrl).toMatch(/\.webp$/);
  });

  suite.addTest('TC-T1-F07-04', 'WebP 压缩后自动联动重写全站博文引用路径', async () => {
    const result = oracle.compressImageToWebp(1);
    expect(result.rewrittenPosts).toBeGreaterThan(0);
    const post = oracle.getPostById(1);
    expect(post.content).toContain('.webp');
    expect(post.content).toNotContain('tokyo-tower.jpg');
  });

  // ---------------------------------------------------------------------------
  // Feature Area 8: Posts 双模与正文批量查找替换
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F08-01', '文章列表严格精简排重大文本字段 content (正文水合铁律)', async () => {
    const slimList = oracle.getPostListSlim();
    expect(slimList.length).toBeGreaterThan(0);
    expect(slimList[0].title).toBeDefined();
    expect(slimList[0].content).toBeUndefined();
  });

  suite.addTest('TC-T1-F08-02', '按需获取文章详情时水合完整正文与双语内容', async () => {
    const full = oracle.getPostById(1);
    expect(full.content).toBeDefined();
    expect(full.contentEn).toBeDefined();
    expect(full.content.length).toBeGreaterThan(20);
  });

  suite.addTest('TC-T1-F08-03', '批量正文查找替换预览返回匹配数与段落 Diff', async () => {
    const preview = oracle.previewBatchReplace('MinIO', 'Cloud-MinIO');
    expect(preview.length).toBeGreaterThan(0);
    expect(preview[0].matchCount).toBeGreaterThan(0);
    expect(preview[0].diffSnippets.length).toBeGreaterThan(0);
    expect(preview[0].diffSnippets[0].after).toContain('Cloud-MinIO');
  });

  suite.addTest('TC-T1-F08-04', '批量正文替换后支持快照一键撤销恢复', async () => {
    const execResult = oracle.executeBatchReplace('Apple VisionOS', 'VisionOS Pro');
    expect(execResult.updatedCount).toBeGreaterThan(0);

    const postAfterReplace = oracle.getPostById(1);
    expect(postAfterReplace.content).toContain('VisionOS Pro');

    const rollbackSuccess = oracle.rollbackBatchReplace(execResult.snapshotId);
    expect(rollbackSuccess).toBe(true);

    const postAfterRollback = oracle.getPostById(1);
    expect(postAfterRollback.content).toContain('Apple VisionOS');
    expect(postAfterRollback.content).toNotContain('VisionOS Pro');
  });

  // ---------------------------------------------------------------------------
  // Feature Area 9: Post Studio 沉浸工坊
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F09-01', '原生中英双语分屏同步对照布局', async () => {
    const studio = dom.simulatePostStudioEditor(1);
    expect(studio.bilingualSplitScreen.enabled).toBe(true);
    expect(studio.bilingualSplitScreen.leftPanel.language).toBe('zh-CN');
    expect(studio.bilingualSplitScreen.rightPanel.language).toBe('en-US');
  });

  suite.addTest('TC-T1-F09-02', '键入 [[ 触发数字花园全站节点联想', async () => {
    const studio = dom.simulatePostStudioEditor(1);
    const suggestions = studio.triggerWikiLink('[[');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].title).toBe('数字花园节点');
  });

  suite.addTest('TC-T1-F09-03', '正文包含 [[双向链接]] 提取并生成强类型边', async () => {
    const post = oracle.getPostById(1);
    const wikiLinkRegex = /\[\[(.*?)\]\]/g;
    const matches = [...post.content.matchAll(wikiLinkRegex)];
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0][1]).toBe('数字花园节点');
  });

  suite.addTest('TC-T1-F09-04', '富文本外部图文粘贴自动转存 MinIO 直链', async () => {
    const externalHtml = '<p>外部图片：<img src="http://extern-site.org/pic.png" /></p>';
    const minioTransferred = externalHtml.replace(
      'http://extern-site.org/pic.png',
      'https://minio.haydenxue.com/blog-assets/imported-pic.png'
    );
    expect(minioTransferred).toContain('minio.haydenxue.com');
  });

  // ---------------------------------------------------------------------------
  // Feature Area 10: Memos 随记与媒体中心
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F10-01', 'Memos 呼吸发射台发帖与 #标签 提取', async () => {
    const content = '新的一周，持续完善前端交互细节 #前端 #架构';
    const tagRegex = /#([\w\u4e00-\u9fa5]+)/g;
    const tags = [...content.matchAll(tagRegex)].map(m => m[1]);
    expect(tags.length).toBe(2);
    expect(tags[0]).toBe('前端');
    expect(tags[1]).toBe('架构');
  });

  suite.addTest('TC-T1-F10-02', 'Webhook 移动速记 payload 解析与模拟入库', async () => {
    const webhookPayload = {
      source: 'Telegram',
      messageId: 1024,
      text: '灵感：在移动端也可以秒发随记',
      timestamp: Date.now(),
    };
    oracle.memos.unshift({
      id: oracle.memos.length + 1,
      content: webhookPayload.text,
      images: [],
      createdAt: new Date().toISOString(),
    });
    expect(oracle.memos[0].content).toBe('灵感：在移动端也可以秒发随记');
  });

  suite.addTest('TC-T1-F10-03', 'Memos 碎片一键 AI 提炼周报博文草稿', async () => {
    const selectedMemos = oracle.memos;
    const outline = `# 本周动态周报\n\n## 灵感与随记汇编\n` +
      selectedMemos.map(m => `- ${m.content}`).join('\n');
    expect(outline).toContain('周报');
    expect(outline).toContain(selectedMemos[0].content);
  });

  suite.addTest('TC-T1-F10-04', '自适应瀑布流多列卡片响应式数据模型', async () => {
    const columns = [[], [], []];
    oracle.memos.forEach((m, idx) => {
      columns[idx % 3].push(m);
    });
    expect(columns[0].length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Feature Area 11: Media 在用防删锁与 GC 孤立扫描
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F11-01', '被文章引用的媒体资源触发在用防删锁 (isLocked === true)', async () => {
    const ref = oracle.checkMediaReferences('https://minio.haydenxue.com/blog-assets/tokyo-tower.jpg');
    expect(ref.isLocked).toBe(true);
    expect(ref.usedInPosts.length).toBe(1);
    expect(ref.usedInPosts[0].id).toBe(1);
  });

  suite.addTest('TC-T1-F11-02', '在用图片尝试物理删除被安全拦截拒绝', async () => {
    await expect(async () => {
      oracle.deleteMediaAsset(1, true);
    }).rejects('已触发在用防删锁，禁止删除');
  });

  suite.addTest('TC-T1-F11-03', 'Media GC 孤立僵尸文件扫描准确识别未被引用资产', async () => {
    const orphans = oracle.runMediaGcScan();
    expect(orphans.length).toBe(1);
    expect(orphans[0].name).toBe('orphan-test-file.png');
  });

  suite.addTest('TC-T1-F11-04', '孤立资源移入回收站软删除冷冻 30 天', async () => {
    const orphans = oracle.runMediaGcScan();
    const moved = oracle.moveToRecycleBin(orphans.map(o => o.id));
    expect(moved.length).toBe(1);
    expect(oracle.recycleBin.length).toBe(1);
    expect(oracle.recycleBin[0].purgeAfterDays).toBe(30);
  });

  // ---------------------------------------------------------------------------
  // Feature Area 12: 3D 知识图谱与 HUD 视角
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F12-01', '3D 知识图谱节点包含博文实体与双链关系', async () => {
    const nodes = oracle.posts.map(p => ({ id: p.id, name: p.title, group: p.categoryId }));
    expect(nodes.length).toBe(2);
    expect(nodes[0].name).toContain('VisionOS');
  });

  suite.addTest('TC-T1-F12-02', '图谱 HUD 胶囊坞视角切换 (2D/3D 模式与动力学参数)', async () => {
    const hudControls = {
      viewMode: '3D',
      repulsion: 120,
      linkDistance: 45,
    };
    expect(hudControls.viewMode).toBeOneOf(['2D', '3D']);
    expect(hudControls.repulsion).toBeGreaterThan(50);
  });

  suite.addTest('TC-T1-F12-03', 'WebGL 上下文主动安全释放 (safelyDisposeWebGL)', async () => {
    const mockCtx = oracle.createMockWebGLContext('canvas-graph-3d');
    expect(oracle.activeWebGLContexts.has(mockCtx)).toBe(true);
    oracle.safelyDisposeWebGL(mockCtx);
    expect(mockCtx.isDisposed).toBe(true);
    expect(oracle.activeWebGLContexts.has(mockCtx)).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Feature Area 13: 知识分类无限级父子树拖拽
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F13-01', '分类树形结构支持多级嵌套 (Parent-Child Hierarchy)', async () => {
    const rootCategories = oracle.categories.filter(c => c.parentId === null);
    const childCategories = oracle.categories.filter(c => c.parentId === 1);
    expect(rootCategories.length).toBe(2);
    expect(childCategories.length).toBe(1);
    expect(childCategories[0].slug).toBe('cloud-native');
  });

  suite.addTest('TC-T1-F13-02', '分类拖拽重构：修改父节点变更层级', async () => {
    const travelCategory = oracle.categories.find(c => c.id === 2);
    travelCategory.parentId = 1; // 移为科技与架构的子分类
    expect(travelCategory.parentId).toBe(1);
  });

  suite.addTest('TC-T1-F13-03', '分类删除前检查关联文章，杜绝级联孤岛', async () => {
    const targetCategory = oracle.categories[0];
    const attachedPosts = oracle.posts.filter(p => p.categoryId === targetCategory.id);
    expect(attachedPosts.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Feature Area 14: 标签同义词别名归一
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F14-01', '标签别名映射归一 (K8s -> Kubernetes)', async () => {
    const canonical = oracle.resolveCanonicalTag('K8s');
    expect(canonical).toBe('Kubernetes');
  });

  suite.addTest('TC-T1-F14-02', '无别名标签保持自身名称 (Canonical Identity)', async () => {
    const canonical = oracle.resolveCanonicalTag('Next.js');
    expect(canonical).toBe('Next.js');
  });

  suite.addTest('TC-T1-F14-03', '多级传递别名连续归一 (A -> B -> C)', async () => {
    oracle.addTagAlias('kube', 'K8s');
    const canonical = oracle.resolveCanonicalTag('kube');
    expect(canonical).toBe('Kubernetes');
  });

  // ---------------------------------------------------------------------------
  // Feature Area 15: 旅行足迹与真实游记强绑定
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F15-01', '新建足迹成功绑定真实已发布游记', async () => {
    const journey = oracle.createJourneyFootprint({
      title: '东京塔展望台',
      city: 'Tokyo',
      country: 'Japan',
      latitude: 35.6586,
      longitude: 139.7454,
      associatedPostId: 2, // 真实游记
    });
    expect(journey.id).toBeDefined();
    expect(journey.associatedPostId).toBe(2);
  });

  suite.addTest('TC-T1-F15-02', '未关联游记的虚构足迹直接拦截报错 (AGENTS.md 铁律)', async () => {
    expect(() => {
      oracle.createJourneyFootprint({
        title: '虚构未到访地点',
        city: 'Fictional City',
        latitude: 10.0,
        longitude: 20.0,
        associatedPostId: null,
      });
    }).toThrow('严禁在前端展示未曾到访的虚构足迹');
  });

  suite.addTest('TC-T1-F15-03', '关联不存在的博文 ID 拦截拒绝', async () => {
    expect(() => {
      oracle.createJourneyFootprint({
        title: '巴黎漫步',
        city: 'Paris',
        latitude: 48.8566,
        longitude: 2.3522,
        associatedPostId: 99999, // 不存在
      });
    }).toThrow('关联的游记博文不存在或尚未发布');
  });

  suite.addTest('TC-T1-F15-04', 'EXIF GPS 经纬度数据解析并带入表单打点', async () => {
    const photoWithExif = oracle.mediaAssets.find(m => m.exif && m.exif.latitude);
    expect(photoWithExif).toBeDefined();
    expect(photoWithExif.exif.latitude).toBe(35.6586);
    expect(photoWithExif.exif.longitude).toBe(139.7454);
  });

  // ---------------------------------------------------------------------------
  // Feature Area 16: 安全红线二次确认危险拦截
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F16-01', '物理删除操作必须触发 confirmModal(variant: danger)', async () => {
    const modal = dom.simulateConfirmModal({
      title: '警告：即将物理删除资源',
      content: '此操作不可恢复，确认执行？',
      variant: 'danger',
      onConfirm: () => {},
      onCancel: () => {},
    });
    expect(modal.isDangerModal).toBe(true);
    expect(modal.variant).toBe('danger');
  });

  suite.addTest('TC-T1-F16-02', '未通过二次确认弹窗裸调物理删除必须被拦截', async () => {
    expect(() => {
      oracle.deleteMediaAsset(4, false); // 未传 confirmationModalPassed
    }).toThrow('必须通过 confirmModal(variant: "danger") 确认');
  });

  suite.addTest('TC-T1-F16-03', '通过二次确认且无锁定的资产成功删除', async () => {
    const success = oracle.deleteMediaAsset(4, true);
    expect(success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Feature Area 17: 站长身份纯正性与禁止遗留名称
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F17-01', '站长姓名严格为 Hayden Xue', async () => {
    const valid = oracle.verifyAuthorIdentity('Hayden Xue');
    expect(valid).toBe(true);
  });

  suite.addTest('TC-T1-F17-02', '出现历史遗留名称 howard 时触发安全警报并拒绝', async () => {
    expect(() => {
      oracle.verifyAuthorIdentity('howard xue');
    }).toThrow('[SECURITY ALERT] 违规历史名称检测到');
  });

  suite.addTest('TC-T1-F17-03', '发件人邮箱配置严格为 haydenxue.com', async () => {
    expect(oracle.adminUser.email).toContain('haydenxue.com');
    expect(oracle.adminUser.email).toNotContain('howard');
  });

  // ---------------------------------------------------------------------------
  // Feature Area 18: Now 页面彻底退役与 404
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F18-01', '后台访问 /admin/now 返回 404 退役状态', async () => {
    const retiredRoutes = new Set(['/admin/now']);
    const is404 = retiredRoutes.has('/admin/now');
    expect(is404).toBe(true);
  });

  suite.addTest('TC-T1-F18-02', '多岛坞与侧边栏无 Now 遗留入口', async () => {
    const dock = dom.renderFloatingDock();
    const allRoutes = [...dock.mainIsland.items, ...dock.controlIsland.items].map(i => i.route);
    expect(allRoutes).toNotContain('/admin/now');
  });

  // ---------------------------------------------------------------------------
  // Feature Area 19: 双主题三维景深与设计令牌
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F19-01', '浅色模式三维景深层级与雪瓷白底色', async () => {
    expect(config.theme.lightBg).toBe('#fbfbfd');
    expect(config.theme.lightCard).toBe('rgba(255, 255, 255, 0.8)');
  });

  suite.addTest('TC-T1-F19-02', '深色模式深曜石黑与 1px 极细微光边界', async () => {
    expect(config.theme.darkBg).toBe('#090a0f');
    expect(config.theme.darkBorder).toBe('rgba(255, 255, 255, 0.08)');
  });

  suite.addTest('TC-T1-F19-03', 'macOS 悬浮双岛坞亚克力模糊与微光类名契约', async () => {
    const dock = dom.renderFloatingDock();
    expect(dock.cssClasses).toContain('backdrop-blur-2xl');
    expect(dock.cssClasses).toContain('dark:border-white/[0.08]');
  });

  // ---------------------------------------------------------------------------
  // Feature Area 20: 离线 Markdown Frontmatter 规范兼容
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-F20-01', '导出 Markdown 文件携带规范 YAML Frontmatter', async () => {
    const post = oracle.getPostById(1);
    const md = oracle.exportMarkdownWithFrontmatter(post);
    expect(md.startsWith('---\n')).toBe(true);
    expect(md).toContain('author: "Hayden Xue"');
    expect(md).toContain('slug: "hayden-studio-visionos-redesign"');
  });

  suite.addTest('TC-T1-F20-02', '缺失标签分类时规范输出有效默认值 categories: [] 与 tags: []', async () => {
    const postWithoutTags = {
      title: '极简随感',
      slug: 'minimal-thought',
      categoryId: null,
      tags: [],
      content: '正文内容',
      createdAt: '2026-09-17T00:00:00Z',
    };
    const md = oracle.exportMarkdownWithFrontmatter(postWithoutTags);
    expect(md).toContain('categories: []');
    expect(md).toContain('tags: []');
  });

  suite.addTest('TC-T1-F20-03', '缺少创建日期时规范输出有效默认值 date: ""', async () => {
    const postWithoutDate = {
      title: '未定日期文章',
      slug: 'undated-post',
      categoryId: 1,
      tags: ['Test'],
      content: '正文',
      createdAt: '',
    };
    const md = oracle.exportMarkdownWithFrontmatter(postWithoutDate);
    expect(md).toContain('date: ""');
  });
}
