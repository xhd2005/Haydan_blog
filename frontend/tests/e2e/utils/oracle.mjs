// frontend/tests/e2e/utils/oracle.mjs
import { config } from '../config.mjs';

/**
 * Hayden Studio VisionOS Reference Contract Oracle
 * 纯内存契约预言机与规范行为模型，提供确定性、高精度的端到端业务与状态验证
 */
export class ContractOracle {
  constructor() {
    this.reset();
  }

  reset() {
    // 1. 站长身份与用户体系
    this.adminUser = {
      id: 1,
      username: 'hayden',
      displayName: 'Hayden Xue',
      email: 'contact@haydenxue.com',
      role: 'ADMIN',
      avatar: 'https://minio.haydenxue.com/blog-assets/avatar.webp',
    };

    // 2. 多标签页与工作区 (LRU 6 保活)
    this.tabs = [
      { id: '/admin/dashboard', title: '空间指挥中枢', icon: 'LayoutDashboard', lastActive: Date.now(), isDirty: false, domMounted: true }
    ];
    this.activeTabId = '/admin/dashboard';
    this.tabSnapshots = new Map(); // route -> snapshot

    // 3. IndexedDB 沙盒存储模型
    this.indexedDbSandbox = new Map();
    this.localStorageFallback = new Map();
    this.storageRestricted = false;

    // 4. 3D WebGL 上下文追踪
    this.activeWebGLContexts = new Set();
    this.disposedWebGLContexts = new Set();

    // 5. 文章数据库 (初始已发布真实文章)
    this.posts = [
      {
        id: 1,
        title: 'Hayden Studio VisionOS 重塑架构深度解析',
        slug: 'hayden-studio-visionos-redesign',
        summary: '探讨 Apple VisionOS 空间美学在现代 CMS 管理系统中的深度实践。',
        content: '# Hayden Studio\n探讨 Apple VisionOS 空间流光玻璃设计，站长 Hayden Xue 撰写。\n涵盖 [[数字花园节点]] 与 MinIO 云原生对象存储。图片：https://minio.haydenxue.com/blog-assets/tokyo-tower.jpg',
        contentEn: '# Hayden Studio\nExploring Apple VisionOS spatial glass aesthetics by Hayden Xue.\nIncludes [[Digital Garden Node]] and MinIO cloud-native storage.',
        status: 'PUBLISHED',
        isTop: true,
        coverImage: 'https://minio.haydenxue.com/blog-assets/hero-cover.jpg',
        categoryId: 1,
        tags: ['VisionOS', 'Next.js', 'Kubernetes'],
        views: 3420,
        readingDepth: { d25: 3200, d50: 2800, d75: 2100, d100: 1750 },
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-10T12:00:00Z',
      },
      {
        id: 2,
        title: '东京纪行：涩谷夜雨与代官山漫步',
        slug: 'tokyo-journey-shibuya-daikanyama',
        summary: '行走在东京细雨朦胧的街道，记录街角光影。',
        content: '# 东京纪行\n涩谷十字路口的雨夜流光，图片引用：https://minio.haydenxue.com/blog-assets/shibuya-crossing.jpg。\n关联旅行足迹。',
        contentEn: '# Tokyo Journey\nRainy night at Shibuya Crossing.',
        status: 'PUBLISHED',
        isTop: false,
        coverImage: 'https://minio.haydenxue.com/blog-assets/shibuya-crossing.jpg',
        categoryId: 2,
        tags: ['Travel', 'Tokyo', 'Photography'],
        views: 1890,
        readingDepth: { d25: 1800, d50: 1650, d75: 1400, d100: 1250 },
        createdAt: '2026-09-05T14:00:00Z',
        updatedAt: '2026-09-05T14:00:00Z',
      }
    ];
    this.postRevisions = new Map(); // postId -> Array<{ revisionId, title, content, timestamp }>
    this.batchReplaceRollbacks = new Map(); // snapshotId -> Map<postId, string>

    // 6. 随记 Memos
    this.memos = [
      {
        id: 1,
        content: '今天在重构 VisionOS 双岛坞组件，微磨砂卡片层级感觉终于对了。#前端设计 #灵感',
        images: ['https://minio.haydenxue.com/blog-assets/dock-preview.png'],
        createdAt: '2026-09-15T09:00:00Z',
      }
    ];

    // 7. 媒体资产与防删锁
    this.mediaAssets = [
      {
        id: 1,
        name: 'tokyo-tower.jpg',
        url: 'https://minio.haydenxue.com/blog-assets/tokyo-tower.jpg',
        size: 3450000, // 3.45 MB 大图
        mimeType: 'image/jpeg',
        exif: { make: 'Sony', model: 'ILCE-7RM5', latitude: 35.6586, longitude: 139.7454 },
        deletedAt: null,
      },
      {
        id: 2,
        name: 'shibuya-crossing.jpg',
        url: 'https://minio.haydenxue.com/blog-assets/shibuya-crossing.jpg',
        size: 2800000, // 2.8 MB 大图
        mimeType: 'image/jpeg',
        exif: { make: 'Sony', model: 'ILCE-7RM5', latitude: 35.6595, longitude: 139.7005 },
        deletedAt: null,
      },
      {
        id: 3,
        name: 'hero-cover.jpg',
        url: 'https://minio.haydenxue.com/blog-assets/hero-cover.jpg',
        size: 1500000, // 1.5 MB
        mimeType: 'image/jpeg',
        exif: null,
        deletedAt: null,
      },
      {
        id: 4,
        name: 'orphan-test-file.png',
        url: 'https://minio.haydenxue.com/blog-assets/orphan-test-file.png',
        size: 512000,
        mimeType: 'image/png',
        exif: null,
        deletedAt: null,
      }
    ];
    this.recycleBin = []; // 软删除回收站

    // 8. 旅行足迹 (必须与真实游记强绑定)
    this.journeys = [
      {
        id: 1,
        title: '东京·涉谷十字路口',
        city: 'Tokyo',
        country: 'Japan',
        latitude: 35.6595,
        longitude: 139.7005,
        associatedPostId: 2, // 必须绑定已发布的真实游记
        visitedAt: '2026-05-12',
        coverImage: 'https://minio.haydenxue.com/blog-assets/shibuya-crossing.jpg',
      }
    ];

    // 9. 分类与标签别名树
    this.categories = [
      { id: 1, name: '科技与架构', slug: 'tech', parentId: null, order: 0 },
      { id: 2, name: '旅行与摄影', slug: 'travel', parentId: null, order: 1 },
      { id: 3, name: '云原生实战', slug: 'cloud-native', parentId: 1, order: 0 },
    ];
    this.tagAliases = new Map([
      ['K8s', 'Kubernetes'],
      ['k8s', 'Kubernetes'],
      ['Golang', 'Go'],
      ['ReactJS', 'React']
    ]);

    // 10. 审计日志与安全黑名单
    this.auditLogs = [
      {
        id: 'log-001',
        method: 'GET',
        path: '/api/admin/dashboard/stats',
        status: 200,
        latencyMs: 42,
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Chrome/120',
        isThreat: false,
        timestamp: '2026-09-17T04:30:00Z',
      },
      {
        id: 'log-002',
        method: 'POST',
        path: '/api/admin/posts/update',
        status: 200,
        latencyMs: 125,
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Chrome/120',
        isThreat: false,
        timestamp: '2026-09-17T04:31:00Z',
        diff: {
          before: '正文旧版本描述',
          after: '正文新版本描述 (含双语支持)',
        }
      },
      {
        id: 'log-threat-01',
        method: 'GET',
        path: '/../../etc/passwd',
        status: 400,
        latencyMs: 8,
        ip: '45.33.32.156',
        userAgent: 'curl/7.68.0-scanner',
        isThreat: true,
        threatType: 'PATH_TRAVERSAL',
        timestamp: '2026-09-17T04:40:00Z',
      }
    ];
    this.bannedIps = new Set(['185.220.101.5']);

    // 11. 中间件健康状态
    this.middlewareHealth = {
      database: { status: 'UP', latencyMs: 3 },
      redis: { status: 'UP', latencyMs: 1 },
      minio: { status: 'UP', latencyMs: 12 },
      aiService: { status: 'UP', latencyMs: 180 },
    };

    // 12. 待办事项
    this.todos = [
      { id: 'todo-1', title: '发布 VisionOS 架构解析英译版', done: false, priority: 'HIGH' },
      { id: 'todo-2', title: '审核友链申请：云原生极客栈', done: false, priority: 'MEDIUM' },
    ];
  }

  // -------------------------------------------------------------
  // 1. 站长身份纯正性校验 (AGENTS.md)
  // -------------------------------------------------------------
  verifyAuthorIdentity(name) {
    if (typeof name !== 'string') return false;
    const lower = name.toLowerCase().trim();
    for (const forbidden of config.forbiddenNames) {
      if (lower.includes(forbidden)) {
        throw new Error(`[SECURITY ALERT] 违规历史名称检测到: "${forbidden}". 必须严格保持为 "Hayden Xue".`);
      }
    }
    return lower === 'hayden xue' || lower === 'hayden';
  }

  // -------------------------------------------------------------
  // 2. 多标签工作区与 LRU 6 保活 (PROJECT.md F6)
  // -------------------------------------------------------------
  openTab(tabInput) {
    const existingIndex = this.tabs.findIndex(t => t.id === tabInput.id);
    const now = Date.now();

    if (existingIndex >= 0) {
      this.tabs[existingIndex].lastActive = now;
      this.tabs[existingIndex].domMounted = true;
      this.activeTabId = tabInput.id;
    } else {
      const newTab = {
        id: tabInput.id,
        title: tabInput.title,
        icon: tabInput.icon || 'FileText',
        isDirty: !!tabInput.isDirty,
        lastActive: now,
        domMounted: true,
      };
      this.tabs.push(newTab);
      this.activeTabId = tabInput.id;
    }

    // 执行 LRU 保活调度：保持最多 6 个活跃 DOM
    this.enforceTabsLru();
    return this.getTabsState();
  }

  enforceTabsLru() {
    if (this.tabs.length <= config.maxActiveTabs) {
      this.tabs.forEach(t => { t.domMounted = true; });
      return;
    }

    // 按活跃时间从新到旧排序
    const sorted = [...this.tabs].sort((a, b) => b.lastActive - a.lastActive);
    const activeIds = new Set();
    if (this.activeTabId) {
      activeIds.add(this.activeTabId);
    }
    for (const t of sorted) {
      if (activeIds.size >= config.maxActiveTabs) break;
      activeIds.add(t.id);
    }

    this.tabs.forEach(t => {
      t.domMounted = activeIds.has(t.id);
    });
  }

  updatePost(id, updates) {
    const post = this.posts.find(p => p.id === id);
    if (!post) throw new Error(`Post with id ${id} not found`);
    Object.assign(post, updates, { updatedAt: new Date().toISOString() });
    return JSON.parse(JSON.stringify(post));
  }

  closeTab(tabId) {
    const targetIndex = this.tabs.findIndex(t => t.id === tabId);
    if (targetIndex === -1) return this.getTabsState();

    const wasActive = this.activeTabId === tabId;
    this.tabs.splice(targetIndex, 1);

    if (wasActive && this.tabs.length > 0) {
      const nextActiveIndex = Math.min(targetIndex, this.tabs.length - 1);
      this.activeTabId = this.tabs[nextActiveIndex].id;
      this.tabs[nextActiveIndex].lastActive = Date.now();
      this.tabs[nextActiveIndex].domMounted = true;
    } else if (this.tabs.length === 0) {
      this.activeTabId = '';
    }

    this.enforceTabsLru();
    return this.getTabsState();
  }

  closeOtherTabs(preserveTabId) {
    this.tabs = this.tabs.filter(t => t.id === preserveTabId);
    this.activeTabId = preserveTabId;
    if (this.tabs.length > 0) {
      this.tabs[0].domMounted = true;
      this.tabs[0].lastActive = Date.now();
    }
    return this.getTabsState();
  }

  setTabDirty(tabId, isDirty) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.isDirty = isDirty;
    }
    return this.getTabsState();
  }

  getTabsState() {
    return {
      tabs: this.tabs.map(t => ({ ...t })),
      activeTabId: this.activeTabId,
      mountedCount: this.tabs.filter(t => t.domMounted).length,
      unmountedCount: this.tabs.filter(t => !t.domMounted).length,
    };
  }

  // -------------------------------------------------------------
  // 3. IndexedDB 沙盒快照恢复引擎 (PROJECT.md F7)
  // -------------------------------------------------------------
  async saveFormSnapshot(route, data, cursor = { start: 0, end: 0 }, scroll = 0) {
    if (this.storageRestricted) {
      // 存储受限时自动降级到 LocalStorage
      this.localStorageFallback.set(route, {
        route,
        formData: JSON.parse(JSON.stringify(data)),
        cursorPosition: cursor,
        scrollOffset: scroll,
        updatedAt: Date.now(),
      });
      return;
    }

    this.indexedDbSandbox.set(route, {
      route,
      formData: JSON.parse(JSON.stringify(data)),
      cursorPosition: cursor,
      scrollOffset: scroll,
      updatedAt: Date.now(),
    });
  }

  async getFormSnapshot(route) {
    if (this.storageRestricted) {
      return this.localStorageFallback.get(route) || null;
    }
    return this.indexedDbSandbox.get(route) || null;
  }

  async clearFormSnapshot(route) {
    this.indexedDbSandbox.delete(route);
    this.localStorageFallback.delete(route);
  }

  setStorageRestricted(restricted) {
    this.storageRestricted = restricted;
  }

  // -------------------------------------------------------------
  // 4. WebGL 上下文主动销毁机制 (PROJECT.md F8)
  // -------------------------------------------------------------
  createMockWebGLContext(canvasId) {
    const ctx = {
      canvasId,
      isDisposed: false,
      resources: { textures: 4, buffers: 8, programs: 2 },
      loseContext() {
        this.isDisposed = true;
        this.resources = { textures: 0, buffers: 0, programs: 0 };
      }
    };
    this.activeWebGLContexts.add(ctx);
    return ctx;
  }

  safelyDisposeWebGL(ctx) {
    if (!ctx) return;
    if (typeof ctx.loseContext === 'function') {
      ctx.loseContext();
    }
    this.activeWebGLContexts.delete(ctx);
    this.disposedWebGLContexts.add(ctx);
  }

  // -------------------------------------------------------------
  // 5. 正文数据水合与批量替换引擎 (AGENTS.md & PROJECT.md F25)
  // -------------------------------------------------------------
  getPostListSlim() {
    // 铁律：列表精简排除 content 大文本
    return this.posts.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      status: p.status,
      isTop: p.isTop,
      categoryId: p.categoryId,
      views: p.views,
      createdAt: p.createdAt,
      // 注意：绝对不包含 p.content
    }));
  }

  getPostById(id) {
    const post = this.posts.find(p => p.id === id);
    if (!post) throw new Error(`Post with id ${id} not found`);
    return JSON.parse(JSON.stringify(post)); // 完整水合，包含 content 与 contentEn
  }

  previewBatchReplace(searchRegex, replaceText) {
    if (!searchRegex || typeof searchRegex !== 'string') {
      throw new Error('搜索内容不能为空');
    }

    // 防御性校验正则安全
    let regex;
    try {
      regex = new RegExp(searchRegex, 'g');
    } catch (err) {
      throw new Error(`无效的正则表达式: ${err.message}`);
    }

    const results = [];
    // 强制并发水合获取每个博文的完整正文
    for (const slim of this.getPostListSlim()) {
      const full = this.getPostById(slim.id);
      const content = full.content || '';
      const matches = [...content.matchAll(regex)];

      if (matches.length > 0) {
        const lines = content.split('\n');
        const diffSnippets = [];

        lines.forEach((line, idx) => {
          if (regex.test(line)) {
            diffSnippets.push({
              line: idx + 1,
              before: line,
              after: line.replace(regex, replaceText),
            });
          }
        });

        results.push({
          postId: full.id,
          title: full.title,
          matchCount: matches.length,
          diffSnippets,
        });
      }
    }

    return results;
  }

  executeBatchReplace(searchRegex, replaceText, targetPostIds = null) {
    const preview = this.previewBatchReplace(searchRegex, replaceText);
    const snapshotId = `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const rollbackMap = new Map();

    let updatedCount = 0;
    const targetSet = targetPostIds ? new Set(targetPostIds) : null;

    for (const item of preview) {
      if (targetSet && !targetSet.has(item.postId)) continue;

      const post = this.posts.find(p => p.id === item.postId);
      if (post) {
        rollbackMap.set(post.id, post.content);
        const regex = new RegExp(searchRegex, 'g');
        post.content = post.content.replace(regex, replaceText);
        post.updatedAt = new Date().toISOString();
        updatedCount++;
      }
    }

    this.batchReplaceRollbacks.set(snapshotId, rollbackMap);

    // 记录修改类日志
    this.auditLogs.unshift({
      id: `log-batch-${Date.now()}`,
      method: 'POST',
      path: '/api/admin/posts/batch-replace',
      status: 200,
      latencyMs: 85,
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Chrome/120',
      isThreat: false,
      timestamp: new Date().toISOString(),
      diff: {
        before: `Regex: ${searchRegex} across ${updatedCount} posts`,
        after: `Replaced with: ${replaceText}`,
      }
    });

    return { updatedCount, snapshotId };
  }

  rollbackBatchReplace(snapshotId) {
    const rollbackMap = this.batchReplaceRollbacks.get(snapshotId);
    if (!rollbackMap) return false;

    for (const [postId, originalContent] of rollbackMap.entries()) {
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        post.content = originalContent;
        post.updatedAt = new Date().toISOString();
      }
    }

    this.batchReplaceRollbacks.delete(snapshotId);
    return true;
  }

  // -------------------------------------------------------------
  // 6. 媒体引用反向追踪与在用防删锁 (PROJECT.md F34 & F35)
  // -------------------------------------------------------------
  checkMediaReferences(url) {
    const usedInPosts = [];
    const usedInMemos = [];
    const usedInSettings = [];

    // 水合检查全部文章正文与封面
    for (const slim of this.getPostListSlim()) {
      const post = this.getPostById(slim.id);
      if (post.coverImage === url || (post.content && post.content.includes(url))) {
        usedInPosts.push({ id: post.id, title: post.title, slug: post.slug });
      }
    }

    // 检查随记
    for (const memo of this.memos) {
      if (memo.images && memo.images.includes(url)) {
        usedInMemos.push({ id: memo.id, summary: memo.content.slice(0, 30) });
      }
    }

    // 检查站长头像与背景
    if (this.adminUser.avatar === url) {
      usedInSettings.push('站长头像 (adminUser.avatar)');
    }

    const isLocked = usedInPosts.length > 0 || usedInMemos.length > 0 || usedInSettings.length > 0;

    return {
      url,
      isLocked,
      usedInPosts,
      usedInMemos,
      usedInSettings,
    };
  }

  deleteMediaAsset(id, confirmationModalPassed = false) {
    // 铁律：破坏性操作二次确认拦截
    if (!confirmationModalPassed) {
      throw new Error('[SECURITY GUARDRAIL] 必须通过 confirmModal(variant: "danger") 确认才能执行删除');
    }

    const asset = this.mediaAssets.find(m => m.id === id);
    if (!asset) throw new Error(`Media asset ${id} not found`);

    const ref = this.checkMediaReferences(asset.url);
    if (ref.isLocked) {
      throw new Error(`[MEDIA LOCK ACTIVE] 该图片正在被 ${ref.usedInPosts.length} 篇博文或随记引用，已触发在用防删锁，禁止删除`);
    }

    asset.deletedAt = new Date().toISOString();
    return true;
  }

  runMediaGcScan() {
    const orphanAssets = [];
    for (const asset of this.mediaAssets) {
      if (asset.deletedAt) continue;
      const ref = this.checkMediaReferences(asset.url);
      if (!ref.isLocked) {
        orphanAssets.push(asset);
      }
    }
    return orphanAssets;
  }

  moveToRecycleBin(assetIds) {
    const moved = [];
    for (const id of assetIds) {
      const asset = this.mediaAssets.find(m => m.id === id);
      if (asset && !asset.deletedAt) {
        asset.deletedAt = new Date().toISOString();
        this.recycleBin.push({
          ...asset,
          recycleAt: Date.now(),
          purgeAfterDays: 30,
        });
        moved.push(asset);
      }
    }
    return moved;
  }

  // -------------------------------------------------------------
  // 7. 旅行足迹与真实游记强绑定验证 (AGENTS.md & PROJECT.md F42)
  // -------------------------------------------------------------
  createJourneyFootprint(journeyInput) {
    const { title, city, country, latitude, longitude, associatedPostId } = journeyInput;

    if (!title || !city || latitude === undefined || longitude === undefined) {
      throw new Error('足迹必须包含标题、城市与有效 GPS 经纬度');
    }

    // 经纬度范围有效性校验
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error(`无效的 GPS 坐标: (${latitude}, ${longitude})`);
    }

    // 铁律：必须强绑定真实已发布游记
    if (!associatedPostId) {
      throw new Error('[AGENTS.MD 铁律] 严禁在前端展示未曾到访的虚构足迹；点标必须关联已发布的真实游记博文');
    }

    const post = this.posts.find(p => p.id === associatedPostId);
    if (!post || post.status !== 'PUBLISHED') {
      throw new Error(`关联的游记博文不存在或尚未发布 (postId: ${associatedPostId})`);
    }

    const newJourney = {
      id: this.journeys.length + 1,
      title,
      city,
      country: country || 'Unknown',
      latitude,
      longitude,
      associatedPostId,
      visitedAt: journeyInput.visitedAt || new Date().toISOString().split('T')[0],
      coverImage: journeyInput.coverImage || post.coverImage,
    };

    this.journeys.push(newJourney);
    return newJourney;
  }

  // -------------------------------------------------------------
  // 8. 健康评分光环与大图压缩工坊 (PROJECT.md F21 & F23)
  // -------------------------------------------------------------
  calculateHealthScore() {
    let score = 100;
    const issues = [];

    // 1. 中间件探活检测
    for (const [name, info] of Object.entries(this.middlewareHealth)) {
      if (info.status !== 'UP') {
        score -= 25;
        issues.push({ type: 'MIDDLEWARE_DOWN', name, penalty: 25 });
      } else if (info.latencyMs > 100) {
        score -= 5;
        issues.push({ type: 'HIGH_LATENCY', name, latency: info.latencyMs, penalty: 5 });
      }
    }

    // 2. 巨幅大图扫描 (>2MB 扣分)
    const giantImages = this.mediaAssets.filter(m => !m.deletedAt && m.size > 2000000);
    if (giantImages.length > 0) {
      const penalty = Math.min(giantImages.length * 8, 24);
      score -= penalty;
      issues.push({ type: 'GIANT_IMAGES', count: giantImages.length, penalty });
    }

    // 3. 恶意扫描告警
    const activeThreats = this.auditLogs.filter(l => l.isThreat && !this.bannedIps.has(l.ip));
    if (activeThreats.length > 0) {
      score -= 10;
      issues.push({ type: 'UNRESOLVED_THREATS', count: activeThreats.length, penalty: 10 });
    }

    return {
      score: Math.max(score, 0),
      issues,
      middleware: this.middlewareHealth,
      giantImages,
    };
  }

  compressImageToWebp(mediaId) {
    const asset = this.mediaAssets.find(m => m.id === mediaId);
    if (!asset) throw new Error(`Media asset ${mediaId} not found`);

    if (asset.mimeType === 'image/webp') {
      return { converted: false, asset, reason: 'Already WebP' };
    }

    const oldUrl = asset.url;
    const newUrl = asset.url.replace(/\.(jpe?g|png)$/i, '.webp');
    const oldSize = asset.size;
    const newSize = Math.round(asset.size * 0.28); // WebP 无损压缩节省 ~72% 体积

    asset.url = newUrl;
    asset.name = asset.name.replace(/\.(jpe?g|png)$/i, '.webp');
    asset.mimeType = 'image/webp';
    asset.size = newSize;

    // 联动重写全站正文与封面引用
    let rewrittenPosts = 0;
    for (const post of this.posts) {
      let modified = false;
      if (post.coverImage === oldUrl) {
        post.coverImage = newUrl;
        modified = true;
      }
      if (post.content && post.content.includes(oldUrl)) {
        post.content = post.content.replaceAll(oldUrl, newUrl);
        modified = true;
      }
      if (modified) rewrittenPosts++;
    }

    return {
      converted: true,
      oldSize,
      newSize,
      savedBytes: oldSize - newSize,
      compressionRatio: '72%',
      rewrittenPosts,
      newUrl,
    };
  }

  // -------------------------------------------------------------
  // 9. 恶意特征识别与一键封禁 IP (PROJECT.md F19)
  // -------------------------------------------------------------
  detectThreats(path, query = '', userAgent = '') {
    const suspiciousPatterns = [
      { type: 'PATH_TRAVERSAL', regex: /\.\.\/|\.\.\\/ },
      { type: 'SQL_INJECTION', regex: /' OR 1=1|UNION SELECT|DROP TABLE/i },
      { type: 'SENSITIVE_PROBE', regex: /\/\.env|\/wp-login\.php|\/\.git/i },
    ];

    const target = `${path}?${query}`;
    for (const p of suspiciousPatterns) {
      if (p.regex.test(target) || p.regex.test(userAgent)) {
        return { isThreat: true, threatType: p.type };
      }
    }
    return { isThreat: false, threatType: null };
  }

  banIp(ip) {
    if (!ip || typeof ip !== 'string') {
      throw new Error('IP 地址不能为空');
    }
    // IPv4 / IPv6 基本格式验证
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      throw new Error(`非法 IP 地址格式: "${ip}"`);
    }

    this.bannedIps.add(ip);
    return true;
  }

  isIpBanned(ip) {
    return this.bannedIps.has(ip);
  }

  maskIp(ip) {
    if (typeof ip !== 'string') return '***.***.***.***';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }
    return ip.replace(/:[^:]+$/, ':****');
  }

  // -------------------------------------------------------------
  // 10. 标签别名成环检测与归一化 (PROJECT.md F40)
  // -------------------------------------------------------------
  resolveCanonicalTag(tag) {
    let current = tag;
    const visited = new Set([current]);

    while (this.tagAliases.has(current)) {
      const next = this.tagAliases.get(current);
      if (visited.has(next)) {
        throw new Error(`[CYCLE DETECTED] 标签别名存在循环引用: ${Array.from(visited).join(' -> ')} -> ${next}`);
      }
      visited.add(next);
      current = next;
    }

    return current;
  }

  addTagAlias(alias, target) {
    if (alias === target) {
      throw new Error('别名不能指向自身');
    }
    // 尝试解析检测是否成环
    this.tagAliases.set(alias, target);
    try {
      this.resolveCanonicalTag(alias);
    } catch (err) {
      this.tagAliases.delete(alias);
      throw err;
    }
  }

  // -------------------------------------------------------------
  // 11. 三向合并引擎 (Three-way Merge) (PROJECT.md F10)
  // -------------------------------------------------------------
  threeWayMerge(baseContent, localContent, cloudContent) {
    if (localContent === cloudContent) {
      return { conflict: false, merged: localContent };
    }
    if (localContent === baseContent) {
      // 本地无改动，云端有改动，直接采用云端
      return { conflict: false, merged: cloudContent };
    }
    if (cloudContent === baseContent) {
      // 云端无改动，本地有改动，直接采用本地
      return { conflict: false, merged: localContent };
    }

    // 两侧均改动，分析行级差异
    const baseLines = baseContent.split('\n');
    const localLines = localContent.split('\n');
    const cloudLines = cloudContent.split('\n');

    const conflicts = [];
    const maxLines = Math.max(baseLines.length, localLines.length, cloudLines.length);

    for (let i = 0; i < maxLines; i++) {
      const b = baseLines[i] || '';
      const l = localLines[i] || '';
      const c = cloudLines[i] || '';

      if (l !== c && l !== b && c !== b) {
        conflicts.push({ line: i + 1, base: b, local: l, cloud: c });
      }
    }

    return {
      conflict: conflicts.length > 0,
      conflicts,
      localContent,
      cloudContent,
      baseContent,
    };
  }

  // -------------------------------------------------------------
  // 12. Markdown Frontmatter 导出兼容性 (AGENTS.md)
  // -------------------------------------------------------------
  exportMarkdownWithFrontmatter(post) {
    const categories = post.categoryId ? [post.categoryId] : [];
    const tags = post.tags && post.tags.length > 0 ? post.tags : [];
    const date = post.createdAt || '';

    // 铁律：即使缺分类或标签，必须输出有效默认值 categories: []，tags: []，date: ""
    const frontmatterLines = [
      '---',
      `title: "${post.title.replace(/"/g, '\\"')}"`,
      `slug: "${post.slug}"`,
      `date: "${date}"`,
      `categories: ${JSON.stringify(categories)}`,
      `tags: ${JSON.stringify(tags)}`,
      `author: "Hayden Xue"`,
      '---',
      '',
      post.content || '',
    ];

    return frontmatterLines.join('\n');
  }
}
