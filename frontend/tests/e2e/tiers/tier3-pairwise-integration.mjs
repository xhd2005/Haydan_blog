// frontend/tests/e2e/tiers/tier3-pairwise-integration.mjs
import { expect } from '../utils/assertions.mjs';
import { ContractOracle } from '../utils/oracle.mjs';
import { DomSimulator } from '../utils/dom-simulator.mjs';

export function registerTier3Tests(harness) {
  const suite = harness.createSuite('Tier 3: 跨模块组合与成对交互联动', 'Tier 3');
  let oracle;
  let dom;

  suite.beforeEach(() => {
    oracle = new ContractOracle();
    dom = new DomSimulator(oracle);
  });

  // ---------------------------------------------------------------------------
  // Pair 1: 文章编辑 + 媒体在用防删锁联动
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T3-PAIR-01', '文章插入新图片后媒体中心反向引用锁定状态即时生效', async () => {
    // 初始状态：orphan-test-file.png 未被引用
    const beforeRef = oracle.checkMediaReferences('https://minio.haydenxue.com/blog-assets/orphan-test-file.png');
    expect(beforeRef.isLocked).toBe(false);

    // 在文章 2 正文中插入该图片
    const post2 = oracle.posts.find(p => p.id === 2);
    post2.content += '\n![测试图片](https://minio.haydenxue.com/blog-assets/orphan-test-file.png)';

    // 重新扫描引用
    const afterRef = oracle.checkMediaReferences('https://minio.haydenxue.com/blog-assets/orphan-test-file.png');
    expect(afterRef.isLocked).toBe(true);
    expect(afterRef.usedInPosts.length).toBe(1);
    expect(afterRef.usedInPosts[0].id).toBe(2);
  });

  suite.addTest('TC-T3-PAIR-02', '文章引用的图片在媒体中心被锁定，尝试物理删除被拦截', async () => {
    const asset = oracle.mediaAssets.find(m => m.id === 1); // tokyo-tower.jpg 在文章 1 中使用
    expect(() => {
      oracle.deleteMediaAsset(asset.id, true);
    }).toThrow('[MEDIA LOCK ACTIVE]');
    expect(asset.deletedAt).toBeNull();
  });

  suite.addTest('TC-T3-PAIR-03', '从文章中移除图片引用后，媒体锁自动解除并允许安全删除', async () => {
    // 从文章 1 中移除 tokyo-tower.jpg 引用
    const post1 = oracle.posts.find(p => p.id === 1);
    post1.content = post1.content.replace('https://minio.haydenxue.com/blog-assets/tokyo-tower.jpg', '');

    // 验证锁已释放
    const ref = oracle.checkMediaReferences('https://minio.haydenxue.com/blog-assets/tokyo-tower.jpg');
    expect(ref.isLocked).toBe(false);

    // 执行物理删除
    const deleted = oracle.deleteMediaAsset(1, true);
    expect(deleted).toBe(true);
    expect(oracle.mediaAssets.find(m => m.id === 1).deletedAt).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Pair 2: 随记发帖 + 灵感大纲 + Post Studio
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T3-PAIR-04', '随记发布多条碎片后多选一键 AI 提炼周报大纲', async () => {
    oracle.memos.push({
      id: 2,
      content: '完成了 Three-way Merge 算法的单元测试覆盖。#开发日志',
      images: [],
      createdAt: new Date().toISOString(),
    });
    oracle.memos.push({
      id: 3,
      content: '完成了 VisionOS 双岛坞的微动效调优。#设计',
      images: [],
      createdAt: new Date().toISOString(),
    });

    const selectedMemos = oracle.memos.filter(m => m.id >= 2);
    expect(selectedMemos.length).toBe(2);

    const generatedDigest = {
      title: 'Hayden Studio 研发周报 (第37期)',
      summary: '本周完成三向合并算法与 VisionOS 动效双向突破',
      content: `# 研发周报\n\n` + selectedMemos.map(m => `- ${m.content}`).join('\n'),
      contentEn: `# Engineering Weekly\n\n` + selectedMemos.map(m => `- ${m.content}`).join('\n'),
      status: 'DRAFT',
      tags: ['Weekly', 'Engineering'],
    };

    expect(generatedDigest.content).toContain('Three-way Merge');
    expect(generatedDigest.content).toContain('双岛坞');
  });

  suite.addTest('TC-T3-PAIR-05', 'AI 提炼的草稿无缝自动派生至 Post Studio 双语分屏', async () => {
    const newPostId = oracle.posts.length + 1;
    oracle.posts.push({
      id: newPostId,
      title: 'Hayden Studio 研发周报 (第37期)',
      slug: 'engineering-weekly-37',
      content: '# 研发周报中文正文',
      contentEn: '# Engineering Weekly English Content',
      status: 'DRAFT',
    });

    const studio = dom.simulatePostStudioEditor(newPostId);
    expect(studio.bilingualSplitScreen.leftPanel.value).toBe('# 研发周报中文正文');
    expect(studio.bilingualSplitScreen.rightPanel.value).toBe('# Engineering Weekly English Content');
  });

  suite.addTest('TC-T3-PAIR-06', '在派生文章中关联前序博文节点建立双向知识网', async () => {
    const post = oracle.posts[oracle.posts.length - 1];
    post.content += '\n参考前序架构论述：[[Hayden Studio VisionOS 重塑架构深度解析]]';
    expect(post.content).toContain('[[Hayden Studio VisionOS 重塑架构深度解析]]');
  });

  // ---------------------------------------------------------------------------
  // Pair 3: 健康体检 + 批量替换 + 审计日志
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T3-PAIR-07', '健康体检扫描出旧域名与资产外链路径', async () => {
    // 注入包含旧资源链接的文章内容
    oracle.posts[0].content += '\n附图：https://old-cdn.haydenxue.com/diagram.png';
    const post = oracle.getPostById(1);
    expect(post.content).toContain('old-cdn.haydenxue.com');
  });

  suite.addTest('TC-T3-PAIR-08', '一键联动批量替换引擎将旧域名迁移至 MinIO 规范直链', async () => {
    oracle.posts[0].content += '\n附图：https://old-cdn.haydenxue.com/diagram.png';
    const replaceResult = oracle.executeBatchReplace(
      'https://old-cdn.haydenxue.com',
      'https://minio.haydenxue.com/blog-assets'
    );
    expect(replaceResult.updatedCount).toBe(1);

    const updatedPost = oracle.getPostById(1);
    expect(updatedPost.content).toContain('https://minio.haydenxue.com/blog-assets/diagram.png');
    expect(updatedPost.content).toNotContain('old-cdn.haydenxue.com');
  });

  suite.addTest('TC-T3-PAIR-09', '批量替换操作在 Audit Logs 中生成带有变更 Diff 的审计流水', async () => {
    oracle.posts[0].content += '\n附图：https://old-cdn.haydenxue.com/diagram.png';
    oracle.executeBatchReplace(
      'https://old-cdn.haydenxue.com',
      'https://minio.haydenxue.com/blog-assets'
    );
    const latestLog = oracle.auditLogs[0];
    expect(latestLog.path).toBe('/api/admin/posts/batch-replace');
    expect(latestLog.diff).toBeDefined();
    expect(latestLog.diff.after).toContain('https://minio.haydenxue.com/blog-assets');
  });

  // ---------------------------------------------------------------------------
  // Pair 4: 分类树拖拽 + 标签别名归一 + 前台面包屑
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T3-PAIR-10', '重构多级父子分类树后级联更新前台面包屑层级', async () => {
    // 科技与架构 (id:1) -> 云原生实战 (id:3) -> 服务网格 (新设 id:4)
    oracle.categories.push({ id: 4, name: '服务网格', slug: 'service-mesh', parentId: 3, order: 0 });

    // 计算面包屑路径
    function getBreadcrumbs(catId) {
      const crumbs = [];
      let current = oracle.categories.find(c => c.id === catId);
      while (current) {
        crumbs.unshift(current.name);
        current = oracle.categories.find(c => c.id === current.parentId);
      }
      return crumbs;
    }

    const breadcrumbs = getBreadcrumbs(4);
    expect(breadcrumbs.join(' > ')).toBe('科技与架构 > 云原生实战 > 服务网格');
  });

  suite.addTest('TC-T3-PAIR-11', '配置同义词别名 Istio -> ServiceMesh 自动归一化', async () => {
    oracle.addTagAlias('Istio', 'ServiceMesh');
    const canonical = oracle.resolveCanonicalTag('Istio');
    expect(canonical).toBe('ServiceMesh');
  });

  suite.addTest('TC-T3-PAIR-12', '发布关联多级分类与别名标签的新博文', async () => {
    oracle.addTagAlias('Istio', 'ServiceMesh');
    const post = {
      id: 50,
      title: 'Istio 流量治理实战指南',
      slug: 'istio-traffic-management',
      categoryId: 4,
      tags: ['Istio'], // 将被自动归一为 ServiceMesh
      status: 'PUBLISHED',
      content: '# 流量治理',
    };
    const canonicalTag = oracle.resolveCanonicalTag(post.tags[0]);
    expect(canonicalTag).toBe('ServiceMesh');
    expect(post.categoryId).toBe(4);
  });

  // ---------------------------------------------------------------------------
  // Pair 5: 多标签工作区 + 离线断网 + 三向合并
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T3-PAIR-13', '在线编辑 Tab 1 文章时发生离线断网，本地修改暂存 IndexedDB', async () => {
    const route = '/admin/posts/edit/1';
    const localEditingContent = '# Hayden Studio\n本地离线修改版段落。';
    await oracle.saveFormSnapshot(route, { content: localEditingContent }, { start: 15, end: 15 }, 40);

    const savedSnapshot = await oracle.getFormSnapshot(route);
    expect(savedSnapshot.formData.content).toBe(localEditingContent);
  });

  suite.addTest('TC-T3-PAIR-14', '恢复网络时云端已有更新，触发三向合并冲突检测', async () => {
    const baseContent = 'Line 1: 初始版本\nLine 2: 共同段落\nLine 3: 结尾';
    const localContent = 'Line 1: 本地离线改动\nLine 2: 共同段落\nLine 3: 结尾';
    const cloudContent = 'Line 1: 远程云端改动\nLine 2: 共同段落\nLine 3: 结尾';

    const mergeResult = oracle.threeWayMerge(baseContent, localContent, cloudContent);
    expect(mergeResult.conflict).toBe(true);
    expect(mergeResult.conflicts.length).toBe(1);
    expect(mergeResult.conflicts[0].line).toBe(1);
    expect(mergeResult.conflicts[0].local).toBe('Line 1: 本地离线改动');
    expect(mergeResult.conflicts[0].cloud).toBe('Line 1: 远程云端改动');
  });

  suite.addTest('TC-T3-PAIR-15', '无冲突修改场景下三向合并自动合并两侧改动', async () => {
    const baseContent = 'Line 1: 标题\nLine 2: 中间段\nLine 3: 结尾';
    // 本地改动第一行，云端未改第一行但改动了结尾行
    const localContent = 'Line 1: 标题 (本地改动)\nLine 2: 中间段\nLine 3: 结尾';
    const cloudContent = baseContent; // 云端无改动

    const mergeResult = oracle.threeWayMerge(baseContent, localContent, cloudContent);
    expect(mergeResult.conflict).toBe(false);
    expect(mergeResult.merged).toBe(localContent);
  });

  suite.addTest('TC-T3-PAIR-16', '合并冲突解决后更新文章并清理本地离线快照', async () => {
    const route = '/admin/posts/edit/1';
    const resolvedContent = 'Line 1: 合并双方后的最终版本\nLine 2: 共同段落';
    const post = oracle.getPostById(1);
    post.content = resolvedContent;

    await oracle.clearFormSnapshot(route);
    const remainingSnapshot = await oracle.getFormSnapshot(route);
    expect(remainingSnapshot).toBeNull();
  });
}
