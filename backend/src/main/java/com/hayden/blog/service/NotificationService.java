package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.entity.Notification;

public interface NotificationService extends IService<Notification> {

    PageResult<Notification> getMyNotifications(Long userId, Long page, Long pageSize);

    long getUnreadCount(Long userId);

    void markAsRead(Long id, Long userId);

    void markAllAsRead(Long userId);

    void sendNotification(Long userId, Long senderId, String senderName, String senderAvatar,
                          String type, String targetType, Long targetId, String targetTitle, String content);
}
