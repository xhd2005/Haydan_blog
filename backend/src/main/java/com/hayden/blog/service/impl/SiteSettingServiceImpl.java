package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.config.CacheConfig;
import com.hayden.blog.dto.MinioTestResult;
import com.hayden.blog.dto.SiteSettingUpdateRequest;
import com.hayden.blog.dto.TestMinioRequest;
import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.mapper.SiteSettingMapper;
import com.hayden.blog.service.SiteSettingService;
import com.hayden.blog.storage.MinioStorageServiceImpl;
import io.minio.BucketExistsArgs;
import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Slf4j
@Service
public class SiteSettingServiceImpl extends ServiceImpl<SiteSettingMapper, SiteSetting> implements SiteSettingService {

    private final MinioStorageServiceImpl minioStorageService;
    private final com.hayden.blog.storage.AliyunOssStorageServiceImpl aliyunOssStorageService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public SiteSettingServiceImpl(@Lazy MinioStorageServiceImpl minioStorageService,
                                  @Lazy com.hayden.blog.storage.AliyunOssStorageServiceImpl aliyunOssStorageService) {
        this.minioStorageService = minioStorageService;
        this.aliyunOssStorageService = aliyunOssStorageService;
    }

    @jakarta.annotation.PostConstruct
    public void initOssStorageColumns() {
        if (jdbcTemplate == null) return;
        String[] cols = {
                "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS oss_endpoint VARCHAR(255) NULL",
                "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS oss_bucket VARCHAR(128) NULL",
                "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS oss_access_key VARCHAR(255) NULL",
                "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS oss_secret_key VARCHAR(255) NULL",
                "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS oss_public_url VARCHAR(255) NULL"
        };
        for (String sql : cols) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception ignored) {
            }
        }
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_SITE_SETTINGS, key = "'global'")
    public SiteSetting getSettings() {
        SiteSetting setting = getById(1L);
        if (setting == null) {
            setting = SiteSetting.builder()
                    .id(1L)
                    .siteName("Hayden Xue Personal Blog")
                    .siteDescription("Software developer and lifelong learner exploring technology, AI, and the world.")
                    .slogan("From the East, toward the unknown.")
                    .bio("I'm Hayden Xue, a software developer and lifelong learner exploring technology, AI, and the world.")
                    .email("hayden.xue@example.com")
                    .githubUrl("https://github.com")
                    .seoTitle("Hayden Xue - Personal Blog & Digital Garden")
                    .seoDescription("Personal blog and digital space of Hayden Xue.")
                    .heroBgType("video")
                    .storageType("local")
                    .minioBucket("hayden-blog")
                    .updatedAt(LocalDateTime.now())
                    .build();
            save(setting);
        }
        return setting;
    }

    @Override
    @CacheEvict(value = CacheConfig.CACHE_SITE_SETTINGS, key = "'global'")
    public void updateSettings(SiteSettingUpdateRequest request) {
        SiteSetting setting = getById(1L);
        if (setting == null) {
            setting = new SiteSetting();
            setting.setId(1L);
        }

        if (request.getSiteName() != null) setting.setSiteName(request.getSiteName());
        if (request.getSiteDescription() != null) setting.setSiteDescription(request.getSiteDescription());
        if (request.getSlogan() != null) setting.setSlogan(request.getSlogan());
        if (request.getBio() != null) setting.setBio(request.getBio());
        if (request.getLogo() != null) setting.setLogo(request.getLogo());
        if (request.getAvatar() != null) setting.setAvatar(request.getAvatar());
        if (request.getEmail() != null) setting.setEmail(request.getEmail());
        if (request.getGithubUrl() != null) setting.setGithubUrl(request.getGithubUrl());
        if (request.getTwitterUrl() != null) setting.setTwitterUrl(request.getTwitterUrl());
        if (request.getInstagramUrl() != null) setting.setInstagramUrl(request.getInstagramUrl());
        if (request.getSeoTitle() != null) setting.setSeoTitle(request.getSeoTitle());
        if (request.getSeoDescription() != null) setting.setSeoDescription(request.getSeoDescription());
        if (request.getHeroTitle() != null) setting.setHeroTitle(request.getHeroTitle());
        if (request.getHeroSlogan() != null) setting.setHeroSlogan(request.getHeroSlogan());
        if (request.getHeroDescription() != null) setting.setHeroDescription(request.getHeroDescription());
        if (request.getAboutBioZh() != null) setting.setAboutBioZh(request.getAboutBioZh());
        if (request.getAboutBioEn() != null) setting.setAboutBioEn(request.getAboutBioEn());
        if (request.getAboutInterests() != null) setting.setAboutInterests(request.getAboutInterests());
        if (request.getAnnouncementEnabled() != null) setting.setAnnouncementEnabled(request.getAnnouncementEnabled());
        if (request.getAnnouncementText() != null) setting.setAnnouncementText(request.getAnnouncementText());
        if (request.getAnnouncementLink() != null) setting.setAnnouncementLink(request.getAnnouncementLink());
        if (request.getFooterText() != null) setting.setFooterText(request.getFooterText());
        if (request.getIcpNumber() != null) setting.setIcpNumber(request.getIcpNumber());
        if (request.getBgMusicUrl() != null) setting.setBgMusicUrl(request.getBgMusicUrl());
        if (request.getAiEnabled() != null) setting.setAiEnabled(request.getAiEnabled());
        if (request.getAiBaseUrl() != null) setting.setAiBaseUrl(request.getAiBaseUrl());
        if (request.getAiModel() != null) setting.setAiModel(request.getAiModel());
        if (request.getAiApiKey() != null) setting.setAiApiKey(request.getAiApiKey());
        if (request.getAiSystemPrompt() != null) setting.setAiSystemPrompt(request.getAiSystemPrompt());
        if (request.getAiProvidersJson() != null) setting.setAiProvidersJson(request.getAiProvidersJson());
        if (request.getLifePulseJson() != null) setting.setLifePulseJson(request.getLifePulseJson());

        // Hero 动态视觉配置
        if (request.getHeroBgType() != null) setting.setHeroBgType(request.getHeroBgType());
        if (request.getHeroVideoUrl() != null) setting.setHeroVideoUrl(request.getHeroVideoUrl());
        if (request.getHeroSloganConfigJson() != null) setting.setHeroSloganConfigJson(request.getHeroSloganConfigJson());
        if (request.getPageVisualsJson() != null) setting.setPageVisualsJson(request.getPageVisualsJson());

        // 对象存储与 MinIO 配置
        if (request.getStorageType() != null) setting.setStorageType(request.getStorageType());
        if (request.getMinioEndpoint() != null) setting.setMinioEndpoint(request.getMinioEndpoint());
        if (request.getMinioBucket() != null) setting.setMinioBucket(request.getMinioBucket());
        if (request.getMinioAccessKey() != null) setting.setMinioAccessKey(request.getMinioAccessKey());
        if (request.getMinioSecretKey() != null) setting.setMinioSecretKey(request.getMinioSecretKey());
        if (request.getMinioPublicUrl() != null) setting.setMinioPublicUrl(request.getMinioPublicUrl());

        // 阿里云 OSS 专属配置
        if (request.getOssEndpoint() != null) setting.setOssEndpoint(request.getOssEndpoint());
        if (request.getOssBucket() != null) setting.setOssBucket(request.getOssBucket());
        if (request.getOssAccessKey() != null) setting.setOssAccessKey(request.getOssAccessKey());
        if (request.getOssSecretKey() != null) setting.setOssSecretKey(request.getOssSecretKey());
        if (request.getOssPublicUrl() != null) setting.setOssPublicUrl(request.getOssPublicUrl());

        setting.setUpdatedAt(LocalDateTime.now());
        saveOrUpdate(setting);
    }

    @Override
    public MinioTestResult testMinioConnection(TestMinioRequest request) {
        MinioStorageServiceImpl.MinioConfig currentConfig = minioStorageService.getEffectiveConfig();

        String endpoint = (request != null && StringUtils.hasText(request.getEndpoint()))
                ? request.getEndpoint().trim() : currentConfig.endpoint();
        String bucket = (request != null && StringUtils.hasText(request.getBucket()))
                ? request.getBucket().trim() : (StringUtils.hasText(currentConfig.bucket()) ? currentConfig.bucket() : "hayden-blog");
        String accessKey = (request != null && StringUtils.hasText(request.getAccessKey()))
                ? request.getAccessKey().trim() : currentConfig.accessKey();
        // 关键防护：如果请求中 secretKey 为空，自动继承数据库已有的有效 secretKey
        String secretKey = (request != null && StringUtils.hasText(request.getSecretKey()))
                ? request.getSecretKey().trim() : currentConfig.secretKey();

        long start = System.currentTimeMillis();
        try {
            if (!StringUtils.hasText(endpoint)) {
                return MinioTestResult.builder()
                        .success(false)
                        .latencyMs(0)
                        .message("MinIO Endpoint 服务端点未配置")
                        .bucket(bucket)
                        .build();
            }
            if (!StringUtils.hasText(accessKey) || !StringUtils.hasText(secretKey)) {
                return MinioTestResult.builder()
                        .success(false)
                        .latencyMs(0)
                        .message("MinIO AccessKey 或 SecretKey 凭据未配置")
                        .bucket(bucket)
                        .build();
            }

            MinioClient client = minioStorageService.buildClient(endpoint, accessKey, secretKey);
            String targetBucket = StringUtils.hasText(bucket) ? bucket : "hayden-blog";

            boolean exists = false;
            try {
                exists = client.bucketExists(BucketExistsArgs.builder().bucket(targetBucket).build());
            } catch (Exception be) {
                String errorMsg = be.getMessage() != null ? be.getMessage() : "";
                // 常见云存储或子账号仅授予 PutObject/GetObject 权限，而拒绝了 HeadBucket / ListBucket 策略
                if (errorMsg.toLowerCase().contains("access denied") || errorMsg.toLowerCase().contains("accessdenied")) {
                    log.info("MinIO bucketExists 权限受限 (Access Denied)，尝试轻量对象读写探针验证连通性...");
                    try {
                        String probeKey = "uploads/.ping_probe_" + System.currentTimeMillis();
                        byte[] probeBytes = "ping".getBytes(java.nio.charset.StandardCharsets.UTF_8);
                        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(probeBytes)) {
                            client.putObject(io.minio.PutObjectArgs.builder()
                                    .bucket(targetBucket)
                                    .object(probeKey)
                                    .stream(bais, probeBytes.length, -1)
                                    .contentType("text/plain")
                                    .build());
                        }
                        try {
                            client.removeObject(io.minio.RemoveObjectArgs.builder()
                                    .bucket(targetBucket)
                                    .object(probeKey)
                                    .build());
                        } catch (Exception ignored) {}
                        exists = true;
                        log.info("MinIO 对象写入探针成功，存储桶功能正常可用");
                    } catch (Exception writeEx) {
                        log.warn("MinIO 探针写入同样失败: {}", writeEx.getMessage());
                        throw be;
                    }
                } else {
                    throw be;
                }
            }

            long latency = System.currentTimeMillis() - start;

            return MinioTestResult.builder()
                    .success(true)
                    .latencyMs(latency)
                    .message("MinIO 连通成功，存储桶 [" + targetBucket + "] " + (exists ? "已就绪" : "不存在但服务正常连接"))
                    .bucket(targetBucket)
                    .build();
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            log.warn("MinIO 连通性测试未通过: {}", e.getMessage());
            String cleanMsg = e.getMessage() != null ? e.getMessage() : "未知连接错误";
            return MinioTestResult.builder()
                    .success(false)
                    .latencyMs(latency)
                    .message(cleanMsg)
                    .bucket(bucket)
                    .build();
        }
    }

    @Override
    public MinioTestResult testOssConnection(TestMinioRequest request) {
        com.hayden.blog.storage.AliyunOssStorageServiceImpl.OssConfig currentConfig = aliyunOssStorageService.getEffectiveConfig();

        String endpoint = (request != null && StringUtils.hasText(request.getEndpoint()))
                ? request.getEndpoint().trim() : currentConfig.endpoint();
        String bucket = (request != null && StringUtils.hasText(request.getBucket()))
                ? request.getBucket().trim() : (StringUtils.hasText(currentConfig.bucket()) ? currentConfig.bucket() : "hayden-blog");
        String accessKey = (request != null && StringUtils.hasText(request.getAccessKey()))
                ? request.getAccessKey().trim() : currentConfig.accessKey();
        String secretKey = (request != null && StringUtils.hasText(request.getSecretKey()))
                ? request.getSecretKey().trim() : currentConfig.secretKey();

        long start = System.currentTimeMillis();
        try {
            if (!StringUtils.hasText(endpoint)) {
                return MinioTestResult.builder()
                        .success(false)
                        .latencyMs(0)
                        .message("阿里云 OSS Endpoint 服务端点未填写")
                        .bucket(bucket)
                        .build();
            }
            if (!StringUtils.hasText(accessKey) || !StringUtils.hasText(secretKey)) {
                return MinioTestResult.builder()
                        .success(false)
                        .latencyMs(0)
                        .message("AccessKey ID 或 AccessKey Secret 未填写")
                        .bucket(bucket)
                        .build();
            }

            io.minio.MinioClient client = aliyunOssStorageService.buildClient(endpoint, accessKey, secretKey);
            String targetBucket = StringUtils.hasText(bucket) ? bucket : "hayden-blog";
            boolean exists;
            try {
                exists = client.bucketExists(io.minio.BucketExistsArgs.builder().bucket(targetBucket).build());
            } catch (Exception be) {
                String errorMsg = be.getMessage() != null ? be.getMessage() : "";
                if (errorMsg.toLowerCase().contains("access denied") || errorMsg.toLowerCase().contains("accessdenied")) {
                    String probeKey = "uploads/.oss_ping_" + System.currentTimeMillis();
                    byte[] probeBytes = "ping".getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(probeBytes)) {
                        client.putObject(io.minio.PutObjectArgs.builder()
                                .bucket(targetBucket)
                                .object(probeKey)
                                .stream(bais, probeBytes.length, -1)
                                .contentType("text/plain")
                                .build());
                    }
                    try {
                        client.removeObject(io.minio.RemoveObjectArgs.builder()
                                .bucket(targetBucket)
                                .object(probeKey)
                                .build());
                    } catch (Exception ignored) {}
                    exists = true;
                    log.info("阿里云 OSS 写入探针验证成功，Bucket 读写正常");
                } else {
                    throw be;
                }
            }

            long latency = System.currentTimeMillis() - start;
            return MinioTestResult.builder()
                    .success(true)
                    .latencyMs(latency)
                    .message("阿里云 OSS 连通成功！存储空间 [" + targetBucket + "] " + (exists ? "已就绪" : "不存在但服务正常连接"))
                    .bucket(targetBucket)
                    .build();
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            log.warn("阿里云 OSS 连通性测试失败: {}", e.getMessage());
            String cleanMsg = e.getMessage() != null ? e.getMessage() : "未知连接错误";
            return MinioTestResult.builder()
                    .success(false)
                    .latencyMs(latency)
                    .message("阿里云 OSS 连通失败: " + cleanMsg)
                    .bucket(bucket)
                    .build();
        }
    }
}
