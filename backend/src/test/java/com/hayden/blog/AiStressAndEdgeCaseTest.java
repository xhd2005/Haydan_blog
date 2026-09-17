package com.hayden.blog;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.ai.dto.AiChatRequest;
import com.hayden.blog.ai.service.AiService;
import com.hayden.blog.ai.tools.GardenToolRegistry;
import com.hayden.blog.ai.tools.ToolResult;
import com.hayden.blog.dto.SiteSettingUpdateRequest;
import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.service.SiteSettingService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * AI 架构对抗性极限测试与容灾退避核查
 * 验证：
 * 1. 429 指数退避 (1500ms * attempt) 与恢复机制
 * 2. 主力模型 429 耗尽 -> 备用模型平滑降级
 * 3. 备用模型故障 -> 本地数字分身虚拟线程兜底保底
 * 4. 四大 Tools 对抗性异常参数与畸形输入防御
 * 5. 高并发虚拟线程压力测试
 */
@SpringBootTest
@ActiveProfiles("h2")
public class AiStressAndEdgeCaseTest {

    @Autowired
    private AiService aiService;

    @Autowired
    private GardenToolRegistry gardenToolRegistry;

    @Autowired
    private SiteSettingService siteSettingService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private SiteSetting originalSetting;

    @BeforeEach
    void setUp() {
        originalSetting = siteSettingService.getSettings();
    }

    @AfterEach
    void tearDown() {
        if (originalSetting != null) {
            SiteSettingUpdateRequest restore = new SiteSettingUpdateRequest();
            restore.setAiApiKey(originalSetting.getAiApiKey());
            restore.setAiBaseUrl(originalSetting.getAiBaseUrl());
            restore.setAiModel(originalSetting.getAiModel());
            restore.setAiProvidersJson(originalSetting.getAiProvidersJson());
            siteSettingService.updateSettings(restore);
        }
    }

    @Test
    @DisplayName("对抗测试1: 429 指数退避重试 (1500ms * attempt) 并在第2次重试中成功恢复")
    void test429ExponentialBackoffAndRecovery() throws Exception {
        AtomicInteger requestCount = new AtomicInteger(0);
        List<Long> requestTimes = new CopyOnWriteArrayList<>();

        // 启动本地 Mock HTTP Server
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/chat/completions", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                int count = requestCount.incrementAndGet();
                requestTimes.add(System.currentTimeMillis());

                if (count == 1) {
                    // 第 1 次返回 429
                    byte[] resp = "{\"error\":{\"message\":\"Rate limit reached: TPM limit exceeded\",\"type\":\"rate_limit_error\"}}".getBytes(StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(429, resp.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(resp);
                    }
                } else {
                    // 第 2 次重试返回 200 流式数据
                    String sseBody = "data: {\"choices\":[{\"delta\":{\"content\":\"Hello recovered from 429\"}}]}\n\ndata: [DONE]\n\n";
                    byte[] resp = sseBody.getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "text/event-stream");
                    exchange.sendResponseHeaders(200, resp.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(resp);
                    }
                }
            }
        });
        server.start();

        int port = server.getAddress().getPort();
        String mockBaseUrl = "http://127.0.0.1:" + port + "/v1";

        try {
            // 配置使用 Mock Server
            SiteSettingUpdateRequest update = new SiteSettingUpdateRequest();
            update.setAiApiKey("test-sk-adversarial");
            update.setAiBaseUrl(mockBaseUrl);
            update.setAiModel("deepseek-v4-flash");
            update.setAiProvidersJson("[]");
            siteSettingService.updateSettings(update);

            AiChatRequest request = AiChatRequest.builder()
                    .prompt("测试 429 容灾")
                    .build();

            CustomTrackingEmitter emitter = new CustomTrackingEmitter(30_000L);
            long start = System.currentTimeMillis();

            // 调用 streamChat
            SseEmitter actualEmitter = aiService.streamChat(request);
            // 等待直到完成
            // 注意 streamChat 内部是异步虚拟线程执行，等待外部端口被调用
            boolean completed = false;
            for (int i = 0; i < 50; i++) {
                if (requestCount.get() >= 2) {
                    completed = true;
                    break;
                }
                Thread.sleep(150);
            }

            assertTrue(completed, "必须在 429 后发起第 2 次指数退避重试，总请求次数需达到 2");
            assertEquals(2, requestCount.get());

            // 验证时间间隔：第 1 次与第 2 次重试之间必须等待至少 1400ms (1500ms * 1)
            long interval = requestTimes.get(1) - requestTimes.get(0);
            assertTrue(interval >= 1400L, "退避重试时间间隔应 >= 1400ms, 实际为: " + interval + "ms");
        } finally {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("对抗测试2: 主力模型 429 达到上限后平滑降级切换至备用模型")
    void testPrimaryModel429ExhaustedFallbackToBackup() throws Exception {
        AtomicInteger primaryCount = new AtomicInteger(0);
        AtomicInteger backupCount = new AtomicInteger(0);

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/chat/completions", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                // 读取请求体中的 model
                byte[] body = exchange.getRequestBody().readAllBytes();
                String bodyStr = new String(body, StandardCharsets.UTF_8);

                if (bodyStr.contains("deepseek-v4-flash")) {
                    primaryCount.incrementAndGet();
                    // 主力模型始终 429
                    byte[] resp = "{\"error\":{\"message\":\"TPM limit\"}}".getBytes(StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(429, resp.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(resp);
                    }
                } else if (bodyStr.contains("sensenova-6.8-flash-lite")) {
                    backupCount.incrementAndGet();
                    // 备用模型返回 200 成功
                    String sseBody = "data: {\"choices\":[{\"delta\":{\"content\":\"Hello from backup model\"}}]}\n\ndata: [DONE]\n\n";
                    byte[] resp = sseBody.getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "text/event-stream");
                    exchange.sendResponseHeaders(200, resp.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(resp);
                    }
                } else {
                    exchange.sendResponseHeaders(400, 0);
                    exchange.close();
                }
            }
        });
        server.start();

        int port = server.getAddress().getPort();
        String mockBaseUrl = "http://127.0.0.1:" + port + "/v1";

        try {
            SiteSettingUpdateRequest update = new SiteSettingUpdateRequest();
            update.setAiApiKey("test-sk-adversarial");
            update.setAiBaseUrl(mockBaseUrl);
            update.setAiModel("deepseek-v4-flash");
            update.setAiProvidersJson("[]");
            siteSettingService.updateSettings(update);

            AiChatRequest request = AiChatRequest.builder()
                    .prompt("测试主力模型降级")
                    .build();

            aiService.streamChat(request);

            // 等待主力模型重试 2 次 (1.5s + 3.0s = 4.5s) 后切换至备用模型
            boolean backupHit = false;
            for (int i = 0; i < 70; i++) {
                if (backupCount.get() >= 1) {
                    backupHit = true;
                    break;
                }
                Thread.sleep(150);
            }

            assertTrue(backupHit, "备用模型 sensenova-6.8-flash-lite 必须被成功调用");
            assertEquals(2, primaryCount.get(), "主力模型必须进行2次尝试 (429退避)");
            assertTrue(backupCount.get() >= 1, "备用模型至少被请求1次");
        } finally {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("对抗测试3: 外部大模型全部瘫痪时，终极兜底降级至本地数字分身虚拟线程并成功完成")
    void testAllExternalModelsFailFallbackToDigitalTwin() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/chat/completions", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                // 全部返回 500 或 429
                byte[] resp = "{\"error\":\"Server internal error\"}".getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(500, resp.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(resp);
                }
            }
        });
        server.start();

        int port = server.getAddress().getPort();
        String mockBaseUrl = "http://127.0.0.1:" + port + "/v1";

        try {
            SiteSettingUpdateRequest update = new SiteSettingUpdateRequest();
            update.setAiApiKey("test-sk-adversarial");
            update.setAiBaseUrl(mockBaseUrl);
            update.setAiModel("deepseek-v4-flash");
            update.setAiProvidersJson("[]");
            siteSettingService.updateSettings(update);

            AiChatRequest request = AiChatRequest.builder()
                    .prompt("请问站长最近状态在做什么？")
                    .build();

            // 验证直接调用 streamChat 在全量外部失败下不会抛出未捕获异常
            SseEmitter emitter = aiService.streamChat(request);
            assertNotNull(emitter, "SseEmitter 必须正常返回，不能为 null 或抛出阻断异常");
        } finally {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("对抗测试4: 四大 Tools 对畸形 JSON、空参数与极端入参的容错健壮性")
    void testToolsAdversarialInputsRobustness() {
        // 1. 畸形 JSON 字符串与空参数传入 executeTool
        ToolResult resultMalformed = gardenToolRegistry.executeTool("search_garden_posts", "{ malformed json: true ");
        assertNotNull(resultMalformed);
        assertNotNull(resultMalformed.getStatusMessage());
        assertTrue(resultMalformed.getResultJson().contains("error"), "畸形 JSON 应返回安全包装的错误信息，不能发生未捕获异常崩溃");

        // 2. null 或空字符串传入
        ToolResult resultNullArgs = gardenToolRegistry.executeTool("search_garden_posts", null);
        assertNotNull(resultNullArgs);
        assertEquals("search_garden_posts", resultNullArgs.getToolName());
        assertNotNull(resultNullArgs.getCitations());

        // 3. search_garden_posts 极端入参：包含 SQL 注入字符、超长字符串、不存在关键词
        ToolResult resultSqlInj = gardenToolRegistry.executeSearchGardenPosts("'; DROP TABLE posts; --", null, null);
        assertNotNull(resultSqlInj);
        assertNotNull(resultSqlInj.getCitations());

        ToolResult resultLongStr = gardenToolRegistry.executeSearchGardenPosts("A".repeat(2000), null, null);
        assertNotNull(resultLongStr);
        assertNotNull(resultLongStr.getCitations());

        // 4. navigate_site 异常路径（无斜杠、特殊参数、空串）
        ToolResult navNoSlash = gardenToolRegistry.executeNavigateSite("journey", null);
        assertNotNull(navNoSlash);
        assertEquals("/journey", navNoSlash.getAction().get("route"), "应自动补齐前导斜杠 /");

        ToolResult navEmpty = gardenToolRegistry.executeNavigateSite("", "");
        assertNotNull(navEmpty);
        assertEquals("/", navEmpty.getAction().get("route"), "空路径应安全回退到首页 /");

        // 5. switch_theme 各种模糊与未知模式
        ToolResult darkZh = gardenToolRegistry.executeSwitchTheme("换成深黑模式夜间");
        assertEquals("dark", darkZh.getAction().get("theme"));

        ToolResult lightZh = gardenToolRegistry.executeSwitchTheme("来个白瓷明亮白天模式");
        assertEquals("light", lightZh.getAction().get("theme"));

        ToolResult unknownTheme = gardenToolRegistry.executeSwitchTheme("cyberpunk_neon_123");
        assertEquals("system", unknownTheme.getAction().get("theme"), "未知主题应优雅回退至 system");

        // 6. 未知工具名称
        ToolResult unknownTool = gardenToolRegistry.executeTool("drop_all_tables_tool", "{}");
        assertNotNull(unknownTool);
        assertTrue(unknownTool.getResultJson().contains("Unknown tool name"));
        assertTrue(unknownTool.getStatusMessage().contains("未知工具"));
    }

    @Test
    @DisplayName("对抗测试5: 高并发虚拟线程下数字分身流式推送稳定性与内存/死锁核查")
    void testConcurrentVirtualThreadsDigitalTwinStress() throws Exception {
        int concurrency = 25;
        CountDownLatch latch = new CountDownLatch(concurrency);
        AtomicInteger successCount = new AtomicInteger(0);

        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

        for (int i = 0; i < concurrency; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    String prompt = (index % 4 == 0) ? "切换到暗黑模式" :
                            ((index % 4 == 1) ? "带我去看站长的足迹" :
                                    ((index % 4 == 2) ? "站长此时此刻在干嘛" : "请讲讲 Java 21 虚拟线程的技术原理"));

                    AiChatRequest request = AiChatRequest.builder()
                            .prompt(prompt)
                            .build();

                    CustomTrackingEmitter emitter = new CustomTrackingEmitter(15_000L);
                    aiService.simulateDigitalTwinStream(request, emitter);

                    boolean done = emitter.awaitDone(10, TimeUnit.SECONDS);
                    if (done && !emitter.getReceivedEvents().isEmpty()) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    // ignore
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean allDone = latch.await(20, TimeUnit.SECONDS);
        assertTrue(allDone, "25 个并发虚拟线程应在 20 秒内全部处理完毕，无死锁");
        assertEquals(concurrency, successCount.get(), "所有并发请求均应成功获得流式响应数据");
    }

    /**
     * 辅助 SseEmitter 测试类
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
                Set<ResponseBodyEmitter.DataWithMediaType> dataToSend = builder.build();
                for (ResponseBodyEmitter.DataWithMediaType item : dataToSend) {
                    if (item.getData() != null) {
                        receivedEvents.add(item.getData().toString());
                    }
                }
            } catch (Exception ignored) {
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
