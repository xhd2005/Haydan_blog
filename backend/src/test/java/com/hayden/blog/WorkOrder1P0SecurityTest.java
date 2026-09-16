package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.ai.dto.AiBacklinkSuggestionVO;
import com.hayden.blog.ai.dto.AiEditorAssistRequest;
import com.hayden.blog.ai.dto.AiProviderTestRequest;
import com.hayden.blog.ai.dto.AiStreamTranslateRequest;
import com.hayden.blog.ai.service.AiModelManager;
import com.hayden.blog.dto.SiteSettingUpdateRequest;
import com.hayden.blog.entity.Post;
import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.exception.ResourceNotFoundException;
import com.hayden.blog.security.JwtTokenProvider;
import com.hayden.blog.service.PostService;
import com.hayden.blog.service.SiteSettingService;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class WorkOrder1P0SecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private SiteSettingService siteSettingService;

    @Autowired
    private AiModelManager aiModelManager;

    @Autowired
    private PostService postService;

    @Autowired
    private com.hayden.blog.service.UserService userService;

    private String adminToken;
    private String readerToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        try {
            com.hayden.blog.dto.RegisterRequest reg = new com.hayden.blog.dto.RegisterRequest();
            reg.setUsername("reader_user");
            reg.setPassword("reader123456");
            reg.setNickname("测试读者");
            reg.setEmail("reader@test.com");
            userService.register(reg);
        } catch (Exception ignored) {}
        readerToken = "Bearer " + jwtTokenProvider.generateToken("reader_user", "USER");
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("工单1-1: 公开查询 /api/settings 白名单 DTO 杜绝泄露敏感凭证")
    void testSiteSettingPublicVOProtectsSensitiveCredentials() throws Exception {
        // 管理员写入包含敏感凭据的设置
        SiteSettingUpdateRequest req = new SiteSettingUpdateRequest();
        req.setSiteName("Hayden Xue Personal Blog");
        req.setAiApiKey("sk-sensitive-ai-key-999");
        req.setAiSystemPrompt("Secret internal system prompt instructions");
        req.setAiProvidersJson("[{\"provider\":\"deepseek\",\"apiKey\":\"sk-provider-secret\"}]");
        req.setMinioEndpoint("http://127.0.0.1:9000");
        req.setMinioBucket("hayden-blog");
        req.setMinioAccessKey("super-sensitive-access-key");
        req.setMinioSecretKey("ultra-secret-password-xyz");

        mockMvc.perform(put("/api/settings")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // 1. 匿名用户 GET /api/settings: 敏感凭证全部不存在
        mockMvc.perform(get("/api/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.siteName").value("Hayden Xue Personal Blog"))
                .andExpect(jsonPath("$.data.aiApiKey").doesNotExist())
                .andExpect(jsonPath("$.data.aiSystemPrompt").doesNotExist())
                .andExpect(jsonPath("$.data.aiProvidersJson").doesNotExist())
                .andExpect(jsonPath("$.data.minioAccessKey").doesNotExist())
                .andExpect(jsonPath("$.data.minioSecretKey").doesNotExist());

        // 2. 普通读者 (USER) GET /api/settings: 敏感凭证全部不存在
        mockMvc.perform(get("/api/settings")
                        .header("Authorization", readerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.siteName").value("Hayden Xue Personal Blog"))
                .andExpect(jsonPath("$.data.aiApiKey").doesNotExist())
                .andExpect(jsonPath("$.data.aiSystemPrompt").doesNotExist())
                .andExpect(jsonPath("$.data.aiProvidersJson").doesNotExist())
                .andExpect(jsonPath("$.data.minioAccessKey").doesNotExist())
                .andExpect(jsonPath("$.data.minioSecretKey").doesNotExist());

        // 3. 管理员 GET /api/settings: 完整可见以供后台编辑
        mockMvc.perform(get("/api/settings")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.aiApiKey").value("sk-sensitive-ai-key-999"))
                .andExpect(jsonPath("$.data.aiSystemPrompt").value("Secret internal system prompt instructions"))
                .andExpect(jsonPath("$.data.minioAccessKey").value("super-sensitive-access-key"))
                .andExpect(jsonPath("$.data.minioSecretKey").value("ultra-secret-password-xyz"));
    }

    @Test
    @DisplayName("工单1-2: 消除硬编码生产凭据，无 key 时拒绝发起外部连通性请求")
    void testNoHardcodedKeyInAiModelManager() {
        assertNotEquals("sk-093756b2a2e345a4bd34571cc816b0b9", AiModelManager.DEFAULT_OFFICIAL_DEEPSEEK_KEY);

        // 当未传入 API Key 且 setting 为空时，应当优雅报错而非使用泄露 key
        AiProviderTestRequest req = new AiProviderTestRequest();
        req.setApiKey("");
        req.setBaseUrl("https://api.deepseek.com");

        var response = aiModelManager.testConnectivity(req);
        assertNotNull(response);
        // 如果没有配置环境 key，response 应为 false
        if (System.getenv("DEEPSEEK_API_KEY") == null || System.getenv("DEEPSEEK_API_KEY").isBlank()) {
            assertFalse(response.isSuccess());
        }
    }

    @Test
    @DisplayName("工单1-3: 收敛 AI 连通性测试与写作副驾接口为仅限 ADMIN 访问")
    void testAiEndpointsRestrictedToAdmin() throws Exception {
        AiProviderTestRequest testReq = new AiProviderTestRequest();
        testReq.setBaseUrl("https://api.deepseek.com");

        AiEditorAssistRequest assistReq = new AiEditorAssistRequest();
        assistReq.setAction("expand");
        assistReq.setText("一段待扩写的文字");

        AiStreamTranslateRequest translateReq = new AiStreamTranslateRequest();
        translateReq.setContent("Hello world");
        translateReq.setTargetLang("zh");

        // 1. /api/ai/test-connection 拦截
        mockMvc.perform(post("/api/ai/test-connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testReq)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/ai/test-connection")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testReq)))
                .andExpect(status().isForbidden());

        // 2. /api/ai/editor-assist 拦截
        mockMvc.perform(post("/api/ai/editor-assist")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assistReq)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/ai/editor-assist")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assistReq)))
                .andExpect(status().isForbidden());

        // 3. /api/ai/stream-translate 拦截
        mockMvc.perform(post("/api/ai/stream-translate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(translateReq)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/ai/stream-translate")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(translateReq)))
                .andExpect(status().isForbidden());

        // 4. /api/ai/backlinks/{postId} 拦截
        mockMvc.perform(get("/api/ai/backlinks/1"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/ai/backlinks/1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("工单1-4: 修复 PostServiceImpl 中私有 isAdmin() 的 fail-open 漏洞")
    void testPostServiceImplIsAdminFailClosed() throws Exception {
        // 创建一篇草稿文章 (DRAFT)
        Post draftPost = Post.builder()
                .title("秘密草稿文章 - P0安全检验")
                .slug("secret-draft-test-" + System.currentTimeMillis())
                .content("这是站长的草稿私密内容，未经发布绝不可对外泄露。")
                .status("DRAFT")
                .readingTime(3)
                .viewCount(0)
                .likeCount(0)
                .featured(0)
                .build();
        postService.save(draftPost);

        try {
            // 1. Web 匿名请求（未携带任何 Authorization Header）访问草稿，必须 404
            mockMvc.perform(get("/api/posts/" + draftPost.getSlug()))
                    .andExpect(status().isNotFound());
            mockMvc.perform(get("/api/posts/id/" + draftPost.getId()))
                    .andExpect(status().isNotFound());

            // 2. Web 普通读者请求（携带 readerToken）访问草稿，必须 404
            mockMvc.perform(get("/api/posts/" + draftPost.getSlug())
                            .header("Authorization", readerToken))
                    .andExpect(status().isNotFound());
            mockMvc.perform(get("/api/posts/id/" + draftPost.getId())
                            .header("Authorization", readerToken))
                    .andExpect(status().isNotFound());

            // 3. 显式设置匿名安全上下文调用 Service，严格抛出 ResourceNotFoundException
            SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.AnonymousAuthenticationToken(
                            "key", "anonymousUser", org.springframework.security.core.authority.AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")
                    )
            );
            assertThrows(ResourceNotFoundException.class, () -> {
                postService.getPostBySlug(draftPost.getSlug());
            }, "匿名上下文访问草稿必须抛出 ResourceNotFoundException，严禁 Fail-Open");

            assertThrows(ResourceNotFoundException.class, () -> {
                postService.getPostById(draftPost.getId());
            }, "匿名上下文访问草稿必须抛出 ResourceNotFoundException，严禁 Fail-Open");

            SecurityContextHolder.clearContext();

            // 4. 管理员通过 ID 访问草稿可正常获取
            mockMvc.perform(get("/api/posts/id/" + draftPost.getId())
                            .header("Authorization", adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        } finally {
            // 清理测试数据
            postService.removeById(draftPost.getId());
        }
    }
}
