'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, MessageSquare, Heart, ShieldCheck, Sparkles, ExternalLink, X } from 'lucide-react';
import { api } from '@/lib/api';
import { InAppNotification } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { readAuthUserRaw } from '@/lib/storage-keys';
import { useI18n } from '@/lib/i18n';

export function NotificationDrawer() {
  const { locale } = useI18n();
  const isEn = locale === 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const checkAuthAndFetch = async () => {
    const raw = readAuthUserRaw();
    if (raw) {
      setIsLoggedIn(true);
      try {
        const count = await api.getUnreadNotificationCount();
        setUnreadCount(count || 0);
      } catch {
        setUnreadCount(0);
      }
    } else {
      setIsLoggedIn(false);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    checkAuthAndFetch();
    window.addEventListener('auth-change', checkAuthAndFetch);
    const interval = setInterval(checkAuthAndFetch, 30000); // 30秒轮询探测
    return () => {
      window.removeEventListener('auth-change', checkAuthAndFetch);
      clearInterval(interval);
    };
  }, []);

  const loadNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      setLoading(true);
      const res = await api.getNotifications({ page: 1, pageSize: 20 });
      setNotifications(res.records || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOpen = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  const getTargetUrl = (n: InAppNotification) => {
    const type = (n.targetType || '').toUpperCase();
    switch (type) {
      case 'POST':
        return `/blog#comment-section`;
      case 'JOURNEY':
        return `/journey`;
      case 'MEMO':
        return `/memos`;
      case 'PROJECT':
        return `/projects`;
      default:
        return `/profile`;
    }
  };

  return (
    <div className="relative" ref={drawerRef}>
      {/* 触发铃铛按钮 */}
      <button
        onClick={handleToggleOpen}
        aria-label={isEn ? 'Notifications' : '通知消息'}
        title={isEn ? 'Notifications' : '通知消息'}
        className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors focus:outline-none"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
        )}
      </button>

      {/* 下拉浮层抽屉 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl z-50 overflow-hidden"
          >
            {/* 头部标题与一键已读 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-secondary/30">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {isEn ? 'Notifications' : '站内通知'}
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/25">
                    {unreadCount} {isEn ? 'unread' : '条未读'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-emerald-500 px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Mark all' : '全标已读'}</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 通知列表 */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
              {loading ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>{isEn ? 'Loading notifications...' : '正在同步通知...'}</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center mx-auto text-muted-foreground">
                    <Sparkles className="w-5 h-5 text-emerald-500/70" />
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {isEn ? 'Quiet In Digital Garden' : '暂无新通知'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isEn ? 'When others reply or like your thoughts, you will see it here.' : '当有读者回复、赞赏你的思考时，会在此处提醒。'}
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const isUnread = n.isRead === 0;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                        isUnread
                          ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] hover:bg-emerald-500/[0.08]'
                          : 'hover:bg-secondary/40'
                      }`}
                    >
                      {/* 发送者头像或图标 */}
                      <div className="relative shrink-0">
                        <SafeImage
                          src={n.senderAvatar || DEFAULT_AVATAR}
                          alt={n.senderName || 'Sender'}
                          aspectRatio="1/1"
                          containerClassName="w-8 h-8 rounded-full overflow-hidden border border-border"
                        />
                        <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-card border border-border">
                          {n.type === 'COMMENT_LIKE' ? (
                            <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                          ) : n.type === 'COMMENT_APPROVED' ? (
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <MessageSquare className="w-2.5 h-2.5 text-cyan-500" />
                          )}
                        </span>
                      </div>

                      {/* 通知主体 */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-semibold text-foreground truncate">
                            {n.senderName || (isEn ? 'System' : '系统通知')}
                          </span>
                          <span className="text-muted-foreground text-[10px] font-mono shrink-0">
                            {n.createdAt?.split('T')[0] || ''}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 leading-snug line-clamp-2">
                          {n.content}
                        </p>
                        {n.targetTitle && (
                          <div className="text-[10px] font-mono text-muted-foreground/80 truncate flex items-center gap-1 pt-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400">#</span>
                            <span className="truncate">{n.targetTitle}</span>
                          </div>
                        )}
                      </div>

                      {/* 跳转目标链接 */}
                      <Link
                        href={getTargetUrl(n)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                          setIsOpen(false);
                        }}
                        className="self-center p-1.5 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-secondary shrink-0 transition-colors"
                        title={isEn ? 'View context' : '直达上下文'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
