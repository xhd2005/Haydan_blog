'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Comment } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { AuthModal } from './AuthModal';
import { SafeImage } from './SafeImage';
import { toast } from '@/lib/toast';
import { MessageSquare, Send, Reply, CornerDownRight, Loader2, ShieldCheck } from 'lucide-react';

interface CommentSectionProps {
  targetType: 'POST' | 'JOURNEY' | 'MEMO';
  targetId: number;
}

export function CommentSection({ targetType, targetId }: CommentSectionProps) {
  const { t, locale } = useI18n();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
    const raw = localStorage.getItem('hayden_user') || localStorage.getItem('howard_user');
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
      toast.success(t('comment.success'));
      await loadComments();
    } catch (err: any) {
      toast.error(err.message || t('comment.fail'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-8 pt-10 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-500" />
          <h3 className="text-xl font-bold text-foreground">{t('comment.title')}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary font-mono text-muted-foreground">
            {comments.length}
          </span>
        </div>

        {!currentUser && (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            {t('comment.need_login')}
          </button>
        )}
      </div>

      {/* Main Comment Input */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder={t('comment.placeholder')}
          className="w-full p-3 rounded-xl bg-secondary/70 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 resize-none"
        />

        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="text-muted-foreground">
            {currentUser ? (
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>{currentUser.nickname || currentUser.username}</span>
              </span>
            ) : (
              <span>{t('comment.not_logged_in')}</span>
            )}
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={submitting || !content.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{t('comment.submit')}</span>
          </button>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
          <span>{t('comment.loading')}</span>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-card border border-border space-y-3">
              {/* Comment Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <SafeImage
                    src={item.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'}
                    alt={item.userNickname}
                    aspectRatio="1/1"
                    containerClassName="w-8 h-8 rounded-full overflow-hidden bg-secondary border border-border shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground">{item.userNickname}</span>
                      {item.userRole === 'ADMIN' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-2.5 h-2.5" /> {t('comment.admin_badge')}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(item.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setReplyParentId(replyParentId === item.id ? null : item.id)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>{t('comment.reply')}</span>
                </button>
              </div>

              {/* Comment Content */}
              <p className="text-xs text-muted-foreground pl-10 whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>

              {/* Nested Replies */}
              {item.replies && item.replies.length > 0 && (
                <div className="pl-10 pt-2 space-y-2.5">
                  {item.replies.map((reply) => (
                    <div key={reply.id} className="p-3 rounded-xl bg-secondary/50 border border-border/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground">{reply.userNickname}</span>
                          {reply.userRole === 'ADMIN' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {t('comment.admin_badge')}
                            </span>
                          )}
                          <span className="text-muted-foreground text-[10px] font-mono">
                            {new Date(reply.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}
                          </span>
                        </div>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input Box */}
              {replyParentId === item.id && (
                <div className="pl-10 pt-2 space-y-2">
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CornerDownRight className="w-3 h-3" />
                    <span>{t('comment.replying_to')} @{item.userNickname}:</span>
                  </div>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={2}
                    placeholder={t('comment.reply_placeholder')}
                    className="w-full p-2.5 rounded-xl bg-secondary/80 border border-border text-xs text-foreground focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setReplyParentId(null)}
                      className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
                    >
                      {t('comment.cancel')}
                    </button>
                    <button
                      onClick={() => handleSubmit(item.id)}
                      disabled={submitting || !replyContent.trim()}
                      className="px-3 py-1.5 rounded-lg bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {submitting ? t('comment.sending') : t('comment.submit')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
          {t('comment.empty')}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => checkUser()}
      />
    </section>
  );
}
