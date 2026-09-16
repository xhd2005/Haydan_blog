package com.hayden.blog.controller;

import com.hayden.blog.common.Result;
import com.hayden.blog.dto.SiteSettingUpdateRequest;
import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.service.SiteSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SiteSettingController {

    private final SiteSettingService siteSettingService;

    @GetMapping
    public Result<?> getSettings() {
        SiteSetting raw = siteSettingService.getSettings();
        if (raw == null) {
            return Result.success(null);
        }
        if (com.hayden.blog.security.SecurityUtils.isAdmin()) {
            return Result.success(raw);
        }
        return Result.success(com.hayden.blog.vo.SiteSettingPublicVO.from(raw));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateSettings(@RequestBody SiteSettingUpdateRequest request) {
        siteSettingService.updateSettings(request);
        return Result.success();
    }

    @PostMapping("/test-minio")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<com.hayden.blog.dto.MinioTestResult> testMinio(@RequestBody(required = false) com.hayden.blog.dto.TestMinioRequest request) {
        return Result.success(siteSettingService.testMinioConnection(request));
    }
}
