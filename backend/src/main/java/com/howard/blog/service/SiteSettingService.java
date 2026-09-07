package com.howard.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.howard.blog.dto.SiteSettingUpdateRequest;
import com.howard.blog.entity.SiteSetting;

public interface SiteSettingService extends IService<SiteSetting> {

    SiteSetting getSettings();

    void updateSettings(SiteSettingUpdateRequest request);
}
