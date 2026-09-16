-- ==========================================================
-- Hayden Xue Personal Blog V2.0 增量平滑升级脚本 (保留已有数据)
-- Database: hayden_blog
-- ==========================================================

USE `hayden_blog`;

-- 1. 扩充 posts 表字段 (点赞数、语言版本)
SET @exist_like := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'like_count');
SET @sql_like := IF(@exist_like = 0, 'ALTER TABLE `posts` ADD COLUMN `like_count` INT NOT NULL DEFAULT 0 COMMENT \'点赞数\';', 'SELECT 1;');
PREPARE stmt FROM @sql_like; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_lang := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'lang');
SET @sql_lang := IF(@exist_lang = 0, 'ALTER TABLE `posts` ADD COLUMN `lang` VARCHAR(10) NOT NULL DEFAULT \'zh\' COMMENT \'语言版本: zh / en\';', 'SELECT 1;');
PREPARE stmt FROM @sql_lang; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. 扩充 site_settings 表字段 (Hero定制、关于页自述、公告、页脚备案、白噪音)
SET @exist_ht := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'hero_title');
SET @sql_ht := IF(@exist_ht = 0, 'ALTER TABLE `site_settings` ADD COLUMN `hero_title` VARCHAR(255) DEFAULT NULL COMMENT \'首页Hero大标题\';', 'SELECT 1;');
PREPARE stmt FROM @sql_ht; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_hs := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'hero_slogan');
SET @sql_hs := IF(@exist_hs = 0, 'ALTER TABLE `site_settings` ADD COLUMN `hero_slogan` VARCHAR(255) DEFAULT NULL COMMENT \'首页Hero彩色渐变标语\';', 'SELECT 1;');
PREPARE stmt FROM @sql_hs; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_hsc := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'hero_slogan_config_json');
SET @sql_hsc := IF(@exist_hsc = 0, 'ALTER TABLE `site_settings` ADD COLUMN `hero_slogan_config_json` TEXT DEFAULT NULL COMMENT \'首页Hero多排标语定制JSON\';', 'SELECT 1;');
PREPARE stmt FROM @sql_hsc; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_hd := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'hero_description');
SET @sql_hd := IF(@exist_hd = 0, 'ALTER TABLE `site_settings` ADD COLUMN `hero_description` TEXT DEFAULT NULL COMMENT \'首页Hero副标题自述\';', 'SELECT 1;');
PREPARE stmt FROM @sql_hd; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_abz := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'about_bio_zh');
SET @sql_abz := IF(@exist_abz = 0, 'ALTER TABLE `site_settings` ADD COLUMN `about_bio_zh` TEXT DEFAULT NULL COMMENT \'关于页中文自述\';', 'SELECT 1;');
PREPARE stmt FROM @sql_abz; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_abe := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'about_bio_en');
SET @sql_abe := IF(@exist_abe = 0, 'ALTER TABLE `site_settings` ADD COLUMN `about_bio_en` TEXT DEFAULT NULL COMMENT \'关于页英文自述\';', 'SELECT 1;');
PREPARE stmt FROM @sql_abe; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_ai := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'about_interests');
SET @sql_ai := IF(@exist_ai = 0, 'ALTER TABLE `site_settings` ADD COLUMN `about_interests` TEXT DEFAULT NULL COMMENT \'兴趣爱好JSON列表\';', 'SELECT 1;');
PREPARE stmt FROM @sql_ai; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_ae := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'announcement_enabled');
SET @sql_ae := IF(@exist_ae = 0, 'ALTER TABLE `site_settings` ADD COLUMN `announcement_enabled` TINYINT NOT NULL DEFAULT 0 COMMENT \'公告栏开关\';', 'SELECT 1;');
PREPARE stmt FROM @sql_ae; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_at := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'announcement_text');
SET @sql_at := IF(@exist_at = 0, 'ALTER TABLE `site_settings` ADD COLUMN `announcement_text` VARCHAR(255) DEFAULT NULL COMMENT \'公告内容\';', 'SELECT 1;');
PREPARE stmt FROM @sql_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_al := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'announcement_link');
SET @sql_al := IF(@exist_al = 0, 'ALTER TABLE `site_settings` ADD COLUMN `announcement_link` VARCHAR(255) DEFAULT NULL COMMENT \'公告跳转链接\';', 'SELECT 1;');
PREPARE stmt FROM @sql_al; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_ft := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'footer_text');
SET @sql_ft := IF(@exist_ft = 0, 'ALTER TABLE `site_settings` ADD COLUMN `footer_text` VARCHAR(255) DEFAULT NULL COMMENT \'页脚版权信息\';', 'SELECT 1;');
PREPARE stmt FROM @sql_ft; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_icp := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'icp_number');
SET @sql_icp := IF(@exist_icp = 0, 'ALTER TABLE `site_settings` ADD COLUMN `icp_number` VARCHAR(100) DEFAULT NULL COMMENT \'ICP备案号\';', 'SELECT 1;');
PREPARE stmt FROM @sql_icp; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_bg := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings' AND COLUMN_NAME = 'bg_music_url');
SET @sql_bg := IF(@exist_bg = 0, 'ALTER TABLE `site_settings` ADD COLUMN `bg_music_url` VARCHAR(500) DEFAULT NULL COMMENT \'背景音频/白噪音URL\';', 'SELECT 1;');
PREPARE stmt FROM @sql_bg; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. 新建随记微动态表 (Memos)
CREATE TABLE IF NOT EXISTS `memos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `content` TEXT NOT NULL COMMENT '随记正文',
    `images` TEXT DEFAULT NULL COMMENT '配图JSON数组',
    `like_count` INT NOT NULL DEFAULT 0 COMMENT '点赞数',
    `is_pinned` TINYINT NOT NULL DEFAULT 0 COMMENT '是否置顶(1是0否)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='随记微动态表';

-- 4. 新建友链朋友圈表 (Friends)
CREATE TABLE IF NOT EXISTS `friends` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(100) NOT NULL COMMENT '博友站点名称',
    `url` VARCHAR(255) NOT NULL COMMENT '站点链接',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '站点头像/图标',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '站点介绍',
    `category` VARCHAR(50) NOT NULL DEFAULT 'Blog' COMMENT '分类 (Blog, Tech, Tools)',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态 (ACTIVE, HIDDEN)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='友链表';

-- 5. 新建互动评论表 (Comments)
CREATE TABLE IF NOT EXISTS `comments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `target_type` VARCHAR(20) NOT NULL COMMENT '评论目标类型 (POST, JOURNEY, MEMO)',
    `target_id` BIGINT NOT NULL COMMENT '目标对象ID',
    `user_id` BIGINT NOT NULL COMMENT '发表用户ID',
    `parent_id` BIGINT DEFAULT NULL COMMENT '父级评论ID(回复楼中楼)',
    `content` TEXT NOT NULL COMMENT '评论正文',
    `status` VARCHAR(20) NOT NULL DEFAULT 'APPROVED' COMMENT '状态 (APPROVED, PENDING, SPAM)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发表时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_target` (`target_type`, `target_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='互动评论表';

-- 6. 初始化默认 V2.0 基础设置文案 (若原先字段为空则补全)
UPDATE `site_settings`
SET 
    `hero_title` = COALESCE(`hero_title`, 'From the East,'),
    `hero_slogan` = COALESCE(`hero_slogan`, 'toward the unknown.'),
    `hero_description` = COALESCE(`hero_description`, 'I\'m Hayden Xue, a software developer and lifelong learner exploring technology, AI, and the world.'),
    `about_bio_zh` = COALESCE(`about_bio_zh`, '你好！我是 Hayden Xue。我喜欢追求干净的架构、有温度的代码以及优雅而克制的界面设计。在这个技术日新月异的时代，我深信：最好的学习方法是公开记录与实践创造。这也是我亲手构建这个博客与数字花园的初衷。除了后端架构与现代前端的探索，你还会看到我关于人工智能、智能体研发、摄影旅行与生活哲学的思考。'),
    `about_bio_en` = COALESCE(`about_bio_en`, 'Hey, I\'m Hayden Xue. I believe code is the tangible form of thinking and a tool to explore the unknown. This website is my digital garden to document technology, AI, photography, travel, and personal growth.'),
    `about_interests` = COALESCE(`about_interests`, '[{"icon":"Cpu","label_zh":"软件系统架构","label_en":"Software Architecture"},{"icon":"Brain","label_zh":"人工智能与智能体","label_en":"AI & Autonomous Agents"},{"icon":"Code","label_zh":"编程工匠精神","label_en":"Programming Craftsmanship"},{"icon":"Compass","label_zh":"全球旅行探索","label_en":"Travel & Exploration"},{"icon":"Camera","label_zh":"街头与建筑摄影","label_en":"Street Photography"}]'),
    `announcement_enabled` = COALESCE(`announcement_enabled`, 1),
    `announcement_text` = COALESCE(`announcement_text`, '🎉 Hayden Xue Personal Blog V2.0 现已全面升级！支持双语与即时随记互动。'),
    `announcement_link` = COALESCE(`announcement_link`, '/memos'),
    `footer_text` = COALESCE(`footer_text`, '© 2026 Hayden Xue. Built with Java 21 & Next.js 14.'),
    `icp_number` = COALESCE(`icp_number`, '京ICP备20260905号-1'),
    `bg_music_url` = COALESCE(`bg_music_url`, 'https://cdn.freesound.org/previews/518/518175_6142149-lq.mp3')
WHERE `id` = 1;

-- 7. 插入演示随记 (若当前表为空)
INSERT INTO `memos` (`id`, `content`, `images`, `like_count`, `is_pinned`)
SELECT 1, '今天把系统升级到了 V2.0，重构了全站的双语机制，并且加上了碎碎念模块！在这个信息碎片化的时代，拥有一片属于自己的自留地，把思考沉淀下来，感觉真好。🌱', '["https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&fit=crop"]', 12, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `memos` WHERE `id` = 1);

-- 8. 插入演示友链 (若当前表为空)
INSERT INTO `friends` (`id`, `name`, `url`, `avatar`, `description`, `category`, `sort_order`, `status`)
SELECT 1, 'Hayden Lab', 'https://haydenxue.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', '探索前沿软件工程与智能体实验', 'Tech', 1, 'ACTIVE'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `friends` WHERE `id` = 1);

-- 9. 扩充 users 表字段 (最后登录IP与时间)
SET @exist_u_ip := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_ip');
SET @sql_u_ip := IF(@exist_u_ip = 0, 'ALTER TABLE `users` ADD COLUMN `last_login_ip` VARCHAR(50) DEFAULT NULL COMMENT \'最后登录IP\';', 'SELECT 1;');
PREPARE stmt FROM @sql_u_ip; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_u_time := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_time');
SET @sql_u_time := IF(@exist_u_time = 0, 'ALTER TABLE `users` ADD COLUMN `last_login_time` DATETIME DEFAULT NULL COMMENT \'最后登录时间\';', 'SELECT 1;');
PREPARE stmt FROM @sql_u_time; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 10. 新建操作审计日志表 (Audit Logs)
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `username` VARCHAR(50) DEFAULT NULL COMMENT '操作用户名',
    `client_ip` VARCHAR(50) DEFAULT NULL COMMENT '客户端IP',
    `module` VARCHAR(50) DEFAULT NULL COMMENT '业务模块',
    `operation` VARCHAR(100) DEFAULT NULL COMMENT '操作行为',
    `method` VARCHAR(100) DEFAULT NULL COMMENT '请求方法/接口',
    `params` TEXT DEFAULT NULL COMMENT '请求参数JSON',
    `status` INT DEFAULT 1 COMMENT '状态(1成功, 0失败)',
    `error_msg` TEXT DEFAULT NULL COMMENT '异常错误信息',
    `duration_ms` BIGINT DEFAULT 0 COMMENT '执行耗时(毫秒)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    PRIMARY KEY (`id`),
    KEY `idx_module` (`module`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统操作审计日志表';

-- 11. 新建访问统计流水表 (Visit Records)
CREATE TABLE IF NOT EXISTS `visit_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `ip` VARCHAR(50) DEFAULT NULL COMMENT '客户端IP',
    `url` VARCHAR(500) DEFAULT NULL COMMENT '访问页面URL',
    `method` VARCHAR(10) DEFAULT NULL COMMENT 'HTTP方法',
    `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA',
    `referer` VARCHAR(500) DEFAULT NULL COMMENT '引流来源Referer',
    `duration_ms` BIGINT DEFAULT 0 COMMENT '响应耗时',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
    PRIMARY KEY (`id`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_ip` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='全站访问流水统计表';

-- 12. 新建读者/用户点赞记录表 (User Likes)
CREATE TABLE IF NOT EXISTS `user_likes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT NOT NULL COMMENT '点赞用户ID',
    `target_type` VARCHAR(20) NOT NULL COMMENT '点赞目标(MEMO, POST)',
    `target_id` BIGINT NOT NULL COMMENT '目标对象ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_target` (`user_id`, `target_type`, `target_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户点赞记录表';
