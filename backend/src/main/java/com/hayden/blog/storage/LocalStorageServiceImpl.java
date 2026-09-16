package com.hayden.blog.storage;

import com.hayden.blog.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 本地磁盘存储实现策略
 */
@Slf4j
@Service("localStorageService")
public non-sealed class LocalStorageServiceImpl implements StorageService {

    @Value("${app.upload.dir:./uploads/}")
    private String uploadDir;

    @Value("${app.upload.url-prefix:/uploads/}")
    private String urlPrefix;

    @Override
    public String getStorageType() {
        return "local";
    }

    @Override
    public String upload(MultipartFile file, String objectKey) {
        try {
            Path targetFilePath = prepareTargetPath(objectKey);
            file.transferTo(targetFilePath.toFile());
            return getAccessUrl(objectKey);
        } catch (BusinessException be) {
            throw be;
        } catch (IOException e) {
            log.error("本地磁盘存储文件失败 [key={}]: ", objectKey, e);
            throw new BusinessException(500, "本地文件存储失败: " + e.getMessage());
        }
    }

    @Override
    public String upload(InputStream inputStream, String objectKey, String contentType, long size) {
        try {
            Path targetFilePath = prepareTargetPath(objectKey);
            try (FileOutputStream fos = new FileOutputStream(targetFilePath.toFile())) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    fos.write(buffer, 0, bytesRead);
                }
            }
            return getAccessUrl(objectKey);
        } catch (BusinessException be) {
            throw be;
        } catch (IOException e) {
            log.error("本地磁盘流写入失败 [key={}]: ", objectKey, e);
            throw new BusinessException(500, "本地文件写入失败: " + e.getMessage());
        }
    }

    private Path prepareTargetPath(String objectKey) throws IOException {
        Path targetFilePath = resolveAndValidatePath(objectKey);
        Path parent = targetFilePath.getParent();
        if (parent != null && !Files.exists(parent)) {
            Files.createDirectories(parent);
        }
        return targetFilePath;
    }

    private Path resolveAndValidatePath(String objectKey) {
        if (objectKey == null || objectKey.trim().isEmpty()) {
            throw new BusinessException(400, "存储对象路径不能为空");
        }
        // 统一斜杠并去除前导斜杠，避免绝对路径解析逃逸
        String normalizedKey = objectKey.replace('\\', '/').replaceAll("^/+", "");
        Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path targetPath = baseDir.resolve(normalizedKey).normalize();

        if (!targetPath.startsWith(baseDir)) {
            log.warn("检测到跨目录路径遍历攻击 [key={}, resolved={}]", objectKey, targetPath);
            throw new BusinessException(400, "非法存储对象路径: 检测到跨目录遍历风险");
        }
        return targetPath;
    }

    @Override
    public void delete(String objectKey) {
        try {
            if (objectKey == null || objectKey.trim().isEmpty()) {
                return;
            }
            Path filePath = resolveAndValidatePath(objectKey);
            Files.deleteIfExists(filePath);
        } catch (BusinessException be) {
            log.warn("拒绝删除越界非法存储路径 [key={}]: {}", objectKey, be.getMessage());
        } catch (Exception e) {
            log.warn("本地物理删除文件异常 [key={}]: {}", objectKey, e.getMessage());
        }
    }

    @Override
    public String getAccessUrl(String objectKey) {
        if (objectKey == null) {
            return urlPrefix;
        }
        String prefix = urlPrefix.endsWith("/") ? urlPrefix : urlPrefix + "/";
        String key = objectKey.replace('\\', '/').replaceAll("^/+", "");
        return prefix + key;
    }

    @Override
    public boolean testConnection() {
        try {
            Path dir = Paths.get(uploadDir);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }
            return Files.isWritable(dir);
        } catch (Exception e) {
            log.warn("本地存储可写检测异常: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public InputStream getInputStream(String objectKey) {
        Path filePath = resolveAndValidatePath(objectKey);
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new BusinessException(404, "本地存储文件不存在: " + objectKey);
        }
        try {
            return Files.newInputStream(filePath);
        } catch (IOException e) {
            log.error("读取本地文件流异常 [key={}]: ", objectKey, e);
            throw new BusinessException(500, "读取本地文件流失败: " + e.getMessage());
        }
    }
}
