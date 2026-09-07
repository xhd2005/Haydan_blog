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
public class PostDetailVO {

    private Long id;
    private String title;
    private String slug;
    private String excerpt;
    private String content;
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
    private String maturity;
    private Integer revisionCount;
    private String seoTitle;
    private String seoDescription;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 关联译文信息
    private Long translationPostId;
    private String translationPostSlug;
    private String translationPostTitle;
    private String translationPostLang;
    private TranslationPostVO translationPost;

    // 上一篇 / 下一篇
    private PostNavVO prevPost;
    private PostNavVO nextPost;

    // 相关文章
    private List<PostNavVO> relatedPosts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TranslationPostVO {
        private Long id;
        private String title;
        private String slug;
        private String lang;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostNavVO {
        private Long id;
        private String title;
        private String slug;
        private String cover;
    }
}
