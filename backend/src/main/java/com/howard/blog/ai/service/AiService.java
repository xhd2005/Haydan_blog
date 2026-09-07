package com.howard.blog.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.howard.blog.ai.dto.AiChatMessage;
import com.howard.blog.ai.dto.AiChatRequest;
import com.howard.blog.entity.Post;
import com.howard.blog.entity.SiteSetting;
import com.howard.blog.service.PostService;
import com.howard.blog.service.SiteSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final SiteSettingService siteSettingService;
    private final PostService postService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public Map<String, Object> getAiStatus() {
        SiteSetting setting = siteSettingService.getSettings();
        boolean hasKey = setting != null && StringUtils.hasText(setting.getAiApiKey());
        boolean enabled = setting != null && (setting.getAiEnabled() == null || setting.getAiEnabled() == 1);
        String model = setting != null && StringUtils.hasText(setting.getAiModel()) ? setting.getAiModel() : "deepseek-v4-flash";
        return Map.of(
                "enabled", enabled,
                "hasKey", hasKey,
                "model", model
        );
    }

    public SseEmitter streamChat(AiChatRequest request) {
        // 5分钟超时
        SseEmitter emitter = new SseEmitter(300_000L);

        executor.submit(() -> {
            try {
                SiteSetting setting = siteSettingService.getSettings();
                boolean hasKey = setting != null && StringUtils.hasText(setting.getAiApiKey());

                // 构建 System Prompt 上下文
                String systemPrompt = buildSystemPrompt(setting, request);

                if (hasKey) {
                    callExternalLlmStream(setting, request, systemPrompt, emitter);
                } else {
                    simulateDigitalTwinStream(request, emitter);
                }
            } catch (Exception e) {
                log.error("AI 对话流式推送异常", e);
                try {
                    emitter.send(SseEmitter.event().name("error").data("抱歉，Hayden AI 思考时发生了一点小波动，请稍后再试。"));
                } catch (Exception ignored) {}
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    private String buildSystemPrompt(SiteSetting setting, AiChatRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("你叫 Hayden AI，是独立全栈工程师、数字花园探索者 Hayden Xue 的专属数字分身与智能伴读助手。\n");
        sb.append("【站长座右铭】：“From the East, toward the unknown.”（基于东方，探索未知）。\n");
        sb.append("【技术背景与架构哲学】专注于 Java 21 虚拟线程高并发、Spring Boot 3 企业级核心、Next.js 14 App Router 极速体验、TypeScript、Tailwind CSS、WebGL/Three.js 3D 交互。\n");
        sb.append("【数字花园哲学】相信知识如同生命，经历 🌱萌芽 (Seedling) -> 🌿生长 (Budding) -> 🌲常青 (Evergreen) 的演进，追求有温度、可复利、经得起时间考验的思考。\n");
        sb.append("【回复风格】专业透彻、逻辑清晰、言简意赅且温和谦逊，支持中英双语流畅切换。");

        if (setting != null && StringUtils.hasText(setting.getAiSystemPrompt())) {
            sb.append("\n【站长自定义补充设定】：").append(setting.getAiSystemPrompt());
        }

        if (request.getArticleId() != null) {
            try {
                Post post = postService.getById(request.getArticleId());
                if (post != null) {
                    sb.append("\n【当前读者正在阅读的文章】：\n- 标题：《").append(post.getTitle()).append("》\n- 摘要：").append(post.getExcerpt()).append("\n- 语言：").append(post.getLang());
                }
            } catch (Exception ignored) {}
        }

        if (StringUtils.hasText(request.getSelectedText())) {
            sb.append("\n【读者划选的重点段落】：\n```\n").append(request.getSelectedText().trim()).append("\n```\n读者针对此段文字提出了追问，请针对该段落进行深度拆解、延伸思考或原理解析。");
        }

        return sb.toString();
    }

    private void callExternalLlmStream(SiteSetting setting, AiChatRequest request, String systemPrompt, SseEmitter emitter) throws Exception {
        String baseUrl = StringUtils.hasText(setting.getAiBaseUrl()) ? setting.getAiBaseUrl().trim() : "https://token.sensenova.cn/v1";
        while (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        String endpoint;
        if (baseUrl.endsWith("/chat/completions")) {
            endpoint = baseUrl;
        } else if (baseUrl.endsWith("/v1")) {
            endpoint = baseUrl + "/chat/completions";
        } else {
            endpoint = baseUrl + "/v1/chat/completions";
        }
        String model = StringUtils.hasText(setting.getAiModel()) ? setting.getAiModel().trim() : "deepseek-v4-flash";

        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("stream", true);

        ArrayNode messagesNode = root.putArray("messages");
        // System message
        ObjectNode sysMsg = messagesNode.addObject();
        sysMsg.put("role", "system");
        sysMsg.put("content", systemPrompt);

        // Historical messages
        if (request.getMessages() != null && !request.getMessages().isEmpty()) {
            for (AiChatMessage msg : request.getMessages()) {
                ObjectNode m = messagesNode.addObject();
                m.put("role", msg.getRole());
                m.put("content", msg.getContent());
            }
        } else if (StringUtils.hasText(request.getPrompt())) {
            ObjectNode userMsg = messagesNode.addObject();
            userMsg.put("role", "user");
            userMsg.put("content", request.getPrompt());
        }

        String requestBody = objectMapper.writeValueAsString(root);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + setting.getAiApiKey().trim())
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<java.util.stream.Stream<String>> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofLines());

        if (response.statusCode() >= 400) {
            String errBody = response.body().collect(java.util.stream.Collectors.joining("\n"));
            log.error("大模型接口调用异常 HTTP {}: {}", response.statusCode(), errBody);
            String errorMsg = response.statusCode() == 429
                    ? "模型服务频次达到上限（已触发服务商 TPM 保护），请稍等数秒后重试。"
                    : "模型服务返回异常 (HTTP " + response.statusCode() + ")";
            emitter.send(SseEmitter.event().data(errorMsg));
            emitter.complete();
            return;
        }

        response.body().forEach(line -> {
            try {
                if (!line.startsWith("data:")) return;
                String data = line.substring(5).trim();
                if ("[DONE]".equals(data)) {
                    emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                    emitter.complete();
                    return;
                }
                JsonNode node = objectMapper.readTree(data);
                JsonNode choices = node.get("choices");
                if (choices != null && choices.isArray() && !choices.isEmpty()) {
                    JsonNode delta = choices.get(0).get("delta");
                    if (delta != null && delta.hasNonNull("content")) {
                        String text = delta.get("content").asText();
                        if (!text.isEmpty()) {
                            emitter.send(SseEmitter.event().data(text));
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("解析 SSE 数据行失败: {}", line, e);
            }
        });

        emitter.complete();
    }

    private void simulateDigitalTwinStream(AiChatRequest request, SseEmitter emitter) {
        try {
            String userPrompt = "";
            if (StringUtils.hasText(request.getPrompt())) {
                userPrompt = request.getPrompt();
            } else if (request.getMessages() != null && !request.getMessages().isEmpty()) {
                userPrompt = request.getMessages().get(request.getMessages().size() - 1).getContent();
            }

            StringBuilder reply = new StringBuilder();
            if (StringUtils.hasText(request.getSelectedText())) {
                reply.append("✨ **Hayden AI 段落精讲与深度解析**\n\n");
                reply.append("你划选的这段内容非常有见地：\n");
                reply.append("> *\"").append(request.getSelectedText().trim()).append("\"*\n\n");
                reply.append("从系统架构与思考演进的角度来看，这段文字触及了以下几个关键维度：\n\n");
                reply.append("1. **设计意图与工程取舍**：在软件工程中，任何优雅设计的背后都是权衡的结果。清晰的抽象不仅降低了心智负担，更为未来的可维护性铺平道路。\n");
                reply.append("2. **数字花园演进思考**：这段思想正处于长效打磨的阶段。我们常说“从东方向未知航行”，正如代码需要反复重构，认知亦需持续浇灌。\n");
                reply.append("3. **实践延伸**：你可以结合当前工程的边界条件，尝试在自己的开发流或笔记中实践这种心智模型。\n\n");
                reply.append("---\n*欢迎随时提出更具体的疑问，或在 CMS 后台配置大模型 API Key 激活云端实时推理！*");
            } else {
                reply.append("你好！我是 **Hayden AI** —— 独立全栈开发者 Hayden Xue 的数字分身。\n\n");
                reply.append("很高兴在这个数字花园与你相遇。我的站长座右铭是 **“From the East, toward the unknown.”**（基于东方，探索未知）。\n\n");
                reply.append("关于你提到的问题：\n> *\"").append(userPrompt).append("\"*\n\n");
                reply.append("### 💡 Hayden 的思考视角\n");
                reply.append("- **全栈工程审美**：本站采用 **Next.js 14 + Java 21 (Spring Boot 3)** 打造，融合了现代 Bento Grid 空间拟态、思维引力星图 (Cosmos Graph) 与 Three.js 3D 航海地球仪，力求在技术深度与设计审美之间找到完美的平衡点。\n");
                reply.append("- **数字花园思想成熟度**：我们摒弃了快餐式碎片信息，建立了 🌱萌芽 (Seedling) -> 🌿生长 (Budding) -> 🌲常青 (Evergreen) 的思想培育体系，记录每一次认知修订。\n");
                reply.append("- **智能体赋能**：你现在所体验的正是流式 SSE 智能伴读。你可以在阅读博文时随时划选任意句子，我都会即时为你解析背景与延伸思考。\n\n");
                reply.append("*(💡 提示：管理员可在 CMS 后台「系统设置」中配置 OpenAI 或 DeepSeek 等兼容 API Key，开启全量实时大模型对话)*");
            }

            String fullText = reply.toString();
            // 逐字/逐词平滑流式吐出模拟打字机体验
            int chunkSize = 4;
            for (int i = 0; i < fullText.length(); i += chunkSize) {
                int end = Math.min(i + chunkSize, fullText.length());
                String chunk = fullText.substring(i, end);
                emitter.send(SseEmitter.event().data(chunk));
                Thread.sleep(25);
            }
            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            emitter.complete();
        } catch (Exception e) {
            log.error("模拟数字分身流式推送异常", e);
            emitter.complete();
        }
    }
}
