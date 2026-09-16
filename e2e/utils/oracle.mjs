// e2e/utils/oracle.mjs
/**
 * Contract Oracle: Implements the exact interface contracts specified in
 * ORIGINAL_REQUEST.md (2026-09-08 R1-R5) and PROJECT.md (Features F1-F15).
 * Used for reference verification, deterministic test derivation, and offline progressive testability.
 */

export class ContractOracle {
  constructor() {
    this.reset();
  }

  reset() {
    // Users: Admin is strictly Hayden Xue
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

    // Posts
    this.posts = new Map([
      [1, {
        id: 1,
        title: 'From the East, toward the unknown: 数字花园发刊词',
        slug: 'from-the-east-toward-the-unknown',
        content: '# 数字花园发刊词\n\n欢迎来到 Hayden Xue 的数字花园。',
        summary: '发刊词与思想原点',
        status: 'PUBLISHED',
        viewCount: 120,
        likeCount: 42,
        commentCount: 3,
        category: 'Essays',
        tags: ['Philosophy', 'Garden', 'Identity'],
        maturity: 'EVERGREEN',
        createdAt: '2026-09-01T10:00:00.000Z',
      }],
    ]);

    // Comments
    this.comments = new Map([
      [1, {
        id: 1,
        postId: 1,
        userId: 1,
        author: 'Hayden Xue',
        content: '欢迎大家交流讨论！这里是数字花园的开放空间。',
        parentId: null,
        status: 'APPROVED',
        createdAt: '2026-09-01T11:00:00.000Z',
      }],
    ]);

    // Memos
    this.memos = new Map([
      [1, {
        id: 1,
        content: '“From the East, toward the unknown.” 保持专注与好奇，构建具备三维景深的数字空间。',
        images: ['https://assets.haydenxue.com/images/memo1.jpg'],
        likeCount: 15,
        createdAt: '2026-09-02T15:00:00.000Z',
      }],
    ]);

    this.likes = []; // { id, userId, targetType, targetId, likedAt }
    this.auditLogs = []; // { id, operatorId, module, action, description, status, createdAt }
    this.emailEvents = []; // { type, recipient, subject, body, timestamp }
    this.revalidations = []; // { path, timestamp }

    this.analytics = {
      pv: 350,
      uv: 128,
      durations: [120, 180, 240, 310],
      records: [],
    };

    // CMS Settings with MinIO & Hero Video (F1, F3, F11, F13)
    this.settings = {
      siteName: 'HAYDEN XUE',
      authorName: 'Hayden Xue',
      slogan: 'From the East, toward the unknown.',
      announcement: 'Hayden Xue 数字花园 4.0 全新启航，欢迎探索。',
      icpNumber: '粤ICP备20260001号',
      email: 'admin@haydenxue.com',
      heroBgType: 'video', // 'video' | 'particles'
      heroVideoUrl: 'https://assets.haydenxue.com/videos/cyber-flow-4k.mp4',
      storageType: 'LOCAL', // 'LOCAL' | 'MINIO'
      minioEndpoint: 'https://minio.haydenxue.com',
      minioBucket: 'hayden-media',
      minioAccessKey: 'hayden-admin',
      minioSecretKey: 'm!nI0_S3cr3t_2026',
      minioPublicUrl: 'https://cdn.haydenxue.com',
      aboutBioZh: '全栈软件架构师与数字花园园丁，专注企业级并发架构、前端空间美学与自主 AI Agent 研发。',
      aboutBioEn: 'Full-stack software architect & digital garden cultivator, specializing in high-concurrency systems, spatial UI, and autonomous AI agents.',
    };

    // Real travel journeys (F4, F7 - strictly verified real footprints, no fake cities)
    this.journeys = new Map([
      [1, {
        id: 1,
        title: '北京·秋色与胡同记忆',
        city: 'Beijing',
        lat: 39.9042,
        lon: 116.4074,
        slug: 'beijing-autumn',
        cover: 'https://images.unsplash.com/photo-beijing.jpg',
        description: '金秋时节，漫步于东交民巷与南锣鼓巷，感受古都的厚重与静谧。',
        status: 'PUBLISHED',
      }],
      [2, {
        id: 2,
        title: '上海·外滩天际线与现代建筑',
        city: 'Shanghai',
        lat: 31.2304,
        lon: 121.4737,
        slug: 'shanghai-skyline',
        cover: 'https://images.unsplash.com/photo-shanghai.jpg',
        description: '浦江两岸的光影流转，陆家嘴摩天大楼与石库门里弄的时代交响。',
        status: 'PUBLISHED',
      }],
      [3, {
        id: 3,
        title: '东京·数字空间与都市脉动',
        city: 'Tokyo',
        lat: 35.6762,
        lon: 139.6503,
        slug: 'tokyo-cyber-pulse',
        cover: 'https://images.unsplash.com/photo-tokyo.jpg',
        description: '新宿与涩谷的霓虹交织，在数字艺术馆体悟虚拟与现实的无缝交融。',
        status: 'PUBLISHED',
      }],
      [4, {
        id: 4,
        title: '京都·古寺禅意与庭园光影',
        city: 'Kyoto',
        lat: 35.0116,
        lon: 135.7681,
        slug: 'kyoto-zen-gardens',
        cover: 'https://images.unsplash.com/photo-kyoto.jpg',
        description: '龙安寺的枯山水与伏见稻荷的千本鸟居，在漫步中静心思索系统之美。',
        status: 'PUBLISHED',
      }],
      [5, {
        id: 5,
        title: '重庆·8D魔幻山城与夜色',
        city: 'Chongqing',
        lat: 29.5630,
        lon: 106.5516,
        slug: 'chongqing-cyberpunk',
        cover: 'https://images.unsplash.com/photo-chongqing.jpg',
        description: '穿楼而过的轻轨与依山而建的洪崖洞，现实中的赛博朋克立体空间。',
        status: 'PUBLISHED',
      }],
      [6, {
        id: 6,
        title: '杭州·西湖烟雨与科技新城',
        city: 'Hangzhou',
        lat: 30.2741,
        lon: 120.1551,
        slug: 'hangzhou-westlake',
        cover: 'https://images.unsplash.com/photo-hangzhou.jpg',
        description: '苏堤春晓的诗意与未来科技城的蓬勃生机，传统人文与前沿算力的完美平衡。',
        status: 'PUBLISHED',
      }],
      [7, {
        id: 7,
        title: '深圳·创新之都与大湾区海岸',
        city: 'Shenzhen',
        lat: 22.5431,
        lon: 114.0579,
        slug: 'shenzhen-innovation',
        cover: 'https://images.unsplash.com/photo-shenzhen.jpg',
        description: '南山科技园的深夜灯火与大梅沙的辽阔海岸，数字游民的起航之城。',
        status: 'PUBLISHED',
      }],
    ]);

    // Now Mindstream structured record (F5, F9)
    this.nowRecord = {
      id: 1,
      learning: 'Java 21 虚拟线程在高吞吐并发系统中的实战',
      building: 'Hayden Xue 数字花园 4.0 与 3D 交互探索地球仪',
      exploring: 'AI Agent 自主决策与本地 RAG 架构演进',
      thinking: '“From the East, toward the unknown.” 技术与美学的平衡',
      currentCity: 'Shenzhen',
      focusTopicsJson: JSON.stringify([
        { title: 'Java 21 虚拟线程调优', progress: 90, tag: 'Enterprise' },
        { title: 'Three.js 3D 地球仪飞渡', progress: 85, tag: 'Creative' },
        { title: 'MinIO 云存储直传架构', progress: 95, tag: 'Cloud' },
      ]),
      readingNotesJson: JSON.stringify([
        {
          bookTitle: 'Designing Data-Intensive Applications',
          author: 'Martin Kleppmann',
          quote: 'Reliability, scalability, and maintainability are the trinity of modern system design.',
        },
      ]),
      microLogsJson: JSON.stringify([
        { date: '2026-09-08', content: '完成 MinIO 云存储与 3D 探索地球仪 4.0 联调 🚀' },
      ]),
      updatedAt: '2026-09-08T03:45:00.000Z',
    };

    // Friends with ping status and categories (F6, F10)
    this.friends = new Map([
      [1, {
        id: 1,
        name: 'Alice Blog',
        url: 'https://alice.dev',
        avatar: 'https://alice.dev/avatar.png',
        description: 'Web Explorer & Creative Technologist',
        category: 'INDEPENDENT_BLOG',
        status: 'ACTIVE',
        pingStatus: 'ONLINE',
        createdAt: '2026-09-01T00:00:00Z',
      }],
      [2, {
        id: 2,
        name: 'Bob Geek',
        url: 'https://bob.geek',
        avatar: 'https://bob.geek/avatar.png',
        description: 'Systems & Kernel Hacker',
        category: 'GEEK_PEER',
        status: 'ACTIVE',
        pingStatus: 'ONLINE',
        createdAt: '2026-09-02T00:00:00Z',
      }],
      [3, {
        id: 3,
        name: 'OpenCore Dev',
        url: 'https://opencore.org',
        avatar: 'https://opencore.org/logo.png',
        description: 'Open Source Infrastructure',
        category: 'OPEN_SOURCE',
        status: 'ACTIVE',
        pingStatus: 'ONLINE',
        createdAt: '2026-09-03T00:00:00Z',
      }],
    ]);

    // Friend activities stream (F6, F10)
    this.friendActivities = [
      { id: 1, friendName: 'Alice Blog', title: 'Next.js 15 Server Actions 深度实践', url: 'https://alice.dev/post/next15', publishedAt: '2026-09-07T10:00:00Z' },
      { id: 2, friendName: 'Bob Geek', title: 'Linux eBPF 性能剖析全景指南', url: 'https://bob.geek/posts/ebpf', publishedAt: '2026-09-06T15:30:00Z' },
      { id: 3, friendName: 'OpenCore Dev', title: '分布式对象存储 MinIO 高可用架构解析', url: 'https://opencore.org/blog/minio-ha', publishedAt: '2026-09-05T09:20:00Z' },
    ];

    // Media library (F1, F2)
    this.media = new Map([
      [1, {
        id: 1,
        filename: 'cyber-flow-4k.mp4',
        url: 'https://assets.haydenxue.com/videos/cyber-flow-4k.mp4',
        fileType: 'video/mp4',
        size: 15420000,
        storageType: 'MINIO',
        createdAt: '2026-09-08T00:00:00Z',
      }],
      [2, {
        id: 2,
        filename: 'hero-banner.jpg',
        url: '/uploads/2026/09/hero-banner.jpg',
        fileType: 'image/jpeg',
        size: 345000,
        storageType: 'LOCAL',
        createdAt: '2026-09-07T00:00:00Z',
      }],
    ]);

    this.nextUserId = 100;
    this.nextPostId = 100;
    this.nextCommentId = 100;
    this.nextMemoId = 100;
    this.nextJourneyId = 100;
    this.nextFriendId = 100;
    this.nextMediaId = 100;
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

    // =========================================================================
    // 1. AUTHENTICATION & LOGIN
    // =========================================================================
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

      if (foundUser.status === 'DISABLED') {
        return {
          status: 403,
          ok: false,
          json: { code: 403, message: '账户已被禁用，请联系管理员' },
        };
      }

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

    if (method === 'PUT' && (pathname === '/api/auth/profile' || pathname === '/api/user/profile')) {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权访问' } };
      if (user.status === 'DISABLED') return { status: 403, ok: false, json: { code: 403, message: '账户已被禁用' } };
      if (body.nickname !== undefined) user.nickname = body.nickname;
      if (body.avatar !== undefined) user.avatar = body.avatar;
      if (body.email !== undefined) user.email = body.email;
      return { status: 200, ok: true, json: { code: 200, message: '个人资料更新成功' } };
    }

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

    // =========================================================================
    // 2. MINIO CONNECTIVITY TEST & SETTINGS (F1, F3, F11, F13)
    // =========================================================================
    if (method === 'POST' && pathname === '/api/settings/test-minio') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可测试 MinIO 连通性' } };
      }
      const { endpoint, bucket, accessKey, secretKey } = body;
      if (!bucket || !bucket.trim()) {
        return { status: 400, ok: false, json: { code: 400, message: 'Bucket 名称不能为空' } };
      }
      if (!endpoint || endpoint.includes('invalid') || endpoint.includes('unreachable') || !endpoint.startsWith('http')) {
        return {
          status: 200,
          ok: true,
          json: {
            code: 200,
            message: '测试完成',
            data: { success: false, latencyMs: 0, message: 'MinIO 连接失败: 无法解析主机名或服务端口不可达' },
          },
        };
      }
      if (secretKey && (secretKey.includes('wrong') || secretKey.includes('bad') || secretKey.includes('invalid'))) {
        return {
          status: 200,
          ok: true,
          json: {
            code: 200,
            message: '测试完成',
            data: { success: false, latencyMs: 0, message: 'MinIO 认证失败: AccessKey 或 SecretKey 无效' },
          },
        };
      }
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: 'MinIO 连通性测试成功',
          data: { success: true, latencyMs: 38, message: `MinIO 连通性测试通过，Bucket [${bucket}] 访问就绪` },
        },
      };
    }

    if (method === 'GET' && pathname === '/api/settings') {
      const respSettings = { ...this.settings };
      // Non-admin desensitization: mask minioSecretKey and aiApiKey
      if (!user || user.role !== 'ADMIN') {
        respSettings.minioSecretKey = null;
        respSettings.aiApiKey = null;
      }
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: respSettings } };
    }

    if (method === 'PUT' && pathname === '/api/settings') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可修改系统配置' } };
      }
      if (body.storageType && !['LOCAL', 'MINIO'].includes(body.storageType)) {
        return { status: 400, ok: false, json: { code: 400, message: '不支持的存储类型，必须为 LOCAL 或 MINIO' } };
      }
      Object.assign(this.settings, body);
      // Auto-revalidate / on setting change
      this.revalidations.push({ path: '/', timestamp: Date.now() });
      return { status: 200, ok: true, json: { code: 200, message: '系统设置更新成功' } };
    }

    // =========================================================================
    // 3. MEDIA UPLOAD & STORAGE STRATEGY (F1, F2)
    // =========================================================================
    if (method === 'POST' && pathname === '/api/media/upload') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足，仅管理员可上传' } };
      }
      const fileInfo = options._fileInfo || {};
      const filename = fileInfo.filename || '';
      const ext = filename.split('.').pop()?.toLowerCase();
      const forbiddenExts = ['html', 'htm', 'svg', 'exe', 'sh', 'bat', 'php', 'jsp'];
      if (forbiddenExts.includes(ext)) {
        return { status: 400, ok: false, json: { code: 400, message: '上传失败：不支持的文件格式，严禁上传脚本、HTML或可执行格式文件' } };
      }

      const validExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm'];
      if (!validExts.includes(ext)) {
        return { status: 400, ok: false, json: { code: 400, message: '不支持的文件格式，仅支持常用图片及 MP4/WebM 视频' } };
      }

      const buffer = fileInfo.buffer || Buffer.alloc(0);
      if (buffer.length === 0) {
        return { status: 400, ok: false, json: { code: 400, message: '上传失败：文件内容不能为空' } };
      }

      // Max size check: 200MB = 200 * 1024 * 1024 bytes
      const MAX_BYTES = 200 * 1024 * 1024;
      if (buffer.length > MAX_BYTES || fileInfo.size > MAX_BYTES) {
        return { status: 400, ok: false, json: { code: 400, message: '文件大小超出限制，最大允许 200MB' } };
      }

      const fileText = buffer.toString('utf-8', 0, Math.min(buffer.length, 2048));
      if (fileText.includes('<script') || fileText.includes('<?php') || fileText.includes('<svg')) {
        return { status: 400, ok: false, json: { code: 400, message: '上传失败：文件头检测到伪装恶意代码' } };
      }

      // Binary magic number verification
      const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      const isJpg = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      const isGif = buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
      const isWebp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
      const isMp4 = buffer.length >= 12 && (buffer.toString('ascii', 4, 8) === 'ftyp' || buffer.toString('ascii', 0, 4) === 'ftyp');
      const isWebm = buffer.length >= 4 && buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;

      if (!isPng && !isJpg && !isGif && !isWebp && !isMp4 && !isWebm) {
        return { status: 400, ok: false, json: { code: 400, message: '文件头二进制魔数签名无效，仅支持真实多媒体文件' } };
      }

      const activeStorage = this.settings.storageType || 'LOCAL';
      let uploadedUrl = '';
      if (activeStorage === 'MINIO') {
        uploadedUrl = `${this.settings.minioPublicUrl}/media/uuid_${Date.now()}.${ext}`;
      } else {
        uploadedUrl = `/uploads/2026/09/uuid_${Date.now()}.${ext}`;
      }

      const mediaId = ++this.nextMediaId;
      const fileMime = isMp4
        ? 'video/mp4'
        : isWebm
        ? 'video/webm'
        : (ext === 'jpg' || ext === 'jpeg')
        ? 'image/jpeg'
        : `image/${ext}`;

      const newMedia = {
        id: mediaId,
        filename,
        url: uploadedUrl,
        fileType: fileMime,
        size: buffer.length,
        storageType: activeStorage,
        createdAt: new Date().toISOString(),
      };
      this.media.set(mediaId, newMedia);

      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: '上传成功',
          data: newMedia,
        },
      };
    }

    if (method === 'GET' && pathname === '/api/media') {
      const records = Array.from(this.media.values());
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: 'success',
          data: { records, total: records.length, page: 1, pageSize: 20 },
        },
      };
    }

    if (method === 'DELETE' && pathname.startsWith('/api/media/')) {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足' } };
      }
      const id = parseInt(pathname.replace('/api/media/', ''), 10);
      this.media.delete(id);
      return { status: 200, ok: true, json: { code: 200, message: '媒体删除成功' } };
    }

    // =========================================================================
    // 4. REAL JOURNEY FOOTPRINTS (F4, F7)
    // =========================================================================
    if (method === 'GET' && pathname === '/api/journey') {
      const records = Array.from(this.journeys.values()).filter(j => j.status === 'PUBLISHED');
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: records } };
    }

    if (method === 'GET' && pathname.startsWith('/api/journey/')) {
      const slugOrId = pathname.replace('/api/journey/', '');
      const journey = Array.from(this.journeys.values()).find(j => j.slug === slugOrId || String(j.id) === slugOrId);
      if (!journey) {
        return { status: 404, ok: false, json: { code: 404, message: '旅行足迹记录不存在' } };
      }
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: journey } };
    }

    if (method === 'POST' && pathname === '/api/journey') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可发布足迹' } };
      }
      const { title, city, lat, lon, slug } = body;
      if (!title || !city) {
        return { status: 400, ok: false, json: { code: 400, message: '足迹标题与城市不能为空' } };
      }
      if (typeof lat !== 'number' || lat < -90 || lat > 90 || typeof lon !== 'number' || lon < -180 || lon > 180) {
        return { status: 400, ok: false, json: { code: 400, message: '经纬度坐标无效，超出地理范围' } };
      }
      const newId = ++this.nextJourneyId;
      const newJourney = {
        id: newId,
        title,
        city,
        lat,
        lon,
        slug: slug || `journey-${newId}`,
        cover: body.cover || 'https://images.unsplash.com/default-journey.jpg',
        description: body.description || '',
        status: 'PUBLISHED',
      };
      this.journeys.set(newId, newJourney);
      return { status: 200, ok: true, json: { code: 200, message: '足迹创建成功', data: newJourney } };
    }

    // =========================================================================
    // 5. NOW MINDSTREAM RECORD (F5, F9)
    // =========================================================================
    if (method === 'GET' && pathname === '/api/now') {
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: this.nowRecord } };
    }

    if (method === 'PUT' && pathname === '/api/now') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可更新生活心智流' } };
      }

      // JSON format validation
      if (body.focusTopicsJson !== undefined) {
        try {
          const parsed = JSON.parse(body.focusTopicsJson);
          if (!Array.isArray(parsed)) throw new Error('Must be array');
        } catch {
          return { status: 400, ok: false, json: { code: 400, message: 'focusTopicsJson 必须是有效的 JSON 数组格式' } };
        }
      }
      if (body.readingNotesJson !== undefined) {
        try {
          const parsed = JSON.parse(body.readingNotesJson);
          if (!Array.isArray(parsed)) throw new Error('Must be array');
        } catch {
          return { status: 400, ok: false, json: { code: 400, message: 'readingNotesJson 必须是有效的 JSON 数组格式' } };
        }
      }
      if (body.microLogsJson !== undefined) {
        try {
          const parsed = JSON.parse(body.microLogsJson);
          if (!Array.isArray(parsed)) throw new Error('Must be array');
          // XSS sanitization simulation
          for (const item of parsed) {
            if (item.content && item.content.includes('<script')) {
              item.content = item.content.replace(/<script[^>]*>.*?<\/script>/gi, '[FILTERED]');
            }
          }
          body.microLogsJson = JSON.stringify(parsed);
        } catch {
          return { status: 400, ok: false, json: { code: 400, message: 'microLogsJson 必须是有效的 JSON 数组格式' } };
        }
      }

      Object.assign(this.nowRecord, body, { updatedAt: new Date().toISOString() });
      this.revalidations.push({ path: '/now', timestamp: Date.now() });
      return { status: 200, ok: true, json: { code: 200, message: 'Now 心智流更新成功', data: this.nowRecord } };
    }

    // =========================================================================
    // 6. FRIENDS, AUDIT & HEALTH PING STREAM (F6, F10)
    // =========================================================================
    if (method === 'POST' && pathname === '/api/friends/apply') {
      const { name, url: friendUrl, avatar, description, category } = body;
      if (!name || !name.trim()) {
        return { status: 400, ok: false, json: { code: 400, message: '站点名称不能为空' } };
      }
      if (!friendUrl || (!friendUrl.startsWith('http://') && !friendUrl.startsWith('https://'))) {
        return { status: 400, ok: false, json: { code: 400, message: '站点链接格式无效，必须以 http:// 或 https:// 开头' } };
      }
      if (avatar && (avatar.startsWith('javascript:') || avatar.startsWith('data:text/html'))) {
        return { status: 400, ok: false, json: { code: 400, message: '头像链接不安全' } };
      }

      // Check duplicate URL
      for (const f of this.friends.values()) {
        if (f.url === friendUrl) {
          return { status: 400, ok: false, json: { code: 400, message: '该友链链接已申请或存在' } };
        }
      }

      const validCategories = ['INDEPENDENT_BLOG', 'GEEK_PEER', 'OPEN_SOURCE'];
      const finalCategory = validCategories.includes(category) ? category : 'INDEPENDENT_BLOG';

      const newId = ++this.nextFriendId;
      const newFriend = {
        id: newId,
        name: name.trim(),
        url: friendUrl.trim(),
        avatar: avatar || 'https://assets.haydenxue.com/avatar/friend-default.png',
        description: description || '',
        category: finalCategory,
        status: 'PENDING',
        pingStatus: 'UNKNOWN',
        createdAt: new Date().toISOString(),
      };
      this.friends.set(newId, newFriend);

      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: '友链申请已提交，等待站长审核',
          data: newFriend,
        },
      };
    }

    if (method === 'GET' && pathname === '/api/friends') {
      const records = Array.from(this.friends.values()).filter(f => f.status === 'ACTIVE');
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: records } };
    }

    if (method === 'GET' && pathname === '/api/friends/admin') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可访问全部友链管理' } };
      }
      const records = Array.from(this.friends.values());
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: records } };
    }

    if (method === 'PUT' && pathname.match(/^\/api\/friends\/\d+\/status$/)) {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可审批友链' } };
      }
      const id = parseInt(pathname.split('/')[3], 10);
      const friend = this.friends.get(id);
      if (!friend) {
        return { status: 404, ok: false, json: { code: 404, message: '友链不存在' } };
      }
      if (!['ACTIVE', 'REJECTED', 'PENDING'].includes(body.status)) {
        return { status: 400, ok: false, json: { code: 400, message: '无效的状态值' } };
      }
      friend.status = body.status;
      if (body.status === 'ACTIVE') {
        friend.pingStatus = 'ONLINE';
      }
      return { status: 200, ok: true, json: { code: 200, message: `友链状态已更新为 ${body.status}` } };
    }

    if (method === 'GET' && pathname === '/api/friends/stream') {
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: this.friendActivities } };
    }

    // =========================================================================
    // 7. ISR REVALIDATION (F13)
    // =========================================================================
    if (method === 'POST' && pathname === '/api/revalidate') {
      const targetPath = url.searchParams.get('path');
      if (!targetPath) {
        return { status: 400, ok: false, json: { code: 400, message: '缺少 path 参数，无法执行 ISR 缓存刷新' } };
      }
      const secret = url.searchParams.get('secret') || options.headers?.['x-revalidate-secret'];
      // Allow if admin user or secret matches
      if (!user?.role?.includes('ADMIN') && secret !== 'isr-secret-token-2026') {
        return { status: 401, ok: false, json: { code: 401, message: '未授权：非法 ISR Revalidation 触发请求' } };
      }
      const event = { path: targetPath, timestamp: Date.now() };
      this.revalidations.push(event);
      return {
        status: 200,
        ok: true,
        json: { code: 200, message: 'ISR 缓存刷新成功', data: { revalidated: true, path: targetPath, timestamp: event.timestamp } },
      };
    }

    // =========================================================================
    // 8. POSTS, COMMENTS, MEMOS & INTERACTION
    // =========================================================================
    if (method === 'GET' && pathname === '/api/posts') {
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
      const maturity = url.searchParams.get('maturity');
      let filtered = Array.from(this.posts.values()).filter(p => p.status === 'PUBLISHED');
      if (maturity) {
        const matUpper = maturity.toUpperCase() === 'SEED' ? 'SEEDLING' : maturity.toUpperCase();
        filtered = filtered.filter(p => p.maturity && p.maturity.toUpperCase() === matUpper);
      }
      const category = url.searchParams.get('category');
      if (category) {
        filtered = filtered.filter(p => p.category && (p.category.slug === category || p.category.name === category));
      }
      const total = filtered.length;
      const start = (Math.max(1, page) - 1) * pageSize;
      const records = filtered.slice(start, start + pageSize);
      return {
        status: 200,
        ok: true,
        json: {
          code: 200,
          message: 'success',
          data: { records, total, page: Math.max(1, page), pageSize: Math.min(pageSize, 100) },
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
      const newId = ++this.nextPostId;
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

    if (method === 'POST' && pathname === '/api/comments') {
      if (user && user.status === 'DISABLED') {
        return { status: 403, ok: false, json: { code: 403, message: '账户已被禁用，无法发表评论' } };
      }
      if (!body.content || !body.content.trim()) {
        return { status: 400, ok: false, json: { code: 400, message: '评论内容不能为空' } };
      }
      const newId = ++this.nextCommentId;
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
          recipient: this.settings.email || 'admin@haydenxue.com',
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

    if (method === 'GET' && pathname === '/api/likes/my') {
      if (!user) return { status: 401, ok: false, json: { code: 401, message: '未授权访问' } };
      const records = this.likes.filter(l => l.userId === user.id);
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: { records, total: records.length } } };
    }

    if (method === 'GET' && pathname === '/api/memos') {
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = parseInt(url.searchParams.get('pageSize') || '15', 10);
      const allRecords = Array.from(this.memos.values());
      const total = allRecords.length;
      const start = (Math.max(1, page) - 1) * pageSize;
      const records = allRecords.slice(start, start + pageSize);
      return { status: 200, ok: true, json: { code: 200, message: 'success', data: { records, total, page: Math.max(1, page), pageSize } } };
    }

    if (method === 'POST' && pathname === '/api/memos') {
      if (!user || user.role !== 'ADMIN') {
        return { status: 403, ok: false, json: { code: 403, message: '权限不足：仅管理员可发布随记' } };
      }
      const newId = ++this.nextMemoId;
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

    // =========================================================================
    // 9. ADMIN USER MANAGEMENT, ANALYTICS & AUDIT LOGS
    // =========================================================================
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
