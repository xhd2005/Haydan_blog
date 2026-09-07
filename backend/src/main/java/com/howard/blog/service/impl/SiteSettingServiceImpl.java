package com.howard.blog.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.howard.blog.dto.SiteSettingUpdateRequest;
import com.howard.blog.entity.SiteSetting;
import com.howard.blog.mapper.SiteSettingMapper;
import com.howard.blog.service.SiteSettingService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class SiteSettingServiceImpl extends ServiceImpl<SiteSettingMapper, SiteSetting> implements SiteSettingService {

    @Override
    public SiteSetting getSettings() {
        SiteSetting setting = getById(1L);
        if (setting == null) {
            setting = SiteSetting.builder()
                    .id(1L)
                    .siteName("Hayden Xue Personal Blog")
                    .siteDescription("Software developer and lifelong learner exploring technology, AI, and the world.")
                    .slogan("From the East, toward the unknown.")
                    .bio("I'm Hayden Xue, a software developer and lifelong learner exploring technology, AI, and the world.")
                    .email("hayden.xue@example.com")
                    .githubUrl("https://github.com")
                    .seoTitle("Hayden Xue - Personal Blog & Digital Garden")
                    .seoDescription("Personal blog and digital space of Hayden Xue.")
                    .updatedAt(LocalDateTime.now())
                    .build();
            save(setting);
        }
        return setting;
    }

    @Override
    public void updateSettings(SiteSettingUpdateRequest request) {
        SiteSetting setting = getById(1L);
        if (setting == null) {
            setting = new SiteSetting();
            setting.setId(1L);
        }

        if (request.getSiteName() != null) setting.setSiteName(request.getSiteName());
        if (request.getSiteDescription() != null) setting.setSiteDescription(request.getSiteDescription());
        if (request.getSlogan() != null) setting.setSlogan(request.getSlogan());
        if (request.getBio() != null) setting.setBio(request.getBio());
        if (request.getLogo() != null) setting.setLogo(request.getLogo());
        if (request.getAvatar() != null) setting.setAvatar(request.getAvatar());
        if (request.getEmail() != null) setting.setEmail(request.getEmail());
        if (request.getGithubUrl() != null) setting.setGithubUrl(request.getGithubUrl());
        if (request.getTwitterUrl() != null) setting.setTwitterUrl(request.getTwitterUrl());
        if (request.getInstagramUrl() != null) setting.setInstagramUrl(request.getInstagramUrl());
        if (request.getSeoTitle() != null) setting.setSeoTitle(request.getSeoTitle());
        if (request.getSeoDescription() != null) setting.setSeoDescription(request.getSeoDescription());
        if (request.getHeroTitle() != null) setting.setHeroTitle(request.getHeroTitle());
        if (request.getHeroSlogan() != null) setting.setHeroSlogan(request.getHeroSlogan());
        if (request.getHeroDescription() != null) setting.setHeroDescription(request.getHeroDescription());
        if (request.getAboutBioZh() != null) setting.setAboutBioZh(request.getAboutBioZh());
        if (request.getAboutBioEn() != null) setting.setAboutBioEn(request.getAboutBioEn());
        if (request.getAboutInterests() != null) setting.setAboutInterests(request.getAboutInterests());
        if (request.getAnnouncementEnabled() != null) setting.setAnnouncementEnabled(request.getAnnouncementEnabled());
        if (request.getAnnouncementText() != null) setting.setAnnouncementText(request.getAnnouncementText());
        if (request.getAnnouncementLink() != null) setting.setAnnouncementLink(request.getAnnouncementLink());
        if (request.getFooterText() != null) setting.setFooterText(request.getFooterText());
        if (request.getIcpNumber() != null) setting.setIcpNumber(request.getIcpNumber());
        if (request.getBgMusicUrl() != null) setting.setBgMusicUrl(request.getBgMusicUrl());
        if (request.getAiEnabled() != null) setting.setAiEnabled(request.getAiEnabled());
        if (request.getAiBaseUrl() != null) setting.setAiBaseUrl(request.getAiBaseUrl());
        if (request.getAiModel() != null) setting.setAiModel(request.getAiModel());
        if (request.getAiApiKey() != null) setting.setAiApiKey(request.getAiApiKey());
        if (request.getAiSystemPrompt() != null) setting.setAiSystemPrompt(request.getAiSystemPrompt());
        if (request.getLifePulseJson() != null) setting.setLifePulseJson(request.getLifePulseJson());
        setting.setUpdatedAt(LocalDateTime.now());

        saveOrUpdate(setting);
    }
}
