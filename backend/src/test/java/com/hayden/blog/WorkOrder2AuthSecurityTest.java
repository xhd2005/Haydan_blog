package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.dto.LoginRequest;
import com.hayden.blog.dto.RegisterRequest;
import com.hayden.blog.entity.User;
import com.hayden.blog.security.CaptchaService;
import com.hayden.blog.security.JwtTokenProvider;
import com.hayden.blog.security.LoginAttemptService;
import com.hayden.blog.service.UserService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class WorkOrder2AuthSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserService userService;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private CaptchaService captchaService;

    private static final String BANNED_USER = "banned_test_user";
    private static final String ATTACKER_IP = "192.0.2.88";
    private static final String LEGIT_IP = "198.51.100.22";

    @BeforeEach
    void setUp() {
        loginAttemptService.reset(ATTACKER_IP, "admin");
        loginAttemptService.reset(LEGIT_IP, "admin");
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("工单2-1: 修复 JwtAuthenticationFilter 严格校验 isEnabled，阻断被封禁用户越权会话")
    void testBannedUserBlockedByJwtAuthenticationFilter() throws Exception {
        // 1. 创建并注册一个用户
        try {
            RegisterRequest req = new RegisterRequest();
            req.setUsername(BANNED_USER);
            req.setPassword("password123");
            req.setNickname("被封禁测试用户");
            req.setEmail("banned@example.com");
            userService.register(req);
        } catch (Exception ignored) {}

        // 2. 签发该用户的有效 JWT Token
        String validJwt = jwtTokenProvider.generateToken(BANNED_USER, "USER");

        // 3. 将该用户状态修改为 BANNED (封禁)
        User user = userService.getOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                .eq(User::getUsername, BANNED_USER));
        assertNotNull(user);
        user.setStatus("BANNED");
        userService.updateById(user);

        // 4. 使用之前签发的有效 JWT 访问受保护接口 GET /api/auth/me
        // 由于 JwtAuthenticationFilter 校验 userDetails.isEnabled() == false，应阻断认证并返回 401
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + validJwt))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        // 5. 恢复为 ACTIVE 状态后，同一个 Token 应立即可正常访问
        user.setStatus("ACTIVE");
        userService.updateById(user);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + validJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.username").value(BANNED_USER));
    }

    @Test
    @DisplayName("工单2-2: 改造 LoginAttemptService 超管账户防 DoS 死锁保护与人机验证阶梯挑战")
    void testSuperAdminAntiDosLockoutProtection() throws Exception {
        // 模拟攻击者从 ATTACKER_IP 暴力尝试 6 次 admin 错误密码
        LoginRequest wrongReq = new LoginRequest();
        wrongReq.setUsername("admin");
        wrongReq.setPassword("wrong-password-999");

        for (int i = 1; i <= 6; i++) {
            if (i >= 3) {
                // 进入人机验证阶梯挑战
                String cKey = "attacker-key-" + i;
                captchaService.storeCaptchaForTest(cKey, "TEST");
                wrongReq.setCaptchaKey(cKey);
                wrongReq.setCaptchaCode("TEST");
            }
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", ATTACKER_IP)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(wrongReq)));
        }

        // 攻击者 IP 达到 5 次上限，必须被锁定 (HTTP 429)
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", ATTACKER_IP)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429));

        // 关键断言：admin 超管账号本身绝不能被锁定导致 DoS 死锁！
        // 真实站长从合法 IP (LEGIT_IP) 发起登录校验
        assertDoesNotThrow(() -> {
            loginAttemptService.checkLocked(LEGIT_IP, "admin");
        }, "超管账号在遭遇暴力爆破后绝不能被全账号 429 锁定");

        // 此时 admin 账号由于失败计数累计，触发阶梯挑战 (isCaptchaRequired == true)
        assertTrue(loginAttemptService.isCaptchaRequired(LEGIT_IP, "admin"), "超管账号应触发人机验证阶梯挑战");

        // 站长提供正确的凭证与验证码
        String legitCaptchaKey = "legit-admin-key";
        captchaService.storeCaptchaForTest(legitCaptchaKey, "PASS");

        LoginRequest legitReq = new LoginRequest();
        legitReq.setUsername("admin");
        legitReq.setPassword("admin123");
        legitReq.setCaptchaKey(legitCaptchaKey);
        legitReq.setCaptchaCode("PASS");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", LEGIT_IP)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(legitReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.username").value("admin"));
    }

    @Test
    @DisplayName("工单2-3: 修复全站 X-Frame-Options 禁用问题，恢复 Clickjacking 防护")
    void testClickjackingProtectionWithSameOriginFrameOptions() throws Exception {
        // 请求公开接口，断言响应头包含 X-Frame-Options: SAMEORIGIN
        mockMvc.perform(get("/api/settings"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"));

        mockMvc.perform(get("/api/posts"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"));
    }
}
