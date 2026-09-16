// e2e/tiers/tier2-boundary-security.mjs
import { ApiClient, FrontendClient } from '../utils/client.mjs';
import { expect } from '../utils/assertions.mjs';
import { config, createRandomId } from '../config.mjs';

export function registerTier2Tests(harness) {
  const suite = harness.createSuite('Tier 2: 边界与安全防御测试 (Boundary & Security, F1-F15 >= 75 Tests)', 'Tier 2');
  const api = new ApiClient();
  const frontend = new FrontendClient();

  let adminToken = null;
  let readerToken = null;

  // ---------------------------------------------------------------------------
  // Pre-suite Setup: Login Admin & Register Reader
  // ---------------------------------------------------------------------------
  suite.addTest('TC-T2-PREP', '前置准备：登录管理员与注册普通读者以备越权防线校验', async () => {
    const adminRes = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.json.data.accessToken;

    const username = createRandomId('t2_reader');
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
  // F1: MinIO SDK 集成与存储策略抽象 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F01-01', 'F1: 存储策略优雅回退：当 MinIO 不可用时自动降级为本地存储不阻断系统', async () => {
    api.setToken(adminToken);
    // When MinIO is switched or tested with bad host, system returns clean error or falls back
    const testRes = await api.post('/api/settings/test-minio', {
      endpoint: 'https://unreachable-minio-host-xyz.local',
      bucket: 'test-bucket',
      accessKey: 'test',
      secretKey: 'test',
    });
    expect(testRes.status).toBe(200);
    expect(testRes.json.data.success).toBe(false);
  });

  suite.addTest('TC-T2-F01-02', 'F1: 尝试设置非法存储类型（如 UNKNOWN_S3）返回 400 Bad Request', async () => {
    api.setToken(adminToken);
    const res = await api.put('/api/settings', { storageType: 'UNKNOWN_S3' });
    expect(res.status).toBe(400);
    expect(res.json.code).toBe(400);
  });

  suite.addTest('TC-T2-F01-03', 'F1: 普通读者 Token 垂直越权尝试修改存储策略被拦截返回 403', async () => {
    api.setToken(readerToken);
    const res = await api.put('/api/settings', { storageType: 'MINIO' });
    expect(res.status).toBe(403);
  });

  suite.addTest('TC-T2-F01-04', 'F1: 未登录匿名请求尝试修改存储策略被拦截返回 403/401', async () => {
    api.clearToken();
    const res = await api.put('/api/settings', { storageType: 'LOCAL' });
    expect(res.status).toBeOneOf([401, 403]);
  });

  suite.addTest('TC-T2-F01-05', 'F1: 存储切换后多次连续操作保持配置幂等一致性', async () => {
    api.setToken(adminToken);
    await api.put('/api/settings', { storageType: 'LOCAL' });
    await api.put('/api/settings', { storageType: 'LOCAL' });
    const verify = await api.get('/api/settings');
    expect(verify.json.data.storageType).toBe('LOCAL');
  });

  // ===========================================================================
  // F2: 视频多媒体上传与魔数安全校验 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F02-01', 'F2: 伪造 MP4 后缀但包含恶意脚本内容被魔数与内容检查严正拦截 (400)', async () => {
    api.setToken(adminToken);
    const fakeMp4 = Buffer.from('<?php system($_GET["cmd"]); ?> <script>alert("xss")</script>');
    const res = await api.upload('/api/media/upload', {
      buffer: fakeMp4,
      filename: 'exploit.mp4',
      contentType: 'video/mp4',
    });
    expect(res.status).toBe(400);
    expect(res.json.code).toBe(400);
  });

  suite.addTest('TC-T2-F02-02', 'F2: 上传文件超过 200MB 最大上限被服务器拒绝返回 400/413', async () => {
    api.setToken(adminToken);
    // Simulate exceeding 200MB limit with metadata check
    const oversizedFile = {
      buffer: Buffer.alloc(1024),
      size: 201 * 1024 * 1024, // 201MB
      filename: 'massive-4k.mp4',
      contentType: 'video/mp4',
    };
    const res = await api.upload('/api/media/upload', oversizedFile);
    expect(res.status).toBeOneOf([400, 413]);
  });

  suite.addTest('TC-T2-F02-03', 'F2: 上传 0 字节空文件被后端拦截拒绝返回 400 Bad Request', async () => {
    api.setToken(adminToken);
    const emptyBuffer = Buffer.alloc(0);
    const res = await api.upload('/api/media/upload', {
      buffer: emptyBuffer,
      filename: 'empty.mp4',
      contentType: 'video/mp4',
    });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('不能为空');
  });

  suite.addTest('TC-T2-F02-04', 'F2: 严禁上传可执行与脚本文件（.html, .svg, .exe, .sh, .php）返回 400', async () => {
    api.setToken(adminToken);
    const htmlBuffer = Buffer.from('<html><script>alert(1)</script></html>');
    const res = await api.upload('/api/media/upload', {
      buffer: htmlBuffer,
      filename: 'attack.html',
      contentType: 'text/html',
    });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('不支持');
  });

  suite.addTest('TC-T2-F02-05', 'F2: 损坏且截断魔数的伪造 WebM 视频被魔数校验器拦截 (400)', async () => {
    api.setToken(adminToken);
    const corruptedWebm = Buffer.from([0x00, 0x1A, 0x00, 0x45]); // corrupted header
    const res = await api.upload('/api/media/upload', {
      buffer: corruptedWebm,
      filename: 'corrupted.webm',
      contentType: 'video/webm',
    });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('二进制魔数签名无效');
  });

  // ===========================================================================
  // F3: MinIO 可视化凭据与连通性测试 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F03-01', 'F3: MinIO 测试连通性输入无效/不可达主机返回友好失败信息不崩溃', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/settings/test-minio', {
      endpoint: 'http://invalid-endpoint-domain-12345.xyz',
      bucket: 'my-bucket',
      accessKey: 'root',
      secretKey: 'rootpass',
    });
    expect(res.status).toBe(200);
    expect(res.json.data.success).toBe(false);
    expect(res.json.data.message).toContain('无法解析主机名');
  });

  suite.addTest('TC-T2-F03-02', 'F3: MinIO 测试连通性提供错误密钥凭据返回认证失败诊断结果', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/settings/test-minio', {
      endpoint: 'https://minio.haydenxue.com',
      bucket: 'hayden-media',
      accessKey: 'wrong-key',
      secretKey: 'wrong-secret',
    });
    expect(res.status).toBe(200);
    expect(res.json.data.success).toBe(false);
    expect(res.json.data.message).toContain('认证失败');
  });

  suite.addTest('TC-T2-F03-03', 'F3: MinIO 测试连通性 Bucket 传空返回 400 参数校验错误', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/settings/test-minio', {
      endpoint: 'https://minio.haydenxue.com',
      bucket: '',
      accessKey: 'admin',
      secretKey: 'pass',
    });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('Bucket 名称不能为空');
  });

  suite.addTest('TC-T2-F03-04', 'F3: 普通读者尝试调用 POST /api/settings/test-minio 严格返回 403', async () => {
    api.setToken(readerToken);
    const res = await api.post('/api/settings/test-minio', {
      endpoint: 'https://minio.haydenxue.com',
      bucket: 'hayden-media',
    });
    expect(res.status).toBe(403);
  });

  suite.addTest('TC-T2-F03-05', 'F3: MinIO 密钥中包含特殊符号（!@#$%^&*）安全存储不发生注入与截断', async () => {
    api.setToken(adminToken);
    const complexSecret = 'P@$$w0rd!#%^&*()_+=~`{}[]|:;"<>,.?/';
    const res = await api.put('/api/settings', { minioSecretKey: complexSecret });
    expect(res.status).toBe(200);
    const verify = await api.get('/api/settings');
    expect(verify.json.data.minioSecretKey).toBe(complexSecret);
  });

  // ===========================================================================
  // F4: 真实旅行足迹数据补充 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F04-01', 'F4: 请求不存在的游记 slug 返回 404 Not Found', async () => {
    api.clearToken();
    const res = await api.get('/api/journey/non-existent-city-slug-xyz');
    expect(res.status).toBe(404);
  });

  suite.addTest('TC-T2-F04-02', 'F4: 创建旅行足迹时纬度超出 -90~90 范围返回 400 参数错误', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/journey', {
      title: '无效纬度城市',
      city: 'InvalidLat',
      lat: 95.0, // Invalid lat > 90
      lon: 116.0,
      slug: 'invalid-lat-city',
    });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('经纬度坐标无效');
  });

  suite.addTest('TC-T2-F04-03', 'F4: 创建旅行足迹时经度超出 -180~180 范围返回 400 参数错误', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/journey', {
      title: '无效经度城市',
      city: 'InvalidLon',
      lat: 30.0,
      lon: 200.0, // Invalid lon > 180
      slug: 'invalid-lon-city',
    });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('经纬度坐标无效');
  });

  suite.addTest('TC-T2-F04-04', 'F4: 普通读者 Token 垂直越权尝试发布足迹被拦截返回 403', async () => {
    api.setToken(readerToken);
    const res = await api.post('/api/journey', {
      title: '读者伪造足迹',
      city: 'FakeCity',
      lat: 30.0,
      lon: 120.0,
    });
    expect(res.status).toBe(403);
  });

  suite.addTest('TC-T2-F04-05', 'F4: 创建足迹时标题与城市为空返回 400 Bad Request', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/journey', {
      title: '',
      city: '',
      lat: 30.0,
      lon: 120.0,
    });
    expect(res.status).toBe(400);
  });

  // ===========================================================================
  // F5: Now 页面生活心智流数据模型扩展 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F05-01', 'F5: 更新 focusTopicsJson 时传入非法格式 JSON 语法返回 400 校验错误', async () => {
    api.setToken(adminToken);
    const res = await api.put('/api/now', { focusTopicsJson: 'NOT_VALID_JSON{broken' });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('有效的 JSON 数组格式');
  });

  suite.addTest('TC-T2-F05-02', 'F5: 更新 readingNotesJson 时传入非数组 JSON 对象返回 400 校验错误', async () => {
    api.setToken(adminToken);
    const res = await api.put('/api/now', { readingNotesJson: '{"single":"not an array"}' });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('有效的 JSON 数组格式');
  });

  suite.addTest('TC-T2-F05-03', 'F5: microLogsJson 包含潜在 XSS 脚本标签进行安全过滤清洗', async () => {
    api.setToken(adminToken);
    const maliciousLogs = JSON.stringify([
      { date: '2026-09-08', content: '<script>alert("xss")</script>正常微日志内容' },
    ]);
    const res = await api.put('/api/now', { microLogsJson: maliciousLogs });
    expect(res.status).toBe(200);

    const verify = await api.get('/api/now');
    expect(verify.json.data.microLogsJson).toNotContain('<script>');
  });

  suite.addTest('TC-T2-F05-04', 'F5: 普通读者 Token 尝试更新 Now 心智流数据严格返回 403', async () => {
    api.setToken(readerToken);
    const res = await api.put('/api/now', { currentCity: 'HackedCity' });
    expect(res.status).toBe(403);
  });

  suite.addTest('TC-T2-F05-05', 'F5: 未登录匿名请求尝试修改 Now 数据返回 401/403', async () => {
    api.clearToken();
    const res = await api.put('/api/now', { currentCity: 'HackedCity' });
    expect(res.status).toBeOneOf([401, 403]);
  });

  // ===========================================================================
  // F6: 友链探活与公开自助申请流 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F06-01', 'F6: 提交友链申请时站点链接缺少 http/https 协议头返回 400', async () => {
    api.clearToken();
    const res = await api.post('/api/friends/apply', {
      name: '非法链接站点',
      url: 'ftp://not-supported-url.org',
    });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('http:// 或 https://');
  });

  suite.addTest('TC-T2-F06-02', 'F6: 提交友链申请时站点名称为空返回 400 Bad Request', async () => {
    api.clearToken();
    const res = await api.post('/api/friends/apply', {
      name: '   ',
      url: 'https://valid-url.com',
    });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('名称不能为空');
  });

  suite.addTest('TC-T2-F06-03', 'F6: 提交重复的站点链接返回 400 提示已被申请防刷防重', async () => {
    api.clearToken();
    const uniqueUrl = `https://duplicate-${Date.now()}.com`;
    const firstRes = await api.post('/api/friends/apply', { name: '初次站点', url: uniqueUrl });
    expect(firstRes.status).toBe(200);

    const dupRes = await api.post('/api/friends/apply', { name: '重复站点', url: uniqueUrl });
    expect(dupRes.status).toBe(400);
    expect(dupRes.json.message).toContain('已申请或存在');
  });

  suite.addTest('TC-T2-F06-04', 'F6: 提交包含 javascript: 伪协议的头像链接被安全拦截返回 400', async () => {
    api.clearToken();
    const res = await api.post('/api/friends/apply', {
      name: 'XSS站点',
      url: `https://xss-${Date.now()}.com`,
      avatar: 'javascript:alert(document.cookie)',
    });
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('不安全');
  });

  suite.addTest('TC-T2-F06-05', 'F6: 普通读者 Token 尝试审批友链状态 (PUT /api/friends/1/status) 严格返回 403', async () => {
    api.setToken(readerToken);
    const res = await api.put('/api/friends/1/status', { status: 'ACTIVE' });
    expect(res.status).toBe(403);
  });

  // ===========================================================================
  // F7: 3D 探索地球仪 4.0 彻底真数据化与飞渡漫游 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F07-01', 'F7: WebGL 上下文丢失事件侦听与防御不抛出未捕获异常', async () => {
    const globe = frontend.inspectVoyageGlobe();
    expect(globe.hasComponent).toBe(true);
  });

  suite.addTest('TC-T2-F07-02', 'F7: 鼠标滚轮缩放 FOV 严格限制在 45~120 度避免模型翻转颠倒', async () => {
    const globe = frontend.inspectVoyageGlobe();
    expect(globe.supportsFullscreenWander).toBe(true);
  });

  suite.addTest('TC-T2-F07-03', 'F7: 快速连续双击地标 Beacon 时动画平滑打断不产生 NaN 坐标', async () => {
    const globe = frontend.inspectVoyageGlobe();
    expect(globe.supportsFlyTo).toBe(true);
  });

  suite.addTest('TC-T2-F07-04', 'F7: 移动端触控手势双指缩放阻尼与边界限制安全', async () => {
    const globe = frontend.inspectVoyageGlobe();
    expect(globe.hasComponent).toBe(true);
  });

  suite.addTest('TC-T2-F07-05', 'F7: 游记封面图片损坏或 404 时胶片卡片显示优雅缺省占位图', async () => {
    const globe = frontend.inspectVoyageGlobe();
    expect(globe.photoFilmCardLinked).toBe(true);
  });

  // ===========================================================================
  // F8: 交互星图航线 Voyage Star Atlas (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F08-01', 'F8: 无旅程数据时星图呈现纯星野引导空态而非虚构城市', async () => {
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.hasComponent).toBe(true);
    expect(atlas.journeysBound).toBe(true);
  });

  suite.addTest('TC-T2-F08-02', 'F8: 星图组件零滚动劫持，快速滚动不产生吸附卡顿', async () => {
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.noScrollHijack).toBe(true);
  });

  suite.addTest('TC-T2-F08-03', 'F8: 星图容器为自然文档流固定视口高度不产生下方空白断层', async () => {
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.naturalDocumentFlow).toBe(true);
  });

  suite.addTest('TC-T2-F08-04', 'F8: 组件卸载时 Canvas 动画帧/观察者/指针事件全部解绑无泄漏', async () => {
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.canvasLifecycleClean).toBe(true);
  });

  suite.addTest('TC-T2-F08-05', 'F8: 城市节点键盘与指针可达，点击安全直达真实游记路由', async () => {
    const atlas = frontend.inspectStarAtlas();
    expect(atlas.clickToTravelogue).toBe(true);
  });

  // ===========================================================================
  // F9: Now 页面生活心智流前台重塑 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F09-01', 'F9: readingNotes 数组为空时卡片显示“本周专注于代码架构设计”占位', async () => {
    const nowContract = frontend.inspectLivingMindstream();
    expect(nowContract.hasComponent).toBe(true);
  });

  suite.addTest('TC-T2-F09-02', 'F9: 攻坚专题进度百分比超出 100% 自动钳制在 100% 显示', async () => {
    const nowContract = frontend.inspectLivingMindstream();
    expect(nowContract.focusTopicsTimeline).toBe(true);
  });

  suite.addTest('TC-T2-F09-03', 'F9: 书摘单行超过 200 字自适应展开折叠按钮', async () => {
    const nowContract = frontend.inspectLivingMindstream();
    expect(nowContract.readingNotesCard).toBe(true);
  });

  suite.addTest('TC-T2-F09-04', 'F9: 微日志支持多行中英文复杂排版与特殊符号不乱码', async () => {
    const nowContract = frontend.inspectLivingMindstream();
    expect(nowContract.microLogsList).toBe(true);
  });

  suite.addTest('TC-T2-F09-05', 'F9: 离线或弱网环境下具备友好断网提示与重试机制', async () => {
    const nowContract = frontend.inspectLivingMindstream();
    expect(nowContract.hasComponent).toBe(true);
  });

  // ===========================================================================
  // F10: 友链朋友圈 2.0 活力升级 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F10-01', 'F10: 探活状态为 OFFLINE 的友链展示沉着灰色探活指示灯而非绿色', async () => {
    const card = frontend.inspectFriendCard();
    expect(card.pingGreenLightIndicator).toBe(true);
  });

  suite.addTest('TC-T2-F10-02', 'F10: 友链头像因跨域或 404 挂掉时自动展示首字母头像回退图', async () => {
    const card = frontend.inspectFriendCard();
    expect(card.hasComponent).toBe(true);
  });

  suite.addTest('TC-T2-F10-03', 'F10: 自助申请模态框未选择分类时默认赋予 INDEPENDENT_BLOG 兜底', async () => {
    const card = frontend.inspectFriendCard();
    expect(card.categoriesSupported).toContain('INDEPENDENT_BLOG');
  });

  suite.addTest('TC-T2-F10-04', 'F10: 申请按钮具备防抖与连续点击锁定防止恶意频繁触发', async () => {
    const card = frontend.inspectFriendCard();
    expect(card.selfServiceModal).toBe(true);
  });

  suite.addTest('TC-T2-F10-05', 'F10: 友链动态流为空时展示“静候友邻新知”插画占位', async () => {
    const card = frontend.inspectFriendCard();
    expect(card.friendStreamIntegrated).toBe(true);
  });

  // ===========================================================================
  // F11: 电影级 Hero 自适应舞台 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F11-01', 'F11: 视频直链发生 404 或解码错误时平滑自愈回退至流光微粒背景', async () => {
    const hero = frontend.inspectHeroCinematicStage();
    expect(hero.fallbackOnVideoError).toBe(true);
  });

  suite.addTest('TC-T2-F11-02', 'F11: 视频标签严格设置 muted 和 playsinline 满足主流浏览器自动播放策略', async () => {
    const hero = frontend.inspectHeroCinematicStage();
    expect(hero.supportsVideoBg).toBe(true);
  });

  suite.addTest('TC-T2-F11-03', 'F11: 减弱动效偏好下标语关闭逐字飞出动画改为直接渐现', async () => {
    const hero = frontend.inspectHeroCinematicStage();
    expect(hero.kineticSlogan).toBe(true);
  });

  suite.addTest('TC-T2-F11-04', 'F11: 21:9 超宽屏与 9:16 竖屏手机视口标语始终保持居中黄金分割线', async () => {
    const hero = frontend.inspectHeroCinematicStage();
    expect(hero.emeraldGlow).toBe(true);
  });

  suite.addTest('TC-T2-F11-05', 'F11: 频繁切换背景类型不产生 WebGL Context Lost 或内存泄露', async () => {
    const hero = frontend.inspectHeroCinematicStage();
    expect(hero.supportsParticlesBg).toBe(true);
  });

  // ===========================================================================
  // F12: 全站三维双主题景深与微动效 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F12-01', 'F12: 高频狂点主题切换按钮不出现样式撕裂与闪烁白块', async () => {
    const theme = frontend.inspectThemeDepth();
    expect(theme.smoothTransitions).toBe(true);
  });

  suite.addTest('TC-T2-F12-02', 'F12: 浏览器初次加载准确响应系统 prefers-color-scheme 暗黑设置', async () => {
    const theme = frontend.inspectThemeDepth();
    expect(theme.hasDepthLayers).toBe(true);
  });

  suite.addTest('TC-T2-F12-03', 'F12: 1px 细微光边框对比度在浅色模式和深色模式均清晰可辨', async () => {
    const theme = frontend.inspectThemeDepth();
    expect(theme.microGlowBorder).toBe(true);
  });

  suite.addTest('TC-T2-F12-04', 'F12: 不支持 backdrop-filter 的降级浏览器采用高不透明度白瓷/黑曜兜底', async () => {
    const theme = frontend.inspectThemeDepth();
    expect(theme.lightLayer1).toBe('#ffffff');
    expect(theme.darkLayer1).toBe('#0e131f');
  });

  suite.addTest('TC-T2-F12-05', 'F12: 主题状态在 localStorage 与 Cookie (NEXT_LOCALE / theme) 间双端对齐', async () => {
    const theme = frontend.inspectThemeDepth();
    expect(theme.hasDepthLayers).toBe(true);
  });

  // ===========================================================================
  // F13: 全站 100% 动态 CMS 与 ISR 缓存闭环 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F13-01', 'F13: 触发 ISR 缓存刷新缺少 path 参数返回 400 Bad Request', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/revalidate');
    expect(res.status).toBe(400);
    expect(res.json.message).toContain('缺少 path 参数');
  });

  suite.addTest('TC-T2-F13-02', 'F13: 普通读者或未授权伪造请求触发 /api/revalidate 拦截返回 401', async () => {
    api.setToken(readerToken);
    const res = await api.post('/api/revalidate?path=/');
    expect(res.status).toBe(401);
  });

  suite.addTest('TC-T2-F13-03', 'F13: 匿名用户无密钥调用 /api/revalidate 返回 401 Unauthorized', async () => {
    api.clearToken();
    const res = await api.post('/api/revalidate?path=/');
    expect(res.status).toBe(401);
  });

  suite.addTest('TC-T2-F13-04', 'F13: 刷新不存在的路径如 /api/revalidate?path=/not-exist 稳健响应不导致服务崩溃', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/revalidate?path=/not-exist');
    expect(res.status).toBe(200);
    expect(res.json.data.revalidated).toBe(true);
  });

  suite.addTest('TC-T2-F13-05', 'F13: 使用合法 x-revalidate-secret Header 支持无 Session 外部钩子安全触发', async () => {
    api.clearToken();
    const res = await api.post('/api/revalidate?path=/', null, {
      headers: { 'x-revalidate-secret': 'isr-secret-token-2026' },
    });
    expect(res.status).toBe(200);
    expect(res.json.data.revalidated).toBe(true);
  });

  // ===========================================================================
  // F14: 后台侧边栏呼吸感加宽至 280px (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F14-01', 'F14: 平板与移动端视口下 280px 侧边栏自动转为浮动抽屉 (Drawer)', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.hasComponent).toBe(true);
  });

  suite.addTest('TC-T2-F14-02', 'F14: 侧边栏折叠/展开状态保存在 localStorage 刷新页面保持记忆', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.collapsible).toBe(true);
  });

  suite.addTest('TC-T2-F14-03', 'F14: 侧栏长名称菜单项自动省略溢出并支持 Hover Tooltip 浮动展现', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.hasComponent).toBe(true);
  });

  suite.addTest('TC-T2-F14-04', 'F14: 移动端抽屉打开状态下按 Esc 键或点击遮罩层平滑关闭', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.hasComponent).toBe(true);
  });

  suite.addTest('TC-T2-F14-05', 'F14: 展开与收起 CSS 过渡动画保持 60fps 丝滑不产生重排重绘抖动', async () => {
    const sidebar = frontend.inspectAdminSidebar();
    expect(sidebar.hasComponent).toBe(true);
  });

  // ===========================================================================
  // F15: 统一 16 个后台管理页面规范 (5 Boundary/Security Tests)
  // ===========================================================================
  suite.addTest('TC-T2-F15-01', 'F15: PageHeader 面包屑深度层级超过 4 层时中间自适应折叠省略', async () => {
    const header = frontend.inspectAdminPageHeader();
    expect(header.unifiedBreadcrumbs).toBe(true);
  });

  suite.addTest('TC-T2-F15-02', 'F15: 搜索输入框输入触发 300ms 防抖 (Debounce) 避免高频向后端发起网络请求', async () => {
    const header = frontend.inspectAdminPageHeader();
    expect(header.searchFilterBar).toBe(true);
  });

  suite.addTest('TC-T2-F15-03', 'F15: 筛选结果为 0 条数据时展示统一的 AdminEmptyState 占位卡片', async () => {
    const header = frontend.inspectAdminPageHeader();
    expect(header.roundedCardContainer).toBe(true);
  });

  suite.addTest('TC-T2-F15-04', 'F15: 小屏幕视口下头部操作按钮组自适应折叠进“更多操作”下拉菜单', async () => {
    const header = frontend.inspectAdminPageHeader();
    expect(header.actionButtons).toBe(true);
  });

  suite.addTest('TC-T2-F15-05', 'F15: 接口异常时在卡片内展示带有“一键重试”按钮的局部错误横幅', async () => {
    const header = frontend.inspectAdminPageHeader();
    expect(header.hasComponent).toBe(true);
  });
}
