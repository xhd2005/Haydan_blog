-- Hayden Xue Personal Blog 数据库建表脚本
-- Database: howard_blog

CREATE DATABASE IF NOT EXISTS `howard_blog` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `howard_blog`;

-- 1. 用户表 (Users)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `username` VARCHAR(50) NOT NULL COMMENT '登录用户名',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'BCrypt哈希密码',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '用户昵称',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `role` VARCHAR(20) NOT NULL DEFAULT 'ADMIN' COMMENT '角色: ADMIN',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE / BANNED',
    `last_login_ip` VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 分类表 (Categories)
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
    `slug` VARCHAR(100) NOT NULL COMMENT '分类缩略名(URL路径)',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '分类简介',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_category_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章分类表';

-- 3. 标签表 (Tags)
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(50) NOT NULL COMMENT '标签名称',
    `slug` VARCHAR(50) NOT NULL COMMENT '标签缩略名(URL路径)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tag_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章标签表';

-- 4. 文章表 (Posts)
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `title` VARCHAR(255) NOT NULL COMMENT '文章标题',
    `slug` VARCHAR(255) NOT NULL COMMENT 'URL Slug',
    `excerpt` TEXT DEFAULT NULL COMMENT '摘要简述',
    `content` LONGTEXT DEFAULT NULL COMMENT 'Markdown正文内容',
    `cover` VARCHAR(255) DEFAULT NULL COMMENT '封面图URL',
    `category_id` BIGINT DEFAULT NULL COMMENT '关联分类ID',
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '状态: DRAFT / PUBLISHED / ARCHIVED',
    `featured` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否置顶/精选: 1-是 0-否',
    `reading_time` INT NOT NULL DEFAULT 1 COMMENT '预计阅读时长(分钟)',
    `view_count` INT NOT NULL DEFAULT 0 COMMENT '阅读访问量',
    `like_count` INT NOT NULL DEFAULT 0 COMMENT '点赞数',
    `lang` VARCHAR(10) NOT NULL DEFAULT 'zh' COMMENT '语言版本: zh / en',
    `translation_post_id` BIGINT DEFAULT NULL COMMENT '关联双语译文文章ID',
    `seo_title` VARCHAR(255) DEFAULT NULL COMMENT 'SEO自定义标题',
    `seo_description` TEXT DEFAULT NULL COMMENT 'SEO描述',
    `published_at` DATETIME DEFAULT NULL COMMENT '发布时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_post_slug` (`slug`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status_published` (`status`, `published_at`),
    KEY `idx_featured` (`featured`),
    KEY `idx_posts_translation_post_id` (`translation_post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='博客文章表';

-- 5. 文章标签关联表 (Post Tags)
DROP TABLE IF EXISTS `post_tags`;
CREATE TABLE `post_tags` (
    `post_id` BIGINT NOT NULL COMMENT '文章ID',
    `tag_id` BIGINT NOT NULL COMMENT '标签ID',
    PRIMARY KEY (`post_id`, `tag_id`),
    KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章-标签关联表';

-- 6. 项目作品表 (Projects)
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(100) NOT NULL COMMENT '项目名称',
    `slug` VARCHAR(100) NOT NULL COMMENT 'URL Slug',
    `description` TEXT DEFAULT NULL COMMENT '项目简介',
    `content` LONGTEXT DEFAULT NULL COMMENT '项目详细介绍(Markdown)',
    `cover` VARCHAR(255) DEFAULT NULL COMMENT '封面图片URL',
    `technologies` VARCHAR(255) DEFAULT NULL COMMENT '技术栈(逗号或JSON数组)',
    `github_url` VARCHAR(255) DEFAULT NULL COMMENT 'GitHub仓库地址',
    `demo_url` VARCHAR(255) DEFAULT NULL COMMENT '在线演示地址',
    `featured` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否精选: 1-是 0-否',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PLANNING' COMMENT '状态: PLANNING / DEVELOPING / COMPLETED / ARCHIVED',
    `start_date` DATE DEFAULT NULL COMMENT '项目起始日期',
    `end_date` DATE DEFAULT NULL COMMENT '项目完成日期',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_project_slug` (`slug`),
    KEY `idx_project_featured` (`featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目作品集表';

-- 7. 旅行足迹表 (Journeys)
DROP TABLE IF EXISTS `journeys`;
CREATE TABLE `journeys` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `title` VARCHAR(255) NOT NULL COMMENT '旅行篇名',
    `slug` VARCHAR(255) NOT NULL COMMENT 'URL Slug',
    `country` VARCHAR(100) NOT NULL COMMENT '国家/地区',
    `city` VARCHAR(100) NOT NULL COMMENT '城市',
    `description` TEXT DEFAULT NULL COMMENT '简短描述',
    `content` LONGTEXT DEFAULT NULL COMMENT '游记正文(Markdown)',
    `cover` VARCHAR(255) DEFAULT NULL COMMENT '封面图URL',
    `latitude` DECIMAL(10, 7) DEFAULT NULL COMMENT '纬度',
    `longitude` DECIMAL(10, 7) DEFAULT NULL COMMENT '经度',
    `start_date` DATE DEFAULT NULL COMMENT '出发日期',
    `end_date` DATE DEFAULT NULL COMMENT '结束日期',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_journey_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='旅行记录表';

-- 8. 旅行相册附图表 (Journey Images)
DROP TABLE IF EXISTS `journey_images`;
CREATE TABLE `journey_images` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `journey_id` BIGINT NOT NULL COMMENT '关联旅行ID',
    `image_url` VARCHAR(500) NOT NULL COMMENT '图片URL',
    `caption` VARCHAR(255) DEFAULT NULL COMMENT '图说',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_journey_id` (`journey_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='旅行相册表';

-- 9. Now 页面状态记录表 (Now Records)
DROP TABLE IF EXISTS `now_records`;
CREATE TABLE `now_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `learning` TEXT DEFAULT NULL COMMENT '正在学习 (Markdown)',
    `building` TEXT DEFAULT NULL COMMENT '正在构建/开发 (Markdown)',
    `exploring` TEXT DEFAULT NULL COMMENT '正在探索 (Markdown)',
    `thinking` TEXT DEFAULT NULL COMMENT '当前思考 (Markdown)',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Now状态记录表';

-- 10. 个人成长时间线 (Timeline)
DROP TABLE IF EXISTS `timeline`;
CREATE TABLE `timeline` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `year` VARCHAR(20) NOT NULL COMMENT '年份/时期 (如 2026, 2024)',
    `title` VARCHAR(100) NOT NULL COMMENT '大事件标题',
    `description` TEXT DEFAULT NULL COMMENT '详细描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值(越大越靠前或越后)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='个人成长时间线表';

-- 11. 网站全局设置 (Site Settings)
DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `site_name` VARCHAR(100) NOT NULL DEFAULT 'Hayden Xue Personal Blog' COMMENT '网站名称',
    `site_description` TEXT DEFAULT NULL COMMENT '网站描述',
    `slogan` VARCHAR(255) DEFAULT 'From the East, toward the unknown.' COMMENT '核心理念标语',
    `bio` TEXT DEFAULT NULL COMMENT '个人简短自述',
    `logo` VARCHAR(255) DEFAULT NULL COMMENT 'Logo URL',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '站长头像',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '联系邮箱',
    `github_url` VARCHAR(255) DEFAULT NULL COMMENT 'GitHub个人主页',
    `twitter_url` VARCHAR(255) DEFAULT NULL COMMENT 'X/Twitter链接',
    `instagram_url` VARCHAR(255) DEFAULT NULL COMMENT 'Instagram链接',
    `seo_title` VARCHAR(255) DEFAULT NULL COMMENT 'SEO主标题',
    `seo_description` TEXT DEFAULT NULL COMMENT 'SEO描述',
    `hero_title` VARCHAR(255) DEFAULT NULL COMMENT '首页Hero大标题',
    `hero_slogan` VARCHAR(255) DEFAULT NULL COMMENT '首页Hero彩色渐变标语',
    `hero_description` TEXT DEFAULT NULL COMMENT '首页Hero副标题自述',
    `about_bio_zh` TEXT DEFAULT NULL COMMENT '关于页中文自述',
    `about_bio_en` TEXT DEFAULT NULL COMMENT '关于页英文自述',
    `about_interests` TEXT DEFAULT NULL COMMENT '兴趣爱好JSON列表',
    `announcement_enabled` TINYINT NOT NULL DEFAULT 0 COMMENT '公告栏开关',
    `announcement_text` VARCHAR(255) DEFAULT NULL COMMENT '公告内容',
    `announcement_link` VARCHAR(255) DEFAULT NULL COMMENT '公告跳转链接',
    `footer_text` VARCHAR(255) DEFAULT NULL COMMENT '页脚版权信息',
    `icp_number` VARCHAR(100) DEFAULT NULL COMMENT 'ICP备案号',
    `bg_music_url` VARCHAR(500) DEFAULT NULL COMMENT '背景音频/白噪音URL',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='网站全局配置表';

-- 12. 随记 / 碎碎念表 (Memos)
DROP TABLE IF EXISTS `memos`;
CREATE TABLE `memos` (
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

-- 13. 友链朋友圈表 (Friends)
DROP TABLE IF EXISTS `friends`;
CREATE TABLE `friends` (
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

-- 14. 互动评论表 (Comments)
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
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

-- 15. 媒体资源表 (Media)
DROP TABLE IF EXISTS `media`;
CREATE TABLE `media` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `filename` VARCHAR(255) NOT NULL COMMENT '原始文件名',
    `object_key` VARCHAR(255) NOT NULL COMMENT '存储路径/对象名',
    `url` VARCHAR(500) NOT NULL COMMENT '可直接访问的URL',
    `mime_type` VARCHAR(100) DEFAULT NULL COMMENT 'MIME类型',
    `size` BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
    `width` INT DEFAULT NULL COMMENT '图片宽度',
    `height` INT DEFAULT NULL COMMENT '图片高度',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    PRIMARY KEY (`id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='媒体文件元数据表';

-- 16. 系统操作审计日志表 (Audit Logs)
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
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

-- 17. 网站全站访问流水统计表 (Visit Records)
DROP TABLE IF EXISTS `visit_records`;
CREATE TABLE `visit_records` (
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

-- 18. 读者/用户点赞记录表 (User Likes)
DROP TABLE IF EXISTS `user_likes`;
CREATE TABLE `user_likes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT NOT NULL COMMENT '点赞用户ID',
    `target_type` VARCHAR(20) NOT NULL COMMENT '点赞目标(MEMO, POST)',
    `target_id` BIGINT NOT NULL COMMENT '目标对象ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_target` (`user_id`, `target_type`, `target_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户点赞记录表';
