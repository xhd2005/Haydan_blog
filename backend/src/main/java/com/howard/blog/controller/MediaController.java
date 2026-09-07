package com.howard.blog.controller;

import com.howard.blog.common.PageResult;
import com.howard.blog.common.Result;
import com.howard.blog.entity.Media;
import com.howard.blog.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @GetMapping
    public Result<PageResult<Media>> getMediaList(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "12") Long pageSize,
            @RequestParam(required = false) String keyword) {
        return Result.success(mediaService.getMediaList(page, pageSize, keyword));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Media> upload(@RequestParam("file") MultipartFile file) {
        return Result.success(mediaService.uploadFile(file));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteMedia(@PathVariable Long id) {
        mediaService.deleteMedia(id);
        return Result.success();
    }
}
