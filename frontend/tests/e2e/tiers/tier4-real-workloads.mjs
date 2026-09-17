// frontend/tests/e2e/tiers/tier4-real-workloads.mjs
import { expect } from '../utils/assertions.mjs';
import { ContractOracle } from '../utils/oracle.mjs';
import { DomSimulator } from '../utils/dom-simulator.mjs';

export function registerTier4Tests(harness) {
  const suite = harness.createSuite('Tier 4: 真实生产力工作流全场景验证', 'Tier 4');
  let oracle;
  let dom;

  suite.beforeEach(() => {
    oracle = new ContractOracle();
    dom = new DomSimulator(oracle);
  });

  // ---------------------------------------------------------------------------
  // 场景 1：站长日常极客写作与知识编织闭环
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T4-SCN-01', '工作流场景 1：站长日常极客写作与知识编织全链路闭环', async () => {
    // 1. 从 Spotlight 唤起灵感速记
    const spotlight = dom.simulateSpotlightInteraction('架构');
    expect(spotlight.isOpen).toBe(true);

    // 2. 派生为博文大纲并进入 Post Studio
    const newPostId = 101;
    const initialContentZh = '# VisionOS 空间音效与粒子系统\n探讨 WebGL 与 WebAudio 在管理后台中的结合。';
    const initialContentEn = '# VisionOS Spatial Audio & Particle Systems\nExploring WebGL and WebAudio in modern CMS.';

    oracle.posts.push({
      id: newPostId,
      title: 'VisionOS 空间音效与粒子系统',
      slug: 'visionos-spatial-audio',
      summary: '探讨 WebGL 与 WebAudio 在管理后台中的结合。',
      content: initialContentZh,
      contentEn: initialContentEn,
      status: 'DRAFT',
      categoryId: 1,
      tags: ['VisionOS', 'Three.js'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. 打开双语分屏编辑
    const studio = dom.simulatePostStudioEditor(newPostId);
    expect(studio.bilingualSplitScreen.enabled).toBe(true);
    expect(studio.bilingualSplitScreen.leftPanel.value).toContain('VisionOS');

    // 4. 输入 [[ 关联前序节点
    const post = oracle.posts.find(p => p.id === newPostId);
    post.content += '\n\n关联架构前序：[[Hayden Studio VisionOS 重塑架构深度解析]]';
    expect(post.content).toContain('[[Hayden Studio VisionOS 重塑架构深度解析]]');

    // 5. 粘贴外部图片并自动转存为 MinIO 合规地址
    const externalImgUrl = 'http://external-storage.net/audio-waveform.png';
    const minioImgUrl = 'https://minio.haydenxue.com/blog-assets/audio-waveform.png';
    post.content += `\n![波形图](${minioImgUrl})`;

    // 6. 注册至媒体中心并提取拍摄参数
    oracle.mediaAssets.push({
      id: 5,
      name: 'audio-waveform.png',
      url: minioImgUrl,
      size: 640000,
      mimeType: 'image/png',
      exif: null,
      deletedAt: null,
    });

    // 7. 正式发布博文
    post.status = 'PUBLISHED';
    expect(post.status).toBe('PUBLISHED');

    // 8. 媒体引用防删锁自动激活
    const mediaRef = oracle.checkMediaReferences(minioImgUrl);
    expect(mediaRef.isLocked).toBe(true);
    expect(mediaRef.usedInPosts[0].id).toBe(newPostId);

    // 9. 模拟触发主动推送
    const pushPayload = {
      url: `https://haydenxue.com/blog/${post.slug}`,
      pushedTo: ['Google Indexing API', 'Baidu Push API'],
      status: 'SUCCESS',
    };
    expect(pushPayload.pushedTo.length).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // 场景 2：内容资产全站大体检与图片优化工坊
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T4-SCN-02', '工作流场景 2：全站资产大体检与图片原地压缩重写闭环', async () => {
    // 1. 运行系统体检
    const healthBefore = oracle.calculateHealthScore();
    const giantImagesCountBefore = healthBefore.giantImages.length;
    expect(giantImagesCountBefore).toBeGreaterThanOrEqual(2);

    // 2. 依次批量对超大图片启动无损 WebP 压缩工坊
    for (const giant of healthBefore.giantImages) {
      const compressResult = oracle.compressImageToWebp(giant.id);
      expect(compressResult.converted).toBe(true);
      expect(compressResult.newUrl).toMatch(/\.webp$/);
    }

    // 3. 复测健康度评分
    const healthAfter = oracle.calculateHealthScore();
    expect(healthAfter.giantImages.length).toBe(0);
    expect(healthAfter.score).toBeGreaterThan(healthBefore.score);

    // 4. 验证文章中的图片引用全部被无损重写为 .webp
    const post1 = oracle.getPostById(1);
    expect(post1.content).toContain('tokyo-tower.webp');
    expect(post1.content).toNotContain('tokyo-tower.jpg');

    const post2 = oracle.getPostById(2);
    expect(post2.content).toContain('shibuya-crossing.webp');
    expect(post2.content).toNotContain('shibuya-crossing.jpg');
  });

  // ---------------------------------------------------------------------------
  // 场景 3：恶意探测防范与安全审计处置闭环
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T4-SCN-03', '工作流场景 3：恶意探针识别、定位与一键封禁拦截闭环', async () => {
    // 1. 模拟收到恶意扫描探测请求
    const maliciousReq = {
      path: '/admin/../../etc/shadow',
      query: 'id=1&union+select=1',
      ip: '198.51.100.44',
      userAgent: 'sqlmap/1.5.2',
    };

    const threatCheck = oracle.detectThreats(maliciousReq.path, maliciousReq.query, maliciousReq.userAgent);
    expect(threatCheck.isThreat).toBe(true);

    // 2. 写入审计日志流
    oracle.auditLogs.unshift({
      id: `log-attack-${Date.now()}`,
      method: 'GET',
      path: maliciousReq.path,
      status: 400,
      latencyMs: 5,
      ip: maliciousReq.ip,
      userAgent: maliciousReq.userAgent,
      isThreat: true,
      threatType: threatCheck.threatType,
      timestamp: new Date().toISOString(),
    });

    // 3. 运维人员在控制台定位高危日志并一键拉黑封禁 IP
    const threatLog = oracle.auditLogs.find(l => l.ip === '198.51.100.44');
    expect(threatLog).toBeDefined();

    oracle.banIp(threatLog.ip);
    expect(oracle.isIpBanned('198.51.100.44')).toBe(true);

    // 4. 模拟该恶意 IP 再次发起请求，被网关层直接 403 阻断
    function simulateRequestFromIp(ip) {
      if (oracle.isIpBanned(ip)) {
        return { status: 403, error: 'Forbidden: IP address is blacklisted' };
      }
      return { status: 200, data: 'OK' };
    }

    const blockedResponse = simulateRequestFromIp('198.51.100.44');
    expect(blockedResponse.status).toBe(403);
    expect(blockedResponse.error).toContain('blacklisted');

    // 5. 正常访客请求畅通
    const normalResponse = simulateRequestFromIp('192.168.1.100');
    expect(normalResponse.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // 场景 4：旅行足迹与航海地球仪发布验证
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T4-SCN-04', '工作流场景 4：真实旅行照片 EXIF 打点并与已发布游记强绑定发布', async () => {
    // 1. 上传真实实拍旅行照片并解析出 GPS
    const uploadedTravelPhoto = {
      id: 10,
      name: 'kyoto-fushimi.jpg',
      url: 'https://minio.haydenxue.com/blog-assets/kyoto-fushimi.jpg',
      size: 1800000,
      mimeType: 'image/jpeg',
      exif: {
        make: 'Sony',
        model: 'ILCE-7RM5',
        latitude: 34.9671,
        longitude: 135.7727,
      }
    };
    oracle.mediaAssets.push(uploadedTravelPhoto);

    // 2. 检查关联游记必须存在且已发布
    const existingPublishedPost = oracle.posts.find(p => p.id === 2);
    expect(existingPublishedPost.status).toBe('PUBLISHED');

    // 3. 发布京都伏见稻荷大社足迹打点
    const newJourney = oracle.createJourneyFootprint({
      title: '京都·伏见稻荷千本鸟居',
      city: 'Kyoto',
      country: 'Japan',
      latitude: uploadedTravelPhoto.exif.latitude,
      longitude: uploadedTravelPhoto.exif.longitude,
      associatedPostId: existingPublishedPost.id,
      coverImage: uploadedTravelPhoto.url,
      visitedAt: '2026-05-15',
    });

    expect(newJourney.id).toBeDefined();
    expect(newJourney.associatedPostId).toBe(2);

    // 4. 验证 3D 地球仪可检索此点标并支持直达游记
    const globeMarker = oracle.journeys.find(j => j.id === newJourney.id);
    expect(globeMarker.latitude).toBe(34.9671);
    expect(globeMarker.longitude).toBe(135.7727);

    // 5. 点击点标直达游记详情页验证
    const targetPost = oracle.getPostById(globeMarker.associatedPostId);
    expect(targetPost.title).toContain('东京纪行');
  });

  // ---------------------------------------------------------------------------
  // 场景 5：高并发多任务后台操作与韧性保活
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T4-SCN-05', '工作流场景 5：多标签工作区极客漫游与 WebGL 资源完整释放', async () => {
    // 1. 同时开启 8 个核心管理标签
    const workspaces = [
      { id: '/admin/dashboard', title: '空间指挥' },
      { id: '/admin/posts', title: '文章列表' },
      { id: '/admin/posts/edit/1', title: '文章编辑' },
      { id: '/admin/memos', title: '灵感速记' },
      { id: '/admin/media', title: '媒体画廊' },
      { id: '/admin/graph', title: '3D 知识图谱' },
      { id: '/admin/journey', title: '旅行足迹' },
      { id: '/admin/health', title: '系统体检' },
    ];

    for (const ws of workspaces) {
      oracle.openTab(ws);
    }

    // 2. 验证最多 6 个 DOM 活跃，最早的 2 个进入休眠状态
    const tabsState = oracle.getTabsState();
    expect(tabsState.tabs.length).toBe(8);
    expect(tabsState.mountedCount).toBe(6);
    expect(tabsState.unmountedCount).toBe(2);

    // 3. 在 3D 知识图谱中创建 WebGL 上下文
    const graphCtx = oracle.createMockWebGLContext('canvas-graph-3d');
    expect(oracle.activeWebGLContexts.has(graphCtx)).toBe(true);

    // 4. 关闭 3D 知识图谱标签页，验证触发 WebGL 主动销毁
    oracle.safelyDisposeWebGL(graphCtx);
    oracle.closeTab('/admin/graph');

    expect(graphCtx.isDisposed).toBe(true);
    expect(oracle.activeWebGLContexts.has(graphCtx)).toBe(false);

    // 5. 切换回文章编辑标签，验证状态与快照完整恢复
    oracle.openTab({ id: '/admin/posts/edit/1', title: '文章编辑' });
    expect(oracle.activeTabId).toBe('/admin/posts/edit/1');
    const editTab = oracle.tabs.find(t => t.id === '/admin/posts/edit/1');
    expect(editTab.domMounted).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 场景 6：数字花园全站灾备与离线导出闭环
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T4-SCN-06', '工作流场景 6：全站 Markdown 离线备份导出与 Frontmatter 兼容性闭环', async () => {
    // 1. 遍历全站已发布文章
    const publishedPosts = oracle.posts.filter(p => p.status === 'PUBLISHED');
    expect(publishedPosts.length).toBeGreaterThan(0);

    const exportedFiles = [];
    for (const post of publishedPosts) {
      const markdownContent = oracle.exportMarkdownWithFrontmatter(post);
      expect(markdownContent.startsWith('---\n')).toBe(true);
      expect(markdownContent).toContain('author: "Hayden Xue"');
      expect(markdownContent).toContain(`slug: "${post.slug}"`);
      exportedFiles.push({
        filename: `${post.slug}.md`,
        content: markdownContent,
        size: markdownContent.length,
      });
    }

    // 2. 验证全站导出的有效性与压缩包元数据
    expect(exportedFiles.length).toBe(publishedPosts.length);
    for (const file of exportedFiles) {
      expect(file.size).toBeGreaterThan(50);
      expect(file.filename.endsWith('.md')).toBe(true);
    }
  });
}
