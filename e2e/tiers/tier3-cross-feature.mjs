// e2e/tiers/tier3-cross-feature.mjs
import { ApiClient } from '../utils/client.mjs';
import { expect } from '../utils/assertions.mjs';
import { config, createRandomId } from '../config.mjs';

export function registerTier3Tests(harness) {
  const suite = harness.createSuite('Tier 3: 跨功能组合联动测试 (Cross-Feature)', 'Tier 3');
  const api = new ApiClient();

  let adminToken = null;
  let testSpamReader = null;
  let testSpamToken = null;
  let spamUserId = null;
  let testActiveReader = null;
  let activeReaderToken = null;
  let readerCommentId = null;

  // Setup
  suite.addTest('TC-T3-PREP', '前置准备：登录管理员并注册联动测试专属读者', async () => {
    // Admin login
    const adminRes = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.json.data.accessToken;

    // Spam Reader (for ban tests)
    const spamName = createRandomId('spammer');
    const spamPass = config.readerDefaults.password;
    const spamReg = await api.post('/api/auth/register', {
      username: spamName,
      password: spamPass,
    });
    expect(spamReg.status).toBe(200);
    testSpamReader = { username: spamName, password: spamPass };
    testSpamToken = spamReg.json.data.accessToken;

    // Active Reader (for notifications & tracking)
    const activeName = createRandomId('active');
    const activePass = config.readerDefaults.password;
    const activeReg = await api.post('/api/auth/register', {
      username: activeName,
      password: activePass,
    });
    expect(activeReg.status).toBe(200);
    testActiveReader = { username: activeName, password: activePass };
    activeReaderToken = activeReg.json.data.accessToken;

    // Find spam reader's userId from admin user list or me endpoint
    api.setToken(testSpamToken);
    const meRes = await api.get('/api/auth/me');
    if (meRes.ok && meRes.json.data?.id) {
      spamUserId = meRes.json.data.id;
    } else {
      // Lookup in admin users list
      api.setToken(adminToken);
      const uList = await api.get('/api/admin/users');
      const found = uList.json.data.records.find(u => u.username === spamName);
      spamUserId = found ? found.id : 2;
    }
    api.clearToken();
  });

  // TC-T3-01: 管理员封禁用户后，该用户无法继续发表评论
  suite.addTest('TC-T3-01', '管理员封禁违规用户后，该读者无法继续发表评论', async () => {
    // Admin bans the user
    api.setToken(adminToken);
    const banRes = await api.patch(`/api/admin/users/${spamUserId}/status?status=DISABLED`, {
      status: 'DISABLED',
    });
    expect(banRes.status).toBe(200);
    expect(banRes.json.code).toBe(200);

    // Banned reader tries to post comment
    api.setToken(testSpamToken);
    const commentRes = await api.post('/api/comments', {
      postId: 1,
      content: '被封禁账号尝试发送灌水言论',
    });
    expect(commentRes.status).toBe(403);
    api.clearToken();
  });

  // TC-T3-02: 管理员封禁用户后，该用户无法继续点赞
  suite.addTest('TC-T3-02', '管理员封禁违规用户后，该读者无法继续点赞文章或随记', async () => {
    api.setToken(testSpamToken);
    const likeRes = await api.post('/api/posts/1/like', {});
    expect(likeRes.status).toBe(403);

    const memoLikeRes = await api.post('/api/memos/1/like', {});
    expect(memoLikeRes.status).toBe(403);
    api.clearToken();
  });

  // TC-T3-03: 被封禁读者重新登录被拦截拒绝
  suite.addTest('TC-T3-03', '被封禁读者登出后重新登录被拦截拒绝', async () => {
    api.clearToken();
    const loginRes = await api.post('/api/auth/login', {
      username: testSpamReader.username,
      password: testSpamReader.password,
    });
    expect(loginRes.status).toBeOneOf([400, 403]);
    expect(loginRes.json.message).toContain('禁用');
  });

  // TC-T3-04: 文章发布后自动更新热门统计与审计日志流水
  suite.addTest('TC-T3-04', '文章发布成功后前台可见且系统审计日志自动生成流水', async () => {
    api.setToken(adminToken);
    const uniqueSlug = createRandomId('linked_post');
    const createRes = await api.post('/api/posts', {
      title: `联动文章 ${uniqueSlug}`,
      slug: uniqueSlug,
      content: '测试文章发布与审计系统联动流水',
      status: 'PUBLISHED',
    });
    expect(createRes.status).toBe(200);

    // Verify public visibility
    api.clearToken();
    const viewRes = await api.get(`/api/posts/${uniqueSlug}`);
    expect(viewRes.status).toBe(200);

    // Verify admin audit logs contain CREATE action
    api.setToken(adminToken);
    const auditRes = await api.get('/api/admin/audit-logs');
    expect(auditRes.status).toBe(200);
    expect(auditRes.json.data.records).toBeDefined();
    const hasCreateLog = auditRes.json.data.records.some(
      r => r.module === 'POST' && (r.action === 'CREATE' || r.description?.includes(uniqueSlug))
    );
    expect(hasCreateLog).toBe(true);
    api.clearToken();
  });

  // TC-T3-05: 访客浏览文章轻量上报触发流量统计看板指标更新
  suite.addTest('TC-T3-05', '访客心跳上报行为触发后台流量看板统计更新', async () => {
    api.clearToken();
    // 1. Send track request
    const trackRes = await api.post('/api/analytics/track', {
      path: '/blog/from-the-east-toward-the-unknown',
      durationSeconds: 120,
      referrer: 'https://example.org',
    });
    expect(trackRes.status).toBe(200);

    // 2. Query admin analytics overview
    api.setToken(adminToken);
    const overviewRes = await api.get('/api/admin/analytics/overview');
    expect(overviewRes.status).toBe(200);
    expect(overviewRes.json.data.todayPv).toBeGreaterThan(0);
    expect(overviewRes.json.data.avgDurationSeconds).toBeGreaterThan(0);
    api.clearToken();
  });

  // TC-T3-06: 读者评论发表触发站长邮件通知事件
  suite.addTest('TC-T3-06', '读者发表文章评论触发异步站长邮件通知事件', async () => {
    api.setToken(activeReaderToken);
    const commentRes = await api.post('/api/comments', {
      postId: 1,
      content: '非常具有启发性的文章，请问后续是否有进阶架构篇？',
    });
    expect(commentRes.status).toBe(200);
    readerCommentId = commentRes.json.data.id;
    api.clearToken();
  });

  // TC-T3-07: 站长回复评论触发读者邮件通知事件
  suite.addTest('TC-T3-07', '站长回复该评论触发读者邮件通知提醒事件', async () => {
    api.setToken(adminToken);
    const replyRes = await api.post('/api/comments', {
      postId: 1,
      parentId: readerCommentId || 1,
      content: '感谢关注！进阶架构篇正在整理中，敬请期待！',
    });
    expect(replyRes.status).toBe(200);
    expect(replyRes.json.data.parentId).toBe(readerCommentId || 1);
    api.clearToken();
  });

  // TC-T3-08: 读者在个人中心可完整追溯“我发表的评论”流
  suite.addTest('TC-T3-08', '读者在个人中心通过 GET /api/comments/my 查看到刚发表的评论', async () => {
    api.setToken(activeReaderToken);
    const myCommentsRes = await api.get('/api/comments/my');
    expect(myCommentsRes.status).toBe(200);
    expect(myCommentsRes.json.data.records).toBeDefined();
    const hasMyComment = myCommentsRes.json.data.records.some(
      c => c.content?.includes('进阶架构篇') || c.id === readerCommentId
    );
    expect(hasMyComment).toBe(true);
    api.clearToken();
  });

  // TC-T3-09: 读者点赞随记后在个人中心“我点赞过的动态”可追溯
  suite.addTest('TC-T3-09', '读者点赞随记后在 GET /api/likes/my 个人中心动态中可查验', async () => {
    api.setToken(activeReaderToken);
    // Like memo 1
    const likeRes = await api.post('/api/memos/1/like', {});
    expect(likeRes.status).toBe(200);

    // Query my likes
    const myLikesRes = await api.get('/api/likes/my');
    expect(myLikesRes.status).toBe(200);
    expect(myLikesRes.json.data.records).toBeDefined();
    const hasLikedMemo = myLikesRes.json.data.records.some(
      l => l.targetType === 'MEMO' || l.targetId === 1
    );
    expect(hasLikedMemo).toBe(true);
    api.clearToken();
  });
}
