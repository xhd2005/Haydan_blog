package com.howard.blog;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.howard.blog.dto.LoginRequest;
import com.howard.blog.security.CaptchaService;
import com.howard.blog.security.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class LoginRateLimitTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private CaptchaService captchaService;

    private static final String TEST_IP = "10.0.0.99";
    private static final String TEST_USER = "brute_force_user";

    @BeforeEach
    void setUp() {
        loginAttemptService.reset(TEST_IP, TEST_USER);
        loginAttemptService.reset("127.0.0.1", "admin");
    }

    @Test
    @DisplayName("获取验证码接口 GET /api/auth/captcha 正常响应")
    void testGetCaptcha() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/captcha"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.captchaKey").isNotEmpty())
                .andExpect(jsonPath("$.data.captchaImage").isNotEmpty())
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(responseJson);
        String captchaKey = node.get("data").get("captchaKey").asText();
        String captchaImage = node.get("data").get("captchaImage").asText();

        assertNotNull(captchaKey);
        assertTrue(captchaImage.startsWith("data:image/png;base64,"));
    }

    @Test
    @DisplayName("防暴力破解：连续 5 次错误密码触发 15 分钟锁定 (HTTP 429)")
    void testBruteForceLockoutAfterFiveFailures() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername(TEST_USER);
        req.setPassword("wrong-pwd");

        // 第 1 次与第 2 次：401
        for (int i = 1; i <= 2; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", TEST_IP)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value(401));
        }

        // 第 3 次与第 4 次：进入防刷阈值，提供合法验证码模拟连续密码输错
        for (int i = 3; i <= 4; i++) {
            String cKey = "key-" + i;
            captchaService.storeCaptchaForTest(cKey, "TEST");
            req.setCaptchaKey(cKey);
            req.setCaptchaCode("TEST");

            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", TEST_IP)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value(401));
        }

        // 第 5 次输错：刚好达到 5 次，立即锁定并返回 HTTP 429
        String cKey5 = "key-5";
        captchaService.storeCaptchaForTest(cKey5, "TEST");
        req.setCaptchaKey(cKey5);
        req.setCaptchaCode("TEST");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", TEST_IP)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429));

        // 第 6 次在锁定冷却期内尝试（哪怕密码正确）：直接在第一道防线拦截，返回 HTTP 429
        LoginRequest correctReq = new LoginRequest();
        correctReq.setUsername(TEST_USER);
        correctReq.setPassword("correct-pwd");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", TEST_IP)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correctReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429));
    }

    @Test
    @DisplayName("登录成功后立即清空失败计数")
    void testLoginSuccessClearsAttempts() throws Exception {
        LoginRequest wrongReq = new LoginRequest();
        wrongReq.setUsername("admin");
        wrongReq.setPassword("wrong-admin-pass");

        // 输错 2 次
        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", "127.0.0.1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(wrongReq)))
                    .andExpect(status().isUnauthorized());
        }

        assertEquals(2, loginAttemptService.getFailedAttempts("127.0.0.1", "admin"));

        // 使用正确密码登录成功
        LoginRequest rightReq = new LoginRequest();
        rightReq.setUsername("admin");
        rightReq.setPassword("admin123");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "127.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rightReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 验证失败计数已重置为 0
        assertEquals(0, loginAttemptService.getFailedAttempts("127.0.0.1", "admin"));
    }

    @Test
    @DisplayName("验证码校验：错误或伪造验证码被拦截返回 400")
    void testInvalidCaptchaRejected() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("admin");
        req.setPassword("admin123");
        req.setCaptchaKey("fake-key");
        req.setCaptchaCode("0000");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "127.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }
}
