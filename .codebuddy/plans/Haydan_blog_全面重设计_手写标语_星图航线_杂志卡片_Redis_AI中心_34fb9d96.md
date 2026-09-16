---
name: Haydan_blog 全面重设计：手写标语·星图航线·杂志卡片·Redis·AI中心
overview: 按用户确认的四项决策全面重设计：①交互星图航线替换 3D 罗盘；②暗黑主导+纸感浅色设计系统基座；③删除全息看板直进博文流；④三批次实施（视觉重造→后台易用性→Redis/用户主页/AI 中心页），同步完成 e2e 契约大迁移。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Cinematic Obsidian 暗黑电影感
    - Paper Porcelain 纸感瓷白
    - Handwritten Slogan 手写描绘
    - Star Atlas 交互星图
    - Magazine Card 杂志卡片
    - Mission Console 任务控制台
  fontSystem:
    fontFamily: Noto Sans SC
    heading:
      size: 40px
      weight: 800
    subheading:
      size: 22px
      weight: 700
    body:
      size: 15px
      weight: 400
  colorSystem:
    primary:
      - "#10B981"
      - "#14B8A6"
      - "#06B6D4"
    background:
      - "#090A0F"
      - "#17181D"
      - "#FBFBFD"
      - "#FFFFFF"
    text:
      - "#E5E7EB"
      - "#9CA3AF"
      - "#0F172A"
      - "#475569"
    functional:
      - "#F43F5E"
      - "#F59E0B"
      - "#8B5CF6"
todos:
  - id: design-foundation
    content: 用 [skill:ui-ux-pro-max] 检索规范后落地设计系统基座：纸感浅色、media-scrim、Caveat 字体注册
    status: completed
  - id: handwritten-hero
    content: 新建 HandwrittenSlogan 手写描绘标语并接入 Hero，统一前后台视频遮罩
    status: completed
    dependencies:
      - design-foundation
  - id: star-atlas
    content: 新建 VoyageStarAtlas 交互星图替代罗盘挂载位，真实 journeys 航线与涟漪交互
    status: completed
    dependencies:
      - design-foundation
  - id: bento-teardown
    content: 删除 BentoGrid 与罗盘组件，TechMatrixCard 迁关于页，清理 bento 目录
    status: completed
    dependencies:
      - star-atlas
  - id: e2e-migration
    content: e2e 大迁移：删罗盘/看板测试、新建星图断言、tier F8 用例改写，保持 169 全绿
    status: completed
    dependencies:
      - bento-teardown
  - id: magazine-lists
    content: 新建 MagazineCard 并统一博客/项目/足迹/随记/友链五列表页
    status: completed
    dependencies:
      - design-foundation
  - id: about-explorer
    content: 关于页重做：删工程准则矩阵、迁入工程矩阵、工牌与 Terminal 优化
    status: completed
    dependencies:
      - bento-teardown
  - id: admin-unify
    content: 后台宽度统一（AdminPageShell + 布局治理 + 16 页散值收敛）与登录页重设计
    status: completed
    dependencies:
      - magazine-lists
  - id: media-picker-covers
    content: MediaPickerModal 扩展 image 模式并接入博文/项目/旅程封面字段
    status: completed
    dependencies:
      - admin-unify
  - id: redis-cache
    content: 用 [subagent:code-explorer] 核实后接入 Redis 缓存层（pom/配置/CacheConfig/降级），mvn test 保持绿灯
    status: completed
  - id: user-public-home
    content: 新建 /u/[username] 公开主页与后端脱敏公开接口
    status: completed
    dependencies:
      - magazine-lists
  - id: ai-brain-center
    content: 新建 /ai 外脑中心页（Tool-Call 时间线 + 溯源卡 + 会话三栏）
    status: completed
  - id: final-verify
    content: 全量验证：双端构建 + e2e 169 + 用 [skill:playwright-cli] 与 [skill:agent-browser] 双主题截图验收
    status: completed
    dependencies:
      - handwritten-hero
      - star-atlas
      - bento-teardown
      - e2e-migration
      - magazine-lists
      - about-explorer
      - admin-unify
      - media-picker-covers
      - redis-cache
      - user-public-home
      - ai-brain-center
---

## 用户需求（13 项，四轮讨论后四项关键决策已锁定）

1. 首页标语 Apple「hello」手写平滑描绘动效（From the East, toward the unknown.），艺术字体
2. 背景视频浅色模式看不清，需主题自适应遮罩重设计（含后台 16:9 预览画布）
3. 3D 罗盘缺陷+空白 →【已确认替换为交互星图航线】2D Canvas 星图 + 真实旅程城市发光航线，悬停涟漪、点击直达游记，零滚动劫持零空白
4. 数字空间全息看板鸡肋 →【已确认删除 BentoGrid】，技术矩阵移至关于页
5. 博客/项目/足迹/随记/友链五列表页统一杂志卡片语言重设计
6. 关于页：删除三大核心工程准则矩阵；保留并优化 3D 工牌 + 极客 mini Terminal；其余按"探索者档案"重设计，要炫丽、展示个人特色
7. AI 助手全面重新设计
8. 浅色深色切换显示差别太大 →【已确认暗黑主导 + 纸感浅色独立设计（非反色）】
9. 后台管理每个页面宽度不一致 → 统一收敛
10. 后台登录页面太丑 → 重设计
11. 后台操作不便（封面图 MinIO/URL 选择）→ MediaPicker 扩展到全部封面字段
12. 用户系统差、用户没有主页 → 新建公开主页 /u/[username] + 后端公开接口
12b. RAG 和缓存接入 Redis（49.233.166.212:6379，密码 redis_caKGch）→ 一期缓存层、二期 RAG 向量库（可选）
13. AI 做成 agent 要有 toolcall 和 RAG → 事实：后端已是 LangChain4j Function Calling + GardenToolRegistry + True RAG + SSE tool_status；需前端 Tool-Call 过程可视化 + /ai 外脑中心页

实施批次（已确认）：第一批视觉重造（首页+五列表页+关于页）→ 第二批后台（宽度/登录/媒体选择器）→ 第三批（Redis+用户主页+AI 中心页）。

## 产品概述
Hayden Xue 个人博客与数字花园（Next.js 14 + Spring Boot 3.3）的全面风格重塑：以「暗黑电影感为绝对主角、纸感浅色为独立变体」重建设计系统基座，用交互星图取代问题罗盘，删除鸡肋看板，统一全站视觉语言，并补齐后台易用性、Redis 缓存、用户主页与 AI 外脑中心四大能力。

## 核心功能
- 手写描绘标语 + 主题自适应视频 Hero + 交互星图航线
- 五列表页统一杂志卡片 + 关于页探索者档案
- 后台宽度统一 + 登录页重设计 + 封面媒体选择器
- Redis 缓存层 + 用户公开主页 + AI 外脑中心（Tool-Call 可视化）


## 技术栈
- 前端：Next.js 14.2.15 (App Router) + React 18 + TypeScript + Tailwind CSS + framer-motion 11（沿用，零新增重型依赖；星图用原生 2D Canvas，不引 three.js）
- 字体：Google Fonts 手写字体（Caveat / La Belle Aurore）经 next/font/google 自托管加载
- 后端：Spring Boot 3.3.4 + Java 25 + MyBatis-Plus + spring-boot-starter-data-redis + spring-boot-starter-cache（新增 Redis 依赖）
- 测试：e2e 契约预言机 169 用例迁移适配 + pnpm build / mvn test 106 回归

## 实施策略

### 批次一：视觉重造

**1. 设计系统基座（globals.css + tailwind.config + 字体）**
- 深色（主角）：曜石黑 `#090a0f` 底、卡片 `bg-neutral-900/60`、`border-white/[0.08]` 微光边界、翡翠极光三色 `#10b981→#14b8a6→#06b6d4`、Ambient Glow 环境光晕——即"电影感暗黑"为默认体验。
- 浅色（独立纸感变体，非反色）：瓷白 `#fbfbfd` 底、墨黑 `#0f172a` 高对比文字、卡片纯白+多级实影（shadow-sm→xl）、`border-slate-200/80`；**所有媒体内容（视频/星图/封面）上层统一加深色纱幕 `bg-black/25~35`**，保证浅色模式下媒体可读性与电影感一致——这是解决需求 2/8 的核心机制，抽为工具类 `.media-scrim`。
- 字体：next/font/google 引入 Caveat（手写标语专用，variable font，仅 hero 使用，不影响全局字体栈）；全局仍 Noto Sans SC + JetBrains Mono。
- 新增工具类：`media-scrim`（媒体纱幕）、`paper-card`（浅色纸感卡）、保留 starfield/motion-primitives。

**2. 首页重造**
- **手写标语**：新建 `components/home/HandwrittenSlogan.tsx`——SVG `<text>` 引用 Caveat 字体 + stroke-dasharray/dashoffset 描绘动画（约 2.4s，描绘完成填充渐隐落版为稳定渐变文字），替代现有逐字 reveal；中文场景回退为渐变笔刷显现。Framer Motion 控制时序，respects prefers-reduced-motion（直接落版）。
- **视频遮罩**：HeroCinematicStage 视频层遮罩改为 `media-scrim` 工具类——浅色模式视频上叠 `bg-black/30` 纱幕 + 文字区磨砂白瓷卡；深色保持现有暗角。后台 HeroLivePreview 同步统一（同一工具类）。
- **交互星图航线**：新建 `components/home/VoyageStarAtlas.tsx`（原生 2D Canvas，约 300 行）——深空星点背景（CSS starfield 叠加 Canvas 视差星层）+ 真实 journeys 城市发光节点（数据经 props 传入，API 失败时展示纯星图空态）+ 城市间发光贝塞尔航线 + 悬停节点涟漪扩散 + 点击 `router.push('/journey/{slug}')`；容器 `h-[70vh]` 自然文档流，**零 sticky 零滚动劫持**；替代 HeroPinnedScrollytelling 在 page.tsx 的挂载位。
- **删除 BentoGrid**：page.tsx 移除 BentoGrid 挂载与 Reveal 包裹，Hero/星图后直进 Latest Thoughts；`TechMatrixCard.tsx` 迁移至关于页（复用为"全栈工程矩阵"区块）；删除 `components/bento/` 目录（BentoGrid/SpotlightCard/GardenMindFlowCard 随删，TechMatrixCard 移出后删除空目录）；删除 `HeroPinnedScrollytelling.tsx`（three.js 消费者收敛为 VoyageGlobe + HeroCinematicStage 粒子）。
- Now HUD / About 收尾卡 / 各区块杂志卡沿用并统一新卡片语言。

**3. 五列表页杂志卡片统一**
- 新建 `components/ui/MagazineCard.tsx`：大封面（16/9 或 4/3，Ken Burns 悬停慢缩放）+ 星历徽标（复用 StardateBadge）+ 标题 + 摘要 + 底部元信息行 + 悬停 3D 微视差（复用 motion-primitives 曲线）；双主题适配（浅色 paper-card、深色磨砂）。
- blog/projects/journey/memos/links 五页列表统一替换为 MagazineCard 栅格（memos 拍立得保留翻转特性但外壳统一；links 友链卡保留探活灯）。
- e2e 若对列表卡有结构断言（grep 复核），同步适配。

**4. 关于页探索者档案重做**
- 删除 `EngineeringPhilosophyMatrix.tsx` 及其在 about/page.tsx 的挂载（全库仅此处引用，已核实）。
- 保留并优化 `ParallaxBadge3D`（工牌：加星历编号栏与极光描边）与 `GeekMiniTerminal`（保留交互，补 mission 指令彩蛋）。
- 新增「全栈工程矩阵」区块：迁入 TechMatrixCard（复用现有组件，包一层纸感/磨砂适配）。
- 其余区块（LivingPulseCapsule/GrowthChronicleTimeline）沿用新基座视觉微调。

**5. e2e 大迁移（与批次一同步）**
- 删除：`test_tech_matrix_challenger.mjs`（整文件）、`test_scrollytelling_deep_adversarial.mjs`（整文件）；`test_3d_adversarial.mjs` 罗盘段（Test 1.2 几何体 dispose）移除，保留 VoyageGlobe 段。
- 改写：`test_m2_layout_spacing_adversarial.mjs` 罗盘/Track/Bento 锚点断言 → 星图容器与 Hero→Latest Thoughts 流式衔接断言；`test_m1_container_overflow.mjs` BentoGrid 12 列断言 → 杂志卡栅格断言；`utils/client.mjs` inspectBentoGrid → inspectStarAtlas（检查 VoyageStarAtlas.tsx 存在性与 journeys 绑定）；tier1-4 中 F8（Bento）用例改写为星图契约用例（保持 169 总数）。
- 新增：星图 2D Canvas 资源清理断言（cancelAnimationFrame + 事件解绑）、手写标语 SVG 存在性断言。

### 批次二：后台易用性

**6. 后台宽度统一**
- 布局层治理：`app/admin/layout.tsx` main 容器由 `max-w-[1600px]` 调整为统一 `max-w-6xl`（数据密集型页如 media/analytics 经 `wide` prop 放行 max-w-7xl）；批量移除 16 个页面根部的 `max-w-4xl/5xl/6xl/7xl` 散值（grep 清单已探明：users/timeline/links/tags/settings/journey/projects/comments/posts/categories/audit-logs/analytics/now/memos/media/posts-create/posts-edit）。
- 新建 `components/admin/AdminPageShell.tsx` 供特殊页显式声明宽度，避免再次发散。

**7. 登录页重设计**
- `app/admin/login/page.tsx` 视觉重做：左侧任务控制台叙事区（星轨背景 + Hayden Studio 徽章 + 实时状态灯）+ 右侧磨砂登录卡（现有逻辑/验证码/主题切换全部保留），深色电影感主导。

**8. 封面媒体选择器扩展**
- MediaPickerModal 增加 `mimePrefix="image/"` 用法；在 posts create/edit、projects、journey 管理页的封面字段旁统一加「媒体库选择」按钮（复用现有组件，逐页接入）。

### 批次三：基建

**9. Redis 缓存层**
- pom.xml 新增 `spring-boot-starter-data-redis` + `spring-boot-starter-cache`；application.yml 配置 host/port/password（49.233.166.212:6379 / redis_caKGch）+ `spring.cache.type=redis`。
- 新建 `config/CacheConfig.java`：@EnableCaching + RedisCacheManager（JSON 序列化、分区 TTL：settings 300s / homeFeed 60s / analytics 30s）；应用于 SiteSettingService.getPublicSettings、PostService 首页聚合、DashboardService 统计。
- **优雅降级**：Redis 连接失败时缓存操作静默跳过（自定义 CacheErrorHandler 仅记日志），应用无 Redis 可正常启动运行；测试环境（H2）默认 `spring.cache.type=none` 保证 mvn test 106 不受外部依赖影响。
- RAG 向量库迁移 Redis EmbeddingStore 列为可选二期（本期不动 AiService）。

**10. 用户公开主页**
- 后端：`UserController` 新增 `GET /api/users/{username}/public`（脱敏返回 nickname/avatar/bio/注册时间 + 该用户 APPROVED 评论分页 + 点赞文章列表，禁止暴露 email/role）；新增对应 Service 方法与 DTO。
- 前端：新建 `app/u/[username]/page.tsx`（杂志卡语言：头像极光描边 + 简介 + 评论足迹时间线 + 点赞列表）；Navbar 头像下拉与评论区用户名加链接。
- 安全：公开接口只读、字段白名单、无鉴权但限流（复用现有 IP 限流 AOP 若已抽象）。

**11. AI 外脑中心页 + Tool-Call 可视化**
- 新建 `app/ai/page.tsx`：全屏外脑中心（复用 AiAssistantModal 的 SSE 链路 api.streamAiChat），三栏布局——左侧会话列表/右侧对话流/底部输入，Tool-Call 时间线组件（tool_status 事件按时间轴渲染：工具名、参数摘要、状态、耗时），citations 溯源卡复用并强化（点击直达 + 星历徽标）。
- AiAssistantModal 抽屉保持快捷场景，头部加「进入外脑中心」跳转；Navbar 加 AI 入口。
- 后端零改动（SSE 契约已完备）。

**12. 全量验证**
- pnpm build 0 错误 + mvn test 106 绿灯 + e2e 169/169 + Edge 无头截图验收（首页手写标语/星图/浅色视频遮罩/五列表页/关于页/登录页/AI 中心页 双主题）。

## 架构设计
- 前端分层：设计系统基座（globals/tokens/工具类）→ 共享组件（MagazineCard/StardateBadge/VisaStamp/motion-primitives/MediaPickerModal）→ 页面层。所有视觉决策下沉基座，页面零即兴。
- 星图与手写标语为纯客户端组件（'use client'），数据经 Server Component page.tsx 注入（journeys/settings），失败优雅空态。
- 后端缓存层以 Spring Cache 抽象切入，业务零侵入；公开用户接口独立 DTO 白名单。
- e2e 契约随架构迁移同步演进，保持 169 用例规模与分层覆盖。

## 目录结构（关键变更）
```
frontend/
├── app/page.tsx                                  # [MODIFY] 星图替代罗盘、删除 BentoGrid、杂志卡接入
├── app/globals.css                               # [MODIFY] 纸感浅色基座 + media-scrim + paper-card
├── app/layout.tsx                                # [MODIFY] Caveat 字体注册（next/font）
├── app/about/page.tsx                            # [MODIFY] 删工程准则矩阵、迁入 TechMatrixCard、工牌/Terminal 优化
├── app/blog/page.tsx + app/projects/page.tsx + app/journey/page.tsx + app/memos/page.tsx + app/links/page.tsx  # [MODIFY] MagazineCard 统一
├── app/ai/page.tsx                               # [NEW] AI 外脑中心页（Tool-Call 时间线 + 溯源卡）
├── app/u/[username]/page.tsx                     # [NEW] 用户公开主页
├── app/admin/layout.tsx                          # [MODIFY] 统一内容宽度治理
├── app/admin/login/page.tsx                      # [MODIFY] 登录页重设计
├── app/admin/{posts/create,posts/edit/[id],projects,journey}/page.tsx  # [MODIFY] 封面媒体选择器接入
├── components/home/HandwrittenSlogan.tsx         # [NEW] SVG 手写描绘标语
├── components/home/VoyageStarAtlas.tsx           # [NEW] 2D Canvas 交互星图航线（替代罗盘）
├── components/home/HeroCinematicStage.tsx        # [MODIFY] media-scrim 主题自适应遮罩 + 手写标语接入
├── components/home/HeroPinnedScrollytelling.tsx  # [DELETE] 罗盘组件（three.js 消费者-1）
├── components/bento/                             # [DELETE] 整目录（TechMatrixCard 先迁至 about/components/）
├── components/ui/MagazineCard.tsx                # [NEW] 五列表页统一杂志卡
├── components/admin/AdminPageShell.tsx           # [NEW] 后台宽度外壳
├── components/admin/HeroLivePreview.tsx          # [MODIFY] media-scrim 统一
backend/
├── pom.xml                                       # [MODIFY] +spring-boot-starter-data-redis +spring-boot-starter-cache
├── src/main/resources/application.yml            # [MODIFY] Redis 连接与缓存配置
├── src/main/java/com/howard/blog/config/CacheConfig.java      # [NEW] 缓存管理器与分区 TTL + 错误降级
├── src/main/java/com/howard/blog/controller/UserController.java         # [MODIFY] 公开主页接口
├── src/main/java/com/howard/blog/service/impl/{SiteSettingServiceImpl,PostServiceImpl}.java  # [MODIFY] @Cacheable 接入
e2e/
├── test_tech_matrix_challenger.mjs               # [DELETE]
├── test_scrollytelling_deep_adversarial.mjs      # [DELETE]
├── test_3d_adversarial.mjs                       # [MODIFY] 移除罗盘段
├── test_m2_layout_spacing_adversarial.mjs        # [MODIFY] 星图衔接断言
├── test_m1_container_overflow.mjs                # [MODIFY] 杂志卡栅格断言
├── utils/client.mjs                              # [MODIFY] inspectBentoGrid→inspectStarAtlas
├── test_star_atlas_adversarial.mjs               # [NEW] 星图 Canvas 生命周期对抗测试
└── tiers/{tier1,tier2,tier3,tier4}-*.mjs         # [MODIFY] F8 Bento 用例改写为星图契约
```

## 实施注意
- **性能**：星图为原生 2D Canvas + 单 RAF 循环（卸载 cancelAnimationFrame + resize 解绑 + 指针事件解绑），节点数 = journeys 数量（<50），O(n) 每帧；手写 SVG 动画一次性播放不循环；Redis 缓存均为短 TTL 读多写少场景。
- **优雅降级**：星图无 journeys 时展示纯星野+引导文案；手写标语字体加载失败回退系统斜体；Redis 不可达时缓存静默跳过。
- **e2e 红线**：迁移后 169 用例总数与 Tier 分层结构保持；three.js 剩余消费者的 dispose 断言不动。
- **AGENTS.md 铁律**：星图城市 100% 来自数据库 journeys（禁硬编码虚构点）；双主题三层级景深；CMS 可管理；Hayden Xue 命名。
- **Git 安全**：Redis 密码仅入 application.yml（生产），不入任何前端代码与文档明文示例。


## 设计系统基座：Cinematic Obsidian（暗黑主导）× Paper Porcelain（纸感浅色）

**核心理念**：深色是"电影放映厅"——星图、视频、极光在黑暗中才有生命力；浅色不是反色，而是独立设计的"高对比艺术纸"——墨色文字、清晰投影层级、所有媒体统一加盖深色纱幕保持电影感。两套主题共享同一结构骨架与动效语言，切换时布局零跳动，仅材质与光影切换。

**首页叙事流**：手写描绘标语（Caveat 艺术字，2.4s 描绘落版）→ 电影视频/粒子 Hero（主题自适应纱幕）→ 交互星图航线（真实城市发光节点 + 贝塞尔航线 + 涟漪）→ 杂志卡博文流。零滚动劫持，全部自然文档流。

**杂志卡片语言**（五列表页统一）：大封面 + 星历编号徽标 + 悬停 Ken Burns + 3D 微视差；深色磨砂卡、浅色纸感卡。

**关于页**：探索者档案——3D 工牌（加星历栏）+ 极客 Terminal + 全栈工程矩阵（迁入）+ 真实足迹胶片。

**AI 外脑中心**：深空控制台三栏，Tool-Call 时间线为视觉核心（工具调用如任务指令链展开）。

**后台**：Mission Console 统一宽度 + 登录页双栏叙事（左星轨右磨砂卡）。

## Agent Extensions
### Skill
- **ui-ux-pro-max**
  - Purpose: 设计系统基座落地前检索 dark-mode cinematic、paper texture light theme、handwriting animation、star map 的成熟设计规范与反模式（对比度/可访问性红线）
  - Expected outcome: 深浅双主题的对比度全部达标（浅色正文 4.5:1+）、手写动画时长与缓动有据可依
- **lucide-icons**
  - Purpose: 为星图图例、MagazineCard、AI 中心页、登录页等新 UI 检索一致的 SVG 图标
  - Expected outcome: 全部新界面元素使用统一 Lucide 图标集，零 emoji
- **playwright-cli**
  - Purpose: 验证手写标语描绘完成态、星图悬停涟漪与点击跳转、浅色模式视频可读性、后台登录页渲染
  - Expected outcome: 关键交互路径截图与断言通过
- **agent-browser**
  - Purpose: 双主题截图验收首页/五列表页/关于页/AI 中心页/后台
  - Expected outcome: 桌面+移动视口双主题截图确认视觉达标（Chromium 受限时回退 Edge 无头）
### SubAgent
- **code-explorer**
  - Purpose: 批次一开工前复核五列表页与 e2e 受影响断言的精确清单；批次三开工前核实 User 实体公开字段与现有公开接口鉴权模式
  - Expected outcome: 产出精确的改造文件清单与接口契约，避免实施期返工
