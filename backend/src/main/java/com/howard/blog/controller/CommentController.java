package com.howard.blog.controller;

import com.howard.blog.common.PageResult;
import com.howard.blog.common.Result;
import com.howard.blog.dto.CommentCreateRequest;
import com.howard.blog.entity.User;
import com.howard.blog.service.CommentService;
import com.howard.blog.service.UserService;
import com.howard.blog.vo.CommentVO;
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

    @GetMapping
    public Result<List<CommentVO>> getComments(
            @RequestParam String targetType,
            @RequestParam Long targetId) {
        return Result.success(commentService.getCommentTree(targetType, targetId));
    }

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

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        commentService.updateStatus(id, status);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return Result.success();
    }
}
