package com.howard.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.howard.blog.common.PageResult;
import com.howard.blog.dto.CommentCreateRequest;
import com.howard.blog.entity.Comment;
import com.howard.blog.entity.User;
import com.howard.blog.exception.BusinessException;
import com.howard.blog.mapper.CommentMapper;
import com.howard.blog.mapper.UserMapper;
import com.howard.blog.service.CommentService;
import com.howard.blog.vo.CommentVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl extends ServiceImpl<CommentMapper, Comment> implements CommentService {

    private final UserMapper userMapper;
    private final com.howard.blog.service.EmailService emailService;

    @Override
    public List<CommentVO> getCommentTree(String targetType, Long targetId) {
        List<Comment> allComments = list(new LambdaQueryWrapper<Comment>()
                .eq(Comment::getTargetType, targetType.toUpperCase())
                .eq(Comment::getTargetId, targetId)
                .eq(Comment::getStatus, "APPROVED")
                .orderByAsc(Comment::getCreatedAt));

        if (allComments.isEmpty()) {
            return Collections.emptyList();
        }

        // 批量查询用户信息
        Set<Long> userIds = allComments.stream().map(Comment::getUserId).collect(Collectors.toSet());
        Map<Long, User> userMap = userIds.isEmpty() ? Collections.emptyMap()
                : userMapper.selectBatchIds(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));

        // 组装 VO 列表
        List<CommentVO> voList = allComments.stream().map(c -> {
            User user = userMap.get(c.getUserId());
            return CommentVO.builder()
                    .id(c.getId())
                    .targetType(c.getTargetType())
                    .targetId(c.getTargetId())
                    .userId(c.getUserId())
                    .userNickname(user != null ? (StringUtils.hasText(user.getNickname()) ? user.getNickname() : user.getUsername()) : "匿名读者")
                    .userAvatar(user != null ? user.getAvatar() : null)
                    .userRole(user != null ? user.getRole() : "USER")
                    .parentId(c.getParentId())
                    .content(c.getContent())
                    .status(c.getStatus())
                    .createdAt(c.getCreatedAt())
                    .replies(new ArrayList<>())
                    .build();
        }).collect(Collectors.toList());

        // 构造树形结构（顶级评论 + 二级回复）
        Map<Long, CommentVO> voMap = voList.stream().collect(Collectors.toMap(CommentVO::getId, v -> v));
        List<CommentVO> rootList = new ArrayList<>();

        for (CommentVO vo : voList) {
            if (vo.getParentId() == null || vo.getParentId() == 0L || !voMap.containsKey(vo.getParentId())) {
                rootList.add(vo);
            } else {
                CommentVO parent = voMap.get(vo.getParentId());
                vo.setReplyToUserNickname(parent.getUserNickname());
                parent.getReplies().add(vo);
            }
        }

        return rootList;
    }

    @Override
    public PageResult<CommentVO> getAdminComments(Long page, Long pageSize, String status) {
        LambdaQueryWrapper<Comment> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) {
            wrapper.eq(Comment::getStatus, status.toUpperCase());
        }
        wrapper.orderByDesc(Comment::getCreatedAt);

        Page<Comment> commentPage = page(new Page<>(page, pageSize), wrapper);
        List<Comment> records = commentPage.getRecords();
        if (records.isEmpty()) {
            return PageResult.of(Collections.emptyList(), 0L, page, pageSize);
        }

        Set<Long> userIds = records.stream().map(Comment::getUserId).collect(Collectors.toSet());
        Map<Long, User> userMap = userIds.isEmpty() ? Collections.emptyMap()
                : userMapper.selectBatchIds(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));

        List<CommentVO> voList = records.stream().map(c -> {
            User user = userMap.get(c.getUserId());
            return CommentVO.builder()
                    .id(c.getId())
                    .targetType(c.getTargetType())
                    .targetId(c.getTargetId())
                    .userId(c.getUserId())
                    .userNickname(user != null ? (StringUtils.hasText(user.getNickname()) ? user.getNickname() : user.getUsername()) : "读者")
                    .userAvatar(user != null ? user.getAvatar() : null)
                    .userRole(user != null ? user.getRole() : "USER")
                    .parentId(c.getParentId())
                    .content(c.getContent())
                    .status(c.getStatus())
                    .createdAt(c.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return PageResult.of(voList, commentPage.getTotal(), page, pageSize);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createComment(CommentCreateRequest request, Long userId) {
        Comment comment = Comment.builder()
                .targetType(request.getTargetType().toUpperCase())
                .targetId(request.getTargetId())
                .userId(userId)
                .parentId(request.getParentId())
                .content(request.getContent().trim())
                .status("APPROVED")
                .build();

        save(comment);

        // 异步发送新评论与回复通知邮件
        try {
            User author = userMapper.selectById(userId);
            String authorName = author != null && StringUtils.hasText(author.getNickname()) ? author.getNickname() : "读者";
            emailService.sendNewCommentNotification(request.getTargetType() + " #" + request.getTargetId(), authorName, request.getContent());

            if (request.getParentId() != null && request.getParentId() > 0) {
                Comment parent = getById(request.getParentId());
                if (parent != null) {
                    User parentUser = userMapper.selectById(parent.getUserId());
                    if (parentUser != null && StringUtils.hasText(parentUser.getEmail())) {
                        emailService.sendReplyNotification(parentUser.getEmail(), request.getTargetType() + " #" + request.getTargetId(), authorName, request.getContent());
                    }
                }
            }
        } catch (Exception ignored) {}

        return comment.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, String status) {
        Comment comment = getById(id);
        if (comment == null) {
            throw new BusinessException(404, "评论不存在");
        }
        comment.setStatus(status.toUpperCase());
        updateById(comment);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteComment(Long id) {
        Comment comment = getById(id);
        if (comment == null) {
            throw new BusinessException(404, "评论不存在");
        }

        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new org.springframework.security.access.AccessDeniedException("未登录，无权删除评论");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()));

        if (!isAdmin) {
            String username = com.howard.blog.security.SecurityUtils.getCurrentUsername();
            if (username == null) {
                throw new org.springframework.security.access.AccessDeniedException("未登录，无权删除评论");
            }
            User currentUser = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
            if (currentUser == null || !Objects.equals(comment.getUserId(), currentUser.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("无权删除他人评论");
            }
        }

        removeById(id);
    }
}
