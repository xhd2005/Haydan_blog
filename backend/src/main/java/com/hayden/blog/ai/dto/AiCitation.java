package com.hayden.blog.ai.dto;

import lombok.Builder;

import java.io.Serializable;

/**
 * AI 数字花园知识检索博文引用元数据 (Java 25 Record)
 */
@Builder
public record AiCitation(
        Long id,
        String title,
        String slug,
        String maturity, // SEEDLING(🌱), BUDDING(🌿), EVERGREEN(🌲)
        String excerpt,
        String url
) implements Serializable {
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getMaturity() { return maturity; }
    public String getExcerpt() { return excerpt; }
    public String getUrl() { return url; }
}
