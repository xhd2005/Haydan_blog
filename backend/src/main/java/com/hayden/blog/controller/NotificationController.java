package com.hayden.blog.controller;

import com.hayden.blog.common.PageResult;
import com.hayden.blog.common.Result;
import com.hayden.blog.entity.Notification;
import com.hayden.blog.entity.User;
import com.hayden.blog.service.NotificationService;
import com.hayden.blog.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public Result<PageResult<Notification>> getMyNotifications(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize) {
        User user = userService.getCurrentUser();
        return Result.success(notificationService.getMyNotifications(user.getId(), page, pageSize));
    }

    @GetMapping("/unread-count")
    public Result<Long> getUnreadCount() {
        User user = userService.getCurrentUser();
        return Result.success(notificationService.getUnreadCount(user.getId()));
    }

    @PutMapping("/{id}/read")
    public Result<Void> markAsRead(@PathVariable Long id) {
        User user = userService.getCurrentUser();
        notificationService.markAsRead(id, user.getId());
        return Result.success();
    }

    @PutMapping("/read-all")
    public Result<Void> markAllAsRead() {
        User user = userService.getCurrentUser();
        notificationService.markAllAsRead(user.getId());
        return Result.success();
    }
}
