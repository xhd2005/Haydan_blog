package com.hayden.blog.entity;

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
    private String aiProvidersJson;
    private String lifePulseJson;

    // Hero 动态视觉配置 (video / webgl)
    private String heroBgType;
    private String heroVideoUrl;
    private String heroSloganConfigJson;
    private String pageVisualsJson;

    // 分布式对象存储与 MinIO 配置 (local / minio)
    private String storageType;
    private String minioEndpoint;
    private String minioBucket;
    private String minioAccessKey;
    private String minioSecretKey;
    private String minioPublicUrl;

    // AI 读者配额与评论审核控制
    private Integer readerDailyAiQuota; // 读者每日 AI 额度 (默认 15 次)
    private Integer commentModerationEnabled; // 全站评论是否先审后发 (1: 是, 0: 否)
    private Integer adminCommentExempt; // 站长发评是否免审 (1: 是, 0: 否)

    private LocalDateTime updatedAt;
}
