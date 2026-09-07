package com.howard.blog.vo;

import com.howard.blog.entity.Category;
import com.howard.blog.entity.Tag;
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
public class PostListVO {

    private Long id;
    private String title;
    private String slug;
    private String excerpt;
    private String cover;
    private Long categoryId;
    private Category category;
    private List<Tag> tags;
    private String status;
    private Integer featured;
    private Integer readingTime;
    private Integer viewCount;
    private Integer likeCount;
    private String lang;
    private Long translationPostId;
    private String translationPostSlug;
    private String translationPostTitle;
    private String maturity;
    private Integer revisionCount;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
