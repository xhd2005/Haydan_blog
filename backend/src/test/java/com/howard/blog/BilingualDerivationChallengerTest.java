package com.howard.blog;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.howard.blog.dto.PostCreateUpdateRequest;
import com.howard.blog.entity.Post;
import com.howard.blog.exception.BusinessException;
import com.howard.blog.security.JwtTokenProvider;
import com.howard.blog.service.PostService;
import com.howard.blog.vo.PostDetailVO;
import lombok.extern.slf4j.Slf4j;
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

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 挑战者实证测试：针对后端双语关联与一键派生系统的代码级对抗性质疑与逆向压力验证套件
 * 涵盖：
 * 1. Slug 循环防碰撞高压分配测试；
 * 2. 边界条件拒绝（源文章不存在、已有关联译文、悬挂指针自愈）；
 * 3. 删除双向解绑与防脏指针完整性；
 * 4. 高并发派生竞态冲突实测；
 * 5. 鉴权与垂直越权矩阵防御验证（401/403/405）。
 */
@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class BilingualDerivationChallengerTest {

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
    private String readerToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        try {
            com.howard.blog.dto.RegisterRequest reg = new com.howard.blog.dto.RegisterRequest();
            reg.setUsername("challenger_reader");
            reg.setPassword("readerpass123");
            reg.setNickname("普通挑战者读者");
            reg.setEmail("challenger_reader@test.com");
            userService.register(reg);
        } catch (Exception ignored) {
        }
        readerToken = "Bearer " + jwtTokenProvider.generateToken("challenger_reader", "USER");
    }

    // =========================================================================
    // 1. Slug 碰撞对抗与循环递增分配压力测试
    // =========================================================================

    @Test
    @DisplayName("【对抗实测1.1】中文转英文 Slug 密集占用场景：预置 base-en 到 base-en-15，验证自动分配 base-en-16 且无死循环/唯一约束异常")
    void testSlugCollisionSequentialDedupStress() {
        String baseName = "quantum-algo-" + System.currentTimeMillis();
        
        // 创建中文源文章，Slug 为 quantum-algo-xxx
        PostCreateUpdateRequest sourceReq = new PostCreateUpdateRequest();
        sourceReq.setTitle("量子算法研究 " + baseName);
        sourceReq.setSlug(baseName);
        sourceReq.setContent("量子叠加与纠缠算法详解");
        sourceReq.setLang("zh");
        Long sourceId = postService.createPost(sourceReq);
        assertNotNull(sourceId);

        // 恶意或偶然场景：预先占用 candidateSlug: base-en 以及 base-en-2 ~ base-en-15
        String expectedBase = baseName + "-en";
        // 插入 expectedBase
        Post post0 = Post.builder().title("Dummy en 0").slug(expectedBase).content("dummy").lang("en").status("PUBLISHED").build();
        postService.save(post0);

        for (int i = 2; i <= 15; i++) {
            Post dummy = Post.builder().title("Dummy en " + i).slug(expectedBase + "-" + i).content("dummy").lang("en").status("PUBLISHED").build();
            postService.save(dummy);
        }

        // 执行派生，验证循环防碰撞能否正确突破至 base-en-16
        PostDetailVO derived = postService.deriveTranslation(sourceId);
        assertNotNull(derived);
        assertEquals(expectedBase + "-16", derived.getSlug(), "当 base-en 到 base-en-15 均被占用时，系统必须自动递增分配 base-en-16");
        assertEquals(sourceId, derived.getTranslationPostId());

        // 验证数据库真实落盘
        Post savedDerived = postService.getById(derived.getId());
        assertEquals(expectedBase + "-16", savedDerived.getSlug());
    }

    @Test
    @DisplayName("【对抗实测1.2】英文反向派生中文 Slug 剥离与冲突场景：剥离 -en 后已存在同名文章，验证自动追加 -2 分配")
    void testSlugReverseDerivationConflict() {
        String baseName = "distributed-consensus-" + System.currentTimeMillis();

        // 预先存在一篇已存在的中文文章 distributed-consensus-xxx
        Post existingZh = Post.builder().title("分布式共识已有中文版").slug(baseName).content("已有正文").lang("zh").status("PUBLISHED").build();
        postService.save(existingZh);

        // 创建一篇英文文章 distributed-consensus-xxx-en
        PostCreateUpdateRequest enReq = new PostCreateUpdateRequest();
        enReq.setTitle("Distributed Consensus " + baseName);
        enReq.setSlug(baseName + "-en");
        enReq.setContent("Raft and Paxos comparison");
        enReq.setLang("en");
        Long enId = postService.createPost(enReq);

        // 派生中文版：原 Slug 剥离 -en 后为 baseName，但 baseName 已被 existingZh 占用！
        PostDetailVO derivedZh = postService.deriveTranslation(enId);
        assertNotNull(derivedZh);
        assertEquals("zh", derivedZh.getLang());
        assertEquals(baseName + "-2", derivedZh.getSlug(), "剥离 -en 后检测到 baseName 冲突，必须自动递增分配 baseName-2");
        assertEquals(enId, derivedZh.getTranslationPostId());
    }

    // =========================================================================
    // 2. 边界拒绝与自愈测试（源文章不存在、已有关联译文、脏指针自愈）
    // =========================================================================

    @Test
    @DisplayName("【对抗实测2.1】源文章不存在（超大正数与负数ID）时，业务层与HTTP层100%拒绝并返回404")
    void testDeriveNonExistentPostRejection() throws Exception {
        Long nonExistentId = 888888888L;

        // 1. Service 层调用实证
        BusinessException ex = assertThrows(BusinessException.class, () -> postService.deriveTranslation(nonExistentId));
        assertEquals(404, ex.getCode());
        assertTrue(ex.getMessage().contains("源文章不存在"));

        // 2. HTTP Controller 层实证 (使用管理员令牌)
        mockMvc.perform(post("/api/posts/" + nonExistentId + "/derive-translation")
                        .header("Authorization", adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("源文章不存在")));

        // 3. 负数非法 ID
        mockMvc.perform(post("/api/posts/-1/derive-translation")
                        .header("Authorization", adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @DisplayName("【对抗实测2.2】源文章已存在有效译文绑定时，禁止重复派生，明确返回409 Conflict")
    void testDeriveAlreadyBoundPostRejection() throws Exception {
        String baseName = "bound-test-" + System.currentTimeMillis();
        PostCreateUpdateRequest req = new PostCreateUpdateRequest();
        req.setTitle("已绑定测试 " + baseName);
        req.setSlug(baseName);
        req.setContent("Content");
        req.setLang("zh");
        Long sourceId = postService.createPost(req);

        // 第一次派生 -> 成功
        PostDetailVO firstDerived = postService.deriveTranslation(sourceId);
        assertNotNull(firstDerived);

        // 第二次派生源文章 -> 必须抛出 409
        BusinessException ex = assertThrows(BusinessException.class, () -> postService.deriveTranslation(sourceId));
        assertEquals(409, ex.getCode());
        assertTrue(ex.getMessage().contains("已存在关联译文，不可重复派生"));

        // 对派生出来的目标文章尝试反向派生 -> 也必须抛出 409
        BusinessException ex2 = assertThrows(BusinessException.class, () -> postService.deriveTranslation(firstDerived.getId()));
        assertEquals(409, ex2.getCode());
        assertTrue(ex2.getMessage().contains("已存在关联译文，不可重复派生"));

        // HTTP 接口实证
        mockMvc.perform(post("/api/posts/" + sourceId + "/derive-translation")
                        .header("Authorization", adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(409))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("不可重复派生")));
    }

    @Test
    @DisplayName("【对抗实测2.3】历史脏指针自愈实证：若源文章 translation_post_id 指向已物理删除的幽灵ID，派生时自动修复脏指针并成功派生")
    void testSelfHealingWhenTranslationPostPhysicallyDeleted() {
        String baseName = "self-heal-" + System.currentTimeMillis();
        Post post = Post.builder()
                .title("脏指针自愈测试 " + baseName)
                .slug(baseName)
                .content("Self-healing test")
                .lang("zh")
                .status("PUBLISHED")
                .translationPostId(999999777L) // 模拟历史残留的幽灵脏ID
                .build();
        postService.save(post);

        // 执行派生
        PostDetailVO derived = postService.deriveTranslation(post.getId());
        assertNotNull(derived);
        assertNotNull(derived.getId());
        assertEquals("en", derived.getLang());
        assertEquals(post.getId(), derived.getTranslationPostId());

        // 验证源文章的脏指针被自动替换为新派生的真实有效文章 ID
        Post updatedSource = postService.getById(post.getId());
        assertEquals(derived.getId(), updatedSource.getTranslationPostId());
    }

    // =========================================================================
    // 3. 删除双向解绑与脏指针排查
    // =========================================================================

    @Test
    @DisplayName("【对抗实测3.1】删除源文章（中文版）：验证对端派生文章 translation_post_id 真实置空，详情接口不报 NPE")
    void testDeleteSourceArticleCleansOppositeField() {
        String baseName = "del-source-" + System.currentTimeMillis();
        PostCreateUpdateRequest req = new PostCreateUpdateRequest();
        req.setTitle("删除源文章测试 " + baseName);
        req.setSlug(baseName);
        req.setContent("Content");
        req.setLang("zh");
        Long sourceId = postService.createPost(req);

        PostDetailVO derived = postService.deriveTranslation(sourceId);
        Long derivedId = derived.getId();

        // 确认初始双向绑定
        assertEquals(derivedId, postService.getById(sourceId).getTranslationPostId());
        assertEquals(sourceId, postService.getById(derivedId).getTranslationPostId());

        // 删除源文章
        postService.deletePost(sourceId);

        // 校验源文章已从数据库删除
        assertNull(postService.getById(sourceId));

        // 校验对端文章存在且 translation_post_id 必须为 NULL
        Post remainingDerived = postService.getById(derivedId);
        assertNotNull(remainingDerived);
        assertNull(remainingDerived.getTranslationPostId(), "删除源文章后，派生文章的 translation_post_id 必须为 null，禁止残留脏悬挂外键");

        // 校验对端文章详情接口查询，VO 中 translationPost 必须优雅为 null，不报任何异常
        PostDetailVO vo = postService.getPostBySlug(remainingDerived.getSlug());
        assertNotNull(vo);
        assertNull(vo.getTranslationPostId());
        assertNull(vo.getTranslationPost());
    }

    @Test
    @DisplayName("【对抗实测3.2】删除派生文章（英文版）：验证源文章 translation_post_id 真实置空，无脏数据残留")
    void testDeleteDerivedArticleCleansSourceField() {
        String baseName = "del-derived-" + System.currentTimeMillis();
        PostCreateUpdateRequest req = new PostCreateUpdateRequest();
        req.setTitle("删除派生文章测试 " + baseName);
        req.setSlug(baseName);
        req.setContent("Content");
        req.setLang("zh");
        Long sourceId = postService.createPost(req);

        PostDetailVO derived = postService.deriveTranslation(sourceId);
        Long derivedId = derived.getId();

        // 删除派生文章
        postService.deletePost(derivedId);

        // 校验派生文章已删除
        assertNull(postService.getById(derivedId));

        // 校验源文章依然存在且 translation_post_id 被清空
        Post remainingSource = postService.getById(sourceId);
        assertNotNull(remainingSource);
        assertNull(remainingSource.getTranslationPostId(), "删除派生文章后，源文章的 translation_post_id 必须为 null");

        // 校验源文章重新具备再次派生译文的能力（无脏绑定阻碍）
        PostDetailVO reDerived = postService.deriveTranslation(sourceId);
        assertNotNull(reDerived);
        assertEquals(sourceId, reDerived.getTranslationPostId());
        assertEquals(reDerived.getId(), postService.getById(sourceId).getTranslationPostId());
    }

    @Test
    @DisplayName("【对抗实测3.3】多对双向文章交叉随机删除压力测试：验证数据库无残留脏悬挂引用")
    void testMultiPairInterleavedDeletionIntegrity() {
        int pairCount = 5;
        List<Long> sourceIds = new ArrayList<>();
        List<Long> derivedIds = new ArrayList<>();

        for (int i = 0; i < pairCount; i++) {
            String name = "multi-del-" + i + "-" + System.currentTimeMillis();
            PostCreateUpdateRequest req = new PostCreateUpdateRequest();
            req.setTitle("Multi Pair " + name);
            req.setSlug(name);
            req.setContent("Content " + i);
            req.setLang("zh");
            Long sId = postService.createPost(req);
            PostDetailVO dVo = postService.deriveTranslation(sId);
            sourceIds.add(sId);
            derivedIds.add(dVo.getId());
        }

        // 交叉删除：删除 source 0, derived 1, source 2, derived 3, source 4
        postService.deletePost(sourceIds.get(0));
        postService.deletePost(derivedIds.get(1));
        postService.deletePost(sourceIds.get(2));
        postService.deletePost(derivedIds.get(3));
        postService.deletePost(sourceIds.get(4));

        // 检查存活文章：derived 0, source 1, derived 2, source 3, derived 4
        Long[] survivors = {derivedIds.get(0), sourceIds.get(1), derivedIds.get(2), sourceIds.get(3), derivedIds.get(4)};
        for (Long survivorId : survivors) {
            Post survivor = postService.getById(survivorId);
            assertNotNull(survivor, "存活文章必须存在");
            assertNull(survivor.getTranslationPostId(), "当对端被删除后，存活文章的 translationPostId 必须为 null");
        }

        // 全库扫描是否有任何文章的 translation_post_id 指向这 5 个被删除文章中的任意一个
        List<Long> deletedIds = List.of(sourceIds.get(0), derivedIds.get(1), sourceIds.get(2), derivedIds.get(3), sourceIds.get(4));
        long dirtyCount = postService.count(new LambdaQueryWrapper<Post>().in(Post::getTranslationPostId, deletedIds));
        assertEquals(0L, dirtyCount, "全库不得存在任何指向已删除文章的脏指针引用！");
    }

    // =========================================================================
    // 4. 高并发多线程派生争用与防碰撞实证测试
    // =========================================================================

    @Test
    @DisplayName("【对抗实测4.1】高并发争用：10 线程同时对同一篇未派生源文章发起派生，验证数据一致性与无重复键破坏")
    void testConcurrentDerivationOnSameSourcePost() throws Exception {
        String baseName = "concurrent-race-" + System.currentTimeMillis();
        PostCreateUpdateRequest req = new PostCreateUpdateRequest();
        req.setTitle("并发派生争用文章 " + baseName);
        req.setSlug(baseName);
        req.setContent("Concurrent content test");
        req.setLang("zh");
        Long sourceId = postService.createPost(req);

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startGun = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        List<PostDetailVO> successList = Collections.synchronizedList(new ArrayList<>());
        List<Exception> exceptionList = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startGun.await(); // 10 线程齐发
                    PostDetailVO vo = postService.deriveTranslation(sourceId);
                    successList.add(vo);
                } catch (Exception e) {
                    exceptionList.add(e);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startGun.countDown(); // 发令枪响
        boolean finished = doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(finished, "10 个并发派生线程应在 10 秒内完成执行");

        log.info("并发派生结果：成功次数={}, 异常拦截次数={}", successList.size(), exceptionList.size());
        assertEquals(10, successList.size() + exceptionList.size(), "所有线程均需返回结果");

        // 至少有 1 个成功
        assertFalse(successList.isEmpty(), "至少应有 1 个线程成功派生译文");

        // 验证数据库状态一致性：
        // 源文章的 translation_post_id 必须有效且对应一篇存在的派生文章
        Post finalSource = postService.getById(sourceId);
        assertNotNull(finalSource.getTranslationPostId(), "源文章最终必须正确绑定一个 translationPostId");

        Post boundPost = postService.getById(finalSource.getTranslationPostId());
        assertNotNull(boundPost, "绑定的译文文章必须在数据库中存在");
        assertEquals(sourceId, boundPost.getTranslationPostId(), "绑定的译文文章必须反向指向源文章 ID");

        // 验证所有生成的派生文章（无论是否胜出）其 Slug 都是全局唯一的，未发生数据库唯一约束崩溃
        List<Post> allDerived = postService.list(new LambdaQueryWrapper<Post>().like(Post::getSlug, baseName + "-en"));
        Set<String> slugs = new HashSet<>();
        for (Post p : allDerived) {
            assertTrue(slugs.add(p.getSlug()), "派生文章 Slug 必须严格全局唯一，发现重复: " + p.getSlug());
        }
    }

    // =========================================================================
    // 5. 鉴权与越权矩阵防御验证 (401/403/405)
    // =========================================================================

    @Test
    @DisplayName("【对抗实测5.1】未登录/匿名访问派生接口，100% 被拦截并返回 401 Unauthorized")
    void testDeriveEndpointAnonymousRejected401() throws Exception {
        mockMvc.perform(post("/api/posts/1/derive-translation"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("未登录或登录已过期")));
    }

    @Test
    @DisplayName("【对抗实测5.2】伪造非法或损坏的 JWT Token 访问派生接口，100% 被拦截并返回 401 Unauthorized")
    void testDeriveEndpointForgedTokenRejected401() throws Exception {
        String[] forgedTokens = {
                "Bearer invalid.token.payload",
                "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiJ9.fakesignature",
                "Bearer ",
                "Basic YWRtaW46MTIzNDU2"
        };

        for (String forged : forgedTokens) {
            mockMvc.perform(post("/api/posts/1/derive-translation")
                            .header("Authorization", forged))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value(401));
        }
    }

    @Test
    @DisplayName("【对抗实测5.3】普通读者（USER 角色）尝试垂直越权调用派生接口，100% 被拦截并返回 403 Forbidden")
    void testDeriveEndpointNormalUserForbidden403() throws Exception {
        mockMvc.perform(post("/api/posts/1/derive-translation")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("没有权限执行该操作")));
    }

    @Test
    @DisplayName("【对抗实测5.4】以错误 HTTP 方法（GET / PUT / DELETE）探测派生接口，拒绝触发业务派生 (405/404)")
    void testDeriveEndpointWrongHttpMethods() throws Exception {
        // GET 请求派生接口
        mockMvc.perform(get("/api/posts/1/derive-translation")
                        .header("Authorization", adminToken))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 404 || status == 405, "非 POST 请求派生端点必须返回 405 或 404，实测: " + status);
                });

        // PUT 请求派生接口
        mockMvc.perform(put("/api/posts/1/derive-translation")
                        .header("Authorization", adminToken))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 404 || status == 405, "非 POST 请求派生端点必须返回 405 或 404，实测: " + status);
                });
    }
}
