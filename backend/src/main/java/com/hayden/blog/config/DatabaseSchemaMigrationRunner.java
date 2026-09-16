package com.hayden.blog.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.HashSet;
import java.util.Set;

/**
 * 数据库自适应安全表结构迁移器
 * 在服务启动时自动检测并补齐缺失的字段，兼容 MySQL 与 H2，彻底杜绝 Unknown column 异常。
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class DatabaseSchemaMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Checking and patching database schema definitions...");
        try (Connection conn = jdbcTemplate.getDataSource().getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            String databaseProductName = metaData.getDatabaseProductName().toLowerCase();
            boolean isH2 = databaseProductName.contains("h2");

            // 1. site_settings 表结构补齐
            patchTableColumn(conn, metaData, "site_settings", "hero_title", "VARCHAR(255)");
            patchTableColumn(conn, metaData, "site_settings", "hero_slogan", "VARCHAR(255)");
            patchTableColumn(conn, metaData, "site_settings", "hero_description", "TEXT");
            patchTableColumn(conn, metaData, "site_settings", "about_bio_zh", "TEXT");
            patchTableColumn(conn, metaData, "site_settings", "about_bio_en", "TEXT");
            patchTableColumn(conn, metaData, "site_settings", "about_interests", "TEXT");
            patchTableColumn(conn, metaData, "site_settings", "announcement_enabled", "INT DEFAULT 0");
            patchTableColumn(conn, metaData, "site_settings", "announcement_text", "VARCHAR(255)");
            patchTableColumn(conn, metaData, "site_settings", "announcement_link", "VARCHAR(255)");
            patchTableColumn(conn, metaData, "site_settings", "footer_text", "VARCHAR(255)");
            patchTableColumn(conn, metaData, "site_settings", "icp_number", "VARCHAR(100)");
            patchTableColumn(conn, metaData, "site_settings", "bg_music_url", "VARCHAR(500)");
            patchTableColumn(conn, metaData, "site_settings", "ai_enabled", "INT DEFAULT 1");
            patchTableColumn(conn, metaData, "site_settings", "ai_base_url", "VARCHAR(255) DEFAULT 'https://token.sensenova.cn/v1'");
            patchTableColumn(conn, metaData, "site_settings", "ai_model", "VARCHAR(100) DEFAULT 'deepseek-v4-flash'");
            patchTableColumn(conn, metaData, "site_settings", "ai_api_key", "VARCHAR(255)");
            patchTableColumn(conn, metaData, "site_settings", "ai_system_prompt", "TEXT");
            patchTableColumn(conn, metaData, "site_settings", "life_pulse_json", "TEXT");
            patchTableColumn(conn, metaData, "site_settings", "hero_bg_type", "VARCHAR(20) DEFAULT 'video'");
            patchTableColumn(conn, metaData, "site_settings", "hero_video_url", "VARCHAR(500)");
            patchTableColumn(conn, metaData, "site_settings", "hero_slogan_config_json", "TEXT");
            patchTableColumn(conn, metaData, "site_settings", "storage_type", "VARCHAR(20) DEFAULT 'minio'");
            patchTableColumn(conn, metaData, "site_settings", "minio_endpoint", "VARCHAR(255) DEFAULT ''");
            patchTableColumn(conn, metaData, "site_settings", "minio_bucket", "VARCHAR(100) DEFAULT ''");
            patchTableColumn(conn, metaData, "site_settings", "minio_access_key", "VARCHAR(255) DEFAULT ''");
            patchTableColumn(conn, metaData, "site_settings", "minio_secret_key", "VARCHAR(255) DEFAULT ''");
            patchTableColumn(conn, metaData, "site_settings", "minio_public_url", "VARCHAR(255) DEFAULT ''");
            patchTableColumn(conn, metaData, "site_settings", "reader_daily_ai_quota", "INT DEFAULT 15");
            patchTableColumn(conn, metaData, "site_settings", "comment_moderation_enabled", "INT DEFAULT 1");
            patchTableColumn(conn, metaData, "site_settings", "admin_comment_exempt", "INT DEFAULT 1");

            // 2. posts 表结构补齐
            patchTableColumn(conn, metaData, "posts", "like_count", "INT DEFAULT 0");
            patchTableColumn(conn, metaData, "posts", "lang", "VARCHAR(10) DEFAULT 'zh'");
            patchTableColumn(conn, metaData, "posts", "translation_post_id", "BIGINT DEFAULT NULL");
            patchTableColumn(conn, metaData, "posts", "maturity", "VARCHAR(20) DEFAULT 'BUDDING'");
            patchTableColumn(conn, metaData, "posts", "revision_count", "INT DEFAULT 1");

            // 3. now_records 表结构补齐
            patchTableColumn(conn, metaData, "now_records", "focus_topics_json", "TEXT");
            patchTableColumn(conn, metaData, "now_records", "reading_notes_json", "TEXT");
            patchTableColumn(conn, metaData, "now_records", "current_city", "VARCHAR(100) DEFAULT '杭州 · 滨江'");
            patchTableColumn(conn, metaData, "now_records", "micro_logs_json", "TEXT");
            patchTableColumn(conn, metaData, "now_records", "music_track_json", "TEXT");
            patchTableColumn(conn, metaData, "now_records", "mood_status", "VARCHAR(100) DEFAULT '⚡ 深度心流 85%'");
            patchTableColumn(conn, metaData, "now_records", "movies_json", "TEXT");

            // 4. friends 表结构补齐
            patchTableColumn(conn, metaData, "friends", "ping_status", "VARCHAR(20) DEFAULT 'ONLINE'");
            patchTableColumn(conn, metaData, "friends", "last_ping_time", isH2 ? "TIMESTAMP" : "DATETIME");
            patchTableColumn(conn, metaData, "friends", "response_time_ms", "BIGINT DEFAULT 45");

            // 5. users 表结构补齐
            patchTableColumn(conn, metaData, "users", "last_login_ip", "VARCHAR(50)");
            patchTableColumn(conn, metaData, "users", "last_login_time", isH2 ? "TIMESTAMP" : "DATETIME");
            patchTableColumn(conn, metaData, "users", "bio", "TEXT");
            patchTableColumn(conn, metaData, "users", "github", "VARCHAR(255)");
            patchTableColumn(conn, metaData, "users", "website", "VARCHAR(255)");

            // 6. media 表结构补齐
            patchTableColumn(conn, metaData, "media", "storage_type", "VARCHAR(20) DEFAULT 'minio'");
            patchTableColumn(conn, metaData, "media", "file_hash", "VARCHAR(64) DEFAULT NULL");

            // 7. memos 表结构补齐
            patchTableColumn(conn, metaData, "memos", "location", "VARCHAR(255)");
            patchTableColumn(conn, metaData, "memos", "mood", "VARCHAR(50)");
            patchTableColumn(conn, metaData, "memos", "weather", "VARCHAR(50)");
            patchTableColumn(conn, metaData, "memos", "tags", "VARCHAR(500)");

            // 8. comments/journeys/projects like_count 补齐
            patchTableColumn(conn, metaData, "comments", "like_count", "INT DEFAULT 0");
            patchTableColumn(conn, metaData, "journeys", "like_count", "INT DEFAULT 0");
            patchTableColumn(conn, metaData, "projects", "like_count", "INT DEFAULT 0");

            // 9. notifications 表自适应创建
            try {
                String createNotificationsSql = isH2
                        ? "CREATE TABLE IF NOT EXISTS notifications ("
                        + "id BIGINT AUTO_INCREMENT PRIMARY KEY, "
                        + "user_id BIGINT NOT NULL, "
                        + "sender_id BIGINT, "
                        + "sender_name VARCHAR(100), "
                        + "sender_avatar VARCHAR(255), "
                        + "type VARCHAR(50) NOT NULL, "
                        + "target_type VARCHAR(20), "
                        + "target_id BIGINT, "
                        + "target_title VARCHAR(255), "
                        + "content TEXT, "
                        + "is_read INT DEFAULT 0, "
                        + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        + ")"
                        : "CREATE TABLE IF NOT EXISTS notifications ("
                        + "id BIGINT AUTO_INCREMENT PRIMARY KEY, "
                        + "user_id BIGINT NOT NULL, "
                        + "sender_id BIGINT, "
                        + "sender_name VARCHAR(100), "
                        + "sender_avatar VARCHAR(255), "
                        + "type VARCHAR(50) NOT NULL, "
                        + "target_type VARCHAR(20), "
                        + "target_id BIGINT, "
                        + "target_title VARCHAR(255), "
                        + "content TEXT, "
                        + "is_read INT DEFAULT 0, "
                        + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
                        + "INDEX idx_notifications_user_id(user_id)"
                        + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
                jdbcTemplate.execute(createNotificationsSql);
            } catch (Exception e) {
                log.debug("notifications table creation note: {}", e.getMessage());
            }

            log.info("Database schema patch completed successfully.");
        } catch (Exception e) {
            log.warn("Auto schema migration encountered a non-fatal warning: {}", e.getMessage());
        }
    }

    private void patchTableColumn(Connection conn, DatabaseMetaData metaData, String tableName, String columnName, String columnDefinition) {
        try {
            Set<String> existingColumns = new HashSet<>();
            try (ResultSet rs = metaData.getColumns(conn.getCatalog(), null, tableName, null)) {
                while (rs.next()) {
                    existingColumns.add(rs.getString("COLUMN_NAME").toLowerCase());
                }
            }
            if (existingColumns.isEmpty()) {
                try (ResultSet rs = metaData.getColumns(conn.getCatalog(), null, tableName.toUpperCase(), null)) {
                    while (rs.next()) {
                        existingColumns.add(rs.getString("COLUMN_NAME").toLowerCase());
                    }
                }
            }

            if (!existingColumns.contains(columnName.toLowerCase())) {
                String sql = String.format("ALTER TABLE %s ADD COLUMN %s %s", tableName, columnName, columnDefinition);
                log.info("Applying schema migration: {}", sql);
                jdbcTemplate.execute(sql);
            }
        } catch (Exception e) {
            // 忽略重复列异常，保证启动不中断
            log.debug("Column {} on table {} may already exist or error: {}", columnName, tableName, e.getMessage());
        }
    }
}
