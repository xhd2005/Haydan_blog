package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.dto.NowUpdateRequest;
import com.hayden.blog.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@org.springframework.test.annotation.DirtiesContext
public class NowRecordMindstreamTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.hayden.blog.service.UserService userService;

    @Autowired
    private com.hayden.blog.service.NowService nowService;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        userToken = "Bearer " + jwtTokenProvider.generateToken("reader_now", "USER");

        try {
            com.hayden.blog.dto.RegisterRequest req = new com.hayden.blog.dto.RegisterRequest();
            req.setUsername("reader_now");
            req.setPassword("password123");
            req.setNickname("手记测试读者");
            req.setEmail("reader_now@test.com");
            userService.register(req);
        } catch (Exception ignored) {
        }
    }

    @Test
    @DisplayName("Now 页面生活心智流：公开接口 GET /api/now 返回攻坚专题、经典在读、驻留城市与近期微日志")
    void testGetNowMindstream() throws Exception {
        mockMvc.perform(get("/api/now"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.currentCity").value("杭州 · 滨江"))
                .andExpect(jsonPath("$.data.focusTopicsJson").isNotEmpty())
                .andExpect(jsonPath("$.data.readingNotesJson").isNotEmpty())
                .andExpect(jsonPath("$.data.microLogsJson").isNotEmpty())
                .andExpect(jsonPath("$.data.learning").isNotEmpty())
                .andExpect(jsonPath("$.data.building").isNotEmpty());
    }

    @Test
    @DisplayName("Now 页面生活心智流：管理员成功更新结构化手记，读者调用返回 403 垂直越权")
    void testUpdateNowMindstream() throws Exception {
        NowUpdateRequest req = new NowUpdateRequest();
        req.setCurrentCity("东京 · 涩谷");
        req.setFocusTopicsJson("[{\"title\":\"Three.js 4.0 空间飞渡运镜\",\"progress\":100,\"badge\":\"视觉跃升\"}]");
        req.setReadingNotesJson("[{\"title\":\"Clean Architecture\",\"author\":\"Robert C. Martin\"}]");
        req.setMicroLogsJson("[{\"date\":\"2026-09-08\",\"content\":\"全栈测试套件100%跑通\"}]");

        // 读者越权更新 -> 403
        mockMvc.perform(put("/api/now")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 管理员更新 -> 200
        mockMvc.perform(put("/api/now")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 验证持久化
        mockMvc.perform(get("/api/now"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentCity").value("东京 · 涩谷"))
                .andExpect(jsonPath("$.data.focusTopicsJson").value("[{\"title\":\"Three.js 4.0 空间飞渡运镜\",\"progress\":100,\"badge\":\"视觉跃升\"}]"));
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        if (nowService != null) {
            NowUpdateRequest reset = new NowUpdateRequest();
            reset.setCurrentCity("杭州 · 滨江");
            reset.setFocusTopicsJson("[{\"title\":\"Project Loom 虚拟线程并发实战\",\"progress\":90,\"badge\":\"核心演进\",\"tags\":[\"Java 21\",\"Concurrency\"]},{\"title\":\"Next.js 14 现代响应式空间美学\",\"progress\":95,\"badge\":\"前端重构\",\"tags\":[\"Next.js\",\"Three.js\"]},{\"title\":\"商汤日日新 / DeepSeek AI 智能体体系\",\"progress\":80,\"badge\":\"智能伴读\",\"tags\":[\"Agent\",\"LLM\"]}]");
            reset.setReadingNotesJson("[{\"title\":\"Designing Data-Intensive Applications\",\"author\":\"Martin Kleppmann\",\"cover\":\"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&fit=crop\",\"quote\":\"可靠性、可扩展性与可维护性是支撑数字系统的三大基石。\",\"note\":\"精读第5章分布式复制与一致性模型\"},{\"title\":\"Building Microservices (2nd Edition)\",\"author\":\"Sam Newman\",\"cover\":\"https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&fit=crop\",\"quote\":\"服务解耦与自治性决定了分布式架构的演进上限。\",\"note\":\"研读微服务拆分与演进模式\"}]");
            reset.setMicroLogsJson("[{\"date\":\"2026-09-08\",\"content\":\"完成 MinIO 云存储与虚拟线程架构升级，博客数字花园性能大幅跃升。\"},{\"date\":\"2026-09-06\",\"content\":\"重构 Now 页面，引入生活心智流与经典书摘。\"}]");
            reset.setLearning("- 深入学习 Java 21 虚拟线程 (Virtual Threads) 高并发实践\n- 研读智能体协调框架与 Multi-Agent 架构设计\n- 探索现代 Web 端 Shiki 代码渲染与暗色排版细节");
            reset.setBuilding("- 打造全新的个人博客与数字花园系统 (Hayden Xue Personal Blog V2.0)\n- 搭建前后端分离的现代化个人数字资产中枢");
            reset.setExploring("- 城市徒步与建筑摄影 (Street & Architecture Photography)\n- 下一代 Generative UI 与响应式流式交互范式");
            reset.setThinking("- 个人数字花园如何成为长效的心智外脑，而非转瞬即逝的碎片化社交信息？\n- 在大模型时代，软件工程师的核心壁垒正在向何处迁移？");
            nowService.updateNow(reset);
        }
    }
}
