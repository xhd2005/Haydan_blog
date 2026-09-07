package com.howard.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("site_settings")
public class SiteSetting implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

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
    private LocalDateTime updatedAt;
}
