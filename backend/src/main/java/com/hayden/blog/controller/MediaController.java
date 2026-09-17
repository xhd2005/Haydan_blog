package com.hayden.blog.controller;

import com.hayden.blog.annotation.AuditLog;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.common.Result;
import com.hayden.blog.dto.MediaStreamResponse;
import com.hayden.blog.dto.PresignedUploadRequest;
import com.hayden.blog.dto.PresignedUploadResponse;
import com.hayden.blog.entity.Media;
import com.hayden.blog.service.MediaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.HandlerMapping;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    /**
     * 公开多媒体流式代理接口 (支持 /api/media/view/** 与 /api/media/stream/**)
     * 解决阿里云 OSS 默认域名强制下载 (Content-Disposition: attachment) 的合规限制，
     * 重写为 Content-Disposition: inline 并注入 1 年长效强缓存与 ETag 协商缓存。
     */
    @RequestMapping(value = {"/view/**", "/stream/**"}, method = {RequestMethod.GET, RequestMethod.HEAD})
    @PreAuthorize("permitAll()")
    public ResponseEntity<Resource> streamMedia(HttpServletRequest request, WebRequest webRequest) {
        String fullPath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String bestMatchPattern = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String objectKey = new AntPathMatcher().extractPathWithinPattern(bestMatchPattern, fullPath);
        if (objectKey != null && objectKey.startsWith("/")) {
            objectKey = objectKey.substring(1);
        }

        if (!StringUtils.hasText(objectKey)) {
            return ResponseEntity.notFound().build();
        }

        String eTag = "\"" + Integer.toHexString(objectKey.hashCode()) + "\"";
        if (webRequest.checkNotModified(eTag)) {
            return null; // 触发 HTTP 304 Not Modified
        }

        MediaStreamResponse streamResponse = mediaService.getMediaStream(objectKey);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(streamResponse.contentType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .eTag(eTag);

        if (streamResponse.contentLength() > 0) {
            builder.contentLength(streamResponse.contentLength());
        }

        return builder.body(new InputStreamResource(streamResponse.inputStream()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<Media>> getMediaList(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "12") Long pageSize,
            @RequestParam(required = false) String keyword) {
        return Result.success(mediaService.getMediaList(page, pageSize, keyword));
    }

    @AuditLog(module = "媒体资产", operation = "生成直传预签名凭据")
    @PostMapping("/presigned-url")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PresignedUploadResponse> getPresignedUploadUrl(@Valid @RequestBody PresignedUploadRequest request) {
        return Result.success(mediaService.createPresignedUploadUrl(request));
    }

    @AuditLog(module = "媒体资产", operation = "上传媒体文件")
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Media> upload(@RequestParam("file") MultipartFile file) {
        return Result.success(mediaService.uploadFile(file));
    }

    @AuditLog(module = "媒体资产", operation = "删除媒体文件")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteMedia(@PathVariable Long id) {
        mediaService.deleteMedia(id);
        return Result.success();
    }
}
