package com.howard.blog.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.howard.blog.annotation.AuditLog;
import com.howard.blog.common.PageResult;
import com.howard.blog.common.Result;
import com.howard.blog.entity.Comment;
import com.howard.blog.entity.User;
import com.howard.blog.exception.BusinessException;
import com.howard.blog.mapper.CommentMapper;
import com.howard.blog.service.UserService;
import com.howard.blog.vo.UserManageVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;
    private final CommentMapper commentMapper;

    @GetMapping
    public Result<PageResult<UserManageVO>> getUsers(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {

        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) {
            wrapper.eq(User::getStatus, status.toUpperCase());
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(User::getUsername, keyword)
                    .or().like(User::getNickname, keyword)
                    .or().like(User::getEmail, keyword));
        }
        wrapper.orderByDesc(User::getCreatedAt);

        Page<User> userPage = userService.page(new Page<>(page, pageSize), wrapper);
        List<User> records = userPage.getRecords();

        if (records.isEmpty()) {
            return Result.success(PageResult.of(List.of(), userPage.getTotal(), page, pageSize));
        }

        // 批量统计评论数
        Set<Long> userIds = records.stream().map(User::getId).collect(Collectors.toSet());
        List<Comment> comments = commentMapper.selectList(new LambdaQueryWrapper<Comment>().in(Comment::getUserId, userIds));
        Map<Long, Long> commentCountMap = comments.stream()
                .collect(Collectors.groupingBy(Comment::getUserId, Collectors.counting()));

        List<UserManageVO> voList = records.stream().map(u -> UserManageVO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .nickname(u.getNickname())
                .avatar(u.getAvatar())
                .email(u.getEmail())
                .role(u.getRole())
                .status(u.getStatus())
                .commentCount(commentCountMap.getOrDefault(u.getId(), 0L))
                .lastLoginIp(u.getLastLoginIp())
                .lastLoginTime(u.getLastLoginTime())
                .createdAt(u.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        return Result.success(PageResult.of(voList, userPage.getTotal(), page, pageSize));
    }

    @AuditLog(module = "用户管理", operation = "修改用户状态")
    @PutMapping("/{id}/status")
    public Result<Void> updateUserStatus(@PathVariable Long id, @RequestParam String status) {
        User target = userService.getById(id);
        if (target == null) {
            throw new BusinessException(404, "目标用户不存在");
        }
        if ("ADMIN".equals(target.getRole()) || "ROLE_ADMIN".equals(target.getRole())) {
            throw new BusinessException(400, "不可修改超级管理员账号状态");
        }

        target.setStatus(status.toUpperCase());
        userService.updateById(target);
        return Result.success();
    }
}
