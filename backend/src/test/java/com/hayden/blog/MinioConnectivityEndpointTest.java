package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.dto.SiteSettingUpdateRequest;
import com.hayden.blog.dto.TestMinioRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class MinioConnectivityEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.hayden.blog.service.UserService userService;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        userToken = "Bearer " + jwtTokenProvider.generateToken("reader_settings", "USER");

        try {
            com.hayden.blog.dto.RegisterRequest req = new com.hayden.blog.dto.RegisterRequest();
            req.setUsername("reader_settings");
            req.setPassword("password123");
            req.setNickname("设置测试读者");
            req.setEmail("reader_settings@test.com");
            userService.register(req);
        } catch (Exception ignored) {
        }
    }

    @Test
    @DisplayName("MinIO 连通性接口：未登录调用 POST /api/settings/test-minio 返回 401")
    void testUnauthenticatedMinioTest() throws Exception {
        mockMvc.perform(post("/api/settings/test-minio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    @DisplayName("MinIO 连通性接口：普通读者调用 POST /api/settings/test-minio 返回 403 垂直越权")
    void testReaderForbiddenMinioTest() throws Exception {
        mockMvc.perform(post("/api/settings/test-minio")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    @DisplayName("MinIO 连通性接口：管理员调用 POST /api/settings/test-minio 诊断连通性并返回耗时与状态")
    void testAdminMinioTestConnectivity() throws Exception {
        TestMinioRequest req = TestMinioRequest.builder()
                .endpoint("http://127.0.0.1:19876")
                .bucket("haydan-blog")
                .accessKey("minioadmin")
                .secretKey("minioadmin")
                .build();

        mockMvc.perform(post("/api/settings/test-minio")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.latencyMs").isNumber())
                .andExpect(jsonPath("$.data.message").isNotEmpty())
                .andExpect(jsonPath("$.data.bucket").value("haydan-blog"));
    }

    @Test
    @DisplayName("系统设置敏感脱敏：普通读者获取设置 minioSecretKey 与 aiApiKey 必须脱敏置空")
    void testMinioSecretKeyDesensitizationForNonAdmin() throws Exception {
        // 先由管理员配置敏感秘钥
        SiteSettingUpdateRequest updateReq = new SiteSettingUpdateRequest();
        updateReq.setStorageType("minio");
        updateReq.setMinioEndpoint("http://oss.example.com:9000");
        updateReq.setMinioBucket("cloud-garden");
        updateReq.setMinioAccessKey("access-xyz");
        updateReq.setMinioSecretKey("super-secret-password-xyz");
        updateReq.setHeroBgType("video");
        updateReq.setHeroVideoUrl("https://cdn.example.com/ambient.mp4");

        mockMvc.perform(put("/api/settings")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk());

        // 读者请求 GET /api/settings
        mockMvc.perform(get("/api/settings")
                        .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.storageType").value("minio"))
                .andExpect(jsonPath("$.data.minioEndpoint").value("http://oss.example.com:9000"))
                .andExpect(jsonPath("$.data.minioBucket").value("cloud-garden"))
                .andExpect(jsonPath("$.data.minioAccessKey").doesNotExist()) // 白名单 DTO 杜绝泄露
                .andExpect(jsonPath("$.data.minioSecretKey").doesNotExist()) // 必须脱敏为 null
                .andExpect(jsonPath("$.data.aiApiKey").doesNotExist())       // 必须脱敏为 null
                .andExpect(jsonPath("$.data.heroBgType").value("video"))
                .andExpect(jsonPath("$.data.heroVideoUrl").value("https://cdn.example.com/ambient.mp4"));

        // 管理员请求 GET /api/settings，秘钥可见
        mockMvc.perform(get("/api/settings")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.minioAccessKey").value("access-xyz"))
                .andExpect(jsonPath("$.data.minioSecretKey").value("super-secret-password-xyz"));
    }
}
