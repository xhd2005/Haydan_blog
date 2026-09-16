package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.dto.FriendApplyRequest;
import com.hayden.blog.dto.FriendStatusUpdateRequest;
import com.hayden.blog.entity.Friend;
import com.hayden.blog.security.JwtTokenProvider;
import com.hayden.blog.service.FriendService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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
public class FriendApplyAndAuditTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FriendService friendService;

    @Autowired
    private com.hayden.blog.service.UserService userService;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        userToken = "Bearer " + jwtTokenProvider.generateToken("reader_friends", "USER");

        try {
            com.hayden.blog.dto.RegisterRequest req = new com.hayden.blog.dto.RegisterRequest();
            req.setUsername("reader_friends");
            req.setPassword("password123");
            req.setNickname("友链测试读者");
            req.setEmail("reader_friends@test.com");
            userService.register(req);
        } catch (Exception ignored) {
        }
    }

    @Test
    @DisplayName("友链公开自助申请：无需登录即可提交申请，初始状态自动为 PENDING 待审核")
    void testPublicFriendApplySuccess() throws Exception {
        FriendApplyRequest applyReq = FriendApplyRequest.builder()
                .name("Geek Pioneer")
                .url("https://geekpioneer.dev")
                .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100")
                .description("Focusing on Java 21, Distributed Systems and Cloud Native.")
                .category("开源先锋")
                .build();

        mockMvc.perform(post("/api/friends/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(applyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.name").value("Geek Pioneer"))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.category").value("开源先锋"))
                .andExpect(jsonPath("$.data.sortOrder").value(999));
    }

    @Test
    @DisplayName("友链申请参数校验：非法 URL 格式被拒绝返回 400")
    void testFriendApplyInvalidUrlRejected() throws Exception {
        FriendApplyRequest badReq = FriendApplyRequest.builder()
                .name("Invalid Site")
                .url("ftp://not-supported.com")
                .description("Invalid protocol")
                .build();

        mockMvc.perform(post("/api/friends/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("友链管理端审核：管理员可审核通过或驳回，普通读者被垂直越权拦截返回 403")
    void testAdminFriendAuditFlow() throws Exception {
        // 1. 先申请一个待审友链
        Friend friend = friendService.applyFriend(FriendApplyRequest.builder()
                .name("Pending Blog")
                .url("https://pending-blog.io")
                .description("Waiting for audit")
                .category("独立博客")
                .build());
        Long friendId = friend.getId();
        assertEquals("PENDING", friend.getStatus());

        // 2. 普通读者尝试审核 -> 403
        FriendStatusUpdateRequest auditReq = FriendStatusUpdateRequest.builder()
                .status("ACTIVE")
                .build();
        mockMvc.perform(put("/api/friends/" + friendId + "/status")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(auditReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 3. 管理员审核通过 -> 200
        mockMvc.perform(put("/api/friends/" + friendId + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(auditReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        Friend updated = friendService.getById(friendId);
        assertEquals("ACTIVE", updated.getStatus());
    }

    @Test
    @DisplayName("朋友圈动态流：公开端点 GET /api/friends/stream 返回聚合动态列表")
    void testGetFriendStream() throws Exception {
        mockMvc.perform(get("/api/friends/stream"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].title").isNotEmpty())
                .andExpect(jsonPath("$.data[0].friendName").isNotEmpty());
    }

    @Test
    @DisplayName("友链在线健康探活：管理员执行探活更新 pingStatus 与响应时延")
    void testFriendPingEndpoint() throws Exception {
        Friend target = friendService.getActiveFriends().getFirst();
        assertNotNull(target);

        mockMvc.perform(post("/api/friends/" + target.getId() + "/ping")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.pingStatus").isNotEmpty())
                .andExpect(jsonPath("$.data.responseTimeMs").isNumber());
    }

    @Test
    @DisplayName("友链智能预检：GET /api/friends/inspect 防范内网 SSRF 探测")
    void testInspectFriendSiteSsrfDefense() throws Exception {
        // 本地回环与内网应被拦截
        mockMvc.perform(get("/api/friends/inspect?url=http://127.0.0.1:8080"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("SSRF")));
    }
}
