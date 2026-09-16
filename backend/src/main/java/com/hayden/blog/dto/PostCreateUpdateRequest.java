package com.hayden.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostCreateUpdateRequest {

    @NotBlank(message = "文章标题不能为空")
    private String title;

    private String slug;

    private String excerpt;

    @NotBlank(message = "文章内容不能为空")
    private String content;

    private String cover;

    private Long categoryId;

    private List<Long> tagIds;

    private String status; // DRAFT, PUBLISHED, ARCHIVED

    private Integer featured; // 0 or 1

    private String lang; // zh, en

    private Long translationPostId;

    private String maturity; // SEEDLING, BUDDING, EVERGREEN

    private Integer revisionCount;

    private Integer readingTime;

    private String seoTitle;

    private String seoDescription;
    private String aiRadarJson;
    private LocalDateTime publishedAt;
}
