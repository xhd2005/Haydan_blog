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
public class UserLikeItemVO implements Serializable {
    private Long likeId;
    private String targetType;
    private Long targetId;
    private String title;
    private String slug;
    private String cover;
    private String excerpt;
    private LocalDateTime likedAt;
}
