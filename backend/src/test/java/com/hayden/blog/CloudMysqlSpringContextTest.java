package com.hayden.blog;

import com.hayden.blog.entity.Post;
import com.hayden.blog.entity.SiteSetting;
import com.hayden.blog.service.PostService;
import com.hayden.blog.service.SiteSettingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:mysql://${DB_HOST:49.233.166.212}:${DB_PORT:3306}/${DB_NAME:hayden_blog}?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true",
    "spring.datasource.username=${DB_USER:root}",
    "spring.datasource.password=${DB_PASS:mysql_xass6G}",
    "spring.data.redis.host=${REDIS_HOST:49.233.166.212}",
    "spring.data.redis.password=${REDIS_PASSWORD:redis_caKGch}"
})
public class CloudMysqlSpringContextTest {

    @Autowired
    private SiteSettingService siteSettingService;

    @Autowired
    private PostService postService;

    @Test
    public void testSpringBootDevProfileWithCloudMysql() {
        System.out.println("=== 正在通过 Spring Boot (dev Profile) 检验连接云服务器 MySQL ===");
        
        SiteSetting settings = siteSettingService.getSettings();
        assertNotNull(settings, "云端数据库 site_settings 记录应存在");
        System.out.println(">>> 获取到云端站点名称: " + settings.getSiteName());
        System.out.println(">>> 云端 MinIO 端点配置: " + settings.getMinioEndpoint());
        System.out.println(">>> 存储策略类型: " + settings.getStorageType());

        List<Post> posts = postService.list();
        assertNotNull(posts);
        System.out.println(">>> 获取到云端博文总数: " + posts.size());
        for (Post p : posts) {
            System.out.println("    * [" + p.getId() + "] " + p.getTitle() + " (" + p.getSlug() + ")");
        }

        assertTrue(posts.size() >= 3, "初始博文数应不少于 3 篇");
        System.out.println("=== Spring Boot 与云端 MySQL 联动校验 100% 成功！ ===");
    }
}
