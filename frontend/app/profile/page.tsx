'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { User, UserCommentItem, UserLikeItem } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { AuthModal } from '@/components/AuthModal';
import { useI18n } from '@/lib/i18n';
import {
  User as UserIcon,
  Lock,
  MessageSquare,
  Heart,
  Clock,
  Save,
  Calendar,
  AlertCircle,
  ExternalLink,
  Upload,
  Sparkles,
  Trash2,
  Github,
  Globe,
  Award,
  CheckCircle2,
  BookOpen,
  Compass,
  Camera,
  FolderGit2,
  FileText,
  Bell,
  ArrowRight
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Atlas',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Lyra',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Orion',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Vega',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Hayden',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cosmos',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Zenith',
];

function getTargetUrl(targetType: string, targetId: number, slug?: string) {
  switch ((targetType || '').toUpperCase()) {
    case 'POST':
      return slug ? `/blog/${slug}` : `/blog`;
    case 'JOURNEY':
      return `/journey`;
    case 'MEMO':
      return `/memos`;
    case 'PROJECT':
      return slug ? `/projects/${slug}` : `/projects`;
    default:
      return `/`;
  }
}

function getTargetTypeMeta(targetType: string, locale: string) {
  const isEn = locale === 'en';
  switch ((targetType || '').toUpperCase()) {
    case 'POST':
      return {
        label: isEn ? 'Article' : '手记博文',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        Icon: BookOpen,
      };
    case 'JOURNEY':
      return {
        label: isEn ? 'Journey' : '旅行足迹',
        color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        Icon: Compass,
      };
    case 'MEMO':
      return {
        label: isEn ? 'Memo' : '随记动态',
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        Icon: Camera,
      };
    case 'PROJECT':
      return {
        label: isEn ? 'Project' : '实践项目',
        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        Icon: FolderGit2,
      };
    case 'COMMENT':
      return {
        label: isEn ? 'Comment' : '精彩回复',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        Icon: MessageSquare,
      };
    default:
      return {
        label: targetType,
        color: 'bg-secondary text-muted-foreground border-border',
        Icon: FileText,
      };
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const isEn = locale === 'en';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'comments' | 'likes'>('profile');

  // Profile Form State
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [website, setWebsite] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Comments State
  const [comments, setComments] = useState<UserCommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  // Likes State
  const [likes, setLikes] = useState<UserLikeItem[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [activeLikeFilter, setActiveLikeFilter] = useState<'ALL' | 'POST' | 'MEMO' | 'JOURNEY' | 'PROJECT'>('ALL');
  const [unlikingKey, setUnlikingKey] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    loadUserProfile();

    // 监听用户登录状态变动，重登或登出自动热刷新
    const handleAuthChange = () => {
      loadUserProfile();
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getMyProfile();
      setUser(res);
      setNickname(res.nickname || '');
      setAvatar(res.avatar || '');
      setBio(res.bio || '');
      setGithub(res.github || '');
      setWebsite(res.website || '');
    } catch (err: any) {
      toast.error(err.message || t('profile.toast_login_required'));
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const res = await api.getMyComments({ page: 1, pageSize: 50 });
      setComments(res.records || []);
    } catch (err: any) {
      toast.error(t('profile.toast_comments_failed'));
    } finally {
      setLoadingComments(false);
    }
  };

  const loadLikes = async (filterType = activeLikeFilter) => {
    try {
      setLoadingLikes(true);
      const targetTypeParam = filterType === 'ALL' ? undefined : filterType;
      const res = await api.getMyLikes({ targetType: targetTypeParam, page: 1, pageSize: 50 });
      setLikes(res.records || []);
    } catch (err: any) {
      toast.error(t('profile.toast_likes_failed'));
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleTabChange = (tab: 'profile' | 'security' | 'comments' | 'likes') => {
    setActiveTab(tab);
    if (tab === 'comments' && comments.length === 0) {
      loadComments();
    } else if (tab === 'likes' && likes.length === 0) {
      loadLikes();
    }
  };

  const handleLikeFilterChange = (filter: 'ALL' | 'POST' | 'MEMO' | 'JOURNEY' | 'PROJECT') => {
    setActiveLikeFilter(filter);
    loadLikes(filter);
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(isEn ? 'Please select an image file' : '请选择有效的图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning(isEn ? 'Avatar size cannot exceed 5MB' : '头像大小不能超过 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      const res = await api.uploadMyAvatar(file);
      if (res?.url) {
        setAvatar(res.url);
        toast.success(isEn ? 'Avatar uploaded successfully' : '头像上传成功');
      }
    } catch (err: any) {
      toast.error(err.message || (isEn ? 'Failed to upload avatar' : '头像上传失败'));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      toast.warning(t('profile.nickname_required'));
      return;
    }
    try {
      setSavingProfile(true);
      const updated = await api.updateMyProfile({
        nickname: nickname.trim(),
        avatar: avatar.trim(),
        bio: bio.trim(),
        github: github.trim(),
        website: website.trim(),
      });
      setUser(updated);

      // 同步本地缓存
      const cached = localStorage.getItem('hayden_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          parsed.nickname = updated.nickname;
          parsed.avatar = updated.avatar;
          localStorage.setItem('hayden_user', JSON.stringify(parsed));
        } catch (_) {}
      }
      window.dispatchEvent(new Event('auth-change'));
      toast.success(t('profile.save_success'));
    } catch (err: any) {
      toast.error(err.message || t('profile.save_failed'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.warning(t('profile.pwd_empty'));
      return;
    }
    if (newPassword.length < 6) {
      toast.warning(t('profile.pwd_min_length'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning(t('profile.pwd_mismatch'));
      return;
    }
    try {
      setSavingPassword(true);
      await api.changeMyPassword({ oldPassword, newPassword });
      toast.success(t('profile.pwd_success'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || t('profile.pwd_failed'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm(t('profile.delete_comment_confirm'))) return;
    try {
      setDeletingCommentId(commentId);
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((item) => item.id !== commentId));
      toast.success(t('profile.delete_comment_success'));
    } catch (err: any) {
      toast.error(err.message || (isEn ? 'Failed to delete comment' : '撤回评论失败'));
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleUnlike = async (targetType: string, targetId: number) => {
    const key = `${targetType}-${targetId}`;
    try {
      setUnlikingKey(key);
      await api.toggleLike(targetType, targetId);
      setLikes((prev) => prev.filter((item) => !(item.targetType === targetType && item.targetId === targetId)));
      toast.success(t('profile.unlike_success'));
    } catch (err: any) {
      toast.error(err.message || (isEn ? 'Failed to cancel like' : '取消点赞失败'));
    } finally {
      setUnlikingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-mono text-muted-foreground">{t('profile.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 min-h-[75vh] flex flex-col items-center justify-center">
        {/* 沉浸式三维景深透镜卡片 */}
        <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl">
          {/* 顶部极光微光弧线与环境光晕 */}
          <div className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 rounded-full bg-emerald-500/15 dark:bg-emerald-400/[0.1] blur-[100px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-cyan-500/[0.08] blur-[100px]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" aria-hidden="true" />

          {/* 头部：徽章与标语 */}
          <div className="text-center max-w-xl mx-auto space-y-3.5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>DIGITAL GARDEN // EXPLORER PASSPORT</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {isEn ? 'Join Hayden Xue Digital Garden' : '开启数字花园心智探索纪元'}
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isEn
                ? 'Sign in to access your personal exploration stardate, thoughtful discourse with Hayden Xue, and curated inspiration library.'
                : '登录后即可解锁您的专属星历档案、与站长 Hayden Xue 展开深度思辨研讨，并永久收录属于您的灵感收藏。'}
            </p>
          </div>

          {/* 4 大读者特权卡片 (2x2 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8 relative z-10">
            <div className="p-4 rounded-2xl bg-secondary/30 dark:bg-white/[0.03] border border-border/60 flex items-start gap-3.5 transition-all hover:bg-secondary/50">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-bold text-foreground">
                  {isEn ? 'Stardate Archives & Badges' : '专属星历档案与成长勋章'}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEn ? 'Record your journey milestones and unlock unique community explorer badges.' : '沉淀独属于你的 STARDATE 漫步纪元，点亮星际思辨与共建成就。'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 dark:bg-white/[0.03] border border-border/60 flex items-start gap-3.5 transition-all hover:bg-secondary/50">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-bold text-foreground">
                  {isEn ? 'Thoughtful Discourse' : '深度思想碰撞与研讨'}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEn ? 'Engage directly with Hayden Xue in articles and travelogues with rich Markdown and emoji reactions.' : '在手记、游记与项目详情中与 Hayden Xue 深度交流，支持 Emoji 与 Markdown。'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 dark:bg-white/[0.03] border border-border/60 flex items-start gap-3.5 transition-all hover:bg-secondary/50">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-bold text-foreground">
                  {isEn ? 'Curated Inspiration Library' : '心动灵感点赞与收藏'}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEn ? 'Bookmark insightful articles, tech memos, travelogues, and engineering creations.' : '全站一键红心收藏手记、随记、足迹与实践项目，多端随时回顾。'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 dark:bg-white/[0.03] border border-border/60 flex items-start gap-3.5 transition-all hover:bg-secondary/50">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-bold text-foreground">
                  {isEn ? 'Real-time In-App Echoes' : '即时回响与互动感知'}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEn ? 'Receive instant in-app alerts when your comments are replied, liked, or approved.' : '留言收到回复、评论获赞、审核通过即时在导航栏微光通知。'}
                </p>
              </div>
            </div>
          </div>

          {/* 底部双按钮 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 relative z-10">
            <button
              type="button"
              onClick={() => {
                setAuthModalOpen(true);
                window.dispatchEvent(new Event('open-auth-modal'));
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <UserIcon className="w-4 h-4" />
              <span>{isEn ? 'Sign In / Register Reader' : '立即登录 / 注册新读者'}</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <Link
              href="/blog"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium border border-border/80 transition-all hover:-translate-y-0.5"
            >
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span>{isEn ? 'Explore Articles First' : '先在花园漫步（浏览深度手记）'}</span>
            </Link>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => loadUserProfile()}
        />
      </div>
    );
  }

  // 勋章成就计算
  const badges = [
    {
      id: 'init',
      name: t('profile.badge_init'),
      desc: t('profile.badge_init_desc'),
      unlocked: true,
      icon: Sparkles,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'voice',
      name: t('profile.badge_voice'),
      desc: t('profile.badge_voice_desc'),
      unlocked: comments.length > 0,
      icon: MessageSquare,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'explorer',
      name: t('profile.badge_explorer'),
      desc: t('profile.badge_explorer_desc'),
      unlocked: likes.length >= 3,
      icon: Heart,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    },
    {
      id: 'architect',
      name: t('profile.badge_architect'),
      desc: t('profile.badge_architect_desc'),
      unlocked: comments.length >= 5 || likes.length >= 10,
      icon: Award,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[80vh] space-y-8">
      {/* 1. 顶部用户核心名片 (三维景深与星历微光) */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 dark:bg-emerald-400/[0.08] blur-[80px]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" aria-hidden="true" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left w-full md:w-auto">
            {/* 头像与呼吸光环 */}
            <div className="relative shrink-0 group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 opacity-50 blur-sm transition-all duration-300 group-hover:opacity-80" />
              <SafeImage
                src={user.avatar || DEFAULT_AVATAR}
                alt={user.nickname || user.username}
                aspectRatio="1/1"
                containerClassName="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-2 border-background shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background shadow-[0_0_8px_#10b981]" />
              </span>
            </div>

            {/* 用户身份与元数据 */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{user.nickname || user.username}</h1>
                <span
                  className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold border ${
                    user.role === 'ADMIN'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-secondary text-muted-foreground border-border'
                  }`}
                >
                  {user.role === 'ADMIN' ? 'HAYDEN XUE // 站长' : t('profile.role_reader')}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {user.status || 'ACTIVE'}
                </span>
              </div>

              <p className="text-xs font-mono text-muted-foreground">
                @{user.username} {user.email && `· ${user.email}`}
              </p>

              {user.bio ? (
                <p className="text-xs text-foreground/80 leading-relaxed max-w-xl line-clamp-2 pt-0.5">
                  {user.bio}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic pt-0.5">
                  {isEn ? 'No bio set yet. Share your thoughts in profile settings.' : '暂未设置个性简介，可前往资料设置中填写。'}
                </p>
              )}

              {/* 外链与加入星历 */}
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 flex-wrap text-xs">
                <StardateBadge date={user.createdAt} />
                {user.github && (
                  <a
                    href={user.github.startsWith('http') ? user.github : `https://${user.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-mono"
                  >
                    <Github className="w-3.5 h-3.5" />
                    GitHub
                  </a>
                )}
                {user.website && (
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors font-mono"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 快捷跳转公开主页与管理后台 */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full md:w-auto gap-3 pt-2 md:pt-0 border-t sm:border-t-0 border-border/50">
            <Link
              href={`/u/${encodeURIComponent(user.username)}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-secondary/80 hover:bg-secondary text-foreground border border-border transition-all hover:shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              {t('profile.public_page')}
            </Link>
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                {t('profile.enter_admin')}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. 读者星历与社区勋章成就栏 */}
      <section className="bg-slate-50/50 dark:bg-white/[0.02] border border-border/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('profile.badges_title')}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {badges.filter((b) => b.unlocked).length} / {badges.length} {isEn ? 'Unlocked' : '已点亮'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  b.unlocked
                    ? 'bg-card border-border/80 shadow-xs'
                    : 'bg-secondary/30 border-dashed border-border/60 opacity-50 grayscale'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg border ${b.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {b.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground truncate">{b.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. 标签导航栏 */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
        <button
          onClick={() => handleTabChange('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-primary text-foreground bg-secondary/40'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          {t('profile.tab_info')}
        </button>
        <button
          onClick={() => handleTabChange('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-primary text-foreground bg-secondary/40'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lock className="w-4 h-4" />
          {t('profile.tab_security')}
        </button>
        <button
          onClick={() => handleTabChange('comments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'comments'
              ? 'border-primary text-foreground bg-secondary/40'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {t('profile.tab_comments')}
          {comments.length > 0 && (
            <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground font-mono">
              {comments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('likes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'likes'
              ? 'border-primary text-foreground bg-secondary/40'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className="w-4 h-4" />
          {t('profile.tab_likes')}
          {likes.length > 0 && (
            <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-500 font-mono">
              {likes.length}
            </span>
          )}
        </button>
      </div>

      {/* 4. Tab 1: 个人资料与头像配置 */}
      {activeTab === 'profile' && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-3xl shadow-sm space-y-8">
          <div>
            <h2 className="text-lg font-bold text-foreground">{t('profile.edit_info')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('profile.edit_info_desc')}</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* 头像设置专属卡片 */}
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border/70 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('profile.avatar_label')}
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative shrink-0">
                  <SafeImage
                    src={avatar || DEFAULT_AVATAR}
                    alt="Avatar Preview"
                    aspectRatio="1/1"
                    containerClassName="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border shadow-inner"
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-2xl">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileSelect}
                    />
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingAvatar ? t('profile.avatar_uploading') : t('profile.avatar_upload_btn')}
                    </button>
                    <span className="text-[11px] text-muted-foreground">
                      {isEn ? 'Supports JPG, PNG, WebP ≤ 5MB' : '支持 JPG、PNG、WebP，大小不超过 5MB'}
                    </span>
                  </div>

                  <div>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3.5 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-mono transition-all"
                    />
                  </div>

                  {/* 预设精选数字头像 */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {t('profile.avatar_presets')}
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {PRESET_AVATARS.map((presetUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(presetUrl)}
                          className={`w-9 h-9 rounded-xl overflow-hidden border-2 shrink-0 transition-all hover:scale-105 ${
                            avatar === presetUrl
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-border opacity-80 hover:opacity-100'
                          }`}
                        >
                          <SafeImage src={presetUrl} alt={`Preset ${idx + 1}`} aspectRatio="1/1" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 用户名（只读）与显示昵称 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  {t('profile.username_readonly')}
                </label>
                <input
                  type="text"
                  disabled
                  value={user.username}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-border text-muted-foreground text-sm cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {t('profile.nickname_label')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t('profile.nickname_placeholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                />
              </div>
            </div>

            {/* 个人简介 Bio */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-foreground">{t('profile.bio_label')}</label>
                <span className="text-[10px] font-mono text-muted-foreground">{bio.length}/300</span>
              </div>
              <textarea
                rows={3}
                maxLength={300}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('profile.bio_placeholder')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all leading-relaxed"
              />
            </div>

            {/* 社交链接：GitHub & 个人站点 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('profile.github_label')}
                </label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('profile.website_label')}
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-mono transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? t('profile.saving') : t('profile.save_btn')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Tab 2: 账号安全 */}
      {activeTab === 'security' && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-2xl shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-1">{t('profile.security_title')}</h2>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{t('profile.security_desc')}</p>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{t('profile.old_password')}</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{t('profile.new_password')}</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{t('profile.confirm_password')}</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
              >
                <Lock className="w-4 h-4" />
                {savingPassword ? t('profile.updating_password') : t('profile.update_password_btn')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Tab 3: 我的评论足迹 */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              {isEn ? 'My Comments Footprint' : '我的评论足迹'}
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              {comments.length} {isEn ? 'records' : '条留言'}
            </span>
          </div>

          {loadingComments ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-mono text-muted-foreground">{t('profile.loading_comments')}</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-14 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">{t('profile.no_comments')}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                {t('profile.no_comments_desc')}
              </p>
              <Link
                href="/blog"
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                {isEn ? 'Explore Articles' : '前往浏览博文'}
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {comments.map((item) => {
                const meta = getTargetTypeMeta(item.targetType, locale);
                const targetUrl = getTargetUrl(item.targetType, item.targetId, item.targetSlug);
                const isApproved = item.status === 'APPROVED';

                return (
                  <div
                    key={item.id}
                    className="bg-card border border-border rounded-2xl p-5 shadow-sm transition-all hover:border-border/80 space-y-3"
                  >
                    {/* 目标实体信息与时间 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${meta.color}`}>
                          <meta.Icon className="w-3 h-3" />
                          {meta.label}
                        </span>

                        <Link
                          href={targetUrl}
                          className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1 max-w-md truncate"
                          title={item.targetTitle}
                        >
                          <span>{item.targetTitle || `${item.targetType} #${item.targetId}`}</span>
                          <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-muted-foreground text-[11px]">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* 评论正文 */}
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-1 border-l-2 border-primary/20">
                      {item.content}
                    </p>

                    {/* 底部状态、获赞与自主撤回操作 */}
                    <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isApproved ? t('profile.status_approved') : t('profile.status_pending')}
                        </span>

                        {item.likeCount > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-rose-500 font-medium">
                            <Heart className="w-3 h-3 fill-rose-500" />
                            {item.likeCount}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={deletingCommentId === item.id}
                        onClick={() => handleDeleteComment(item.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-rose-500/10 disabled:opacity-50"
                        title={t('profile.delete_comment_confirm')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Delete' : '撤回'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. Tab 4: 我的点赞灵感库 */}
      {activeTab === 'likes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">
              {isEn ? 'My Liked Creations' : '我点亮的数字灵感'}
            </h2>

            {/* 类型筛选胶囊栏 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { key: 'ALL', label: t('profile.likes_filter_all') },
                { key: 'POST', label: t('profile.likes_filter_post') },
                { key: 'MEMO', label: t('profile.likes_filter_memo') },
                { key: 'JOURNEY', label: t('profile.likes_filter_journey') },
                { key: 'PROJECT', label: t('profile.likes_filter_project') },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleLikeFilterChange(tab.key as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    activeLikeFilter === tab.key
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loadingLikes ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-mono text-muted-foreground">{t('profile.loading_likes')}</p>
            </div>
          ) : likes.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-14 text-center">
              <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">{t('profile.no_likes')}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                {t('profile.no_likes_desc')}
              </p>
              <Link
                href="/blog"
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                {isEn ? 'Explore Garden' : '探索花园灵感'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {likes.map((item) => {
                const meta = getTargetTypeMeta(item.targetType, locale);
                const targetUrl = getTargetUrl(item.targetType, item.targetId, item.slug);
                const isUnliking = unlikingKey === `${item.targetType}-${item.targetId}`;

                return (
                  <div
                    key={`${item.targetType}-${item.targetId}`}
                    className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5 group"
                  >
                    <div>
                      {/* 封面图展示 */}
                      {item.cover && (
                        <div className="mb-3.5 rounded-xl overflow-hidden border border-border/80">
                          <SafeImage
                            src={item.cover}
                            alt={item.title}
                            aspectRatio="16/9"
                            containerClassName="w-full h-36"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-semibold border ${meta.color}`}>
                          <meta.Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </div>

                      <Link href={targetUrl} className="group-hover:text-primary transition-colors">
                        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                      </Link>

                      {item.excerpt && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {item.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.likedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUnliking}
                          onClick={() => handleUnlike(item.targetType, item.targetId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 transition-colors border border-rose-500/20 disabled:opacity-50"
                          title={t('profile.unlike_btn')}
                        >
                          <Heart className="w-3 h-3 fill-rose-500" />
                          <span>{t('profile.unlike_btn')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 认证弹窗 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => loadUserProfile()}
      />
    </div>
  );
}
