package com.hayden.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCuratedPathVO {
    private String title;
    private String description;
    private String estimatedTotalTime;
    private List<PathStep> steps;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PathStep {
        private int order;
        private String stepTitle;
        private String purpose;
        private String postSlug;
        private String postTitle;
        private String postExcerpt;
        private String maturity;
        private String readingTime;
        private String keyTakeaway;
    }
}
