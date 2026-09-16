package com.hayden.blog;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class CloudMinioIntegrationTest {

    private static final String ENDPOINT = "http://49.233.166.212:9000";
    private static final String ACCESS_KEY = "minio_y3Qiwz";
    private static final String SECRET_KEY = "minio_BmrdeC";
    private static final String BUCKET = "hayden-blog";

    @Test
    public void testConnectAndEnsureBucket() throws Exception {
        System.out.println("=== 正在测试连接云服务器 MinIO: " + ENDPOINT + " ===");
        MinioClient client = MinioClient.builder()
                .endpoint(ENDPOINT)
                .credentials(ACCESS_KEY, SECRET_KEY)
                .build();

        boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(BUCKET).build());
        System.out.println(">>> Bucket [" + BUCKET + "] 是否已存在: " + exists);

        if (!exists) {
            System.out.println(">>> 正在自动创建 Bucket [" + BUCKET + "] ...");
            client.makeBucket(MakeBucketArgs.builder().bucket(BUCKET).build());
            System.out.println(">>> Bucket [" + BUCKET + "] 创建成功！");
        }

        // 设置只读策略
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
                """.formatted(BUCKET);
        try {
            client.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(BUCKET).config(policy).build());
            System.out.println(">>> Bucket [" + BUCKET + "] 公开只读策略配置成功！");
        } catch (Exception e) {
            System.out.println(">>> 设置策略提示: " + e.getMessage());
        }

        // 上传探活文件
        String testContent = "Hayden Xue Digital Garden MinIO Cloud Integration Verified at " + System.currentTimeMillis();
        byte[] bytes = testContent.getBytes(StandardCharsets.UTF_8);
        client.putObject(PutObjectArgs.builder()
                .bucket(BUCKET)
                .object("health_check.txt")
                .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                .contentType("text/plain")
                .build());

        System.out.println(">>> 探活文件 health_check.txt 上传成功！可访问: " + ENDPOINT + "/" + BUCKET + "/health_check.txt");
        assertTrue(client.bucketExists(BucketExistsArgs.builder().bucket(BUCKET).build()));
        System.out.println("=== 云端 MinIO 全流程实机联调 100% 成功！ ===");
    }
}
