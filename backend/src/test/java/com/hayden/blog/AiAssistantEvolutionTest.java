package com.hayden.blog;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.hayden.blog.ai.dto.AiChatMessage;
import com.hayden.blog.ai.dto.AiChatRequest;
import com.hayden.blog.ai.service.AiService;
import com.hayden.blog.ai.tools.GardenToolRegistry;
import com.hayden.blog.ai.tools.ToolResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.lang.reflect.Field;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2")
public class AiAssistantEvolutionTest {

    @Autowired
    private AiService aiService;

    @Autowired
    private GardenToolRegistry gardenToolRegistry;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("验证四大标准 Tools 的 OpenAI JSON Schema 声明结构")
    void testOpenAiToolsSchema() {
        ArrayNode tools = gardenToolRegistry.getOpenAiToolsSchema();
        assertNotNull(tools, "tools 数组不应为空");
        assertEquals(4, tools.size(), "应包含四大核心工具声明");

        Set<String> toolNames = new HashSet<>();
        for (JsonNode tool : tools) {
            assertEquals("function", tool.path("type").asText());
            JsonNode fn = tool.path("function");
            String name = fn.path("name").asText();
            toolNames.add(name);
            assertFalse(fn.path("description").asText().isEmpty(), "工具必须具备语义描述");

            JsonNode params = fn.path("parameters");
            assertEquals("object", params.path("type").asText());
            JsonNode props = params.path("properties");

            if ("search_garden_posts".equals(name)) {
                assertTrue(props.has("query"), "search_garden_posts 必须包含 query 参数");
                assertTrue(props.has("category"), "search_garden_posts 必须包含 category 参数");
                assertTrue(props.has("maturity"), "search_garden_posts 必须包含 maturity 参数");
            } else if ("navigate_site".equals(name)) {
                assertTrue(props.has("path"), "navigate_site 必须包含 path 参数");
                assertTrue(props.has("reason"), "navigate_site 必须包含 reason 参数");
            } else if ("switch_theme".equals(name)) {
                assertTrue(props.has("theme"), "switch_theme 必须包含 theme 参数");
            } else if ("get_hayden_status".equals(name)) {
                assertNotNull(props);
            }
        }

        assertTrue(toolNames.contains("search_garden_posts"), "必须包含 search_garden_posts");
        assertTrue(toolNames.contains("get_hayden_status"), "必须包含 get_hayden_status");
        assertTrue(toolNames.contains("navigate_site"), "必须包含 navigate_site");
        assertTrue(toolNames.contains("switch_theme"), "必须包含 switch_theme");
    }

    @Test
    @DisplayName("验证 search_garden_posts 博文全文语义检索与元数据出处")
    void testSearchGardenPostsTool() {
        ToolResult result = gardenToolRegistry.executeSearchGardenPosts("虚拟线程", null, null);
        assertNotNull(result);
        assertEquals("search_garden_posts", result.getToolName());
        assertNotNull(result.getStatusMessage());
        assertNotNull(result.getResultJson());

        // 即使没有直接匹配，也会回退检索数字花园文章，确保上下文丰满
        assertNotNull(result.getCitations());
        assertFalse(result.getCitations().isEmpty(), "检索结果应包含博文引用元数据");

        var firstCitation = result.getCitations().get(0);
        assertNotNull(firstCitation.getId());
        assertNotNull(firstCitation.getTitle());
        assertNotNull(firstCitation.getSlug());
        assertNotNull(firstCitation.getUrl());
        assertNotNull(firstCitation.getMaturity());
        assertTrue(firstCitation.getUrl().startsWith("/blog/"));
    }

    @Test
    @DisplayName("验证 get_hayden_status 聚合此时此刻与旅行足迹")
    void testGetHaydenStatusTool() throws Exception {
        ToolResult result = gardenToolRegistry.executeGetHaydenStatus();
        assertNotNull(result);
        assertEquals("get_hayden_status", result.getToolName());
        assertNotNull(result.getResultJson());

        JsonNode json = objectMapper.readTree(result.getResultJson());
        assertTrue(json.has("motto"));
        assertTrue(json.has("now"));
        assertTrue(json.has("recentJourneys"));
        assertTrue(json.has("currentLocation"));

        JsonNode now = json.get("now");
        assertTrue(now.has("building"));
        assertTrue(now.has("learning"));
        assertTrue(now.has("exploring"));
        assertTrue(now.has("thinking"));
    }

    @Test
    @DisplayName("验证 navigate_site 前端路由跳转引导指令生成")
    void testNavigateSiteTool() {
        ToolResult result = gardenToolRegistry.executeNavigateSite("/journey", "前往探索航海足迹");
        assertNotNull(result);
        assertEquals("navigate_site", result.getToolName());
        assertNotNull(result.getAction());
        assertEquals("navigate_site", result.getAction().get("action"));
        assertEquals("/journey", result.getAction().get("route"));
        assertEquals("前往探索航海足迹", result.getAction().get("reason"));
    }

    @Test
    @DisplayName("验证 switch_theme 站点明暗主题切换指令生成")
    void testSwitchThemeTool() {
        ToolResult darkResult = gardenToolRegistry.executeSwitchTheme("dark");
        assertNotNull(darkResult);
        assertEquals("switch_theme", darkResult.getToolName());
        assertEquals("dark", darkResult.getAction().get("theme"));

        ToolResult lightResult = gardenToolRegistry.executeSwitchTheme("light");
        assertNotNull(lightResult);
        assertEquals("light", lightResult.getAction().get("theme"));
    }

    @Test
    @DisplayName("验证本地模拟数字分身链路中 True RAG 知识检索与引用回环")
    void testSimulateDigitalTwinTrueRAG() throws Exception {
        AiChatRequest request = AiChatRequest.builder()
                .prompt("请问数字花园里关于虚拟线程的高并发实践原理是什么？")
                .build();

        CustomTrackingEmitter emitter = new CustomTrackingEmitter(30_000L);
        aiService.simulateDigitalTwinStream(request, emitter);

        assertTrue(emitter.awaitDone(5, TimeUnit.SECONDS), "流式响应应在5秒内完成");

        List<String> events = emitter.getReceivedEvents();
        assertFalse(events.isEmpty(), "应收到流式数据块");

        // 检查是否有 tool_status 事件
        boolean hasToolStatus = events.stream().anyMatch(e -> e.contains("\"type\":\"tool_status\"") && e.contains("search_garden_posts"));
        assertTrue(hasToolStatus, "必须触发 search_garden_posts 工具状态动效胶囊事件");

        // 检查是否有 citations 事件
        boolean hasCitations = events.stream().anyMatch(e -> e.contains("\"type\":\"citations\""));
        assertTrue(hasCitations, "必须触发 citations 知识库引用卡片事件");

        // 检查完整文本内容
        String fullOutput = String.join("", events);
        assertTrue(fullOutput.contains("Hayden") || fullOutput.contains("数字花园"), "输出应包含 Hayden 数字分身知识回答");
    }

    @Test
    @DisplayName("验证本地模拟数字分身链路中 switch_theme 意图识别与工具触发")
    void testSimulateDigitalTwinSwitchTheme() throws Exception {
        AiChatRequest request = AiChatRequest.builder()
                .prompt("太刺眼了，帮我切换到暗黑模式")
                .build();

        CustomTrackingEmitter emitter = new CustomTrackingEmitter(30_000L);
        aiService.simulateDigitalTwinStream(request, emitter);

        assertTrue(emitter.awaitDone(5, TimeUnit.SECONDS));

        List<String> events = emitter.getReceivedEvents();
        boolean hasAction = events.stream().anyMatch(e -> e.contains("\"type\":\"action\"") && e.contains("switch_theme") && e.contains("dark"));
        assertTrue(hasAction, "必须触发 switch_theme 动作并指定 dark 模式");

        boolean hasToolStatus = events.stream().anyMatch(e -> e.contains("\"type\":\"tool_status\"") && e.contains("switch_theme"));
        assertTrue(hasToolStatus, "必须包含 switch_theme 的 tool_status");
    }

    @Test
    @DisplayName("验证本地模拟数字分身链路中 navigate_site 意图识别与工具触发")
    void testSimulateDigitalTwinNavigate() throws Exception {
        AiChatRequest request = AiChatRequest.builder()
                .prompt("带我去看站长的旅行足迹")
                .build();

        CustomTrackingEmitter emitter = new CustomTrackingEmitter(30_000L);
        aiService.simulateDigitalTwinStream(request, emitter);

        assertTrue(emitter.awaitDone(5, TimeUnit.SECONDS));

        List<String> events = emitter.getReceivedEvents();
        boolean hasAction = events.stream().anyMatch(e -> e.contains("\"type\":\"action\"") && e.contains("navigate_site") && e.contains("/journey"));
        assertTrue(hasAction, "必须触发 navigate_site 动作并导航至 /journey");
    }

    @Test
    @DisplayName("验证本地模拟数字分身链路中 get_hayden_status 意图识别与数据同步")
    void testSimulateDigitalTwinStatus() throws Exception {
        AiChatRequest request = AiChatRequest.builder()
                .prompt("站长现在在做什么？最近状态怎么样？")
                .build();

        CustomTrackingEmitter emitter = new CustomTrackingEmitter(30_000L);
        aiService.simulateDigitalTwinStream(request, emitter);

        assertTrue(emitter.awaitDone(5, TimeUnit.SECONDS));

        List<String> events = emitter.getReceivedEvents();
        boolean hasStatusTool = events.stream().anyMatch(e -> e.contains("\"type\":\"tool_status\"") && e.contains("get_hayden_status"));
        assertTrue(hasStatusTool, "必须触发 get_hayden_status 工具同步状态");

        String fullText = String.join("", events);
        assertTrue(fullText.contains("此时此刻") || fullText.contains("Building") || fullText.contains("构建"), "回答应包含真实此时此刻心跳数据");
    }

    @Test
    @DisplayName("验证 AI 状态查询接口返回正确模型配置")
    void testGetAiStatus() {
        var status = aiService.getAiStatus();
        assertNotNull(status);
        assertTrue(status.containsKey("enabled"));
        assertTrue(status.containsKey("hasKey"));
        assertTrue(status.containsKey("model"));
        assertNotNull(status.get("model"));
    }

    @Test
    @DisplayName("验证数字花园星空引力知识图谱拓扑构建与节点完整性")
    void testKnowledgeGraph() {
        var graph = aiService.getKnowledgeGraph();
        assertNotNull(graph, "知识图谱 VO 不应为空");
        assertNotNull(graph.getNodes(), "节点列表不应为空");
        assertNotNull(graph.getEdges(), "连线列表不应为空");
        assertFalse(graph.getNodes().isEmpty(), "图谱应至少包含已发布博文、概念或足迹节点");

        boolean hasPost = graph.getNodes().stream().anyMatch(n -> "post".equals(n.getType()));
        boolean hasConcept = graph.getNodes().stream().anyMatch(n -> "concept".equals(n.getType()));
        boolean hasJourney = graph.getNodes().stream().anyMatch(n -> "journey".equals(n.getType()));

        assertTrue(hasPost, "知识图谱必须包含博文节点");
        assertTrue(hasConcept, "知识图谱必须包含概念节点");
        assertTrue(hasJourney, "知识图谱必须包含旅行足迹节点");
        assertNotNull(graph.getStats(), "统计看板不应为空");
    }

    @Test
    @DisplayName("验证代码块 AI 架构透视与避坑指南生成")
    void testExplainCodeSnippet() {
        var request = com.hayden.blog.ai.dto.AiCodeLensRequest.builder()
                .code("try (var executor = Executors.newVirtualThreadPerTaskExecutor()) { ... }")
                .lang("java")
                .context("高并发后端")
                .build();
        var response = aiService.explainCodeSnippet(request);
        assertNotNull(response);
        assertNotNull(response.getMechanism(), "应包含底层原理解析");
        assertTrue(response.getMechanism().contains("虚拟线程") || response.getMechanism().contains("Loom"));
        assertNotNull(response.getPitfalls(), "应包含并发避坑指南");
        assertFalse(response.getRelatedConcepts().isEmpty(), "应包含关联技术矩阵");
    }

    @Test
    @DisplayName("验证划词原地显微镜（速解与关联）")
    void testExplainSelectionInSitu() {
        var request = com.hayden.blog.ai.dto.AiInlineLensRequest.builder()
                .selectedText("虚拟线程")
                .articleId(2L)
                .actionType("DIGEST")
                .build();
        var response = aiService.explainSelectionInSitu(request);
        assertNotNull(response);
        assertEquals("DIGEST", response.getActionType());
        assertNotNull(response.getDigest());

        var resonanceReq = com.hayden.blog.ai.dto.AiInlineLensRequest.builder()
                .selectedText("Spring Boot")
                .articleId(2L)
                .actionType("RESONANCE")
                .build();
        var resonanceResp = aiService.explainSelectionInSitu(resonanceReq);
        assertNotNull(resonanceResp);
        assertEquals("RESONANCE", resonanceResp.getActionType());
    }

    @Test
    @DisplayName("验证文章 AI 全息概念雷达与摘要提取")
    void testExtractArticleRadar() {
        var request = com.hayden.blog.ai.dto.AiExtractRadarRequest.builder()
                .title("Java 25 虚拟线程与高并发架构实战")
                .content("本文详细剖析了 Java 虚拟线程调度机制与 Continuation 挂起原理，结合 Spring Boot 3 落地生产微服务。")
                .build();
        var radar = aiService.extractArticleRadar(request);
        assertNotNull(radar);
        assertNotNull(radar.getSummary(), "应提炼 30 秒摘要");
        assertFalse(radar.getConcepts().isEmpty(), "应提炼核心概念芯片");
        assertNotNull(radar.getDifficulty(), "应评估难度等级");
    }

    @Test
    @DisplayName("验证定制学习漫游路线生成器")
    void testCuratedReadingPath() {
        var request = com.hayden.blog.ai.dto.AiCuratedPathRequest.builder()
                .goal("想攻坚 Java 高并发和现代架构")
                .build();
        var path = aiService.generateCuratedReadingPath(request);
        assertNotNull(path);
        assertNotNull(path.getTitle());
        assertFalse(path.getSteps().isEmpty(), "应生成步骤航线");
    }

    @Test
    @DisplayName("验证站内双向链接建议")
    void testSuggestBacklinks() {
        var backlinks = aiService.suggestBacklinks(2L);
        assertNotNull(backlinks);
        assertNotNull(backlinks.getSuggestions());
    }

    /**
     * 自定义 SseEmitter，用于拦截与核验流式数据行
     */
    static class CustomTrackingEmitter extends SseEmitter {
        private final List<String> receivedEvents = Collections.synchronizedList(new ArrayList<>());
        private final CountDownLatch doneLatch = new CountDownLatch(1);

        public CustomTrackingEmitter(Long timeout) {
            super(timeout);
        }

        @Override
        public void send(SseEventBuilder builder) {
            try {
                // 通过反射获取 builder 中的 data 字段
                Set<ResponseBodyEmitter.DataWithMediaType> dataToSend = builder.build();
                for (ResponseBodyEmitter.DataWithMediaType item : dataToSend) {
                    if (item.getData() != null) {
                        receivedEvents.add(item.getData().toString());
                    }
                }
            } catch (Exception e) {
                // 忽略反射提取微小差异
            }
        }

        @Override
        public synchronized void complete() {
            doneLatch.countDown();
            super.complete();
        }

        @Override
        public synchronized void completeWithError(Throwable ex) {
            doneLatch.countDown();
            super.completeWithError(ex);
        }

        public boolean awaitDone(long timeout, TimeUnit unit) throws InterruptedException {
            return doneLatch.await(timeout, unit);
        }

        public List<String> getReceivedEvents() {
            return new ArrayList<>(receivedEvents);
        }
    }
}
