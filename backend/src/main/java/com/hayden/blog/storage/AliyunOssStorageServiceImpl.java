package com.hayden.blog.storage;

import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.service.SiteSettingService;
import io.minio.*;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 阿里云 OSS 专属对象存储服务实现
 * 基于 AWS S3 兼容协议与阿里云官方接入点规范，具备动态地域识别、虚拟主机域名自动转换与高并发直传能力
 */
@Slf4j
@Service
public final class AliyunOssStorageServiceImpl implements StorageService {

    private final SiteSettingService siteSettingService;

    public AliyunOssStorageServiceImpl(@Lazy SiteSettingService siteSettingService) {
        this.siteSettingService = siteSettingService;
    }

    @Override
    public String getStorageType() {
        return "oss";
    }

    /**
     * 获取当前生效的阿里云 OSS 专属配置
     */
    public OssConfig getEffectiveConfig() {
        String endpoint = "";
        String bucket = "";
        String accessKey = "";
        String secretKey = "";
        String publicUrl = "";

        try {
            SiteSetting setting = siteSettingService.getSettings();
            if (setting != null) {
                if (StringUtils.hasText(setting.getOssEndpoint())) {
                    endpoint = setting.getOssEndpoint().trim();
                }
                if (StringUtils.hasText(setting.getOssBucket())) {
                    bucket = setting.getOssBucket().trim();
                }
                if (StringUtils.hasText(setting.getOssAccessKey())) {
                    accessKey = setting.getOssAccessKey().trim();
                }
                if (StringUtils.hasText(setting.getOssSecretKey())) {
                    secretKey = setting.getOssSecretKey().trim();
                }
                if (StringUtils.hasText(setting.getOssPublicUrl())) {
                    publicUrl = setting.getOssPublicUrl().trim();
                }
            }
        } catch (Exception e) {
            log.debug("获取阿里云 OSS 动态配置失败: {}", e.getMessage());
        }

        return new OssConfig(endpoint, bucket, accessKey, secretKey, publicUrl);
    }

    public boolean isConfigured() {
        OssConfig config = getEffectiveConfig();
        return StringUtils.hasText(config.endpoint()) &&
                StringUtils.hasText(config.bucket()) &&
                StringUtils.hasText(config.accessKey()) &&
                StringUtils.hasText(config.secretKey());
    }

    public MinioClient buildClient(String endpoint, String accessKey, String secretKey) {
        String normalizedEndpoint = normalizeEndpoint(endpoint);
        String region = resolveRegion(normalizedEndpoint);
        MinioClient.Builder builder = MinioClient.builder()
                .endpoint(normalizedEndpoint)
                .credentials(accessKey, secretKey);
        if (StringUtils.hasText(region)) {
            builder.region(region);
        }
        return builder.build();
    }

    public String normalizeEndpoint(String endpoint) {
        if (!StringUtils.hasText(endpoint)) {
            return "";
        }
        String ep = endpoint.trim();
        if (!ep.startsWith("http://") && !ep.startsWith("https://")) {
            ep = "https://" + ep;
        }
        if (ep.endsWith("/")) {
            ep = ep.substring(0, ep.length() - 1);
        }
        return ep;
    }

    public String resolveRegion(String endpoint) {
        if (!StringUtils.hasText(endpoint)) {
            return "cn-hangzhou";
        }
        String lower = endpoint.toLowerCase();
        // 匹配阿里云 OSS 域名，如 oss-cn-hangzhou.aliyuncs.com 或 s3.oss-cn-beijing.aliyuncs.com
        Pattern pattern = Pattern.compile("(?:oss|s3\\.oss)-([a-z0-9-]+)\\.aliyuncs\\.com");
        Matcher matcher = pattern.matcher(lower);
        if (matcher.find()) {
            return matcher.group(1); // 返回地域 ID 如 cn-beijing, cn-hangzhou
        }
        return "cn-hangzhou";
    }

    @Override
    public String upload(MultipartFile file, String objectKey) {
        try (InputStream inputStream = file.getInputStream()) {
            return upload(inputStream, objectKey, file.getContentType(), file.getSize());
        } catch (Exception e) {
            log.error("阿里云 OSS 文件上传失败 [key={}]: ", objectKey, e);
            throw new BusinessException(500, "阿里云 OSS 文件上传失败: " + e.getMessage());
        }
    }

    @Override
    public String upload(InputStream inputStream, String objectKey, String contentType, long size) {
        OssConfig config = getEffectiveConfig();
        try {
            MinioClient client = buildClient(config.endpoint(), config.accessKey(), config.secretKey());
            String mimeType = StringUtils.hasText(contentType) ? contentType : "application/octet-stream";

            client.putObject(PutObjectArgs.builder()
                    .bucket(config.bucket())
                    .object(objectKey)
                    .stream(inputStream, size, -1)
                    .contentType(mimeType)
                    .build());

            return getAccessUrl(objectKey);
        } catch (Exception e) {
            log.error("阿里云 OSS 写入失败 [bucket={}, key={}]: ", config.bucket(), objectKey, e);
            throw new BusinessException(500, "阿里云 OSS 写入失败: " + e.getMessage());
        }
    }

    @Override
    public void delete(String objectKey) {
        OssConfig config = getEffectiveConfig();
        try {
            MinioClient client = buildClient(config.endpoint(), config.accessKey(), config.secretKey());
            client.removeObject(RemoveObjectArgs.builder()
                    .bucket(config.bucket())
                    .object(objectKey)
                    .build());
        } catch (Exception e) {
            log.warn("阿里云 OSS 对象删除异常 [bucket={}, key={}]: {}", config.bucket(), objectKey, e.getMessage());
        }
    }

    @Override
    public String getAccessUrl(String objectKey) {
        OssConfig config = getEffectiveConfig();
        String key = objectKey.startsWith("/") ? objectKey.substring(1) : objectKey;
        String bucket = config.bucket() != null ? config.bucket().trim() : "";

        if (StringUtils.hasText(config.publicUrl())) {
            String pub = config.publicUrl().trim();
            if (pub.endsWith("/")) {
                pub = pub.substring(0, pub.length() - 1);
            }
            // 若 Public URL 已经包含了 bucket（如 https://hayden-blog.oss-cn-hangzhou.aliyuncs.com）
            if (StringUtils.hasText(bucket) && (pub.endsWith("/" + bucket) || pub.contains("://" + bucket + ".") || pub.contains("." + bucket + "."))) {
                return pub + "/" + key;
            }
            // 若为地域主域名 https://oss-cn-beijing.aliyuncs.com 且未包含 bucket，转换为规范的虚拟主机域名
            if (StringUtils.hasText(bucket) && pub.contains(".aliyuncs.com") && !pub.contains(bucket)) {
                return pub.replace("://", "://" + bucket + ".") + "/" + key;
            }
            return StringUtils.hasText(bucket) ? pub + "/" + bucket + "/" + key : pub + "/" + key;
        }

        String ep = normalizeEndpoint(config.endpoint());
        if (StringUtils.hasText(bucket) && ep.contains(".aliyuncs.com") && !ep.contains(bucket)) {
            return ep.replace("://", "://" + bucket + ".") + "/" + key;
        }
        return StringUtils.hasText(bucket) ? ep + "/" + bucket + "/" + key : ep + "/" + key;
    }

    @Override
    public boolean testConnection() {
        OssConfig config = getEffectiveConfig();
        return testConnection(config.endpoint(), config.bucket(), config.accessKey(), config.secretKey());
    }

    public boolean testConnection(String endpoint, String bucket, String accessKey, String secretKey) {
        if (!StringUtils.hasText(endpoint) || !StringUtils.hasText(accessKey) || !StringUtils.hasText(secretKey)) {
            return false;
        }
        try {
            String normEndpoint = normalizeEndpoint(endpoint);
            MinioClient client = buildClient(normEndpoint, accessKey.trim(), secretKey.trim());
            String targetBucket = StringUtils.hasText(bucket) ? bucket.trim() : "hayden-blog";
            try {
                return client.bucketExists(BucketExistsArgs.builder().bucket(targetBucket).build());
            } catch (Exception be) {
                String errorMsg = be.getMessage() != null ? be.getMessage() : "";
                if (errorMsg.toLowerCase().contains("access denied") || errorMsg.toLowerCase().contains("accessdenied")) {
                    String probeKey = "uploads/.oss_ping_" + System.currentTimeMillis();
                    byte[] probeBytes = "ping".getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(probeBytes)) {
                        client.putObject(PutObjectArgs.builder()
                                .bucket(targetBucket)
                                .object(probeKey)
                                .stream(bais, probeBytes.length, -1)
                                .contentType("text/plain")
                                .build());
                    }
                    try {
                        client.removeObject(RemoveObjectArgs.builder().bucket(targetBucket).object(probeKey).build());
                    } catch (Exception ignored) {}
                    return true;
                }
                throw be;
            }
        } catch (Exception e) {
            log.warn("阿里云 OSS 连通性测试未通过 [endpoint={}, bucket={}]: {}", endpoint, bucket, e.getMessage());
            return false;
        }
    }

    /**
     * 生成阿里云 OSS 预签名 PUT 直传链接
     */
    public String generatePresignedUploadUrl(String objectKey, int expirySeconds) {
        OssConfig config = getEffectiveConfig();
        if (!isConfigured()) {
            throw new BusinessException(500, "阿里云 OSS 对象存储未配置或凭据不完整");
        }
        try {
            MinioClient client = buildClient(config.endpoint(), config.accessKey(), config.secretKey());
            return client.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.PUT)
                            .bucket(config.bucket())
                            .object(objectKey)
                            .expiry(expirySeconds, TimeUnit.SECONDS)
                            .build()
            );
        } catch (Exception e) {
            log.error("生成阿里云 OSS 预签名上传链接失败 [bucket={}, key={}]: ", config.bucket(), objectKey, e);
            throw new BusinessException(500, "生成阿里云预签名上传 URL 失败: " + e.getMessage());
        }
    }

    public record OssConfig(String endpoint, String bucket, String accessKey, String secretKey, String publicUrl) {}
}
