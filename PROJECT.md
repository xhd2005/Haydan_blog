# Project: Hayden Xue 个人博客与数字花园全新视觉、架构与智能伴读重构

## Architecture
- **系统架构**：现代全栈工程架构（B/S）
  - **后端（Backend）**：Java 21 + Spring Boot 3.3.4 + Spring Security 6 + MyBatis-Plus 3.5.7 + JJWT 0.12.6 + Caffeine 内存缓存 + Spring Mail + 虚拟线程并发（Virtual Threads）
  - **前端（Frontend）**：Next.js 14 (App Router) + React 18 + TypeScript 5 + Tailwind CSS + 原生 Three.js (v0.185.1) + Framer Motion (v11.11.1) + Lucide Icons + Canvas Confetti
  - **AI 引擎与智能体**：商汤日日新 / DeepSeek `deepseek-v4-flash` 高速推理 + 本地虚拟线程高保真模拟降级
- **模块边界与数据流**：
  1. **前台公开空间（Client Space）**：
     - 完全隐匿管理端入口，提供极客暗黑/明亮双语自适应浏览。
     - 首页过渡区集成 Three.js 3D 几何罗盘滚动吸附解构舞台（Scrollytelling）。
     - Bento 展区嵌入 3D Cosmos Graph 2.0 引力粒子星图与足迹 Voyage Globe 2.0 点阵发光地球。
     - 读者浏览文章时，通过划词追问（Inline Spark）或 `Cmd+J` 平滑展开右侧 380px 伴读抽屉（Sidebar Co-pilot），无遮挡研读。
     - 随记（Memos）100% 保持 3D 拍立得拟真质感、双击红心微粒子与背面 EXIF 翻转。
  2. **管理后台（Studio Console Space）**：
     - 根布局完全隔离（`SiteLayoutShell`），访问 `/admin/*` 彻底消除前台 Navbar 与 Footer，提供 100vw/100vh 独立沉浸式控制台。
     - Linear / Vercel 深灰黑极简美学、1px 微光精细边界、可折叠侧边栏（260px/68px）、专属 `Cmd+K` 全局命令面板。
     - 五大职能矩阵：概览仪表盘、创作工坊、知识与足迹、读者社区、系统与智能体。
     - 专属隐秘暗门：前台无任何显式入口，站长专属 `Cmd+Shift+L` 或 `/admin/login` 唤起。

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 前后台完全隔离外壳 | 根布局根据路由判定，访问 `/admin/*` 彻底移除 `<Navbar />`、`<Footer />` 与 `max-w-6xl` 约束，呈现独立全屏布局 | M1 | R1 |
| 2 | 前台管理入口彻底隐匿 | 排查并移除 `Navbar.tsx` 与 `profile/page.tsx` 中残留的管理入口，前台公开界面 0 暴露 | M1 | R1 |
| 3 | 全局暗门快捷键与独立登录 | 全局监听 `Cmd+Shift+L` / `Ctrl+Shift+L`，未登录导向 `/admin/login`，已登录直达后台；提供独立全屏暗黑登录页 | M1 | R1 |
| 4 | Linear/Vercel 风格 Studio 侧边栏与布局 | 深灰黑纯粹底色、1px 微光精细边界、紧凑可折叠侧边栏（260px/68px）、面包屑导航 | M1 | R1 |
| 5 | Studio 全局命令面板 Cmd+K | 后台专属全局命令面板，支持文章搜索、页面快速跳转、快捷操作与主题切换 | M1 | R1 |
| 6 | 五大职能矩阵完整重构 | 结构化整合：概览仪表盘、创作工坊、知识与足迹（支持🌱/🌿/🌲成熟度）、读者社区、系统与智能体 | M1 | R1 |
| 7 | Cosmos Graph 2.0 3D 粒子引力星图 | 基于原生 Three.js，具备 1200+ 粒子星尘云、立体景深、弹簧-引力摄动物理模拟、鼠标引力波纹扩散环 | M2 | R2 |
| 8 | 玻璃拟态知识脉络抽屉 | Cosmos Graph 2.0 点击节点唤出 Glassmorphic 侧边知识脉络，展现成熟度与关联博文直达 | M2 | R2 |
| 9 | Voyage Globe 2.0 点阵发光地球仪 | 等距柱状采样经纬度发光点阵大陆（InstancedMesh 批量渲染数千个发光微粒） | M2 | R2 |
| 10 | 地球仪大气层光晕 Atmospheric Bloom | 自定义 Fresnel Shader 材质实现外层大气散射边缘光辉 | M2 | R2 |
| 11 | 飞行航迹流光粒子束与 Beacon 呼吸环 | 贝塞尔航线上高速流动的彗星粒子流束；城市探针包含光束与同心圆扩散渐隐呼吸环 | M2 | R2 |
| 12 | 地球仪惯性手势旋转与触控降级 | 物理速度阻尼惯性旋转，全面支持移动端 touch 手势拖拽与自动平滑回退慢转 | M2 | R2 |
| 13 | 首页首屏 Scrollytelling 吸附舞台 | 在 Hero 与 Bento 之间插入 `h-[260vh]` 轨道 + `sticky top-0 h-screen` 舞台，RAF 平滑阻尼计算滚动百分比 | M3 | R3 |
| 14 | 3D 几何科技罗盘多层装配 | 4 层级精密几何体（核心能量晶体、内层精密刻度环、中层双轴星轨、外层立体多面体线框） | M3 | R3 |
| 15 | 滚动 360° 翻转与悬浮分层解构算法 | 0~35% 空间 360° 翻转，35%~75% 悬浮向外分层解构拆开（Exploded View），核心晶体发光脉冲 | M3 | R3 |
| 16 | 三大技术支柱联动浮现与跳转 | 伴随 3D 罗盘解构，左右动态浮现 Java 21、Next.js 14、AI 智能体支柱卡片，支持点击直达技术博文 | M3 | R3 |
| 17 | Scrollytelling 主题自适应与移动端降级 | 跟随暗黑/明亮主题的环境光与材质反光自适应调节，移动端自适应纵向排版与触控优化 | M3 | R3 |
| 18 | Cursor/Arc 风格右侧伴读抽屉面板 | 废除传统居中弹窗，采用 ~380px 宽度半透明毛玻璃侧边抽屉，桌面端页面自适应并排留白无遮挡 | M4 | R4 |
| 19 | 快捷键 Cmd+J 与灵动胶囊 | 全局监听 `Cmd+J` / `Ctrl+J` 与 `Esc`，右下角展示带呼吸动画与快捷键提示的灵动胶囊随时呼出 | M4 | R4 |
| 20 | 正文划词追问交互闭环 | 博文划选文字弹出 Inline Spark 气泡，点击平滑展开伴读抽屉并自动填入选区上下文与 articleId | M4 | R4 |
| 21 | 代码块语法高亮与一键复制 | 针对 AI 回复中的代码块，提供语法高亮色彩、语言标牌、右上角一键复制到剪贴板与打字机光标动效 | M4 | R4 |
| 22 | 后端 deepseek-v4-flash 流式链路与知识注入 | 直连 deepseek-v4-flash 与 SenseNova，注入数字花园知识背景，无 Key 时高保真虚拟线程模拟 | M4 | R4 |
| 23 | 随记拍立得 3D 拟真质感与细节保持 | 锁定保持 3D 拟真相纸、错落随机微倾斜、双击 canvas-confetti 红心微粒子爆炸与背面 3D 翻转 EXIF 面板 | M4 | R5 |
| 24 | 全栈编译构建与自动化测试全量验收 | `mvn test` 100% 绿灯（45+ 测试用例），`pnpm build` 100% 通过（33 路由），端到端体验全量验收 | M5 | AC 1~9 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 前后台完全隔离与全屏 Linear/Vercel 风格 Studio 控制台 | 根布局隔离消除前台 Navbar/Footer，清除前台残留管理入口，Cmd+Shift+L 快捷键与独立登录，深灰黑 100vw/100vh 控制台，可折叠侧边栏，Cmd+K 命令面板，五大职能矩阵结构整合。 | none | DONE |
| M2 | 3D 思维引力星图与航海地球仪全新视觉跃升 | Cosmos Graph 2.0（3D 透视、粒子星尘、引力摄动物理、波纹扩散、玻璃拟态脉络）；Voyage Globe 2.0（点阵发光大陆、大气层 Bloom、流动航线、Beacon 呼吸环、惯性手势）。 | none | DONE |
| M3 | 首页首屏过渡区 Three.js 3D 几何罗盘滚动解构核心 | HeroPinnedScrollytelling 吸附舞台（260vh），4 层 3D 几何罗盘，0~35% 360°翻转，35~75% 分层解构拆开，三大技术支柱卡片联动与跳转，主题自适应与移动端降级。 | none | DONE |
| M4 | Hayden AI 智能伴读抽屉重构与随记拍立得无损保持 | 改造为 ~380px 右侧毛玻璃抽屉并排无遮挡，Cmd+J 快捷键与灵动胶囊，划词追问自动注入，代码高亮与一键复制，流式光标；100% 锁定并保持 Memos 拍立得 3D 拟真与粒子翻转。 | none | DONE |
| M5 | 全栈全量编译构建、端到端测试与质量对抗验收 | 运行前后端全量构建与自动化测试（`mvn test` 与 `pnpm build` 100% 绿灯），E2E 测试核验全量交付体验标准，Forensic Auditor 独立核查。 | M1, M2, M3, M4 | DONE |

## Interface Contracts
### 1. 根布局前后台隔离协议 (SiteLayoutShell)
- **输入**：`pathname = usePathname()`
- **行为**：
  - 若 `pathname.startsWith('/admin')`：直接渲染 `{children}`，不渲染 `<Navbar />`、`<Footer />`、`<AiAssistantModal />`，不添加 `max-w-6xl` 容器。
  - 若其他前台路由：正常包裹 `<Navbar />`、`<main className="max-w-6xl mx-auto ...">{children}</main>`、`<Footer />`、`<AiAssistantModal />`。
- **暗门快捷键**：
  - 全局监听 `(e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'l' || e.key === 'L')`。
  - 已登录管理员路由至 `/admin/dashboard`，未登录路由至 `/admin/login`。

### 2. Cosmos Graph 2.0 知识节点交互协议
- **数据结构**：`StarNode3D` 包含 `id`, `name`, `nameEn`, `category`, `basePosition`, `color`, `metadata: { maturity, articlesCount, tags, summary, link }`。
- **点击交互**：Raycaster 点击后展开 Glassmorphic 知识抽屉，展示成熟度与关联文章链接。

### 3. Hero Pinned 3D Scrollytelling 协议
- **容器**：`relative h-[260vh]` 轨道 + `sticky top-0 h-screen` 吸附舞台。
- **状态流**：`scrollProgress: 0.00 ~ 1.00`。
- **解构阶段**：
  - `[0.00, 0.35]`：罗盘绕 X/Y 轴 360° 空间立体翻转。
  - `[0.35, 0.75]`：罗盘 4 层分层向外解构拆开，左右浮现三大技术支柱卡片（opacity 0 -> 1, scale 0.95 -> 1）。
  - `[0.75, 1.00]`：解构稳定，自然滚动脱离。

### 4. Hayden AI 伴读抽屉交互协议
- **唤起事件**：`CustomEvent('open-hayden-ai', { detail: { selectedText?: string, articleId?: number } })`。
- **状态响应**：抽屉在屏幕右侧平滑滑出（`translateX(0)`），桌面端宽屏（>=1280px）时主内容区域设置 `pr-[380px]` 并排无遮挡。
- **后端接口**：`POST /api/ai/chat`，请求体 `{ prompt, messages, articleId, selectedText }`，响应流 `text/event-stream`。

## Code Layout
- `frontend/components/layout/SiteLayoutShell.tsx` (新)：根级路由条件隔离外壳
- `frontend/app/layout.tsx`：根布局挂载
- `frontend/app/admin/layout.tsx`：Studio 全屏控制台布局（可折叠侧边栏、Cmd+K）
- `frontend/components/admin/AdminSidebar.tsx` (新)：Linear 风格侧边栏
- `frontend/components/admin/AdminCommandPalette.tsx` (新)：Studio 专属 Cmd+K 面板
- `frontend/components/bento/CosmosGraph.tsx`：升级为 3D 粒子引力星图
- `frontend/components/journey/VoyageGlobe.tsx`：升级为点阵发光地球仪
- `frontend/components/home/HeroPinnedScrollytelling.tsx` (新)：首页首屏 3D 几何罗盘滚动解构舞台
- `frontend/app/page.tsx`：首页集成 Scrollytelling 舞台
- `frontend/components/ai/AiAssistantModal.tsx`：升级重构为 Cursor/Arc 伴读抽屉
- `frontend/components/memos/PolaroidMemoCard.tsx`：100% 保持 3D 拍立得拟真与红心粒子翻转
