package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.dto.CommentCreateRequest;
import com.hayden.blog.dto.RegisterRequest;
import com.hayden.blog.entity.Category;
import com.hayden.blog.entity.Tag;
import com.hayden.blog.security.JwtTokenProvider;
import com.hayden.blog.service.CommentService;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class SecurityAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserService userService;

    @Autowired
    private CommentService commentService;

    private String adminToken;
    private String userToken;
    private String otherUserToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        userToken = "Bearer " + jwtTokenProvider.generateToken("reader_test1", "USER");
        otherUserToken = "Bearer " + jwtTokenProvider.generateToken("reader_test2", "USER");

        // 确保测试读者账号存在于数据库
        try {
            RegisterRequest req1 = new RegisterRequest();
            req1.setUsername("reader_test1");
            req1.setPassword("password123");
            req1.setNickname("测试读者1");
            req1.setEmail("reader1@test.com");
            userService.register(req1);
        } catch (Exception ignored) {
        }

        try {
            RegisterRequest req2 = new RegisterRequest();
            req2.setUsername("reader_test2");
            req2.setPassword("password123");
            req2.setNickname("测试读者2");
            req2.setEmail("reader2@test.com");
            userService.register(req2);
        } catch (Exception ignored) {
        }
    }

    @Test
    @DisplayName("垂直越权防御：未登录访问管理员接口返回 401")
    void testUnauthenticatedAccessAdminEndpoints() throws Exception {
        // 未登录访问仪表盘数据
        mockMvc.perform(get("/api/dashboard/stats"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        // 未登录创建分类
        Category category = Category.builder().name("未授权分类").slug("unauth").build();
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(category)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    @DisplayName("垂直越权防御：普通读者(ROLE_USER)访问管理写接口严格返回 403")
    void testReaderCannotAccessAdminEndpoints() throws Exception {
        // 1. 读者尝试创建文章 -> 403
        mockMvc.perform(post("/api/posts")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"越权文章\",\"slug\":\"hack-post\",\"content\":\"越权\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 2. 读者尝试创建分类 -> 403
        Category category = Category.builder().name("读者分类").slug("reader-cat").build();
        mockMvc.perform(post("/api/categories")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(category)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 3. 读者尝试修改站点设置 -> 403
        mockMvc.perform(put("/api/settings")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"siteName\":\"被黑博客\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 4. 读者尝试查看后台仪表盘统计 -> 403
        mockMvc.perform(get("/api/dashboard/stats")
                        .header("Authorization", userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    @DisplayName("垂直权限校验：管理员(ROLE_ADMIN)正常访问管理接口")
    void testAdminCanAccessAdminEndpoints() throws Exception {
        // 管理员创建标签 -> 200
        Tag tag = Tag.builder().name("SecurityTag").slug("security-tag").build();
        mockMvc.perform(post("/api/tags")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tag)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 管理员访问仪表盘数据 -> 200
        mockMvc.perform(get("/api/dashboard/stats")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("水平越权防御：普通读者不可删除他人评论，返回 403")
    void testHorizontalPrivilegeEscalationCommentDelete() throws Exception {
        // 获取 reader_test1 的 ID
        com.hayden.blog.entity.User user1 = userService.getOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.hayden.blog.entity.User>()
                        .eq(com.hayden.blog.entity.User::getUsername, "reader_test1"));

        // user1 创建一条评论
        CommentCreateRequest commentReq = new CommentCreateRequest();
        commentReq.setTargetType("POST");
        commentReq.setTargetId(1L);
        commentReq.setContent("读者1的原生评论");
        Long commentId = commentService.createComment(commentReq, user1.getId());

        // reader_test2 尝试删除 reader_test1 的评论 -> 必须返回 403
        mockMvc.perform(delete("/api/comments/" + commentId)
                        .header("Authorization", otherUserToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // reader_test1 自身删除自己的评论 -> 成功 200
        mockMvc.perform(delete("/api/comments/" + commentId)
                        .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 重新创建一条评论，由管理员删除 -> 成功 200
        Long commentId2 = commentService.createComment(commentReq, user1.getId());
        mockMvc.perform(delete("/api/comments/" + commentId2)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
