-- H2 Data Seed
MERGE INTO users (id, username, password_hash, nickname, avatar, email, role, status)
KEY(id)
VALUES (1, 'admin', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', 'Hayden Xue', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces', 'hayden.xue@example.com', 'ADMIN', 'ACTIVE');

MERGE INTO categories (id, name, slug, description) KEY(id) VALUES
(1, 'Technology', 'technology', '关于前沿技术、系统架构与技术选型'),
(2, 'AI', 'ai', '人工智能、大语言模型与智能体实践'),
(3, 'Programming', 'programming', '日常编程手记、工程规范与代码审美'),
(4, 'Life', 'life', '生活随笔、思考感悟与真实日常'),
(5, 'Travel', 'travel', '旅行摄影、城市探索与人文风物'),
(6, 'Thoughts', 'thoughts', '长期思考、心智模型与数字花园哲学');

MERGE INTO tags (id, name, slug) KEY(id) VALUES
(1, 'Java', 'java'),
(2, 'Spring Boot', 'spring-boot'),
(3, 'Next.js', 'nextjs'),
(4, 'AI', 'ai'),
(5, 'TypeScript', 'typescript'),
(6, 'Travel', 'travel'),
(7, 'Architecture', 'architecture'),
(8, 'React', 'react');

MERGE INTO site_settings (id, site_name, site_description, slogan, bio, logo, avatar, email, github_url, twitter_url, instagram_url, seo_title, seo_description)
KEY(id)
VALUES (
    1,
    'Hayden Xue Personal Blog',
    'I am Hayden Xue, a software developer and lifelong learner exploring technology, AI, and the world.',
    'From the East, toward the unknown.',
    'I am a software engineer passionate about clean code, robust backend architectures, modern interactive frontend designs, and artificial intelligence.',
    '/logo.svg',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
    'hayden.xue@example.com',
    'https://github.com',
    'https://twitter.com',
    'https://instagram.com',
    'Hayden Xue - Personal Blog & Digital Garden',
    'Personal blog and digital space of Hayden Xue. Thoughts on software development, AI, projects, and life.'
);

MERGE INTO now_records (id, learning, building, exploring, thinking, focus_topics_json, reading_notes_json, current_city, micro_logs_json, music_track_json, mood_status)
KEY(id)
VALUES (
    1,
    '- 深入实践 Java 25 虚拟线程 (Virtual Threads) 高并发与现代特性\n- 研读智能体协调框架与 Multi-Agent 架构设计\n- 探索现代 Web 端 Shiki 代码渲染与暗色排版细节',
    '- 打造全新的个人博客与数字花园系统 (Hayden Xue Personal Blog V2.0)\n- 搭建前后端分离的现代化个人数字资产中枢',
    '- 城市徒步与建筑摄影 (Street & Architecture Photography)\n- 下一代 Generative UI 与响应式流式交互范式',
    '- 个人数字花园如何成为长效的心智外脑，而非转瞬即逝的碎片化社交信息？\n- 在大模型时代，软件工程师的核心壁垒正在向何处迁移？',
    '[{"title":"Project Loom 虚拟线程并发实战","progress":95,"badge":"核心演进","tags":["Java 25","Concurrency"]},{"title":"Next.js 14 现代响应式空间美学","progress":95,"badge":"前端重构","tags":["Next.js","Three.js"]},{"title":"商汤日日新 / DeepSeek AI 智能体体系","progress":90,"badge":"智能伴读","tags":["Agent","LLM"]}]',
    '[{"title":"Designing Data-Intensive Applications","author":"Martin Kleppmann","cover":"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&fit=crop","quote":"可靠性、可扩展性与可维护性是支撑数字系统的三大基石。","note":"精读第5章分布式复制与一致性模型"},{"title":"Building Microservices (2nd Edition)","author":"Sam Newman","cover":"https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&fit=crop","quote":"服务解耦与自治性决定了分布式架构的演进上限。","note":"研读微服务拆分与演进模式"}]',
    '杭州 · 滨江',
    '[{"date":"2026-09-08","content":"完成 MinIO 生产云存储与 Java 25 虚拟线程架构升级，博客数字花园性能大幅跃升。"},{"date":"2026-09-06","content":"重构 Now 页面，引入生活心智流与经典书摘。"}]',
    '{"title":"Cornfield Chase","artist":"Hans Zimmer · Interstellar OST","albumCover":"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop","audioUrl":"","platformUrl":"https://music.163.com","note":"星际穿越原声，在时空视界与引力波中构建数字花园。"}',
    '⚡ 深度心流 85%'
);

MERGE INTO timeline (id, `year`, title, description, sort_order) KEY(id) VALUES
(1, '2026', '构建个人数字花园 V1.0', '正式发布基于 Next.js 与 Spring Boot 3 的全新全栈个人主页与长效数字空间。', 10),
(2, '2025', '全面拥抱 AI 研发新范式', '深入实践 LLM 智能体应用架构开发，重构个人工程技术体系。', 20),
(3, '2024', '全栈技术栈沉淀与架构演进', '在分布式后端架构、现代前端工程化领域深度打磨。', 30),
(4, '2022', '踏上软件工程之路', '开始在技术与未知世界中探索，确立“From the East, toward the unknown.”的个人座右铭。', 40);

MERGE INTO posts (id, title, slug, excerpt, content, cover, category_id, status, featured, reading_time, view_count, seo_title, seo_description, published_at)
KEY(id)
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
    CURRENT_TIMESTAMP
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
    CURRENT_TIMESTAMP
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
    CURRENT_TIMESTAMP
);

MERGE INTO post_tags (post_id, tag_id) KEY(post_id, tag_id) VALUES
(1, 4), (1, 6),
(2, 1), (2, 2), (2, 7),
(3, 3), (3, 5), (3, 8);

MERGE INTO projects (id, name, slug, description, content, cover, technologies, github_url, demo_url, featured, status, start_date)
KEY(id)
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
    '2026-01-01'
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
    '2025-06-01'
);

MERGE INTO journeys (id, title, slug, country, city, description, content, cover, latitude, longitude, start_date, end_date)
KEY(id)
VALUES (
    1,
    '京都：枯山水与红叶古刹的静谧沉思',
    'kyoto-zen-gardens',
    '日本',
    '京都',
    '漫步于鸭川河畔与岚山竹林，在龙安寺的方丈庭院中感受枯山水禅意美学。',
    '# 京都：枯山水与红叶古刹\n\n京都的清晨总是笼罩在薄雾中。龙安寺的十五块岩石在白砂波纹中若隐若现，无论从哪个角度看，总有一块石头隐匿于视野之外——这正是东方美学中关于“不完美与留白”的哲思。\n\n## 鸭川三角洲\n傍晚坐在鸭川的跳水石上，水流从脚下掠过，对岸传来街头琴师悠扬的吉他声。\n\n## 岚山竹林径\n风过竹海，清脆的沙沙声洗涤了都市的喧嚣。',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=630&fit=crop',
    35.0116,
    135.7681,
    '2025-04-05',
    '2025-04-10'
),
(
    2,
    '东京：赛博都市脉搏与秋叶原灵感漫游',
    'tokyo-cyber-pulse',
    '日本',
    '东京',
    '穿梭在涩谷全向十字路口的霓虹光海与银座的建筑几何之间，感触全球顶级都会的脉动。',
    '# 东京：赛博都市脉搏\n\n从涉谷的天空俯瞰整个关东平原，密集的都市建筑群在夜色中化为流淌的光之电路。\n\n## 涩谷十字路口\n每当绿灯亮起，成千上万的人流汇聚又分散，犹如计算机内部高速运转的总线数据。\n\n## 银座建筑考察\n各具特色的建筑立面不仅是商业空间，更是空间美学与工程工艺的集大成者。',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&h=630&fit=crop',
    35.6762,
    139.6503,
    '2025-04-11',
    '2025-04-15'
),
(
    3,
    '重庆：立体魔幻山城与长江岸边的赛博折叠',
    'chongqing-mountain-city',
    '中国',
    '重庆',
    '穿梭在八维立体的轻轨与穿江索道之中，探寻长江岸边的市井烟火与多维空间折叠。',
    '# 重庆：立体山城空间折叠\n\n你永远不知道你脚下的一楼，在另一个方向是否其实是二十二楼。\n\n## 穿楼而过的轻轨\n李子坝站的列车呼啸穿入居民楼，工程奇迹与日常生活在此自然共生。\n\n## 洪崖洞与两江夜景\n夜幕降临时，洪崖洞金碧辉煌的吊脚楼倒映在嘉陵江面上，宛如千与千寻的现实画卷。',
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&h=630&fit=crop',
    29.5630,
    106.5516,
    '2024-10-01',
    '2024-10-07'
),
(
    4,
    '北京：紫禁城古建与中轴线历史回响',
    'beijing-imperial-axis',
    '中国',
    '北京',
    '漫步于故宫朱红城墙与景山之巅，俯瞰北京中轴线严整壮丽的古典秩序美学。',
    '# 北京：中轴线的历史回响\n\n登上景山万春亭，正南方的紫禁城三大殿在阳光下金碧辉煌，严整对称的中轴线贯通古今。\n\n## 胡同与树影\n南锣鼓巷与五道营的深处，青砖灰瓦与老槐树的浓荫下，藏着老北京最地道的市井从容。\n\n## 798 艺术区\n包豪斯风格的锯齿形厂房蜕变为当代艺术先锋空间，机械文明与当代创意在这里交融。',
    'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&h=630&fit=crop',
    39.9042,
    116.4074,
    '2024-11-15',
    '2024-11-20'
),
(
    5,
    '上海：外滩百年天际线与梧桐树下的海派风尚',
    'shanghai-bund-horizon',
    '中国',
    '上海',
    '沿黄浦江畔眺望陆家嘴三件套与万国建筑博览群，感受古典与现代极致同框的海派魅力。',
    '# 上海：海派文明与现代天际线\n\n一江之隔，左手是沉淀了百年的万国建筑博览群，右手是刺破云端的陆家嘴现代超高层建筑。\n\n## 武康路的梧桐深处\n漫步法租界街区，西班牙式公寓与法式花园洋房掩映在梧桐绿荫中，街角咖啡馆飘荡着手冲的香气。\n\n## 西岸艺术中心的江风\n原油罐与码头起重机改造成的滨江美术馆群，夕阳下江轮鸣笛而过，充满现代工业美感。',
    'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=1200&h=630&fit=crop',
    31.2304,
    121.4737,
    '2025-01-02',
    '2025-01-06'
),
(
    6,
    '杭州：西湖水墨烟雨与未来科技城的心智共振',
    'hangzhou-westlake-cyber',
    '中国',
    '杭州',
    '从苏堤春晓的淡妆浓抹到未来科技城的极客生态，在数字经济之都体验古今交响。',
    '# 杭州：水墨与算力的共振\n\n杭州是一座独特的城市，既有白居易苏东坡笔下千古吟咏的江南诗意，又是中国数字经济与云计算的高地。\n\n## 西湖长桥与茅家埠\n清晨泛舟茅家埠，水鸟掠过芦苇荡，远处的雷峰夕照在云雾中若隐若现。\n\n## 滨江与未来科技城\n高新园区内彻夜明亮的窗棂，见证了无数工程师与创业者探索未知技术边界的热忱。',
    'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?w=1200&h=630&fit=crop',
    30.2741,
    120.1551,
    '2025-05-18',
    '2025-05-22'
),
(
    7,
    '深圳：大湾区创新引擎与南海之滨的硬核科技浪潮',
    'shenzhen-tech-bay',
    '中国',
    '深圳',
    '在深圳湾大桥的晚霞与华强北的创客世界中，感受中国最具速度与活力的创新精神。',
    '# 深圳：南海之滨的创新热土\n\n作为改革开放的前沿与科技创新的先锋，深圳展现了惊人的生机与自我迭代能力。\n\n## 深圳湾科技生态园\n漫步在深圳湾滨海长廊，远眺春笋大厦与香港元朗群山，夕阳洒满金色海面。\n\n## 华强北创客精神\n全球最大的电子元器件集散地，任何奇思妙想都能在几天内变成硬件原型。',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=630&fit=crop',
    22.5431,
    114.0579,
    '2025-08-10',
    '2025-08-15'
);

MERGE INTO site_settings (id, site_name, site_description, slogan, bio, logo, avatar, email, github_url, twitter_url, instagram_url, seo_title, seo_description, hero_title, hero_slogan, hero_description, about_bio_zh, about_bio_en, about_interests, announcement_enabled, announcement_text, announcement_link, footer_text, icp_number, bg_music_url, hero_bg_type, hero_video_url, storage_type, minio_endpoint, minio_bucket, minio_access_key, minio_secret_key, minio_public_url)
KEY(id)
VALUES (
    1,
    'Hayden Xue Personal Blog',
    '基于东方，探索未知。记录技术探索、AI智能体、旅行足迹与长期成长。',
    'From the East, toward the unknown.',
    '软件工程师 · 终身学习者 · 数字花园建造者。追求干净架构与克制设计。',
    NULL,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
    'hayden.xue@example.com',
    'https://github.com',
    'https://twitter.com',
    'https://instagram.com',
    'Hayden Xue - Personal Blog & Digital Garden',
    'Hayden Xue 的个人博客与数字花园，记录技术沉淀、AI思考与全球旅行手记。',
    'From the East,',
    'toward the unknown.',
    'I''m Hayden, a software developer and lifelong learner exploring technology, AI, and the world.',
    '你好！我是 Hayden Xue。我喜欢追求干净的架构、有温度的代码以及优雅而克制的界面设计。在这个技术日新月异的时代，我深信：最好的学习方法是公开记录与实践创造。这也是我亲手构建这个博客与数字花园的初衷。除了后端架构与现代前端的探索，你还会看到我关于人工智能、智能体研发、摄影旅行与生活哲学的思考。',
    'Hey, I''m Hayden Xue. I believe code is the tangible form of thinking and a tool to explore the unknown. This website is my digital garden to document technology, AI, photography, travel, and personal growth.',
    '[{"icon":"Cpu","label_zh":"软件系统架构","label_en":"Software Architecture"},{"icon":"Brain","label_zh":"人工智能与智能体","label_en":"AI & Autonomous Agents"},{"icon":"Code","label_zh":"编程工匠精神","label_en":"Programming Craftsmanship"},{"icon":"Compass","label_zh":"全球旅行探索","label_en":"Travel & Exploration"},{"icon":"Camera","label_zh":"街头与建筑摄影","label_en":"Street Photography"}]',
    1,
    '🎉 Hayden Xue Personal Blog V2.0 现已全面升级！支持双语与即时随记互动。',
    '/memos',
    '© 2026 Hayden Xue. Built with Java 21 & Next.js 14.',
    '京ICP备20260905号-1',
    'https://cdn.freesound.org/previews/518/518175_6142149-lq.mp3',
    'video',
    'https://assets.mixkit.co/videos/preview/mixkit-cyber-city-night-traffic-aerial-view-34440-large.mp4',
    'local',
    'http://localhost:9000',
    'hayden-blog',
    'minioadmin',
    'minioadmin',
    ''
);

MERGE INTO memos (id, content, images, like_count, is_pinned)
KEY(id)
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
);

MERGE INTO friends (id, name, url, avatar, description, category, sort_order, status, ping_status, response_time_ms)
KEY(id)
VALUES (
    1,
    'Hayden Lab',
    'https://haydenxue.com',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    '探索前沿软件工程、Java 21 与智能体实验',
    '独立博客',
    1,
    'ACTIVE',
    'ONLINE',
    38
),
(
    2,
    'Vercel Design',
    'https://vercel.com/design',
    'https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png',
    '极简现代 Web 设计美学规范与空间交互',
    '极客同好',
    2,
    'ACTIVE',
    'ONLINE',
    82
),
(
    3,
    'GitHub Blog',
    'https://github.blog',
    'https://github.githubassets.com/favicons/favicon.png',
    '全球顶级开源生态与现代软件工程思考',
    '开源先锋',
    3,
    'ACTIVE',
    'ONLINE',
    116
);

MERGE INTO now_records (id, learning, building, exploring, thinking, focus_topics_json, reading_notes_json, current_city, micro_logs_json, updated_at)
KEY(id)
VALUES (
    1,
    '正在深入探索 Java 21 虚拟线程 (Project Loom) 与响应式高吞吐架构实战...',
    '正在研发 Hayden Xue 个人博客与数字花园系统 V2.0，整合 Three.js 探索地球仪与 MinIO 原生存储...',
    '在西湖水墨烟雨与未来科技城极客生态之间，探寻数字交互与人文艺术的共鸣边界...',
    '持续思考个人知识库如何长效沉淀，以及智能体辅助思考时代的工程师心智模型迁移...',
    '[{"title":"Project Loom 虚拟线程并发实战","progress":90,"badge":"核心演进","tags":["Java 21","Concurrency"]},{"title":"Next.js 14 现代响应式空间美学","progress":95,"badge":"前端重构","tags":["Next.js","Three.js"]},{"title":"商汤日日新 / DeepSeek AI 智能体体系","progress":80,"badge":"智能伴读","tags":["Agent","LLM"]}]',
    '[{"title":"Designing Data-Intensive Applications","author":"Martin Kleppmann","cover":"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&fit=crop","quote":"可靠性、可扩展性与可维护性是支撑数字系统的三大基石。","note":"精读第5章分布式复制与一致性模型"},{"title":"Building Microservices (2nd Edition)","author":"Sam Newman","cover":"https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&fit=crop","quote":"服务解耦与自治性决定了分布式架构的演进上限。","note":"研读微服务拆分与演进模式"}]',
    '杭州 · 滨江',
    '[{"date":"2026-09-08","content":"完成 MinIO 云存储与虚拟线程架构升级，博客数字花园性能大幅跃升。"},{"date":"2026-09-06","content":"重构 Now 页面，引入生活心智流与经典书摘。"}]',
    CURRENT_TIMESTAMP
);

