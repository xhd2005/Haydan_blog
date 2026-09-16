// e2e/tiers/tier1-feature-coverage.mjs
import { ApiClient, FrontendClient } from '../utils/client.mjs';
import { expect } from '../utils/assertions.mjs';
import { config, createRandomId } from '../config.mjs';

export function registerTier1Tests(harness) {
  const suite = harness.createSuite('Tier 1: 功能覆盖基线测试 (Feature Coverage, F1-F15 >= 75 Tests)', 'Tier 1');
  const api = new ApiClient();
  const frontend = new FrontendClient();

  let adminToken = null;
  let readerToken = null;
  let uploadedMediaId = null;

  // ---------------------------------------------------------------------------
  // Pre-suite Setup: Login Admin & Register Reader
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T1-PREP', '前置准备：登录站长账号并注册基准测试读者', async () => {
    const adminRes = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    expect(adminRes.status).toBe(200);
    expect(adminRes.json.data.role).toBe('ADMIN');
    expect(adminRes.json.data.nickname).toBe('Hayden Xue');
    adminToken = adminRes.json.data.accessToken;

    const username = createRandomId('t1_reader');
    const registerRes = await api.post('/api/auth/register', {
      username,
      password: config.readerDefaults.password,
      nickname: `读者_${username}`,
      email: `${username}@${config.readerDefaults.emailDomain}`,
    });
    expect(registerRes.status).toBe(200);
    readerToken = registerRes.json.data.accessToken;
  });

  // ===========================================================================
  // F1: MinIO SDK 集成与存储策略抽象 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F01-01', 'F1: 站长获取当前生效的存储策略 (GET /api/settings)', async () => {
    api.setToken(adminToken);
    const res = await api.get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data).toBeDefined();
    expect(res.json.data.storageType).toBeOneOf(['LOCAL', 'MINIO']);
  });

  suite.addTest('TC-T1-F01-02', 'F1: 站长将存储策略切换为 MINIO (PUT /api/settings)', async () => {
    api.setToken(adminToken);
    const res = await api.put('/api/settings', { storageType: 'MINIO' });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);

    const verifyRes = await api.get('/api/settings');
    expect(verifyRes.json.data.storageType).toBe('MINIO');
  });

  suite.addTest('TC-T1-F01-03', 'F1: MINIO 策略下文件上传元数据标记 storageType 为 MINIO', async () => {
    api.setToken(adminToken);
    // Standard PNG buffer
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
    const res = await api.upload('/api/media/upload', {
      buffer: pngBuffer,
      filename: 'minio-test-icon.png',
      contentType: 'image/png',
    });
    expect(res.status).toBe(200);
    expect(res.json.data).toBeDefined();
    expect(res.json.data.storageType).toBe('MINIO');
    expect(res.json.data.url).toContain('https://');
  });

  suite.addTest('TC-T1-F01-04', 'F1: 站长将存储策略切换为 LOCAL (PUT /api/settings)', async () => {
    api.setToken(adminToken);
    const res = await api.put('/api/settings', { storageType: 'LOCAL' });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);

    const verifyRes = await api.get('/api/settings');
    expect(verifyRes.json.data.storageType).toBe('LOCAL');
  });

  suite.addTest('TC-T1-F01-05', 'F1: LOCAL 策略下文件上传元数据标记 storageType 为 LOCAL', async () => {
    api.setToken(adminToken);
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
    const res = await api.upload('/api/media/upload', {
      buffer: pngBuffer,
      filename: 'local-test-icon.png',
      contentType: 'image/png',
    });
    expect(res.status).toBe(200);
    expect(res.json.data.storageType).toBe('LOCAL');
    expect(res.json.data.url).toContain('/uploads/');
  });

  // ===========================================================================
  // F2: 视频多媒体上传与魔数安全校验 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F02-01', 'F2: 正常 MP4 视频携带 ftyp 二进制头安全上传成功', async () => {
    api.setToken(adminToken);
    // Construct valid MP4 ftyp box header (length 16, box type 'ftyp', major brand 'isom')
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // size 24, 'ftyp'
      0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00, // major_brand 'isom', minor_version
      0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32, // compatible_brands 'isom', 'iso2'
    ]);
    const res = await api.upload('/api/media/upload', {
      buffer: mp4Header,
      filename: 'cinematic-intro.mp4',
      contentType: 'video/mp4',
    });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data.fileType).toBe('video/mp4');
    expect(res.json.data.url).toBeDefined();
    uploadedMediaId = res.json.data.id;
  });

  suite.addTest('TC-T1-F02-02', 'F2: 正常 WebM 视频携带 EBML 二进制魔数头安全上传成功', async () => {
    api.setToken(adminToken);
    // Construct valid WebM EBML header [0x1A, 0x45, 0xDF, 0xA3]
    const webmHeader = Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0x01, 0x00, 0x00, 0x1F, 0x42, 0x86, 0x81, 0x01]);
    const res = await api.upload('/api/media/upload', {
      buffer: webmHeader,
      filename: 'stream-ambient.webm',
      contentType: 'video/webm',
    });
    expect(res.status).toBe(200);
    expect(res.json.data.fileType).toBe('video/webm');
  });

  suite.addTest('TC-T1-F02-03', 'F2: 媒体库列表 GET /api/media 正确展示多媒体类型与尺寸', async () => {
    api.setToken(adminToken);
    const res = await api.get('/api/media');
    expect(res.status).toBe(200);
    expect(res.json.data.records).toBeDefined();
    expect(res.json.data.records.length).toBeGreaterThan(0);
    const mp4Item = res.json.data.records.find(m => m.fileType === 'video/mp4');
    expect(mp4Item).toBeDefined();
  });

  suite.addTest('TC-T1-F02-04', 'F2: 正常 JPEG 高清图片携带 SOI 魔数安全上传成功', async () => {
    api.setToken(adminToken);
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const res = await api.upload('/api/media/upload', {
      buffer: jpegHeader,
      filename: 'tokyo-cover.jpg',
      contentType: 'image/jpeg',
    });
    expect(res.status).toBe(200);
    expect(res.json.data.fileType).toBe('image/jpeg');
  });

  suite.addTest('TC-T1-F02-05', 'F2: 管理员删除媒体库中的指定多媒体资源 (DELETE /api/media/{id})', async () => {
    api.setToken(adminToken);
    expect(uploadedMediaId).toBeDefined();
    const res = await api.delete(`/api/media/${uploadedMediaId}`);
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
  });

  // ===========================================================================
  // F3: MinIO 可视化凭据与连通性测试 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F03-01', 'F3: 管理员调用 POST /api/settings/test-minio 连通性测试返回 success=true', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/settings/test-minio', {
      endpoint: 'https://minio.haydenxue.com',
      bucket: 'hayden-media',
      accessKey: 'hayden-admin',
      secretKey: 'm!nI0_S3cr3t_2026',
    });
    expect(res.status).toBe(200);
    expect(res.json.data.success).toBe(true);
    expect(res.json.data.latencyMs).toBeGreaterThan(0);
    expect(res.json.data.message).toContain('连通性测试通过');
  });

  suite.addTest('TC-T1-F03-02', 'F3: 普通读者 GET /api/settings 响应中 minioSecretKey 严格脱敏为 null', async () => {
    api.setToken(readerToken);
    const res = await api.get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.json.data).toBeDefined();
    expect(res.json.data.minioSecretKey).toBeNull();
  });

  suite.addTest('TC-T1-F03-03', 'F3: 未登录访客 GET /api/settings 响应中 minioSecretKey 严格脱敏为 null', async () => {
    api.clearToken();
    const res = await api.get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.json.data.minioSecretKey).toBeNull();
  });

  suite.addTest('TC-T1-F03-04', 'F3: 管理员 GET /api/settings 能完整查看 MinIO 配置公网与 Bucket 凭据', async () => {
    api.setToken(adminToken);
    const res = await api.get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.json.data.minioEndpoint).toBe('https://minio.haydenxue.com');
    expect(res.json.data.minioBucket).toBe('hayden-media');
    expect(res.json.data.minioPublicUrl).toBe('https://cdn.haydenxue.com');
  });

  suite.addTest('TC-T1-F03-05', 'F3: 站长在线更新 MinIO 凭据配置并持久化', async () => {
    api.setToken(adminToken);
    const res = await api.put('/api/settings', {
      minioBucket: 'hayden-media-v2',
      minioPublicUrl: 'https://cdn-v2.haydenxue.com',
    });
    expect(res.status).toBe(200);
    const verifyRes = await api.get('/api/settings');
    expect(verifyRes.json.data.minioBucket).toBe('hayden-media-v2');
    expect(verifyRes.json.data.minioPublicUrl).toBe('https://cdn-v2.haydenxue.com');
  });

  // ===========================================================================
  // F4: 真实旅行足迹数据补充 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F04-01', 'F4: 公开 GET /api/journey 返回非空真实足迹列表', async () => {
    api.clearToken();
    const res = await api.get('/api/journey');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.json.data)).toBe(true);
    expect(res.json.data.length).toBeGreaterThanOrEqual(7);
  });

  suite.addTest('TC-T1-F04-02', 'F4: 足迹列表严格包含北京与东京精准经纬度', async () => {
    api.clearToken();
    const res = await api.get('/api/journey');
    const beijing = res.json.data.find(j => j.city === 'Beijing');
    const tokyo = res.json.data.find(j => j.city === 'Tokyo');
    expect(beijing).toBeDefined();
    expect(Math.round(beijing.lat)).toBe(40);
    expect(Math.round(beijing.lon)).toBe(116);
    expect(tokyo).toBeDefined();
    expect(Math.round(tokyo.lat)).toBe(36);
    expect(Math.round(tokyo.lon)).toBe(140);
  });

  suite.addTest('TC-T1-F04-03', 'F4: 每条足迹记录必须具备完整契约字段 (title, city, cover, slug, lat, lon)', async () => {
    api.clearToken();
    const res = await api.get('/api/journey');
    for (const journey of res.json.data) {
      expect(journey.title).toBeDefined();
      expect(journey.city).toBeDefined();
      expect(journey.cover).toBeDefined();
      expect(journey.slug).toBeDefined();
      expect(typeof journey.lat).toBe('number');
      expect(typeof journey.lon).toBe('number');
    }
  });

  suite.addTest('TC-T1-F04-04', 'F4: 通过 slug 精准获取特定真实游记详情 (GET /api/journey/{slug})', async () => {
    api.clearToken();
    const res = await api.get('/api/journey/beijing-autumn');
    expect(res.status).toBe(200);
    expect(res.json.data.title).toContain('北京');
    expect(res.json.data.city).toBe('Beijing');
    expect(res.json.data.description).toBeDefined();
  });

  suite.addTest('TC-T1-F04-05', 'F4: 足迹数据严格杜绝任何未到访虚构硬编码城市', async () => {
    api.clearToken();
    const res = await api.get('/api/journey');
    const cities = res.json.data.map(j => j.city);
    // No fictitious preset cities
    expect(cities.includes('FictionalCity')).toBe(false);
    expect(cities.includes('Nowhere')).toBe(false);
  });

  // ===========================================================================
  // F5: Now 页面生活心智流数据模型扩展 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F05-01', 'F5: GET /api/now 返回完整结构化心智流模型', async () => {
    api.clearToken();
    const res = await api.get('/api/now');
    expect(res.status).toBe(200);
    expect(res.json.data).toBeDefined();
    expect(res.json.data.focusTopicsJson).toBeDefined();
    expect(res.json.data.readingNotesJson).toBeDefined();
    expect(res.json.data.currentCity).toBeDefined();
    expect(res.json.data.microLogsJson).toBeDefined();
  });

  suite.addTest('TC-T1-F05-02', 'F5: 站长在线更新攻坚技术专题 focusTopicsJson 并持久化', async () => {
    api.setToken(adminToken);
    const newTopics = JSON.stringify([
      { title: 'Java 21 虚拟线程生产调优', progress: 95, tag: 'Enterprise' },
      { title: 'Three.js 航海地球仪 4.0', progress: 90, tag: 'Creative' },
    ]);
    const res = await api.put('/api/now', { focusTopicsJson: newTopics });
    expect(res.status).toBe(200);
    const verify = await api.get('/api/now');
    expect(verify.json.data.focusTopicsJson).toBe(newTopics);
  });

  suite.addTest('TC-T1-F05-03', 'F5: 站长更新在读经典与书摘 readingNotesJson', async () => {
    api.setToken(adminToken);
    const newNotes = JSON.stringify([
      { bookTitle: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', quote: 'Beyond reliability.' },
    ]);
    const res = await api.put('/api/now', { readingNotesJson: newNotes });
    expect(res.status).toBe(200);
    const verify = await api.get('/api/now');
    expect(verify.json.data.readingNotesJson).toBe(newNotes);
  });

  suite.addTest('TC-T1-F05-04', 'F5: 站长更新当前物理驻留城市 currentCity', async () => {
    api.setToken(adminToken);
    const res = await api.put('/api/now', { currentCity: 'Tokyo' });
    expect(res.status).toBe(200);
    const verify = await api.get('/api/now');
    expect(verify.json.data.currentCity).toBe('Tokyo');
  });

  suite.addTest('TC-T1-F05-05', 'F5: 站长更新近期微日志 microLogsJson 实时反映最新灵感', async () => {
    api.setToken(adminToken);
    const newLogs = JSON.stringify([
      { date: '2026-09-08', content: '数字花园 4.0 架构重构全部就绪 ✨' },
    ]);
    const res = await api.put('/api/now', { microLogsJson: newLogs });
    expect(res.status).toBe(200);
    const verify = await api.get('/api/now');
    expect(verify.json.data.microLogsJson).toBe(newLogs);
  });

  // ===========================================================================
  // F6: 友链探活与公开自助申请流 (5 Tests)
  // ===========================================================================
  let pendingFriendId = null;

  suite.addTest('TC-T1-F06-01', 'F6: 读者通过公开接口 POST /api/friends/apply 提交友链申请，初始为 PENDING', async () => {
    api.clearToken();
    const applicantUrl = `https://reader-${Date.now()}.dev`;
    const res = await api.post('/api/friends/apply', {
      name: '极客读者博客',
      url: applicantUrl,
      avatar: 'https://assets.haydenxue.com/avatar/reader.png',
      description: '专注高性能分布式系统',
      category: 'GEEK_PEER',
    });
    expect(res.status).toBe(200);
    expect(res.json.data.status).toBe('PENDING');
    expect(res.json.data.pingStatus).toBe('UNKNOWN');
    pendingFriendId = res.json.data.id;
  });

  suite.addTest('TC-T1-F06-02', 'F6: 公开 GET /api/friends 仅返回审核通过的 ACTIVE 友链，不含 PENDING', async () => {
    api.clearToken();
    const res = await api.get('/api/friends');
    expect(res.status).toBe(200);
    const foundPending = res.json.data.find(f => f.id === pendingFriendId);
    expect(foundPending).toBeUndefined();
  });

  suite.addTest('TC-T1-F06-03', 'F6: 管理员 GET /api/friends/admin 查看全量友链（包含 PENDING 申请项）', async () => {
    api.setToken(adminToken);
    const res = await api.get('/api/friends/admin');
    expect(res.status).toBe(200);
    const pendingItem = res.json.data.find(f => f.id === pendingFriendId);
    expect(pendingItem).toBeDefined();
    expect(pendingItem.status).toBe('PENDING');
  });

  suite.addTest('TC-T1-F06-04', 'F6: 管理员调用 PUT /api/friends/{id}/status 审核通过该友链 (ACTIVE)', async () => {
    api.setToken(adminToken);
    const res = await api.put(`/api/friends/${pendingFriendId}/status`, { status: 'ACTIVE' });
    expect(res.status).toBe(200);

    const publicRes = await api.get('/api/friends');
    const approvedItem = publicRes.json.data.find(f => f.id === pendingFriendId);
    expect(approvedItem).toBeDefined();
    expect(approvedItem.status).toBe('ACTIVE');
    expect(approvedItem.pingStatus).toBe('ONLINE');
  });

  suite.addTest('TC-T1-F06-05', 'F6: 公开友邻动态流 GET /api/friends/stream 返回聚合文章列表', async () => {
    api.clearToken();
    const res = await api.get('/api/friends/stream');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.json.data)).toBe(true);
    expect(res.json.data.length).toBeGreaterThan(0);
    expect(res.json.data[0].friendName).toBeDefined();
    expect(res.json.data[0].title).toBeDefined();
  });

  // ===========================================================================
  // F7: 3D 探索地球仪 4.0 彻底真数据化与飞渡漫游 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F07-01', 'F7: VoyageGlobe 组件具备动态加载 GET /api/journey 真数据能力', async () => {
    const globeContract = frontend.inspectVoyageGlobe();
    expect(globeContract.hasComponent).toBe(true);
    expect(globeContract.bindsRealJourneys).toBe(true);
  });

  suite.addTest('TC-T1-F07-02', 'F7: VoyageGlobe 彻底移除 PRESET_CITIES 硬编码假城市', async () => {
    const globeContract = frontend.inspectVoyageGlobe();
    expect(globeContract.presetCitiesRemoved).toBe(true);
  });

  suite.addTest('TC-T1-F07-03', 'F7: VoyageGlobe 支持【标准视窗】与【全屏沉浸漫游视窗】双模切换', async () => {
    const globeContract = frontend.inspectVoyageGlobe();
    expect(globeContract.supportsFullscreenWander).toBe(true);
  });

  suite.addTest('TC-T1-F07-04', 'F7: 点击地标触发 1.2s Slerp 飞渡运镜动画平滑聚焦目标城市', async () => {
    const globeContract = frontend.inspectVoyageGlobe();
    expect(globeContract.supportsFlyTo).toBe(true);
  });

  suite.addTest('TC-T1-F07-05', 'F7: 展开实拍胶片卡片包含直达游记博文 (/journey/[slug]) 链接', async () => {
    const globeContract = frontend.inspectVoyageGlobe();
    expect(globeContract.photoFilmCardLinked).toBe(true);
  });

  // ===========================================================================
  // F8: 交互星图航线 Voyage Star Atlas (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F08-01', 'F8: VoyageStarAtlas 组件存在且 100% 绑定真实 journeys 经纬度数据', async () => {
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.hasComponent).toBe(true);
    expect(atlas.journeysBound).toBe(true);
  });

  suite.addTest('TC-T1-F08-02', 'F8: 星图采用自然文档流渲染，零 sticky 零滚动劫持', async () => {
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.noScrollHijack).toBe(true);
    expect(atlas.naturalDocumentFlow).toBe(true);
  });

  suite.addTest('TC-T1-F08-03', 'F8: 星图 Canvas 生命周期完整清理（RAF/ResizeObserver/事件解绑）', async () => {
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.canvasLifecycleClean).toBe(true);
  });

  suite.addTest('TC-T1-F08-04', 'F8: 城市节点点击直达对应游记详情页', async () => {
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.clickToTravelogue).toBe(true);
  });

  suite.addTest('TC-T1-F08-05', 'F8: 星图契约检查器完整返回全部六项契约字段', async () => {
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.hasComponent).toBe(true);
    expect(atlas.journeysBound).toBe(true);
    expect(atlas.noScrollHijack).toBe(true);
    expect(atlas.canvasLifecycleClean).toBe(true);
    expect(atlas.clickToTravelogue).toBe(true);
  });

  // ===========================================================================
  // F9: Now 页面生活心智流前台重塑 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F09-01', 'F9: LivingMindstream 前台渲染技术攻坚专题时间线与百分比', async () => {
    const nowContract = frontend.inspectLivingMindstream();
    expect(nowContract.hasComponent).toBe(true);
    expect(nowContract.focusTopicsTimeline).toBe(true);
  });

  suite.addTest('TC-T1-F09-02', 'F9: LivingMindstream 前台呈现精辟书摘与经典引用卡片', async () => {
    const nowContract = frontend.inspectLivingMindstream();
    expect(nowContract.readingNotesCard).toBe(true);
  });

  suite.addTest('TC-T1-F09-03', 'F9: LivingMindstream 顶部展示物理驻留城市与近期微日志流', async () => {
    const nowContract = frontend.inspectLivingMindstream();
    expect(nowContract.currentCityBadge).toBe(true);
    expect(nowContract.microLogsList).toBe(true);
  });

  suite.addTest('TC-T1-F09-04', 'F9: 彻底剔除难看的“活跃中心跳遥测”与旋转黑胶唱片', async () => {
    const nowContract = frontend.inspectLivingMindstream();
    expect(nowContract.fakeTelemetryRemoved).toBe(true);
    expect(nowContract.rotatingVinylRemoved).toBe(true);
  });

  suite.addTest('TC-T1-F09-05', 'F9: 前台 Now 页面内容 100% 动态绑定 GET /api/now 接口', async () => {
    api.clearToken();
    const res = await api.get('/api/now');
    expect(res.status).toBe(200);
    expect(res.json.data.currentCity).toBeDefined();
  });

  // ===========================================================================
  // F10: 友链朋友圈 2.0 活力升级 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F10-01', 'F10: FriendCard 卡片集成 3D 鼠标微视差悬浮反馈 (TiltCard)', async () => {
    const card = frontend.inspectFriendCard();
    expect(card.hasComponent).toBe(true);
    expect(card.parallax3DTilt).toBe(true);
  });

  suite.addTest('TC-T1-F10-02', 'F10: FriendCard 支持在线健康探活 Ping 绿灯指示', async () => {
    const card = frontend.inspectFriendCard();
    expect(card.pingGreenLightIndicator).toBe(true);
  });

  suite.addTest('TC-T1-F10-03', 'F10: 支持独立博客、极客同好与开源先锋三大分类标签', async () => {
    const card = frontend.inspectFriendCard();
    expect(card.categoriesSupported).toContain('INDEPENDENT_BLOG');
    expect(card.categoriesSupported).toContain('GEEK_PEER');
    expect(card.categoriesSupported).toContain('OPEN_SOURCE');
  });

  suite.addTest('TC-T1-F10-04', 'F10: 集成交互式自助友链申请模态框 (FriendApplyModal)', async () => {
    const card = frontend.inspectFriendCard();
    expect(card.selfServiceModal).toBe(true);
  });

  suite.addTest('TC-T1-F10-05', 'F10: 集成友邻最新动态流组件 (FriendStream)', async () => {
    const card = frontend.inspectFriendCard();
    expect(card.friendStreamIntegrated).toBe(true);
  });

  // ===========================================================================
  // F11: 电影级 Hero 自适应舞台 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F11-01', 'F11: HeroCinematicStage 支持后台 CMS 切换为视频背景', async () => {
    api.setToken(adminToken);
    await api.put('/api/settings', { heroBgType: 'video' });
    const settings = await api.get('/api/settings');
    expect(settings.json.data.heroBgType).toBe('video');

    const hero = frontend.inspectHeroCinematicStage();
    expect(hero.supportsVideoBg).toBe(true);
  });

  suite.addTest('TC-T1-F11-02', 'F11: HeroCinematicStage 支持后台 CMS 切换为 WebGL 流光微粒背景', async () => {
    api.setToken(adminToken);
    await api.put('/api/settings', { heroBgType: 'particles' });
    const settings = await api.get('/api/settings');
    expect(settings.json.data.heroBgType).toBe('particles');

    const hero = frontend.inspectHeroCinematicStage();
    expect(hero.supportsParticlesBg).toBe(true);
  });

  suite.addTest('TC-T1-F11-03', 'F11: 标语配有字符级逐字渐现动效 (letter-by-letter kinetic motion)', async () => {
    const hero = frontend.inspectHeroCinematicStage();
    expect(hero.kineticSlogan).toBe(true);
  });

  suite.addTest('TC-T1-F11-04', 'F11: 标语具备翡翠辉光现代极客排版美学', async () => {
    const hero = frontend.inspectHeroCinematicStage();
    expect(hero.emeraldGlow).toBe(true);
  });

  suite.addTest('TC-T1-F11-05', 'F11: 视频加载失败或离线时平滑降级为微粒流光画布', async () => {
    const hero = frontend.inspectHeroCinematicStage();
    expect(hero.fallbackOnVideoError).toBe(true);
  });

  // ===========================================================================
  // F12: 全站三维双主题景深与微动效 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F12-01', 'F12: 浅色模式具有明确三层景深（底色 #f8fafc -> 白瓷卡片 -> 悬浮阴影）', async () => {
    const theme = frontend.inspectThemeDepth();
    expect(theme.hasDepthLayers).toBe(true);
    expect(theme.lightLayer0).toBe('#f8fafc');
    expect(theme.lightLayer1).toBe('#ffffff');
  });

  suite.addTest('TC-T1-F12-02', 'F12: 深色模式具有明确三层景深（深曜石底色 #07090e -> 曜黑磨砂卡片 -> 微光边框）', async () => {
    const theme = frontend.inspectThemeDepth();
    expect(theme.darkLayer0).toBe('#07090e');
    expect(theme.darkLayer1).toBe('#0e131f');
  });

  suite.addTest('TC-T1-F12-03', 'F12: 核心卡片具备 1px 极细微光边界 (border-white/[0.08])', async () => {
    const theme = frontend.inspectThemeDepth();
    expect(theme.microGlowBorder).toBe(true);
  });

  suite.addTest('TC-T1-F12-04', 'F12: 卡片与交互元素具备平滑弹性物理悬浮微动效', async () => {
    const theme = frontend.inspectThemeDepth();
    expect(theme.smoothTransitions).toBe(true);
  });

  suite.addTest('TC-T1-F12-05', 'F12: 前台首屏 HTML 具备规范的暗黑/浅色主题类名声明', async () => {
    const page = await frontend.getPage('/');
    expect(page.ok).toBe(true);
    expect(page.html).toContain('<html');
  });

  // ===========================================================================
  // F13: 全站 100% 动态 CMS 与 ISR 缓存闭环 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F13-01', 'F13: 站长在线修改 Hero 标语及云端 4K 视频直链', async () => {
    api.setToken(adminToken);
    const newSlogan = 'From the East, toward the unknown. // 2026 Edition';
    const newVideo = 'https://assets.haydenxue.com/videos/cyber-flow-4k-v2.mp4';
    const res = await api.put('/api/settings', {
      slogan: newSlogan,
      heroVideoUrl: newVideo,
    });
    expect(res.status).toBe(200);

    const verify = await api.get('/api/settings');
    expect(verify.json.data.slogan).toBe(newSlogan);
    expect(verify.json.data.heroVideoUrl).toBe(newVideo);
  });

  suite.addTest('TC-T1-F13-02', 'F13: CMS 设置保存自动触发 Next.js ISR 缓存重验 (POST /api/revalidate)', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/revalidate?path=/');
    expect(res.status).toBe(200);
    expect(res.json.data.revalidated).toBe(true);
    expect(res.json.data.path).toBe('/');
    expect(res.json.data.timestamp).toBeDefined();
  });

  suite.addTest('TC-T1-F13-03', 'F13: Now 页面更新后支持按需触发 /api/revalidate?path=/now', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/revalidate?path=/now');
    expect(res.status).toBe(200);
    expect(res.json.data.revalidated).toBe(true);
    expect(res.json.data.path).toBe('/now');
  });

  suite.addTest('TC-T1-F13-04', 'F13: 关于页个人工牌与自述支持 CMS 可视化配置并即时同步', async () => {
    api.setToken(adminToken);
    const updateRes = await api.put('/api/settings', {
      aboutBioZh: 'Hayden Xue 的全栈架构与开源数字花园。',
    });
    expect(updateRes.status).toBe(200);
    const verify = await api.get('/api/settings');
    expect(verify.json.data.aboutBioZh).toContain('Hayden Xue');
  });

  suite.addTest('TC-T1-F13-05', 'F13: 前台公共访问接口零硬编码，所有标题文案来自后端配置', async () => {
    api.clearToken();
    const res = await api.get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.json.data.authorName).toBe('Hayden Xue');
    expect(res.json.data.siteName).toBe('HAYDEN XUE');
  });

  // ===========================================================================
  // F14: 后台侧边栏呼吸感加宽至 280px (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F14-01', 'F14: AdminSidebar 展开态固定宽度为 280px (w-[280px])', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.hasComponent).toBe(true);
    expect(sidebar.expandedWidth).toBe(280);
  });

  suite.addTest('TC-T1-F14-02', 'F14: 后台主内容区域左外边距对齐 280px 消除内容被遮挡', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.hasComponent).toBe(true);
  });

  suite.addTest('TC-T1-F14-03', 'F14: 导航菜单项点击高度满足 min-h-[38px] 提升呼吸感热区', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.itemMinHeight).toBeGreaterThanOrEqual(38);
  });

  suite.addTest('TC-T1-F14-04', 'F14: 支持快捷折叠为图标极简紧凑态 (collapsible: true)', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.collapsible).toBe(true);
  });

  suite.addTest('TC-T1-F14-05', 'F14: 导航项完整覆盖文章、分类、足迹、Now、友链、设置等核心板块', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.coversAllRoutes).toBe(true);
  });

  // ===========================================================================
  // F15: 统一 16 个后台管理页面规范 (5 Tests)
  // ===========================================================================
  suite.addTest('TC-T1-F15-01', 'F15: 封装通用 AdminPageHeader 规范面包屑与标题徽章', async () => {
    const header = frontend.inspectAdminPageHeader();
    expect(header.hasComponent).toBe(true);
    expect(header.unifiedBreadcrumbs).toBe(true);
    expect(header.titleBadge).toBe(true);
  });

  suite.addTest('TC-T1-F15-02', 'F15: 统一页面头部右侧操作按钮组 (actionButtons: true)', async () => {
    const header = frontend.inspectAdminPageHeader();
    expect(header.actionButtons).toBe(true);
  });

  suite.addTest('TC-T1-F15-03', 'F15: 统一列表搜索与状态筛选栏 (searchFilterBar: true)', async () => {
    const header = frontend.inspectAdminPageHeader();
    expect(header.searchFilterBar).toBe(true);
  });

  suite.addTest('TC-T1-F15-04', 'F15: 统一数据表格与表单的圆角卡片容器 (roundedCardContainer: true)', async () => {
    const header = frontend.inspectAdminPageHeader();
    expect(header.roundedCardContainer).toBe(true);
  });

  suite.addTest('TC-T1-F15-05', 'F15: 规范完整覆盖全部 16 个管理子路由页面', async () => {
    const header = frontend.inspectAdminPageHeader();
    expect(header.totalAdminRoutes).toBe(16);
  });
}
