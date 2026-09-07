// e2e/utils/oracle.mjs
/**
 * Contract Oracle: Implements the exact interface contracts specified in survey_spec.md
 * and PROJECT.md. Used for reference verification, deterministic test derivation,
 * and offline/progressive testability.
 */

export class ContractOracle {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = new Map([
      ['admin', {
        id: 1,
        username: 'admin',
        password: 'admin123',
        nickname: 'Howard',
        avatar: 'https://example.com/admin.jpg',
        email: 'admin@howardxue.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        lastLoginIp: '127.0.0.1',
        lastLoginTime: new Date().toISOString(),
        commentCount: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      }],
    ]);

    this.tokens = new Map([
      ['admin-jwt-token-xyz', 1],
    ]);

    this.failedLogins = new Map(); // key: ip+username -> { count, lockedUntil }
    this.posts = new Map([
      [1, {
        id: 1,
        title: 'From the East, toward the unknown: 数字花园发刊词',
        slug: 'from-the-east-toward-the-unknown',
        content: '# 数字花园发刊词\n\n欢迎来到数字花园。',
        summary: '发刊词',
        status: 'PUBLISHED',
        viewCount: 10,
        likeCount: 5,
        commentCount: 1,
        category: 'Essays',
        tags: ['Philosophy', 'Garden'],
        createdAt: '2026-09-01T10:00:00.000Z',
      }],
    ]);

    this.comments = new Map([
      [1, {
        id: 1,
        postId: 1,
        userId: 1,
        author: 'Howard',
        content: '欢迎大家交流讨论！',
        parentId: null,
        status: 'APPROVED',
        createdAt: '2026-09-01T11:00:00.000Z',
      }],
    ]);

    this.memos = new Map([
      [1, {
        id: 1,
        content: '“From the East, toward the unknown.” 保持专注与好奇。',
        images: ['https://example.com/memo1.jpg'],
        likeCount: 3,
        createdAt: '2026-09-02T15:00:00.000Z',
      }],
    ]);

    this.likes = []; // { id, userId, targetType, targetId, likedAt }
    this.auditLogs = []; // { id, operatorId, module, action, description, status, createdAt }
    this.emailEvents = []; // { type, recipient, subject, body, timestamp }
    this.analytics = {
      pv: 100,
      uv: 45,
      durations: [120, 180, 240],
      records: [],
    };
    this.settings = {
      siteName: 'HAYDEN XUE',
      slogan: 'From the East, toward the unknown.',
      announcement: '系统全新升级，欢迎体验。',
      icpNumber: '粤ICP备20260001号',
    };
    this.friends = [
      { id: 1, name: 'Alice Blog', url: 'https://alice.dev', description: 'Web Explorer' },
    ];
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

  parseBody(body) {
    if (!body) return {};
    if (typeof body === 'object') return body;
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
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
    const body = this.parseBody(options.body);

    // 1. POST /api/auth/login
    if (method === 'POST' && pathname === '/api/auth/login') {
      const { username, password } = body;
      const ip = '127.0.0.1';
      const lockKey = `${ip}:${username}`;
      const lockData = this.failedLogins.get(lockKey) || { count: 0, lockedUntil: 0 };

      if (Date.now() < lockData.lockedUntil) {
        const remainingSeconds = Math.ceil((lockData.lockedUntil - Date.now()) / 1000);
        return {
          status: 423,
          ok: false,
          json: {
            code: 423,
            message: `登录失败次数过多，账户已被锁定，请于 ${remainingSeconds} 秒后再试`,
            data: { locked: true, remainingSeconds, requireCaptcha: true },
          },
        };
      }

      const foundUser = this.users.get(username);
      if (!foundUser || foundUser.password !== password) {
        lockData.count += 1;
        if (lockData.count >= 5) {
          lockData.lockedUntil = Date.now() + 15 * 60 * 1000;
          this.failedLogins.set(lockKey, lockData);
          return {
            status: 423,
            ok: false,
            json: {
              code: 423,
              message: '登录失败次数过多，账户已被锁定，请于 900 秒后再试',
              data: { locked: true, remainingSeconds: 900, requireCaptcha: true },
            },
          };
        }
        this.failedLogins.set(lockKey, lockData);
        return {
          status: 401,
          ok: false,
          json: { code: 401, message: '用户名或密码错误' },
        };
      }

      // Check status
      if (foundUser.status === 'DISABLED') {
        return {
          status: 403,
          ok: false,
          json: { code: 403, message: '账户已被禁用，请联系管理员' },
        };
      }

      // Success
      this.failedLogins.delete(lockKey);
      const token = `token-${foundUser.username}-${Date.now()}`;
      this.tokens.set(token, foundUser.id);
      foundUser.lastLoginTime = new Date().toISOString();
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

    // 2. POST /api/auth/register
    if (method === 'POST' && pathname === '/api/auth/register') {
      const { username, password, nickname, email } = body;
      if (!username || !password) {
        return { status: 400, ok: false, json: { code: 400, message: '用户名与密码不能为空' } };
      }
      if (this.users.has(username)) {
        return { status: 400, ok: false, json: { code: 400, message: '该用户名已被注册' } };
      }
      const newId = this.users.size + 1;
      const newUser = {
        id: newId,
        username,
        password,
        nickname: nickname || username,
        email: email || `${username}@example.com`,
        avatar: 'https://example.com/default-avatar.png',
        role: 'USER',
        status: 'ACTIVE',
        lastLoginIp: '127.0.0.1',
        lastLoginTime: new Date().toISOString(),
        commentCount: 0,
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
          data: {
            accessToken: token,
            username: newUser.username,
            nickname: newUser.nickname,
            role: newUser.role,
          },
        },
      };
    }

    // 3. GET /api/auth/me or /api/user/profile
    if (method === 'GET' && (pathname === '/api/auth/me' || pathname === '/api/user/profile')) {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权访问' } };
      const likesCount = this.likes.filter(l => l.userId === user.id).length;
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
            role: user.role,
            status: user.status,
            commentCount: user.commentCount || 0,
            likeCount: likesCount,
          },
        },
      };
    }

    // 4. PUT /api/auth/profile or /api/user/profile
    if (method === 'PUT' && (pathname === '/api/auth/profile' || pathname === '/api/user/profile')) {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权访问' } };
      if (user.status === 'DISABLED') return { status: 403, ok: false, json: { code: 403, message: '账户已被禁用' } };
      if (body.nickname !== undefined) user.nickname = body.nickname;
      if (body.avatar !== undefined) user.avatar = body.avatar;
      if (body.email !== undefined) user.email = body.email;
      return { status: 200, ok: true, json: { code: 200, message: '个人资料更新成功' } };
    }

    // 5. PUT /api/auth/password or /api/user/password
    if (method === 'PUT' && (pathname === '/api/auth/password' || pathname === '/api/user/password')) {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权访问' } };
      const { oldPassword, newPassword } = body;
      if (user.password !== oldPassword) {
        return { status: 400, ok: false, json: { code: 400, message: '原密码错误' } };
      }
      if (!newPassword || newPassword.length < 6) {
        return { status: 400, ok: false, json: { code: 400, message: '新密码长度至少6位' } };
      }
      user.password = newPassword;
      return { status: 200, ok: true, json: { code: 200, message: '密码已成功修改' } };
    }

    // 6. Media upload: POST /api/media/upload
    if (method === 'POST' && pathname === '/api/media/upload') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足，仅管理员可上传' } };
      }
      const fileInfo = options._fileInfo || {};
      const filename = fileInfo.filename || '';
      const ext = filename.split('.').pop()?.toLowerCase();
      const validExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      if (!validExts.includes(ext)) {
        return { status: 400, ok: false, json: { code: 400, message: '不支持的文件扩展名格式' } };
      }
      const buffer = fileInfo.buffer || Buffer.alloc(0);
      // Validate magic numbers
      const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      const isJpg = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      const isGif = buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
      const isWebp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
      
      const fileText = buffer.toString('utf-8');
      if (fileText.includes('<script>') || fileText.includes('<?php') || fileText.includes('<svg')) {
        return { status: 400, ok: false, json: { code: 400, message: '上传失败：检测到恶意脚本或不安全内容' } };
      }
      if (!isPng && !isJpg && !isGif && !isWebp) {
        return { status: 400, ok: false, json: { code: 400, message: '文件头二进制签名无效，仅支持真实图片' } };
      }

      const uploadedUrl = `/uploads/2026/09/uuid_${Date.now()}.${ext}`;
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: '上传成功',
          data: { url: uploadedUrl, filename, size: buffer.length },
        },
      };
    }

    // 7. Posts endpoints
    if (method === 'GET' && pathname === '/api/posts') {
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
      const records = Array.from(this.posts.values()).filter(p => p.status === 'PUBLISHED');
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: 'success',
          data: { records, total: records.length, page: Math.max(1, page), pageSize: Math.min(pageSize, 100) },
        },
      };
    }

    if (method === 'GET' && pathname.startsWith('/api/posts/')) {
      const slugOrId = pathname.replace('/api/posts/', '');
      const post = Array.from(this.posts.values()).find(p => p.slug === slugOrId || String(p.id) === slugOrId);
      if (!post) return { status: 404, ok: false, json: { code: 404, message: '文章未找到' } };
      post.viewCount += 1;
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: post } };
    }

    if (method === 'POST' && pathname === '/api/posts') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可创建文章' } };
      }
      if (!body.title || !body.title.trim()) {
        return { status: 400, ok: false, json: { code: 400, message: '文章标题不能为空' } };
      }
      const newId = this.posts.size + 1;
      const newPost = {
        id: newId,
        title: body.title,
        slug: body.slug || `post-${newId}`,
        content: body.content || '',
        summary: body.summary || '',
        status: body.status || 'PUBLISHED',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        tags: body.tags || [],
        createdAt: new Date().toISOString(),
      };
      this.posts.set(newId, newPost);
      this.auditLogs.push({
        id: this.auditLogs.length + 1,
        operatorId: user.id,
        module: 'POST',
        action: 'CREATE',
        description: `创建文章: ${newPost.title}`,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      });
      return { status: 200, ok: true, json: { code: 200, message: '文章创建成功', data: { id: newId } } };
    }

    if (method === 'DELETE' && pathname.startsWith('/api/posts/')) {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可删除文章' } };
      }
      const id = parseInt(pathname.replace('/api/posts/', ''), 10);
      this.posts.delete(id);
      return { status: 200, ok: true, json: { code: 200, message: '文章已删除' } };
    }

    // Like Post
    if (method === 'POST' && pathname.match(/^\/api\/posts\/\d+\/like$/)) {
      if (user && user.status === 'DISABLED') {
        return { status: 403, ok: false, json: { code: 403, message: '账号已被禁用' } };
      }
      const postId = parseInt(pathname.split('/')[3], 10);
      const post = this.posts.get(postId);
      if (post) post.likeCount += 1;
      if (user) {
        this.likes.push({ id: this.likes.length + 1, userId: user.id, targetType: 'POST', targetId: postId, title: post?.title, likedAt: new Date().toISOString() });
      }
      return { status: 200, ok: true, json: { code: 200, message: '点赞成功' } };
    }

    // 8. Comments
    if (method === 'POST' && pathname === '/api/comments') {
      if (user && user.status === 'DISABLED') {
        return { status: 403, ok: false, json: { code: 403, message: '账户已被禁用，无法发表评论' } };
      }
      if (!body.content || !body.content.trim()) {
        return { status: 400, ok: false, json: { code: 400, message: '评论内容不能为空' } };
      }
      const newId = this.comments.size + 1;
      const newComment = {
        id: newId,
        postId: body.postId,
        userId: user ? user.id : 0,
        author: user ? user.nickname : (body.author || '访客'),
        content: body.content.trim(),
        parentId: body.parentId || null,
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
      };
      this.comments.set(newId, newComment);
      if (user) user.commentCount = (user.commentCount || 0) + 1;

      // Produce email events
      if (body.parentId) {
        this.emailEvents.push({
          type: 'READER_REPLY',
          recipient: 'reader@example.com',
          subject: '站长回复了您的评论',
          body: newComment.content,
          timestamp: new Date().toISOString(),
        });
      } else {
        this.emailEvents.push({
          type: 'ADMIN_NEW_COMMENT',
          recipient: this.settings.email || 'admin@howardxue.com',
          subject: '您的文章收到了新评论',
          body: newComment.content,
          timestamp: new Date().toISOString(),
        });
      }

      return { status: 200, ok: true, json: { code: 200, message: '评论发表成功', data: newComment } };
    }

    if (method === 'GET' && (pathname === '/api/comments' || pathname.startsWith('/api/comments/post/'))) {
      const records = Array.from(this.comments.values());
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: { records, total: records.length } } };
    }

    if (method === 'GET' && pathname === '/api/comments/my') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权访问' } };
      const records = Array.from(this.comments.values()).filter(c => c.userId === user.id);
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: { records, total: records.length } } };
    }

    if (method === 'DELETE' && pathname.startsWith('/api/comments/')) {
      const id = parseInt(pathname.replace('/api/comments/', ''), 10);
      const comment = this.comments.get(id);
      if (!comment) return { status: 404, ok: false, json: { code: 404, message: '评论不存在' } };
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权' } };
      if (user.role !== 'ADMIN' && comment.userId !== user.id) {
        return { status: 403, ok: false, json: { code: 403, message: '越权操作：无权删除他人评论' } };
      }
      this.comments.delete(id);
      return { status: 200, ok: true, json: { code: 200, message: '评论已删除' } };
    }

    // 9. Likes my
    if (method === 'GET' && pathname === '/api/likes/my') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权访问' } };
      const records = this.likes.filter(l => l.userId === user.id);
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: { records, total: records.length } } };
    }

    // 10. Memos
    if (method === 'GET' && pathname === '/api/memos') {
      const records = Array.from(this.memos.values());
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: { records, total: records.length } } };
    }

    if (method === 'POST' && pathname === '/api/memos') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可发布随记' } };
      }
      const newId = this.memos.size + 1;
      const memo = {
        id: newId,
        content: body.content,
        images: body.images || [],
        likeCount: 0,
        createdAt: new Date().toISOString(),
      };
      this.memos.set(newId, memo);
      return { status: 200, ok: true, json: { code: 200, message: '随记发布成功', data: memo } };
    }

    if (method === 'POST' && pathname.match(/^\/api\/memos\/\d+\/like$/)) {
      if (user && user.status === 'DISABLED') {
        return { status: 403, ok: false, json: { code: 403, message: '账号已被禁用' } };
      }
      const memoId = parseInt(pathname.split('/')[3], 10);
      const memo = this.memos.get(memoId);
      if (memo) memo.likeCount += 1;
      if (user) {
        this.likes.push({ id: this.likes.length + 1, userId: user.id, targetType: 'MEMO', targetId: memoId, title: memo?.content?.substring(0, 30), likedAt: new Date().toISOString() });
      }
      return { status: 200, ok: true, json: { code: 200, message: '点赞成功' } };
    }

    // 11. Friends & Settings
    if (method === 'GET' && pathname === '/api/friends') {
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: this.friends } };
    }
    if (method === 'GET' && pathname === '/api/settings') {
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: this.settings } };
    }

    // 12. Admin User Management
    if (method === 'GET' && pathname === '/api/admin/users') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足' } };
      }
      const records = Array.from(this.users.values()).map(u => ({
        id: u.id,
        username: u.username,
        nickname: u.nickname,
        role: u.role,
        status: u.status,
        lastLoginIp: u.lastLoginIp,
        lastLoginTime: u.lastLoginTime,
        commentCount: u.commentCount,
        createdAt: u.createdAt,
      }));
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: { records, total: records.length } } };
    }

    if ((method === 'PATCH' || method === 'PUT') && pathname.match(/^\/api\/admin\/users\/\d+\/status$/)) {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足' } };
      }
      const targetId = parseInt(pathname.split('/')[4], 10);
      if (targetId === user.id) {
        return { status: 400, ok: false, json: { code: 400, message: '无法禁用当前登录的管理员账号' } };
      }
      const statusParam = url.searchParams.get('status') || body.status;
      for (const u of this.users.values()) {
        if (u.id === targetId) {
          u.status = statusParam;
          return { status: 200, ok: true, json: { code: 200, message: `用户状态已更新为 ${statusParam}` } };
        }
      }
      return { status: 404, ok: false, json: { code: 404, message: '用户不存在' } };
    }

    // 13. Admin Analytics
    if (method === 'POST' && pathname === '/api/analytics/track') {
      this.analytics.pv += 1;
      if (body.durationSeconds) this.analytics.durations.push(body.durationSeconds);
      return { status: 200, ok: true, json: { code: 200, message: 'ok' } };
    }

    if (method === 'GET' && pathname === '/api/admin/analytics/overview') {
      if (!user || user.role !== 'ADMIN') return { status: 403, ok: false, json: { code: 403, message: '权限不足' } };
      const avgDuration = Math.round(this.analytics.durations.reduce((a, b) => a + b, 0) / this.analytics.durations.length);
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: 'success',
          data: {
            todayPv: this.analytics.pv,
            todayUv: this.analytics.uv,
            totalPv: this.analytics.pv * 10,
            totalUv: this.analytics.uv * 5,
            avgDurationSeconds: avgDuration,
          },
        },
      };
    }

    if (method === 'GET' && pathname === '/api/admin/analytics/top-posts') {
      if (!user || user.role !== 'ADMIN') return { status: 403, ok: false, json: { code: 403, message: '权限不足' } };
      const records = Array.from(this.posts.values()).slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        viewCount: p.viewCount,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
      }));
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: records } };
    }

    // 14. Admin Audit Logs
    if (method === 'GET' && pathname === '/api/admin/audit-logs') {
      if (!user || user.role !== 'ADMIN') return { status: 403, ok: false, json: { code: 403, message: '权限不足' } };
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: 'success',
          data: { records: this.auditLogs, total: this.auditLogs.length },
        },
      };
    }

    return { status: 404, ok: false, json: { code: 404, message: `Oracle route not found: ${method} ${pathname}` } };
  }
}

export const contractOracle = new ContractOracle();
