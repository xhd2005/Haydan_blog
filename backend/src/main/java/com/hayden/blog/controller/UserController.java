package com.hayden.blog.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.common.Result;
import com.hayden.blog.dto.ChangePasswordRequest;
import com.hayden.blog.entity.*;
import com.hayden.blog.mapper.*;
import com.hayden.blog.service.MediaService;
import com.hayden.blog.service.UserService;
import com.hayden.blog.vo.UserCommentVO;
import com.hayden.blog.vo.UserLikeItemVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    private final PostMapper postMapper;
    private final JourneyMapper journeyMapper;
    private final ProjectMapper projectMapper;
    private final MediaService mediaService;

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
        if (body.containsKey("bio")) {
            user.setBio(body.get("bio"));
        }
        if (body.containsKey("github")) {
            user.setGithub(body.get("github"));
        }
        if (body.containsKey("website")) {
            user.setWebsite(body.get("website"));
        }
        userService.updateById(user);
        user.setPasswordHash(null);
        return Result.success(user);
    }

    @PostMapping("/avatar")
    public Result<Map<String, String>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        Media media = mediaService.uploadFile(file);
        User user = userService.getCurrentUser();
        user.setAvatar(media.getUrl());
        userService.updateById(user);
        return Result.success(Map.of("url", media.getUrl()));
    }

    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return Result.success();
    }

    @GetMapping("/my-comments")
    public Result<PageResult<UserCommentVO>> getMyComments(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize) {
        User user = userService.getCurrentUser();
        Page<Comment> commentPage = commentMapper.selectPage(
                new Page<>(page, pageSize),
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getUserId, user.getId())
                        .orderByDesc(Comment::getCreatedAt)
        );

        List<Comment> records = commentPage.getRecords();
        if (records.isEmpty()) {
            return Result.success(PageResult.of(Collections.emptyList(), 0L, page, pageSize));
        }

        List<UserCommentVO> voList = records.stream().map(c -> {
            String title = "未知内容";
            String slug = null;
            try {
                String targetType = c.getTargetType() != null ? c.getTargetType() : "";
                switch (targetType.toUpperCase()) {
                    case "POST" -> {
                        Post p = postMapper.selectById(c.getTargetId());
                        if (p != null) {
                            title = p.getTitle();
                            slug = p.getSlug();
                        }
                    }
                    case "MEMO" -> {
                        Memo m = memoMapper.selectById(c.getTargetId());
                        if (m != null) {
                            title = m.getContent() != null && m.getContent().length() > 30
                                    ? m.getContent().substring(0, 30) + "..."
                                    : m.getContent();
                        }
                    }
                    case "JOURNEY" -> {
                        Journey j = journeyMapper.selectById(c.getTargetId());
                        if (j != null) {
                            title = j.getTitle();
                            slug = j.getSlug();
                        }
                    }
                    case "PROJECT" -> {
                        Project pr = projectMapper.selectById(c.getTargetId());
                        if (pr != null) {
                            title = pr.getName();
                            slug = pr.getSlug();
                        }
                    }
                }
            } catch (Exception ignored) {}

            return UserCommentVO.builder()
                    .id(c.getId())
                    .targetType(c.getTargetType())
                    .targetId(c.getTargetId())
                    .targetTitle(title)
                    .targetSlug(slug)
                    .parentId(c.getParentId())
                    .content(c.getContent())
                    .likeCount(c.getLikeCount() != null ? c.getLikeCount() : 0)
                    .status(c.getStatus())
                    .createdAt(c.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return Result.success(PageResult.of(voList, commentPage.getTotal(), page, pageSize));
    }

    @GetMapping("/my-likes")
    public Result<PageResult<UserLikeItemVO>> getMyLikes(
            @RequestParam(required = false) String targetType,
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize) {
        User user = userService.getCurrentUser();
        LambdaQueryWrapper<UserLike> queryWrapper = new LambdaQueryWrapper<UserLike>()
                .eq(UserLike::getUserId, user.getId())
                .orderByDesc(UserLike::getCreatedAt);

        if (StringUtils.hasText(targetType) && !"ALL".equalsIgnoreCase(targetType)) {
            queryWrapper.eq(UserLike::getTargetType, targetType.toUpperCase().trim());
        }

        Page<UserLike> likePage = userLikeMapper.selectPage(new Page<>(page, pageSize), queryWrapper);
        List<UserLike> records = likePage.getRecords();
        if (records.isEmpty()) {
            return Result.success(PageResult.of(Collections.emptyList(), 0L, page, pageSize));
        }

        List<UserLikeItemVO> voList = records.stream().map(like -> {
            String title = "未知内容";
            String slug = null;
            String cover = null;
            String excerpt = null;

            try {
                String itemType = like.getTargetType() != null ? like.getTargetType() : "";
                switch (itemType.toUpperCase()) {
                    case "POST" -> {
                        Post p = postMapper.selectById(like.getTargetId());
                        if (p != null) {
                            title = p.getTitle();
                            slug = p.getSlug();
                            cover = p.getCover();
                            excerpt = p.getExcerpt();
                        }
                    }
                    case "MEMO" -> {
                        Memo m = memoMapper.selectById(like.getTargetId());
                        if (m != null) {
                            title = m.getContent() != null && m.getContent().length() > 40
                                    ? m.getContent().substring(0, 40) + "..."
                                    : m.getContent();
                            excerpt = m.getContent();
                        }
                    }
                    case "JOURNEY" -> {
                        Journey j = journeyMapper.selectById(like.getTargetId());
                        if (j != null) {
                            title = j.getTitle();
                            slug = j.getSlug();
                            cover = j.getCover();
                            excerpt = j.getDescription();
                        }
                    }
                    case "PROJECT" -> {
                        Project pr = projectMapper.selectById(like.getTargetId());
                        if (pr != null) {
                            title = pr.getName();
                            slug = pr.getSlug();
                            cover = pr.getCover();
                            excerpt = pr.getDescription();
                        }
                    }
                    case "COMMENT" -> {
                        Comment cm = commentMapper.selectById(like.getTargetId());
                        if (cm != null) {
                            title = "评论: " + (cm.getContent() != null && cm.getContent().length() > 30
                                    ? cm.getContent().substring(0, 30) + "..."
                                    : cm.getContent());
                            excerpt = cm.getContent();
                        }
                    }
                }
            } catch (Exception ignored) {}

            return UserLikeItemVO.builder()
                    .likeId(like.getId())
                    .targetType(like.getTargetType())
                    .targetId(like.getTargetId())
                    .title(title)
                    .slug(slug)
                    .cover(cover)
                    .excerpt(excerpt)
                    .likedAt(like.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return Result.success(PageResult.of(voList, likePage.getTotal(), page, pageSize));
    }
}
