package com.hayden.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiEditorAssistResponse {
    private String action;
    private String result;
    private String explanation;
}
