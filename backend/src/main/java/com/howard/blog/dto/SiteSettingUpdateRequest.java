package com.howard.blog.dto;

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
    private String lifePulseJson;
}
