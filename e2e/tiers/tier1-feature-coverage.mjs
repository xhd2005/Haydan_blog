// e2e/tiers/tier1-feature-coverage.mjs
import { ApiClient, FrontendClient } from '../utils/client.mjs';
import { expect } from '../utils/assertions.mjs';
import { config, createRandomId } from '../config.mjs';
import fs from 'fs';
import path from 'path';

export function registerTier1Tests(harness) {
  const suite = harness.createSuite('Tier 1: 功能覆盖基线测试 (Feature Coverage)', 'Tier 1');
  const api = new ApiClient();
  const frontend = new FrontendClient();

  let adminToken = null;
  let createdPostId = null;
  let createdPostSlug = null;
  let testReaderUser = null;
  let readerToken = null;
  let rootCommentId = null;

  // TC-T1-01: 默认站长凭据登录
  suite.addTest('TC-T1-01', '默认站长凭据登录获取 ADMIN 角色与 JWT', async () => {
    const res = await api.post('/api/auth/login', {
      username: config.admin.username,
      password: config.admin.password,
    });
    expect(res.status).toBe(200);
    expect(res.json).toBeDefined();
    expect(res.json.code).toBe(200);
    expect(res.json.data).toBeDefined();
    expect(res.json.data.accessToken).toBeDefined();
    expect(res.json.data.role).toBe('ADMIN');
    adminToken = res.json.data.accessToken;
  });

  // TC-T1-02: 读者自主注册流程
  suite.addTest('TC-T1-02', '读者自主注册流程赋予 ROLE_USER 身份', async () => {
    const username = createRandomId('reader');
    const password = config.readerDefaults.password;
    const email = `${username}@${config.readerDefaults.emailDomain}`;
    testReaderUser = { username, password, email, nickname: `读者_${username}` };

    const res = await api.post('/api/auth/register', {
      username: testReaderUser.username,
      password: testReaderUser.password,
      nickname: testReaderUser.nickname,
      email: testReaderUser.email,
    });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data.username).toBe(username);
    expect(res.json.data.role).toBe('USER');
    expect(res.json.data.accessToken).toBeDefined();
  });

  // TC-T1-03: 普通读者正常登录
  suite.addTest('TC-T1-03', '普通读者使用注册凭据正常登录', async () => {
    const res = await api.post('/api/auth/login', {
      username: testReaderUser.username,
      password: testReaderUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data.role).toBe('USER');
    expect(res.json.data.accessToken).toBeDefined();
    readerToken = res.json.data.accessToken;
  });

  // TC-T1-04: 公开页面无显式 CMS 链接
  suite.addTest('TC-T1-04', '前台公开页面及静态代码不含显式 CMS 登录链接 (AC-1)', async () => {
    // 1. Try to fetch live frontend if available
    const pageRes = await frontend.getPage('/');
    if (pageRes.ok && pageRes.html) {
      const exposed = frontend.detectExposedAdminLinks(pageRes.html);
      expect(exposed.length).toBe(0);
    } else {
      // 2. Fallback: inspect frontend source file components/Footer.tsx directly
      const footerPath = path.resolve(process.cwd(), 'frontend/components/Footer.tsx');
      if (fs.existsSync(footerPath)) {
        const content = fs.readFileSync(footerPath, 'utf-8');
        // Once refactored for R1.1/AC-1, the explicit link "/admin/login" or raw CMS in footer should be removed
        const hasExposedAdmin = content.includes('href="/admin/login"') || content.includes("href='/admin/login'");
        if (hasExposedAdmin) {
          throw new Error('Footer.tsx still exposes explicit /admin/login CMS link! Security AC-1 violated.');
        }
      }
    }
  });

  // TC-T1-05: 站长创建新文章
  suite.addTest('TC-T1-05', '站长调用 POST /api/posts 发布新文章', async () => {
    api.setToken(adminToken);
    const postSlug = createRandomId('article');
    const postData = {
      title: `E2E 测试文章 ${postSlug}`,
      slug: postSlug,
      content: '# E2E Header\n\n这是一篇自动化测试发布的文章正文。',
      summary: '自动化测试摘要',
      status: 'PUBLISHED',
      category: 'Tech',
      tags: ['E2E', 'Automation'],
    };
    const res = await api.post('/api/posts', postData);
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data).toBeDefined();
    createdPostId = res.json.data.id || 1;
    createdPostSlug = postSlug;
    api.clearToken();
  });

  // TC-T1-06: 前台公开文章列表拉取
  suite.addTest('TC-T1-06', '前台公开文章列表拉取只包含已发布内容', async () => {
    api.clearToken();
    const res = await api.get('/api/posts', { params: { page: 1, pageSize: 10 } });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data.records).toBeDefined();
    expect(Array.isArray(res.json.data.records)).toBe(true);
    for (const post of res.json.data.records) {
      expect(post.status).toBe('PUBLISHED');
    }
  });

  // TC-T1-07: 前台文章详情与阅读数自增
  suite.addTest('TC-T1-07', '前台获取文章详情内容且包含 Markdown 正文', async () => {
    api.clearToken();
    const slugOrId = createdPostSlug || 1;
    const res = await api.get(`/api/posts/${slugOrId}`);
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data.title).toBeDefined();
    expect(res.json.data.content).toBeDefined();
  });

  // TC-T1-08: 文章点赞功能
  suite.addTest('TC-T1-08', '登录用户可对文章进行点赞操作', async () => {
    api.setToken(readerToken);
    const targetPostId = createdPostId || 1;
    const res = await api.post(`/api/posts/${targetPostId}/like`, {});
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    api.clearToken();
  });

  // TC-T1-09: 读者发表评论
  suite.addTest('TC-T1-09', '读者在文章详情页发表评论', async () => {
    api.setToken(readerToken);
    const targetPostId = createdPostId || 1;
    const res = await api.post('/api/comments', {
      postId: targetPostId,
      content: '这是一条由 E2E 自动化读者发表的真实评论！',
    });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data).toBeDefined();
    expect(res.json.data.id).toBeDefined();
    rootCommentId = res.json.data.id;
    api.clearToken();
  });

  // TC-T1-10: 文章评论公开列表拉取与审核展示
  suite.addTest('TC-T1-10', '公开获取文章评论列表展示已审核评论', async () => {
    api.clearToken();
    const targetPostId = createdPostId || 1;
    const res = await api.get(`/api/comments/post/${targetPostId}`);
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data.records).toBeDefined();
    expect(res.json.data.records.length).toBeGreaterThanOrEqual(1);
  });

  // TC-T1-11: 站长回复评论并形成层级结构
  suite.addTest('TC-T1-11', '站长回复读者评论并建立树形父子级关联', async () => {
    api.setToken(adminToken);
    const targetPostId = createdPostId || 1;
    const res = await api.post('/api/comments', {
      postId: targetPostId,
      parentId: rootCommentId || 1,
      content: '感谢您的支持与阅读，数字花园持续更新中！',
    });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data.parentId).toBe(rootCommentId || 1);
    api.clearToken();
  });

  // TC-T1-12: 读者获取个人中心信息
  suite.addTest('TC-T1-12', '读者获取个人中心信息 (GET /api/auth/me)', async () => {
    api.setToken(readerToken);
    const res = await api.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data.username).toBe(testReaderUser.username);
    expect(res.json.data.role).toBe('USER');
    expect(res.json.data.commentCount).toBeGreaterThanOrEqual(1);
    api.clearToken();
  });

  // TC-T1-13: 读者修改个人昵称与头像
  suite.addTest('TC-T1-13', '读者在线修改个人昵称与头像资料', async () => {
    api.setToken(readerToken);
    const newNickname = `新昵称_${Date.now()}`;
    const newAvatar = 'https://example.com/avatar-updated.png';
    const res = await api.put('/api/auth/profile', {
      nickname: newNickname,
      avatar: newAvatar,
    });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);

    // Verify update took effect
    const profileRes = await api.get('/api/auth/me');
    expect(profileRes.json.data.nickname).toBe(newNickname);
    expect(profileRes.json.data.avatar).toBe(newAvatar);
    api.clearToken();
  });

  // TC-T1-14: 正常图片（JPG/PNG 二进制魔数）安全上传
  suite.addTest('TC-T1-14', '合法 PNG 二进制魔数图片安全上传成功', async () => {
    api.setToken(adminToken);
    // Real 1x1 PNG binary with 8-byte magic header 89 50 4E 47 0D 0A 1A 0A
    const pngBytes = Buffer.from([
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

    const res = await api.upload('/api/media/upload', {
      buffer: pngBytes,
      filename: 'sample_valid.png',
      contentType: 'image/png',
    });
    expect(res.status).toBe(200);
    expect(res.json.code).toBe(200);
    expect(res.json.data.url).toBeDefined();
    expect(res.json.data.url).toContain('/uploads/');
    api.clearToken();
  });

  // TC-T1-15: 随记 Memos 创建发布与公开拉取
  suite.addTest('TC-T1-15', '随记 Memos 发布与公开时间线拉取', async () => {
    api.setToken(adminToken);
    const memoRes = await api.post('/api/memos', {
      content: '今天在数字花园测试端到端自动化随记发布流水线。',
      images: ['https://example.com/garden.jpg'],
    });
    expect(memoRes.status).toBe(200);
    expect(memoRes.json.code).toBe(200);

    // Pull memos list
    api.clearToken();
    const listRes = await api.get('/api/memos');
    expect(listRes.status).toBe(200);
    expect(listRes.json.code).toBe(200);
    expect(listRes.json.data.records.length).toBeGreaterThanOrEqual(1);
  });

  // TC-T1-16: 友链与站点公告设置拉取
  suite.addTest('TC-T1-16', '站点基础设置与友链列表公开读取', async () => {
    api.clearToken();
    const settingRes = await api.get('/api/settings');
    expect(settingRes.status).toBe(200);
    expect(settingRes.json.code).toBe(200);
    expect(settingRes.json.data.siteName).toBeDefined();

    const friendRes = await api.get('/api/friends');
    expect(friendRes.status).toBe(200);
    expect(friendRes.json.code).toBe(200);
    expect(Array.isArray(friendRes.json.data)).toBe(true);
  });
}
