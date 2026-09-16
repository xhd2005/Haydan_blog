package com.hayden.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCommentVO implements Serializable {
    private Long id;
    private String targetType;
    private Long targetId;
    private String targetTitle;
    private String targetSlug;
    private Long parentId;
    private String content;
    private Integer likeCount;
    private String status;
    private LocalDateTime createdAt;
}
