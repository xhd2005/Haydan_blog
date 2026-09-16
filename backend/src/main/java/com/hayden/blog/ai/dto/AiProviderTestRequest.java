package com.hayden.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 服务商连通性测试请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiProviderTestRequest {
    private String provider;
    private String baseUrl;
    private String apiKey;
    private String model;
}
