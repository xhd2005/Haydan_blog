import { ApiResponse, PageResult, Post, Project, Journey, JourneyImage, NowRecord, Timeline, SiteSetting, Media, DashboardStats, Category, Tag, LoginResponse, User, Memo, Friend, Comment, UserManageVO, AuditLog, AnalyticsOverview, AnalyticsTrend, AnalyticsTopPost, AnalyticsSource, AiChatRequest } from './types';

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
    const token = localStorage.getItem('hayden_token') || localStorage.getItem('howard_token');
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
  resetAttempts: (username?: string) =>
    request<void>(`/api/auth/reset-attempts${username ? `?username=${encodeURIComponent(username)}` : ''}`, { method: 'POST' }),
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
  getPosts: (params?: { page?: number; pageSize?: number; category?: string; tag?: string; keyword?: string; lang?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.category) query.set('category', params.category);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.keyword) query.set('keyword', params.keyword);
    if (params?.lang) query.set('lang', params.lang);
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

  // Media
  getMedia: (params?: { page?: number; pageSize?: number; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.keyword) query.set('keyword', params.keyword);
    return request<PageResult<Media>>(`/api/media?${query.toString()}`);
  },
  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<Media>('/api/media/upload', {
      method: 'POST',
      body: formData,
    });
  },
  deleteMedia: (id: number) => request<void>(`/api/media/${id}`, { method: 'DELETE' }),

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
  getAdminFriends: () => request<Friend[]>('/api/friends/admin'),
  createFriend: (data: Partial<Friend>) => request<number>('/api/friends', { method: 'POST', body: JSON.stringify(data) }),
  updateFriend: (id: number, data: Partial<Friend>) => request<void>(`/api/friends/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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

  // Dashboard
  getDashboardStats: () => request<DashboardStats>('/api/dashboard/stats'),

  // Reader Profile & Self Activity
  getMyProfile: () => request<User>('/api/user/profile'),
  updateMyProfile: (data: { nickname?: string; avatar?: string }) =>
    request<User>('/api/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changeMyPassword: (data: { oldPassword: string; newPassword: string }) =>
    request<void>('/api/user/password', { method: 'PUT', body: JSON.stringify(data) }),
  getMyComments: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return request<PageResult<Comment>>(`/api/user/my-comments?${query.toString()}`);
  },
  getMyLikes: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return request<PageResult<Memo>>(`/api/user/my-likes?${query.toString()}`);
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
  streamAiChat: async (
    reqData: AiChatRequest,
    onChunk: (chunk: string) => void,
    onDone?: () => void,
    onError?: (err: any) => void
  ) => {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/ai/chat`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reqData),
      });

      if (!response.ok) {
        throw new Error(`AI 请求失败: ${response.statusText}`);
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
            const data = trimmed.replace(/^data:\s*/, '');
            if (data === '[DONE]') {
              if (onDone) onDone();
              return;
            }
            onChunk(data);
          }
        }
      }

      if (buffer.trim().startsWith('data:')) {
        const data = buffer.trim().replace(/^data:\s*/, '');
        if (data !== '[DONE]') {
          onChunk(data);
        }
      }

      if (onDone) onDone();
    } catch (err) {
      console.error('[AI Chat Stream Error]', err);
      if (onError) onError(err);
      else throw err;
    }
  },
};
