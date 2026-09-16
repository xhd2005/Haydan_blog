package com.hayden.blog.storage;

import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.service.SiteSettingService;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.SetBucketPolicyArgs;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

/**
 * 基于 MinIO / S3 兼容协议的分布式对象存储实现策略
 */
@Slf4j
@Service("minioStorageService")
public non-sealed class MinioStorageServiceImpl implements StorageService {

    @Value("${app.minio.endpoint:http://localhost:9000}")
    private String defaultEndpoint;

    @Value("${app.minio.bucket:hayden-blog}")
    private String defaultBucket;

    @Value("${app.minio.access-key:minioadmin}")
    private String defaultAccessKey;

    @Value("${app.minio.secret-key:minioadmin}")
    private String defaultSecretKey;

    @Value("${app.minio.public-url:}")
    private String defaultPublicUrl;

    private final SiteSettingService siteSettingService;

    public MinioStorageServiceImpl(@Lazy SiteSettingService siteSettingService) {
        this.siteSettingService = siteSettingService;
    }

    @Override
    public String getStorageType() {
        return "minio";
    }

    /**
     * 获取生效的 MinIO 连接参数
     */
    public MinioConfig getEffectiveConfig() {
        String endpoint = defaultEndpoint;
        String bucket = defaultBucket;
        String accessKey = defaultAccessKey;
        String secretKey = defaultSecretKey;
        String publicUrl = defaultPublicUrl;

        try {
            SiteSetting setting = siteSettingService.getSettings();
            if (setting != null) {
                if (StringUtils.hasText(setting.getMinioEndpoint())) {
                    endpoint = setting.getMinioEndpoint().trim();
                }
                if (StringUtils.hasText(setting.getMinioBucket())) {
                    bucket = setting.getMinioBucket().trim();
                }
                if (StringUtils.hasText(setting.getMinioAccessKey())) {
                    accessKey = setting.getMinioAccessKey().trim();
                }
                if (StringUtils.hasText(setting.getMinioSecretKey())) {
                    secretKey = setting.getMinioSecretKey().trim();
                }
                if (StringUtils.hasText(setting.getMinioPublicUrl())) {
                    publicUrl = setting.getMinioPublicUrl().trim();
                }
            }
        } catch (Exception e) {
            log.debug("获取动态 SiteSetting 配置失败，使用 application.yml 默认配置: {}", e.getMessage());
        }

        return new MinioConfig(endpoint, bucket, accessKey, secretKey, publicUrl);
    }

    /**
     * 判断 MinIO 是否已配置关键参数
     */
    public boolean isConfigured() {
        MinioConfig config = getEffectiveConfig();
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

    private String normalizeEndpoint(String endpoint) {
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

    private String resolveRegion(String endpoint) {
        if (!StringUtils.hasText(endpoint)) {
            return "us-east-1";
        }
        String lower = endpoint.toLowerCase();
        // 匹配阿里云 OSS 域名，如 oss-cn-hangzhou.aliyuncs.com 或 s3.oss-cn-beijing.aliyuncs.com
        if (lower.contains(".aliyuncs.com")) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?:oss|s3\\.oss)-([a-z0-9-]+)\\.aliyuncs\\.com");
            java.util.regex.Matcher matcher = pattern.matcher(lower);
            if (matcher.find()) {
                return matcher.group(1); // 返回如 cn-hangzhou, cn-beijing
            }
            return "cn-hangzhou"; // 默认 fallback
        }
        // 匹配 AWS S3 域名
        if (lower.contains(".amazonaws.com")) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("s3\\.([a-z0-9-]+)\\.amazonaws\\.com");
            java.util.regex.Matcher matcher = pattern.matcher(lower);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        // 本地自建 MinIO 默认 us-east-1
        return "us-east-1";
    }

    @Override
    public String upload(MultipartFile file, String objectKey) {
        try (InputStream inputStream = file.getInputStream()) {
            return upload(inputStream, objectKey, file.getContentType(), file.getSize());
        } catch (Exception e) {
            log.error("MinIO 文件上传失败 [key={}]: ", objectKey, e);
            throw new BusinessException(500, "MinIO 文件上传保存失败: " + e.getMessage());
        }
    }

    @Override
    public String upload(InputStream inputStream, String objectKey, String contentType, long size) {
        MinioConfig config = getEffectiveConfig();
        try {
            MinioClient client = buildClient(config.endpoint(), config.accessKey(), config.secretKey());
            ensureBucketExists(client, config.bucket());

            String mimeType = StringUtils.hasText(contentType) ? contentType : "application/octet-stream";

            client.putObject(PutObjectArgs.builder()
                    .bucket(config.bucket())
                    .object(objectKey)
                    .stream(inputStream, size, -1)
                    .contentType(mimeType)
                    .build());

            return getAccessUrl(objectKey);
        } catch (Exception e) {
            log.error("MinIO 流式写入失败 [bucket={}, key={}]: ", config.bucket(), objectKey, e);
            throw new BusinessException(500, "MinIO 对象存储写入失败: " + e.getMessage());
        }
    }

    /**
     * 生成 S3 / MinIO PUT 预签名上传 URL，供客户端直接直传对象存储
     */
    public String generatePresignedUploadUrl(String objectKey, int expirySeconds) {
        MinioConfig config = getEffectiveConfig();
        if (!isConfigured()) {
            throw new BusinessException(500, "MinIO 对象存储未配置或凭据不完整");
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
            log.error("生成 MinIO 预签名上传链接失败 [bucket={}, key={}]: ", config.bucket(), objectKey, e);
            throw new BusinessException(500, "生成预签名上传 URL 失败: " + e.getMessage());
        }
    }

    private void ensureBucketExists(MinioClient client, String bucket) throws Exception {
        boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!exists) {
            client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            // 设置公共只读策略
            String policy = """
                    {
                      "Version": "2012-10-17",
                      "Statement": [
                        {
                          "Action": ["s3:GetObject"],
                          "Effect": "Allow",
                          "Principal": "*",
                          "Resource": ["arn:aws:s3:::%s/*"]
                        }
                      ]
                    }
                    """.formatted(bucket);
            try {
                client.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucket).config(policy).build());
            } catch (Exception ex) {
                log.warn("设置 MinIO Bucket 公开策略失败（可忽略）: {}", ex.getMessage());
            }
        }
    }

    @Override
    public void delete(String objectKey) {
        MinioConfig config = getEffectiveConfig();
        try {
            MinioClient client = buildClient(config.endpoint(), config.accessKey(), config.secretKey());
            client.removeObject(RemoveObjectArgs.builder()
                    .bucket(config.bucket())
                    .object(objectKey)
                    .build());
        } catch (Exception e) {
            log.warn("MinIO 对象删除异常 [bucket={}, key={}]: {}", config.bucket(), objectKey, e.getMessage());
        }
    }

    @Override
    public String getAccessUrl(String objectKey) {
        MinioConfig config = getEffectiveConfig();
        String key = objectKey.startsWith("/") ? objectKey.substring(1) : objectKey;
        String bucket = config.bucket() != null ? config.bucket().trim() : "";

        if (StringUtils.hasText(config.publicUrl())) {
            String pub = config.publicUrl().trim();
            if (pub.endsWith("/")) {
                pub = pub.substring(0, pub.length() - 1);
            }
            // 如果 Public URL 已经以 /bucket 结尾，或者主机名中已经包含该 bucket（例如 https://mybucket.oss-cn-hangzhou.aliyuncs.com 或 cdn 域名）
            if (StringUtils.hasText(bucket) && (pub.endsWith("/" + bucket) || pub.contains("://" + bucket + ".") || pub.contains("." + bucket + "."))) {
                return pub + "/" + key;
            }
            // 如果是阿里云 OSS 默认域名如 https://oss-cn-hangzhou.aliyuncs.com，智能转换为虚拟主机格式 https://bucket.oss-cn-hangzhou.aliyuncs.com/key
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
        MinioConfig config = getEffectiveConfig();
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
                    String probeKey = "uploads/.ping_probe_" + System.currentTimeMillis();
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
            log.warn("MinIO 连通性测试未通过 [endpoint={}, bucket={}]: {}", endpoint, bucket, e.getMessage());
            return false;
        }
    }

    @Override
    public InputStream getInputStream(String objectKey) {
        MinioConfig config = getEffectiveConfig();
        try {
            MinioClient client = buildClient(config.endpoint(), config.accessKey(), config.secretKey());
            return client.getObject(
                    GetObjectArgs.builder()
                            .bucket(config.bucket())
                            .object(objectKey)
                            .build()
            );
        } catch (Exception e) {
            log.error("读取 MinIO 文件流失败 [bucket={}, key={}]: {}", config.bucket(), objectKey, e.getMessage());
            throw new BusinessException(404, "MinIO 对象不存在或读取失败: " + e.getMessage());
        }
    }

    public record MinioConfig(String endpoint, String bucket, String accessKey, String secretKey, String publicUrl) {}
}
