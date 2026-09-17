package com.hayden.blog.controller;

import com.hayden.blog.annotation.AuditLog;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.common.Result;
import com.hayden.blog.dto.CommentCreateRequest;
import com.hayden.blog.entity.User;
import com.hayden.blog.service.CommentService;
import com.hayden.blog.service.UserService;
import com.hayden.blog.vo.CommentVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserService userService;

    @GetMapping({"", "/tree"})
    public Result<List<CommentVO>> getComments(
            @RequestParam String targetType,
            @RequestParam Long targetId) {
        return Result.success(commentService.getCommentTree(targetType, targetId));
    }

    @AuditLog(module = "评论互动", operation = "发表评论")
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Result<Long> createComment(@Valid @RequestBody CommentCreateRequest request) {
        User currentUser = userService.getCurrentUser();
        return Result.success(commentService.createComment(request, currentUser.getId()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<CommentVO>> getAdminComments(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String status) {
        return Result.success(commentService.getAdminComments(page, pageSize, status));
    }

    @AuditLog(module = "评论互动", operation = "审核评论状态")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        commentService.updateStatus(id, status);
        return Result.success();
    }

    @AuditLog(module = "评论互动", operation = "删除评论")
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return Result.success();
    }
}
