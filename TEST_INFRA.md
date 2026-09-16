# Hayden Xue 个人博客与数字花园系统：端到端 (E2E) 自动化测试基础设施规范文档 (TEST_INFRA.md)

> **文档版本**: V2.0 (2026-09-08 R1~R5 工业级大重构版)  
> **编写架构师**: teamwork_preview_test_writer_e2e (E2E 测试套件设计与自动化测试架构师)  
> **核心规范依据**: `ORIGINAL_REQUEST.md` (2026-09-08T03:45:20Z R1-R5)、`PROJECT.md` (F1-F15, M1-M5)、`AGENTS.md`  
> **套件专用目录**: `e2e/`  
> **执行环境要求**: Node.js 24+ LTS (零外部 npm 依赖，原生 ESM + Fetch、FormData、Blob 与 Crypto)

---

## 1. 测试套件设计方法学与架构

本测试套件严格遵循 **不透明黑盒 (Opaque-box) 端到端验收测试** 原则，完全面向系统外在 HTTP API 契约、页面 HTML 渲染与业务网络行为建模，不侵入、不绑定后端 Java 业务代码或前端 Next.js 内部组件实现细节。

### 1.1 分层架构与设计原则

```text
╔════════════════════════════════════════════════════════════════════════════════════╗
║               Opaque-box E2E Acceptance Test Suite Architecture (169 Tests)       ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║ Tier 4: 真实业务场景全链路测试 (Real-World Scenarios, 6 Cases)                     ║
║         - 读者全链路旅程 / 站长高阶创作与运营 / 数字花园心智流 / 友链朋友圈闭环 /   ║
║           全站双主题沉浸漫游 / 系统全域安全防御                                    ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║ Tier 3: 跨功能端到端联动测试 (Cross-Feature Integration, 11 Cases)                 ║
║         - MinIO 直传与 Hero 视频联动 / 友链申请->审核->动态流 / CMS更新->ISR重验 / ║
║           足迹入库->地球仪飞渡->游记直达 / Now心智更新->看板->HUD / 混合存储一致性 ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║ Tier 2: 边界与安全防御测试 (Boundary & Security Defense, 76 Cases)                 ║
║         - 覆盖 F1~F15 每项特性 >= 5 个测试：存储回退 / 200MB 超限 / 恶意魔数拦截 /  ║
║           凭据防爆破 / 经纬度越界 / JSON 语法校验 / XSS 过滤 / 垂直越权 403 拦截   ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║ Tier 1: 功能全覆盖基线测试 (Feature Coverage Baseline, 76 Cases)                   ║
║         - 覆盖 F1~F15 每项特性 >= 5 个测试：MinIO策略 / 视频上传 / 连通性测试 /    ║
║           7大真实足迹 / Now心智流模型 / 友链自助申请 / 3D 地球仪 4.0 / 280px 侧栏  ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║ 基础设施层 (Test Runner Harness, HTTP Client, Contract Oracle, Custom Reporter)   ║
╚════════════════════════════════════════════════════════════════════════════════════╝
```

1. **测试确定性与状态隔离 (Independence & Isolation)**：
   - 每一个测试用例均自包含测试输入，基于动态时间戳生成唯一标识（如 `createRandomId('t1_reader')`）；
   - 测试用例之间不共享可变状态，无严格顺序依赖，每个套件均具备前置准备与自清理能力。
2. **权威预言机与期望推导 (Expected Output Derivation)**：
   - 严格对照 `PROJECT.md § Interface Contracts` 与 `ORIGINAL_REQUEST.md`，推导所有状态码、响应体结构与字段约束；
   - 内置 **Contract Oracle** 参考模型（`oracle.mjs`），忠实映射 Spring Boot + Next.js 外在契约，确保离线验证自闭环。
3. **渐进式可测性与双轨运行 (Progressive Testability & Dual Tracks)**：
   - **Contract Oracle 验证模式**（`--mock-oracle`）：执行全量 169 个测试，实现 100% 绿灯自测，验证测试套件断言自身的完备性、无死锁与逻辑严密性；
   - **Live 活体网络模式**（默认）：直接向活体运行的 Spring Boot (`localhost:8080`) 与 Next.js (`localhost:3000`) 发起真实网络 I/O，精准捕获待重构系统存在的真实缺陷。

---

## 2. 目录布局与模块清单

测试代码统一收敛于项目根目录 `e2e/` 下（严禁侵入业务代码与 `.agents/` 目录）：

```text
e2e/
├── config.mjs                       # 全局测试配置：服务地址、默认管理员账号、超时与模式参数
├── package.json                     # e2e 模块配置与一键运行 npm scripts
├── run-all.mjs                      # 测试套件统一执行入口、CLI 参数调度器与汇总报告输出
├── tiers/
│   ├── tier1-feature-coverage.mjs   # Tier 1：功能覆盖测试用例集 (76 个用例，F1~F15 全覆盖)
│   ├── tier2-boundary-security.mjs  # Tier 2：边界与安全防御测试用例集 (76 个用例，F1~F15 全覆盖)
│   ├── tier3-cross-feature.mjs      # Tier 3：跨功能联动测试用例集 (11 个用例，成对功能交互)
│   └── tier4-real-scenarios.mjs     # Tier 4：真实业务场景测试用例集 (6 个用例，全生命周期链路)
└── utils/
    ├── assertions.mjs               # 严苛断言库 (toBe, toBeDefined, toBeUndefined, toContain, toMatch 等)
    ├── client.mjs                   # ApiClient 与 FrontendClient (支持二进制流、魔数、DOM 契约扫描)
    ├── oracle.mjs                   # Contract Oracle 参考契约预言机 (含 15 项新特性模型实现)
    ├── reporter.mjs                 # 彩色终端控制台测试报告器与分层统计算法
    └── test-harness.mjs             # 测试调度器、异步生命周期引擎与过滤器
```

---

## 3. 全量测试用例矩阵 (169 Cases)

### 3.1 Tier 1: 功能覆盖基线测试 (76 Cases，F1~F15 每特性 >= 5)

| 用例 ID | 特性映射 | 测试目标 / 接口 | 权威预期结果断言 |
|:---:|:---:|:---|:---|
| **TC-T1-PREP** | Setup | 登录站长与注册读者 | 200 OK，生成合法 JWT，昵称为 Hayden Xue |
| **TC-T1-F01-01** | F1 | GET /api/settings | 200 OK，返回 storageType 为 'LOCAL' 或 'MINIO' |
| **TC-T1-F01-02** | F1 | PUT /api/settings | 200 OK，成功切换 storageType 为 'MINIO' |
| **TC-T1-F01-03** | F1 | POST /api/media/upload | 200 OK，MINIO 模式下返回 storageType='MINIO' 与云端直链 |
| **TC-T1-F01-04** | F1 | PUT /api/settings | 200 OK，成功切换 storageType 为 'LOCAL' |
| **TC-T1-F01-05** | F1 | POST /api/media/upload | 200 OK，LOCAL 模式下返回 storageType='LOCAL' 与本地直链 |
| **TC-T1-F02-01** | F2 | POST /api/media/upload | 200 OK，MP4 携带 ftyp 二进制头上传成功，fileType='video/mp4' |
| **TC-T1-F02-02** | F2 | POST /api/media/upload | 200 OK，WebM 携带 EBML 二进制头上传成功，fileType='video/webm' |
| **TC-T1-F02-03** | F2 | GET /api/media | 200 OK，媒体列表正确展现上传的视频文件元数据 |
| **TC-T1-F02-04** | F2 | POST /api/media/upload | 200 OK，JPEG 携带 SOI 0xFFD8FF 魔数上传成功 |
| **TC-T1-F02-05** | F2 | DELETE /api/media/{id} | 200 OK，媒体资源成功删除 |
| **TC-T1-F03-01** | F3 | POST /api/settings/test-minio | 200 OK，连通性测试返回 success=true，latencyMs > 0 |
| **TC-T1-F03-02** | F3 | GET /api/settings (读者) | 200 OK，minioSecretKey 严格脱敏为 null |
| **TC-T1-F03-03** | F3 | GET /api/settings (访客) | 200 OK，minioSecretKey 严格脱敏为 null |
| **TC-T1-F03-04** | F3 | GET /api/settings (管理员) | 200 OK，完整返回 minioEndpoint, bucket, publicUrl |
| **TC-T1-F03-05** | F3 | PUT /api/settings | 200 OK，在线更新 MinIO 凭据并持久化 |
| **TC-T1-F04-01** | F4 | GET /api/journey | 200 OK，返回非空真实旅行足迹数组 (>=7 条) |
| **TC-T1-F04-02** | F4 | GET /api/journey | 200 OK，包含北京 (39.9, 116.4) 与东京 (35.6, 139.6) 精准坐标 |
| **TC-T1-F04-03** | F4 | GET /api/journey | 200 OK，每条足迹均具备 title, city, cover, slug, lat, lon |
| **TC-T1-F04-04** | F4 | GET /api/journey/{slug} | 200 OK，通过 slug 获取游记详情返回对应城市与描述 |
| **TC-T1-F04-05** | F4 | GET /api/journey | 200 OK，严格杜绝任何未到访虚构硬编码假地点 |
| **TC-T1-F05-01** | F5 | GET /api/now | 200 OK，返回结构化 focusTopicsJson, readingNotesJson, currentCity 等 |
| **TC-T1-F05-02** | F5 | PUT /api/now | 200 OK，在线更新 focusTopicsJson 并持久化 |
| **TC-T1-F05-03** | F5 | PUT /api/now | 200 OK，在线更新 readingNotesJson 并持久化 |
| **TC-T1-F05-04** | F5 | PUT /api/now | 200 OK，在线更新 currentCity 物理驻留城市 |
| **TC-T1-F05-05** | F5 | PUT /api/now | 200 OK，在线更新 microLogsJson 近期微日志 |
| **TC-T1-F06-01** | F6 | POST /api/friends/apply | 200 OK，公开提交友链申请，初始状态为 PENDING |
| **TC-T1-F06-02** | F6 | GET /api/friends | 200 OK，公开友链仅返回 ACTIVE，不含 PENDING |
| **TC-T1-F06-03** | F6 | GET /api/friends/admin | 200 OK，管理员查看全量友链包含 PENDING 申请项 |
| **TC-T1-F06-04** | F6 | PUT /api/friends/{id}/status | 200 OK，审核通过友链为 ACTIVE，探活置为 ONLINE |
| **TC-T1-F06-05** | F6 | GET /api/friends/stream | 200 OK，友邻动态流返回聚合文章列表 |
| **TC-T1-F07-01** | F7 | VoyageGlobe | 确认组件支持动态绑定 GET /api/journey 真数据 |
| **TC-T1-F07-02** | F7 | VoyageGlobe | 确认组件彻底移除 PRESET_CITIES 硬编码数组 |
| **TC-T1-F07-03** | F7 | VoyageGlobe | 确认组件支持标准视窗与全屏漫游双模视窗切换 |
| **TC-T1-F07-04** | F7 | VoyageGlobe | 确认点击地标触发 1.2s Slerp 飞渡运镜动画 |
| **TC-T1-F07-05** | F7 | VoyageGlobe | 确认展开实拍胶片卡片包含直达游记博文超链接 |
| **TC-T1-F08-01** | F8 | BentoGrid | 确认包含 TechRadarCard 与 GardenMindFlowCard 核心卡片 |
| **TC-T1-F08-02** | F8 | TechRadarCard | 确认清晰展示 Java 21 / Next.js 14 / AI Agent 技术支柱 |
| **TC-T1-F08-03** | F8 | BentoGrid | 确认集成 SpotlightCard 鼠标光斑跟随交互 |
| **TC-T1-F08-04** | F8 | BentoGrid | 确认淘汰 CosmosGraph 混乱物理弹簧抖动 |
| **TC-T1-F08-05** | F8 | BentoGrid | 确认自适应多端响应式断点舒展呈现 |
| **TC-T1-F09-01** | F9 | LivingMindstream | 确认前台渲染攻坚技术专题时间线与百分比进度条 |
| **TC-T1-F09-02** | F9 | LivingMindstream | 确认前台呈现精辟书摘与经典引用卡片 |
| **TC-T1-F09-03** | F9 | LivingMindstream | 确认顶部展示物理驻留城市与近期微日志流 |
| **TC-T1-F09-04** | F9 | LivingMindstream | 确认剔除难看的虚假遥测与旋转黑胶唱片 |
| **TC-T1-F09-05** | F9 | LivingMindstream | 确认前台内容 100% 动态绑定 GET /api/now 数据 |
| **TC-T1-F10-01** | F10 | FriendCard | 确认卡片集成 3D 鼠标微视差悬浮反馈 (TiltCard) |
| **TC-T1-F10-02** | F10 | FriendCard | 确认支持在线健康探活 Ping 绿灯指示 |
| **TC-T1-F10-03** | F10 | FriendCard | 确认支持独立博客、极客同好与开源先锋三大分类 |
| **TC-T1-F10-04** | F10 | FriendCard | 确认集成交互式自助友链申请模态框 (FriendApplyModal) |
| **TC-T1-F10-05** | F10 | FriendCard | 确认集成友邻最新动态流组件 (FriendStream) |
| **TC-T1-F11-01** | F11 | HeroCinematicStage | 确认支持后台 CMS 切换为视频背景 |
| **TC-T1-F11-02** | F11 | HeroCinematicStage | 确认支持后台 CMS 切换为 WebGL 流光微粒背景 |
| **TC-T1-F11-03** | F11 | HeroCinematicStage | 确认标语配备字符级逐字渐现动效 |
| **TC-T1-F11-04** | F11 | HeroCinematicStage | 确认标语具备翡翠辉光现代极客排版美学 |
| **TC-T1-F11-05** | F11 | HeroCinematicStage | 确认视频离线或失败时平滑降级为微粒画布 |
| **TC-T1-F12-01** | F12 | ThemeDepth | 确认浅色模式具有明确三层景深（底色 #f8fafc -> 白瓷卡片） |
| **TC-T1-F12-02** | F12 | ThemeDepth | 确认深色模式具有明确三层景深（深曜石 #07090e -> 曜黑磨砂） |
| **TC-T1-F12-03** | F12 | ThemeDepth | 确认核心卡片具备 1px 极细微光边界 (border-white/[0.08]) |
| **TC-T1-F12-04** | F12 | ThemeDepth | 确认卡片与按钮具备平滑弹性物理悬浮微动效 |
| **TC-T1-F12-05** | F12 | ThemeDepth | 确认前台 HTML 具备规范的暗黑/浅色主题声明 |
| **TC-T1-F13-01** | F13 | PUT /api/settings | 200 OK，在线修改 Hero 标语及云端 4K 视频直链 |
| **TC-T1-F13-02** | F13 | POST /api/revalidate | 200 OK，CMS 保存自动触发 Next.js ISR 缓存重验 |
| **TC-T1-F13-03** | F13 | POST /api/revalidate | 200 OK，Now 页面支持按需触发 path=/now 缓存刷新 |
| **TC-T1-F13-04** | F13 | PUT /api/settings | 200 OK，关于页个人工牌与自述支持 CMS 可视化配置 |
| **TC-T1-F13-05** | F13 | GET /api/settings | 200 OK，前台公共接口零硬编码，站长姓名严格为 Hayden Xue |
| **TC-T1-F14-01** | F14 | AdminSidebar | 确认展开态固定宽度为 280px (w-[280px]) |
| **TC-T1-F14-02** | F14 | AdminSidebar | 确认主内容区域左外边距对齐 280px 消除压迫感 |
| **TC-T1-F14-03** | F14 | AdminSidebar | 确认菜单项点击高度满足 min-h-[38px] 提升呼吸感热区 |
| **TC-T1-F14-04** | F14 | AdminSidebar | 确认支持快捷折叠为紧凑图标态 |
| **TC-T1-F14-05** | F14 | AdminSidebar | 确认导航菜单完整覆盖全站核心管理板块 |
| **TC-T1-F15-01** | F15 | AdminPageHeader | 确认通用头部规范面包屑导航与标题徽章 |
| **TC-T1-F15-02** | F15 | AdminPageHeader | 确认统一页面头部右侧操作按钮组 |
| **TC-T1-F15-03** | F15 | AdminPageHeader | 确认统一列表搜索与状态筛选栏规范 |
| **TC-T1-F15-04** | F15 | AdminPageHeader | 确认统一数据表格与表单的圆角卡片容器 |
| **TC-T1-F15-05** | F15 | AdminPageHeader | 确认规范完整覆盖全部 16 个管理子路由页面 |

---

### 3.2 Tier 2: 边界与安全防御测试 (76 Cases，F1~F15 每特性 >= 5)

| 用例 ID | 特性映射 | 测试目标 / 接口 | 权威预期结果断言 |
|:---:|:---:|:---|:---|
| **TC-T2-PREP** | Setup | 登录管理员并注册读者 | 初始化边界与越权测试上下文 |
| **TC-T2-F01-01** | F1 | POST /api/settings/test-minio | 200 OK，MinIO 不可用时返回 success=false 友好错误而不崩溃 |
| **TC-T2-F01-02** | F1 | PUT /api/settings | 400 Bad Request，设置非法存储类型（如 UNKNOWN_S3）被拒绝 |
| **TC-T2-F01-03** | F1 | PUT /api/settings (读者) | 403 Forbidden，读者垂直越权尝试修改存储策略被拦截 |
| **TC-T2-F01-04** | F1 | PUT /api/settings (匿名) | 401/403，未登录请求修改存储策略被拦截 |
| **TC-T2-F01-05** | F1 | PUT /api/settings | 200 OK，存储切换操作具备幂等性 |
| **TC-T2-F02-01** | F2 | POST /api/media/upload | 400 Bad Request，伪造 MP4 后缀但含 PHP/JS 脚本被魔数校验拦截 |
| **TC-T2-F02-02** | F2 | POST /api/media/upload | 400/413，上传文件超过 200MB 最大限制被拒绝 |
| **TC-T2-F02-03** | F2 | POST /api/media/upload | 400 Bad Request，上传 0 字节空文件被拦截 |
| **TC-T2-F02-04** | F2 | POST /api/media/upload | 400 Bad Request，严禁上传 .html, .svg, .exe, .sh 等恶意格式 |
| **TC-T2-F02-05** | F2 | POST /api/media/upload | 400 Bad Request，损坏且截断魔数的 WebM 视频被拒绝 |
| **TC-T2-F03-01** | F3 | POST /api/settings/test-minio | 200 OK，不可达主机返回友好诊断信息不抛未捕获异常 |
| **TC-T2-F03-02** | F3 | POST /api/settings/test-minio | 200 OK，错误密钥凭据返回认证失败诊断结果 |
| **TC-T2-F03-03** | F3 | POST /api/settings/test-minio | 400 Bad Request，Bucket 传空返回参数校验错误 |
| **TC-T2-F03-04** | F3 | POST /api/settings/test-minio (读者) | 403 Forbidden，普通读者越权测试连通性被拦截 |
| **TC-T2-F03-05** | F3 | PUT /api/settings | 200 OK，包含特殊符号的 MinIO 密钥安全存储不发生注入与截断 |
| **TC-T2-F04-01** | F4 | GET /api/journey/{slug} | 404 Not Found，请求不存在的足迹 slug 返回标准 404 |
| **TC-T2-F04-02** | F4 | POST /api/journey | 400 Bad Request，纬度超出 -90~90 范围被拒绝 |
| **TC-T2-F04-03** | F4 | POST /api/journey | 400 Bad Request，经度超出 -180~180 范围被拒绝 |
| **TC-T2-F04-04** | F4 | POST /api/journey (读者) | 403 Forbidden，读者垂直越权发布足迹被拦截 |
| **TC-T2-F04-05** | F4 | POST /api/journey | 400 Bad Request，创建足迹时标题与城市为空被拦截 |
| **TC-T2-F05-01** | F5 | PUT /api/now | 400 Bad Request，focusTopicsJson 传入非法 JSON 语法被拦截 |
| **TC-T2-F05-02** | F5 | PUT /api/now | 400 Bad Request，readingNotesJson 传入非数组 JSON 被拦截 |
| **TC-T2-F05-03** | F5 | PUT /api/now | 200 OK，microLogsJson 中的潜在 XSS 脚本标签被安全清洗 |
| **TC-T2-F05-04** | F5 | PUT /api/now (读者) | 403 Forbidden，读者垂直越权修改 Now 心智流被拦截 |
| **TC-T2-F05-05** | F5 | PUT /api/now (匿名) | 401/403，未登录请求修改 Now 心智流被拦截 |
| **TC-T2-F06-01** | F6 | POST /api/friends/apply | 400 Bad Request，站点链接缺少 http/https 协议头被拦截 |
| **TC-T2-F06-02** | F6 | POST /api/friends/apply | 400 Bad Request，申请时站点名称为空被拦截 |
| **TC-T2-F06-03** | F6 | POST /api/friends/apply | 400 Bad Request，提交重复站点链接防重校验生效 |
| **TC-T2-F06-04** | F6 | POST /api/friends/apply | 400 Bad Request，包含 javascript: 伪协议的头像链接被拦截 |
| **TC-T2-F06-05** | F6 | PUT /api/friends/{id}/status (读者) | 403 Forbidden，读者垂直越权审批友链被拦截 |
| **TC-T2-F07-01** | F7 | VoyageGlobe | 确认 WebGL 上下文丢失事件侦听与防御不崩溃 |
| **TC-T2-F07-02** | F7 | VoyageGlobe | 确认滚轮缩放 FOV 严格限制在 45~120 度区间 |
| **TC-T2-F07-03** | F7 | VoyageGlobe | 确认连续快速双击地标 Beacon 动画不产生 NaN 异常 |
| **TC-T2-F07-04** | F7 | VoyageGlobe | 确认移动端触控手势双指缩放阻尼安全平滑 |
| **TC-T2-F07-05** | F7 | VoyageGlobe | 确认游记封面 404 时胶片卡片显示优雅缺省占位图 |
| **TC-T2-F08-01** | F8 | BentoGrid | 确认技术雷达数据为空时呈现整洁空状态不破坏网格 |
| **TC-T2-F08-02** | F8 | BentoGrid | 确认鼠标快速移出视窗时光斑平滑淡出不抛错 |
| **TC-T2-F08-03** | F8 | BentoGrid | 确认超长技术栈文本多行截断避免撑破卡片 |
| **TC-T2-F08-04** | F8 | BentoGrid | 确认减弱动效模式下关闭重度变换交互 |
| **TC-T2-F08-05** | F8 | BentoGrid | 确认全键盘 Tab 焦点可达性在所有卡片间畅通遍历 |
| **TC-T2-F09-01** | F9 | LivingMindstream | 确认 readingNotes 为空时展示架构专注占位提示 |
| **TC-T2-F09-02** | F9 | LivingMindstream | 确认攻坚专题进度超过 100% 自动安全钳制 |
| **TC-T2-F09-03** | F9 | LivingMindstream | 确认单行书摘超长时自适应展开折叠交互 |
| **TC-T2-F09-04** | F9 | LivingMindstream | 确认微日志中英文复杂排版与特殊符号不乱码 |
| **TC-T2-F09-05** | F9 | LivingMindstream | 确认离线弱网环境下展示友好断网重试提示 |
| **TC-T2-F10-01** | F10 | FriendCard | 确认 OFFLINE 友链展示沉着灰色指示灯而非绿色 |
| **TC-T2-F10-02** | F10 | FriendCard | 确认头像跨域或 404 挂掉时自动展示首字母头像 |
| **TC-T2-F10-03** | F10 | FriendCard | 确认申请未选分类时默认兜底赋予 INDEPENDENT_BLOG |
| **TC-T2-F10-04** | F10 | FriendCard | 确认申请提交按钮具备防抖防高频狂点锁定 |
| **TC-T2-F10-05** | F10 | FriendCard | 确认动态流为空时展示静候友邻新知插画占位 |
| **TC-T2-F11-01** | F11 | HeroCinematicStage | 确认视频直链 404 时平滑自愈回退至流光微粒背景 |
| **TC-T2-F11-02** | F11 | HeroCinematicStage | 确认视频标签严格设置 muted 和 playsinline 满足自动播放 |
| **TC-T2-F11-03** | F11 | HeroCinematicStage | 确认减弱动效偏好下标语关闭飞出动效改为直接渐显 |
| **TC-T2-F11-04** | F11 | HeroCinematicStage | 确认超宽屏与竖屏手机标语始终保持黄金分割线居中 |
| **TC-T2-F11-05** | F11 | HeroCinematicStage | 确认频繁切换背景类型不产生 WebGL 内存泄露 |
| **TC-T2-F12-01** | F12 | ThemeDepth | 确认高频狂点主题切换按钮不出现样式撕裂与白块闪烁 |
| **TC-T2-F12-02** | F12 | ThemeDepth | 确认首屏准确响应系统 prefers-color-scheme 暗黑偏好 |
| **TC-T2-F12-03** | F12 | ThemeDepth | 确认 1px 细微光边框对比度在双主题下均清晰可辨 |
| **TC-T2-F12-04** | F12 | ThemeDepth | 确认不支持 backdrop-filter 的降级浏览器采用高不透明度白瓷/黑曜 |
| **TC-T2-F12-05** | F12 | ThemeDepth | 确认主题状态在 localStorage 与 Cookie 间双端严格对齐 |
| **TC-T2-F13-01** | F13 | POST /api/revalidate | 400 Bad Request，缺少 path 参数返回标准校验错误 |
| **TC-T2-F13-02** | F13 | POST /api/revalidate (读者) | 401 Unauthorized，读者伪造请求刷新缓存被拦截 |
| **TC-T2-F13-03** | F13 | POST /api/revalidate (匿名) | 401 Unauthorized，匿名用户无密钥调用被拦截 |
| **TC-T2-F13-04** | F13 | POST /api/revalidate | 200 OK，刷新不存在的路径如 path=/not-exist 稳健响应不崩溃 |
| **TC-T2-F13-05** | F13 | POST /api/revalidate | 200 OK，合法 x-revalidate-secret Header 支持无 Session 安全触发 |
| **TC-T2-F14-01** | F14 | AdminSidebar | 确认移动端/平板视口 280px 侧栏自动转为浮动抽屉 (Drawer) |
| **TC-T2-F14-02** | F14 | AdminSidebar | 确认侧边栏折叠/展开偏好保存在 localStorage 保持记忆 |
| **TC-T2-F14-03** | F14 | AdminSidebar | 确认长名称菜单项自动省略并在 Hover 时浮动展示 Tooltip |
| **TC-T2-F14-04** | F14 | AdminSidebar | 确认移动端抽屉打开状态下按 Esc 键平滑关闭 |
| **TC-T2-F14-05** | F14 | AdminSidebar | 确认展开收起 CSS 过渡动画保持 60fps 不卡顿 |
| **TC-T2-F15-01** | F15 | AdminPageHeader | 确认面包屑层级超过 4 层时中间自适应折叠省略 |
| **TC-T2-F15-02** | F15 | AdminPageHeader | 确认搜索输入框具备 300ms 防抖避免高频网络冲击 |
| **TC-T2-F15-03** | F15 | AdminPageHeader | 确认筛选结果为 0 时展示统一 AdminEmptyState 占位卡片 |
| **TC-T2-F15-04** | F15 | AdminPageHeader | 确认小屏幕视口头部按钮折叠进“更多操作”下拉菜单 |
| **TC-T2-F15-05** | F15 | AdminPageHeader | 确认接口异常时在卡片内展示带有“一键重试”按钮的局部错误横幅 |

---

### 3.3 Tier 3: 跨功能端到端联动测试 (11 Cases)

| 用例 ID | 跨功能联动组合 | 测试链路与协同目标 | 预期结果断言 |
|:---:|:---|:---|:---|
| **TC-T3-PREP** | Setup | 登录站长与读者账号 | 建立跨会话联动测试上下文 |
| **TC-T3-01** | F1 + F2 + F3 + F11 | MinIO 云存储配置 -> 4K 视频上传 -> Hero 背景视频切换 | 200 OK，前台公共配置立即反映 MinIO 云端视频直链 |
| **TC-T3-02** | F6 + F10 | 读者自助申请友链 -> 站长审核过审 -> 友链流与健康指示展示 | 200 OK，审核后公网友链列表即时展现且探活绿灯亮起 |
| **TC-T3-03** | F13 + F11 | 动态 CMS 内容更新 -> Next.js ISR 缓存失效 -> 前台首屏呈现 | 200 OK，保存配置后触发 revalidate，前台首屏秒级生效 |
| **TC-T3-04** | F4 + F7 | 真实旅行足迹入库 -> 3D 地球仪地标联动 -> 游记博文直达 | 200 OK，新增足迹后地球仪自动渲染地标，点击直达游记 |
| **TC-T3-05** | F5 + F8 + F9 | 站长更新生活心智手记 -> 数字看板同步 -> Now HUD 实时生效 | 200 OK，更新 focusTopics，Bento与Now前台协同展现 |
| **TC-T3-06** | F1 + F2 | 存储策略切换 (Local <-> MinIO) 与媒体库跨存储混合生命周期 | 200 OK，Local 与 MinIO 上传的多媒体资源在媒体库安全共存 |
| **TC-T3-07** | F12 + F7 + F8 | 全站双主题层级美学与 3D 画布环境光晕自适应 | 确认切换深浅主题时，地球仪光晕与 Bento 光斑无缝切换 |
| **TC-T3-08** | F14 + F15 | 280px Studio 侧边栏导航与 16 个管理页面的统一 PageHeader 对齐 | 确认 16 个管理页面从 280px 侧栏进入均具备统一内边距与面包屑 |
| **TC-T3-09** | F6 + F10 | 友链在线探活状态改变与后台管理视图联动 | 200 OK，探活状态变更实时反映在管理控制台社区表格中 |
| **TC-T3-10** | F4 + F8 | 读者点赞足迹博文 -> 个人中心互动列表 -> 管理看板热度统计 | 200 OK，点赞后读者个人中心与后台流量看板热度双向同步 |

---

### 3.4 Tier 4: 真实业务场景全链路测试 (6 Cases)

| 用例 ID | 真实用户旅程场景 | 涉及模块全链路步骤 | 预期业务闭环 |
|:---:|:---|:---|:---|
| **TC-T4-01** | 读者端到端探索旅程 | 访问电影级首页 -> 探索 3D 真实足迹地球仪 -> 阅读游记博文 -> 自助申请友链 | 200 OK，普通访客完整体验视觉与内容交互闭环 |
| **TC-T4-02** | 站长高阶创作与运营全链路 | 登录 280px Studio 控制台 -> MinIO 凭据连通测试 -> 4K 循环视频上传 -> 设为 Hero 背景 -> 触发 ISR 缓存刷新 | 200 OK，站长端完成企业级云存储与全站视觉配置闭环 |
| **TC-T4-03** | 数字花园心智探索旅程 | 访问 Now 页面实时心智流 -> 查阅技术雷达攻坚进度 -> 阅读深度书摘 -> 查阅站点配置 | 200 OK，深度体验 Hayden Xue 数字花园心智流动 |
| **TC-T4-04** | 友链朋友圈互动闭环 | 体验 3D 卡片微视差 -> 检查在线探活指示灯 -> 打开模态框提交新站点 -> 管理员后台一键过审 | 200 OK，读者与站长双向社交互动网络生命周期闭环 |
| **TC-T4-05** | 全站双主题沉浸式漫游 | 深曜石与白瓷双模式切换 -> 三维景深对比 -> 光斑微光渲染 -> 页面无撕裂水合一致 | 确认【底色层 -> 内容卡片层 -> 悬浮交互层】视觉景深无瑕疵 |
| **TC-T4-06** | 系统全域安全防御闭环 | 前台 100% 隐蔽式入口扫描 -> 非白名单恶意脚本上传拦截 -> 垂直越权 403 阻断 -> 敏感密钥脱敏验证 | 确认网络攻坚与安全防御体系 100% 守住防线 |

---

## 4. 执行命令与验证方式

### 4.1 核心执行命令

```powershell
# 1. 契约预言机模式 (Contract Oracle Reference Mode - 100% PASS 确定性验证)
node e2e/run-all.mjs --mock-oracle

# 2. 活体环境集成模式 (Live Services Integration Mode - 扫描真实前后端缺陷)
node e2e/run-all.mjs

# 3. 容忍失败模式 (输出缺陷清单而不中断 exitCode)
node e2e/run-all.mjs --allow-failures

# 4. 按分层单独执行
node e2e/run-all.mjs --mock-oracle --tier=1   # 仅执行 Tier 1 功能覆盖测试 (76 用例)
node e2e/run-all.mjs --mock-oracle --tier=2   # 仅执行 Tier 2 边界与安全测试 (76 用例)
node e2e/run-all.mjs --mock-oracle --tier=3   # 仅执行 Tier 3 跨功能联动测试 (11 用例)
node e2e/run-all.mjs --mock-oracle --tier=4   # 仅执行 Tier 4 真实业务场景测试 (6 用例)

# 5. 通过 e2e 子包 npm 执行
npm test --prefix e2e
```

### 4.2 验证与失效判定准则 (Verification & Invalidation)

1. **确定性验收条件**：在 `--mock-oracle` 模式下，全量 169 个测试必须 **100.0% 全部 PASS**，零失败、零跳过。
2. **实施阶段缺陷捕获**：在活体集成模式下，若某特性尚未实现（如 M1 MinIO 尚未联调或 M5 侧边栏尚未调整为 280px），测试必须严格精准失败并给出断言差异（AssertionError），严禁写出无论如何都绿灯的门面测试 (Facade Tests)。
3. **身份纯正性铁律**：全站所有断言与预期输出中，站长姓名必须严格且唯一使用 `Hayden Xue`，严禁出现任何历史遗留名称。
