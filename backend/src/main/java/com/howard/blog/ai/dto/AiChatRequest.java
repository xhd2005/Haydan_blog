package com.howard.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequest {
    private String prompt;
    private List<AiChatMessage> messages;
    private Long articleId;
    private String selectedText;
}
