package com.howard.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.howard.blog.common.PageResult;
import com.howard.blog.entity.Media;
import com.howard.blog.exception.BusinessException;
import com.howard.blog.mapper.MediaMapper;
import com.howard.blog.service.MediaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
public class MediaServiceImpl extends ServiceImpl<MediaMapper, Media> implements MediaService {

    @Value("${app.upload.dir:./uploads/}")
    private String uploadDir;

    @Value("${app.upload.url-prefix:/uploads/}")
    private String urlPrefix;

    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of(
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
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
            throw new BusinessException(400, "不支持的文件格式，仅允许上传 jpg, jpeg, png, webp, gif 图片");
        }

        // 1. 检查二进制魔数与检测真实类型
        validateMagicNumber(file);

        // 2. 检查恶意脚本注入
        checkMaliciousScript(file);

        // 按日期分目录 yyyy/MM
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String newFilename = UUID.randomUUID().toString().replace("-", "") + ext;
        String objectKey = datePath + "/" + newFilename;

        Path targetDirPath = Paths.get(uploadDir, datePath);
        try {
            if (!Files.exists(targetDirPath)) {
                Files.createDirectories(targetDirPath);
            }
            Path targetFilePath = targetDirPath.resolve(newFilename);
            file.transferTo(targetFilePath.toFile());

            // 尝试读取图片宽高
            Integer width = null;
            Integer height = null;
            try {
                BufferedImage bimg = ImageIO.read(targetFilePath.toFile());
                if (bimg != null) {
                    width = bimg.getWidth();
                    height = bimg.getHeight();
                }
            } catch (Exception ignored) {
            }

            String accessUrl = urlPrefix + objectKey;

            Media media = Media.builder()
                    .filename(originalFilename)
                    .objectKey(objectKey)
                    .url(accessUrl)
                    .mimeType(file.getContentType())
                    .size(file.getSize())
                    .width(width)
                    .height(height)
                    .createdAt(LocalDateTime.now())
                    .build();

            save(media);
            return media;
        } catch (IOException e) {
            log.error("文件上传失败: ", e);
            throw new BusinessException(500, "文件上传保存失败: " + e.getMessage());
        }
    }

    /**
     * 校验文件头二进制魔数
     */
    private void validateMagicNumber(MultipartFile file) {
        byte[] header = new byte[16];
        int readBytes;
        try (java.io.InputStream is = file.getInputStream()) {
            readBytes = is.read(header);
        } catch (IOException e) {
            throw new BusinessException(400, "无法读取上传文件流: " + e.getMessage());
        }

        if (readBytes < 4) {
            throw new BusinessException(400, "文件体积过小或损坏，无法识别合法图片魔数");
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

        if (!isJpeg && !isPng && !isGif && !isWebp) {
            throw new BusinessException(400, "文件头魔数校验失败，仅支持真实 JPG, PNG, WEBP, GIF 图片");
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
                Path filePath = Paths.get(uploadDir, media.getObjectKey());
                Files.deleteIfExists(filePath);
            } catch (Exception e) {
                log.warn("物理删除文件异常: {}", e.getMessage());
            }
            removeById(id);
        }
    }
}
