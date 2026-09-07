package com.howard.blog.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.howard.blog.common.PageResult;
import com.howard.blog.common.Result;
import com.howard.blog.dto.ChangePasswordRequest;
import com.howard.blog.entity.Comment;
import com.howard.blog.entity.Memo;
import com.howard.blog.entity.User;
import com.howard.blog.entity.UserLike;
import com.howard.blog.mapper.CommentMapper;
import com.howard.blog.mapper.MemoMapper;
import com.howard.blog.mapper.UserLikeMapper;
import com.howard.blog.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserService userService;
    private final CommentMapper commentMapper;
    private final UserLikeMapper userLikeMapper;
    private final MemoMapper memoMapper;

    @GetMapping("/profile")
    public Result<User> getProfile() {
        User user = userService.getCurrentUser();
        // 抹去哈希脱敏
        user.setPasswordHash(null);
        return Result.success(user);
    }

    @PutMapping("/profile")
    public Result<User> updateProfile(@RequestBody Map<String, String> body) {
        User user = userService.getCurrentUser();
        if (body.containsKey("nickname")) {
            user.setNickname(body.get("nickname"));
        }
        if (body.containsKey("avatar")) {
            user.setAvatar(body.get("avatar"));
        }
        userService.updateById(user);
        user.setPasswordHash(null);
        return Result.success(user);
    }

    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return Result.success();
    }

    @GetMapping("/my-comments")
    public Result<PageResult<Comment>> getMyComments(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize) {
        User user = userService.getCurrentUser();
        Page<Comment> commentPage = commentMapper.selectPage(
                new Page<>(page, pageSize),
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getUserId, user.getId())
                        .orderByDesc(Comment::getCreatedAt)
        );
        return Result.success(PageResult.of(commentPage.getRecords(), commentPage.getTotal(), page, pageSize));
    }

    @GetMapping("/my-likes")
    public Result<PageResult<Memo>> getMyLikes(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize) {
        User user = userService.getCurrentUser();
        Page<UserLike> likePage = userLikeMapper.selectPage(
                new Page<>(page, pageSize),
                new LambdaQueryWrapper<UserLike>()
                        .eq(UserLike::getUserId, user.getId())
                        .eq(UserLike::getTargetType, "MEMO")
                        .orderByDesc(UserLike::getCreatedAt)
        );

        List<UserLike> records = likePage.getRecords();
        if (records.isEmpty()) {
            return Result.success(PageResult.of(List.of(), likePage.getTotal(), page, pageSize));
        }

        List<Long> memoIds = records.stream().map(UserLike::getTargetId).collect(Collectors.toList());
        List<Memo> memos = memoMapper.selectBatchIds(memoIds);
        return Result.success(PageResult.of(memos, likePage.getTotal(), page, pageSize));
    }
}
