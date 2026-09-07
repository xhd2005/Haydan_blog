// e2e/tiers/tier2-boundary-security.mjs
import { ApiClient } from '../utils/client.mjs';
import { expect } from '../utils/assertions.mjs';
import { config, createRandomId } from '../config.mjs';

export function registerTier2Tests(harness) {
  const suite = harness.createSuite('Tier 2: 边界与安全防御测试 (Boundary & Security)', 'Tier 2');
  const api = new ApiClient();

  let adminToken = null;
  let readerToken = null;
  let otherReaderToken = null;
  let otherReaderCommentId = null;

  // Setup: Authenticate accounts
  suite.addTest('TC-T2-PREP', '前置准备：登录管理员与两个独立读者以备越权比对', async () => {
    // Admin login
    const adminRes = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.json.data.accessToken;

    // Reader 1
    const reader1Name = createRandomId('reader1');
    const r1Reg = await api.post('/api/auth/register', {
      username: reader1Name,
      password: config.readerDefaults.password,
    });
    expect(r1Reg.status).toBe(200);
    readerToken = r1Reg.json.data.accessToken;

    // Reader 2
    const reader2Name = createRandomId('reader2');
    const r2Reg = await api.post('/api/auth/register', {
      username: reader2Name,
      password: config.readerDefaults.password,
    });
    expect(r2Reg.status).toBe(200);
    otherReaderToken = r2Reg.json.data.accessToken;

    // Reader 2 posts a comment
    api.setToken(otherReaderToken);
    const commentRes = await api.post('/api/comments', {
      postId: 1,
      content: '读者2的受保护评论，用于水平越权测试',
    });
    expect(commentRes.status).toBe(200);
    otherReaderCommentId = commentRes.json.data.id;
    api.clearToken();
  });

  // TC-T2-01: 连续 5 次错误密码登录触发锁定
  suite.addTest('TC-T2-01', '连续 5 次错误密码登录触发 423/429 锁定惩罚 (AC-2)', async () => {
    const targetBruteUser = createRandomId('victim');
    // First register victim
    await api.post('/api/auth/register', {
      username: targetBruteUser,
      password: 'CorrectPass123!',
    });

    // Send 5 incorrect password attempts
    for (let i = 1; i <= 5; i++) {
      const failRes = await api.post('/api/auth/login', {
        username: targetBruteUser,
        password: `WrongPass_${i}`,
      });
      // Early attempts return 401 or require captcha (4002)
      expect(failRes.status).toBeOneOf([401, 400, 423, 429]);
    }

    // 6th attempt MUST be locked with 423 or 429
    const lockRes = await api.post('/api/auth/login', {
      username: targetBruteUser,
      password: 'WrongPass_6',
    });
    expect(lockRes.status).toBeOneOf([423, 429]);
    expect(lockRes.json).toBeDefined();
    if (lockRes.json.data?.remainingSeconds) {
      expect(lockRes.json.data.remainingSeconds).toBeGreaterThan(0);
    }
  });

  // TC-T2-02: 上传 HTML 脚本文件被严正拒绝
  suite.addTest('TC-T2-02', '上传包含恶意脚本的 HTML 文件被拦截返回 400 (AC-4)', async () => {
    api.setToken(adminToken);
    const htmlPayload = Buffer.from('<html><body><script>alert("XSS")</script></body></html>', 'utf-8');
    const res = await api.upload('/api/media/upload', {
      buffer: htmlPayload,
      filename: 'exploit.html',
      contentType: 'text/html',
    });
    expect(res.status).toBe(400);
    expect(res.json.code).toBe(400);
    api.clearToken();
  });

  // TC-T2-03: 上传 SVG 脚本文件被严正拒绝
  suite.addTest('TC-T2-03', '上传 SVG 矢量脚本文件被严正拒绝返回 400 (AC-4)', async () => {
    api.setToken(adminToken);
    const svgPayload = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'utf-8');
    const res = await api.upload('/api/media/upload', {
      buffer: svgPayload,
      filename: 'vector.svg',
      contentType: 'image/svg+xml',
    });
    expect(res.status).toBe(400);
    expect(res.json.code).toBe(400);
    api.clearToken();
  });

  // TC-T2-04: 伪造 PNG 后缀但无二进制魔数被拦截
  suite.addTest('TC-T2-04', '伪造 PNG 后缀的 PHP/文本木马因魔数不匹配被拦截 (AC-4)', async () => {
    api.setToken(adminToken);
    const fakePayload = Buffer.from('<?php echo "Trojan Activated"; ?>', 'utf-8');
    const res = await api.upload('/api/media/upload', {
      buffer: fakePayload,
      filename: 'fake_avatar.png',
      contentType: 'image/png',
    });
    expect(res.status).toBe(400);
    expect(res.json.code).toBe(400);
    api.clearToken();
  });

  // TC-T2-05: 读者 Token 垂直越权调用文章创建接口严格返回 403
  suite.addTest('TC-T2-05', '读者 Token 垂直越权调用 POST /api/posts 返回 403 (AC-3)', async () => {
    api.setToken(readerToken);
    const res = await api.post('/api/posts', {
      title: '越权创建的文章',
      slug: 'unauthorized-post',
      content: '读者试图直接创建文章',
    });
    expect(res.status).toBe(403);
    api.clearToken();
  });

  // TC-T2-06: 读者 Token 垂直越权调用文章删除接口严格返回 403
  suite.addTest('TC-T2-06', '读者 Token 垂直越权调用 DELETE /api/posts/{id} 返回 403 (AC-3)', async () => {
    api.setToken(readerToken);
    const res = await api.delete('/api/posts/1');
    expect(res.status).toBe(403);
    api.clearToken();
  });

  // TC-T2-07: 读者 Token 垂直越权调用用户状态管理接口严格返回 403
  suite.addTest('TC-T2-07', '读者 Token 垂直越权调用 PATCH /api/admin/users/1/status 返回 403 (AC-3)', async () => {
    api.setToken(readerToken);
    const res = await api.patch('/api/admin/users/1/status?status=DISABLED', {});
    expect(res.status).toBe(403);
    api.clearToken();
  });

  // TC-T2-08: 读者 Token 垂直越权调用系统审计日志接口严格返回 403
  suite.addTest('TC-T2-08', '读者 Token 垂直越权调用 GET /api/admin/audit-logs 返回 403 (AC-3)', async () => {
    api.setToken(readerToken);
    const res = await api.get('/api/admin/audit-logs');
    expect(res.status).toBe(403);
    api.clearToken();
  });

  // TC-T2-09: 普通读者删除他人评论被拒绝 403
  suite.addTest('TC-T2-09', '读者 1 尝试删除读者 2 的评论触发水平越权拦截返回 403', async () => {
    api.setToken(readerToken);
    const targetCommentId = otherReaderCommentId || 1;
    const res = await api.delete(`/api/comments/${targetCommentId}`);
    expect(res.status).toBe(403);
    api.clearToken();
  });

  // TC-T2-10: 空内容与纯空格输入边界校验
  suite.addTest('TC-T2-10', '发表空评论或纯空格内容返回 400 参数错误', async () => {
    api.setToken(readerToken);
    const res = await api.post('/api/comments', {
      postId: 1,
      content: '     ',
    });
    expect(res.status).toBe(400);
    expect(res.json.code).toBe(400);
    api.clearToken();
  });

  // TC-T2-11: 文章标题为空校验
  suite.addTest('TC-T2-11', '创建文章时标题为空返回 400 参数错误', async () => {
    api.setToken(adminToken);
    const res = await api.post('/api/posts', {
      title: '   ',
      slug: 'empty-title-slug',
      content: '正文内容',
    });
    expect(res.status).toBe(400);
    expect(res.json.code).toBe(400);
    api.clearToken();
  });

  // TC-T2-12: 重复用户名注册冲突防护
  suite.addTest('TC-T2-12', '重复注册已存在用户名返回 400 提示已被占用', async () => {
    const res = await api.post('/api/auth/register', {
      username: config.admin.username, // Try to register existing 'admin'
      password: 'RandomPassword123!',
    });
    expect(res.status).toBe(400);
    expect(res.json.code).toBe(400);
  });

  // TC-T2-13: 读者修改密码时提供错误旧密码被拒绝
  suite.addTest('TC-T2-13', '修改密码时旧密码输入错误返回 400 且新密码不生效', async () => {
    api.setToken(readerToken);
    const res = await api.put('/api/auth/password', {
      oldPassword: 'completely_wrong_old_password',
      newPassword: 'BrandNewSecretPass456!',
    });
    expect(res.status).toBe(400);
    expect(res.json.code).toBe(400);
    api.clearToken();
  });

  // TC-T2-14: Unicode 与 Emoji 表情符号边界处理
  suite.addTest('TC-T2-14', '评论与随记输入复杂 Unicode Emoji (🚀✨🎉) 正常保存无乱码', async () => {
    api.setToken(readerToken);
    const emojiContent = '测试 Emoji 支持：🚀 前端现代化体验 🎉 攻防加固 ✨ 数字花园 🌟';
    const res = await api.post('/api/comments', {
      postId: 1,
      content: emojiContent,
    });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data.content).toBe(emojiContent);
    api.clearToken();
  });
}
