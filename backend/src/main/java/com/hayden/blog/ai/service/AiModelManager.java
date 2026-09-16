package com.hayden.blog.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.ai.dto.AiProviderConfig;
import com.hayden.blog.ai.dto.AiProviderTestRequest;
import com.hayden.blog.ai.dto.AiProviderTestResponse;
import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.service.SiteSettingService;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Hayden AI 智能多模型管理器 (LangChain4j + 商汤 SenseNova + DeepSeek 官方)
 *
 * 核心特性：
 * 1. 支持 DeepSeek 官方 (Flash / Pro) 与商汤日日新 (SenseNova) 动态无缝热切换与多服务商集群管理；
 * 2. 具备 429 TPM 速率限制指数退避重试 (1.5s -> 3.0s) 与平滑降级容灾；
 * 3. 具备实时连通性探测 (Ping Latency Diagnostic)；
 * 4. 深度集成 LangChain4j OpenAiChatModel / OpenAiStreamingChatModel 客户端构建。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiModelManager {

    private final SiteSettingService siteSettingService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    public static final String DEFAULT_OFFICIAL_DEEPSEEK_KEY = System.getenv().getOrDefault("DEEPSEEK_API_KEY", "");

    // 模型供应商枚举
    public enum ModelProvider {
        SENSENOVA("SenseNova", "商汤日日新"),
        DEEPSEEK("DeepSeek", "DeepSeek 深度求索"),
        CUSTOM("Custom", "自定义 OpenAI 兼容模型");

        @Getter
        private final String code;
        @Getter
        private final String description;

        ModelProvider(String code, String description) {
            this.code = code;
            this.description = description;
        }
    }

    /**
     * 模型配置 Record
     */
    public record ModelDescriptor(
            String modelId,
            String displayName,
            ModelProvider provider,
            String defaultEndpoint,
            String defaultBaseUrl,
            int maxTokens,
            double defaultTemperature
    ) {}

    // 内置支持的模型注册表
    private static final Map<String, ModelDescriptor> REGISTERED_MODELS = new ConcurrentHashMap<>();

    static {
        // 商汤日日新 SenseNova 系列
        registerModel(new ModelDescriptor(
                "sensenova-6.8-flash-lite",
                "商汤日日新 6.8 Flash Lite (低延迟高并发)",
                ModelProvider.SENSENOVA,
                "https://api.sensenova.cn/compatible-mode/v1/chat/completions",
                "https://api.sensenova.cn/compatible-mode/v1",
                4096,
                0.7
        ));
        registerModel(new ModelDescriptor(
                "SenseChat-5",
                "商汤日日新 5.0 (旗舰大模型)",
                ModelProvider.SENSENOVA,
                "https://api.sensenova.cn/compatible-mode/v1/chat/completions",
                "https://api.sensenova.cn/compatible-mode/v1",
                4096,
                0.7
        ));
        registerModel(new ModelDescriptor(
                "SenseChat-Turbo",
                "商汤日日新 Turbo (极速推理)",
                ModelProvider.SENSENOVA,
                "https://api.sensenova.cn/compatible-mode/v1/chat/completions",
                "https://api.sensenova.cn/compatible-mode/v1",
                4096,
                0.7
        ));

        // DeepSeek 官方系列 (已真实连通校验)
        registerModel(new ModelDescriptor(
                "deepseek-flash",
                "DeepSeek Flash (极速流式 / 深度推理)",
                ModelProvider.DEEPSEEK,
                "https://api.deepseek.com/chat/completions",
                "https://api.deepseek.com",
                4096,
                0.7
        ));
        registerModel(new ModelDescriptor(
                "deepseek-v4-pro",
                "DeepSeek V4 Pro (复杂工程架构与全栈推演)",
                ModelProvider.DEEPSEEK,
                "https://api.deepseek.com/chat/completions",
                "https://api.deepseek.com",
                8192,
                0.6
        ));
        registerModel(new ModelDescriptor(
                "deepseek-v4-flash",
                "DeepSeek V4 Flash (极速流式)",
                ModelProvider.DEEPSEEK,
                "https://api.deepseek.com/chat/completions",
                "https://api.deepseek.com",
                4096,
                0.7
        ));
        registerModel(new ModelDescriptor(
                "deepseek-chat",
                "DeepSeek V3 Chat (通用对话)",
                ModelProvider.DEEPSEEK,
                "https://api.deepseek.com/chat/completions",
                "https://api.deepseek.com",
                4096,
                0.7
        ));
        registerModel(new ModelDescriptor(
                "deepseek-reasoner",
                "DeepSeek R1 Reasoner (深度推理)",
                ModelProvider.DEEPSEEK,
                "https://api.deepseek.com/chat/completions",
                "https://api.deepseek.com",
                8192,
                0.6
        ));
    }

    public static void registerModel(ModelDescriptor descriptor) {
        REGISTERED_MODELS.put(descriptor.modelId().toLowerCase(), descriptor);
    }

    // 运行时手动覆盖的模型
    private final AtomicReference<String> overriddenModel = new AtomicReference<>(null);

    /**
     * 获取当前生效的活跃服务商配置 (从 site_settings.ai_providers_json 中解析)
     */
    public AiProviderConfig getActiveProvider() {
        try {
            SiteSetting setting = siteSettingService.getSettings();
            if (setting != null && StringUtils.hasText(setting.getAiProvidersJson())) {
                List<AiProviderConfig> list = objectMapper.readValue(
                        setting.getAiProvidersJson(),
                        new TypeReference<List<AiProviderConfig>>() {}
                );
                if (list != null && !list.isEmpty()) {
                    return list.stream()
                            .filter(p -> Boolean.TRUE.equals(p.getIsDefault()) && Boolean.TRUE.equals(p.getEnabled()))
                            .findFirst()
                            .orElse(list.stream().filter(p -> Boolean.TRUE.equals(p.getEnabled())).findFirst().orElse(null));
                }
            }
        } catch (Exception e) {
            log.warn("解析 ai_providers_json 失败: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 获取当前生效的 API Key (优先活跃服务商 -> 扁平配置 -> 官方默认保底)
     */
    public String getActiveApiKey(SiteSetting setting) {
        AiProviderConfig active = getActiveProvider();
        if (active != null && StringUtils.hasText(active.getApiKey())) {
            return active.getApiKey().trim();
        }
        if (setting != null && StringUtils.hasText(setting.getAiApiKey())) {
            return setting.getAiApiKey().trim();
        }
        String envKey = System.getenv("DEEPSEEK_API_KEY");
        if (StringUtils.hasText(envKey)) {
            return envKey.trim();
        }
        return "";
    }

    /**
     * 获取当前生效的 API BaseUrl
     */
    public String getActiveBaseUrl(SiteSetting setting) {
        AiProviderConfig active = getActiveProvider();
        if (active != null && StringUtils.hasText(active.getBaseUrl())) {
            return active.getBaseUrl().trim();
        }
        if (setting != null && StringUtils.hasText(setting.getAiBaseUrl())) {
            return setting.getAiBaseUrl().trim();
        }
        return "https://api.deepseek.com";
    }

    /**
     * 获取当前生效的模型配置
     */
    public ModelDescriptor getActiveModelDescriptor() {
        String modelName = getEffectiveModelName();
        return resolveDescriptor(modelName);
    }

    /**
     * 获取当前生效的模型名称
     */
    public String getEffectiveModelName() {
        String manual = overriddenModel.get();
        if (StringUtils.hasText(manual)) {
            return manual;
        }
        AiProviderConfig active = getActiveProvider();
        if (active != null && StringUtils.hasText(active.getDefaultModel())) {
            return active.getDefaultModel().trim();
        }
        try {
            SiteSetting setting = siteSettingService.getSettings();
            if (setting != null && StringUtils.hasText(setting.getAiModel())) {
                return setting.getAiModel().trim();
            }
        } catch (Exception e) {
            log.warn("读取后台模型配置失败，使用默认模型: {}", e.getMessage());
        }
        return "deepseek-flash";
    }

    /**
     * 动态热切换当前模型
     */
    public void switchModel(String modelId) {
        if (StringUtils.hasText(modelId)) {
            overriddenModel.set(modelId.trim());
            log.info("动态切换当前 AI 模型为: {}", modelId);
        }
    }

    /**
     * 重置为系统默认配置模型
     */
    public void resetModelToDefault() {
        overriddenModel.set(null);
        log.info("重置 AI 模型为系统后台默认配置");
    }

    /**
     * 解析模型元数据
     */
    public ModelDescriptor resolveDescriptor(String modelName) {
        if (!StringUtils.hasText(modelName)) {
            return REGISTERED_MODELS.get("deepseek-flash");
        }
        String key = modelName.trim().toLowerCase();
        ModelDescriptor desc = REGISTERED_MODELS.get(key);
        if (desc != null) {
            return desc;
        }

        // 启发式判断供应商
        ModelProvider provider;
        String endpoint;
        String baseUrl;
        if (key.contains("sensenova") || key.contains("sensechat")) {
            provider = ModelProvider.SENSENOVA;
            endpoint = "https://api.sensenova.cn/compatible-mode/v1/chat/completions";
            baseUrl = "https://api.sensenova.cn/compatible-mode/v1";
        } else if (key.contains("deepseek")) {
            provider = ModelProvider.DEEPSEEK;
            endpoint = "https://api.deepseek.com/chat/completions";
            baseUrl = "https://api.deepseek.com";
        } else {
            provider = ModelProvider.CUSTOM;
            endpoint = "https://api.deepseek.com/chat/completions";
            baseUrl = "https://api.deepseek.com";
        }

        return new ModelDescriptor(
                modelName,
                modelName,
                provider,
                endpoint,
                baseUrl,
                4096,
                0.7
        );
    }

    /**
     * 获取备用降级模型描述符（用于 429 容灾切换）
     */
    public ModelDescriptor getFallbackDescriptor(ModelDescriptor primary) {
        if (primary.provider() == ModelProvider.SENSENOVA) {
            // 商汤降级到 DeepSeek Flash
            return REGISTERED_MODELS.get("deepseek-flash");
        } else {
            // DeepSeek 降级到商汤 SenseNova
            return REGISTERED_MODELS.get("sensenova-6.8-flash-lite");
        }
    }

    /**
     * 解析当前调用的完整 endpoint
     */
    public String resolveEndpoint(ModelDescriptor descriptor, SiteSetting setting) {
        String activeBaseUrl = getActiveBaseUrl(setting);
        if (StringUtils.hasText(activeBaseUrl)) {
            String custom = activeBaseUrl.trim();
            while (custom.endsWith("/")) {
                custom = custom.substring(0, custom.length() - 1);
            }
            if (custom.endsWith("/chat/completions")) {
                return custom;
            }
            return custom + "/chat/completions";
        }
        return descriptor.defaultEndpoint();
    }

    /**
     * 测试指定服务商的 API 连通性并测定往返延迟 (HTTP Ping)
     */
    public AiProviderTestResponse testConnectivity(AiProviderTestRequest req) {
        long start = System.currentTimeMillis();
        String baseUrl = req.getBaseUrl();
        if (!StringUtils.hasText(baseUrl)) {
            baseUrl = "https://api.deepseek.com";
        }
        while (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        String testUrl = baseUrl + "/models";
        String apiKey = StringUtils.hasText(req.getApiKey()) ? req.getApiKey().trim() : getActiveApiKey(siteSettingService.getSettings());
        if (!StringUtils.hasText(apiKey)) {
            return AiProviderTestResponse.builder()
                    .success(false)
                    .latencyMs(0)
                    .statusCode(400)
                    .message("未配置 API Key，无法发起连通性测试")
                    .build();
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(8))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(testUrl))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(12))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            long latency = System.currentTimeMillis() - start;

            if (response.statusCode() == 200) {
                List<String> models = new ArrayList<>();
                try {
                    JsonNode root = objectMapper.readTree(response.body());
                    if (root.has("data") && root.get("data").isArray()) {
                        for (JsonNode item : root.get("data")) {
                            if (item.has("id")) {
                                models.add(item.get("id").asText());
                            }
                        }
                    }
                } catch (Exception ignore) {}

                return AiProviderTestResponse.builder()
                        .success(true)
                        .latencyMs(latency)
                        .statusCode(200)
                        .message("连通性探测成功 (网络往返延迟: " + latency + "ms)")
                        .availableModels(models)
                        .build();
            } else {
                return AiProviderTestResponse.builder()
                        .success(false)
                        .latencyMs(latency)
                        .statusCode(response.statusCode())
                        .message("API 响应 HTTP " + response.statusCode() + ": " + response.body())
                        .build();
            }
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            return AiProviderTestResponse.builder()
                    .success(false)
                    .latencyMs(latency)
                    .statusCode(500)
                    .message("网络连通失败: " + e.getMessage())
                    .build();
        }
    }

    /**
     * 429 TPM 指数退避参数配置
     */
    public record RetryConfig(
            int maxRetries,
            long initialBackoffMillis,
            double backoffMultiplier,
            boolean enableFallback
    ) {
        public static RetryConfig defaultProductionConfig() {
            // 首次遭遇 429 等待 1500ms，指数递增，支持备用模型降级
            return new RetryConfig(2, 1500L, 2.0, true);
        }
    }

    /**
     * 执行带有 429 TPM 退避重试与备用模型降级的操作
     */
    public <T> T executeWithRetryAndFallback(
            ModelOperation<T> operation,
            RetryConfig config,
            SiteSetting setting
    ) throws Exception {
        ModelDescriptor currentModel = getActiveModelDescriptor();
        RetryConfig retryConf = config != null ? config : RetryConfig.defaultProductionConfig();

        long currentBackoff = retryConf.initialBackoffMillis();
        Exception lastException = null;

        for (int attempt = 1; attempt <= retryConf.maxRetries(); attempt++) {
            try {
                return operation.run(currentModel);
            } catch (RateLimitException e) {
                lastException = e;
                log.warn("模型 [{}] 触发 TPM 速率限制 (HTTP 429) (第 {}/{} 次尝试)，等待 {} ms 后重试...",
                        currentModel.modelId(), attempt, retryConf.maxRetries(), currentBackoff);
                try {
                    Thread.sleep(currentBackoff);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw ie;
                }
                currentBackoff = (long) (currentBackoff * retryConf.backoffMultiplier());
            }
        }

        // 若开启了备用模型平滑降级
        if (retryConf.enableFallback()) {
            ModelDescriptor fallbackModel = getFallbackDescriptor(currentModel);
            log.warn("主模型 [{}] 重试耗尽，平滑自动降级至备用模型 [{}] 保证读者请求不中断",
                    currentModel.modelId(), fallbackModel.modelId());
            try {
                return operation.run(fallbackModel);
            } catch (Exception fe) {
                log.error("备用降级模型 [{}] 执行同样失败", fallbackModel.modelId(), fe);
                throw fe;
            }
        }

        if (lastException != null) {
            throw lastException;
        }
        throw new IllegalStateException("执行模型操作失败，已超过最大重试次数");
    }

    /**
     * LangChain4j 生产级客户端构建：OpenAiChatModel (同步阻塞/Function Calling)
     */
    public OpenAiChatModel buildLangChain4jChatModel(String apiKey, ModelDescriptor descriptor) {
        if (!StringUtils.hasText(apiKey)) {
            return null;
        }
        return OpenAiChatModel.builder()
                .apiKey(apiKey)
                .baseUrl(descriptor.defaultBaseUrl())
                .modelName(descriptor.modelId())
                .temperature(descriptor.defaultTemperature())
                .maxTokens(descriptor.maxTokens())
                .timeout(Duration.ofSeconds(45))
                .build();
    }

    /**
     * LangChain4j 生产级客户端构建：OpenAiStreamingChatModel (流式)
     */
    public OpenAiStreamingChatModel buildLangChain4jStreamingChatModel(String apiKey, ModelDescriptor descriptor) {
        if (!StringUtils.hasText(apiKey)) {
            return null;
        }
        return OpenAiStreamingChatModel.builder()
                .apiKey(apiKey)
                .baseUrl(descriptor.defaultBaseUrl())
                .modelName(descriptor.modelId())
                .temperature(descriptor.defaultTemperature())
                .timeout(Duration.ofSeconds(60))
                .build();
    }

    public List<ModelDescriptor> getRegisteredModels() {
        return new ArrayList<>(REGISTERED_MODELS.values());
    }

    @FunctionalInterface
    public interface ModelOperation<T> {
        T run(ModelDescriptor descriptor) throws Exception;
    }

    public static class RateLimitException extends RuntimeException {
        public RateLimitException(String message) {
            super(message);
        }
    }
}
