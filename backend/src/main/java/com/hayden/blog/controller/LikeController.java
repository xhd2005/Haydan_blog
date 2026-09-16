package com.hayden.blog.controller;

import com.hayden.blog.common.Result;
import com.hayden.blog.dto.LikeBatchStatusRequest;
import com.hayden.blog.dto.LikeToggleRequest;
import com.hayden.blog.entity.User;
import com.hayden.blog.service.LikeService;
import com.hayden.blog.service.UserService;
import com.hayden.blog.vo.LikeToggleVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;
    private final UserService userService;
    private final com.hayden.blog.service.LikeRateLimiterService likeRateLimiterService;

    @PostMapping("/toggle")
    public Result<LikeToggleVO> toggleLike(@Valid @RequestBody LikeToggleRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        Long userId = null;
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser != null) {
                userId = currentUser.getId();
            }
        } catch (Exception ignored) {
            // 未登录匿名游客
        }

        if (userId == null) {
            String clientIp = com.hayden.blog.common.IpUtils.getClientIp(httpRequest);
            likeRateLimiterService.checkGuestLikeRateLimit(clientIp, request.getTargetType(), request.getTargetId());
        } else {
            likeRateLimiterService.checkUserLikeDebounce(userId, request.getTargetType(), request.getTargetId());
        }

        return Result.success(likeService.toggleLike(request, userId));
    }

    @PostMapping("/batch-status")
    public Result<Map<Long, Boolean>> getBatchStatus(@Valid @RequestBody LikeBatchStatusRequest request) {
        Long userId = null;
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser != null) {
                userId = currentUser.getId();
            }
        } catch (Exception ignored) {
            // 未登录匿名游客
        }
        return Result.success(likeService.getBatchStatus(request.getTargetType(), request.getTargetIds(), userId));
    }
}
