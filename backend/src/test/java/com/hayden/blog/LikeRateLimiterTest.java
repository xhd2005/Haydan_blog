package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.dto.LikeToggleRequest;
import com.hayden.blog.service.LikeRateLimiterService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class LikeRateLimiterTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LikeRateLimiterService likeRateLimiterService;

    @Test
    @DisplayName("游客对同一实体3秒内快速连击触发429防抖拦截")
    void testGuestDebounceRateLimit() throws Exception {
        LikeToggleRequest req = new LikeToggleRequest();
        req.setTargetType("POST");
        req.setTargetId(1L);

        String testIp = "192.168.10.88";

        // 第一次点赞成功
        mockMvc.perform(post("/api/likes/toggle")
                        .header("X-Forwarded-For", testIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 立即发起第二次点赞（未过 3 秒防抖窗口），应触发 429 频控异常
        mockMvc.perform(post("/api/likes/toggle")
                        .header("X-Forwarded-For", testIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(jsonPath("$.code").value(429));
    }

    @Test
    @DisplayName("游客一分钟内超过30次全局点赞触发限流")
    void testGuestGlobalRateLimit() {
        String testIp = "192.168.10.99";

        // 模拟连续点赞不同实体，绕过单实体防抖，检测全局计数器
        for (int i = 1; i <= 30; i++) {
            likeRateLimiterService.checkGuestLikeRateLimit(testIp, "POST", (long) i);
        }

        // 第31次应抛出 429 业务异常
        assertThrows(com.hayden.blog.exception.BusinessException.class, () -> {
            likeRateLimiterService.checkGuestLikeRateLimit(testIp, "POST", 999L);
        });
    }
}
