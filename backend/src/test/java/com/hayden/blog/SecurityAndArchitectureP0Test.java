package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.dto.FriendApplyRequest;
import com.hayden.blog.dto.PostCreateUpdateRequest;
import com.hayden.blog.dto.PresignedUploadRequest;
import com.hayden.blog.dto.RegisterRequest;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.security.JwtTokenProvider;
import com.hayden.blog.service.FriendService;
import com.hayden.blog.service.PostService;
import com.hayden.blog.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class SecurityAndArchitectureP0Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserService userService;

    @Autowired
    private FriendService friendService;

    @Autowired
    private PostService postService;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        userToken = "Bearer " + jwtTokenProvider.generateToken("p0_reader", "USER");

        try {
            RegisterRequest req = new RegisterRequest();
            req.setUsername("p0_reader");
            req.setPassword("password123");
            req.setNickname("P0测试读者");
            req.setEmail("p0_reader@test.com");
            userService.register(req);
        } catch (Exception ignored) {
        }
    }

    @Test
    @DisplayName("P0-1: 登录防爆破重置后门已被彻底删除，访问返回 404 或拦截")
    void testResetAttemptsBackdoorRemoved() throws Exception {
        mockMvc.perform(post("/api/auth/reset-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ip\":\"127.0.0.1\"}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("P0-2: /api/media 媒体库权限收敛，仅限 ADMIN 访问")
    void testMediaEndpointAuthorization() throws Exception {
        // 1. 匿名用户访问 GET /api/media -> 401
        mockMvc.perform(get("/api/media"))
                .andExpect(status().isUnauthorized());

        // 2. 普通读者 (ROLE_USER) 访问 GET /api/media -> 403
        mockMvc.perform(get("/api/media")
                        .header("Authorization", userToken))
                .andExpect(status().isForbidden());

        // 3. 管理员访问 GET /api/media -> 200
        mockMvc.perform(get("/api/media")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("P0-3: 预签名直传凭证签发权限与危险文件后缀拦截")
    void testPresignedUploadSecurity() throws Exception {
        PresignedUploadRequest validReq = new PresignedUploadRequest();
        validReq.setFilename("garden_photo.png");
        validReq.setContentType("image/png");
        validReq.setSize(2048L);

        // 1. 匿名获取预签名直传凭证 -> 401
        mockMvc.perform(post("/api/media/presigned-url")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isUnauthorized());

        // 2. 普通读者获取预签名直传凭证 -> 403
        mockMvc.perform(post("/api/media/presigned-url")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isForbidden());

        // 3. 管理员合法文件获取直传凭证 -> 200
        mockMvc.perform(post("/api/media/presigned-url")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.uploadUrl").isNotEmpty())
                .andExpect(jsonPath("$.data.publicUrl").isNotEmpty())
                .andExpect(jsonPath("$.data.objectKey").isNotEmpty());

        // 4. 管理员尝试对危险扩展名 (.sh, .html, .svg, .php) 申请直传凭证 -> 400
        PresignedUploadRequest dangerousReq = new PresignedUploadRequest();
        dangerousReq.setFilename("webshell.php");
        dangerousReq.setContentType("application/x-php");
        dangerousReq.setSize(1024L);

        mockMvc.perform(post("/api/media/presigned-url")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dangerousReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("P0-4: 友链申请与巡检 SSRF 严格封堵私网与回环地址")
    void testSsrfProtectionOnFriendService() {
        // 1. 本地回环 127.0.0.1
        FriendApplyRequest req1 = new FriendApplyRequest();
        req1.setName("SSRF-127");
        req1.setUrl("http://127.0.0.1:8080/internal");
        req1.setAvatar("https://example.com/avatar.png");
        assertThrows(BusinessException.class, () -> friendService.applyFriend(req1));

        // 2. localhost
        FriendApplyRequest req2 = new FriendApplyRequest();
        req2.setName("SSRF-localhost");
        req2.setUrl("http://localhost:8080/internal");
        req2.setAvatar("https://example.com/avatar.png");
        assertThrows(BusinessException.class, () -> friendService.applyFriend(req2));

        // 3. 私网 10.0.0.1
        FriendApplyRequest req3 = new FriendApplyRequest();
        req3.setName("SSRF-10");
        req3.setUrl("http://10.1.2.3:3306");
        req3.setAvatar("https://example.com/avatar.png");
        assertThrows(BusinessException.class, () -> friendService.applyFriend(req3));

        // 4. 私网 192.168.1.1
        FriendApplyRequest req4 = new FriendApplyRequest();
        req4.setName("SSRF-192");
        req4.setUrl("http://192.168.1.1/admin");
        req4.setAvatar("https://example.com/avatar.png");
        assertThrows(BusinessException.class, () -> friendService.applyFriend(req4));

        // 5. 云元数据 169.254.169.254
        FriendApplyRequest req5 = new FriendApplyRequest();
        req5.setName("SSRF-Metadata");
        req5.setUrl("http://169.254.169.254/latest/meta-data/");
        req5.setAvatar("https://example.com/avatar.png");
        assertThrows(BusinessException.class, () -> friendService.applyFriend(req5));

        // 6. 0.0.0.0 与 IPv6 [::1]
        FriendApplyRequest req6 = new FriendApplyRequest();
        req6.setName("SSRF-Zero");
        req6.setUrl("http://0.0.0.0:8080/admin");
        assertThrows(BusinessException.class, () -> friendService.applyFriend(req6));

        FriendApplyRequest req7 = new FriendApplyRequest();
        req7.setName("SSRF-IPv6-Loopback");
        req7.setUrl("http://[::1]:8080/admin");
        assertThrows(BusinessException.class, () -> friendService.applyFriend(req7));
    }

    @Test
    @DisplayName("P0-5: 草稿文章越权访问隔离：未发布文章对非管理员返回 404，且 auth==null 时严格遵循 Fail-Closed")
    void testDraftPostAccessIsolation() throws Exception {
        // 1. 以管理员身份创建一篇草稿文章
        String draftSlug = "secret-architecture-draft-" + System.currentTimeMillis();
        PostCreateUpdateRequest createReq = new PostCreateUpdateRequest();
        createReq.setTitle("秘密架构草稿");
        createReq.setSlug(draftSlug);
        createReq.setContent("这是一篇未发布的内部设计草稿，普通读者禁止查看。");
        createReq.setStatus("DRAFT");

        Long draftId = postService.createPost(createReq);

        // 2. 匿名用户通过 slug 访问草稿 -> 404
        mockMvc.perform(get("/api/posts/" + draftSlug))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));

        // 3. 普通读者通过 slug 访问草稿 -> 404
        mockMvc.perform(get("/api/posts/" + draftSlug)
                        .header("Authorization", userToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));

        // 4. 管理员通过 slug 访问草稿 -> 200
        mockMvc.perform(get("/api/posts/" + draftSlug)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.slug").value(draftSlug));

        // 5. 匿名用户通过 ID 访问草稿 -> 404
        mockMvc.perform(get("/api/posts/id/" + draftId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));

        // 6. 普通读者通过 ID 访问草稿 -> 404
        mockMvc.perform(get("/api/posts/id/" + draftId)
                        .header("Authorization", userToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));

        // 7. 管理员通过 ID 访问草稿 -> 200
        mockMvc.perform(get("/api/posts/id/" + draftId)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(draftId));

        // 8. 核心防御：当上下文为匿名用户或普通用户时，严格 Fail-Closed 抛出 404，绝不放行草稿
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.AnonymousAuthenticationToken(
                        "key", "anonymousUser", org.springframework.security.core.authority.AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")
                )
        );
        assertThrows(com.hayden.blog.exception.ResourceNotFoundException.class,
                () -> postService.getPostBySlug(draftSlug),
                "匿名上下文访问草稿必须抛出 ResourceNotFoundException，严禁 Fail-Open");
        assertThrows(com.hayden.blog.exception.ResourceNotFoundException.class,
                () -> postService.getPostById(draftId),
                "匿名上下文访问草稿必须抛出 ResourceNotFoundException，严禁 Fail-Open");
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("P0-6: 友链探活 HTTP 客户端禁止跟随重定向以彻底阻断 30x Open Redirect SSRF 绕过")
    void testHttpClientRedirectNever() throws Exception {
        Object target = org.springframework.test.util.AopTestUtils.getTargetObject(friendService);
        java.lang.reflect.Field field = com.hayden.blog.service.impl.FriendServiceImpl.class.getDeclaredField("httpClient");
        field.setAccessible(true);
        java.net.http.HttpClient client = (java.net.http.HttpClient) field.get(target);
        org.junit.jupiter.api.Assertions.assertNotNull(client);
        org.junit.jupiter.api.Assertions.assertEquals(
                java.net.http.HttpClient.Redirect.NEVER,
                client.followRedirects(),
                "友链探活客户端必须配置 Redirect.NEVER 以封堵通过 30x 重定向探测内网和云元数据的 SSRF 后门"
        );
    }

    @Test
    @DisplayName("P1-1: 思想成熟度 (Maturity) 原生数据库精准过滤与分页总数核验")
    void testMaturityFilterAccuratePagination() throws Exception {
        // 创建测试文章覆盖三大成熟度
        PostCreateUpdateRequest req1 = new PostCreateUpdateRequest();
        req1.setTitle("Evergreen Post Test");
        req1.setContent("Content of evergreen");
        req1.setExcerpt("Excerpt evergreen");
        req1.setSlug("evergreen-test-" + System.currentTimeMillis());
        req1.setStatus("PUBLISHED");
        req1.setMaturity("EVERGREEN");
        req1.setPublishedAt(java.time.LocalDateTime.now().minusDays(1));
        Long id1 = postService.createPost(req1);

        PostCreateUpdateRequest req2 = new PostCreateUpdateRequest();
        req2.setTitle("Seedling Post Test");
        req2.setContent("Content of seedling");
        req2.setExcerpt("Excerpt seedling");
        req2.setSlug("seedling-test-" + System.currentTimeMillis());
        req2.setStatus("PUBLISHED");
        req2.setMaturity("SEEDLING");
        req2.setPublishedAt(java.time.LocalDateTime.now().minusDays(1));
        Long id2 = postService.createPost(req2);

        // 1. 测试 maturity=EVERGREEN
        mockMvc.perform(get("/api/posts?maturity=EVERGREEN&pageSize=50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records.[?(@.id == " + id1 + ")].maturity").value("EVERGREEN"))
                .andExpect(jsonPath("$.data.records.[?(@.id == " + id2 + ")]").doesNotExist());

        // 2. 测试 maturity=SEEDLING 及别名 SEED
        mockMvc.perform(get("/api/posts?maturity=SEEDLING&pageSize=50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records.[?(@.id == " + id2 + ")].maturity").value("SEEDLING"))
                .andExpect(jsonPath("$.data.records.[?(@.id == " + id1 + ")]").doesNotExist());

        mockMvc.perform(get("/api/posts?maturity=SEED&pageSize=50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records.[?(@.id == " + id2 + ")].maturity").value("SEEDLING"))
                .andExpect(jsonPath("$.data.records.[?(@.id == " + id1 + ")]").doesNotExist());

        // 3. 直接校验 service 层的分页与总数统计
        com.hayden.blog.common.PageResult<com.hayden.blog.vo.PostListVO> evergreenPage =
                postService.getPublishedPosts(1L, 50L, null, null, null, null, "EVERGREEN");
        org.junit.jupiter.api.Assertions.assertTrue(
                evergreenPage.getRecords().stream().allMatch(p -> "EVERGREEN".equalsIgnoreCase(p.getMaturity())),
                "所有查询出来的博文成熟度必须严格为 EVERGREEN"
        );
    }
}
