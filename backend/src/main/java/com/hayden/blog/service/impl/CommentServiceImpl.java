package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.dto.CommentCreateRequest;
import com.hayden.blog.entity.Comment;
import com.hayden.blog.entity.User;
import com.hayden.blog.entity.UserLike;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.mapper.CommentMapper;
import com.hayden.blog.mapper.UserMapper;
import com.hayden.blog.mapper.UserLikeMapper;
import com.hayden.blog.service.CommentService;
import com.hayden.blog.service.NotificationService;
import com.hayden.blog.vo.CommentVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@lombok.extern.slf4j.Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceImpl extends ServiceImpl<CommentMapper, Comment> implements CommentService {

    private final UserMapper userMapper;
    private final UserLikeMapper userLikeMapper;
    private final NotificationService notificationService;
    private final com.hayden.blog.service.EmailService emailService;
    private final com.hayden.blog.service.SiteSettingService siteSettingService;

    @Override
    public List<CommentVO> getCommentTree(String targetType, Long targetId) {
        Long currentUserId = null;
        try {
            String username = com.hayden.blog.security.SecurityUtils.getCurrentUsername();
            if (StringUtils.hasText(username)) {
                User cu = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
                if (cu != null) currentUserId = cu.getId();
            }
        } catch (Exception ignored) {}

        final Long loginUserId = currentUserId;
        LambdaQueryWrapper<Comment> queryWrapper = new LambdaQueryWrapper<Comment>()
                .eq(Comment::getTargetType, targetType.toUpperCase())
                .eq(Comment::getTargetId, targetId)
                .and(w -> {
                    w.eq(Comment::getStatus, "APPROVED");
                    if (loginUserId != null) {
                        w.or(sub -> sub.eq(Comment::getUserId, loginUserId).ne(Comment::getStatus, "DELETED"));
                    }
                })
                .orderByAsc(Comment::getCreatedAt);

        List<Comment> allComments = list(queryWrapper);

        if (allComments.isEmpty()) {
            return Collections.emptyList();
        }

        // 批量查询当前登录用户的点赞状态
        Set<Long> commentIds = allComments.stream().map(Comment::getId).collect(Collectors.toSet());
        Set<Long> userLikedCommentIds = new HashSet<>();
        if (currentUserId != null && !commentIds.isEmpty()) {
            List<UserLike> userLikes = userLikeMapper.selectList(new LambdaQueryWrapper<UserLike>()
                    .eq(UserLike::getUserId, currentUserId)
                    .eq(UserLike::getTargetType, "COMMENT")
                    .in(UserLike::getTargetId, commentIds));
            userLikedCommentIds = userLikes.stream().map(UserLike::getTargetId).collect(Collectors.toSet());
        }

        // 批量查询用户信息
        Set<Long> userIds = allComments.stream().map(Comment::getUserId).collect(Collectors.toSet());
        Map<Long, User> userMap = userIds.isEmpty() ? Collections.emptyMap()
                : userMapper.selectBatchIds(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));

        final Set<Long> likedSet = userLikedCommentIds;

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
                    .likeCount(c.getLikeCount() != null ? c.getLikeCount() : 0)
                    .liked(likedSet.contains(c.getId()))
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
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = (auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()) || "ADMIN".equalsIgnoreCase(a.getAuthority())));
        if (!isAdmin && userId != null) {
            User user = userMapper.selectById(userId);
            if (user != null && ("ADMIN".equalsIgnoreCase(user.getRole()) || "ROLE_ADMIN".equalsIgnoreCase(user.getRole()))) {
                isAdmin = true;
            }
        }

        // 读取全站评论审核策略设置
        boolean moderationEnabled = true;
        boolean adminExempt = true;
        try {
            com.hayden.blog.entity.SiteSetting settings = siteSettingService.getSettings();
            if (settings != null) {
                if (settings.getCommentModerationEnabled() != null) {
                    moderationEnabled = settings.getCommentModerationEnabled() == 1;
                }
                if (settings.getAdminCommentExempt() != null) {
                    adminExempt = settings.getAdminCommentExempt() == 1;
                }
            }
        } catch (Exception e) {
            log.warn("获取评论审核设置失败，回退默认模式: {}", e.getMessage());
        }

        String initialStatus;
        if (!moderationEnabled) {
            // 未开启审核，全员直通
            initialStatus = "APPROVED";
        } else if (isAdmin && adminExempt) {
            // 开启审核但管理员免审
            initialStatus = "APPROVED";
        } else {
            // 读者发表或管理员未开启免审时，必须进入 PENDING 待审核池
            initialStatus = "PENDING";
        }

        Comment comment = Comment.builder()
                .targetType(request.getTargetType().toUpperCase())
                .targetId(request.getTargetId())
                .userId(userId)
                .parentId(request.getParentId())
                .content(request.getContent().trim())
                .status(initialStatus)
                .build();

        save(comment);

        // 异步解耦发送新评论通知邮件（避免阻塞用户请求）
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                User author = userMapper.selectById(userId);
                String authorName = author != null && StringUtils.hasText(author.getNickname()) ? author.getNickname() : "读者";
                emailService.sendNewCommentNotification(request.getTargetType() + " #" + request.getTargetId(), authorName, request.getContent());
            } catch (Exception e) {
                log.warn("异步发送新评论通知邮件失败: {}", e.getMessage());
            }
        });

        // 若超管直接发表回复，立即异步发送通知；读者回复若已 APPROVED 也立即触发
        if ("APPROVED".equals(initialStatus) && request.getParentId() != null && request.getParentId() > 0) {
            Comment parent = getById(request.getParentId());
            if (parent != null && parent.getUserId() != null && !parent.getUserId().equals(userId)) {
                java.util.concurrent.CompletableFuture.runAsync(() -> {
                    try {
                        User author = userMapper.selectById(userId);
                        String authorName = author != null && StringUtils.hasText(author.getNickname()) ? author.getNickname() : "读者";
                        String authorAvatar = author != null ? author.getAvatar() : null;
                        User parentUser = userMapper.selectById(parent.getUserId());
                        if (parentUser != null && StringUtils.hasText(parentUser.getEmail())) {
                            emailService.sendReplyNotification(parentUser.getEmail(), request.getTargetType() + " #" + request.getTargetId(), authorName, request.getContent());
                        }
                        notificationService.sendNotification(
                                parent.getUserId(),
                                userId,
                                authorName,
                                authorAvatar,
                                "COMMENT_REPLY",
                                request.getTargetType(),
                                request.getTargetId(),
                                parent.getContent() != null && parent.getContent().length() > 40 ? parent.getContent().substring(0, 40) + "..." : parent.getContent(),
                                authorName + " 回复了你的评论: " + request.getContent()
                        );
                    } catch (Exception e) {
                        log.warn("异步发送回复通知失败: {}", e.getMessage());
                    }
                });
            }
        }

        return comment.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, String status) {
        Comment comment = getById(id);
        if (comment == null) {
            throw new BusinessException(404, "评论不存在");
        }
        boolean wasNotApproved = !"APPROVED".equalsIgnoreCase(comment.getStatus());
        String upperStatus = status.toUpperCase();
        comment.setStatus(upperStatus);
        updateById(comment);

        // 若审核通过且属于二级回复，异步触发回复通知
        if (wasNotApproved && "APPROVED".equals(upperStatus)) {
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    // 1. 发送审核通过通知给评论作者
                    if (comment.getUserId() != null) {
                        notificationService.sendNotification(
                                comment.getUserId(),
                                null,
                                "Hayden Xue 博客系统",
                                null,
                                "COMMENT_APPROVED",
                                comment.getTargetType(),
                                comment.getTargetId(),
                                comment.getContent() != null && comment.getContent().length() > 40 ? comment.getContent().substring(0, 40) + "..." : comment.getContent(),
                                "你的评论已通过审核并公开发布"
                        );
                    }

                    // 2. 如果是二级回复，通知父评论作者
                    if (comment.getParentId() != null && comment.getParentId() > 0) {
                        Comment parent = getById(comment.getParentId());
                        if (parent != null && parent.getUserId() != null && !parent.getUserId().equals(comment.getUserId())) {
                            User author = userMapper.selectById(comment.getUserId());
                            String authorName = author != null && StringUtils.hasText(author.getNickname()) ? author.getNickname() : "读者";
                            String authorAvatar = author != null ? author.getAvatar() : null;
                            User parentUser = userMapper.selectById(parent.getUserId());
                            if (parentUser != null && StringUtils.hasText(parentUser.getEmail())) {
                                emailService.sendReplyNotification(parentUser.getEmail(), comment.getTargetType() + " #" + comment.getTargetId(), authorName, comment.getContent());
                            }
                            notificationService.sendNotification(
                                    parent.getUserId(),
                                    comment.getUserId(),
                                    authorName,
                                    authorAvatar,
                                    "COMMENT_REPLY",
                                    comment.getTargetType(),
                                    comment.getTargetId(),
                                    parent.getContent() != null && parent.getContent().length() > 40 ? parent.getContent().substring(0, 40) + "..." : parent.getContent(),
                                    authorName + " 回复了你的评论: " + comment.getContent()
                            );
                        }
                    }
                } catch (Exception e) {
                    log.warn("审核通过后异步发送通知失败: {}", e.getMessage());
                }
            });
        }
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
            String username = com.hayden.blog.security.SecurityUtils.getCurrentUsername();
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
