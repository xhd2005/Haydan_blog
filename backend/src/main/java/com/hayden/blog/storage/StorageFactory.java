package com.hayden.blog.storage;

import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.service.SiteSettingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 存储策略工厂 / 动态路由服务
 * 支持根据后台系统配置或配置文件选择存储后端，并提供 MinIO 故障或未配置时的自动优雅降级机制
 */
@Slf4j
@Component
public class StorageFactory {

    private final LocalStorageServiceImpl localStorageService;
    private final MinioStorageServiceImpl minioStorageService;
    private final SiteSettingService siteSettingService;

    @Value("${app.storage.type:local}")
    private String defaultStorageType;

    public StorageFactory(LocalStorageServiceImpl localStorageService,
                          MinioStorageServiceImpl minioStorageService,
                          @Lazy SiteSettingService siteSettingService) {
        this.localStorageService = localStorageService;
        this.minioStorageService = minioStorageService;
        this.siteSettingService = siteSettingService;
    }

    /**
     * 获取当前生效的存储服务实例
     * 若配置为 minio 但 MinIO 未配置或连接不可达，自动平滑回退至 local 存储
     */
    public StorageService getStorageService() {
        String configuredType = defaultStorageType;
        try {
            SiteSetting setting = siteSettingService.getSettings();
            if (setting != null && StringUtils.hasText(setting.getStorageType())) {
                configuredType = setting.getStorageType().trim().toLowerCase();
            }
        } catch (Exception e) {
            log.debug("读取 SiteSetting 存储配置异常，使用默认策略: {}", e.getMessage());
        }

        if ("minio".equalsIgnoreCase(configuredType)) {
            if (minioStorageService.isConfigured()) {
                boolean reachable = minioStorageService.testConnection();
                if (reachable) {
                    return minioStorageService;
                } else {
                    log.warn("MinIO 对象存储已配置但连通失败，已自动优雅降级为本地磁盘存储 (Local Storage)");
                    return localStorageService;
                }
            } else {
                log.info("MinIO 对象存储关键凭据未完整配置，自动回退使用本地磁盘存储 (Local Storage)");
                return localStorageService;
            }
        }

        return localStorageService;
    }

    public StorageService getLocalStorageService() {
        return localStorageService;
    }

    public StorageService getMinioStorageService() {
        return minioStorageService;
    }

    /**
     * Java 25 模式匹配 switch 针对 Sealed Interface 封闭类型的穷尽性分发
     */
    public String describeStorageBackend(StorageService service) {
        return switch (service) {
            case LocalStorageServiceImpl local -> "Local Disk Storage at " + local.getStorageType();
            case MinioStorageServiceImpl minio -> "MinIO Cloud Storage at " + minio.getStorageType();
        };
    }
}
