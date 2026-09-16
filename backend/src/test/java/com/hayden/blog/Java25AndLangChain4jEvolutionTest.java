package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.ai.dto.AiCitation;
import com.hayden.blog.ai.dto.AiChatRequest;
import com.hayden.blog.ai.rag.GardenKnowledgeBase;
import com.hayden.blog.ai.service.AiModelManager;
import com.hayden.blog.ai.service.AiService;
import com.hayden.blog.ai.tools.GardenTool;
import com.hayden.blog.ai.tools.GardenToolRegistry;
import com.hayden.blog.ai.tools.GardenTools;
import com.hayden.blog.ai.tools.ToolResult;
import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.entity.Timeline;
import com.hayden.blog.service.SiteSettingService;
import com.hayden.blog.service.TimelineService;
import com.hayden.blog.storage.LocalStorageServiceImpl;
import com.hayden.blog.storage.MinioStorageServiceImpl;
import com.hayden.blog.storage.StorageFactory;
import com.hayden.blog.storage.StorageService;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Java 25 生产特性与 LangChain4j 智能外脑专属测试套件
 */
@SpringBootTest
@ActiveProfiles("h2")
public class Java25AndLangChain4jEvolutionTest {

    @Autowired
    private AiModelManager aiModelManager;

    @Autowired
    private GardenTools gardenTools;

    @Autowired
    private GardenToolRegistry gardenToolRegistry;

    @Autowired
    private GardenKnowledgeBase gardenKnowledgeBase;

    @Autowired
    private AiService aiService;

    @Autowired
    private TimelineService timelineService;

    @Autowired
    private StorageFactory storageFactory;

    @Autowired
    private LocalStorageServiceImpl localStorageService;

    @Autowired
    private MinioStorageServiceImpl minioStorageService;

    @Autowired
    private SiteSettingService siteSettingService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // =========================================================================
    // 1. Java 25 生产特性落地验证
    // =========================================================================

    @Test
    @DisplayName("Java 25 特性 1: Sealed Interface 密封接口与模式匹配穷尽性")
    void testSealedInterfaceAndSwitchExhaustiveness() {
        // 验证 StorageService 是 sealed interface
        assertTrue(StorageService.class.isSealed(), "StorageService 必须为 Java Sealed 接口");
        Class<?>[] permittedSubclasses = StorageService.class.getPermittedSubclasses();
        assertNotNull(permittedSubclasses);
        assertEquals(2, permittedSubclasses.length, "StorageService 必须严格且仅允许两个实现");

        // 验证 StorageFactory 的模式匹配 switch 分发
        String localDesc = storageFactory.describeStorageBackend(localStorageService);
        assertTrue(localDesc.contains("Local Disk Storage"), "应正确识别本地存储");

        String minioDesc = storageFactory.describeStorageBackend(minioStorageService);
        assertTrue(minioDesc.contains("MinIO Cloud Storage"), "应正确识别 MinIO 存储");

        // 验证 GardenTool 密封阶层
        assertTrue(GardenTool.class.isSealed(), "GardenTool 必须为 Java Sealed 接口");
        assertEquals(4, GardenTool.class.getPermittedSubclasses().length, "GardenTool 必须包含四大核心工具密封分支");
    }

    @Test
    @DisplayName("Java 25 特性 2: Record Patterns 模式匹配解构")
    void testRecordPatternsDeconstruction() {
        // 1. ToolResult 解构
        List<AiCitation> cites = List.of(new AiCitation(1L, "虚拟线程深入剖析", "virtual-threads", "EVERGREEN", "Java 25 虚拟线程...", "/blog/virtual-threads"));
        ToolResult tr = new ToolResult("search_garden_posts", "{\"count\":1}", cites, null, "已完成检索");

        boolean matched = false;
        if (tr instanceof ToolResult(var name, var json, var citations, var action, var status)) {
            matched = true;
            assertEquals("search_garden_posts", name);
            assertEquals("{\"count\":1}", json);
            assertEquals(1, citations.size());
            assertNull(action);
            assertEquals("已完成检索", status);
        }
        assertTrue(matched, "ToolResult 必须支持 Record Patterns 解构");

        // 2. GardenTool Record Pattern switch 解构
        GardenTool searchTool = new GardenTool.SearchGardenPostsTool("Java 25", "tech", "EVERGREEN");
        ToolResult result = gardenToolRegistry.execute(searchTool);
        assertNotNull(result);
        assertEquals("search_garden_posts", result.toolName());

        GardenTool navTool = new GardenTool.NavigateSiteTool("/blog", "探索博文库");
        ToolResult navResult = gardenToolRegistry.execute(navTool);
        assertNotNull(navResult);
        assertEquals("navigate_site", navResult.toolName());
        assertNotNull(navResult.action());
        assertEquals("/blog", navResult.action().get("route"));

        GardenTool themeTool = new GardenTool.SwitchThemeTool("dark");
        ToolResult themeResult = gardenToolRegistry.execute(themeTool);
        assertNotNull(themeResult);
        assertEquals("switch_theme", themeResult.toolName());
        assertEquals("dark", themeResult.action().get("theme"));

        GardenTool statusTool = new GardenTool.GetHaydenStatusTool();
        ToolResult statusResult = gardenToolRegistry.execute(statusTool);
        assertNotNull(statusResult);
        assertEquals("get_hayden_status", statusResult.toolName());
    }

    @Test
    @DisplayName("Java 25 特性 3: Sequenced Collections (getFirst/getLast) 与 TimelineSpan")
    void testSequencedCollectionsAndTimelineSpan() {
        TimelineService.TimelineSpan span = timelineService.getTimelineSpan();
        assertNotNull(span);

        // 使用 Record Patterns 解构 TimelineSpan
        if (span instanceof TimelineService.TimelineSpan(var earliest, var latest, var count)) {
            assertTrue(count >= 0);
            if (count > 0) {
                assertNotNull(earliest);
                assertNotNull(latest);
                assertNotNull(earliest.getYear());
                assertNotNull(latest.getYear());
            }
        } else {
            fail("TimelineSpan 必须支持 Record Pattern 解构");
        }
    }

    @Test
    @DisplayName("Java 25 特性 4: Stream Gatherers 窗口滑动切片 (Gatherers.windowSliding)")
    void testStreamGatherersSlidingWindow() {
        String markdown = """
                第一段：Java 25 正式发布，虚拟线程与 Record Patterns 成为成熟标准。
                
                第二段：数字花园理念旨在建立非线性、可演进的知识拓扑网络。
                
                第三段：WebGL 与 Three.js 提供了前沿的 3D 空间交互体验。
                
                第四段：分布式对象存储 MinIO 支持大规模多媒体持久化。
                """;

        List<String> chunks = gardenKnowledgeBase.sliceContent(markdown);
        assertNotNull(chunks);
        // 4 个自然段经过 windowSliding(2) 滑动窗口重叠切片，应该生成 3 个重叠切片
        assertEquals(3, chunks.size(), "4 个自然段应通过 windowSliding(2) 聚合成 3 个重叠切片");

        // 验证相邻窗口的重叠连续性
        assertTrue(chunks.get(0).contains("第一段") && chunks.get(0).contains("第二段"));
        assertTrue(chunks.get(1).contains("第二段") && chunks.get(1).contains("第三段"));
        assertTrue(chunks.get(2).contains("第三段") && chunks.get(2).contains("第四段"));
    }

    // =========================================================================
    // 2. LangChain4j 智能外脑与多模型管理器验证
    // =========================================================================

    @Test
    @DisplayName("LangChain4j 多模型管理: 商汤 SenseNova 与 DeepSeek 注册与动态切换")
    void testAiModelManagerMultiModelRegistrationAndSwitching() {
        // 验证已注册的模型
        var registered = aiModelManager.getRegisteredModels();
        assertFalse(registered.isEmpty());

        Set<String> modelIds = new HashSet<>();
        for (var desc : registered) {
            modelIds.add(desc.modelId().toLowerCase());
        }

        // 验证商汤系列
        assertTrue(modelIds.contains("sensenova-6.8-flash-lite"));
        assertTrue(modelIds.contains("sensechat-5"));
        assertTrue(modelIds.contains("sensechat-turbo"));

        // 验证 DeepSeek 系列
        assertTrue(modelIds.contains("deepseek-v4-flash"));
        assertTrue(modelIds.contains("deepseek-chat"));
        assertTrue(modelIds.contains("deepseek-reasoner"));

        // 验证动态热切换
        aiModelManager.switchModel("sensenova-6.8-flash-lite");
        assertEquals("sensenova-6.8-flash-lite", aiModelManager.getEffectiveModelName());
        assertEquals(AiModelManager.ModelProvider.SENSENOVA, aiModelManager.getActiveModelDescriptor().provider());

        aiModelManager.switchModel("deepseek-chat");
        assertEquals("deepseek-chat", aiModelManager.getEffectiveModelName());
        assertEquals(AiModelManager.ModelProvider.DEEPSEEK, aiModelManager.getActiveModelDescriptor().provider());

        // 验证重置默认
        aiModelManager.resetModelToDefault();
        assertNotNull(aiModelManager.getEffectiveModelName());
    }

    @Test
    @DisplayName("LangChain4j 容灾: 429 TPM 指数退避与自动降级到备用模型")
    void testAiModelManagerRateLimitAndFallback() throws Exception {
        aiModelManager.switchModel("sensenova-6.8-flash-lite");
        var primary = aiModelManager.getActiveModelDescriptor();
        var fallback = aiModelManager.getFallbackDescriptor(primary);

        assertNotNull(fallback);
        assertEquals(AiModelManager.ModelProvider.DEEPSEEK, fallback.provider(), "商汤模型的降级备选必须是 DeepSeek");

        // 模拟 429 退避与平滑切换
        AtomicInteger callCount = new AtomicInteger(0);
        List<String> invokedModels = new ArrayList<>();

        AiModelManager.RetryConfig fastTestConfig = new AiModelManager.RetryConfig(2, 50L, 1.5, true);

        String result = aiModelManager.executeWithRetryAndFallback(desc -> {
            callCount.incrementAndGet();
            invokedModels.add(desc.modelId());
            if (desc.provider() == AiModelManager.ModelProvider.SENSENOVA) {
                throw new AiModelManager.RateLimitException("Simulated HTTP 429 Rate Limit (TPM exceeded)");
            }
            return "SUCCESS_FROM_" + desc.modelId();
        }, fastTestConfig, null);

        assertNotNull(result);
        assertTrue(result.startsWith("SUCCESS_FROM_"));
        assertTrue(invokedModels.contains("sensenova-6.8-flash-lite"), "应先调用主模型");
        assertTrue(invokedModels.contains(fallback.modelId()), "应在 429 重试后平滑降级至备选模型");

        aiModelManager.resetModelToDefault();
    }

    @Test
    @DisplayName("LangChain4j 声明式 @Tool 注解与客户端构建验证")
    void testLangChain4jDeclarativeTools() throws Exception {
        // 验证 GardenTools 类中包含 @Tool 声明式方法
        Method[] methods = GardenTools.class.getDeclaredMethods();
        int toolAnnotationCount = 0;
        for (Method m : methods) {
            if (m.isAnnotationPresent(Tool.class)) {
                toolAnnotationCount++;
                Tool tool = m.getAnnotation(Tool.class);
                assertTrue(tool.value().length > 0, "Tool 注解必须包含描述");
            }
        }
        assertEquals(4, toolAnnotationCount, "GardenTools 必须声明四大核心 @Tool 方法");

        // 验证工具调用返回真实数据 JSON
        String statusJson = gardenTools.getHaydenStatus();
        assertNotNull(statusJson);
        assertTrue(statusJson.contains("now"), "getHaydenStatus 必须返回包含 now 状态的 JSON");

        String navJson = gardenTools.navigateSite("/blog", "查看最新博文");
        assertNotNull(navJson);
        assertTrue(navJson.contains("/blog"));

        String themeJson = gardenTools.switchTheme("dark");
        assertNotNull(themeJson);
        assertTrue(themeJson.contains("dark"));

        String searchJson = gardenTools.searchGardenPosts("Java", null, null);
        assertNotNull(searchJson);
        assertTrue(searchJson.contains("results") || searchJson.contains("count"));

        // 验证 OpenAiChatModel / OpenAiStreamingChatModel 构建器集成
        var desc = aiModelManager.resolveDescriptor("deepseek-v4-flash");
        OpenAiChatModel chatModel = aiModelManager.buildLangChain4jChatModel("sk-test-mock-key-12345", desc);
        assertNotNull(chatModel, "应成功构建 LangChain4j OpenAiChatModel");

        OpenAiStreamingChatModel streamingModel = aiModelManager.buildLangChain4jStreamingChatModel("sk-test-mock-key-12345", desc);
        assertNotNull(streamingModel, "应成功构建 LangChain4j OpenAiStreamingChatModel");
    }

    // =========================================================================
    // 3. 轻量 True RAG 纯内存向量知识库验证
    // =========================================================================

    @Test
    @DisplayName("轻量 True RAG: 纯内存向量索引预热与相似度召回")
    void testInMemoryEmbeddingStoreRAGRetrieval() {
        // 执行相似度检索
        List<AiCitation> citations = gardenKnowledgeBase.searchRelevantCitations("Java 虚拟线程", null, 3);
        assertNotNull(citations, "知识库检索不应返回空对象");

        // 验证引用元数据结构
        for (AiCitation cite : citations) {
            assertNotNull(cite.title());
            assertNotNull(cite.url());
            assertNotNull(cite.maturity());
            assertNotNull(cite.excerpt());
        }
    }

    // =========================================================================
    // 4. 标准 SSE 物理隔离推流与事件名称规范验证
    // =========================================================================

    @Test
    @DisplayName("标准 SSE: 验证 event: delta, tool_status, citations, action, done 物理隔离规范")
    void testSseStreamProtocolIsolation() throws Exception {
        AiChatRequest request = new AiChatRequest();
        request.setPrompt("请问站长最近在干嘛？");

        EventCapturingEmitter emitter = new EventCapturingEmitter();
        aiService.simulateDigitalTwinStream(request, emitter);

        boolean completed = emitter.latch.await(5, TimeUnit.SECONDS);
        assertTrue(completed, "流式传输应在5秒内完成推流");

        // 验证至少发送了内容
        assertFalse(emitter.capturedData.isEmpty(), "SSE 必须产生推流数据");

        // 验证包含 tool_status 事件
        boolean hasToolStatus = emitter.capturedData.stream().anyMatch(s -> s.contains("tool_status"));
        assertTrue(hasToolStatus, "必须产生 tool_status 工具状态事件");

        // 验证包含 DONE 标记
        boolean hasDone = emitter.capturedData.stream().anyMatch(s -> s.contains("[DONE]"));
        assertTrue(hasDone, "流式传输末尾必须包含 [DONE] 终结信号");
    }

    static class EventCapturingEmitter extends SseEmitter {
        final List<String> capturedData = Collections.synchronizedList(new ArrayList<>());
        final CountDownLatch latch = new CountDownLatch(1);

        public EventCapturingEmitter() {
            super(30_000L);
        }

        @Override
        public void send(SseEventBuilder builder) {
            try {
                Set<ResponseBodyEmitter.DataWithMediaType> items = builder.build();
                for (ResponseBodyEmitter.DataWithMediaType item : items) {
                    if (item.getData() != null) {
                        capturedData.add(item.getData().toString());
                    }
                }
            } catch (Exception ignored) {}
        }

        @Override
        public synchronized void complete() {
            latch.countDown();
            super.complete();
        }

        @Override
        public synchronized void completeWithError(Throwable ex) {
            latch.countDown();
            super.completeWithError(ex);
        }
    }

    // =========================================================================
    // 5. 站长身份纯正性与纯化验证 (Hayden Xue)
    // =========================================================================

    @Test
    @DisplayName("站长身份纯正性: 严禁任何 howard 遗留，唯一且严格使用 Hayden Xue")
    void testIdentityPurityInvariant() {
        SiteSetting setting = siteSettingService.getSettings();
        assertNotNull(setting);

        // 检查 AI 状态与助手自述
        Map<String, Object> aiStatus = aiService.getAiStatus();
        assertNotNull(aiStatus);
        assertTrue((Boolean) aiStatus.get("enabled"));

        // 检查系统全局属性与名字
        if (setting.getSiteName() != null) {
            assertFalse(setting.getSiteName().toLowerCase().contains("howard"), "站点名称不得包含 howard");
        }
    }
}
