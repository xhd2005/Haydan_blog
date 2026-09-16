package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.dto.LikeToggleRequest;
import com.hayden.blog.entity.*;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.mapper.*;
import com.hayden.blog.service.LikeService;
import com.hayden.blog.service.NotificationService;
import com.hayden.blog.vo.LikeToggleVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LikeServiceImpl extends ServiceImpl<UserLikeMapper, UserLike> implements LikeService {

    private final PostMapper postMapper;
    private final MemoMapper memoMapper;
    private final CommentMapper commentMapper;
    private final JourneyMapper journeyMapper;
    private final ProjectMapper projectMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LikeToggleVO toggleLike(LikeToggleRequest request, Long userId) {
        String type = request.getTargetType().toUpperCase().trim();
        Long targetId = request.getTargetId();

        // 验证目标是否存在
        validateTargetExists(type, targetId);

        // 1. 游客点赞（未登录）
        if (userId == null) {
            incrementTargetLikeCount(type, targetId);
            int newCount = getTargetLikeCount(type, targetId);
            return LikeToggleVO.builder()
                    .liked(true)
                    .likeCount(newCount)
                    .build();
        }

        // 2. 登录用户点赞（支持 Toggle 与持久化）
        UserLike existing = getOne(new LambdaQueryWrapper<UserLike>()
                .eq(UserLike::getUserId, userId)
                .eq(UserLike::getTargetType, type)
                .eq(UserLike::getTargetId, targetId));

        if (existing != null) {
            // 已点赞 -> 取消点赞
            removeById(existing.getId());
            decrementTargetLikeCount(type, targetId);
            int newCount = getTargetLikeCount(type, targetId);
            return LikeToggleVO.builder()
                    .liked(false)
                    .likeCount(newCount)
                    .build();
        } else {
            // 未点赞 -> 添加点赞
            UserLike newLike = UserLike.builder()
                    .userId(userId)
                    .targetType(type)
                    .targetId(targetId)
                    .createdAt(LocalDateTime.now())
                    .build();
            save(newLike);
            incrementTargetLikeCount(type, targetId);
            int newCount = getTargetLikeCount(type, targetId);

            // 异步触发点赞站内通知
            triggerLikeNotification(type, targetId, userId);

            return LikeToggleVO.builder()
                    .liked(true)
                    .likeCount(newCount)
                    .build();
        }
    }

    @Override
    public Map<Long, Boolean> getBatchStatus(String targetType, List<Long> targetIds, Long userId) {
        Map<Long, Boolean> result = new HashMap<>();
        if (targetIds == null || targetIds.isEmpty()) {
            return result;
        }

        // 默认全部为 false
        for (Long id : targetIds) {
            result.put(id, false);
        }

        if (userId == null) {
            return result;
        }

        String type = targetType.toUpperCase().trim();
        List<UserLike> likes = list(new LambdaQueryWrapper<UserLike>()
                .eq(UserLike::getUserId, userId)
                .eq(UserLike::getTargetType, type)
                .in(UserLike::getTargetId, targetIds));

        for (UserLike like : likes) {
            result.put(like.getTargetId(), true);
        }

        return result;
    }

    @Override
    public boolean isLiked(String targetType, Long targetId, Long userId) {
        if (userId == null || targetId == null) {
            return false;
        }
        return count(new LambdaQueryWrapper<UserLike>()
                .eq(UserLike::getUserId, userId)
                .eq(UserLike::getTargetType, targetType.toUpperCase().trim())
                .eq(UserLike::getTargetId, targetId)) > 0;
    }

    private void validateTargetExists(String type, Long targetId) {
        boolean exists = switch (type) {
            case "POST" -> postMapper.selectById(targetId) != null;
            case "MEMO" -> memoMapper.selectById(targetId) != null;
            case "COMMENT" -> commentMapper.selectById(targetId) != null;
            case "JOURNEY" -> journeyMapper.selectById(targetId) != null;
            case "PROJECT" -> projectMapper.selectById(targetId) != null;
            default -> throw new BusinessException(400, "不支持的点赞类型: " + type);
        };
        if (!exists) {
            throw new BusinessException(404, "点赞目标不存在");
        }
    }

    private void incrementTargetLikeCount(String type, Long targetId) {
        switch (type) {
            case "POST" -> postMapper.update(null, new UpdateWrapper<Post>().eq("id", targetId).setSql("like_count = like_count + 1"));
            case "MEMO" -> memoMapper.update(null, new UpdateWrapper<Memo>().eq("id", targetId).setSql("like_count = like_count + 1"));
            case "COMMENT" -> commentMapper.update(null, new UpdateWrapper<Comment>().eq("id", targetId).setSql("like_count = like_count + 1"));
            case "JOURNEY" -> journeyMapper.update(null, new UpdateWrapper<Journey>().eq("id", targetId).setSql("like_count = like_count + 1"));
            case "PROJECT" -> projectMapper.update(null, new UpdateWrapper<Project>().eq("id", targetId).setSql("like_count = like_count + 1"));
        }
    }

    private void decrementTargetLikeCount(String type, Long targetId) {
        String sql = "like_count = CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END";
        switch (type) {
            case "POST" -> postMapper.update(null, new UpdateWrapper<Post>().eq("id", targetId).setSql(sql));
            case "MEMO" -> memoMapper.update(null, new UpdateWrapper<Memo>().eq("id", targetId).setSql(sql));
            case "COMMENT" -> commentMapper.update(null, new UpdateWrapper<Comment>().eq("id", targetId).setSql(sql));
            case "JOURNEY" -> journeyMapper.update(null, new UpdateWrapper<Journey>().eq("id", targetId).setSql(sql));
            case "PROJECT" -> projectMapper.update(null, new UpdateWrapper<Project>().eq("id", targetId).setSql(sql));
        }
    }

    private int getTargetLikeCount(String type, Long targetId) {
        return switch (type) {
            case "POST" -> Optional.ofNullable(postMapper.selectById(targetId)).map(Post::getLikeCount).orElse(0);
            case "MEMO" -> Optional.ofNullable(memoMapper.selectById(targetId)).map(Memo::getLikeCount).orElse(0);
            case "COMMENT" -> Optional.ofNullable(commentMapper.selectById(targetId)).map(Comment::getLikeCount).orElse(0);
            case "JOURNEY" -> Optional.ofNullable(journeyMapper.selectById(targetId)).map(Journey::getLikeCount).orElse(0);
            case "PROJECT" -> Optional.ofNullable(projectMapper.selectById(targetId)).map(Project::getLikeCount).orElse(0);
            default -> 0;
        };
    }

    private void triggerLikeNotification(String type, Long targetId, Long likerUserId) {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                User liker = userMapper.selectById(likerUserId);
                String likerName = (liker != null && liker.getNickname() != null && !liker.getNickname().isBlank())
                        ? liker.getNickname() : "读者";
                String likerAvatar = liker != null ? liker.getAvatar() : null;

                if ("COMMENT".equals(type)) {
                    Comment comment = commentMapper.selectById(targetId);
                    if (comment != null && comment.getUserId() != null && !comment.getUserId().equals(likerUserId)) {
                        String summary = comment.getContent();
                        if (summary != null && summary.length() > 50) {
                            summary = summary.substring(0, 50) + "...";
                        }
                        notificationService.sendNotification(
                                comment.getUserId(),
                                likerUserId,
                                likerName,
                                likerAvatar,
                                "COMMENT_LIKE",
                                "COMMENT",
                                targetId,
                                summary,
                                likerName + " 赞了你的评论"
                        );
                    }
                }
            } catch (Exception e) {
                log.warn("发送点赞通知失败: {}", e.getMessage());
            }
        });
    }
}
