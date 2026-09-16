-- H2 Schema for Hayden Xue Personal Blog
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'ADMIN',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    bio TEXT,
    github VARCHAR(255),
    website VARCHAR(255),
    last_login_ip VARCHAR(50),
    last_login_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content LONGTEXT,
    cover VARCHAR(255),
    category_id BIGINT,
    status VARCHAR(20) DEFAULT 'DRAFT',
    featured INT DEFAULT 0,
    reading_time INT DEFAULT 1,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    lang VARCHAR(10) DEFAULT 'zh',
    translation_post_id BIGINT DEFAULT NULL,
    maturity VARCHAR(20) DEFAULT 'BUDDING',
    revision_count INT DEFAULT 1,
    seo_title VARCHAR(255),
    seo_description TEXT,
    ai_radar_json TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_translation_post_id ON posts(translation_post_id);

CREATE TABLE IF NOT EXISTS post_tags (
    post_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    content LONGTEXT,
    cover VARCHAR(255),
    technologies VARCHAR(255),
    github_url VARCHAR(255),
    demo_url VARCHAR(255),
    featured INT DEFAULT 0,
    like_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PLANNING',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journeys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    description TEXT,
    content LONGTEXT,
    cover VARCHAR(255),
    like_count INT DEFAULT 0,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journey_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journey_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS now_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    learning TEXT,
    building TEXT,
    exploring TEXT,
    thinking TEXT,
    focus_topics_json TEXT,
    reading_notes_json TEXT,
    current_city VARCHAR(100),
    micro_logs_json TEXT,
    music_track_json TEXT,
    mood_status VARCHAR(100),
    movies_json TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timeline (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    `year` VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(100) DEFAULT 'Hayden Xue Personal Blog',
    site_description TEXT,
    slogan VARCHAR(255) DEFAULT 'From the East, toward the unknown.',
    bio TEXT,
    logo VARCHAR(255),
    avatar VARCHAR(255),
    email VARCHAR(100),
    github_url VARCHAR(255),
    twitter_url VARCHAR(255),
    instagram_url VARCHAR(255),
    seo_title VARCHAR(255),
    seo_description TEXT,
    hero_title VARCHAR(255),
    hero_slogan VARCHAR(255),
    hero_description TEXT,
    about_bio_zh TEXT,
    about_bio_en TEXT,
    about_interests TEXT,
    announcement_enabled INT DEFAULT 0,
    announcement_text VARCHAR(255),
    announcement_link VARCHAR(255),
    footer_text VARCHAR(255),
    icp_number VARCHAR(100),
    bg_music_url VARCHAR(500),
    ai_enabled INT DEFAULT 1,
    ai_base_url VARCHAR(255) DEFAULT 'https://api.openai.com/v1',
    ai_model VARCHAR(100) DEFAULT 'gpt-4o-mini',
    ai_api_key VARCHAR(255),
    ai_system_prompt TEXT,
    ai_providers_json TEXT,
    life_pulse_json TEXT,
    hero_bg_type VARCHAR(20) DEFAULT 'video',
    hero_video_url VARCHAR(500),
    hero_slogan_config_json TEXT,
    page_visuals_json TEXT,
    storage_type VARCHAR(20) DEFAULT 'local',
    minio_endpoint VARCHAR(255),
    minio_bucket VARCHAR(100),
    minio_access_key VARCHAR(255),
    minio_secret_key VARCHAR(255),
    minio_public_url VARCHAR(255),
    reader_daily_ai_quota INT DEFAULT 15,
    comment_moderation_enabled INT DEFAULT 1,
    admin_comment_exempt INT DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    images TEXT,
    location VARCHAR(255),
    mood VARCHAR(50),
    weather VARCHAR(50),
    tags VARCHAR(500),
    like_count INT DEFAULT 0,
    is_pinned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friends (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    description VARCHAR(255),
    category VARCHAR(50) DEFAULT '独立博客',
    sort_order INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    ping_status VARCHAR(20) DEFAULT 'UNKNOWN',
    last_ping_time TIMESTAMP,
    response_time_ms BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parent_id BIGINT,
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'APPROVED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    object_key VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT DEFAULT 0,
    width INT,
    height INT,
    storage_type VARCHAR(20) DEFAULT 'local',
    file_hash VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_file_hash ON media(file_hash);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    client_ip VARCHAR(50),
    module VARCHAR(50),
    operation VARCHAR(100),
    method VARCHAR(100),
    params TEXT,
    status INT DEFAULT 1,
    error_msg TEXT,
    duration_ms BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visit_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(50),
    url VARCHAR(500),
    method VARCHAR(10),
    user_agent VARCHAR(500),
    referer VARCHAR(500),
    duration_ms BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_target ON user_likes(user_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    sender_id BIGINT,
    sender_name VARCHAR(100),
    sender_avatar VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    target_type VARCHAR(20),
    target_id BIGINT,
    target_title VARCHAR(255),
    content TEXT,
    is_read INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
