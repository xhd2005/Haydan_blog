// e2e/tiers/tier4-real-scenarios.mjs
import { ApiClient, FrontendClient } from '../utils/client.mjs';
import { expect } from '../utils/assertions.mjs';
import { config, createRandomId } from '../config.mjs';

export function registerTier4Tests(harness) {
  const suite = harness.createSuite('Tier 4: 真实业务场景全链路测试 (Real-World Scenarios)', 'Tier 4');
  const api = new ApiClient();
  const frontend = new FrontendClient();

  // TC-T4-01: 读者全生命周期探索旅程
  suite.addTest('TC-T4-01', '读者端到端旅程：首页 Hero 视觉 -> 3D 地球仪探索足迹 -> 阅读游记 -> 自助申请友链', async () => {
    // 1. Visitor browses home page
    const page = await frontend.getPage('/');
    expect(page.ok).toBe(true);

    // 2. Explore 3D Globe footprints
    api.clearToken();
    const journeysRes = await api.get('/api/journey');
    expect(journeysRes.status).toBe(200);
    expect(journeysRes.json.data.length).toBeGreaterThanOrEqual(7);

    // 3. Read specific travel journey
    const journeySlug = journeysRes.json.data[0].slug;
    const detailRes = await api.get(`/api/journey/${journeySlug}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.json.data.title).toBeDefined();

    // 4. Reader registers account
    const username = createRandomId('reader_journey');
    const registerRes = await api.post('/api/auth/register', {
      username,
      password: config.readerDefaults.password,
      nickname: '漫游探索者',
      email: `${username}@${config.readerDefaults.emailDomain}`,
    });
    expect(registerRes.status).toBe(200);
    const token = registerRes.json.data.accessToken;

    // 5. Submit friend link application
    api.setToken(token);
    const applyRes = await api.post('/api/friends/apply', {
      name: '漫游者小站',
      url: `https://wanderer-${Date.now()}.blog`,
      avatar: 'https://assets.haydenxue.com/avatar/wanderer.png',
      description: '游记博文与数字探索笔记',
      category: 'INDEPENDENT_BLOG',
    });
    expect(applyRes.status).toBe(200);
    expect(applyRes.json.data.status).toBe('PENDING');
  });

  // TC-T4-02: 站长高阶创作与运营全链路
  suite.addTest('TC-T4-02', '站长完整运营流程：280px 控制台 -> MinIO 连通性测试 -> 上传 4K 视频 -> ISR 缓存刷新', async () => {
    // 1. Admin login
    const loginRes = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    expect(loginRes.status).toBe(200);
    const adminToken = loginRes.json.data.accessToken;
    api.setToken(adminToken);

    // 2. Check 280px sidebar layout
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.expandedWidth).toBe(280);

    // 3. Test MinIO connection
    const testMinio = await api.post('/api/settings/test-minio', {
      endpoint: 'https://minio.haydenxue.com',
      bucket: 'hayden-media',
      accessKey: 'hayden-admin',
      secretKey: 'm!nI0_S3cr3t_2026',
    });
    expect(testMinio.status).toBe(200);
    expect(testMinio.json.data.success).toBe(true);

    // 4. Switch to MinIO storage
    await api.put('/api/settings', { storageType: 'MINIO' });

    // 5. Upload 4K loop video
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
    ]);
    const uploadRes = await api.upload('/api/media/upload', {
      buffer: mp4Header,
      filename: 'hero-4k-cyber.mp4',
      contentType: 'video/mp4',
    });
    expect(uploadRes.status).toBe(200);
    const cloudVideoUrl = uploadRes.json.data.url;

    // 6. Set Hero background in CMS
    await api.put('/api/settings', {
      heroBgType: 'video',
      heroVideoUrl: cloudVideoUrl,
    });

    // 7. Trigger ISR revalidation
    const revalRes = await api.post('/api/revalidate?path=/');
    expect(revalRes.status).toBe(200);
    expect(revalRes.json.data.revalidated).toBe(true);
  });

  // TC-T4-03: 数字花园心智流与技术雷达深度探索
  suite.addTest('TC-T4-03', '数字花园心智探索旅程：Now 心智流 -> 技术雷达攻坚进度 -> 经典书摘阅读', async () => {
    api.clearToken();
    // 1. Fetch Now mindstream
    const nowRes = await api.get('/api/now');
    expect(nowRes.status).toBe(200);
    expect(nowRes.json.data.currentCity).toBeDefined();

    // 2. Parse focus topics
    const topics = JSON.parse(nowRes.json.data.focusTopicsJson);
    expect(Array.isArray(topics)).toBe(true);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].title).toBeDefined();
    expect(topics[0].progress).toBeDefined();

    // 3. Parse reading notes
    const notes = JSON.parse(nowRes.json.data.readingNotesJson);
    expect(Array.isArray(notes)).toBe(true);
    expect(notes[0].bookTitle).toBeDefined();
    expect(notes[0].quote).toBeDefined();

    // 4. Verify Voyage Star Atlas contract
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.hasComponent).toBe(true);
    expect(atlas.journeysBound).toBe(true);
  });

  // TC-T4-04: 友链朋友圈互动与在线健康探活闭环
  suite.addTest('TC-T4-04', '友链朋友圈互动闭环：3D 微视差名片 -> 在线探活指示灯 -> 自助申请 -> 站长审核过审', async () => {
    // 1. Card contract
    const card = frontend.inspectFriendCard();
    expect(card.parallax3DTilt).toBe(true);
    expect(card.pingGreenLightIndicator).toBe(true);

    // 2. Reader submits application
    api.clearToken();
    const url = `https://geek-peer-${Date.now()}.io`;
    const applyRes = await api.post('/api/friends/apply', {
      name: '极客同好小站',
      url,
      avatar: 'https://assets.haydenxue.com/avatar/peer.png',
      description: '全栈开发与系统内核',
      category: 'GEEK_PEER',
    });
    expect(applyRes.status).toBe(200);
    const friendId = applyRes.json.data.id;

    // 3. Admin login and approve
    const adminRes = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    api.setToken(adminRes.json.data.accessToken);

    const approveRes = await api.put(`/api/friends/${friendId}/status`, { status: 'ACTIVE' });
    expect(approveRes.status).toBe(200);

    // 4. Public list displays active friend with health green indicator
    api.clearToken();
    const publicList = await api.get('/api/friends');
    const item = publicList.json.data.find(f => f.id === friendId);
    expect(item).toBeDefined();
    expect(item.pingStatus).toBe('ONLINE');
  });

  // TC-T4-05: 全站双主题沉浸式漫游体验
  suite.addTest('TC-T4-05', '全站双主题沉浸式漫游：深曜石与白瓷模式切换 -> 三维景深对比 -> 光斑微光渲染', async () => {
    const theme = frontend.inspectThemeDepth();
    expect(theme.hasDepthLayers).toBe(true);
    expect(theme.lightLayer0).toBe('#f8fafc');
    expect(theme.lightLayer1).toBe('#ffffff');
    expect(theme.darkLayer0).toBe('#07090e');
    expect(theme.darkLayer1).toBe('#0e131f');
    expect(theme.microGlowBorder).toBe(true);

    const page = await frontend.getPage('/');
    expect(page.ok).toBe(true);
  });

  // TC-T4-06: 系统全域安全与渗透防御闭环
  suite.addTest('TC-T4-06', '系统全域安全防御闭环：隐蔽式入口扫描 -> 恶意文件拦截 -> 垂直越权 403 -> 敏感密钥脱敏', async () => {
    // 1. Verify no exposed CMS links in public HTML
    const homePage = await frontend.getPage('/');
    if (homePage.ok && homePage.html) {
      const exposed = frontend.detectExposedAdminLinks(homePage.html);
      expect(exposed.length).toBe(0);
    }

    // 2. Malicious upload is blocked
    const adminRes = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    api.setToken(adminRes.json.data.accessToken);

    const exploitBuffer = Buffer.from('<script>alert("hacked")</script>');
    const uploadRes = await api.upload('/api/media/upload', {
      buffer: exploitBuffer,
      filename: 'exploit.html',
      contentType: 'text/html',
    });
    expect(uploadRes.status).toBe(400);

    // 3. Reader cannot write to admin settings (vertical privilege escalation blocked)
    const readerRes = await api.post('/api/auth/register', {
      username: createRandomId('hacker'),
      password: config.readerDefaults.password,
      nickname: '黑客',
      email: `${createRandomId('hacker')}@example.com`,
    });
    api.setToken(readerRes.json.data.accessToken);

    const escalRes = await api.put('/api/settings', { siteName: 'HACKED' });
    expect(escalRes.status).toBe(403);

    // 4. Secret key desensitized
    const publicSettings = await api.get('/api/settings');
    expect(publicSettings.json.data.minioSecretKey).toBeNull();
  });
}
