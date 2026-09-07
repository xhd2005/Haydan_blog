package com.howard.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.howard.blog.common.Result;
import com.howard.blog.dto.PostCreateUpdateRequest;
import com.howard.blog.entity.Post;
import com.howard.blog.exception.BusinessException;
import com.howard.blog.security.JwtTokenProvider;
import com.howard.blog.service.PostService;
import com.howard.blog.vo.PostDetailVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class BilingualPostAssociationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PostService postService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private com.howard.blog.service.UserService userService;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        try {
            com.howard.blog.dto.RegisterRequest reg = new com.howard.blog.dto.RegisterRequest();
            reg.setUsername("reader_bilingual");
            reg.setPassword("password123");
            reg.setNickname("普通读者");
            reg.setEmail("reader_bilingual@test.com");
            userService.register(reg);
        } catch (Exception ignored) {
        }
        userToken = "Bearer " + jwtTokenProvider.generateToken("reader_bilingual", "USER");
    }

    @Test
    @DisplayName("测试一键从中文文章派生英文译文草稿及双向绑定建立")
    void testDeriveTranslationFromChineseToEnglish() {
        // 1. 创建一篇中文源文章
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        PostCreateUpdateRequest req = new PostCreateUpdateRequest();
        req.setTitle("深入理解微服务架构 " + uniqueSuffix);
        req.setSlug("microservices-in-depth-" + uniqueSuffix);
        req.setExcerpt("微服务架构的核心设计模式与实践经验总结");
        req.setContent("# 微服务架构\n\n服务拆分、服务发现与熔断限流的最佳实践...");
        req.setCover("https://images.unsplash.com/photo-1518770660439-4636190af475");
        req.setLang("zh");
        req.setStatus("PUBLISHED");
        req.setReadingTime(5);
        req.setTagIds(List.of(1L, 2L));

        Long sourceId = postService.createPost(req);
        assertNotNull(sourceId);

        // 2. 调用一键派生
        PostDetailVO derivedVO = postService.deriveTranslation(sourceId);
        assertNotNull(derivedVO);
        assertNotNull(derivedVO.getId());

        // 3. 验证派生文章属性
        assertEquals("en", derivedVO.getLang(), "派生文章的语言应自动反转为 en");
        assertEquals("DRAFT", derivedVO.getStatus(), "派生文章的状态必须强制为 DRAFT 草稿");
        assertTrue(derivedVO.getSlug().endsWith("-en"), "英文译文 Slug 应以 -en 结尾");
        assertEquals(req.getExcerpt(), derivedVO.getExcerpt(), "摘要应继承源文章");
        assertEquals(req.getContent(), derivedVO.getContent(), "正文内容应继承源文章");
        assertEquals(req.getCover(), derivedVO.getCover(), "封面图应继承源文章");
        assertEquals(sourceId, derivedVO.getTranslationPostId(), "派生文章的 translationPostId 应指向源文章 ID");

        // 4. 验证双向绑定互联
        Post updatedSource = postService.getPostById(sourceId);
        assertEquals(derivedVO.getId(), updatedSource.getTranslationPostId(), "源文章的 translationPostId 应被原子写回更新为新派生文章 ID");

        // 5. 验证详情查询中关联译文信息的装配
        PostDetailVO sourceDetail = postService.getPostBySlug(updatedSource.getSlug());
        assertEquals(derivedVO.getId(), sourceDetail.getTranslationPostId());
        assertEquals(derivedVO.getSlug(), sourceDetail.getTranslationPostSlug());
        assertEquals("en", sourceDetail.getTranslationPostLang());
        assertNotNull(sourceDetail.getTranslationPost());
        assertEquals(derivedVO.getId(), sourceDetail.getTranslationPost().getId());
        assertEquals("DRAFT", sourceDetail.getTranslationPost().getStatus());
    }

    @Test
    @DisplayName("测试一键从英文文章反向派生中文译文及 Slug 后缀智能处理")
    void testDeriveTranslationFromEnglishToChinese() {
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        PostCreateUpdateRequest req = new PostCreateUpdateRequest();
        req.setTitle("Mastering Spring Boot 3 " + uniqueSuffix);
        req.setSlug("mastering-spring-boot-3-" + uniqueSuffix + "-en");
        req.setExcerpt("Comprehensive guide to Spring Boot 3");
        req.setContent("Explore the new features of Spring Boot 3 and Java 21...");
        req.setLang("en");
        req.setStatus("PUBLISHED");
        req.setReadingTime(6);

        Long sourceId = postService.createPost(req);
        assertNotNull(sourceId);

        // 派生中文版
        PostDetailVO derivedVO = postService.deriveTranslation(sourceId);
        assertNotNull(derivedVO);

        assertEquals("zh", derivedVO.getLang(), "语言应反转为 zh");
        assertEquals("DRAFT", derivedVO.getStatus(), "状态应为 DRAFT");
        // 原 Slug 结尾为 -en，反向派生应智能剥离尾部 -en
        assertFalse(derivedVO.getSlug().endsWith("-en"), "中文版 Slug 不应再带有 -en 后缀");
        assertEquals(sourceId, derivedVO.getTranslationPostId());

        Post updatedSource = postService.getPostById(sourceId);
        assertEquals(derivedVO.getId(), updatedSource.getTranslationPostId());
    }

    @Test
    @DisplayName("测试防重复派生校验：已绑定译文的文章不可再次派生")
    void testPreventDuplicateDerivation() {
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        PostCreateUpdateRequest req = new PostCreateUpdateRequest();
        req.setTitle("防重复派生测试 " + uniqueSuffix);
        req.setSlug("duplicate-test-" + uniqueSuffix);
        req.setContent("Content...");
        req.setLang("zh");

        Long sourceId = postService.createPost(req);
        postService.deriveTranslation(sourceId);

        // 再次派生应抛出 409 业务异常
        BusinessException ex = assertThrows(BusinessException.class, () -> {
            postService.deriveTranslation(sourceId);
        });
        assertEquals(409, ex.getCode());
        assertTrue(ex.getMessage().contains("已存在关联译文"));
    }

    @Test
    @DisplayName("测试删除文章时对端关联自动解绑置空（级联解除悬空指针）")
    void testCascadeUnbindOnPostDeletion() {
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        PostCreateUpdateRequest req = new PostCreateUpdateRequest();
        req.setTitle("级联解绑测试源文章 " + uniqueSuffix);
        req.setSlug("cascade-unbind-" + uniqueSuffix);
        req.setContent("Content...");
        req.setLang("zh");

        Long sourceId = postService.createPost(req);
        PostDetailVO derivedVO = postService.deriveTranslation(sourceId);
        Long derivedId = derivedVO.getId();

        // 确认此时双向绑定已建立
        assertEquals(derivedId, postService.getPostById(sourceId).getTranslationPostId());
        assertEquals(sourceId, postService.getPostById(derivedId).getTranslationPostId());

        // 删除源文章
        postService.deletePost(sourceId);

        // 验证源文章已不存在
        assertThrows(BusinessException.class, () -> postService.getPostById(sourceId));

        // 验证派生文章依然存在，且其 translationPostId 自动置为 NULL，无脏悬挂外键
        Post remainPost = postService.getPostById(derivedId);
        assertNotNull(remainPost);
        assertNull(remainPost.getTranslationPostId(), "删除源文章后，对端文章的 translationPostId 必须自动置空为 null");
    }

    @Test
    @DisplayName("测试手动更新文章支持改绑与解绑双向互联")
    void testManualUpdateAndUnbindTranslation() {
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        // 创建文章 A 和文章 B
        PostCreateUpdateRequest reqA = new PostCreateUpdateRequest();
        reqA.setTitle("文章 A " + uniqueSuffix);
        reqA.setSlug("post-a-" + uniqueSuffix);
        reqA.setContent("Content A");
        reqA.setLang("zh");
        Long idA = postService.createPost(reqA);

        PostCreateUpdateRequest reqB = new PostCreateUpdateRequest();
        reqB.setTitle("文章 B " + uniqueSuffix);
        reqB.setSlug("post-b-" + uniqueSuffix);
        reqB.setContent("Content B");
        reqB.setLang("en");
        Long idB = postService.createPost(reqB);

        // 1. 手动将 A 绑定到 B
        PostCreateUpdateRequest updateA = new PostCreateUpdateRequest();
        updateA.setTitle("文章 A " + uniqueSuffix);
        updateA.setSlug("post-a-" + uniqueSuffix);
        updateA.setContent("Content A");
        updateA.setTranslationPostId(idB);
        postService.updatePost(idA, updateA);

        // 验证双向绑定
        assertEquals(idB, postService.getPostById(idA).getTranslationPostId());
        assertEquals(idA, postService.getPostById(idB).getTranslationPostId());

        // 2. 手动将 A 解绑（传 null）
        PostCreateUpdateRequest unbindA = new PostCreateUpdateRequest();
        unbindA.setTitle("文章 A " + uniqueSuffix);
        unbindA.setSlug("post-a-" + uniqueSuffix);
        unbindA.setContent("Content A");
        unbindA.setTranslationPostId(null);
        postService.updatePost(idA, unbindA);

        // 验证双方 translationPostId 均变为空
        assertNull(postService.getPostById(idA).getTranslationPostId());
        assertNull(postService.getPostById(idB).getTranslationPostId());
    }

    @Test
    @DisplayName("测试派生译文 HTTP 端点权限控制与响应")
    void testDeriveTranslationEndpointSecurity() throws Exception {
        // 创建一篇待派生的文章
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        PostCreateUpdateRequest req = new PostCreateUpdateRequest();
        req.setTitle("端点测试文章 " + uniqueSuffix);
        req.setSlug("endpoint-test-" + uniqueSuffix);
        req.setContent("Content...");
        req.setLang("zh");
        Long postId = postService.createPost(req);

        // 1. 未登录访问 -> 401
        mockMvc.perform(post("/api/posts/" + postId + "/derive-translation"))
                .andExpect(status().isUnauthorized());

        // 2. 普通读者账号访问 -> 403 Forbidden
        mockMvc.perform(post("/api/posts/" + postId + "/derive-translation")
                        .header("Authorization", userToken))
                .andExpect(status().isForbidden());

        // 3. 管理员访问 -> 200 OK 且返回派生文章详情
        mockMvc.perform(post("/api/posts/" + postId + "/derive-translation")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.lang").value("en"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.translationPostId").value(postId));
    }
}
