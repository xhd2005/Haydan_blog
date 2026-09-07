'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { User, Comment, Memo } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
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
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'comments' | 'likes'>('profile');

  // Profile Form State
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Likes State
  const [likes, setLikes] = useState<Memo[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getMyProfile();
      setUser(res);
      setNickname(res.nickname || '');
      setAvatar(res.avatar || '');
    } catch (err: any) {
      toast.error(err.message || t('profile.toast_login_required'));
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const res = await api.getMyComments({ page: 1, pageSize: 20 });
      setComments(res.records || []);
    } catch (err: any) {
      toast.error(t('profile.toast_comments_failed'));
    } finally {
      setLoadingComments(false);
    }
  };

  const loadLikes = async () => {
    try {
      setLoadingLikes(true);
      const res = await api.getMyLikes({ page: 1, pageSize: 20 });
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      toast.warning(t('profile.nickname_required'));
      return;
    }
    try {
      setSavingProfile(true);
      const updated = await api.updateMyProfile({ nickname, avatar });
      setUser(updated);
      // 同步本地缓存
      const cached = localStorage.getItem('hayden_user') || localStorage.getItem('howard_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          parsed.nickname = updated.nickname;
          parsed.avatar = updated.avatar;
          localStorage.setItem('hayden_user', JSON.stringify(parsed));
          localStorage.setItem('howard_user', JSON.stringify(parsed));
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-muted-foreground">{t('profile.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-muted-foreground">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t('profile.unauth_title')}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t('profile.unauth_desc')}</p>
        <button
          onClick={() => {
            window.dispatchEvent(new Event('open-auth-modal'));
          }}
          className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          {t('profile.unauth_login')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[75vh]">
      {/* User Header Profile Card */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <SafeImage
            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'}
            alt={user.nickname || user.username}
            aspectRatio="1/1"
            containerClassName="w-20 h-20 rounded-full overflow-hidden border-2 border-border shadow-inner shrink-0"
          />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{user.nickname || user.username}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                user.role === 'ADMIN' 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {user.role === 'ADMIN' ? t('profile.role_admin') : t('profile.role_reader')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono">
                {user.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{t('profile.account')}@{user.username} {user.email && `· ${user.email}`}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border mb-8 overflow-x-auto pb-px">
        <button
          onClick={() => handleTabChange('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
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
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
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
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'comments'
              ? 'border-primary text-foreground bg-secondary/40'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {t('profile.tab_comments')}
        </button>
        <button
          onClick={() => handleTabChange('likes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'likes'
              ? 'border-primary text-foreground bg-secondary/40'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className="w-4 h-4" />
          {t('profile.tab_likes')}
        </button>
      </div>

      {/* Tab 1: Profile Form */}
      {activeTab === 'profile' && (
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-2xl shadow-sm">
          <h2 className="text-lg font-semibold mb-1">{t('profile.edit_info')}</h2>
          <p className="text-xs text-muted-foreground mb-6">{t('profile.edit_info_desc')}</p>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t('profile.username_readonly')}</label>
              <input
                type="text"
                disabled
                value={user.username}
                className="w-full px-3.5 py-2 rounded-xl bg-secondary/60 border border-border text-muted-foreground text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{t('profile.nickname_label')}</label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('profile.nickname_placeholder')}
                className="w-full px-3.5 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{t('profile.avatar_label')}</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3.5 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">{t('profile.avatar_tip')}</p>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? t('profile.saving') : t('profile.save_btn')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security Form */}
      {activeTab === 'security' && (
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-2xl shadow-sm">
          <h2 className="text-lg font-semibold mb-1">{t('profile.security_title')}</h2>
          <p className="text-xs text-muted-foreground mb-6">{t('profile.security_desc')}</p>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{t('profile.old_password')}</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
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
                className="w-full px-3.5 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
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
                className="w-full px-3.5 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {savingPassword ? t('profile.updating_password') : t('profile.update_password_btn')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Comments List */}
      {activeTab === 'comments' && (
        <div>
          {loadingComments ? (
            <div className="py-16 text-center text-sm text-muted-foreground">{t('profile.loading_comments')}</div>
          ) : comments.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium">{t('profile.no_comments')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('profile.no_comments_desc')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-mono bg-secondary px-2 py-0.5 rounded">
                      {t('profile.comment_type')} {item.targetType} #{item.targetId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(item.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {item.status === 'APPROVED' ? t('profile.status_approved') : t('profile.status_pending')}
                    </span>
                    {item.targetType === 'POST' && (
                      <Link 
                        href={`/blog`} 
                        className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        {t('profile.view_post')} <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Likes List */}
      {activeTab === 'likes' && (
        <div>
          {loadingLikes ? (
            <div className="py-16 text-center text-sm text-muted-foreground">{t('profile.loading_likes')}</div>
          ) : likes.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium">{t('profile.no_likes')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('profile.no_likes_desc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {likes.map((memo) => (
                <div key={memo.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {memo.content}
                    </p>
                    {memo.images && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {memo.images.split(',').filter(Boolean).map((img, idx) => (
                          <SafeImage
                            key={idx}
                            src={img.trim()}
                            alt="Memo Attachment"
                            aspectRatio="1/1"
                            containerClassName="w-14 h-14 rounded-lg overflow-hidden border border-border shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(memo.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}
                    </span>
                    <span className="flex items-center gap-1 text-rose-500 font-medium">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      {memo.likeCount || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
