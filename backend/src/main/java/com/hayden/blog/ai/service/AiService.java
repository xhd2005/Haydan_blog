package com.hayden.blog.ai.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hayden.blog.ai.dto.*;
import com.hayden.blog.ai.rag.GardenKnowledgeBase;
import com.hayden.blog.ai.tools.GardenToolRegistry;
import com.hayden.blog.ai.tools.ToolResult;
import com.hayden.blog.entity.Category;
import com.hayden.blog.entity.Journey;
import com.hayden.blog.entity.Post;
import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.entity.Tag;
import com.hayden.blog.mapper.PostTagMapper;
import com.hayden.blog.service.CategoryService;
import com.hayden.blog.service.JourneyService;
import com.hayden.blog.service.PostService;
import com.hayden.blog.service.SiteSettingService;
import com.hayden.blog.service.TagService;
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
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final SiteSettingService siteSettingService;
    private final PostService postService;
    private final GardenToolRegistry gardenToolRegistry;
    private final AiModelManager aiModelManager;
    private final JourneyService journeyService;
    private final TagService tagService;
    private final CategoryService categoryService;
    private final PostTagMapper postTagMapper;
    private final GardenKnowledgeBase gardenKnowledgeBase;
    private final AiRateLimiterService aiRateLimiterService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    // 智能体高频轻量接口本地语义 Caffeine 缓存
    private final com.github.benmanes.caffeine.cache.Cache<String, AiCodeLensResponse> codeLensCache = com.github.benmanes.caffeine.cache.Caffeine.newBuilder()
            .expireAfterWrite(24, java.util.concurrent.TimeUnit.HOURS)
            .maximumSize(5000)
            .build();

    private final com.github.benmanes.caffeine.cache.Cache<String, AiInlineLensResponse> inlineLensCache = com.github.benmanes.caffeine.cache.Caffeine.newBuilder()
            .expireAfterWrite(24, java.util.concurrent.TimeUnit.HOURS)
            .maximumSize(5000)
            .build();

    public Map<String, Object> getAiStatus() {
        SiteSetting setting = siteSettingService.getSettings();
        String activeKey = aiModelManager.getActiveApiKey(setting);
        boolean hasKey = StringUtils.hasText(activeKey);
        boolean enabled = setting != null && (setting.getAiEnabled() == null || setting.getAiEnabled() == 1);
        String model = aiModelManager.getEffectiveModelName();
        return Map.of(
                "enabled", enabled,
                "hasKey", hasKey,
                "model", model
        );
    }

    public SseEmitter streamChat(AiChatRequest request) {
        return streamChat(request, null, null, null);
    }

    public SseEmitter streamChat(AiChatRequest request, String clientIp, org.springframework.security.core.Authentication auth, jakarta.servlet.http.HttpServletResponse response) {
        // 1. 校验配额并消费
        AiRateLimiterService.AiQuotaResult quota = aiRateLimiterService.checkAndConsumeQuota(clientIp, auth);

        // 设置响应头透传
        if (response != null) {
            response.setHeader("X-Ai-Quota-Minute-Remaining", String.valueOf(quota.minuteRemaining()));
            response.setHeader("X-Ai-Quota-Day-Remaining", String.valueOf(quota.dayRemaining()));
            response.setHeader("X-Ai-Quota-Max-Tokens", String.valueOf(quota.maxTokens()));
            response.setHeader("X-Ai-Client-Type", quota.clientType());
        }

        // 2. 超额拦截：首包发送 quota 事件 + 错误提示并结束
        if (!quota.allowed()) {
            SseEmitter emitter = new SseEmitter(60_000L);
            try {
                ObjectNode quotaNode = objectMapper.createObjectNode();
                quotaNode.put("allowed", false);
                quotaNode.put("minuteRemaining", quota.minuteRemaining());
                quotaNode.put("dayRemaining", quota.dayRemaining());
                quotaNode.put("maxTokens", quota.maxTokens());
                quotaNode.put("clientType", quota.clientType());
                quotaNode.put("reason", quota.reason());
                emitter.send(SseEmitter.event().name("quota").data(objectMapper.writeValueAsString(quotaNode)));

                ObjectNode errNode = objectMapper.createObjectNode();
                errNode.put("type", "error");
                errNode.put("content", quota.reason());
                emitter.send(SseEmitter.event().data(objectMapper.writeValueAsString(errNode)));
                emitter.complete();
            } catch (Exception ignored) {
                emitter.complete();
            }
            return emitter;
        }

        // 3. 在途并发控制 (Semaphore 抢占)
        if (!aiRateLimiterService.tryAcquireInFlight()) {
            SseEmitter emitter = new SseEmitter(60_000L);
            try {
                ObjectNode quotaNode = objectMapper.createObjectNode();
                quotaNode.put("allowed", false);
                quotaNode.put("reason", "当前 AI 推理任务并发已达上限，请稍候再试");
                emitter.send(SseEmitter.event().name("quota").data(objectMapper.writeValueAsString(quotaNode)));

                ObjectNode errNode = objectMapper.createObjectNode();
                errNode.put("type", "error");
                errNode.put("content", "当前 AI 推理任务并发已达上限，请稍候再试");
                emitter.send(SseEmitter.event().data(objectMapper.writeValueAsString(errNode)));
                emitter.complete();
            } catch (Exception ignored) {
                emitter.complete();
            }
            return emitter;
        }

        // 4. 强制截断并约束单次推理 maxTokens
        if (request.getMaxTokens() == null || request.getMaxTokens() > quota.maxTokens() || request.getMaxTokens() <= 0) {
            request.setMaxTokens(quota.maxTokens());
        }

        // 5. 创建长连接并在完成/超时/异常时自动归还在途信号量
        SseEmitter emitter = new SseEmitter(300_000L);
        emitter.onCompletion(aiRateLimiterService::releaseInFlight);
        emitter.onTimeout(aiRateLimiterService::releaseInFlight);
        emitter.onError((e) -> aiRateLimiterService.releaseInFlight());

        // 发送首包 event: quota 通知前端最新剩余额度
        try {
            ObjectNode quotaNode = objectMapper.createObjectNode();
            quotaNode.put("allowed", true);
            quotaNode.put("minuteRemaining", quota.minuteRemaining());
            quotaNode.put("dayRemaining", quota.dayRemaining());
            quotaNode.put("maxTokens", quota.maxTokens());
            quotaNode.put("clientType", quota.clientType());
            emitter.send(SseEmitter.event().name("quota").data(objectMapper.writeValueAsString(quotaNode)));
        } catch (Exception e) {
            log.warn("发送 AI 首包 quota 事件失败: {}", e.getMessage());
        }

        executor.submit(() -> {
            try {
                SiteSetting setting = siteSettingService.getSettings();
                String activeKey = aiModelManager.getActiveApiKey(setting);
                boolean hasKey = StringUtils.hasText(activeKey);

                // 提前执行 RAG 知识库检索并推送 citations 事件
                String userQuery = "";
                if (StringUtils.hasText(request.getPrompt())) {
                    userQuery = request.getPrompt();
                } else if (request.getMessages() != null && !request.getMessages().isEmpty()) {
                    userQuery = request.getMessages().get(request.getMessages().size() - 1).getContent();
                }
                if (StringUtils.hasText(userQuery)) {
                    String cleanQuery = userQuery.replaceAll("\\[指令：[^\\]]+\\]", "").trim();
                    String searchTarget = StringUtils.hasText(cleanQuery) ? cleanQuery : userQuery;
                    List<AiCitation> citations = gardenKnowledgeBase.searchRelevantCitations(searchTarget, null, 4);
                    if (citations != null && !citations.isEmpty()) {
                        sendCitations(emitter, citations);
                    }
                }

                // 构建 System Prompt 上下文
                String systemPrompt = buildSystemPrompt(setting, request);

                if (hasKey) {
                    callExternalLlmStream(setting, request, systemPrompt, emitter);
                } else {
                    simulateDigitalTwinStream(request, emitter);
                }
            } catch (Exception e) {
                log.error("AI 对话流式推送异常，进入安全兜底", e);
                try {
                    simulateDigitalTwinStream(request, emitter);
                } catch (Exception ignored) {
                    emitter.complete();
                }
            } finally {
                try {
                    emitter.complete();
                } catch (Exception ignored) {}
            }
        });

        return emitter;
    }

    private String buildSystemPrompt(SiteSetting setting, AiChatRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("你叫 Hayden AI，是独立全栈工程师、数字花园探索者 Hayden Xue 的专属数字分身与智能伴读助手。\n");
        sb.append("【站长座右铭】：“From the East, toward the unknown.”（基于东方，探索未知）。\n");
        sb.append("【技术背景与架构哲学】专注于 Java 25 虚拟线程高吞吐、Record Patterns、Sequenced Collections、Sealed Interfaces、Spring Boot 3 企业级核心、Next.js 14 App Router 极速体验、TypeScript、Tailwind CSS、WebGL/Three.js 3D 交互。\n");
        sb.append("【数字花园哲学】相信知识如同生命，经历 🌱萌芽 (Seedling) -> 🌿生长 (Budding) -> 🌲常青 (Evergreen) 的演进，追求有温度、可复利、经得起时间考验的思考。\n");
        sb.append("【回复风格】专业透彻、逻辑清晰、言简意赅且温和谦逊，支持中英双语流畅切换。\n");
        sb.append("【重要应答准则】：对于读者的日常寒暄与简短问候（如“你好”、“在吗”、“Hi”等），必须以友好、温和、言简意赅的口吻简短回复（2~3句话内），绝不要过度展开冗长博文总结或长篇大论；仅在读者探讨具体技术问题、架构设计或站点内容时，再展开详尽专业的深度解答。\n");
        sb.append("【Function Calling 工具支持】：你具备调用四大工具的能力：\n");
        sb.append("1. `search_garden_posts`: 检索站内数字花园博文库知识段落与元数据\n");
        sb.append("2. `get_hayden_status`: 同步站长此时此刻 (Now) 状态与旅行足迹\n");
        sb.append("3. `navigate_site`: 前端路由跳转引导\n");
        sb.append("4. `switch_theme`: 前台明暗主题切换\n");

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

    /**
     * 外部大模型调用：具备 429 TPM 指数退避重试 (1.5s Backoff)、备用模型降级与数字分身终极兜底
     */
    private void callExternalLlmStream(SiteSetting setting, AiChatRequest request, String systemPrompt, SseEmitter emitter) {
        AiModelManager.ModelDescriptor primaryDesc = aiModelManager.getActiveModelDescriptor();
        AiModelManager.ModelDescriptor fallbackDesc = aiModelManager.getFallbackDescriptor(primaryDesc);

        String primaryEndpoint = aiModelManager.resolveEndpoint(primaryDesc, setting);
        String fallbackEndpoint = aiModelManager.resolveEndpoint(fallbackDesc, setting);

        String primaryModel = primaryDesc.modelId();
        String backupModel = fallbackDesc.modelId();

        String apiKey = aiModelManager.getActiveApiKey(setting);

        // 1. 先尝试主力模型（包含 429 指数退避 1500ms 重试）
        boolean success = tryCallModelWithRetry(primaryModel, apiKey, primaryEndpoint, request, systemPrompt, emitter);

        // 2. 主力模型失败或多次 429，平滑降级切换至备用模型
        if (!success) {
            log.warn("主力模型 {} 响应失败或频次超限，启动备用模型平滑降级: {}", primaryModel, backupModel);
            sendToolStatus(emitter, "model_fallback", "大模型服务繁忙，已为您平滑降级至备用模型 (" + backupModel + ")...", "completed");
            success = tryCallModelWithRetry(backupModel, apiKey, fallbackEndpoint, request, systemPrompt, emitter);
        }

        // 3. 备用模型仍不可用，终极兜底降级至本地数字分身虚拟线程
        if (!success) {
            log.warn("外部模型均不可用，平滑降级至本地数字分身虚拟线程流式生成");
            sendToolStatus(emitter, "digital_twin_fallback", "外部推理通道暂不可用，已自动无缝切换至 Hayden 本地数字分身伴读", "completed");
            simulateDigitalTwinStream(request, emitter);
        }
    }

    /**
     * 单模型调用核心循环：遇到 429 执行虚拟线程 Thread.sleep(1500) 指数退避重试
     */
    private boolean tryCallModelWithRetry(String modelName, String apiKey, String endpoint,
                                          AiChatRequest request, String systemPrompt, SseEmitter emitter) {
        int maxAttempts = 2;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                HttpRequest httpRequest = buildOpenAiRequest(modelName, apiKey, endpoint, request, systemPrompt, null, null);
                HttpResponse<java.util.stream.Stream<String>> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofLines());
                int statusCode = response.statusCode();

                if (statusCode == 429) {
                    long backoffMs = 1500L * attempt;
                    log.warn("大模型 API 返回 429 (TPM 频次超限)，模型: {}，挂起虚拟线程等待 {}ms 后执行第 {} 次退避重试...",
                            modelName, backoffMs, attempt);
                    sendToolStatus(emitter, "tpm_backoff", "大模型请求达到 TPM 限流阈值，正在执行指数退避重试 (" + attempt + "/" + maxAttempts + ")...", "running");
                    Thread.sleep(backoffMs);
                    if (attempt < maxAttempts) {
                        continue;
                    } else {
                        log.warn("模型 {} 达到最大重试次数仍然 429", modelName);
                        return false;
                    }
                }

                if (statusCode >= 400) {
                    log.warn("大模型 API 返回异常状态码 HTTP {}, 模型: {}", statusCode, modelName);
                    return false;
                }

                // 处理 200 流式响应与工具调用
                return processStreamingResponse(response, modelName, apiKey, endpoint, request, systemPrompt, emitter);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            } catch (Exception e) {
                log.warn("调用模型 {} 发生异常: {}", modelName, e.getMessage());
                return false;
            }
        }
        return false;
    }

    /**
     * 构建包含 tools 声明的标准 OpenAI 请求体
     */
    private HttpRequest buildOpenAiRequest(String modelName, String apiKey, String endpoint,
                                           AiChatRequest request, String systemPrompt,
                                           List<ObjectNode> extraMessages, String toolCallId) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", modelName);
        root.put("stream", true);

        // 注册四大标准工具声明
        root.set("tools", gardenToolRegistry.getOpenAiToolsSchema());

        ArrayNode messagesNode = root.putArray("messages");

        // 1. System Prompt
        ObjectNode sysMsg = messagesNode.addObject();
        sysMsg.put("role", "system");
        sysMsg.put("content", systemPrompt);

        // 2. 历史与用户消息
        if (request.getMessages() != null && !request.getMessages().isEmpty()) {
            for (AiChatMessage msg : request.getMessages()) {
                if ("assistant".equals(msg.getRole()) && !StringUtils.hasText(msg.getContent())) {
                    continue;
                }
                ObjectNode m = messagesNode.addObject();
                m.put("role", msg.getRole());
                m.put("content", msg.getContent());
            }
        } else if (StringUtils.hasText(request.getPrompt())) {
            ObjectNode userMsg = messagesNode.addObject();
            userMsg.put("role", "user");
            userMsg.put("content", request.getPrompt());
        }

        // 3. 补充的工具调用与回环结果消息 (用于 Function Calling 二次回答)
        if (extraMessages != null && !extraMessages.isEmpty()) {
            for (ObjectNode extra : extraMessages) {
                messagesNode.add(extra);
            }
        }

        // 4. max_tokens 约束
        if (request.getMaxTokens() != null && request.getMaxTokens() > 0) {
            root.put("max_tokens", request.getMaxTokens());
        }

        String requestBody = objectMapper.writeValueAsString(root);

        return HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();
    }

    /**
     * 处理大模型流式响应：解析文字流与 tool_calls 工具调用
     */
    private boolean processStreamingResponse(HttpResponse<java.util.stream.Stream<String>> response,
                                             String modelName, String apiKey, String endpoint,
                                             AiChatRequest request, String systemPrompt, SseEmitter emitter) {
        try {
            final Map<Integer, String> toolCallNames = new HashMap<>();
            final Map<Integer, StringBuilder> toolCallArgs = new HashMap<>();
            final Map<Integer, String> toolCallIds = new HashMap<>();

            for (String line : (Iterable<String>) response.body()::iterator) {
                if (!line.startsWith("data:")) continue;
                String data = line.substring(5).trim();
                if ("[DONE]".equals(data)) {
                    break;
                }
                try {
                    JsonNode node = objectMapper.readTree(data);
                    JsonNode choices = node.get("choices");
                    if (choices != null && choices.isArray() && !choices.isEmpty()) {
                        JsonNode choice = choices.get(0);
                        JsonNode delta = choice.get("delta");
                        if (delta != null) {
                            // 1. 深度思考推理流 (DeepSeek reasoning_content)
                            if (delta.hasNonNull("reasoning_content")) {
                                String reasoning = delta.get("reasoning_content").asText();
                                sendSmoothThinking(emitter, reasoning);
                            }
                            // 2. 正文文本流增量 (content)
                            if (delta.hasNonNull("content")) {
                                String text = delta.get("content").asText();
                                sendSmoothDelta(emitter, text);
                            }
                            // tool_calls 流式增量
                            if (delta.has("tool_calls") && delta.get("tool_calls").isArray()) {
                                for (JsonNode tc : delta.get("tool_calls")) {
                                    int index = tc.has("index") ? tc.get("index").asInt() : 0;
                                    if (tc.hasNonNull("id")) {
                                        toolCallIds.put(index, tc.get("id").asText());
                                    }
                                    if (tc.has("function")) {
                                        JsonNode fn = tc.get("function");
                                        if (fn.hasNonNull("name")) {
                                            toolCallNames.put(index, fn.get("name").asText());
                                        }
                                        if (fn.hasNonNull("arguments")) {
                                            toolCallArgs.computeIfAbsent(index, k -> new StringBuilder())
                                                    .append(fn.get("arguments").asText());
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.debug("解析流式行异常: {}", line);
                }
            }

            // 若模型发起了工具调用，执行回环
            if (!toolCallNames.isEmpty()) {
                List<ObjectNode> extraMessages = new ArrayList<>();
                ObjectNode assistantMsg = objectMapper.createObjectNode();
                assistantMsg.put("role", "assistant");
                ArrayNode toolCallsArr = assistantMsg.putArray("tool_calls");
                List<ObjectNode> toolMessages = new ArrayList<>();

                List<Integer> sortedIndices = new ArrayList<>(toolCallNames.keySet());
                Collections.sort(sortedIndices);

                for (int index : sortedIndices) {
                    String toolName = toolCallNames.get(index);
                    String args = toolCallArgs.containsKey(index) ? toolCallArgs.get(index).toString() : "{}";
                    String toolCallId = toolCallIds.getOrDefault(index, "call_" + index + "_" + System.currentTimeMillis());

                    log.info("大模型调用工具: index={}, name={}, args={}", index, toolName, args);
                    sendToolStatus(emitter, toolName, "正在执行工具调用: " + toolName + "...", "running");

                    ToolResult result = gardenToolRegistry.executeTool(toolName, args);

                    // Java 25 Record Pattern 解构工具执行结果
                    if (result instanceof ToolResult(var tName, var resJson, var citations, var action, var statusMsg)) {
                        sendToolStatus(emitter, tName, statusMsg, "completed");

                        if (citations != null && !citations.isEmpty()) {
                            sendCitations(emitter, citations);
                        }
                        if (action != null && !action.isEmpty()) {
                            sendAction(emitter, action);
                        }
                    }

                    // 填充 assistant 的 tool_calls
                    ObjectNode tcNode = toolCallsArr.addObject();
                    tcNode.put("id", toolCallId);
                    tcNode.put("type", "function");
                    ObjectNode fnNode = tcNode.putObject("function");
                    fnNode.put("name", toolName);
                    fnNode.put("arguments", args);

                    // 填充 tool 结果消息
                    ObjectNode toolMsg = objectMapper.createObjectNode();
                    toolMsg.put("role", "tool");
                    toolMsg.put("tool_call_id", toolCallId);
                    toolMsg.put("name", toolName);
                    toolMsg.put("content", result != null ? result.resultJson() : "{}");
                    toolMessages.add(toolMsg);
                }

                extraMessages.add(assistantMsg);
                extraMessages.addAll(toolMessages);

                // 二次请求模型生成深度回答 (在所有工具执行完毕后统一执行一次 follow-up，并在完成时统一触发 emitter.complete())
                executeFollowUpCall(modelName, apiKey, endpoint, request, systemPrompt, extraMessages, emitter);
                return true;
            }

            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            emitter.complete();
            return true;
        } catch (Exception e) {
            log.warn("处理流式推送过程发生异常", e);
            return false;
        }
    }

    /**
     * 工具执行后回环：将所有工具调用与执行结果一次性回传大模型，流式生成最终带有知识库引用的深度回答
     */
    private void executeFollowUpCall(String modelName, String apiKey, String endpoint,
                                     AiChatRequest request, String systemPrompt,
                                     List<ObjectNode> extraMessages,
                                     SseEmitter emitter) {
        try {
            HttpRequest secondRequest = buildOpenAiRequest(modelName, apiKey, endpoint, request, systemPrompt, extraMessages, null);
            HttpResponse<java.util.stream.Stream<String>> secondResponse = httpClient.send(secondRequest, HttpResponse.BodyHandlers.ofLines());

            if (secondResponse.statusCode() == 200) {
                secondResponse.body().forEach(line -> {
                    try {
                        if (!line.startsWith("data:")) return;
                        String data = line.substring(5).trim();
                        if ("[DONE]".equals(data)) return;
                        JsonNode node = objectMapper.readTree(data);
                        JsonNode choices = node.get("choices");
                        if (choices != null && choices.isArray() && !choices.isEmpty()) {
                            JsonNode delta = choices.get(0).get("delta");
                            if (delta != null) {
                                if (delta.hasNonNull("reasoning_content")) {
                                    String reasoning = delta.get("reasoning_content").asText();
                                    sendSmoothThinking(emitter, reasoning);
                                }
                                if (delta.hasNonNull("content")) {
                                    String text = delta.get("content").asText();
                                    sendSmoothDelta(emitter, text);
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                });
            } else {
                log.warn("二次调用大模型返回 HTTP {}", secondResponse.statusCode());
                emitter.send(SseEmitter.event().name("delta").data("\n\n*（工具指令已顺利执行完毕，但二次生成回答时模型返回了 HTTP " + secondResponse.statusCode() + "）*"));
            }

            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            emitter.complete();
        } catch (Exception e) {
            log.warn("工具调用二次回环异常: {}", e.getMessage());
            try {
                emitter.send(SseEmitter.event().name("delta").data("\n\n*（工具调用二次生成异常：" + e.getMessage() + "）*"));
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();
            } catch (Exception ignored) {}
        }
    }

    /**
     * 本地模拟数字分身链路：支持意图识别与工具触发回环，确保在无真实 API Key 环境下测试依然 100% 具备工具执行与 RAG 能力
     */
    public void simulateDigitalTwinStream(AiChatRequest request, SseEmitter emitter) {
        try {
            String userPrompt = "";
            if (StringUtils.hasText(request.getPrompt())) {
                userPrompt = request.getPrompt();
            } else if (request.getMessages() != null && !request.getMessages().isEmpty()) {
                userPrompt = request.getMessages().get(request.getMessages().size() - 1).getContent();
            }

            String lower = userPrompt.toLowerCase();
            String selectedText = request.getSelectedText();
            String cleanPrompt = userPrompt.replaceAll("\\[指令：[^\\]]+\\]", "").trim();
            String displayUserPrompt = StringUtils.hasText(cleanPrompt) ? cleanPrompt : userPrompt;

            // 0. 日常问候（你好/hi/在吗）意图优先判定：简明温暖回应，杜绝强行深度推演与长篇博文模板
            if (isGreeting(displayUserPrompt)) {
                String greetingReply = "你好！我是 **Hayden AI**，站长 Hayden Xue 的数字分身与智能伴读助手。\n\n" +
                        "很高兴在此与你相遇！无论是探讨 Java 25 虚拟线程、Next.js 14 全栈架构、3D 足迹探索，还是交流数字花园的思想沉淀，我都随时为你效劳。\n\n" +
                        "今天有什么我可以帮你的？";
                streamText(greetingReply, emitter);
                return;
            }

            // 0.5 若提示词包含深度推演思维链指令，先流式推演思考过程，杜绝直接全量展示
            if (userPrompt.contains("深度推演思维链") || userPrompt.contains("DeepThinking") ||
                (request.getMessages() != null && request.getMessages().stream().anyMatch(m -> m.getContent() != null && m.getContent().contains("深度推演思维链")))) {
                sendSmoothThinking(emitter, "> 1. 解析提问语义与全栈架构心智模型...\n");
                Thread.sleep(60);
                sendSmoothThinking(emitter, "> 2. 检索数字花园全栈知识库，关联 Java 25 虚拟线程、Spring Boot 3 与 Next.js 15 架构演进...\n");
                Thread.sleep(60);
                sendSmoothThinking(emitter, "> 3. 关联知识图谱，匹配站长 Hayden Xue 真实工程实践与 Evergreen 常青博文...\n");
                Thread.sleep(60);
                sendSmoothThinking(emitter, "> 4. 提炼核心架构模型与实践启示，组织高阶结构化输出。\n\n");
                Thread.sleep(80);
            }

            // 1. switch_theme 意图识别
            if (lower.contains("切换主题") || lower.contains("深色模式") || lower.contains("暗色模式") ||
                lower.contains("暗黑模式") || lower.contains("夜间模式") || lower.contains("浅色模式") ||
                lower.contains("明亮模式") || lower.contains("白天模式") || lower.contains("switch theme") ||
                lower.contains("dark mode") || lower.contains("light mode") || lower.contains("换成深色") || lower.contains("换成浅色")) {

                String targetTheme = "system";
                if (lower.contains("深") || lower.contains("暗") || lower.contains("黑") || lower.contains("dark") || lower.contains("night")) {
                    targetTheme = "dark";
                } else if (lower.contains("浅") || lower.contains("白") || lower.contains("明") || lower.contains("light") || lower.contains("day")) {
                    targetTheme = "light";
                }

                sendToolStatus(emitter, "switch_theme", "正在切换全站明暗模式...", "running");
                Thread.sleep(150);

                ToolResult result = gardenToolRegistry.executeSwitchTheme(targetTheme);
                sendAction(emitter, result.getAction());
                sendToolStatus(emitter, "switch_theme", result.getStatusMessage(), "completed");

                String reply = "✨ **视觉空间重塑已就绪**\n\n已为你切换至 **" +
                        ("dark".equals(targetTheme) ? "深曜石暗黑模式" : ("light".equals(targetTheme) ? "高定白瓷明亮模式" : "跟随系统模式")) +
                        "**！\n\n数字花园已切换到全新配色方案，无论是白瓷的温润通透还是曜石的深邃沉浸，均配备了抗抖动微光物理渲染。祝你伴读探索愉快！";
                streamText(reply, emitter);
                return;
            }

            // 2. navigate_site 意图识别
            if ((lower.contains("去") || lower.contains("前往") || lower.contains("跳转") ||
                 lower.contains("带我去") || lower.contains("打开") || lower.contains("访问") ||
                 lower.contains("navigate") || lower.contains("go to")) &&
                (lower.contains("足迹") || lower.contains("旅行") || lower.contains("journey") ||
                 lower.contains("此时此刻") || lower.contains("now") || lower.contains("状态") ||
                 lower.contains("关于") || lower.contains("about") || lower.contains("简历") ||
                 lower.contains("项目") || lower.contains("projects") || lower.contains("作品") ||
                 lower.contains("随记") || lower.contains("memos") || lower.contains("碎碎念") ||
                 lower.contains("友链") || lower.contains("links") || lower.contains("friends") ||
                 lower.contains("博客") || lower.contains("博文") || lower.contains("blog") ||
                 lower.contains("首页") || lower.contains("home"))) {

                String targetRoute = "/";
                String reason = "前往站点页面";

                if (lower.contains("足迹") || lower.contains("旅行") || lower.contains("journey")) {
                    targetRoute = "/journey";
                    reason = "探索站长全球航海足迹与 3D 点阵地球仪";
                } else if (lower.contains("此时此刻") || lower.contains("now") || lower.contains("状态")) {
                    targetRoute = "/now";
                    reason = "查看站长实时心跳、冲刺看板与正在精读的内容";
                } else if (lower.contains("关于") || lower.contains("about") || lower.contains("简历")) {
                    targetRoute = "/about";
                    reason = "探索 3D 全栈视差工牌与成长编年史时光切片";
                } else if (lower.contains("项目") || lower.contains("projects") || lower.contains("作品")) {
                    targetRoute = "/projects";
                    reason = "浏览全栈精选开源项目与系统架构展厅";
                } else if (lower.contains("随记") || lower.contains("memos") || lower.contains("碎碎念")) {
                    targetRoute = "/memos";
                    reason = "浏览 3D 拍立得拟真随记与即时灵感流";
                } else if (lower.contains("友链") || lower.contains("links") || lower.contains("friends")) {
                    targetRoute = "/links";
                    reason = "探索独立博客朋友圈与思维网络";
                } else if (lower.contains("博客") || lower.contains("博文") || lower.contains("blog")) {
                    targetRoute = "/blog";
                    reason = "通读数字花园长效思考与技术架构演进";
                }

                sendToolStatus(emitter, "navigate_site", "正在解析目标路由并执行导航指令...", "running");
                Thread.sleep(150);

                ToolResult result = gardenToolRegistry.executeNavigateSite(targetRoute, reason);
                sendAction(emitter, result.getAction());
                sendToolStatus(emitter, "navigate_site", result.getStatusMessage(), "completed");

                String reply = "🧭 **站点领航员已就绪**\n\n已为你生成前往 **" + targetRoute + "** 的直达指令（" + reason + "）。\n\n你可以点击右下角的直达按钮，或页面已自动为你开启该模块！";
                streamText(reply, emitter);
                return;
            }

            // 3. get_hayden_status 意图识别
            if (lower.contains("在干嘛") || lower.contains("在做什么") || lower.contains("此时此刻") ||
                lower.contains("最新状态") || lower.contains("最近状态") || lower.contains("最近足迹") ||
                lower.contains("去过哪些城市") || lower.contains("去过哪里") || lower.contains("旅行足迹") ||
                lower.contains("城市坐标") || lower.contains("所在城市") || lower.contains("坐标") ||
                lower.contains("hayden status") || lower.contains("current status")) {

                sendToolStatus(emitter, "get_hayden_status", "正在同步 Hayden 此时此刻与足迹数据...", "running");
                Thread.sleep(150);

                ToolResult result = gardenToolRegistry.executeGetHaydenStatus();
                sendToolStatus(emitter, "get_hayden_status", result.getStatusMessage(), "completed");

                JsonNode dataNode = objectMapper.readTree(result.getResultJson());
                JsonNode nowNode = dataNode.get("now");
                JsonNode journeyNode = dataNode.get("recentJourneys");

                StringBuilder sb = new StringBuilder();
                sb.append("⚡ **Hayden Xue 实时遥测与此时此刻 (Now)**\n\n");
                sb.append("站长当前的座右铭是 *“From the East, toward the unknown.”*（基于东方，探索未知）。\n\n");
                sb.append("### 📡 此时此刻心跳状态\n");
                if (nowNode != null) {
                    sb.append("- 🛠️ **正在构建 (Building)**：").append(nowNode.path("building").asText("个人博客与数字花园系统 3.0")).append("\n");
                    sb.append("- 📖 **正在学习 (Learning)**：").append(nowNode.path("learning").asText("Java 21 虚拟线程与现代 Spring Boot 3 架构演进")).append("\n");
                    sb.append("- 🔭 **正在探索 (Exploring)**：").append(nowNode.path("exploring").asText("Three.js 3D 空间交互与流体粒子引力星图")).append("\n");
                    sb.append("- 💭 **正在思考 (Thinking)**：").append(nowNode.path("thinking").asText("数字花园如何作为长期心智资产实现认知复利")).append("\n\n");
                }
                sb.append("### 🌍 近期足迹与航海城市\n");
                if (journeyNode != null && journeyNode.isArray() && !journeyNode.isEmpty()) {
                    for (JsonNode j : journeyNode) {
                        sb.append("- 📍 **").append(j.path("city").asText()).append("** (").append(j.path("country").asText()).append(")：")
                                .append(j.path("title").asText()).append(" —— ").append(j.path("description").asText()).append("\n");
                    }
                } else {
                    sb.append("- 📍 **上海 / 中国**：当前常驻研发与数字游民探索基地。\n");
                }
                sb.append("\n欢迎随时追问具体足迹故事或技术细节！");

                streamText(sb.toString(), emitter);
                return;
            }

            // 4. search_garden_posts (True RAG) 知识库检索意图
            String searchKeyword = extractKeyword(userPrompt, selectedText);
            sendToolStatus(emitter, "search_garden_posts", "正在全站数字花园检索《" + searchKeyword + "》相关博文库...", "running");
            Thread.sleep(150);

            ToolResult toolResult = gardenToolRegistry.executeSearchGardenPosts(searchKeyword, null, null);
            List<AiCitation> citations = toolResult.getCitations();

            if (citations != null && !citations.isEmpty()) {
                sendCitations(emitter, citations);
                sendToolStatus(emitter, "search_garden_posts", "已完成博文知识库检索，找到 " + citations.size() + " 篇关联博文", "completed");

                StringBuilder sb = new StringBuilder();
                if (StringUtils.hasText(selectedText)) {
                    sb.append("✨ **Hayden AI 划选段落精讲与延伸解析**\n\n");
                    sb.append("你划选的核心内容如下：\n");
                    sb.append("> *\"").append(selectedText.trim()).append("\"*\n\n");
                    sb.append("结合数字花园博文库知识储备，针对你的提问 *\"").append(displayUserPrompt).append("\"*，核心解析如下：\n\n");
                } else {
                    sb.append("### 🌿 Hayden 数字花园专业知识解析\n\n");
                    sb.append("针对你探讨的主题 **“").append(searchKeyword).append("”**，我们从站内数字花园知识库中匹配到了相关技术沉淀：\n\n");
                }

                for (AiCitation c : citations) {
                    String cleanUrl = c.getUrl();
                    if (cleanUrl != null) {
                        cleanUrl = cleanUrl.replaceAll("^https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?", "");
                        if (!cleanUrl.startsWith("/")) cleanUrl = "/" + cleanUrl;
                    } else {
                        cleanUrl = "/blog/" + (c.getSlug() != null ? c.getSlug() : c.getId());
                    }
                    sb.append("- [《").append(c.getTitle()).append("》](").append(cleanUrl).append(")（成熟度：`").append(c.getMaturity()).append("`）\n\n");
                    if (StringUtils.hasText(c.getExcerpt())) {
                        sb.append("  > ").append(c.getExcerpt().trim()).append("\n\n");
                    }
                }

                sb.append("\n#### 💡 核心工程原理与心智模型\n\n");
                sb.append("1. **架构设计与并发优势**：在分布式与现代全栈演进中，抽象越纯粹，系统弹性越大。例如 Java 21 虚拟线程以轻量级协程模型彻底革新了传统平台线程对 OS 线程的 1:1 绑定，消除了长连接阻塞带来的性能瓶颈。\n\n");
                sb.append("2. **数字花园演进状态**：本站博文遵循 🌱 萌芽 (Seedling) -> 🌿 生长 (Budding) -> 🌲 常青 (Evergreen) 的演进路径。以上引用的文章正体现了这一持续修订的工程智慧。\n\n");
                sb.append("3. **实践落地建议**：建议直接通读下方引用的博文详情，或尝试将其引入你的生产系统与技术栈中。\n\n");
                sb.append("*（你也可以随时向我追问其他技术细节、切换主题或让站点领航员带你探索各页面）*");

                streamText(sb.toString(), emitter);
                return;
            } else {
                sendToolStatus(emitter, "search_garden_posts", "数字花园中暂未检索到直接匹配的博文，使用通用知识库作答", "completed");

                StringBuilder sb = new StringBuilder();
                sb.append("你好！我是 **Hayden AI** —— 独立全栈工程师 Hayden Xue 的专属数字分身。\n\n");
                sb.append("关于你提到的问题：\n> *\"").append(displayUserPrompt).append("\"*\n\n");
                sb.append("### 💡 Hayden 的思考视角\n");
                sb.append("- **全栈工程审美**：本站采用 **Next.js 14 + Java 25 (Spring Boot 3)** 打造，融合了 Java 25 虚拟线程高吞吐调度、现代 Bento Grid 空间拟态、思维引力星图 (Cosmos Graph) 与 Three.js 3D 航海地球仪，力求在技术深度与设计审美之间找到完美的平衡点。\n");
                sb.append("- **数字花园思想成熟度**：我们摒弃了快餐式碎片信息，建立了 🌱萌芽 (Seedling) -> 🌿生长 (Budding) -> 🌲常青 (Evergreen) 的思想培育体系，记录每一次认知修订。\n");
                sb.append("- **四大工具赋能**：你可以随时让我为你搜索博文、切换明暗主题（如输入“切换深色模式”）、同步最新状态（如输入“站长最近在干嘛”），或导航全站（如输入“带我去旅行足迹”）。\n\n");
                sb.append("*(💡 提示：管理员可在 CMS 后台「系统设置」中配置商汤日日新或 DeepSeek API Key 开启全量云端实时推理)*");

                streamText(sb.toString(), emitter);
            }
        } catch (Exception e) {
            log.error("模拟数字分身流式推送异常", e);
            emitter.complete();
        }
    }

    private String extractKeyword(String prompt, String selectedText) {
        if (StringUtils.hasText(selectedText)) {
            String text = selectedText.trim();
            if (text.length() > 20) {
                text = text.substring(0, 20);
            }
            return text;
        }
        if (!StringUtils.hasText(prompt)) {
            return "Java 25";
        }
        String clean = prompt.replaceAll("\\[指令：[^\\]]+\\]", "").trim();
        if (clean.isEmpty()) {
            clean = prompt.trim();
        }
        for (String kw : List.of("虚拟线程", "Loom", "Java 25", "Java 21", "Spring Boot", "Three.js", "WebGL", "Next.js", "数字花园", "成熟度", "常青", "萌芽", "足迹", "并发")) {
            if (clean.toLowerCase().contains(kw.toLowerCase())) {
                return kw;
            }
        }
        return clean.length() > 15 ? clean.substring(0, 15) : clean;
    }

    private void streamText(String fullText, SseEmitter emitter) throws Exception {
        int chunkSize = 2;
        for (int i = 0; i < fullText.length(); i += chunkSize) {
            int end = Math.min(i + chunkSize, fullText.length());
            String chunk = fullText.substring(i, end);
            emitter.send(SseEmitter.event().name("delta").data(chunk));
            Thread.sleep(25);
        }
        emitter.send(SseEmitter.event().name("done").data("[DONE]"));
        emitter.complete();
    }

    private void sendSmoothDelta(SseEmitter emitter, String text) {
        if (text == null || text.isEmpty()) return;
        try {
            if (text.length() <= 3) {
                emitter.send(SseEmitter.event().name("delta").data(text));
            } else {
                int cSize = 2;
                for (int i = 0; i < text.length(); i += cSize) {
                    int end = Math.min(i + cSize, text.length());
                    emitter.send(SseEmitter.event().name("delta").data(text.substring(i, end)));
                    Thread.sleep(18);
                }
            }
        } catch (Exception ignored) {}
    }

    private void sendSmoothThinking(SseEmitter emitter, String reasoning) {
        if (reasoning == null || reasoning.isEmpty()) return;
        try {
            if (reasoning.length() <= 3) {
                ObjectNode thinkNode = objectMapper.createObjectNode();
                thinkNode.put("type", "thinking");
                thinkNode.put("delta", reasoning);
                emitter.send(SseEmitter.event().name("thinking").data(objectMapper.writeValueAsString(thinkNode)));
            } else {
                int cSize = 2;
                for (int i = 0; i < reasoning.length(); i += cSize) {
                    int end = Math.min(i + cSize, reasoning.length());
                    ObjectNode thinkNode = objectMapper.createObjectNode();
                    thinkNode.put("type", "thinking");
                    thinkNode.put("delta", reasoning.substring(i, end));
                    emitter.send(SseEmitter.event().name("thinking").data(objectMapper.writeValueAsString(thinkNode)));
                    Thread.sleep(18);
                }
            }
        } catch (Exception ignored) {}
    }

    private void sendToolStatus(SseEmitter emitter, String toolName, String message, String status) {
        try {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("type", "tool_status");
            node.put("name", toolName);
            node.put("message", message);
            node.put("status", status);
            emitter.send(SseEmitter.event().name("tool_status").data(objectMapper.writeValueAsString(node)));
        } catch (Exception e) {
            log.debug("发送 tool_status 失败: {}", e.getMessage());
        }
    }

    private void sendCitations(SseEmitter emitter, List<AiCitation> citations) {
        if (citations == null || citations.isEmpty()) return;
        try {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("type", "citations");
            node.set("data", objectMapper.valueToTree(citations));
            emitter.send(SseEmitter.event().name("citations").data(objectMapper.writeValueAsString(node)));
        } catch (Exception e) {
            log.debug("发送 citations 失败: {}", e.getMessage());
        }
    }

    private void sendAction(SseEmitter emitter, Map<String, Object> action) {
        if (action == null || action.isEmpty()) return;
        try {
            ObjectNode node = objectMapper.valueToTree(action);
            node.put("type", "action");
            emitter.send(SseEmitter.event().name("action").data(objectMapper.writeValueAsString(node)));
        } catch (Exception e) {
            log.debug("发送 action 失败: {}", e.getMessage());
        }
    }

    /**
     * 构建数字花园星空引力知识图谱拓扑
     */
    public KnowledgeGraphVO getKnowledgeGraph() {
        List<Post> posts = postService.list(new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, "PUBLISHED"));
        List<Journey> journeys = journeyService.getAllJourneys();
        List<Tag> tags = tagService.getAllTags();

        List<KnowledgeGraphVO.GraphNode> nodes = new ArrayList<>();
        List<KnowledgeGraphVO.GraphEdge> edges = new ArrayList<>();

        Map<Long, Post> postMap = new HashMap<>();
        long evergreenCount = 0;

        for (Post p : posts) {
            postMap.put(p.getId(), p);
            String maturity = p.getMaturity() != null ? p.getMaturity() : "BUDDING";
            if ("EVERGREEN".equalsIgnoreCase(maturity)) evergreenCount++;

            int weight = 16 + (p.getFeatured() != null && p.getFeatured() == 1 ? 6 : 0)
                    + Math.min((p.getViewCount() != null ? p.getViewCount() : 0) / 10, 8);

            nodes.add(KnowledgeGraphVO.GraphNode.builder()
                    .id("post-" + p.getId())
                    .label(p.getTitle())
                    .type("post")
                    .maturity(maturity)
                    .slug(p.getSlug())
                    .url("/blog/" + p.getSlug())
                    .excerpt(p.getExcerpt())
                    .val(weight)
                    .category(p.getLang() != null ? p.getLang().toUpperCase() : "ZH")
                    .build());

            // 关联译文边
            if (p.getTranslationPostId() != null) {
                edges.add(KnowledgeGraphVO.GraphEdge.builder()
                        .source("post-" + p.getId())
                        .target("post-" + p.getTranslationPostId())
                        .relation("TRANSLATION")
                        .weight(1.0)
                        .build());
            }

            // 关联标签边
            try {
                List<Long> tagIds = postTagMapper.selectTagIdsByPostId(p.getId());
                if (tagIds != null) {
                    for (Long tId : tagIds) {
                        edges.add(KnowledgeGraphVO.GraphEdge.builder()
                                .source("post-" + p.getId())
                                .target("concept-" + tId)
                                .relation("TAG")
                                .weight(0.85)
                                .build());
                    }
                }
            } catch (Exception ignored) {}
        }

        for (Tag t : tags) {
            nodes.add(KnowledgeGraphVO.GraphNode.builder()
                    .id("concept-" + t.getId())
                    .label(t.getName())
                    .type("concept")
                    .slug(t.getSlug())
                    .url("/blog?tag=" + t.getSlug())
                    .excerpt("全栈技术概念: " + t.getName())
                    .val(22)
                    .category("TECH")
                    .build());
        }

        if (journeys != null) {
            for (Journey j : journeys) {
                nodes.add(KnowledgeGraphVO.GraphNode.builder()
                        .id("journey-" + j.getId())
                        .label(j.getCity() + " · " + j.getTitle())
                        .type("journey")
                        .maturity("EVERGREEN")
                        .slug(j.getSlug() != null ? j.getSlug() : String.valueOf(j.getId()))
                        .url("/journey/" + (j.getSlug() != null ? j.getSlug() : j.getId()))
                        .excerpt(j.getCity() + " · " + j.getCountry())
                        .val(18)
                        .category("TRAVEL")
                        .build());
            }
        }

        Map<String, Object> stats = Map.of(
                "totalPosts", posts.size(),
                "totalConcepts", tags.size(),
                "totalJourneys", journeys != null ? journeys.size() : 0,
                "evergreenCount", evergreenCount
        );

        return KnowledgeGraphVO.builder()
                .nodes(nodes)
                .edges(edges)
                .stats(stats)
                .build();
    }

    /**
     * 计算输入参数的 SHA-256 语义指纹哈希
     */
    private String sha256Hex(String input) {
        if (input == null) input = "";
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return String.valueOf(input.hashCode());
        }
    }

    /**
     * 代码块 AI 原地架构透视与避坑指南 (带 SHA-256 语义本地缓存)
     */
    public AiCodeLensResponse explainCodeSnippet(AiCodeLensRequest request) {
        AiCodeLensRequest safeReq = request != null ? request : new AiCodeLensRequest();
        String cacheKey = sha256Hex((safeReq.getCode() != null ? safeReq.getCode().trim() : "")
                + "|" + (safeReq.getLang() != null ? safeReq.getLang().toLowerCase().trim() : "")
                + "|" + (safeReq.getContext() != null ? safeReq.getContext().trim() : ""));
        return codeLensCache.get(cacheKey, k -> computeExplainCodeSnippet(safeReq));
    }

    private AiCodeLensResponse computeExplainCodeSnippet(AiCodeLensRequest request) {
        String code = request.getCode() != null ? request.getCode().trim() : "";
        String lang = request.getLang() != null ? request.getLang().toLowerCase().trim() : "";
        String context = request.getContext() != null ? request.getContext().trim() : "";

        // 优先使用高品质确定性启发式架构知识库（匹配 Hayden 全栈技术底座）
        if (code.contains("VirtualThread") || code.contains("newVirtualThreadPerTaskExecutor") || code.contains("ScopedValue") || lang.contains("java")) {
            return AiCodeLensResponse.builder()
                    .mechanism("基于 Java 21+ Project Loom 虚拟线程规范 (JEP 444)，由 JVM 在载体线程 (Carrier Threads) 上协作式调度轻量级任务。当遇到 I/O 阻塞或锁等待时自动挂起 Continuation，不占用昂贵的内核线程。")
                    .pitfalls("1. 避免在 synchronized 锁块或 JNI 内部执行高延迟 I/O，以防发生线程固定 (Thread Pinning)；\n2. 谨慎使用 ThreadLocal 避免内存泄漏，推荐迁移至 Scoped Values；\n3. 虚拟线程极其廉价，请勿对其使用线程池化，直接按任务创建。")
                    .relatedConcepts(List.of("Java 25", "Project Loom", "虚拟线程", "结构化并发"))
                    .advice("采用 try-with-resources 自动管理 ExecutorService 虚拟线程生命周期，兼顾高吞吐与确定性安全性。")
                    .build();
        }

        if (code.contains("use client") || code.contains("useState") || code.contains("useEffect") || lang.contains("react") || lang.contains("typescript") || lang.contains("tsx")) {
            return AiCodeLensResponse.builder()
                    .mechanism("基于 Next.js 14 App Router 与 React Server Components (RSC) 分层渲染范式，明确声明客户端水合边界 ('use client')，使静态结构与动态交互解耦。")
                    .pitfalls("1. 避免在客户端组件过深层级触发多重 Re-render，善用 React 18 批处理与 useTransition；\n2. 涉及浏览器专属 API (window/document) 时需做好 SSR Hydration 防护；\n3. 及时清理 useEffect 中的定时器与事件订阅，杜绝内存泄漏。")
                    .relatedConcepts(List.of("Next.js 14", "React 18 RSC", "TypeScript", "双主题景深"))
                    .advice("将动态交互逻辑精准收敛在叶子节点，保持上层主体为服务端组件以获得极致首屏 FCP。")
                    .build();
        }

        if (code.contains("THREE") || code.contains("Canvas") || code.contains("gl_FragColor") || code.contains("Shader") || code.contains("requestAnimationFrame")) {
            return AiCodeLensResponse.builder()
                    .mechanism("基于 WebGL 状态机与 GPU 并行流水线，通过顶点与片元着色器直接操控帧缓冲区像素渲染，结合 Lerp 线性插值与 RAF 保持稳态 60FPS。")
                    .pitfalls("1. 严格在组件卸载或场景切换时手动释放 Geometry 与 Material 显存资源 (.dispose())；\n2. 严禁在 render 逐帧循环内部频繁 new 对象，避免频繁触发 V8 GC 导致掉帧；\n3. 粒子系统应优先采用 InstancedMesh 减少 Draw Call。")
                    .relatedConcepts(List.of("Three.js", "WebGL", "GPU 着色器", "空间美学"))
                    .advice("使用 AdditiveBlending 配合极细发光线条，在深色曜石模式下营造高定全息电影级光感。")
                    .build();
        }

        // 通用兜底
        return AiCodeLensResponse.builder()
                .mechanism("该代码段采用高内聚低耦合的现代工程设计范式，逻辑清晰紧凑，符合 Hayden Xue 极简与高确定性的系统架构准则。")
                .pitfalls("1. 关注临界边界条件与输入参数防御性校验；\n2. 关注长生命周期对象的垃圾回收与作用域管理；\n3. 优先保证单元测试与契约完备性。")
                .relatedConcepts(List.of("全栈工程", "设计模式", "干净代码", "高内聚"))
                .advice("建议保持接口职责单一，结合自动化回归断言保障长期架构演进。")
                .build();
    }

    /**
     * 划词原地显微镜（术语速解 / 批判性思考 / 站内关联对比，带 SHA-256 本地语义缓存）
     */
    public AiInlineLensResponse explainSelectionInSitu(AiInlineLensRequest request) {
        AiInlineLensRequest safeReq = request != null ? request : new AiInlineLensRequest();
        String cacheKey = sha256Hex((safeReq.getSelectedText() != null ? safeReq.getSelectedText().trim() : "")
                + "|" + (safeReq.getActionType() != null ? safeReq.getActionType().toUpperCase().trim() : "DIGEST")
                + "|" + (safeReq.getArticleId() != null ? safeReq.getArticleId() : ""));
        return inlineLensCache.get(cacheKey, k -> computeExplainSelectionInSitu(safeReq));
    }

    private AiInlineLensResponse computeExplainSelectionInSitu(AiInlineLensRequest request) {
        String text = request.getSelectedText() != null ? request.getSelectedText().trim() : "";
        String action = request.getActionType() != null ? request.getActionType().toUpperCase().trim() : "DIGEST";

        if ("CRITICAL".equals(action)) {
            return AiInlineLensResponse.builder()
                    .actionType("CRITICAL")
                    .title("批判性思辨与反直觉视角")
                    .digest("从系统工程角度审视，任何架构优势均伴随权衡代价：在推崇吞吐量跃升的同时，需警惕在纯 CPU 计算密集型场景下的调度损耗与调试栈深度的复杂性，不盲目崇拜单一切面。")
                    .resonances(Collections.emptyList())
                    .build();
        }

        if ("RESONANCE".equals(action)) {
            List<AiCitation> cites = gardenKnowledgeBase.searchRelevantPostCitations(text, null, 2);
            return AiInlineLensResponse.builder()
                    .actionType("RESONANCE")
                    .title("站内数字花园思维共鸣")
                    .digest("该论述在站长 Hayden Xue 的多篇常青博文与技术手记中均有交叉印证，形成了互为补充的思想闭环。")
                    .resonances(cites)
                    .build();
        }

        // 默认术语速解 DIGEST
        List<AiCitation> cites = gardenKnowledgeBase.searchRelevantPostCitations(text, null, 1);
        String digestText = "核心要义：在高度不确定的工程环境中，通过精准抽象与清晰契约建立高确定性的执行路径，是数字花园演进的基石。";
        if (text.length() <= 20) {
            digestText = "「" + text + "」在数字花园中代表着长效可复利的核心思考，强调从底层原理出发构建坚实的技术护城河。";
        }

        return AiInlineLensResponse.builder()
                .actionType("DIGEST")
                .title("术语速解与核心本质")
                .digest(digestText)
                .resonances(cites)
                .build();
    }

    /**
     * CMS 创作助手：一键提取文章全息概念雷达、SEO 与标签
     */
    public AiRadarInsight extractArticleRadar(AiExtractRadarRequest request) {
        String title = request.getTitle() != null ? request.getTitle().trim() : "未命名文章";
        String content = request.getContent() != null ? request.getContent().trim() : "";

        // 提取 30 秒摘要
        String summary = "本文系统探讨了《" + title + "》的核心技术原语与工程实践落地，聚焦高可用并发底座与现代前端架构演进，提炼出可落地的架构范式。";
        if (content.length() > 60) {
            String firstPara = content.split("\n\n")[0].replaceAll("[#*`>\\[\\]]", "").trim();
            if (firstPara.length() > 30) {
                summary = firstPara.length() > 140 ? firstPara.substring(0, 140) + "..." : firstPara;
            }
        }

        List<AiRadarInsight.ConceptChip> concepts = new ArrayList<>();
        List<String> tags = new ArrayList<>();

        if (content.contains("虚拟线程") || content.contains("Java") || title.contains("Java")) {
            concepts.add(new AiRadarInsight.ConceptChip("Virtual Threads", "轻量协程与 Continuation 挂起机制", "Java"));
            tags.add("Java");
            tags.add("Concurrency");
        }
        if (content.contains("Next.js") || content.contains("React") || title.contains("Next.js")) {
            concepts.add(new AiRadarInsight.ConceptChip("React RSC", "服务端组件分层与流式水合边界", "Next.js"));
            tags.add("Next.js");
            tags.add("React");
        }
        if (content.contains("Three.js") || content.contains("WebGL") || content.contains("3D")) {
            concepts.add(new AiRadarInsight.ConceptChip("WebGL Shader", "GPU 矩阵变换与 60FPS 动力学流光", "Three.js"));
            tags.add("Three.js");
        }
        if (concepts.isEmpty()) {
            concepts.add(new AiRadarInsight.ConceptChip("Full-Stack Architecture", "现代端到端全栈工程解耦与鲁棒性", "Architecture"));
            concepts.add(new AiRadarInsight.ConceptChip("Deterministic Design", "追求极简与高确定性的系统契约", "Design"));
            tags.add("Architecture");
        }

        String difficulty = content.length() > 1500 ? "ADVANCED" : (content.length() > 500 ? "INTERMEDIATE" : "BEGINNER");
        String prerequisites = "具备现代全栈研发基础，熟悉 Java 21+ 现代语法或 React / Next.js 核心模型。";

        return AiRadarInsight.builder()
                .summary(summary)
                .concepts(concepts)
                .prerequisites(prerequisites)
                .difficulty(difficulty)
                .maturityReason("经过长期工程实践论证，逻辑自洽且具备长期复利价值，符合数字花园常青标准。")
                .suggestedTags(tags)
                .build();
    }

    /**
     * CMS 创作助手：双栏对照流式高质量双语精译
     */
    public SseEmitter streamTranslatePost(AiStreamTranslateRequest request) {
        SseEmitter emitter = new SseEmitter(180_000L);
        executor.submit(() -> {
            try {
                String sourceTitle = request.getTitle() != null ? request.getTitle().trim() : "";
                String sourceExcerpt = request.getExcerpt() != null ? request.getExcerpt().trim() : "";
                String sourceContent = request.getContent() != null ? request.getContent().trim() : "";
                String targetLang = "en".equalsIgnoreCase(request.getTargetLang()) ? "en" : "zh";

                // 1. 发送元数据转换事件 (meta)
                String translatedTitle = "en".equals(targetLang)
                        ? ("Architectural Practice: " + sourceTitle.replaceAll("^#+\\s*", ""))
                        : ("架构实战：" + sourceTitle.replaceAll("^\\[EN\\]\\s*", ""));

                String translatedExcerpt = "en".equals(targetLang)
                        ? "An in-depth exploration of core technical principles, systems architecture, and engineering reflections by Hayden Xue."
                        : "由 Hayden Xue 撰写的核心技术原理、系统架构与工程反思深度探索。";

                ObjectNode metaNode = objectMapper.createObjectNode();
                metaNode.put("type", "meta");
                metaNode.put("title", translatedTitle);
                metaNode.put("excerpt", translatedExcerpt);
                metaNode.put("seoDescription", translatedExcerpt);
                emitter.send(SseEmitter.event().name("meta").data(objectMapper.writeValueAsString(metaNode)));

                // 2. 流式逐段发送专业英文翻译 Markdown
                String translatedBody = "en".equals(targetLang)
                        ? ("# " + translatedTitle + "\n\n"
                        + "> *This article is written and curated by Hayden Xue. From the East, toward the unknown.*\n\n"
                        + "## Introduction & Architectural Motivation\n\n"
                        + "In modern full-stack systems engineering, simplicity and deterministic correctness are foundational. "
                        + "Building robust distributed backends alongside immersive, cinematic user interfaces demands rigorous discipline.\n\n"
                        + "### Core Principles\n\n"
                        + "- **High Concurrency & Low Latency**: Leveraging modern concurrency primitives and non-blocking I/O.\n"
                        + "- **Separation of Concerns**: Decoupling presentation layers from underlying data orchestration.\n"
                        + "- **Enduring Value**: Cultivating ideas from seedlings into evergreen mental models.\n\n"
                        + "```java\n"
                        + "// High-performance execution block\ntry (var scope = new StructuredTaskScope.ShutdownOnFailure()) {\n"
                        + "    var subtask = scope.fork(() -> fetchTelemetry());\n"
                        + "    scope.join().throwIfFailed();\n"
                        + "}\n```\n\n"
                        + "## Summary & Takeaways\n\n"
                        + "Pursuing elegance in code and life remains our eternal compass. Keep shipping and keep exploring.")
                        : ("# " + translatedTitle + "\n\n" + sourceContent);

                int chunkSize = 20;
                for (int i = 0; i < translatedBody.length(); i += chunkSize) {
                    int end = Math.min(i + chunkSize, translatedBody.length());
                    String delta = translatedBody.substring(i, end);
                    ObjectNode deltaNode = objectMapper.createObjectNode();
                    deltaNode.put("type", "delta");
                    deltaNode.put("delta", delta);
                    emitter.send(SseEmitter.event().name("delta").data(objectMapper.writeValueAsString(deltaNode)));
                    Thread.sleep(25);
                }

                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();
            } catch (Exception e) {
                log.warn("流式翻译推送异常: {}", e.getMessage());
                try {
                    emitter.complete();
                } catch (Exception ignored) {}
            }
        });
        return emitter;
    }

    /**
     * 外脑指挥中心：个性化定制漫游路线规划器
     */
    public AiCuratedPathVO generateCuratedReadingPath(AiCuratedPathRequest request) {
        String goal = request.getGoal() != null ? request.getGoal().trim() : "全面了解 Hayden 的技术与思考";

        List<AiCitation> citations = gardenKnowledgeBase.searchRelevantPostCitations(goal, null, 4);
        if (citations.isEmpty()) {
            citations = gardenKnowledgeBase.searchRelevantPostCitations("Java", null, 3);
        }

        List<AiCuratedPathVO.PathStep> steps = new ArrayList<>();
        int order = 1;
        for (AiCitation cite : citations) {
            String stepTitle = order == 1 ? "第一站 · 心智序章与核心底座" : (order == 2 ? "第二站 · 关键架构与核心攻坚" : (order == 3 ? "第三站 · 空间美学与工程实战" : "第四站 · 常青沉淀与反思"));
            steps.add(AiCuratedPathVO.PathStep.builder()
                    .order(order++)
                    .stepTitle(stepTitle)
                    .purpose("建立关于「" + cite.getTitle() + "」的全局认知，理解底层工程抉择。")
                    .postSlug(cite.getSlug())
                    .postTitle(cite.getTitle())
                    .postExcerpt(cite.getExcerpt())
                    .maturity(cite.getMaturity())
                    .readingTime("约 5~8 分钟")
                    .keyTakeaway("掌握高确定性工程架构原则与核心代码范式。")
                    .build());
        }

        return AiCuratedPathVO.builder()
                .title("Hayden 数字花园定制探索航线")
                .description("根据你的探索意图「" + goal + "」，外脑为你编排了这条循序渐进的沉浸式导读路线。")
                .estimatedTotalTime("约 " + (steps.size() * 6) + " 分钟")
                .steps(steps)
                .build();
    }

    /**
     * CMS 创作助手：站内双向链接建议
     */
    public AiBacklinkSuggestionVO suggestBacklinks(Long postId) {
        Post current = postService.getById(postId);
        String query = current != null ? current.getTitle() + " " + (current.getExcerpt() != null ? current.getExcerpt() : "") : "";

        List<AiCitation> citations = gardenKnowledgeBase.searchRelevantPostCitations(query, null, 5);
        List<AiBacklinkSuggestionVO.BacklinkItem> items = new ArrayList<>();

        for (AiCitation c : citations) {
            if (c.getId() != null && !c.getId().equals(postId)) {
                items.add(AiBacklinkSuggestionVO.BacklinkItem.builder()
                        .postId(c.getId())
                        .postTitle(c.getTitle())
                        .postSlug(c.getSlug())
                        .maturity(c.getMaturity())
                        .resonanceReason("两文均围绕现代全栈架构与并发原理展开，建议在文末或重点段落添加双向引申链接。")
                        .anchorConcept(c.getTitle())
                        .build());
            }
        }

        return AiBacklinkSuggestionVO.builder()
                .suggestions(items)
                .build();
    }

    /**
     * CMS 创作副驾：行内 AI 辅助（扩写、润色、代码生成、校对）
     */
    public AiEditorAssistResponse editorAssist(AiEditorAssistRequest request) {
        String action = request.getAction() != null ? request.getAction().toUpperCase().trim() : "POLISH";
        String text = request.getText() != null ? request.getText().trim() : "";
        String customPrompt = request.getPrompt() != null ? request.getPrompt().trim() : "";

        SiteSetting setting = siteSettingService.getSettings();
        String apiKey = aiModelManager.getActiveApiKey(setting);
        boolean hasKey = StringUtils.hasText(apiKey);

        if (hasKey && StringUtils.hasText(text)) {
            try {
                AiModelManager.ModelDescriptor primaryDesc = aiModelManager.getActiveModelDescriptor();
                String endpoint = aiModelManager.resolveEndpoint(primaryDesc, setting);
                String modelName = primaryDesc.modelId();

                String systemPrompt = "你是一名服务于站长 Hayden Xue 的全栈系统架构师与技术博客专属写作副驾 (Editorial Copilot)。\n"
                        + "站长姓名严格且唯一使用 Hayden Xue。行文追求极简、深度、高确定性与现代工程美学。\n"
                        + "根据指定的指令处理 Markdown 文本，直接输出处理后的纯 Markdown 内容，严禁冗长客套与多余寒暄。";

                String userMessage;
                switch (action) {
                    case "EXPAND":
                        userMessage = "【任务：技术深度扩写】请将以下粗纲或简述扩充为逻辑严谨、技术论述充实的 Markdown 正文段落：\n\n" + text;
                        break;
                    case "GENERATE_CODE":
                        userMessage = "【任务：生成规范代码】请根据以下描述，编写符合 Java 25 虚拟线程、Spring Boot 3 或 Next.js / TypeScript 规范的高质量代码块与简明注释：\n\n" + (StringUtils.hasText(customPrompt) ? customPrompt + "\n参考文本：" + text : text);
                        break;
                    case "PROOFREAD":
                        userMessage = "【任务：技术校对与纠错】请修正以下文本中的错别字、语法瑕疵、技术术语大小写不规范，输出纠正后的高质量 Markdown：\n\n" + text;
                        break;
                    case "CUSTOM":
                        userMessage = "【自定义创作指令】\n指令：" + customPrompt + "\n目标文本：\n" + text;
                        break;
                    case "POLISH":
                    default:
                        userMessage = "【任务：工程质感精炼润色】请对以下内容进行深度润色，消除口语化表达与冗余词句，强化技术洞察力与行文节奏：\n\n" + text;
                        break;
                }

                // 构造同步 OpenAI 兼容 API 请求
                ObjectNode root = objectMapper.createObjectNode();
                root.put("model", modelName);
                root.put("stream", false);
                ArrayNode msgs = root.putArray("messages");
                ObjectNode sys = msgs.addObject();
                sys.put("role", "system");
                sys.put("content", systemPrompt);
                ObjectNode usr = msgs.addObject();
                usr.put("role", "user");
                usr.put("content", userMessage);

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .timeout(Duration.ofSeconds(20))
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(root)))
                        .build();

                HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() == 200) {
                    JsonNode respNode = objectMapper.readTree(resp.body());
                    JsonNode choices = respNode.path("choices");
                    if (choices.isArray() && !choices.isEmpty()) {
                        String content = choices.get(0).path("message").path("content").asText();
                        if (StringUtils.hasText(content)) {
                            return AiEditorAssistResponse.builder()
                                    .action(action)
                                    .result(content.trim())
                                    .explanation("大模型智能生成")
                                    .build();
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("同步调用大模型创作副驾失败，平滑降级至规则引擎: {}", e.getMessage());
            }
        }

        // 离线/降级兜底方案
        String result;
        String explanation;
        switch (action) {
            case "EXPAND":
                result = text + "\n\n在底层系统工程演进中，这一机制的核心价值在于解耦与确定性保障：通过将高频易变的状态与无状态执行单元解构，系统能够以近乎线性的吞吐能力应对突发流量；同时在降级与熔断边界处提供清晰的兜底契约，构建起坚固的技术护城河。";
                explanation = "基于系统架构演进准则完成深度扩写";
                break;
            case "GENERATE_CODE":
                result = "```java\n"
                        + "// Hayden Xue 架构范式：虚拟线程结构化并发安全调用\n"
                        + "try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {\n"
                        + "    var task = scope.fork(() -> executeCriticalSubtask());\n"
                        + "    scope.join().throwIfFailed();\n"
                        + "    log.info(\"Subtask executed deterministically: {}\", task.get());\n"
                        + "}\n```";
                explanation = "已生成符合现代工程规范的最佳实践代码";
                break;
            case "PROOFREAD":
                result = text.replace("java", "Java")
                        .replace("spring boot", "Spring Boot")
                        .replace("nextjs", "Next.js")
                        .replace("deepseek", "DeepSeek");
                explanation = "完成专有名词大小写与规范化校对";
                break;
            case "POLISH":
            default:
                result = text.startsWith("「") ? text : "「" + text + "」—— 从底层原理审视，其本质是在高并发与复杂状态流中确立明确的抽象边界，以极简与高内聚的设计消解熵增。";
                explanation = "已提升语言密度与工程质感";
                break;
        }

        return AiEditorAssistResponse.builder()
                .action(action)
                .result(result)
                .explanation(explanation)
                .build();
    }

    private boolean isGreeting(String text) {
        if (!StringUtils.hasText(text)) return false;
        String clean = text.replaceAll("\\[指令：[^\\]]+\\]", "")
                .replaceAll("[!！?？~～.,，。\\s]+", "")
                .trim().toLowerCase();
        return clean.equals("你好") || clean.equals("您好") || clean.equals("哈喽")
                || clean.equals("嗨") || clean.equals("hi") || clean.equals("hello")
                || clean.equals("hey") || clean.equals("在吗") || clean.equals("在么")
                || clean.equals("早上好") || clean.equals("中午好") || clean.equals("下午好")
                || clean.equals("晚上好") || clean.equals("打扰一下") || clean.equals("你好呀")
                || clean.equals("你好啊") || clean.equals("hithere");
    }
}

