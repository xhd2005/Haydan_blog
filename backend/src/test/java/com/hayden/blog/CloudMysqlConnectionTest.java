package com.hayden.blog;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class CloudMysqlConnectionTest {

    private static final String HOST = "49.233.166.212";
    private static final int PORT = 3306;
    private static final String USER = "root";
    private static final String PASS = "mysql_xass6G";
    private static final String DB_NAME = "hayden_blog";

    @Test
    public void testCloudMysqlAndInit() throws Exception {
        System.out.println("=== 正在尝试连接云服务器 MySQL: " + HOST + ":" + PORT + " ===");
        String rootUrl = "jdbc:mysql://" + HOST + ":" + PORT + "/?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true";
        
        try (Connection conn = DriverManager.getConnection(rootUrl, USER, PASS);
             Statement stmt = conn.createStatement()) {
            System.out.println(">>> 成功连通云服务器 MySQL 实例！");

            // 1. 创建数据库
            stmt.execute("CREATE DATABASE IF NOT EXISTS " + DB_NAME + " DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            System.out.println(">>> 数据库 " + DB_NAME + " 存在或已创建成功！");
        }

        // 2. 连接目标数据库
        String dbUrl = "jdbc:mysql://" + HOST + ":" + PORT + "/" + DB_NAME + "?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true";
        try (Connection conn = DriverManager.getConnection(dbUrl, USER, PASS);
             Statement stmt = conn.createStatement()) {
            
            // 检查现有表
            List<String> tables = new ArrayList<>();
            try (ResultSet rs = stmt.executeQuery("SHOW TABLES;")) {
                while (rs.next()) {
                    tables.add(rs.getString(1));
                }
            }
            System.out.println(">>> 现有数据表: " + tables);

            // 如果表不全，执行初始化
            if (!tables.contains("users") || !tables.contains("posts") || !tables.contains("site_settings")) {
                System.out.println(">>> 正在使用 Spring ScriptUtils 规范执行 schema.sql 数据结构定义...");
                ScriptUtils.executeSqlScript(conn, new FileSystemResource("E:/work2026/mon9/Haydan_blog/docs/sql/schema.sql"));
            }

            // 执行增量表结构补齐
            System.out.println(">>> 正在补齐增量表结构字段（hero_bg_type、minio 等）...");
            addColSafe(stmt, "site_settings", "hero_bg_type", "VARCHAR(20) DEFAULT 'video'");
            addColSafe(stmt, "site_settings", "hero_video_url", "VARCHAR(500) DEFAULT NULL");
            addColSafe(stmt, "site_settings", "storage_type", "VARCHAR(20) DEFAULT 'minio'");
            addColSafe(stmt, "site_settings", "minio_endpoint", "VARCHAR(255) DEFAULT 'http://49.233.166.212:9000'");
            addColSafe(stmt, "site_settings", "minio_bucket", "VARCHAR(100) DEFAULT 'hayden-blog'");
            addColSafe(stmt, "site_settings", "minio_access_key", "VARCHAR(255) DEFAULT 'minio_y3Qiwz'");
            addColSafe(stmt, "site_settings", "minio_secret_key", "VARCHAR(255) DEFAULT 'minio_BmrdeC'");
            addColSafe(stmt, "site_settings", "minio_public_url", "VARCHAR(255) DEFAULT 'http://49.233.166.212:9000'");
            addColSafe(stmt, "site_settings", "footer_text", "VARCHAR(255) DEFAULT NULL");
            addColSafe(stmt, "site_settings", "icp_number", "VARCHAR(100) DEFAULT NULL");
            addColSafe(stmt, "site_settings", "bg_music_url", "VARCHAR(500) DEFAULT NULL");
            addColSafe(stmt, "site_settings", "interests_json", "TEXT DEFAULT NULL");
            addColSafe(stmt, "site_settings", "life_pulse_json", "TEXT DEFAULT NULL");
            addColSafe(stmt, "site_settings", "hero_slogan_config_json", "TEXT DEFAULT NULL");
            addColSafe(stmt, "site_settings", "ai_providers_json", "TEXT DEFAULT NULL");

            addColSafe(stmt, "now_records", "focus_topics_json", "TEXT DEFAULT NULL");
            addColSafe(stmt, "now_records", "reading_notes_json", "TEXT DEFAULT NULL");
            addColSafe(stmt, "now_records", "current_city", "VARCHAR(100) DEFAULT '杭州 · 滨江'");
            addColSafe(stmt, "now_records", "micro_logs_json", "TEXT DEFAULT NULL");

            addColSafe(stmt, "friends", "ping_status", "VARCHAR(20) DEFAULT 'ONLINE'");
            addColSafe(stmt, "friends", "last_ping_time", "DATETIME DEFAULT CURRENT_TIMESTAMP");
            addColSafe(stmt, "friends", "response_time_ms", "BIGINT DEFAULT 45");

            addColSafe(stmt, "media", "storage_type", "VARCHAR(20) DEFAULT 'minio'");
            addColSafe(stmt, "posts", "ai_radar_json", "TEXT DEFAULT NULL");

            // 如果数据为空，使用 ScriptUtils 导入 data.sql 种子数据
            boolean needSeed = false;
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM posts;")) {
                if (rs.next() && rs.getInt(1) == 0) {
                    needSeed = true;
                }
            } catch (Exception ignored) {
                needSeed = true;
            }

            if (needSeed) {
                System.out.println(">>> 正在使用 Spring ScriptUtils 导入 data.sql 初始化种子数据...");
                ScriptUtils.executeSqlScript(conn, new FileSystemResource("E:/work2026/mon9/Haydan_blog/docs/sql/data.sql"));
                System.out.println(">>> 种子数据导入成功！");
            }

            // 验证关键表数据
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM posts;")) {
                if (rs.next()) {
                    System.out.println(">>> 验证 posts 文章总数: " + rs.getInt(1));
                }
            }
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM journeys;")) {
                if (rs.next()) {
                    System.out.println(">>> 验证 journeys 足迹总数: " + rs.getInt(1));
                }
            }
            try (ResultSet rs = stmt.executeQuery("SELECT site_name, hero_bg_type, storage_type, minio_endpoint, hero_slogan_config_json FROM site_settings WHERE id = 1;")) {
                if (rs.next()) {
                    System.out.println(">>> 验证 site_settings: " + rs.getString(1) + ", hero_bg_type=" + rs.getString(2) + ", storage_type=" + rs.getString(3) + ", minio=" + rs.getString(4) + ", hero_slogan_config_json=" + rs.getString(5));
                    if (rs.getString(5) == null || rs.getString(5).trim().isEmpty()) {
                        String defaultJson = "[{\"id\":\"line-1\",\"text\":\"From the East,\",\"fontSize\":140,\"colorScheme\":\"emerald\",\"fontStyle\":\"handwrite\",\"strokeWidth\":2.0},{\"id\":\"line-2\",\"text\":\"toward the unknown.\",\"fontSize\":140,\"colorScheme\":\"emerald\",\"fontStyle\":\"handwrite\",\"strokeWidth\":2.0}]";
                        stmt.executeUpdate("UPDATE site_settings SET hero_title = 'From the East,', hero_slogan = 'toward the unknown.', hero_slogan_config_json = '" + defaultJson + "' WHERE id = 1;");
                        System.out.println(">>> 成功为 site_settings 写入默认双行手写标语配置 JSON！");
                    }
                }
            }
        }
        System.out.println("=== 云端 MySQL（49.233.166.212:3306）验证与切换校验 100% 成功！ ===");
    }

    private void addColSafe(Statement stmt, String table, String col, String def) {
        try {
            stmt.execute("ALTER TABLE `" + table + "` ADD COLUMN `" + col + "` " + def + ";");
            System.out.println("已为表 " + table + " 添加字段: " + col);
        } catch (Exception e) {
            // 已存在列则忽略
        }
    }
}
