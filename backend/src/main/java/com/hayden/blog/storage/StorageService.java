package com.hayden.blog.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * 统一多媒体存储服务策略接口
 */
public sealed interface StorageService permits LocalStorageServiceImpl, MinioStorageServiceImpl {

    /**
     * 获取当前存储策略类型名称 (e.g. "local", "minio")
     */
    String getStorageType();

    /**
     * 上传 Spring MultipartFile
     *
     * @param file      上传的文件
     * @param objectKey 目标相对存储路径，例如 "2026/09/uuid.jpg"
     * @return 可公网/相对访问的资源 URL
     */
    String upload(MultipartFile file, String objectKey);

    /**
     * 通过标准 InputStream 流式上传
     *
     * @param inputStream 输入流
     * @param objectKey   目标相对存储路径
     * @param contentType MIME 类型
     * @param size        文件字节大小
     * @return 可公网/相对访问的资源 URL
     */
    String upload(InputStream inputStream, String objectKey, String contentType, long size);

    /**
     * 删除指定路径的对象
     *
     * @param objectKey 目标相对存储路径
     */
    void delete(String objectKey);

    /**
     * 获取指定对象的公网访问 URL
     *
     * @param objectKey 目标相对存储路径
     * @return 访问直链
     */
    String getAccessUrl(String objectKey);

    /**
     * 测试存储后端连通性与可用性
     *
     * @return 是否正常可用
     */
    boolean testConnection();
}
