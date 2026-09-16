package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.dto.SiteSettingUpdateRequest;
import com.hayden.blog.entity.SiteSetting;

public interface SiteSettingService extends IService<SiteSetting> {

    SiteSetting getSettings();

    void updateSettings(SiteSettingUpdateRequest request);

    com.hayden.blog.dto.MinioTestResult testMinioConnection(com.hayden.blog.dto.TestMinioRequest request);

    com.hayden.blog.dto.MinioTestResult testOssConnection(com.hayden.blog.dto.TestMinioRequest request);
}
