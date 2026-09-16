package com.hayden.blog.controller;

import com.hayden.blog.common.PageResult;
import com.hayden.blog.common.Result;
import com.hayden.blog.dto.PresignedUploadRequest;
import com.hayden.blog.dto.PresignedUploadResponse;
import com.hayden.blog.entity.Media;
import com.hayden.blog.service.MediaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class MediaController {

    private final MediaService mediaService;

    @GetMapping
    public Result<PageResult<Media>> getMediaList(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "12") Long pageSize,
            @RequestParam(required = false) String keyword) {
        return Result.success(mediaService.getMediaList(page, pageSize, keyword));
    }

    @PostMapping("/presigned-url")
    public Result<PresignedUploadResponse> getPresignedUploadUrl(@Valid @RequestBody PresignedUploadRequest request) {
        return Result.success(mediaService.createPresignedUploadUrl(request));
    }

    @PostMapping("/upload")
    public Result<Media> upload(@RequestParam("file") MultipartFile file) {
        return Result.success(mediaService.uploadFile(file));
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteMedia(@PathVariable Long id) {
        mediaService.deleteMedia(id);
        return Result.success();
    }
}
