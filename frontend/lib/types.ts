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
  bio?: string;
  github?: string;
  website?: string;
  createdAt?: string;
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
  postCount?: number;
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
  aiRadarJson?: string;
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

export interface MusicTrack {
  title: string;
  artist: string;
  albumCover?: string;
  audioUrl?: string;
  platformUrl?: string;
  note?: string;
}

export interface NowRecord {
  id: number;
  learning?: string;
  building?: string;
  exploring?: string;
  thinking?: string;
  focusTopicsJson?: string;
  readingNotesJson?: string;
  currentCity?: string;
  microLogsJson?: string;
  musicTrackJson?: string;
  moodStatus?: string;
  moviesJson?: string;
  updatedAt: string;
}

export interface MovieItem {
  id: string;
  title: string;
  director?: string;
  year?: string;
  cover?: string;
  rating?: number;
  badge?: string;
  quote?: string;
  note?: string;
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
  heroBgType?: string;
  heroVideoUrl?: string;
  heroSloganConfigJson?: string;
  pageVisualsJson?: string;
  storageType?: string;
  minioEndpoint?: string;
  minioBucket?: string;
  minioAccessKey?: string;
  minioSecretKey?: string;
  minioPublicUrl?: string;
  aiProvidersJson?: string;
  readerDailyAiQuota?: number;
  commentModerationEnabled?: number;
  adminCommentExempt?: number;
}

export interface PageVisualItem {
  bgType?: 'image' | 'video' | 'obsidian';
  bgUrl?: string;
  customTitle?: string;
  customDesc?: string;
  customPlaceholder?: string;
  // 关于页专属排印与双面灵魂字体配置
  titleLine1?: string;
  titleLine2?: string;
  fontFamilyLine1?: string;
  fontFamilyLine2?: string;
  customFontLine1?: string;
  customFontLine2?: string;
}

export interface LoadingVisualsConfig {
  preloaderEnabled?: boolean;
  slogan?: string;
  durationMs?: number; // 800 | 1000 | 1200 | 1500
  showSkipHint?: boolean;
  enableRouteProgress?: boolean;
}

export interface PageVisualsConfig {
  blog?: PageVisualItem;
  projects?: PageVisualItem;
  journey?: PageVisualItem;
  about?: PageVisualItem;
  ai?: PageVisualItem;
  loading?: LoadingVisualsConfig;
}


export type HeroSloganColorScheme = 
  | 'emerald' 
  | 'cyan' 
  | 'violet' 
  | 'amber' 
  | 'rose' 
  | 'monochrome' 
  | 'custom';

export type HeroSloganFontStyle = 
  | 'handwrite' 
  | 'sans' 
  | 'serif' 
  | 'mono';

export interface HeroSloganLine {
  id: string;
  text: string;
  fontSize: number;
  colorScheme: HeroSloganColorScheme;
  customColorStart?: string;
  customColorEnd?: string;
  fontStyle: HeroSloganFontStyle;
  strokeWidth?: number;
}

export interface LifePulseState {
  statusText: string;
  statusTextEn: string;
  project: string;
  city: string;
  listening?: string;
  active?: boolean;
  updatedAt?: string;
}


export interface AiProviderConfig {
  id: string;
  name: string;
  provider: 'deepseek' | 'sensenova' | 'siliconflow' | 'openai' | 'custom';
  baseUrl: string;
  apiKey?: string;
  models: string[];
  defaultModel?: string;
  enabled: boolean;
  isDefault?: boolean;
  latencyMs?: number;
  status?: 'online' | 'offline' | 'untested';
}

export interface AiProviderTestRequest {
  provider?: string;
  baseUrl: string;
  apiKey: string;
  model?: string;
}

export interface AiProviderTestResponse {
  success: boolean;
  latencyMs: number;
  statusCode: number;
  message: string;
  availableModels: string[];
}

export interface AiCitationItem {
  type: string;
  title: string;
  slug: string;
  url: string;
  excerpt?: string;
  maturity?: string;
}

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  isThinkingOpen?: boolean;
}

export interface AiChatRequest {
  prompt?: string;
  messages?: { role: string; content: string }[];
  articleId?: number;
  selectedText?: string;
}

export interface AiConceptChip {
  name: string;
  essence: string;
  tag?: string;
}

export interface AiRadarInsight {
  summary: string;
  concepts: AiConceptChip[];
  prerequisites: string;
  difficulty: string;
  maturityReason?: string;
  suggestedTags?: string[];
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'post' | 'concept' | 'journey';
  maturity?: 'SEEDLING' | 'BUDDING' | 'EVERGREEN';
  slug?: string;
  url?: string;
  excerpt?: string;
  val: number;
  category?: string;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relation: string;
  weight: number;
}

export interface KnowledgeGraphVO {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  stats: {
    totalPosts: number;
    totalConcepts: number;
    totalJourneys: number;
    evergreenCount: number;
  };
}

export interface AiCodeLensRequest {
  code: string;
  lang?: string;
  context?: string;
}

export interface AiCodeLensResponse {
  mechanism: string;
  pitfalls: string;
  relatedConcepts: string[];
  advice: string;
}

export interface AiInlineLensRequest {
  selectedText: string;
  articleId?: number;
  actionType: 'DIGEST' | 'CRITICAL' | 'RESONANCE';
}

export interface AiInlineLensResponse {
  actionType: string;
  title: string;
  digest: string;
  resonances?: {
    id?: number;
    title: string;
    slug: string;
    maturity?: string;
    excerpt?: string;
    url?: string;
  }[];
}

export interface AiCuratedPathRequest {
  goal: string;
}

export interface AiCuratedPathStep {
  order: number;
  stepTitle: string;
  purpose: string;
  postSlug: string;
  postTitle: string;
  postExcerpt?: string;
  maturity?: string;
  readingTime?: string;
  keyTakeaway: string;
}

export interface AiCuratedPathVO {
  title: string;
  description: string;
  estimatedTotalTime: string;
  steps: AiCuratedPathStep[];
}

export interface AiExtractRadarRequest {
  title: string;
  content: string;
}

export interface AiEditorAssistRequest {
  text: string;
  action: 'POLISH' | 'EXPAND' | 'GENERATE_CODE' | 'PROOFREAD' | 'CUSTOM';
  prompt?: string;
  contextBefore?: string;
  contextAfter?: string;
}

export interface AiEditorAssistResponse {
  action: string;
  result: string;
  explanation?: string;
}

export interface AiStreamTranslateRequest {
  sourcePostId?: number;
  title: string;
  excerpt?: string;
  content: string;
  targetLang: string;
}

export interface AiBacklinkItem {
  postId: number;
  postTitle: string;
  postSlug: string;
  maturity?: string;
  resonanceReason: string;
  anchorConcept: string;
}

export interface AiBacklinkSuggestionVO {
  suggestions: AiBacklinkItem[];
}

export interface Memo {
  id: number;
  content: string;
  images?: string;
  location?: string;
  mood?: string;
  weather?: string;
  tags?: string;
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
  pingStatus?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  lastPingTime?: string;
  responseTimeMs?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface FriendActivity {
  id: string;
  friendName: string;
  friendAvatar?: string;
  friendUrl: string;
  title: string;
  link: string;
  publishedAt: string;
  snippet?: string;
}

export interface FriendApplyRequest {
  name: string;
  url: string;
  avatar?: string;
  description?: string;
  category?: string;
}

export interface FriendInspectResult {
  name: string;
  description?: string;
  avatar?: string;
  url: string;
  responseTimeMs?: number;
  online?: boolean;
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
  likeCount?: number;
  liked?: boolean;
  status: string;
  createdAt: string;
  replies?: Comment[];
}

export interface LikeToggleVO {
  liked: boolean;
  likeCount: number;
}

export interface UserLikeItem {
  likeId: number;
  targetType: string;
  targetId: number;
  title: string;
  slug?: string;
  cover?: string;
  excerpt?: string;
  likedAt: string;
}

export interface UserCommentItem {
  id: number;
  targetType: string;
  targetId: number;
  targetTitle: string;
  targetSlug?: string;
  parentId?: number;
  content: string;
  likeCount: number;
  status: string;
  createdAt: string;
}

export interface InAppNotification {
  id: number;
  userId: number;
  senderId?: number;
  senderName?: string;
  senderAvatar?: string;
  type: string;
  targetType?: string;
  targetId?: number;
  targetTitle?: string;
  content: string;
  isRead: number;
  createdAt: string;
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
