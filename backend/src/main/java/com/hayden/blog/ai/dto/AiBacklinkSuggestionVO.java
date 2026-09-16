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
public class AiBacklinkSuggestionVO {
    private List<BacklinkItem> suggestions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BacklinkItem {
        private Long postId;
        private String postTitle;
        private String postSlug;
        private String maturity;
        private String resonanceReason;
        private String anchorConcept;
    }
}
