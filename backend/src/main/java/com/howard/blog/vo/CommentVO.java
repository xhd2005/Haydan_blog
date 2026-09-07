package com.howard.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentVO {

    private Long id;
    private String targetType;
    private Long targetId;
    private Long userId;
    private String userNickname;
    private String userAvatar;
    private String userRole;
    private Long parentId;
    private String replyToUserNickname;
    private String content;
    private String status;
    private LocalDateTime createdAt;
    private List<CommentVO> replies;
}
