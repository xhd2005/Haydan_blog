package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.entity.Notification;
import com.hayden.blog.mapper.NotificationMapper;
import com.hayden.blog.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl extends ServiceImpl<NotificationMapper, Notification> implements NotificationService {

    @Override
    public PageResult<Notification> getMyNotifications(Long userId, Long page, Long pageSize) {
        Page<Notification> pageParam = new Page<>(page, pageSize);
        LambdaQueryWrapper<Notification> queryWrapper = new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .orderByDesc(Notification::getCreatedAt);

        Page<Notification> notificationPage = page(pageParam, queryWrapper);
        return PageResult.of(notificationPage.getRecords(), notificationPage.getTotal(), page, pageSize);
    }

    @Override
    public long getUnreadCount(Long userId) {
        return count(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0));
    }

    @Override
    public void markAsRead(Long id, Long userId) {
        update(new LambdaUpdateWrapper<Notification>()
                .eq(Notification::getId, id)
                .eq(Notification::getUserId, userId)
                .set(Notification::getIsRead, 1));
    }

    @Override
    public void markAllAsRead(Long userId) {
        update(new LambdaUpdateWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .set(Notification::getIsRead, 1));
    }

    @Override
    public void sendNotification(Long userId, Long senderId, String senderName, String senderAvatar,
                                 String type, String targetType, Long targetId, String targetTitle, String content) {
        if (userId == null) {
            return;
        }
        // 自己对自己触发的事件不发通知
        if (senderId != null && senderId.equals(userId)) {
            return;
        }

        try {
            Notification notification = Notification.builder()
                    .userId(userId)
                    .senderId(senderId)
                    .senderName(senderName)
                    .senderAvatar(senderAvatar)
                    .type(type)
                    .targetType(targetType)
                    .targetId(targetId)
                    .targetTitle(targetTitle)
                    .content(content)
                    .isRead(0)
                    .createdAt(LocalDateTime.now())
                    .build();
            save(notification);
        } catch (Exception e) {
            log.warn("保存站内通知失败: {}", e.getMessage());
        }
    }
}
