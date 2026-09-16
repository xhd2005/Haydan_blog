package com.hayden.blog;

import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.service.SiteSettingService;
import com.hayden.blog.storage.LocalStorageServiceImpl;
import com.hayden.blog.storage.MinioStorageServiceImpl;
import com.hayden.blog.storage.StorageFactory;
import com.hayden.blog.storage.StorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2")
public class StorageStrategyTest {

    @Autowired
    private LocalStorageServiceImpl localStorageService;

    @Autowired
    private MinioStorageServiceImpl minioStorageService;

    @Autowired
    private StorageFactory storageFactory;

    @Autowired
    private SiteSettingService siteSettingService;

    @Test
    @DisplayName("本地存储策略：上传文件、上传流、删除与URL解析功能完整")
    void testLocalStorageOperations() {
        String testKey = "test/strategy/sample.txt";
        byte[] content = "Hello Storage Strategy".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "sample.txt", "text/plain", content);

        // 1. 测试 upload(MultipartFile)
        String url1 = localStorageService.upload(file, testKey);
        assertNotNull(url1);
        assertTrue(url1.contains("sample.txt"));
        assertEquals("local", localStorageService.getStorageType());

        // 2. 测试 upload(InputStream)
        String streamKey = "test/strategy/stream.txt";
        String url2 = localStorageService.upload(new ByteArrayInputStream(content), streamKey, "text/plain", content.length);
        assertNotNull(url2);
        assertTrue(url2.contains("stream.txt"));

        // 3. 测试 getAccessUrl
        assertEquals("/uploads/" + testKey, localStorageService.getAccessUrl(testKey));

        // 4. 测试 testConnection
        assertTrue(localStorageService.testConnection());

        // 5. 测试 delete
        localStorageService.delete(testKey);
        localStorageService.delete(streamKey);
    }

    @Test
    @DisplayName("本地存储路径遍历防护：非法跨目录路径被严格拦截拒绝")
    void testLocalStoragePathTraversalDefense() {
        byte[] content = "malicious payload".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "attack.txt", "text/plain", content);

        assertThrows(com.hayden.blog.exception.BusinessException.class, () ->
                localStorageService.upload(file, "../../etc/shadow"));
        assertThrows(com.hayden.blog.exception.BusinessException.class, () ->
                localStorageService.upload(file, "nested/../../../../windows/system32/cmd.exe"));
        assertThrows(com.hayden.blog.exception.BusinessException.class, () ->
                localStorageService.upload(new ByteArrayInputStream(content), "..\\..\\escaped.bin", "application/octet-stream", content.length));
        assertDoesNotThrow(() -> localStorageService.delete("../../etc/passwd"));
    }

    @Test
    @DisplayName("MinIO 存储策略：未配置/不可达端点安全测试，不发生未捕获异常并返回 false")
    void testMinioSafetyAndConfigResolution() {
        assertEquals("minio", minioStorageService.getStorageType());

        // 测试获取配置
        MinioStorageServiceImpl.MinioConfig config = minioStorageService.getEffectiveConfig();
        assertNotNull(config);
        assertNotNull(config.endpoint());
        assertNotNull(config.bucket());

        // 测试不可达端点连接测试安全返回 false
        boolean result = minioStorageService.testConnection("http://192.0.2.1:9000", "test-bucket", "bad_key", "bad_secret");
        assertFalse(result, "不可达 MinIO 地址必须安全返回 false 而非崩溃抛出 500");
    }

    @Test
    @DisplayName("存储工厂策略路由：配置为 local 或 minio 故障时自动优雅降级为本地存储")
    void testStorageFactoryGracefulFallback() {
        // 当配置为 local 时，必路由至 local
        SiteSetting setting = siteSettingService.getSettings();
        setting.setStorageType("local");
        siteSettingService.updateById(setting);

        StorageService service = storageFactory.getStorageService();
        assertEquals("local", service.getStorageType());
        assertTrue(service instanceof LocalStorageServiceImpl);

        // 当配置为 minio 但本地无 MinIO 实例（连通失败）时，自动平滑降级至 local
        setting.setStorageType("minio");
        setting.setMinioEndpoint("http://localhost:19999"); // 无效端口
        siteSettingService.updateById(setting);

        StorageService fallbackService = storageFactory.getStorageService();
        assertNotNull(fallbackService);
        assertEquals("local", fallbackService.getStorageType(), "MinIO 不可达时必须优雅降级至本地存储");
        assertTrue(fallbackService instanceof LocalStorageServiceImpl);
    }
}
