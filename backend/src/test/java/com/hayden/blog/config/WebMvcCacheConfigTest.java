package com.hayden.blog.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class WebMvcCacheConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Value("${app.upload.dir:./uploads/}")
    private String uploadDir;

    private Path testFilePath;

    @BeforeEach
    void setUp() throws Exception {
        Path dirPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }
        testFilePath = dirPath.resolve("cache-test-" + System.currentTimeMillis() + ".txt");
        Files.write(testFilePath, "Hayden Xue Blog Cache Test".getBytes(StandardCharsets.UTF_8));
    }

    @AfterEach
    void tearDown() throws Exception {
        if (testFilePath != null && Files.exists(testFilePath)) {
            Files.deleteIfExists(testFilePath);
        }
    }

    @Test
    @DisplayName("验证上传静态文件返回 30 天 Cache-Control 强缓存头")
    void testUploadStaticFileCacheControl() throws Exception {
        String fileName = testFilePath.getFileName().toString();
        mockMvc.perform(get("/uploads/" + fileName))
                .andExpect(status().isOk())
                .andExpect(header().exists("Cache-Control"))
                .andExpect(header().string("Cache-Control", containsString("max-age=2592000")))
                .andExpect(header().string("Cache-Control", containsString("public")));
    }

    @Test
    @DisplayName("验证 API 接口下发 ETag 且 If-None-Match 返回 304 Not Modified 协商缓存")
    void testApiEtagAnd304NotModified() throws Exception {
        // 1. 初次请求 GET /api/categories
        MvcResult firstResult = mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(header().exists("ETag"))
                .andReturn();

        String etag = firstResult.getResponse().getHeader("ETag");
        assertNotNull(etag, "API 响应必须包含有效的 ETag 响应头");

        // 2. 二次请求带上 If-None-Match
        mockMvc.perform(get("/api/categories").header("If-None-Match", etag))
                .andExpect(status().isNotModified())
                .andExpect(content().string(""));
    }
}
