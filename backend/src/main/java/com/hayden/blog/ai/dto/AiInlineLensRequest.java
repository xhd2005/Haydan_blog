package com.hayden.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiInlineLensRequest {
    private String selectedText;
    private Long articleId;
    /**
     * DIGEST(术语速解), CRITICAL(批判性思考), RESONANCE(站内关联)
     */
    private String actionType;
}
