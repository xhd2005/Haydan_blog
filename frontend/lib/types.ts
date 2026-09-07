export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  role: string;
  status: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  username: string;
  nickname: string;
  avatar?: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover?: string;
  categoryId?: number;
  category?: Category;
  tags?: Tag[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: number;
  readingTime: number;
  viewCount: number;
  likeCount: number;
  lang?: string;
  maturity?: 'SEEDLING' | 'BUDDING' | 'EVERGREEN';
  revisionCount?: number;
  translationPostId?: number | null;
  translationPostSlug?: string;
  translationPostTitle?: string;
  translationPost?: {
    id: number;
    title: string;
    slug: string;
    lang: string;
    status: string;
  };
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  prevPost?: { id: number; title: string; slug: string; cover?: string };
  nextPost?: { id: number; title: string; slug: string; cover?: string };
  relatedPosts?: { id: number; title: string; slug: string; cover?: string }[];
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description?: string;
  content?: string;
  cover?: string;
  technologies?: string;
  githubUrl?: string;
  demoUrl?: string;
  featured: number;
  status: 'PLANNING' | 'DEVELOPING' | 'COMPLETED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyImage {
  id: number;
  journeyId: number;
  imageUrl: string;
  caption?: string;
  sortOrder: number;
}

export interface Journey {
  id: number;
  title: string;
  slug: string;
  country: string;
  city: string;
  description?: string;
  content?: string;
  cover?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NowRecord {
  id: number;
  learning?: string;
  building?: string;
  exploring?: string;
  thinking?: string;
  updatedAt: string;
}

export interface Timeline {
  id: number;
  year: string;
  title: string;
  description?: string;
  sortOrder: number;
}

export interface SiteSetting {
  id: number;
  siteName: string;
  siteDescription?: string;
  slogan: string;
  bio?: string;
  logo?: string;
  avatar?: string;
  email?: string;
  githubUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  heroTitle?: string;
  heroSlogan?: string;
  heroDescription?: string;
  heroBio?: string;
  aboutBioZh?: string;
  aboutBioEn?: string;
  aboutInterests?: string;
  interestsJson?: string;
  announcementEnabled?: number;
  announcementText?: string;
  announcementLink?: string;
  footerText?: string;
  icpNumber?: string;
  bgMusicUrl?: string;
  aiEnabled?: number;
  aiBaseUrl?: string;
  aiModel?: string;
  aiApiKey?: string;
  aiSystemPrompt?: string;
  lifePulseJson?: string;
}

export interface LifePulseState {
  statusText: string;
  statusTextEn: string;
  project: string;
  city: string;
  listening?: string;
  active: boolean;
  updatedAt?: string;
}

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiChatRequest {
  prompt?: string;
  messages?: AiChatMessage[];
  articleId?: number;
  selectedText?: string;
}

export interface Memo {
  id: number;
  content: string;
  images?: string;
  location?: string;
  likeCount?: number;
  isPinned: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Friend {
  id: number;
  name: string;
  url: string;
  avatar?: string;
  description?: string;
  category?: string;
  sortOrder: number;
  status: string | number;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: number;
  targetType: string;
  targetId: number;
  userId: number;
  userNickname: string;
  userAvatar?: string;
  userRole: string;
  parentId?: number;
  replyToUserNickname?: string;
  content: string;
  status: string;
  createdAt: string;
  replies?: Comment[];
}

export type CommentVO = Comment;
export type PageResponse<T> = PageResult<T>;

export interface Media {
  id: number;
  filename: string;
  objectKey: string;
  url: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalProjects: number;
  totalJourneys: number;
  totalViews: number;
  recentPosts: Post[];
}

export interface UserManageVO {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  role: string;
  status: string;
  commentCount: number;
  lastLoginIp?: string;
  lastLoginTime?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  username: string;
  clientIp: string;
  module: string;
  operation: string;
  method: string;
  params?: string;
  status: number;
  errorMsg?: string;
  durationMs: number;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalPv: number;
  totalUv: number;
  todayPv: number;
  todayUv: number;
  totalPosts: number;
  totalComments: number;
}

export interface AnalyticsTrend {
  visit_date: string;
  pv: number;
  uv: number;
}

export interface AnalyticsTopPost {
  id: number;
  title: string;
  slug: string;
  viewCount: number;
  likeCount: number;
}

export interface AnalyticsSource {
  source: string;
  count: number;
}
