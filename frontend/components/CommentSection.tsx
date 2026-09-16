'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { readAuthUserRaw } from '@/lib/storage-keys';
import { Comment } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { AuthModal } from './AuthModal';
import { SafeImage } from './SafeImage';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { toast } from '@/lib/toast';
import { UnifiedLikeButton } from '@/components/ui/UnifiedLikeButton';
import { 
  MessageSquare, 
  Send, 
  Reply, 
  CornerDownRight, 
  Loader2, 
  ShieldCheck, 
  Trash2, 
  Smile, 
  Sparkles,
  Clock
} from 'lucide-react';

interface CommentSectionProps {
  targetType: 'POST' | 'JOURNEY' | 'MEMO' | 'PROJECT';
  targetId: number;
}

const COMMON_EMOJIS = ['👍', '❤️', '💡', '🚀', '🔥', '👏', '🌿', '✨', '🎉', '☕'];

export function CommentSection({ targetType, targetId }: CommentSectionProps) {
  const { t, locale } = useI18n();
  const isEn = locale === 'en';
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const loadComments = async () => {
    try {
      const list = await api.getComments(targetType, targetId);
      setComments(list || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = () => {
    const raw = readAuthUserRaw();
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    loadComments();
    checkUser();
    window.addEventListener('auth-change', checkUser);
    return () => window.removeEventListener('auth-change', checkUser);
  }, [targetType, targetId]);

  // 支持从 URL hash 滚动到指定评论
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading && comments.length > 0) {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#comment-')) {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-emerald-500/50', 'bg-emerald-500/[0.03]');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-emerald-500/50', 'bg-emerald-500/[0.03]');
          }, 3000);
        }
      }
    }
  }, [loading, comments]);

  const insertEmoji = (emoji: string, isReply: boolean = false) => {
    if (isReply) {
      setReplyContent((prev) => prev + emoji);
    } else {
      setContent((prev) => prev + emoji);
    }
  };

  const handleSubmit = async (parentId?: number) => {
    const textToSubmit = parentId ? replyContent.trim() : content.trim();
    if (!textToSubmit) return;

    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      await api.createComment({
        targetType,
        targetId,
        parentId,
        content: textToSubmit,
      });

      if (parentId) {
        setReplyContent('');
        setReplyParentId(null);
      } else {
        setContent('');
      }

      toast.success(
        currentUser.role === 'ADMIN'
          ? (isEn ? 'Comment published successfully' : '评论已公开发表')
          : (isEn ? 'Comment submitted! It will appear once approved.' : '评论已提交！通过审核后将公开发布。')
      );
      await loadComments();
    } catch (err: any) {
      toast.error(err.message || t('comment.fail'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!window.confirm(isEn ? 'Are you sure you want to delete this comment?' : '确定要撤回/删除这条评论吗？')) {
      return;
    }
    try {
      await api.deleteComment(id);
      toast.success(isEn ? 'Comment removed' : '评论已成功撤回');
      await loadComments();
    } catch (err: any) {
      toast.error(err.message || (isEn ? 'Failed to delete' : '删除失败'));
    }
  };

  return (
    <section id="comment-section" className="space-y-8 pt-10 border-t border-border">
      {/* 评论区标题与登录状态 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-500" />
          <h3 className="text-xl font-bold text-foreground tracking-tight">
            {t('comment.title')}
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary font-mono text-muted-foreground border border-border/60">
            {comments.length}
          </span>
        </div>

        {!currentUser && (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{t('comment.need_login')}</span>
            <Sparkles className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 主评论输入面板 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border space-y-3 shadow-sm transition-all focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder={t('comment.placeholder')}
          className="w-full p-3 rounded-xl bg-secondary/50 border border-border/80 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 resize-none transition-colors"
        />

        {/* 快捷表情选择栏 */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-border/50 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-mono mr-1">
              <Smile className="w-3.5 h-3.5" />
            </span>
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji, false)}
                className="hover:scale-125 transition-transform text-sm p-1 rounded-md hover:bg-secondary"
                title={`插入 ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-muted-foreground text-xs">
              {currentUser ? (
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>{currentUser.nickname || currentUser.username}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  {t('comment.not_logged_in')}
                </button>
              )}
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer text-xs"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{t('comment.submit')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-500" />
          <span>{t('comment.loading')}</span>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((item) => {
            const isAuthor = currentUser && (currentUser.id === item.userId || currentUser.username === item.userNickname);
            const isPending = item.status === 'PENDING';
            const isSiteOwner = item.userRole === 'ADMIN' || item.userNickname === 'Hayden Xue';

            return (
              <div
                key={item.id}
                id={`comment-${item.id}`}
                className="group p-4 sm:p-5 rounded-2xl bg-card border border-border space-y-3 transition-all hover:shadow-md"
              >
                {/* 评论头部 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SafeImage
                      src={item.userAvatar || DEFAULT_AVATAR}
                      alt={item.userNickname}
                      aspectRatio="1/1"
                      containerClassName="w-9 h-9 rounded-full overflow-hidden bg-secondary border border-border shrink-0 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-foreground">
                          {item.userNickname}
                        </span>

                        {/* 站长专属微光认证徽章 (Hayden Xue) */}
                        {isSiteOwner ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <span>HAYDEN XUE // 站长</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-secondary text-muted-foreground font-mono">
                            读者
                          </span>
                        )}

                        {/* 待审核友好提示标签 */}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-2.5 h-2.5" />
                            {isEn ? 'Pending review' : '待审核 · 仅本人可见'}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(item.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN')}
                      </span>
                    </div>
                  </div>

                  {/* 头部操作区：点赞、回复与作者撤回 */}
                  <div className="flex items-center gap-2">
                    {/* 评论点赞 */}
                    <UnifiedLikeButton
                      targetType="COMMENT"
                      targetId={item.id}
                      initialLikes={item.likeCount || 0}
                      initialLiked={item.liked || false}
                      size="sm"
                      variant="ghost"
                    />

                    {/* 回复按钮 */}
                    <button
                      onClick={() => setReplyParentId(replyParentId === item.id ? null : item.id)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium p-1.5 rounded-lg hover:bg-secondary transition-colors"
                      title={t('comment.reply')}
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('comment.reply')}</span>
                    </button>

                    {/* 作者撤回按钮 */}
                    {isAuthor && (
                      <button
                        onClick={() => handleDeleteComment(item.id)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title={isEn ? 'Withdraw comment' : '撤回评论'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 评论正文 */}
                <p className="text-xs sm:text-sm text-foreground/90 pl-12 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </p>

                {/* 二级回复嵌套 */}
                {item.replies && item.replies.length > 0 && (
                  <div className="pl-12 pt-2 space-y-2.5">
                    {item.replies.map((reply) => {
                      const isReplyOwner = reply.userRole === 'ADMIN' || reply.userNickname === 'Hayden Xue';
                      const isReplyAuthor = currentUser && (currentUser.id === reply.userId || currentUser.username === reply.userNickname);
                      return (
                        <div
                          key={reply.id}
                          id={`comment-${reply.id}`}
                          className="p-3.5 rounded-xl bg-secondary/50 border border-border/60 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <SafeImage
                                src={reply.userAvatar || DEFAULT_AVATAR}
                                alt={reply.userNickname}
                                aspectRatio="1/1"
                                containerClassName="w-6 h-6 rounded-full overflow-hidden bg-secondary border border-border shrink-0"
                              />
                              <span className="font-bold text-foreground">{reply.userNickname}</span>
                              {isReplyOwner ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  HAYDEN XUE
                                </span>
                              ) : null}
                              <span className="text-muted-foreground text-[10px] font-mono">
                                {new Date(reply.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <UnifiedLikeButton
                                targetType="COMMENT"
                                targetId={reply.id}
                                initialLikes={reply.likeCount || 0}
                                initialLiked={reply.liked || false}
                                size="sm"
                                variant="ghost"
                              />
                              {isReplyAuthor && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-muted-foreground hover:text-rose-500 p-1 rounded-md"
                                  title={isEn ? 'Withdraw' : '撤回'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-muted-foreground whitespace-pre-wrap pl-8">
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 回复输入区域 */}
                {replyParentId === item.id && (
                  <div className="pl-12 pt-2 space-y-2">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>{t('comment.replying_to')} @{item.userNickname}:</span>
                    </div>

                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={2}
                      placeholder={t('comment.reply_placeholder')}
                      className="w-full p-2.5 rounded-xl bg-secondary/80 border border-border text-xs text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                    />

                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        {COMMON_EMOJIS.slice(0, 5).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmoji(emoji, true)}
                            className="text-sm p-0.5 hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setReplyParentId(null)}
                          className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs transition-colors"
                        >
                          {t('comment.cancel')}
                        </button>
                        <button
                          onClick={() => handleSubmit(item.id)}
                          disabled={submitting || !replyContent.trim()}
                          className="px-3 py-1.5 rounded-lg bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50 text-xs transition-opacity"
                        >
                          {submitting ? t('comment.sending') : t('comment.submit')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl space-y-2">
          <p>{t('comment.empty')}</p>
          <p className="text-[11px] text-muted-foreground/70">
            {isEn ? 'Be the first to share your insights.' : '欢迎留下第一条独特的见解与思考。'}
          </p>
        </div>
      )}

      {/* 登录弹窗 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => checkUser()}
      />
    </section>
  );
}
