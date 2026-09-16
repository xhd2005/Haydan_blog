package com.hayden.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI 服务商连通性测试响应 (包含往返延迟、状态码与错误信息)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiProviderTestResponse {
    private boolean success;
    private long latencyMs;
    private int statusCode;
    private String message;
    private List<String> availableModels;
}
