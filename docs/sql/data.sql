-- Hayden Xue Personal Blog 初始数据种子脚本
USE `hayden_blog`;

-- 1. 初始管理员用户 (账号: admin / 密码: admin123)
-- BCrypt: $2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2
INSERT INTO `users` (`id`, `username`, `password_hash`, `nickname`, `avatar`, `email`, `role`, `status`)
VALUES (1, 'admin', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', 'Hayden Xue', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces', 'hayden.xue@example.com', 'ADMIN', 'ACTIVE')
ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

-- 2. 默认分类
INSERT INTO `categories` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Technology', 'technology', '关于前沿技术、系统架构与技术选型'),
(2, 'AI', 'ai', '人工智能、大语言模型与智能体实践'),
(3, 'Programming', 'programming', '日常编程手记、工程规范与代码审美'),
(4, 'Life', 'life', '生活随笔、思考感悟与真实日常'),
(5, 'Travel', 'travel', '旅行摄影、城市探索与人文风物'),
(6, 'Thoughts', 'thoughts', '长期思考、心智模型与数字花园哲学')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. 默认标签
INSERT INTO `tags` (`id`, `name`, `slug`) VALUES
(1, 'Java', 'java'),
(2, 'Spring Boot', 'spring-boot'),
(3, 'Next.js', 'nextjs'),
(4, 'AI', 'ai'),
(5, 'TypeScript', 'typescript'),
(6, 'Travel', 'travel'),
(7, 'Architecture', 'architecture'),
(8, 'React', 'react')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. 初始网站设置
INSERT INTO `site_settings` (`id`, `site_name`, `site_description`, `slogan`, `bio`, `logo`, `avatar`, `email`, `github_url`, `twitter_url`, `instagram_url`, `seo_title`, `seo_description`, `hero_title`, `hero_slogan`, `hero_description`, `about_bio_zh`, `about_bio_en`, `about_interests`, `announcement_enabled`, `announcement_text`, `announcement_link`, `footer_text`, `icp_number`, `bg_music_url`)
VALUES (
    1,
    'Hayden Xue Personal Blog',
    '基于东方，探索未知。记录技术探索、AI智能体、旅行足迹与长期成长。',
    'From the East, toward the unknown.',
    '软件工程师 · 终身学习者 · 数字花园建造者。追求干净架构与克制设计。',
    '/logo.svg',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
    'hayden.xue@example.com',
    'https://github.com',
    'https://twitter.com',
    'https://instagram.com',
    'Hayden Xue - Personal Blog & Digital Garden',
    'Hayden Xue 的个人博客与数字花园，记录技术沉淀、AI思考与全球旅行手记。',
    'From the East,',
    'toward the unknown.',
    'I''m Hayden Xue, a software developer and lifelong learner exploring technology, AI, and the world.',
    '你好！我是 Hayden Xue。我喜欢追求干净的架构、有温度的代码以及优雅而克制的界面设计。在这个技术日新月异的时代，我深信：最好的学习方法是公开记录与实践创造。这也是我亲手构建这个博客与数字花园的初衷。除了后端架构与现代前端的探索，你还会看到我关于人工智能、智能体研发、摄影旅行与生活哲学的思考。',
    'Hey, I''m Hayden Xue. I believe code is the tangible form of thinking and a tool to explore the unknown. This website is my digital garden to document technology, AI, photography, travel, and personal growth.',
    '[{"icon":"Cpu","label_zh":"软件系统架构","label_en":"Software Architecture"},{"icon":"Brain","label_zh":"人工智能与智能体","label_en":"AI & Autonomous Agents"},{"icon":"Code","label_zh":"编程工匠精神","label_en":"Programming Craftsmanship"},{"icon":"Compass","label_zh":"全球旅行探索","label_en":"Travel & Exploration"},{"icon":"Camera","label_zh":"街头与建筑摄影","label_en":"Street Photography"}]',
    1,
    '🎉 Hayden Xue Personal Blog V2.0 现已全面升级！支持双语与即时随记互动。',
    '/memos',
    '© 2026 Hayden Xue. Built with Java 21 & Next.js 14.',
    '京ICP备20260905号-1',
    'https://cdn.freesound.org/previews/518/518175_6142149-lq.mp3'
)
ON DUPLICATE KEY UPDATE `site_name`=VALUES(`site_name`);

-- 5. 初始 Now 记录
INSERT INTO `now_records` (`id`, `learning`, `building`, `exploring`, `thinking`)
VALUES (
    1,
    '- 深入学习 Java 21 虚拟线程 (Virtual Threads) 高并发实践\n- 研读智能体协调框架与 Multi-Agent 架构设计\n- 探索现代 Web 端 Shiki 代码渲染与暗色排版细节',
    '- 打造全新的个人博客与数字花园系统 (Hayden Xue Personal Blog V1.0)\n- 搭建前后端分离的现代化个人数字资产中枢',
    '- 城市徒步与建筑摄影 (Street & Architecture Photography)\n- 下一代 Generative UI 与响应式流式交互范式',
    '- 个人数字花园如何成为长效的心智外脑，而非转瞬即逝的碎片化社交信息？\n- 在大模型时代，软件工程师的核心壁垒正在向何处迁移？'
)
ON DUPLICATE KEY UPDATE `id`=1;

-- 6. 初始成长时间线
INSERT INTO `timeline` (`id`, `year`, `title`, `description`, `sort_order`) VALUES
(1, '2026', '构建个人数字花园 V1.0', '正式发布基于 Next.js 与 Spring Boot 3 的全新全栈个人主页与长效数字空间。', 10),
(2, '2025', '全面拥抱 AI 研发新范式', '深入实践 LLM 智能体应用架构开发，重构个人工程技术体系。', 20),
(3, '2024', '全栈技术栈沉淀与架构演进', '在分布式后端架构、现代前端工程化领域深度打磨。', 30),
(4, '2022', '踏上软件工程之路', '开始在技术与未知世界中探索，确立“From the East, toward the unknown.”的个人座右铭。', 40)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 7. 初始文章
INSERT INTO `posts` (`id`, `title`, `slug`, `excerpt`, `content`, `cover`, `category_id`, `status`, `featured`, `reading_time`, `view_count`, `seo_title`, `seo_description`, `published_at`)
VALUES (
    1,
    'From the East, toward the unknown: 数字花园发刊词',
    'from-the-east-toward-the-unknown',
    '为什么在这个碎片化信息泛滥的时代，我依然选择亲手构建一个属于自己的长效个人数字空间？',
    '# From the East, toward the unknown\n\n欢迎来到我的个人数字花园（Digital Garden）。\n\n在这个算法推荐、社交媒体信息流泛滥的时代，我们每天消费了太多速朽的内容。信息的半衰期变得越来越短，深度思考与长效沉淀变得越来越稀缺。\n\n因此，我决定打造一个真正属于我自己的数字领地。\n\n## 什么是数字花园？\n\n不同于传统博客将文章视为“发表后便不可更改的成稿”，**数字花园**更强调思想的生长性：\n\n- **Seedlings（萌芽）**：哪怕只有一个初步的灵感或未解之问，也可以先行记录下来。\n- **Budding（抽芽）**：经过阶段性梳理，形成具有一定参考价值的观察与笔记。\n- **Evergreen（常青）**：经过反复修订与实践检验，成为长期具有复利价值的知识沉淀。\n\n```java\npublic class DigitalGarden {\n    public static void main(String[] args) {\n        System.out.println("From the East, toward the unknown.");\n    }\n}\n```\n\n## 愿景与方向\n\n本站不仅记录代码，更记录探索世界的过程。希望这里不仅是我的心智外脑，也能为你带来些许灵感与启发。',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=630&fit=crop',
    6,
    'PUBLISHED',
    1,
    3,
    128,
    '数字花园发刊词 - Hayden Xue',
    '为什么在碎片化时代，我选择亲手构建属于自己的长效个人数字空间。',
    NOW()
),
(
    2,
    'Java 21 与现代 Spring Boot 3 架构演进实践',
    'modern-spring-boot-3-and-java-21',
    '深入探讨 Java 21 虚拟线程、Spring Boot 3 安全架构以及在现代个人系统中的最佳落地实践。',
    '# Java 21 与现代 Spring Boot 3 架构演进实践\n\n在构建高性能后端服务时，Java 21 带来的虚拟线程（Virtual Threads）极大简化了高并发 I/O 密集型应用的开发模型。\n\n## 核心特性解析\n\n### 1. 虚拟线程 (JEP 444)\n\n虚拟线程是由 JVM 调度的轻量级线程，极大地提升了单个进程中可并发执行的任务量。\n\n```java\ntry (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    IntStream.range(0, 10_000).forEach(i -> {\n        executor.submit(() -> {\n            Thread.sleep(Duration.ofSeconds(1));\n            return i;\n        });\n    });\n}\n```\n\n### 2. 模式匹配与密封类\n\nJava 21 的增强模式匹配大幅增强了代码的表现力与类型安全性。',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop',
    1,
    'PUBLISHED',
    1,
    5,
    256,
    'Java 21 与现代 Spring Boot 3 实践 - Hayden Xue',
    '深入探讨 Java 21 虚拟线程与现代 Spring Boot 3 架构。',
    NOW()
),
(
    3,
    '构建极简主义美学的 Next.js 响应式博客体验',
    'building-minimalist-nextjs-blog',
    '如何使用 Next.js App Router、Tailwind CSS 与 Framer Motion 打造富有呼吸感且兼顾极速加载的前端主页。',
    '# 构建极简主义美学的 Next.js 响应式博客体验\n\n好的界面设计应当是隐形的，把舞台完整地留给内容本身。\n\n## 设计哲学\n\n- **克制**：拒绝多余的视觉干扰，注重版式与留白\n- **流畅**：利用 CSS 原生特性与轻量级动效呈现自然过渡\n- **无障碍**：保证高对比度与键盘导航友好',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=630&fit=crop',
    3,
    'PUBLISHED',
    0,
    4,
    94,
    '构建极简主义 Next.js 博客 - Hayden Xue',
    '前端设计与架构思考：Tailwind CSS、Framer Motion 与排版美学。',
    NOW()
)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 文章标签对应
INSERT INTO `post_tags` (`post_id`, `tag_id`) VALUES
(1, 4), (1, 6),
(2, 1), (2, 2), (2, 7),
(3, 3), (3, 5), (3, 8)
ON DUPLICATE KEY UPDATE `tag_id`=VALUES(`tag_id`);

-- 8. 初始项目
INSERT INTO `projects` (`id`, `name`, `slug`, `description`, `content`, `cover`, `technologies`, `github_url`, `demo_url`, `featured`, `status`, `start_date`, `end_date`)
VALUES (
    1,
    'Hayden Xue Personal Blog',
    'hayden-personal-blog',
    '全栈现代个人博客与数字花园系统，采用 Java 21、Spring Boot 3 与 Next.js 构建。',
    '## 项目背景\n面向个人长期成长的数字化空间，打破常规程序员博客模板。\n\n## 技术栈\n- 后端: Java 21, Spring Boot 3, Spring Security, JWT, MySQL, Redis\n- 前端: Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion\n\n## 核心特性\n- 动静分离与极速响应\n- 完善的内容管理与 Markdown 实时渲染\n- 深度无障碍支持与自适应深浅色模式',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop',
    'Java 21,Spring Boot 3,Next.js,TypeScript,Tailwind CSS',
    'https://github.com',
    'https://haydenxue.com',
    1,
    'DEVELOPING',
    '2026-01-01',
    NULL
),
(
    2,
    'Agentic AI Workflow Engine',
    'agentic-ai-workflow-engine',
    '多智能体协同研发工作流引擎，支持任务自动拆解、工具调用与闭环验证。',
    '## 项目介绍\n基于大语言模型与自主智能体理论构建的工作流自动化平台。',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop',
    'Python,FastAPI,LangGraph,TypeScript,React',
    'https://github.com',
    NULL,
    1,
    'COMPLETED',
    '2025-06-01',
    '2025-12-30'
)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 9. 初始旅行
INSERT INTO `journeys` (`id`, `title`, `slug`, `country`, `city`, `description`, `content`, `cover`, `latitude`, `longitude`, `start_date`, `end_date`)
VALUES (
    1,
    '京都与东京：在古刹与赛博迷航中的春日纪行',
    'kyoto-tokyo-spring-journey',
    '日本',
    '京都 / 东京',
    '穿行于鸭川的清风与涩谷的霓虹之间，体会东方传统美学与现代都市文明的碰撞。',
    '# 京都与东京：春日纪行\n\n旅行是打破日常惯性最直接的手段。\n\n## 京都的静谧\n在清水寺的清晨，薄雾还未散去。千年的木结构建筑在晨光中苏醒，远处的梵钟悠扬回荡。\n\n## 东京的律动\n从新宿到秋叶原，城市的脉搏在轨道交通与高耸楼宇之间急促跃动。',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=630&fit=crop',
    35.0116,
    135.7681,
    '2025-04-05',
    '2025-04-15'
),
(
    2,
    '重庆：魔幻立体山城的空间折叠',
    'chongqing-mountain-city',
    '中国',
    '重庆',
    '穿梭在八维立体的轻轨与穿江索道之中，探寻长江岸边的市井烟火。',
    '# 重庆：山城漫步\n\n你永远不知道你脚下的一楼，在另一个方向是否其实是二十二楼。\n\n夜幕降临时，洪崖洞的灯火倒映在嘉陵江面上，宛如千与千寻的现实画卷。',
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&h=630&fit=crop',
    29.5630,
    106.5516,
    '2024-10-01',
    '2024-10-07'
)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 10. 初始随记
INSERT INTO `memos` (`id`, `content`, `images`, `like_count`, `is_pinned`)
VALUES (
    1,
    '今天把系统升级到了 V2.0，重构了全站的双语机制，并且加上了碎碎念模块！在这个信息碎片化的时代，拥有一片属于自己的自留地，把思考沉淀下来，感觉真好。🌱',
    '["https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&fit=crop"]',
    12,
    1
),
(
    2,
    '“From the East, toward the unknown.” 永远保持好奇心，向未知的边界不断航行。🚢✨',
    NULL,
    8,
    0
)
ON DUPLICATE KEY UPDATE `content`=VALUES(`content`);

-- 11. 初始友链
INSERT INTO `friends` (`id`, `name`, `url`, `avatar`, `description`, `category`, `sort_order`, `status`)
VALUES (
    1,
    'Hayden Lab',
    'https://haydenxue.com',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    '探索前沿软件工程与智能体实验',
    'Tech',
    1,
    'ACTIVE'
),
(
    2,
    'Vercel Design',
    'https://vercel.com/design',
    'https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png',
    '极简现代 Web 设计美学规范与实践',
    'Design',
    2,
    'ACTIVE'
),
(
    3,
    'GitHub Blog',
    'https://github.blog',
    'https://github.githubassets.com/favicons/favicon.png',
    '全球顶级开源生态与工程思考',
    'Blog',
    3,
    'ACTIVE'
)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
