package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.entity.Media;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.mapper.MediaMapper;
import com.hayden.blog.service.MediaService;
import com.hayden.blog.storage.StorageFactory;
import com.hayden.blog.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import com.hayden.blog.dto.PresignedUploadRequest;
import com.hayden.blog.dto.PresignedUploadResponse;
import com.hayden.blog.storage.MinioStorageServiceImpl;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaServiceImpl extends ServiceImpl<MediaMapper, Media> implements MediaService {

    private final StorageFactory storageFactory;
    private final MinioStorageServiceImpl minioStorageService;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm"
    );

    @Override
    public Media uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "上传文件不能为空");
        }

        String originalFilename = file.getOriginalFilename();
        if (!StringUtils.hasText(originalFilename) || !originalFilename.contains(".")) {
            throw new BusinessException(400, "非法文件名或缺失扩展名");
        }

        String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BusinessException(400, "不支持的文件格式，仅允许上传 jpg, jpeg, png, webp, gif 图片与 mp4, webm 视频");
        }

        // 1. 检查二进制魔数与检测真实类型 (包含视频 MP4/WEBM)
        validateMagicNumber(file, ext);

        // 2. 检查恶意脚本注入
        checkMaliciousScript(file);

        // 3. 计算二进制 SHA-256 哈希值 (CAS 内容寻址唯一指纹)
        String fileHash = calculateSha256(file);

        // 4. 企业级内容寻址去重 (CAS 秒传机制)
        if (StringUtils.hasText(fileHash)) {
            Media existingMedia = getOne(new LambdaQueryWrapper<Media>()
                    .eq(Media::getFileHash, fileHash)
                    .last("LIMIT 1"));
            if (existingMedia != null) {
                log.info("触发内容寻址秒传 (CAS Deduplication): hash={}, 原文件名={}, 已存文件名={}, url={}",
                        fileHash, originalFilename, existingMedia.getFilename(), existingMedia.getUrl());
                return existingMedia;
            }
        }

        // 按日期分目录 yyyy/MM，文件名以 SHA-256 哈希为前缀杜绝散列碰撞与重复
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String newFilename = (StringUtils.hasText(fileHash) ? fileHash : UUID.randomUUID().toString().replace("-", "")) + ext;
        String objectKey = datePath + "/" + newFilename;

        StorageService storageService = storageFactory.getStorageService();
        String accessUrl = storageService.upload(file, objectKey);

        // 尝试读取图片尺寸（视频或非图片格式则为 null）
        Integer width = null;
        Integer height = null;
        if (ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png") || ext.equals(".webp") || ext.equals(".gif")) {
            try (java.io.InputStream is = file.getInputStream()) {
                BufferedImage bimg = ImageIO.read(is);
                if (bimg != null) {
                    width = bimg.getWidth();
                    height = bimg.getHeight();
                }
            } catch (Exception ignored) {
            }
        }

        Media media = Media.builder()
                .filename(originalFilename)
                .objectKey(objectKey)
                .url(accessUrl)
                .mimeType(file.getContentType())
                .size(file.getSize())
                .width(width)
                .height(height)
                .storageType(storageService.getStorageType())
                .fileHash(fileHash)
                .createdAt(LocalDateTime.now())
                .build();

        save(media);
        return media;
    }

    /**
     * 计算文件二进制 SHA-256 散列值
     */
    private String calculateSha256(MultipartFile file) {
        try (java.io.InputStream is = file.getInputStream()) {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = is.read(buffer)) != -1) {
                md.update(buffer, 0, read);
            }
            byte[] digest = md.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("计算文件 SHA-256 哈希失败: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public PresignedUploadResponse createPresignedUploadUrl(PresignedUploadRequest request) {
        if (request == null || !StringUtils.hasText(request.getFilename())) {
            throw new BusinessException(400, "文件名不能为空");
        }

        String originalFilename = request.getFilename().trim();
        if (!originalFilename.contains(".")) {
            throw new BusinessException(400, "非法文件名或缺失扩展名");
        }

        String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BusinessException(400, "不支持的文件格式，仅允许上传 jpg, jpeg, png, webp, gif 图片与 mp4, webm 视频");
        }

        // 按日期分目录 yyyy/MM 生成唯一对象键
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String newFilename = UUID.randomUUID().toString().replace("-", "") + ext;
        String objectKey = datePath + "/" + newFilename;

        String uploadUrl = minioStorageService.generatePresignedUploadUrl(objectKey, 3600);
        String publicUrl = minioStorageService.getAccessUrl(objectKey);

        Media media = Media.builder()
                .filename(originalFilename)
                .objectKey(objectKey)
                .url(publicUrl)
                .mimeType(request.getContentType())
                .size(request.getSize() != null ? request.getSize() : 0L)
                .storageType("minio")
                .createdAt(LocalDateTime.now())
                .build();

        save(media);

        return PresignedUploadResponse.builder()
                .uploadUrl(uploadUrl)
                .objectKey(objectKey)
                .publicUrl(publicUrl)
                .storageType("minio")
                .mediaId(media.getId())
                .build();
    }

    /**
     * 校验文件头二进制魔数（支持合规图片与视频）
     */
    private void validateMagicNumber(MultipartFile file, String ext) {
        byte[] header = new byte[16];
        int readBytes;
        try (java.io.InputStream is = file.getInputStream()) {
            readBytes = is.read(header);
        } catch (IOException e) {
            throw new BusinessException(400, "无法读取上传文件流: " + e.getMessage());
        }

        boolean isVideo = ".mp4".equals(ext) || ".webm".equals(ext);
        if (readBytes < 4) {
            if (isVideo) {
                throw new BusinessException(400, "文件体积过小或损坏，无法识别合法视频魔数");
            } else {
                throw new BusinessException(400, "文件体积过小或损坏，无法识别合法图片魔数");
            }
        }

        // JPEG: FF D8 FF
        boolean isJpeg = (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        boolean isPng = readBytes >= 8 &&
                (header[0] & 0xFF) == 0x89 && (header[1] & 0xFF) == 0x50 &&
                (header[2] & 0xFF) == 0x4E && (header[3] & 0xFF) == 0x47 &&
                (header[4] & 0xFF) == 0x0D && (header[5] & 0xFF) == 0x0A &&
                (header[6] & 0xFF) == 0x1A && (header[7] & 0xFF) == 0x0A;

        // GIF: 47 49 46 38 (GIF8)
        boolean isGif = (header[0] & 0xFF) == 0x47 && (header[1] & 0xFF) == 0x49 &&
                (header[2] & 0xFF) == 0x46 && (header[3] & 0xFF) == 0x38;

        // WEBP: 前4字节 RIFF (52 49 46 46)，第8~11字节 WEBP (57 45 42 50)
        boolean isWebp = readBytes >= 12 &&
                (header[0] & 0xFF) == 0x52 && (header[1] & 0xFF) == 0x49 &&
                (header[2] & 0xFF) == 0x46 && (header[3] & 0xFF) == 0x46 &&
                (header[8] & 0xFF) == 0x57 && (header[9] & 0xFF) == 0x45 &&
                (header[10] & 0xFF) == 0x42 && (header[11] & 0xFF) == 0x50;

        // MP4: ISO/IEC 14496-12 规范，前4字节为 box size，第4~7字节为 ftyp (0x66, 0x74, 0x79, 0x70)
        boolean isMp4 = readBytes >= 8 &&
                (header[4] & 0xFF) == 0x66 && (header[5] & 0xFF) == 0x74 &&
                (header[6] & 0xFF) == 0x79 && (header[7] & 0xFF) == 0x70;

        // WEBM: EBML 头魔数 (0x1A, 0x45, 0xDF, 0xA3)
        boolean isWebm = (header[0] & 0xFF) == 0x1A && (header[1] & 0xFF) == 0x45 &&
                (header[2] & 0xFF) == 0xDF && (header[3] & 0xFF) == 0xA3;

        if (isVideo) {
            if (!isMp4 && !isWebm) {
                throw new BusinessException(400, "文件头魔数校验失败，仅支持合法 MP4, WEBM 视频");
            }
        } else {
            if (!isJpeg && !isPng && !isGif && !isWebp) {
                throw new BusinessException(400, "文件头魔数校验失败，仅支持真实 JPG, PNG, WEBP, GIF 图片");
            }
        }
    }

    /**
     * 校验文件内容是否潜藏 HTML/SVG/JavaScript 恶意脚本
     */
    private void checkMaliciousScript(MultipartFile file) {
        try (java.io.InputStream is = file.getInputStream()) {
            byte[] preview = new byte[1024];
            int read = is.read(preview);
            if (read > 0) {
                String content = new String(preview, 0, read, java.nio.charset.StandardCharsets.UTF_8).toLowerCase();
                if (content.contains("<html") || content.contains("<script") ||
                        content.contains("<svg") || content.contains("<?php") ||
                        content.contains("javascript:") || content.contains("onerror=") ||
                        content.contains("onload=")) {
                    throw new BusinessException(400, "检测到非法脚本标签或恶意载荷，拒绝上传");
                }
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.warn("检测恶意脚本异常: {}", e.getMessage());
        }
    }

    @Override
    public PageResult<Media> getMediaList(Long page, Long pageSize, String keyword) {
        LambdaQueryWrapper<Media> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Media::getFilename, keyword);
        }
        wrapper.orderByDesc(Media::getCreatedAt);

        Page<Media> mediaPage = page(new Page<>(page, pageSize), wrapper);
        return PageResult.of(mediaPage.getRecords(), mediaPage.getTotal(), page, pageSize);
    }

    @Override
    public void deleteMedia(Long id) {
        Media media = getById(id);
        if (media != null) {
            try {
                StorageService storageService = storageFactory.getStorageService();
                storageService.delete(media.getObjectKey());
            } catch (Exception e) {
                log.warn("物理删除文件异常: {}", e.getMessage());
            }
            removeById(id);
        }
    }
}
