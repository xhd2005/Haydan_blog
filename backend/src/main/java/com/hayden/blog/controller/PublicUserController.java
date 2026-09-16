package com.hayden.blog.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.common.Result;
import com.hayden.blog.entity.Comment;
import com.hayden.blog.entity.User;
import com.hayden.blog.entity.UserLike;
import com.hayden.blog.mapper.CommentMapper;
import com.hayden.blog.mapper.UserLikeMapper;
import com.hayden.blog.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 用户公开主页接口（2026-09-09）
 *
 * 只读 + 字段白名单脱敏：仅返回昵称/头像/注册时间与已审核公开评论，
 * 绝不暴露 email、role、passwordHash 等敏感字段。
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class PublicUserController {

    private final UserService userService;
    private final CommentMapper commentMapper;
    private final UserLikeMapper userLikeMapper;

    @GetMapping("/{username}/public")
    public Result<Map<String, Object>> getPublicProfile(
            @PathVariable String username,
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize) {

        User user = userService.getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
                .eq(User::getStatus, "ACTIVE"));
        if (user == null) {
            return Result.error(404, "用户不存在或已停用");
        }

        // 已审核公开评论分页（社区足迹）
        Page<Comment> commentPage = commentMapper.selectPage(
                new Page<>(page, pageSize),
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getUserId, user.getId())
                        .eq(Comment::getStatus, "APPROVED")
                        .orderByDesc(Comment::getCreatedAt)
        );

        List<Map<String, Object>> comments = commentPage.getRecords().stream().map(c -> {
            Map<String, Object> item = new HashMap<>();
            item.put("targetType", c.getTargetType());
            item.put("targetId", c.getTargetId());
            item.put("content", c.getContent());
            item.put("createdAt", c.getCreatedAt());
            return item;
        }).collect(Collectors.toList());

        long likeCount = userLikeMapper.selectCount(
                new LambdaQueryWrapper<UserLike>().eq(UserLike::getUserId, user.getId()));

        Map<String, Object> profile = new HashMap<>();
        profile.put("username", user.getUsername());
        profile.put("nickname", user.getNickname());
        profile.put("avatar", user.getAvatar());
        profile.put("bio", user.getBio());
        profile.put("github", user.getGithub());
        profile.put("website", user.getWebsite());
        profile.put("createdAt", user.getCreatedAt());

        Map<String, Object> data = new HashMap<>();
        data.put("profile", profile);
        data.put("comments", PageResult.of(comments, commentPage.getTotal(), page, pageSize));
        data.put("likeCount", likeCount);
        return Result.success(data);
    }
}
