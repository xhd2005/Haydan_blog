package com.hayden.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiEditorAssistRequest {
    private String text;
    /**
     * POLISH (润色), EXPAND (扩写), GENERATE_CODE (生成代码), PROOFREAD (校对/纠错), CUSTOM (自定义)
     */
    private String action;
    private String prompt;
    private String contextBefore;
    private String contextAfter;
}
