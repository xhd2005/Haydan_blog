package com.hayden.blog.vo;

import com.hayden.blog.entity.SiteSetting;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.BeanUtils;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 站点公开设置视图对象 (白名单安全 DTO)
 *
 * 杜绝泄露敏感系统凭证：
 * - 排除 aiProvidersJson (含第三方服务商 API Key)
 * - 排除 aiApiKey
 * - 排除 aiSystemPrompt (内部系统提示词)
 * - 排除 minioAccessKey
 * - 排除 minioSecretKey
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteSettingPublicVO implements Serializable {

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
    private String lifePulseJson;

    // Hero 动态视觉配置 (video / webgl)
    private String heroBgType;
    private String heroVideoUrl;
    private String heroSloganConfigJson;
    private String pageVisualsJson;

    // 分布式对象存储与 MinIO / 阿里云 OSS 配置 (仅公开存储类型与公共端点及 Bucket，排除 AccessKey 与 SecretKey)
    private String storageType;
    private String minioEndpoint;
    private String minioBucket;
    private String minioPublicUrl;
    private String ossEndpoint;
    private String ossBucket;
    private String ossPublicUrl;

    private Integer readerDailyAiQuota;
    private Integer commentModerationEnabled;

    private LocalDateTime updatedAt;

    public static SiteSettingPublicVO from(SiteSetting raw) {
        if (raw == null) {
            return null;
        }
        SiteSettingPublicVO vo = new SiteSettingPublicVO();
        BeanUtils.copyProperties(raw, vo);
        return vo;
    }
}
