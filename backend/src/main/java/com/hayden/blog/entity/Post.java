package com.hayden.blog.entity;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.hayden.blog.common.BaseEntity;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TableName("posts")
public class Post extends BaseEntity {

    private String title;
    private String slug;
    private String excerpt;
    private String content;
    private String cover;
    private Long categoryId;
    private String status; // DRAFT, PUBLISHED, ARCHIVED
    private Integer featured; // 0 or 1
    private Integer readingTime;
    private Integer viewCount;
    private Integer likeCount;
    private String lang; // zh, en
    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Long translationPostId;
    private String maturity; // SEEDLING, BUDDING, EVERGREEN
    private Integer revisionCount; // 修订培育次数
    private String seoTitle;
    private String seoDescription;
    private String aiRadarJson;
    private LocalDateTime publishedAt;
}
