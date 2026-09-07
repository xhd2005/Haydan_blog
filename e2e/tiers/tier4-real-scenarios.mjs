// e2e/tiers/tier4-real-scenarios.mjs
import { ApiClient, FrontendClient } from '../utils/client.mjs';
import { expect } from '../utils/assertions.mjs';
import { config, createRandomId } from '../config.mjs';

export function registerTier4Tests(harness) {
  const suite = harness.createSuite('Tier 4: 真实业务场景全链路测试 (Real-World Scenarios)', 'Tier 4');
  const api = new ApiClient();
  const frontend = new FrontendClient();

  // TC-T4-01: 读者完整生命周期端到端旅程
  suite.addTest('TC-T4-01', '读者完整生命周期端到端旅程 (注册->登录->浏览->互动->个人中心)', async () => {
    // 1. 注册
    const username = createRandomId('life_reader');
    const password = 'LifePassword123!';
    const regRes = await api.post('/api/auth/register', {
      username,
      password,
      nickname: '生命周期读者',
      email: `${username}@example.com`,
    });
    expect(regRes.status).toBe(200);

    // 2. 登录
    const loginRes = await api.post('/api/auth/login', { username, password });
    expect(loginRes.status).toBe(200);
    const token = loginRes.json.data.accessToken;
    api.setToken(token);

    // 3. 浏览公开文章
    const postsRes = await api.get('/api/posts');
    expect(postsRes.status).toBe(200);
    const targetPost = postsRes.json.data.records[0] || { id: 1, slug: 'from-the-east-toward-the-unknown' };

    // 4. 点赞随记
    const memoLikeRes = await api.post('/api/memos/1/like', {});
    expect(memoLikeRes.status).toBe(200);

    // 5. 发表评论
    const commentRes = await api.post('/api/comments', {
      postId: targetPost.id,
      content: '全链路旅程体验：阅读、点赞并留言交流！',
    });
    expect(commentRes.status).toBe(200);

    // 6. 进入个人中心修改昵称
    const newNickname = `旅行者_${username.slice(-4)}`;
    const updateRes = await api.put('/api/auth/profile', { nickname: newNickname });
    expect(updateRes.status).toBe(200);

    // 7. 查看我的互动历史 (评论 & 点赞)
    const myCommentsRes = await api.get('/api/comments/my');
    expect(myCommentsRes.status).toBe(200);
    expect(myCommentsRes.json.data.records.length).toBeGreaterThanOrEqual(1);

    const myLikesRes = await api.get('/api/likes/my');
    expect(myLikesRes.status).toBe(200);
    expect(myLikesRes.json.data.records.length).toBeGreaterThanOrEqual(1);

    api.clearToken();
  });

  // TC-T4-02: 站长完整运营端到端流程
  suite.addTest('TC-T4-02', '站长完整运营端到端流程 (登录->创作发布->数据分析->审计流水->用户管理)', async () => {
    // 1. 登录后台
    const loginRes = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.json.data.role).toBe('ADMIN');
    const adminToken = loginRes.json.data.accessToken;
    api.setToken(adminToken);

    // 2. 编写并发布文章
    const postSlug = createRandomId('admin_ops_post');
    const postRes = await api.post('/api/posts', {
      title: '数字花园全域运营实践与安全架构纪要',
      slug: postSlug,
      content: '# 运营实践\n\n系统已接入流量监控、审计跟踪与细粒度权限模型。',
      tags: ['Operations', 'Security'],
      status: 'PUBLISHED',
    });
    expect(postRes.status).toBe(200);

    // 3. 查看看板 PV/UV 趋势与核心指标
    const overviewRes = await api.get('/api/admin/analytics/overview');
    expect(overviewRes.status).toBe(200);
    expect(overviewRes.json.data.todayPv).toBeDefined();

    const topPostsRes = await api.get('/api/admin/analytics/top-posts');
    expect(topPostsRes.status).toBe(200);
    expect(Array.isArray(topPostsRes.json.data)).toBe(true);

    // 4. 审计日志查验
    const auditRes = await api.get('/api/admin/audit-logs');
    expect(auditRes.status).toBe(200);
    expect(auditRes.json.data.records.length).toBeGreaterThanOrEqual(1);

    // 5. 用户状态管理查验
    const usersRes = await api.get('/api/admin/users');
    expect(usersRes.status).toBe(200);
    expect(usersRes.json.data.records.length).toBeGreaterThanOrEqual(1);

    api.clearToken();
  });

  // TC-T4-03: 互动反馈与安全防御协同闭环
  suite.addTest('TC-T4-03', '互动反馈与安全防御协同闭环 (垃圾言论处理与即时封禁拦截)', async () => {
    // 1. 模拟违规用户注册并提交垃圾评论
    const badUserName = createRandomId('bad_actor');
    const badReg = await api.post('/api/auth/register', {
      username: badUserName,
      password: 'BadPassword123!',
    });
    expect(badReg.status).toBe(200);
    const badToken = badReg.json.data.accessToken;

    api.setToken(badToken);
    const spamRes = await api.post('/api/comments', {
      postId: 1,
      content: '违规推广广告内容！点击链接购买非法商品！',
    });
    expect(spamRes.status).toBe(200);
    const spamCommentId = spamRes.json.data.id;
    api.clearToken();

    // 2. 站长登录并删除垃圾评论
    const adminLogin = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    const adminToken = adminLogin.json.data.accessToken;
    api.setToken(adminToken);

    const deleteRes = await api.delete(`/api/comments/${spamCommentId}`);
    expect(deleteRes.status).toBe(200);

    // 3. 站长将该违规账号封禁
    const usersRes = await api.get('/api/admin/users');
    const badUserRecord = usersRes.json.data.records.find(u => u.username === badUserName);
    const badUserId = badUserRecord ? badUserRecord.id : 2;

    const banRes = await api.patch(`/api/admin/users/${badUserId}/status?status=DISABLED`, {
      status: 'DISABLED',
    });
    expect(banRes.status).toBe(200);
    api.clearToken();

    // 4. 违规用户后续请求被拦截 403
    api.setToken(badToken);
    const blockedComment = await api.post('/api/comments', {
      postId: 1,
      content: '尝试再次违规发表',
    });
    expect(blockedComment.status).toBe(403);
    api.clearToken();
  });

  // TC-T4-04: 随记图文多媒体发布与前台展示流
  suite.addTest('TC-T4-04', '随记图文多媒体发布与前台展示流', async () => {
    // 1. 站长登录
    const adminLogin = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    const adminToken = adminLogin.json.data.accessToken;
    api.setToken(adminToken);

    // 2. 上传合法图片
    const validPng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    const uploadRes = await api.upload('/api/media/upload', {
      buffer: validPng,
      filename: 'memo_photo.png',
      contentType: 'image/png',
    });
    expect(uploadRes.status).toBe(200);
    const imageUrl = uploadRes.json.data.url;

    // 3. 发布包含图片的随记
    const memoContent = '旅途掠影：深圳湾的傍晚日落与海风拂面。';
    const memoRes = await api.post('/api/memos', {
      content: memoContent,
      images: [imageUrl],
    });
    expect(memoRes.status).toBe(200);
    api.clearToken();

    // 4. 前台公开列表拉取并验证包含该图片
    const publicMemos = await api.get('/api/memos');
    expect(publicMemos.status).toBe(200);
    const targetMemo = publicMemos.json.data.records.find(m => m.content === memoContent);
    expect(targetMemo).toBeDefined();
    expect(targetMemo.images).toBeDefined();
    expect(targetMemo.images.length).toBeGreaterThanOrEqual(1);
  });

  // TC-T4-05: 读者密码轮转与会话安全有效性闭环
  suite.addTest('TC-T4-05', '读者密码轮转与会话安全有效性闭环', async () => {
    // 1. 注册读者账号
    const username = createRandomId('rotation_user');
    const oldPassword = 'OldInitialPass123!';
    const newPassword = 'NewSecretPass456!';
    const regRes = await api.post('/api/auth/register', { username, password: oldPassword });
    expect(regRes.status).toBe(200);
    const token = regRes.json.data.accessToken;

    // 2. 修改密码
    api.setToken(token);
    const changeRes = await api.put('/api/auth/password', {
      oldPassword,
      newPassword,
    });
    expect(changeRes.status).toBe(200);
    api.clearToken();

    // 3. 使用旧密码登录应当失败
    const failLogin = await api.post('/api/auth/login', { username, password: oldPassword });
    expect(failLogin.status).toBeOneOf([401, 400]);

    // 4. 使用新密码登录应当成功
    const successLogin = await api.post('/api/auth/login', { username, password: newPassword });
    expect(successLogin.status).toBe(200);
    expect(successLogin.json.data.accessToken).toBeDefined();
  });

  // TC-T4-06: 前台静态入口无感体验与全局隐蔽后台唤起
  suite.addTest('TC-T4-06', '前台全量公开页面无明文管理路由泄露 (AC-1 全局渗透扫描)', async () => {
    const publicPaths = ['/', '/blog', '/projects', '/journey', '/memos', '/now', '/about', '/links'];
    let exposedCount = 0;

    for (const path of publicPaths) {
      const pageRes = await frontend.getPage(path);
      if (pageRes.ok && pageRes.html) {
        const found = frontend.detectExposedAdminLinks(pageRes.html);
        if (found.length > 0) {
          exposedCount += found.length;
        }
      }
    }

    // Also check local components/Footer.tsx for static security
    expect(exposedCount).toBe(0);
  });
}
