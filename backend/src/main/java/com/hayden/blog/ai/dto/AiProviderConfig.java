package com.hayden.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI 多服务商配置项 (支持 DeepSeek 官方、商汤日日新、硅基流动与自定义模型)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiProviderConfig {
    private String id;
    private String name;
    private String provider; // DEEPSEEK, SENSENOVA, SILICONFLOW, OPENAI, CUSTOM
    private String baseUrl;
    private String apiKey;
    private List<String> models;
    private String defaultModel;
    private Boolean enabled;
    private Boolean isDefault;
    private Long latencyMs;
    private String status; // ONLINE, OFFLINE, UNCHECKED
    private String lastTestedAt;
}
