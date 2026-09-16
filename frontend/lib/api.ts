import { ApiResponse, PageResult, Post, Project, Journey, JourneyImage, NowRecord, Timeline, SiteSetting, Media, DashboardStats, Category, Tag, LoginResponse, User, Memo, Friend, Comment, UserManageVO, AuditLog, AnalyticsOverview, AnalyticsTrend, AnalyticsTopPost, AnalyticsSource, AiChatRequest, FriendActivity, FriendApplyRequest, FriendInspectResult, KnowledgeGraphVO, AiCodeLensRequest, AiCodeLensResponse, AiInlineLensRequest, AiInlineLensResponse, AiCuratedPathRequest, AiCuratedPathVO, AiExtractRadarRequest, AiRadarInsight, AiStreamTranslateRequest, AiBacklinkSuggestionVO, AiProviderConfig, AiProviderTestRequest, AiProviderTestResponse, AiCitationItem, AiEditorAssistRequest, AiEditorAssistResponse, LikeToggleVO, UserLikeItem, UserCommentItem, InAppNotification } from './types';

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // 浏览器客户端：通过 Next.js rewrites 代理或自定义外部地址
    return process.env.NEXT_PUBLIC_API_BASE || '';
  }
  // 服务端 Node.js SSR / RSC 环境：必须使用包含协议和域名的绝对地址
  return (
    process.env.INTERNAL_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    'http://localhost:8080'
  );
}

export class ApiError extends Error {
  code: number;
  constructor(message: string, code: number = 500) {
    super(message);
    this.code = code;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hayden_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const fetchOptions: RequestInit = {
      ...options,
      headers,
    };
    if (options.cache) {
      fetchOptions.cache = options.cache;
    }

    const res = await fetch(url, fetchOptions);

    const json: ApiResponse<T> = await res.json().catch(() => {
      throw new ApiError('网络请求解析失败', res.status);
    });

    if (json.code !== 200) {
      throw new ApiError(json.message || '请求失败', json.code);
    }

    return json.data;
  } catch (err: any) {
    if (typeof window === 'undefined') {
      console.error(`[Server API Error] 请求 ${url} 失败:`, err.message);
    }
    throw err;
  }
}

export const api = {
  // Auth
  getCaptchaStatus: (username?: string) =>
    request<{ captchaRequired: boolean }>(`/api/auth/captcha-status${username ? `?username=${encodeURIComponent(username)}` : ''}`),
  getCaptcha: () =>
    request<{ captchaKey: string; captchaImage: string; imageBase64: string }>('/api/auth/captcha'),
  login: (data: { username: string; password: string; captchaKey?: string; captchaCode?: string }) =>
    request<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { username: string; password: string; nickname?: string; email?: string; avatar?: string }) =>
    request<LoginResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<User>('/api/auth/me'),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request<void>('/api/auth/password', { method: 'PUT', body: JSON.stringify(data) }),
  updateProfile: (data: Partial<User>) =>
    request<void>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Posts
  getPosts: (params?: { page?: number; pageSize?: number; category?: string; tag?: string; keyword?: string; lang?: string; maturity?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.category) query.set('category', params.category);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.keyword) query.set('keyword', params.keyword);
    if (params?.lang) query.set('lang', params.lang);
    if (params?.maturity) query.set('maturity', params.maturity);
    return request<PageResult<Post>>(`/api/posts?${query.toString()}`);
  },
  getFeaturedPosts: (limit = 3) => request<Post[]>(`/api/posts/featured?limit=${limit}`),
  getLatestPosts: (limit = 3) => request<Post[]>(`/api/posts/latest?limit=${limit}`),
  getPostBySlug: (slug: string) => request<Post>(`/api/posts/${slug}`),
  getPostById: (id: number) => request<Post>(`/api/posts/id/${id}`),
  likePost: (id: number) => request<void>(`/api/posts/${id}/like`, { method: 'POST' }),

  // Admin Posts
  getAdminPosts: (params?: { page?: number; pageSize?: number; status?: string; keyword?: string; lang?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.keyword) query.set('keyword', params.keyword);
    if (params?.lang) query.set('lang', params.lang);
    return request<PageResult<Post>>(`/api/posts/admin?${query.toString()}`);
  },
  deriveTranslation: (id: number) =>
    request<Post>(`/api/posts/${id}/derive-translation`, { method: 'POST' }),
  createPost: (data: Partial<Post> & { tagIds?: number[]; translationPostId?: number | null; lang?: string }) =>
    request<number>('/api/posts', { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id: number, data: Partial<Post> & { tagIds?: number[]; translationPostId?: number | null; lang?: string }) =>
    request<void>(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePost: (id: number) => request<void>(`/api/posts/${id}`, { method: 'DELETE' }),
  updatePostStatus: (id: number, status: string) =>
    request<void>(`/api/posts/${id}/status?status=${status}`, { method: 'PATCH' }),
  updatePostFeatured: (id: number, featured: number) =>
    request<void>(`/api/posts/${id}/featured?featured=${featured}`, { method: 'PATCH' }),

  // Categories & Tags
  getCategories: () => request<Category[]>('/api/categories'),
  createCategory: (data: Partial<Category>) => request<void>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: number, data: Partial<Category>) => request<void>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: number) => request<void>(`/api/categories/${id}`, { method: 'DELETE' }),

  getTags: () => request<Tag[]>('/api/tags'),
  createTag: (data: Partial<Tag>) => request<void>('/api/tags', { method: 'POST', body: JSON.stringify(data) }),
  updateTag: (id: number, data: Partial<Tag>) => request<void>(`/api/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTag: (id: number) => request<void>(`/api/tags/${id}`, { method: 'DELETE' }),

  // Projects
  getProjects: () => request<Project[]>('/api/projects'),
  getFeaturedProjects: () => request<Project[]>('/api/projects/featured'),
  getProjectBySlug: (slug: string) => request<Project>(`/api/projects/${slug}`),
  getAdminProjects: (params?: { page?: number; pageSize?: number; status?: string; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.keyword) query.set('keyword', params.keyword);
    return request<PageResult<Project>>(`/api/projects/admin?${query.toString()}`);
  },
  createProject: (data: Partial<Project>) => request<number>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: Partial<Project>) => request<void>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<void>(`/api/projects/${id}`, { method: 'DELETE' }),

  // Journey
  getJourneys: () => request<Journey[]>('/api/journey'),
  getLatestJourneys: (limit = 3) => request<Journey[]>(`/api/journey/latest?limit=${limit}`),
  getJourneyBySlug: (slug: string) => request<{ journey: Journey; images: JourneyImage[] }>(`/api/journey/${slug}`),
  getAdminJourneys: (params?: { page?: number; pageSize?: number; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.keyword) query.set('keyword', params.keyword);
    return request<PageResult<Journey>>(`/api/journey/admin?${query.toString()}`);
  },
  createJourney: (data: any) => request<number>('/api/journey', { method: 'POST', body: JSON.stringify(data) }),
  updateJourney: (id: number, data: any) => request<void>(`/api/journey/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJourney: (id: number) => request<void>(`/api/journey/${id}`, { method: 'DELETE' }),

  // Now
  getNow: () => request<NowRecord>('/api/now'),
  updateNow: (data: Partial<NowRecord>) => request<void>('/api/now', { method: 'PUT', body: JSON.stringify(data) }),

  // Timeline
  getTimelines: () => request<Timeline[]>('/api/timeline'),
  createTimeline: (data: Partial<Timeline>) => request<void>('/api/timeline', { method: 'POST', body: JSON.stringify(data) }),
  updateTimeline: (id: number, data: Partial<Timeline>) => request<void>(`/api/timeline/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimeline: (id: number) => request<void>(`/api/timeline/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<SiteSetting>('/api/settings'),
  updateSettings: (data: Partial<SiteSetting>) => request<void>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  testMinio: (data?: any) => request<{ success: boolean; message: string; bucketExists?: boolean; latencyMs?: number }>('/api/settings/test-minio', { method: 'POST', body: JSON.stringify(data || {}) }),

  // Media
  getMedia: (params?: { page?: number; pageSize?: number; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.keyword) query.set('keyword', params.keyword);
    return request<PageResult<Media>>(`/api/media?${query.toString()}`);
  },
  getPresignedUrl: async (filename: string, contentType: string, size?: number) => {
    return request<{
      uploadUrl: string;
      objectKey: string;
      publicUrl: string;
      storageType: string;
      mediaId?: number;
    }>('/api/media/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ filename, contentType, size }),
      headers: { 'Content-Type': 'application/json' },
    });
  },
  uploadMedia: async (file: File) => {
    // 1. 优先尝试 S3 / MinIO 预签名直传对象存储
    let presignedMediaId: number | undefined;
    try {
      const presigned = await api.getPresignedUrl(file.name, file.type, file.size);
      if (presigned && presigned.uploadUrl) {
        presignedMediaId = presigned.mediaId;
        const directRes = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });
        if (directRes.ok) {
          return {
            id: presigned.mediaId ?? Date.now(),
            filename: file.name,
            url: presigned.publicUrl,
            objectKey: presigned.objectKey,
            mimeType: file.type,
            size: file.size,
            storageType: presigned.storageType,
            createdAt: new Date().toISOString(),
          } as unknown as Media;
        } else if (presignedMediaId) {
          api.deleteMedia(presignedMediaId).catch(() => {});
        }
      }
    } catch (e) {
      if (presignedMediaId) {
        api.deleteMedia(presignedMediaId).catch(() => {});
      }
      console.warn('预签名直传失败或未启用，平滑降级为服务器代理上传:', e);
    }

    // 2. 降级为服务器代理上传
    const formData = new FormData();
    formData.append('file', file);
    return request<Media>('/api/media/upload', {
      method: 'POST',
      body: formData,
    });
  },
  deleteMedia: (id: number) => request<void>(`/api/media/${id}`, { method: 'DELETE' }),

  // 用户公开主页（脱敏只读）
  getPublicUserProfile: (username: string, page = 1, pageSize = 10) =>
    request<{
      profile: {
        username: string;
        nickname?: string;
        avatar?: string;
        bio?: string;
        github?: string;
        website?: string;
        createdAt: string;
      };
      comments: PageResult<{ targetType: string; targetId: number; content: string; createdAt: string }>;
      likeCount: number;
    }>(`/api/users/${encodeURIComponent(username)}/public?page=${page}&pageSize=${pageSize}`),

  // Unified Likes Engine (统一点赞引擎)
  toggleLike: (targetType: string, targetId: number) =>
    request<LikeToggleVO>('/api/likes/toggle', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId }),
    }),
  getLikeBatchStatus: (targetType: string, targetIds: number[]) =>
    request<Record<string, boolean>>('/api/likes/batch-status', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetIds }),
    }),

  // Memos
  getMemos: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return request<PageResult<Memo>>(`/api/memos?${query.toString()}`);
  },
  createMemo: (data: Partial<Memo>) => request<number>('/api/memos', { method: 'POST', body: JSON.stringify(data) }),
  deleteMemo: (id: number) => request<void>(`/api/memos/${id}`, { method: 'DELETE' }),
  likeMemo: (id: number) => request<void>(`/api/memos/${id}/like`, { method: 'POST' }),
  togglePinMemo: (id: number) => request<void>(`/api/memos/${id}/pin`, { method: 'PATCH' }),

  // Friends
  getFriends: () => request<Friend[]>('/api/friends'),
  getFriendStream: () => request<FriendActivity[]>('/api/friends/stream'),
  inspectFriendSite: (url: string) => request<FriendInspectResult>(`/api/friends/inspect?url=${encodeURIComponent(url)}`),
  applyFriend: (data: FriendApplyRequest) => request<void>('/api/friends/apply', { method: 'POST', body: JSON.stringify(data) }),
  getAdminFriends: () => request<Friend[]>('/api/friends/admin'),
  createFriend: (data: Partial<Friend>) => request<number>('/api/friends', { method: 'POST', body: JSON.stringify(data) }),
  updateFriend: (id: number, data: Partial<Friend>) => request<void>(`/api/friends/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  auditFriend: (id: number, status: string) => request<void>(`/api/friends/${id}/status?status=${status}`, { method: 'PATCH' }),
  deleteFriend: (id: number) => request<void>(`/api/friends/${id}`, { method: 'DELETE' }),

  // Comments
  getComments: (targetType: string, targetId: number) =>
    request<Comment[]>(`/api/comments?targetType=${targetType}&targetId=${targetId}`),
  createComment: (data: { targetType: string; targetId: number; parentId?: number; content: string }) =>
    request<number>('/api/comments', { method: 'POST', body: JSON.stringify(data) }),
  getAdminComments: (params?: { page?: number; pageSize?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    return request<PageResult<Comment>>(`/api/comments/admin?${query.toString()}`);
  },
  updateCommentStatus: (id: number, status: string) =>
    request<void>(`/api/comments/${id}/status?status=${status}`, { method: 'PATCH' }),
  deleteComment: (id: number) => request<void>(`/api/comments/${id}`, { method: 'DELETE' }),

  // Notifications (站内通知)
  getNotifications: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return request<PageResult<InAppNotification>>(`/api/notifications?${query.toString()}`);
  },
  getUnreadNotificationCount: () => request<number>('/api/notifications/unread-count'),
  markNotificationRead: (id: number) => request<void>(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<void>('/api/notifications/read-all', { method: 'PUT' }),

  // Dashboard
  getDashboardStats: () => request<DashboardStats>('/api/dashboard/stats'),

  // Reader Profile & Self Activity (用户中心与个人足迹)
  getMyProfile: () => request<User>('/api/user/profile'),
  updateMyProfile: (data: { nickname?: string; avatar?: string; bio?: string; github?: string; website?: string }) =>
    request<User>('/api/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  uploadMyAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ url: string }>('/api/user/avatar', {
      method: 'POST',
      body: formData,
    });
  },
  changeMyPassword: (data: { oldPassword: string; newPassword: string }) =>
    request<void>('/api/user/password', { method: 'PUT', body: JSON.stringify(data) }),
  getMyComments: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return request<PageResult<UserCommentItem>>(`/api/user/my-comments?${query.toString()}`);
  },
  getMyLikes: (params?: { targetType?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.targetType) query.set('targetType', params.targetType);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return request<PageResult<UserLikeItem>>(`/api/user/my-likes?${query.toString()}`);
  },

  // Admin Users
  getAdminUsers: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.keyword) query.set('keyword', params.keyword);
    if (params?.status) query.set('status', params.status);
    return request<PageResult<UserManageVO>>(`/api/admin/users?${query.toString()}`);
  },
  updateUserStatus: (id: number, status: string) =>
    request<void>(`/api/admin/users/${id}/status?status=${status}`, { method: 'PUT' }),

  // Admin Analytics
  getAnalyticsOverview: () => request<AnalyticsOverview>('/api/admin/analytics/overview'),
  getAnalyticsTrend: () => request<AnalyticsTrend[]>('/api/admin/analytics/trend'),
  getAnalyticsTopPosts: () => request<AnalyticsTopPost[]>('/api/admin/analytics/top-posts'),
  getAnalyticsSources: () => request<AnalyticsSource[]>('/api/admin/analytics/sources'),

  // Admin Audit Logs
  getAdminAuditLogs: (params?: { page?: number; pageSize?: number; module?: string; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.module) query.set('module', params.module);
    if (params?.keyword) query.set('keyword', params.keyword);
    return request<PageResult<AuditLog>>(`/api/admin/audit-logs?${query.toString()}`);
  },

  // Hayden AI Digital Twin & In-line Spark
  getAiStatus: () => request<{ enabled: boolean; hasKey: boolean; model: string }>('/api/ai/status'),
  testAiProvider: (req: AiProviderTestRequest) =>
    request<AiProviderTestResponse>('/api/ai/test-connection', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  streamAiChat: async (
    reqData: AiChatRequest,
    handlerOrOptions: ((chunk: string) => void) | {
      signal?: AbortSignal;
      onChunk?: (chunk: string) => void;
      onThinking?: (delta: string) => void;
      onContent?: (delta: string) => void;
      onCitations?: (citations: any[]) => void;
      onToolStatus?: (toolStatus: any) => void;
      onAction?: (action: any) => void;
      onQuota?: (quota: any) => void;
      onMeta?: (meta: any) => void;
      onDone?: () => void;
      onError?: (err: any) => void;
    },
    legacyOnDone?: () => void,
    legacyOnError?: (err: any) => void
  ) => {
    const callbacks =
      typeof handlerOrOptions === 'function'
        ? { onChunk: handlerOrOptions, onDone: legacyOnDone, onError: legacyOnError, signal: undefined }
        : handlerOrOptions;

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/ai/chat`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hayden_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(reqData),
        signal: callbacks.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new ApiError('UNAUTHORIZED', 401);
        }
        throw new ApiError(`AI 请求失败: ${response.statusText}`, response.status);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let currentEvent = 'message';

      const handleEventBlock = (event: string, rawData: string) => {
        const trimmed = rawData.trim();
        if (trimmed === '[DONE]') {
          callbacks.onDone?.();
          return true;
        }

        let isJson = false;
        let parsed: any = null;
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object') {
              isJson = true;
            }
          } catch {
            isJson = false;
          }
        }

        if (isJson && parsed) {
          // 严密拦截 quota 配额首包与 meta 元数据，绝不泄漏至正文打字机队列
          if (event === 'quota' || parsed.type === 'quota' || ('allowed' in parsed && 'minuteRemaining' in parsed)) {
            callbacks.onQuota?.(parsed);
            return false;
          }
          if (event === 'meta' || parsed.type === 'meta') {
            callbacks.onMeta?.(parsed);
            return false;
          }
          if (parsed.type === 'error') {
            callbacks.onError?.(new Error(parsed.content || 'AI 推理服务异常'));
            return false;
          }
          if (parsed.type === 'thinking') {
            callbacks.onThinking?.(parsed.delta || '');
            callbacks.onChunk?.(rawData);
            return false;
          }
          if (parsed.type === 'citations') {
            callbacks.onCitations?.(Array.isArray(parsed.data) ? parsed.data : []);
            callbacks.onChunk?.(rawData);
            return false;
          }
          if (parsed.type === 'tool_status') {
            callbacks.onToolStatus?.(parsed);
            callbacks.onChunk?.(rawData);
            return false;
          }
          if (parsed.type === 'action') {
            callbacks.onAction?.(parsed);
            callbacks.onChunk?.(rawData);
            return false;
          }
          if (parsed.type === 'delta') {
            if (parsed.content) {
              callbacks.onContent?.(parsed.content);
              callbacks.onChunk?.(parsed.content);
            }
            return false;
          }
        }

        // 屏蔽非正文事件
        if (event === 'quota' || event === 'meta') {
          return false;
        }

        if (event === 'thinking') {
          callbacks.onThinking?.(rawData);
          callbacks.onChunk?.(rawData);
        } else {
          callbacks.onContent?.(rawData);
          callbacks.onChunk?.(rawData);
        }
        return false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line || !line.trim()) {
            currentEvent = 'message';
            continue;
          }
          if (line.startsWith('event:')) {
            currentEvent = line.replace(/^event:\s*/, '').trim();
            continue;
          }
          if (line.startsWith('data:')) {
            const data = line.startsWith('data: ') ? line.substring(6) : line.substring(5);
            const isDone = handleEventBlock(currentEvent, data);
            if (isDone) return;
          }
        }
      }

      if (buffer.startsWith('data:')) {
        const data = buffer.startsWith('data: ') ? buffer.substring(6) : buffer.substring(5);
        handleEventBlock(currentEvent, data);
      }

      callbacks.onDone?.();
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
        callbacks.onDone?.();
        return;
      }
      console.error('[AI Chat Stream Error]', err);
      if (callbacks.onError) callbacks.onError(err);
      else throw err;
    }
  },

  // 知识图谱拓扑
  getKnowledgeGraph: () => request<KnowledgeGraphVO>('/api/ai/knowledge-graph'),

  // 代码块 AI 原地架构透视
  explainCode: (req: AiCodeLensRequest) =>
    request<AiCodeLensResponse>('/api/ai/code-lens', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // 划词轻量原地显微镜
  explainInline: (req: AiInlineLensRequest) =>
    request<AiInlineLensResponse>('/api/ai/inline-lens', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // 定制学习漫游路线生成器
  generateReadingPath: (req: AiCuratedPathRequest) =>
    request<AiCuratedPathVO>('/api/ai/reading-path', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // CMS 概念雷达提取
  extractRadar: (req: AiExtractRadarRequest) =>
    request<AiRadarInsight>('/api/ai/extract-radar', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // CMS 行内写作副驾（扩写、润色、生成代码、校对）
  editorAssist: (req: AiEditorAssistRequest) =>
    request<AiEditorAssistResponse>('/api/ai/editor-assist', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // CMS 双向链接建议
  getBacklinks: (postId: number) =>
    request<AiBacklinkSuggestionVO>(`/api/ai/backlinks/${postId}`),

  // 获取当前用户或访客 AI 额度状态
  getAiQuota: () =>
    request<{
      allowed: boolean;
      minuteRemaining: number;
      dayRemaining: number;
      maxTokens: number;
      clientType: string;
      reason: string;
    }>('/api/ai/quota'),

  // CMS 双栏流式双语技术精译
  streamTranslatePost: async (
    reqData: AiStreamTranslateRequest,
    onMeta: (meta: { title: string; excerpt: string; seoDescription: string }) => void,
    onDelta: (delta: string) => void,
    onDone?: () => void,
    onError?: (err: any) => void
  ) => {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/ai/stream-translate`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hayden_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(reqData),
      });

      if (!response.ok) {
        throw new Error(`翻译请求失败: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('data:')) {
            const raw = trimmed.replace(/^data:\s*/, '');
            if (raw === '[DONE]') {
              if (onDone) onDone();
              return;
            }
            try {
              const parsed = JSON.parse(raw);
              if (parsed.type === 'meta') {
                onMeta(parsed);
              } else if (parsed.type === 'delta') {
                onDelta(parsed.delta);
              }
            } catch {
              onDelta(raw);
            }
          }
        }
      }

      if (onDone) onDone();
    } catch (err) {
      console.error('[AI Translation Stream Error]', err);
      if (onError) onError(err);
      else throw err;
    }
  },
};
