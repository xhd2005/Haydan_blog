package com.hayden.blog.dto;

import lombok.Data;

@Data
public class SiteSettingUpdateRequest {

    private String siteName;
    private String siteDescription;
    private String slogan;
    private String bio;
    private String logo;
    private String avatar;
    private String email;
    private String githubUrl;
    private String twitterUrl;
    private String instagramUrl;
    private String seoTitle;
    private String seoDescription;
    private String heroTitle;
    private String heroSlogan;
    private String heroDescription;
    private String aboutBioZh;
    private String aboutBioEn;
    private String aboutInterests;
    private Integer announcementEnabled;
    private String announcementText;
    private String announcementLink;
    private String footerText;
    private String icpNumber;
    private String bgMusicUrl;
    private Integer aiEnabled;
    private String aiBaseUrl;
    private String aiModel;
    private String aiApiKey;
    private String aiSystemPrompt;
    private String aiProvidersJson;
    private String lifePulseJson;

    // Hero 动态视觉配置
    private String heroBgType;
    private String heroVideoUrl;
    private String heroSloganConfigJson;
    private String pageVisualsJson;

    // 对象存储配置 (local / minio / oss)
    private String storageType;
    private String minioEndpoint;
    private String minioBucket;
    private String minioAccessKey;
    private String minioSecretKey;
    private String minioPublicUrl;

    // 阿里云 OSS 专属配置
    private String ossEndpoint;
    private String ossBucket;
    private String ossAccessKey;
    private String ossSecretKey;
    private String ossPublicUrl;

    // AI 读者配额与评论审核控制
    private Integer readerDailyAiQuota;
    private Integer commentModerationEnabled;
    private Integer adminCommentExempt;
}
