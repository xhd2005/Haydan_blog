package com.howard.blog.controller;

import com.howard.blog.common.Result;
import com.howard.blog.dto.SiteSettingUpdateRequest;
import com.howard.blog.entity.SiteSetting;
import com.howard.blog.service.SiteSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SiteSettingController {

    private final SiteSettingService siteSettingService;

    @GetMapping
    public Result<SiteSetting> getSettings() {
        SiteSetting raw = siteSettingService.getSettings();
        if (raw == null) {
            return Result.success(null);
        }
        SiteSetting response = new SiteSetting();
        org.springframework.beans.BeanUtils.copyProperties(raw, response);
        if (!com.howard.blog.security.SecurityUtils.isAdmin()) {
            response.setAiApiKey(null);
        }
        return Result.success(response);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateSettings(@RequestBody SiteSettingUpdateRequest request) {
        siteSettingService.updateSettings(request);
        return Result.success();
    }
}
