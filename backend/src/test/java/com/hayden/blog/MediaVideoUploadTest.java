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
public class MediaVideoUploadTest {

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
        userToken = "Bearer " + jwtTokenProvider.generateToken("reader_video", "USER");

        try {
            com.hayden.blog.dto.RegisterRequest req = new com.hayden.blog.dto.RegisterRequest();
            req.setUsername("reader_video");
            req.setPassword("password123");
            req.setNickname("视频测试读者");
            req.setEmail("reader_video@test.com");
            userService.register(req);
        } catch (Exception ignored) {
        }
    }

    @Test
    @DisplayName("视频上传：合规 MP4 文件 (ftyp 魔数 0x66, 0x74, 0x79, 0x70) 成功上传返回 200 并包含存储类型")
    void testValidMp4UploadSuccess() throws Exception {
        // MP4 header: 4 bytes box size + 'f', 't', 'y', 'p' + compatible brands
        byte[] validMp4Bytes = new byte[]{
                0x00, 0x00, 0x00, 0x18,
                0x66, 0x74, 0x79, 0x70, // 'f', 't', 'y', 'p'
                0x6D, 0x70, 0x34, 0x32, // 'm', 'p', '4', '2'
                0x00, 0x00, 0x00, 0x00
        };
        MockMultipartFile mp4File = new MockMultipartFile("file", "intro.mp4", "video/mp4", validMp4Bytes);

        mockMvc.perform(multipart("/api/media/upload")
                        .file(mp4File)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.url").isNotEmpty())
                .andExpect(jsonPath("$.data.filename").value("intro.mp4"))
                .andExpect(jsonPath("$.data.storageType").isNotEmpty());
    }

    @Test
    @DisplayName("视频上传：合规 WebM 文件 (EBML 魔数 0x1A, 0x45, 0xDF, 0xA3) 成功上传返回 200")
    void testValidWebmUploadSuccess() throws Exception {
        // WebM header: 0x1A, 0x45, 0xDF, 0xA3
        byte[] validWebmBytes = new byte[]{
                (byte) 0x1A, (byte) 0x45, (byte) 0xDF, (byte) 0xA3,
                0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F
        };
        MockMultipartFile webmFile = new MockMultipartFile("file", "ambient.webm", "video/webm", validWebmBytes);

        mockMvc.perform(multipart("/api/media/upload")
                        .file(webmFile)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.url").isNotEmpty())
                .andExpect(jsonPath("$.data.filename").value("ambient.webm"));
    }

    @Test
    @DisplayName("视频安全：伪造视频后缀 (文本改名为 mp4/webm) 触发魔数严格校验被拒绝返回 400")
    void testFakeVideoRejected() throws Exception {
        // 伪装成 mp4 的文本
        MockMultipartFile fakeMp4 = new MockMultipartFile(
                "file", "exploit.mp4", "video/mp4",
                "This is not a real video, but plain text pretending to be MP4.".getBytes()
        );

        mockMvc.perform(multipart("/api/media/upload")
                        .file(fakeMp4)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("文件头魔数校验失败，仅支持合法 MP4, WEBM 视频"));

        // 伪装成 webm 的文本
        MockMultipartFile fakeWebm = new MockMultipartFile(
                "file", "exploit.webm", "video/webm",
                "Fake webm payload".getBytes()
        );

        mockMvc.perform(multipart("/api/media/upload")
                        .file(fakeWebm)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("文件头魔数校验失败，仅支持合法 MP4, WEBM 视频"));
    }

    @Test
    @DisplayName("视频安全：包含恶意脚本标签的伪造视频载荷被检测拦截返回 400")
    void testMaliciousScriptInVideoRejected() throws Exception {
        byte[] scriptVideoBytes = ("<script>alert('xss')</script>").getBytes();
        MockMultipartFile scriptVideo = new MockMultipartFile(
                "file", "xss.mp4", "video/mp4", scriptVideoBytes
        );

        mockMvc.perform(multipart("/api/media/upload")
                        .file(scriptVideo)
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("视频安全：普通读者尝试上传视频被垂直越权拦截返回 403")
    void testReaderVideoUploadForbidden() throws Exception {
        byte[] validMp4Bytes = new byte[]{
                0x00, 0x00, 0x00, 0x18,
                0x66, 0x74, 0x79, 0x70,
                0x6D, 0x70, 0x34, 0x32,
                0x00, 0x00, 0x00, 0x00
        };
        MockMultipartFile mp4File = new MockMultipartFile("file", "test.mp4", "video/mp4", validMp4Bytes);

        mockMvc.perform(multipart("/api/media/upload")
                        .file(mp4File)
                        .header("Authorization", userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
    }
}
