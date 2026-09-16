package com.hayden.blog.storage;

import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.service.SiteSettingService;
import io.minio.BucketExistsArgs;
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
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .region("us-east-1")
                .build();
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

        if (StringUtils.hasText(config.publicUrl())) {
            String pub = config.publicUrl().trim();
            if (pub.endsWith("/")) {
                pub = pub.substring(0, pub.length() - 1);
            }
            if (pub.endsWith("/" + config.bucket())) {
                return pub + "/" + key;
            }
            return pub + "/" + config.bucket() + "/" + key;
        }

        String ep = config.endpoint().trim();
        if (ep.endsWith("/")) {
            ep = ep.substring(0, ep.length() - 1);
        }
        return ep + "/" + config.bucket() + "/" + key;
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
            MinioClient client = buildClient(endpoint, accessKey, secretKey);
            String targetBucket = StringUtils.hasText(bucket) ? bucket : "hayden-blog";
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

    public record MinioConfig(String endpoint, String bucket, String accessKey, String secretKey, String publicUrl) {}
}
