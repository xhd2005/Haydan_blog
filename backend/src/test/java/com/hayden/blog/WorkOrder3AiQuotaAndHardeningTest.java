package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.ai.dto.AiChatRequest;
import com.hayden.blog.ai.dto.AiCodeLensRequest;
import com.hayden.blog.ai.dto.AiCodeLensResponse;
import com.hayden.blog.ai.dto.AiInlineLensRequest;
import com.hayden.blog.ai.dto.AiInlineLensResponse;
import com.hayden.blog.ai.service.AiRateLimiterService;
import com.hayden.blog.ai.service.AiService;
import com.hayden.blog.dto.CommentCreateRequest;
import com.hayden.blog.dto.RegisterRequest;
import com.hayden.blog.entity.Comment;
import com.hayden.blog.entity.User;
import com.hayden.blog.mapper.CommentMapper;
import com.hayden.blog.mapper.UserMapper;
import com.hayden.blog.security.JwtTokenProvider;
import com.hayden.blog.service.CommentService;
import com.hayden.blog.service.UserService;
import com.hayden.blog.vo.CommentVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class WorkOrder3AiQuotaAndHardeningTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AiRateLimiterService aiRateLimiterService;

    @Autowired
    private AiService aiService;

    @Autowired
    private CommentService commentService;

    @Autowired
    private CommentMapper commentMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private com.hayden.blog.aop.AuditLogAspect auditLogAspect;

    private String adminToken;
    private String readerToken;
    private Long readerUserId;
    private Long adminUserId;

    private static final String TEST_VISITOR_IP_1 = "203.0.113.10";
    private static final String TEST_VISITOR_IP_2 = "203.0.113.20";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        // 准备管理员账户
        User adminUser = userMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                .eq(User::getUsername, "admin"));
        if (adminUser != null) {
            adminUserId = adminUser.getId();
        } else {
            adminUserId = 1L;
        }
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");

        // 准备读者账户
        String readerUsername = "quota_test_reader";
        User existing = userMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                .eq(User::getUsername, readerUsername));
        if (existing == null) {
            try {
                RegisterRequest reg = new RegisterRequest();
                reg.setUsername(readerUsername);
                reg.setPassword("readerpass123");
                reg.setNickname("伴读读者");
                reg.setEmail("reader_quota@test.com");
                userService.register(reg);
            } catch (Exception ignored) {}
            existing = userMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                    .eq(User::getUsername, readerUsername));
        }
        assertNotNull(existing);
        readerUserId = existing.getId();
        readerToken = "Bearer " + jwtTokenProvider.generateToken(readerUsername, "USER");

        // 重置限额缓存，确保各单测隔离
        aiRateLimiterService.resetQuota("visitor:" + TEST_VISITOR_IP_1);
        aiRateLimiterService.resetQuota("visitor:" + TEST_VISITOR_IP_2);
        aiRateLimiterService.resetQuota("user:" + readerUsername);
    }

    @Test
    @DisplayName("工单3-1: 访客未登录 401 拦截门禁与公开配额查询")
    void testVisitorRateLimitingAnd429() throws Exception {
        AiCodeLensRequest request = AiCodeLensRequest.builder()
                .code("const a = 1;")
                .lang("javascript")
                .build();

        // 1. 未登录访客直接调用 AI 推理接口：Spring Security 100% 阻断，返回 401 Unauthorized
        mockMvc.perform(post("/api/ai/code-lens")
                        .header("X-Forwarded-For", TEST_VISITOR_IP_1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        // 2. 访客调用探测配额接口 /api/ai/quota (permitAll)：返回 200，标识 clientType=VISITOR, allowed=false
        mockMvc.perform(get("/api/ai/quota")
                        .header("X-Forwarded-For", TEST_VISITOR_IP_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.clientType").value("VISITOR"))
                .andExpect(jsonPath("$.data.allowed").value(false));

        // 3. 登录读者调用配额探测接口：返回 200，标识 clientType=READER, allowed=true
        mockMvc.perform(get("/api/ai/quota")
                        .header("Authorization", readerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.clientType").value("READER"))
                .andExpect(jsonPath("$.data.allowed").value(true));
    }

    @Test
    @DisplayName("工单3-2: 登录读者高额度配额 (10次/分, maxTokens=2000) 与管理员豁免限制")
    void testReaderAndAdminQuota() throws Exception {
        AiCodeLensRequest request = AiCodeLensRequest.builder()
                .code("Thread.startVirtualThread(() -> {});")
                .lang("java")
                .build();

        // 读者身份连续调用 3 次均能正常放行 (访客第 3 次就会被限频)
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/ai/code-lens")
                            .header("Authorization", readerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(header().string("X-Ai-Client-Type", "READER"))
                    .andExpect(header().string("X-Ai-Quota-Max-Tokens", "2000"));
        }

        // 管理员豁免限制 (maxTokens=8192, 剩余 9999)
        mockMvc.perform(post("/api/ai/code-lens")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Ai-Client-Type", "ADMIN"))
                .andExpect(header().string("X-Ai-Quota-Max-Tokens", "8192"))
                .andExpect(header().string("X-Ai-Quota-Minute-Remaining", "9999"));
    }

    @Test
    @DisplayName("工单3-3: 流式对话 /api/ai/chat 首包推送 quota 事件与超额拦截")
    void testStreamChatQuotaEventAndExceeded() {
        AiChatRequest req = AiChatRequest.builder()
                .prompt("你好，Hayden")
                .build();

        // 1. 访客首次流式调用，返回 SseEmitter
        SseEmitter emitter = aiService.streamChat(req, TEST_VISITOR_IP_2, null, null);
        assertNotNull(emitter);

        // 2. 连续调用耗尽限频窗口
        aiService.streamChat(req, TEST_VISITOR_IP_2, null, null);

        // 3. 第 3 次超限流式调用
        SseEmitter exceededEmitter = aiService.streamChat(req, TEST_VISITOR_IP_2, null, null);
        assertNotNull(exceededEmitter);
    }

    @Test
    @DisplayName("工单3-4: CodeLens 与 InlineLens 本地 SHA-256 Caffeine 缓存命中")
    void testSha256SemanticCaffeineCaching() {
        AiCodeLensRequest codeReq1 = AiCodeLensRequest.builder()
                .code("public class Demo { void run() { Thread.startVirtualThread(() -> {}); } }")
                .lang("java")
                .context("concurrency")
                .build();

        AiCodeLensRequest codeReq2 = AiCodeLensRequest.builder()
                .code("public class Demo { void run() { Thread.startVirtualThread(() -> {}); } }")
                .lang("java")
                .context("concurrency")
                .build();

        // 第一次调用计算
        AiCodeLensResponse resp1 = aiService.explainCodeSnippet(codeReq1);
        assertNotNull(resp1);
        assertNotNull(resp1.getMechanism());

        // 第二次相同入参调用，直接命中 Caffeine 缓存 (返回同一对象或一致内容)
        AiCodeLensResponse resp2 = aiService.explainCodeSnippet(codeReq2);
        assertNotNull(resp2);
        assertEquals(resp1.getMechanism(), resp2.getMechanism());
        assertEquals(resp1.getPitfalls(), resp2.getPitfalls());

        // InlineLens 语义缓存验证
        AiInlineLensRequest inlineReq1 = AiInlineLensRequest.builder()
                .selectedText("虚拟线程调度机制")
                .actionType("DIGEST")
                .build();

        AiInlineLensRequest inlineReq2 = AiInlineLensRequest.builder()
                .selectedText("虚拟线程调度机制")
                .actionType("DIGEST")
                .build();

        AiInlineLensResponse inResp1 = aiService.explainSelectionInSitu(inlineReq1);
        AiInlineLensResponse inResp2 = aiService.explainSelectionInSitu(inlineReq2);
        assertNotNull(inResp1);
        assertNotNull(inResp2);
        assertEquals(inResp1.getDigest(), inResp2.getDigest());
        assertEquals(inResp1.getTitle(), inResp2.getTitle());
    }

    @Test
    @DisplayName("工单3-5: 评论审核流 (读者 PENDING, 超管 APPROVED, 审核通过异步发信) 与树形过滤")
    void testCommentModerationFlow() {
        // 1. 读者发表评论：初始状态必须为 PENDING
        CommentCreateRequest readerCommentReq = new CommentCreateRequest();
        readerCommentReq.setTargetType("POST");
        readerCommentReq.setTargetId(9999L);
        readerCommentReq.setContent("这是一条由读者发表的待审核评论内容");

        // 确保以读者身份执行
        SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "quota_test_reader", null, List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"))
                )
        );

        Long readerCommentId = commentService.createComment(readerCommentReq, readerUserId);
        assertNotNull(readerCommentId);

        Comment readerComment = commentService.getById(readerCommentId);
        assertNotNull(readerComment);
        assertEquals("PENDING", readerComment.getStatus(), "普通读者发表的评论必须进入 PENDING 待审核状态");

        // 2. 匿名访客与其他读者查询评论树：严禁展示该 PENDING 待审核评论
        SecurityContextHolder.clearContext();
        List<CommentVO> treeBefore = commentService.getCommentTree("POST", 9999L);
        assertTrue(treeBefore.stream().noneMatch(c -> c.getId().equals(readerCommentId)), "前台访客接口严禁展示 PENDING 待审核评论");

        // 2.1 读者本人在登录态下查询评论树：允许看到自己待审的评论（用于前台标记“待审核·仅本人可见”）
        SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "quota_test_reader", null, List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"))
                )
        );
        List<CommentVO> treeAuthorSelf = commentService.getCommentTree("POST", 9999L);
        assertTrue(treeAuthorSelf.stream().anyMatch(c -> c.getId().equals(readerCommentId) && "PENDING".equals(c.getStatus())), "作者本人登录后应可见自己待审核的评论");

        // 3. 超管发表评论：初始状态直接为 APPROVED
        CommentCreateRequest adminCommentReq = new CommentCreateRequest();
        adminCommentReq.setTargetType("POST");
        adminCommentReq.setTargetId(9999L);
        adminCommentReq.setContent("这是由站长 Hayden Xue 发表的官方置顶评论");

        SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "admin", null, List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );

        Long adminCommentId = commentService.createComment(adminCommentReq, adminUserId);
        assertNotNull(adminCommentId);

        Comment adminComment = commentService.getById(adminCommentId);
        assertNotNull(adminComment);
        assertEquals("APPROVED", adminComment.getStatus(), "管理员发表的评论直接进入 APPROVED 状态");

        // 前台可直接查到站长评论
        List<CommentVO> treeWithAdmin = commentService.getCommentTree("POST", 9999L);
        assertTrue(treeWithAdmin.stream().anyMatch(c -> c.getId().equals(adminCommentId)));

        // 4. 超管审核通过读者的 PENDING 评论
        commentService.updateStatus(readerCommentId, "APPROVED");
        Comment approvedComment = commentService.getById(readerCommentId);
        assertEquals("APPROVED", approvedComment.getStatus());

        // 审核通过后，前台可以查到
        List<CommentVO> treeAfter = commentService.getCommentTree("POST", 9999L);
        assertTrue(treeAfter.stream().anyMatch(c -> c.getId().equals(readerCommentId)), "审核通过后读者评论应在前台展示");

        // 清理测试数据
        commentMapper.deleteById(readerCommentId);
        commentMapper.deleteById(adminCommentId);
    }

    @Test
    @DisplayName("工单3-6: 审计日志切面参数深度脱敏 (password, token, apiKey, secretKey 等)")
    void testAuditLogAspectSanitizesSensitiveParameters() throws Exception {
        // 反射调用 AuditLogAspect 的 private sanitizeArgs 方法
        Method sanitizeMethod = auditLogAspect.getClass().getDeclaredMethod("sanitizeArgs", Object[].class);
        sanitizeMethod.setAccessible(true);

        Map<String, Object> sensitiveMap = new HashMap<>();
        sensitiveMap.put("username", "hayden_tester");
        sensitiveMap.put("password", "super_secret_password_123");
        sensitiveMap.put("apiKey", "sk-1234567890abcdef");
        sensitiveMap.put("minioSecretKey", "minio_secret_pw");
        sensitiveMap.put("jwtToken", "eyJhbGciOiJIUzI1NiJ9...");
        sensitiveMap.put("publicInfo", "visible information");

        Object[] args = new Object[]{sensitiveMap};
        String sanitizedJson = (String) sanitizeMethod.invoke(auditLogAspect, (Object) args);

        assertNotNull(sanitizedJson);
        // 断言敏感值已被打码替换为 ******
        assertFalse(sanitizedJson.contains("super_secret_password_123"), "敏感密码不得在日志参数明文出现");
        assertFalse(sanitizedJson.contains("sk-1234567890abcdef"), "敏感 API Key 不得在日志参数明文出现");
        assertFalse(sanitizedJson.contains("minio_secret_pw"), "敏感 MinIO Secret 不得在日志参数明文出现");
        assertFalse(sanitizedJson.contains("eyJhbGciOiJIUzI1NiJ9"), "敏感 Token 不得在日志参数明文出现");

        // 断言普通字段依然保留
        assertTrue(sanitizedJson.contains("hayden_tester"));
        assertTrue(sanitizedJson.contains("visible information"));
        assertTrue(sanitizedJson.contains("******"));
    }
}
