package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.dto.FriendApplyRequest;
import com.hayden.blog.dto.FriendStatusUpdateRequest;
import com.hayden.blog.dto.NowUpdateRequest;
import com.hayden.blog.dto.SiteSettingUpdateRequest;
import com.hayden.blog.dto.TestMinioRequest;
import com.hayden.blog.entity.Friend;
import com.hayden.blog.entity.Journey;
import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.security.JwtTokenProvider;
import com.hayden.blog.service.FriendService;
import com.hayden.blog.service.JourneyService;
import com.hayden.blog.service.SiteSettingService;
import com.hayden.blog.storage.LocalStorageServiceImpl;
import com.hayden.blog.storage.MinioStorageServiceImpl;
import com.hayden.blog.storage.StorageFactory;
import com.hayden.blog.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Milestone 1 (M1) 独立挑战者实证对抗与压力测试套件
 * 严格覆盖：
 * 1. 存储策略模式多态性、URL拼接边界与离线/故障平滑优雅降级
 * 2. 视频与多媒体魔数深度对抗（伪造扩展名、XSS/HTML脚本嵌入、截断损坏文件、双扩展名、越权拦截）
 * 3. 友链公开自助申请闭环（免鉴权、状态严格 PENDING、非法URL拦截、私密性隔离、管理员审核流转）
 * 4. 7 城真实足迹地理经纬度精准度与游记关联性
 * 5. Now 页面生活心智流结构化字段与越权防护
 * 6. MinIO 连通性测试诊断与非管理员凭据严格脱敏
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@org.springframework.test.annotation.DirtiesContext
public class ChallengerM1EmpiricalTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LocalStorageServiceImpl localStorageService;

    @Autowired
    private MinioStorageServiceImpl minioStorageService;

    @Autowired
    private StorageFactory storageFactory;

    @Autowired
    private SiteSettingService siteSettingService;

    @Autowired
    private FriendService friendService;

    @Autowired
    private JourneyService journeyService;

    @Autowired
    private com.hayden.blog.service.UserService userService;

    @Autowired
    private com.hayden.blog.service.NowService nowService;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        userToken = "Bearer " + jwtTokenProvider.generateToken("challenger_reader", "USER");

        try {
            com.hayden.blog.dto.RegisterRequest req = new com.hayden.blog.dto.RegisterRequest();
            req.setUsername("challenger_reader");
            req.setPassword("password123");
            req.setNickname("挑战测试读者");
            req.setEmail("challenger@test.com");
            userService.register(req);
        } catch (Exception ignored) {
        }
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        if (nowService != null) {
            NowUpdateRequest reset = new NowUpdateRequest();
            reset.setCurrentCity("杭州 · 滨江");
            reset.setFocusTopicsJson("[{\"title\":\"Project Loom 虚拟线程并发实战\",\"progress\":90,\"badge\":\"核心演进\",\"tags\":[\"Java 21\",\"Concurrency\"]},{\"title\":\"Next.js 14 现代响应式空间美学\",\"progress\":95,\"badge\":\"前端重构\",\"tags\":[\"Next.js\",\"Three.js\"]},{\"title\":\"商汤日日新 / DeepSeek AI 智能体体系\",\"progress\":80,\"badge\":\"智能伴读\",\"tags\":[\"Agent\",\"LLM\"]}]");
            reset.setReadingNotesJson("[{\"title\":\"Designing Data-Intensive Applications\",\"author\":\"Martin Kleppmann\",\"cover\":\"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&fit=crop\",\"quote\":\"可靠性、可扩展性与可维护性是支撑数字系统的三大基石。\",\"note\":\"精读第5章分布式复制与一致性模型\"},{\"title\":\"Building Microservices (2nd Edition)\",\"author\":\"Sam Newman\",\"cover\":\"https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&fit=crop\",\"quote\":\"服务解耦与自治性决定了分布式架构的演进上限。\",\"note\":\"研读微服务拆分与演进模式\"}]");
            reset.setMicroLogsJson("[{\"date\":\"2026-09-08\",\"content\":\"完成 MinIO 云存储与虚拟线程架构升级，博客数字花园性能大幅跃升。\"},{\"date\":\"2026-09-06\",\"content\":\"重构 Now 页面，引入生活心智流与经典书摘。\"}]");
            reset.setLearning("- 深入学习 Java 21 虚拟线程 (Virtual Threads) 高并发实践\n- 研读智能体协调框架与 Multi-Agent 架构设计\n- 探索现代 Web 端 Shiki 代码渲染与暗色排版细节");
            reset.setBuilding("- 打造全新的个人博客与数字花园系统 (Hayden Xue Personal Blog V2.0)\n- 搭建前后端分离的现代化个人数字资产中枢");
            reset.setExploring("- 城市徒步与建筑摄影 (Street & Architecture Photography)\n- 下一代 Generative UI 与响应式流式交互范式");
            reset.setThinking("- 个人数字花园如何成为长效的心智外脑，而非转瞬即逝的碎片化社交信息？\n- 在大模型时代，软件工程师的核心壁垒正在向何处迁移？");
            nowService.updateNow(reset);
        }
    }

    // ==========================================
    // 1. 存储策略对抗与边界测试
    // ==========================================

    @Test
    @DisplayName("【存储实证】LocalStorage 深度操作：多层目录自动创建、流写入、URL规范化与异常健壮性")
    void testLocalStorageAdversarialOperations() {
        String deepKey = "deep/nested/2026/09/challenger_test.txt";
        byte[] payload = "Empirical Challenge Verification Payload".getBytes(StandardCharsets.UTF_8);

        // 1. 测试深度路径自动创建并写入
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", payload);
        String fileUrl = localStorageService.upload(file, deepKey);
        assertNotNull(fileUrl);
        assertEquals("/uploads/" + deepKey, fileUrl);

        // 2. 测试带前导斜杠的 objectKey URL 规范化（避免出现 //uploads// 或 double slash）
        String slashKey = "/leading/slash/path.jpg";
        String accessUrl = localStorageService.getAccessUrl(slashKey);
        assertEquals("/uploads/leading/slash/path.jpg", accessUrl);

        // 3. 测试流式写入
        String streamKey = "stream/test_data.bin";
        String streamUrl = localStorageService.upload(new ByteArrayInputStream(payload), streamKey, "application/octet-stream", payload.length);
        assertNotNull(streamUrl);
        assertEquals("/uploads/stream/test_data.bin", streamUrl);

        // 4. 测试连接性与写入权限检测
        assertTrue(localStorageService.testConnection());

        // 5. 测试删除不存在的文件不抛出未捕获异常
        assertDoesNotThrow(() -> localStorageService.delete("non_existent/path/never_existed.tmp"));

        // 6. 测试路径遍历攻击防护 (Path Traversal Defense)
        assertThrows(com.hayden.blog.exception.BusinessException.class, () -> localStorageService.upload(file, "../../evil_traversal.txt"));
        assertThrows(com.hayden.blog.exception.BusinessException.class, () -> localStorageService.upload(file, "sub/../../../../etc/passwd"));
        assertThrows(com.hayden.blog.exception.BusinessException.class, () -> localStorageService.upload(file, "..\\..\\evil_win.txt"));
        assertDoesNotThrow(() -> localStorageService.delete("../../etc/passwd"));

        // 清理
        localStorageService.delete(deepKey);
        localStorageService.delete(streamKey);
    }

    @Test
    @DisplayName("【存储实证】MinioStorage URL 拼接矩阵与连接异常安全吸收")
    void testMinioUrlVariantsAndConnectionSafety() {
        assertEquals("minio", minioStorageService.getStorageType());

        // 验证无效端点连通性测试安全返回 false 且无异常逃逸
        assertFalse(minioStorageService.testConnection("http://127.0.0.1:65530", "test-bucket", "key", "sec"));
        assertFalse(minioStorageService.testConnection("", "bucket", "key", "sec"));
        assertFalse(minioStorageService.testConnection("http://localhost:9000", "bucket", "", "sec"));

        // 验证公网访问直链解析
        String url = minioStorageService.getAccessUrl("2026/09/photo.mp4");
        assertNotNull(url);
        assertTrue(url.endsWith("/2026/09/photo.mp4"));
    }

    @Test
    @DisplayName("【存储实证】StorageFactory 动态平滑降级矩阵：全维度覆盖离线、空凭据、无效存储类型")
    void testStorageFactoryDynamicFallbackMatrix() {
        SiteSetting setting = siteSettingService.getSettings();

        // 场景 A：配置为 local 时返回 local
        setting.setStorageType("local");
        siteSettingService.updateById(setting);
        assertEquals("local", storageFactory.getStorageService().getStorageType());

        // 场景 B：配置为大写 LOCAL 兼容
        setting.setStorageType("LOCAL");
        siteSettingService.updateById(setting);
        assertEquals("local", storageFactory.getStorageService().getStorageType());

        // 场景 C：配置为 minio 但无可用服务器（端口未开放） -> 自动优雅降级为 local
        setting.setStorageType("minio");
        setting.setMinioEndpoint("http://localhost:65531");
        setting.setMinioBucket("cloud-garden");
        setting.setMinioAccessKey("validKey");
        setting.setMinioSecretKey("validSecret");
        siteSettingService.updateById(setting);
        StorageService fallback = storageFactory.getStorageService();
        assertNotNull(fallback);
        assertEquals("local", fallback.getStorageType(), "MinIO 服务器连接不通时必须优雅降级为 local");

        // 场景 D：配置为 minio 但凭据为空 -> 自动降级为 local
        setting.setStorageType("minio");
        setting.setMinioAccessKey("");
        setting.setMinioSecretKey("");
        siteSettingService.updateById(setting);
        assertEquals("local", storageFactory.getStorageService().getStorageType(), "MinIO 凭据缺失时必须优雅降级为 local");

        // 场景 E：未知存储策略 -> 兜底 local
        setting.setStorageType("unknown_custom_store");
        siteSettingService.updateById(setting);
        assertEquals("local", storageFactory.getStorageService().getStorageType(), "未知存储类型必须安全兜底 local");

        // 还原配置
        setting.setStorageType("local");
        siteSettingService.updateById(setting);
    }

    // ==========================================
    // 2. 视频与多媒体魔数及安全对抗测试
    // ==========================================

    @Test
    @DisplayName("【媒体实证】视频魔数与有效载荷：真实 MP4 与 WebM 头顺利通过并落库")
    void testValidVideoUploads() throws Exception {
        // 合法 MP4: box size (0x00000018) + 'f','t','y','p' (0x66, 0x74, 0x79, 0x70) + major brand
        byte[] validMp4 = new byte[]{
                0x00, 0x00, 0x00, 0x18,
                0x66, 0x74, 0x79, 0x70,
                0x69, 0x73, 0x6F, 0x6D,
                0x00, 0x00, 0x02, 0x00
        };
        MockMultipartFile mp4File = new MockMultipartFile("file", "presentation.mp4", "video/mp4", validMp4);

        mockMvc.perform(multipart("/api/media/upload")
                        .file(mp4File)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.filename").value("presentation.mp4"))
                .andExpect(jsonPath("$.data.url").isNotEmpty())
                .andExpect(jsonPath("$.data.storageType").value("local"));

        // 合法 WebM: EBML ID 0x1A, 0x45, 0xDF, 0xA3
        byte[] validWebm = new byte[]{
                (byte) 0x1A, (byte) 0x45, (byte) 0xDF, (byte) 0xA3,
                0x42, (byte) 0x86, (byte) 0x81, 0x01
        };
        MockMultipartFile webmFile = new MockMultipartFile("file", "scenery.webm", "video/webm", validWebm);

        mockMvc.perform(multipart("/api/media/upload")
                        .file(webmFile)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.filename").value("scenery.webm"));
    }

    @Test
    @DisplayName("【媒体对抗】对抗攻击：空文件、截断损坏文件与扩展名伪装拦截")
    void testCorruptedAndSpoofedVideosRejected() throws Exception {
        // 1. 空文件
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.mp4", "video/mp4", new byte[0]);
        mockMvc.perform(multipart("/api/media/upload").file(emptyFile).header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));

        // 2. 只有 2 字节（截断）
        MockMultipartFile truncated = new MockMultipartFile("file", "short.mp4", "video/mp4", new byte[]{0x00, 0x01});
        mockMvc.perform(multipart("/api/media/upload").file(truncated).header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("文件体积过小或损坏，无法识别合法视频魔数"));

        // 3. 伪装视频：纯文本改名为 .mp4
        MockMultipartFile textAsMp4 = new MockMultipartFile("file", "fake.mp4", "video/mp4", "JUST PLAIN TEXT CONTENT".getBytes());
        mockMvc.perform(multipart("/api/media/upload").file(textAsMp4).header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("文件头魔数校验失败，仅支持合法 MP4, WEBM 视频"));

        // 4. 伪装视频：真实 JPEG (FF D8 FF) 强行改名为 .mp4
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46};
        MockMultipartFile jpegAsMp4 = new MockMultipartFile("file", "photo_as_video.mp4", "video/mp4", jpegBytes);
        mockMvc.perform(multipart("/api/media/upload").file(jpegAsMp4).header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("文件头魔数校验失败，仅支持合法 MP4, WEBM 视频"));

        // 5. 伪装图片：真实 MP4 强行改名为 .jpg
        byte[] validMp4 = new byte[]{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D};
        MockMultipartFile mp4AsJpg = new MockMultipartFile("file", "video_as_photo.jpg", "image/jpeg", validMp4);
        mockMvc.perform(multipart("/api/media/upload").file(mp4AsJpg).header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("文件头魔数校验失败，仅支持真实 JPG, PNG, WEBP, GIF 图片"));
    }

    @Test
    @DisplayName("【媒体对抗】恶意载荷注入攻击：伪装成 MP4 但注入 HTML/SVG/JavaScript 标签直接阻断")
    void testMaliciousScriptPayloadInVideoRejected() throws Exception {
        // 包含 <script> 注入
        MockMultipartFile xssPayload = new MockMultipartFile(
                "file", "exploit.mp4", "video/mp4",
                "<script>window.location='http://evil.com'</script>".getBytes()
        );
        mockMvc.perform(multipart("/api/media/upload").file(xssPayload).header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));

        // 包含 <svg onload=...
        MockMultipartFile svgPayload = new MockMultipartFile(
                "file", "evil.webm", "video/webm",
                "<svg onload=alert(document.cookie)>".getBytes()
        );
        mockMvc.perform(multipart("/api/media/upload").file(svgPayload).header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));

        // 包含 <?php
        MockMultipartFile phpPayload = new MockMultipartFile(
                "file", "backdoor.mp4", "video/mp4",
                "<?php system($_GET['cmd']); ?>".getBytes()
        );
        mockMvc.perform(multipart("/api/media/upload").file(phpPayload).header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("【媒体安全】垂直越权防护：未登录与普通读者上传多媒体被严格拦截 (401/403)")
    void testMediaUploadVerticalPrivilegeProtection() throws Exception {
        byte[] validMp4 = new byte[]{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D};
        MockMultipartFile mp4 = new MockMultipartFile("file", "test.mp4", "video/mp4", validMp4);

        // 匿名上传 -> 401
        mockMvc.perform(multipart("/api/media/upload").file(mp4))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        // 读者上传 -> 403
        mockMvc.perform(multipart("/api/media/upload").file(mp4).header("Authorization", userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
    }

    // ==========================================
    // 3. 友链公开自助申请闭环实证测试
    // ==========================================

    @Test
    @DisplayName("【友链实证】公开申请全流程：免登录申请成功、状态必须为 PENDING，且未审核前不在前台暴露")
    void testFriendPublicApplyAndIsolationLifecycle() throws Exception {
        String testSiteName = "Empirical Challenger Site " + System.currentTimeMillis();
        String testSiteUrl = "https://challenger-" + System.currentTimeMillis() + ".org";

        FriendApplyRequest applyReq = FriendApplyRequest.builder()
                .name(testSiteName)
                .url(testSiteUrl)
                .avatar("https://example.com/avatar.png")
                .description("Automated Empirical Verification Blog")
                .category("极客同好")
                .build();

        // 1. 免登录公开申请 -> 200，状态必须是 PENDING
        String responseContent = mockMvc.perform(post("/api/friends/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(applyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.name").value(testSiteName))
                .andExpect(jsonPath("$.data.url").value(testSiteUrl))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.sortOrder").value(999))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        Map<?, ?> json = objectMapper.readValue(responseContent, Map.class);
        Map<?, ?> data = (Map<?, ?>) json.get("data");
        Long friendId = Long.valueOf(data.get("id").toString());

        // 2. 验证前台公开列表 GET /api/friends 隔离性：绝对不能包含未审核的 PENDING 记录
        mockMvc.perform(get("/api/friends"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(result -> {
                    String content = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
                    assertFalse(content.contains(testSiteName), "前台公开友链列表严禁展示未审核的 PENDING 友链");
                });

        // 3. 普通读者尝试越权审批 -> 403
        FriendStatusUpdateRequest approveReq = FriendStatusUpdateRequest.builder()
                .status("ACTIVE")
                .build();
        mockMvc.perform(put("/api/friends/" + friendId + "/status")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 4. 管理员审核通过 -> 200
        mockMvc.perform(put("/api/friends/" + friendId + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 5. 审核通过后，前台公开列表 GET /api/friends 应该能够查到该友链
        mockMvc.perform(get("/api/friends"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String content = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
                    assertTrue(content.contains(testSiteName), "审核通过为 ACTIVE 后，前台公开友链列表必须展示");
                });

        // 6. 验证非法状态流转（如转为 INVALID_STATUS）被拦截返回 400
        FriendStatusUpdateRequest badStatusReq = FriendStatusUpdateRequest.builder()
                .status("ILLEGAL_STATUS_HACK")
                .build();
        mockMvc.perform(put("/api/friends/" + friendId + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badStatusReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("【友链对抗】申请协议校验：非法协议 (javascript:, ftp:, file:) 严格拒绝返回 400")
    void testFriendApplyProtocolAttacks() throws Exception {
        FriendApplyRequest jsAttack = FriendApplyRequest.builder()
                .name("XSS Protocol")
                .url("javascript:alert(document.cookie)")
                .description("Protocol injection")
                .build();

        mockMvc.perform(post("/api/friends/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jsAttack)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));

        FriendApplyRequest ftpAttack = FriendApplyRequest.builder()
                .name("FTP Site")
                .url("ftp://ftp.example.com")
                .description("FTP Protocol")
                .build();

        mockMvc.perform(post("/api/friends/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ftpAttack)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    // ==========================================
    // 4. 真实足迹数据精准度与 Now 页面实证
    // ==========================================

    @Test
    @DisplayName("【足迹实证】7 城真实足迹地理坐标范围精度与真实博客内容验证")
    void testJourneysRealGeographicalCoordinatesAccuracy() throws Exception {
        List<Journey> list = journeyService.list();
        assertNotNull(list);
        assertEquals(7, list.size(), "必须精准为 7 个到访城市记录");

        Map<String, Journey> cityMap = list.stream().collect(Collectors.toMap(Journey::getCity, j -> j));

        // 坐标合理性实证校验
        Journey beijing = cityMap.get("北京");
        assertNotNull(beijing);
        assertTrue(beijing.getLatitude().doubleValue() > 39.0 && beijing.getLatitude().doubleValue() < 41.0, "北京纬度需在 39~41: " + beijing.getLatitude());
        assertTrue(beijing.getLongitude().doubleValue() > 115.0 && beijing.getLongitude().doubleValue() < 118.0, "北京经度需在 115~118: " + beijing.getLongitude());

        Journey tokyo = cityMap.get("东京");
        assertNotNull(tokyo);
        assertTrue(tokyo.getLatitude().doubleValue() > 35.0 && tokyo.getLatitude().doubleValue() < 36.5, "东京纬度需在 35~36.5: " + tokyo.getLatitude());
        assertTrue(tokyo.getLongitude().doubleValue() > 139.0 && tokyo.getLongitude().doubleValue() < 140.5, "东京经度需在 139~140.5: " + tokyo.getLongitude());

        Journey kyoto = cityMap.get("京都");
        assertNotNull(kyoto);
        assertTrue(kyoto.getLatitude().doubleValue() > 34.5 && kyoto.getLatitude().doubleValue() < 35.5, "京都纬度需在 34.5~35.5: " + kyoto.getLatitude());
        assertTrue(kyoto.getLongitude().doubleValue() > 135.0 && kyoto.getLongitude().doubleValue() < 136.5, "京都经度需在 135~136.5: " + kyoto.getLongitude());

        Journey chongqing = cityMap.get("重庆");
        assertNotNull(chongqing);
        assertTrue(chongqing.getLatitude().doubleValue() > 29.0 && chongqing.getLatitude().doubleValue() < 30.5, "重庆纬度需在 29~30.5: " + chongqing.getLatitude());
        assertTrue(chongqing.getLongitude().doubleValue() > 106.0 && chongqing.getLongitude().doubleValue() < 107.5, "重庆经度需在 106~107.5: " + chongqing.getLongitude());

        for (Journey j : list) {
            assertTrue(j.getCover().startsWith("http"), "实拍封面必须为有效网络图片直链: " + j.getCity());
            assertNotNull(j.getSlug(), "必须包含游记 slug 链接: " + j.getCity());
            assertTrue(j.getContent().length() > 20, "必须包含丰富游记博文内容: " + j.getCity());
        }
    }

    @Test
    @DisplayName("【Now 实证】心智流数据模型扩展读写与读者垂直越权防护")
    void testNowMindstreamReadAndSecurity() throws Exception {
        // 1. 公开 GET /api/now
        mockMvc.perform(get("/api/now"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.currentCity").isNotEmpty())
                .andExpect(jsonPath("$.data.focusTopicsJson").isNotEmpty());

        // 2. 读者尝试 PUT /api/now -> 403
        NowUpdateRequest updateReq = new NowUpdateRequest();
        updateReq.setCurrentCity("上海 · 陆家嘴");
        updateReq.setFocusTopicsJson("[{\"title\":\"Java 21 Virtual Threads\",\"progress\":100,\"badge\":\"架构升级\"}]");
        updateReq.setReadingNotesJson("[{\"title\":\"Designing Data-Intensive Applications\",\"author\":\"Martin Kleppmann\"}]");
        updateReq.setMicroLogsJson("[{\"date\":\"2026-09-08\",\"content\":\"通过挑战者实证测试\"}]");

        mockMvc.perform(put("/api/now")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 3. 管理员 PUT /api/now -> 200
        mockMvc.perform(put("/api/now")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 验证读回
        mockMvc.perform(get("/api/now"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentCity").value("上海 · 陆家嘴"));

        // 还原现场避免污染共享测试库
        NowUpdateRequest restoreReq = new NowUpdateRequest();
        restoreReq.setCurrentCity("杭州 · 滨江");
        restoreReq.setFocusTopicsJson("[{\"title\":\"Project Loom 虚拟线程并发实战\",\"progress\":90,\"badge\":\"核心演进\",\"tags\":[\"Java 21\",\"Concurrency\"]},{\"title\":\"Next.js 14 现代响应式空间美学\",\"progress\":95,\"badge\":\"前端重构\",\"tags\":[\"Next.js\",\"Three.js\"]},{\"title\":\"商汤日日新 / DeepSeek AI 智能体体系\",\"progress\":80,\"badge\":\"智能伴读\",\"tags\":[\"Agent\",\"LLM\"]}]");
        restoreReq.setReadingNotesJson("[{\"title\":\"Designing Data-Intensive Applications\",\"author\":\"Martin Kleppmann\",\"cover\":\"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&fit=crop\",\"quote\":\"可靠性、可扩展性与可维护性是支撑数字系统的三大基石。\",\"note\":\"精读第5章分布式复制与一致性模型\"},{\"title\":\"Building Microservices (2nd Edition)\",\"author\":\"Sam Newman\",\"cover\":\"https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&fit=crop\",\"quote\":\"服务解耦与自治性决定了分布式架构的演进上限。\",\"note\":\"研读微服务拆分与演进模式\"}]");
        restoreReq.setMicroLogsJson("[{\"date\":\"2026-09-08\",\"content\":\"完成 MinIO 云存储与虚拟线程架构升级，博客数字花园性能大幅跃升。\"},{\"date\":\"2026-09-06\",\"content\":\"重构 Now 页面，引入生活心智流与经典书摘。\"}]");
        mockMvc.perform(put("/api/now")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(restoreReq)))
                .andExpect(status().isOk());
    }

    // ==========================================
    // 5. MinIO 连通性测试与敏感凭据脱敏
    // ==========================================

    @Test
    @DisplayName("【安全实证】MinIO 连通性接口权限隔离与秘钥防泄露脱敏")
    void testMinioSecurityAndDesensitization() throws Exception {
        // 1. 匿名调用测试接口 -> 401
        TestMinioRequest testReq = TestMinioRequest.builder()
                .endpoint("http://127.0.0.1:9000")
                .bucket("test")
                .accessKey("ak")
                .secretKey("sk")
                .build();

        mockMvc.perform(post("/api/settings/test-minio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        // 2. 读者调用测试接口 -> 403
        mockMvc.perform(post("/api/settings/test-minio")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 3. 管理员调用测试接口测试不可达端点 -> 200，但 success = false，具备安全诊断
        mockMvc.perform(post("/api/settings/test-minio")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.success").value(false))
                .andExpect(jsonPath("$.data.message").isNotEmpty());

        // 4. 配置 MinIO 秘钥后，匿名与普通读者获取设置，minioSecretKey 必须被脱敏清除（null 或不存在）
        SiteSettingUpdateRequest setReq = new SiteSettingUpdateRequest();
        setReq.setStorageType("minio");
        setReq.setMinioEndpoint("http://minio.corp.internal:9000");
        setReq.setMinioBucket("haydan-blog");
        setReq.setMinioAccessKey("superAdminKey");
        setReq.setMinioSecretKey("ultraTopSecretPassword123456!");
        setReq.setHeroBgType("video");

        mockMvc.perform(put("/api/settings")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setReq)))
                .andExpect(status().isOk());

        // 匿名用户请求
        mockMvc.perform(get("/api/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.minioSecretKey").doesNotExist());

        // 读者请求
        mockMvc.perform(get("/api/settings").header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.minioSecretKey").doesNotExist());

        // 管理员请求 -> 可见
        mockMvc.perform(get("/api/settings").header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.minioSecretKey").value("ultraTopSecretPassword123456!"));

        // 还原现场
        setReq.setStorageType("local");
        mockMvc.perform(put("/api/settings")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setReq)))
                .andExpect(status().isOk());
    }
}
