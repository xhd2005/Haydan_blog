// e2e/tiers/tier3-cross-feature.mjs
import { ApiClient, FrontendClient } from '../utils/client.mjs';
import { expect } from '../utils/assertions.mjs';
import { config, createRandomId } from '../config.mjs';

export function registerTier3Tests(harness) {
  const suite = harness.createSuite('Tier 3: 跨功能端到端联动测试 (Cross-Feature Integration)', 'Tier 3');
  const api = new ApiClient();
  const frontend = new FrontendClient();

  let adminToken = null;
  let readerToken = null;

  suite.addTest('TC-T3-PREP', '前置准备：登录站长与读者账号以建立联动测试上下文', async () => {
    const adminRes = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.json.data.accessToken;

    const username = createRandomId('t3_reader');
    const registerRes = await api.post('/api/auth/register', {
      username,
      password: config.readerDefaults.password,
      nickname: `读者_${username}`,
      email: `${username}@${config.readerDefaults.emailDomain}`,
    });
    expect(registerRes.status).toBe(200);
    readerToken = registerRes.json.data.accessToken;
  });

  // TC-T3-01: MinIO 云存储 -> 电影级 Hero 视频背景联动
  suite.addTest('TC-T3-01', 'MinIO 云存储 -> 电影级 Hero 视频背景联动 (F1 + F2 + F3 + F11)', async () => {
    api.setToken(adminToken);
    // 1. Switch to MinIO
    await api.put('/api/settings', { storageType: 'MINIO' });

    // 2. Upload video with MP4 magic numbers
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
    ]);
    const uploadRes = await api.upload('/api/media/upload', {
      buffer: mp4Header,
      filename: 'hero-4k-loop.mp4',
      contentType: 'video/mp4',
    });
    expect(uploadRes.status).toBe(200);
    const videoUrl = uploadRes.json.data.url;
    expect(uploadRes.json.data.storageType).toBe('MINIO');

    // 3. Set heroVideoUrl in CMS
    await api.put('/api/settings', { heroBgType: 'video', heroVideoUrl: videoUrl });

    // 4. Verify public settings reflect the new cloud video
    api.clearToken();
    const settings = await api.get('/api/settings');
    expect(settings.json.data.heroBgType).toBe('video');
    expect(settings.json.data.heroVideoUrl).toBe(videoUrl);
  });

  // TC-T3-02: 读者自助申请友链 -> 站长审核过审 -> 友链流聚合展示
  suite.addTest('TC-T3-02', '读者自助申请友链 -> 站长审核过审 -> 友链流与健康指示展示 (F6 + F10)', async () => {
    // 1. Reader applies via public API
    api.clearToken();
    const applicantUrl = `https://peer-${Date.now()}.org`;
    const applyRes = await api.post('/api/friends/apply', {
      name: '开源先锋圈',
      url: applicantUrl,
      avatar: 'https://assets.haydenxue.com/avatar/peer.png',
      description: '下一代云原生工具链',
      category: 'OPEN_SOURCE',
    });
    expect(applyRes.status).toBe(200);
    const friendId = applyRes.json.data.id;
    expect(applyRes.json.data.status).toBe('PENDING');

    // 2. Public friends list does not yet contain it
    const publicBefore = await api.get('/api/friends');
    expect(publicBefore.json.data.find(f => f.id === friendId)).toBeUndefined();

    // 3. Admin audits and approves
    api.setToken(adminToken);
    const auditRes = await api.put(`/api/friends/${friendId}/status`, { status: 'ACTIVE' });
    expect(auditRes.status).toBe(200);

    // 4. Public list now displays it as ACTIVE and ONLINE
    api.clearToken();
    const publicAfter = await api.get('/api/friends');
    const approvedItem = publicAfter.json.data.find(f => f.id === friendId);
    expect(approvedItem).toBeDefined();
    expect(approvedItem.status).toBe('ACTIVE');
    expect(approvedItem.pingStatus).toBe('ONLINE');
  });

  // TC-T3-03: 动态 CMS 内容更新 -> Next.js ISR 缓存失效 -> 前台首屏秒开呈现
  suite.addTest('TC-T3-03', '动态 CMS 内容更新 -> Next.js ISR 缓存失效 -> 前台首屏秒开呈现 (F13 + F11)', async () => {
    api.setToken(adminToken);
    const updatedSlogan = 'From the East, toward the unknown. // ISR Revalidated';
    await api.put('/api/settings', { slogan: updatedSlogan });

    // Trigger ISR revalidation
    const revRes = await api.post('/api/revalidate?path=/');
    expect(revRes.status).toBe(200);
    expect(revRes.json.data.revalidated).toBe(true);

    // Public fetch verifies immediately without server reboot
    api.clearToken();
    const settings = await api.get('/api/settings');
    expect(settings.json.data.slogan).toBe(updatedSlogan);
  });

  // TC-T3-04: 真实旅行足迹入库 -> 3D 地球仪地标联动 -> 游记博文直达
  suite.addTest('TC-T3-04', '真实旅行足迹入库 -> 3D 地球仪地标联动 -> 游记博文直达 (F4 + F7)', async () => {
    api.setToken(adminToken);
    // 1. Admin creates a real journey footprint
    const newSlug = `chengdu-teahouse-${Date.now()}`;
    const journeyRes = await api.post('/api/journey', {
      title: '成都·锦里古街与盖碗茶香',
      city: 'Chengdu',
      lat: 30.5728,
      lon: 104.0668,
      slug: newSlug,
      cover: 'https://images.unsplash.com/photo-chengdu.jpg',
      description: '在锦里老街品一杯蒙顶甘露，体悟慢节奏生活中的研发智慧。',
    });
    expect(journeyRes.status).toBe(200);

    // 2. Public journey list contains the new city
    api.clearToken();
    const listRes = await api.get('/api/journey');
    const chengdu = listRes.json.data.find(j => j.city === 'Chengdu');
    expect(chengdu).toBeDefined();

    // 3. Globe inspection confirms real footprint data binding
    const globe = frontend.inspectVoyageGlobe();
    expect(globe.bindsRealJourneys).toBe(true);

    // 4. Detail page URL resolves
    const detailRes = await api.get(`/api/journey/${newSlug}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.json.data.city).toBe('Chengdu');
  });

  // TC-T3-05: 站长更新 Now 生活心智手记 -> 数字看板心智流同步 -> 前台 HUD 实时生效
  suite.addTest('TC-T3-05', '站长更新 Now 生活心智手记 -> 数字看板心智流同步 -> 前台 HUD 实时生效 (F5 + F8 + F9)', async () => {
    api.setToken(adminToken);
    const newTopics = JSON.stringify([
      { title: '企业级虚拟线程高并发架构', progress: 99, tag: 'Java21' },
      { title: 'Three.js 4.0 空间漫游视窗', progress: 92, tag: 'Creative' },
    ]);
    const updateRes = await api.put('/api/now', {
      currentCity: 'Shenzhen',
      focusTopicsJson: newTopics,
    });
    expect(updateRes.status).toBe(200);

    // Public fetch matches
    api.clearToken();
    const nowRes = await api.get('/api/now');
    expect(nowRes.json.data.currentCity).toBe('Shenzhen');
    expect(nowRes.json.data.focusTopicsJson).toBe(newTopics);

    // StarAtlas and LivingMindstream components bind real data
    const atlas = frontend.inspectStarAtlas();
    const mindstream = frontend.inspectLivingMindstream();
    expect(atlas.journeysBound).toBe(true);
    expect(mindstream.focusTopicsTimeline).toBe(true);
  });

  // TC-T3-06: 存储策略切换 (Local <-> MinIO) 与媒体库跨存储混合生命周期一致性
  suite.addTest('TC-T3-06', '存储策略切换与媒体库跨存储混合生命周期一致性 (F1 + F2)', async () => {
    api.setToken(adminToken);
    // 1. Upload in LOCAL mode
    await api.put('/api/settings', { storageType: 'LOCAL' });
    const localPng = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const localUpload = await api.upload('/api/media/upload', {
      buffer: localPng,
      filename: 'local-asset.png',
      contentType: 'image/png',
    });
    expect(localUpload.json.data.storageType).toBe('LOCAL');

    // 2. Upload in MINIO mode
    await api.put('/api/settings', { storageType: 'MINIO' });
    const minioPng = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const minioUpload = await api.upload('/api/media/upload', {
      buffer: minioPng,
      filename: 'minio-asset.png',
      contentType: 'image/png',
    });
    expect(minioUpload.json.data.storageType).toBe('MINIO');

    // 3. Media list safely contains both storage types
    const mediaList = await api.get('/api/media');
    const localItem = mediaList.json.data.records.find(m => m.id === localUpload.json.data.id);
    const minioItem = mediaList.json.data.records.find(m => m.id === minioUpload.json.data.id);
    expect(localItem.storageType).toBe('LOCAL');
    expect(minioItem.storageType).toBe('MINIO');
  });

  // TC-T3-07: 全站双主题层级美学与 3D 画布环境光晕自适应
  suite.addTest('TC-T3-07', '全站双主题层级美学与 3D 画布环境光晕自适应 (F12 + F7 + F8)', async () => {
    const theme = frontend.inspectThemeDepth();
    const globe = frontend.inspectVoyageGlobe();
    const atlas = frontend.inspectStarAtlas();

    expect(theme.hasDepthLayers).toBe(true);
    expect(theme.microGlowBorder).toBe(true);
    expect(globe.hasComponent).toBe(true);
    expect(atlas.hasComponent).toBe(true);
  });

  // TC-T3-08: 280px Studio 侧边栏导航与 16 个管理页面的统一 PageHeader 对齐
  suite.addTest('TC-T3-08', '280px Studio 侧边栏导航与 16 个管理页面的统一 PageHeader 对齐 (F14 + F15)', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    const header = frontend.inspectAdminPageHeader();

    expect(sidebar.expandedWidth).toBe(280);
    expect(sidebar.itemMinHeight).toBeGreaterThanOrEqual(38);
    expect(header.totalAdminRoutes).toBe(16);
    expect(header.unifiedBreadcrumbs).toBe(true);
    expect(header.roundedCardContainer).toBe(true);
  });

  // TC-T3-09: 友链在线探活状态改变与后台异常提示联动
  suite.addTest('TC-T3-09', '友链在线探活状态改变与后台管理视图联动 (F6 + F10)', async () => {
    api.setToken(adminToken);
    const allFriends = await api.get('/api/friends/admin');
    expect(allFriends.status).toBe(200);
    const firstFriend = allFriends.json.data[0];
    expect(firstFriend.pingStatus).toBeDefined();
  });

  // TC-T3-10: 读者点赞足迹博文 -> 个人中心互动列表 -> 管理看板热度统计
  suite.addTest('TC-T3-10', '读者点赞足迹博文 -> 个人中心互动列表 -> 管理看板热度统计 (F4 + F8)', async () => {
    api.setToken(readerToken);
    // Like post 1
    const likeRes = await api.post('/api/posts/1/like');
    expect(likeRes.status).toBe(200);

    // Check reader's personal center likes
    const myLikes = await api.get('/api/likes/my');
    expect(myLikes.status).toBe(200);
    expect(myLikes.json.data.records.length).toBeGreaterThan(0);

    // Check admin overview dashboard reflects interactions
    api.setToken(adminToken);
    const overview = await api.get('/api/admin/analytics/overview');
    expect(overview.status).toBe(200);
    expect(overview.json.data.todayPv).toBeGreaterThan(0);
  });
}
