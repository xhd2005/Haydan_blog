---
name: Haydan_blog 罗盘修复·后台工作台·星际远航IP·AI外脑全面升级
overview: 六大升级：①罗盘滚动叙事修复（280vh 长轨道+进度硬绑定+退场编排消空白）；②Hero 视频 MediaPicker 与模式切换状态修复；③后台工作台化重构（Dashboard 待办聚合+快捷操作+侧栏分组）；④「星际远航」IP 视觉系统（星历编号、航线叙事、签证印章点缀）；⑤AI 外脑全面对话面板（流式输出+RAG 溯源+站点导航+划词即问）；⑥双端构建与 e2e 全量回归。
design:
  architecture:
    framework: react
  styleKeywords:
    - Interstellar Voyager
    - Mission Control HUD
    - Stardate 星历编号
    - Visa Stamp 签证印章
    - Aurora Glassmorphism
    - Scrollytelling
  fontSystem:
    fontFamily: Noto Sans SC / PingFang SC + JetBrains Mono
    heading:
      size: 36-72px
      weight: 800
    subheading:
      size: 20-24px
      weight: 700
    body:
      size: 14-16px
      weight: 400
  colorSystem:
    primary:
      - "#10B981"
      - "#14B8A6"
      - "#06B6D4"
    background:
      - "#FBFBFD"
      - "#FFFFFF"
      - "#090A0F"
      - "#17181D"
    text:
      - "#0F172A"
      - "#475569"
      - "#E5E7EB"
    functional:
      - "#F43F5E"
      - "#F59E0B"
      - "#8B5CF6"
todos:
  - id: ai-admin-recon
    content: 用 [subagent:code-explorer] 核实 AI 流式/RAG 契约、待办计数接口与 Media 实体结构
    status: completed
  - id: compass-rebuild
    content: 罗盘轨道加长 280vh + 进度硬绑定 + 退场编排 + Bento 咬合，同步 e2e 断言
    status: completed
  - id: hero-media-picker
    content: 新建 MediaPickerModal 接入设置页，修复视频选择与模式切换状态提示
    status: completed
    dependencies:
      - ai-admin-recon
  - id: admin-workbench
    content: 后台 Dashboard 工作台化重构 + AdminSidebar 三组分组与视觉统一
    status: completed
    dependencies:
      - ai-admin-recon
  - id: voyager-ip-system
    content: 用 [skill:ui-ux-pro-max] 与 [skill:lucide-icons] 落地星历编号、签证印章、星轨背景与发射台叙事
    status: completed
    dependencies:
      - compass-rebuild
  - id: ai-copilot-panel
    content: AI 外脑面板重构：流式打字机、引用溯源卡、对话式导航、划词整合
    status: completed
    dependencies:
      - ai-admin-recon
  - id: verify-all
    content: 双端构建与 e2e 169 回归，用 [skill:playwright-cli] 验证罗盘四阶段与视频选择流，[skill:agent-browser] 截图验收
    status: in_progress
    dependencies:
      - compass-rebuild
      - hero-media-picker
      - admin-workbench
      - voyager-ip-system
      - ai-copilot-panel
---

## 用户需求（7 点，决策已确认）

1. **罗盘动画修复**：首页 3D 几何罗盘展开动画未完成页面即滑过。已确认方案【加长轨道+硬绑定】：轨道 150vh 加长至约 280vh，滚动进度与动画近 1:1 映射，物理上无法跳过；90%~100% 区间加退场编排。
2. **罗盘-看板空白消除**：舞台 100vh 高中部居中导致下半屏空白 + sticky 释放间距。方案：退场编排（罗盘缩小上移淡出）+ Bento 看板负 margin 与顶部羽化渐变交叠咬合。
3. **Hero 视频功能修复**：设置页无法从 Media Hub（MinIO）选择已上传视频；切换显示效果不生效。方案：新增媒体库选择器（MediaPicker）、video 模式未配置 URL 时的明确状态提示（消除静默回退）、保存链路即时校验。
4. **后台管理工作台化重构**（已确认范围）：Dashboard 聚合待办（待审友链/评论/草稿）+ 快捷操作岛 + 最近动态流；AdminSidebar 按「内容创作/资产运营/系统」分组；整体视觉升级。
5. **个人 IP 星际远航方向**（已确认 A 主+B 点缀）：统一叙事骨架「发射台 Hero → 导航罗盘 → 任务看板 Bento → 航线图地球仪 → 探索日志博文」；星历编号系统（LOG №001 / Stardate）应用于博文与旅程卡；旅程页签证印章 SVG 点缀；保留翡翠极光品牌色系。
6. **AI 外脑全面对话面板**（已确认深度）：流式打字机输出、RAG 引用溯源卡片（点击直达原文）、对话式站点导航、划词即问（现有 InlineAiSpark 收编整合）。
7. 初衷定位：多元混合，默认「自我沉淀为内容底座、个人品牌为呈现主线、连接同好为互动收尾」。

## 产品概述
Hayden Xue 个人博客与数字花园（Next.js 14 + Spring Boot 3.3），本次迭代聚焦：修复罗盘与视频两个功能性缺陷、后台工作台化、星际远航 IP 视觉体系、AI 外脑升级，全面提升个性化与专业度。

## 核心功能
- 滚动叙事罗盘修复与无缝衔接
- Hero 视频媒体库选择与模式切换修复
- 后台 Dashboard 工作台（待办/快捷操作/动态流）
- 星历编号与签证印章视觉记忆点
- AI 外脑对话面板（流式/溯源/导航/划词）


## 技术栈
- 前端：Next.js 14.2.15 (App Router) + React 18 + TypeScript + Tailwind CSS + framer-motion 11 + three.js（沿用现有栈，零新增重型依赖）
- 后端：Spring Boot 3.3（AI 溯源如需返回 sources 字段时少量增强 AiService 响应契约）
- 测试：e2e 契约预言机 169 用例 + 对抗性脚本同步适配 + pnpm build / mvn test 回归

## 实施策略

### 1. 罗盘修复与空白消除（HeroPinnedScrollytelling.tsx）
- **轨道加长**：外层 Track `h-[150vh]` → `h-[280vh]`（行程约 180vh ≈ 1700px+，快速滚动无法一次冲过；避开 e2e 禁止的 `260vh` 字符串）。
- **进度硬绑定**：`alpha` 0.08 → 0.4（收敛约 6~10 帧 ≈ 100~170ms，人眼无感知滞后，保留微平滑防抖），进度 = 滚动位置的即时映射；鼠标视差阻尼 alpha 0.07 保持不变。
- **退场编排**（新增第四段，progress 0.88~1.0）：罗盘整体 scale 0.75 + Y 上移淡出 + 支柱卡片收拢，100% 时舞台底部视觉收束。
- **Bento 咬合**：`app/page.tsx` 中 BentoGrid 的 Reveal 容器加 `-mt-16 sm:-mt-20` 负 margin + 顶部 `bg-gradient-to-b from-transparent to-background` 羽化过渡带，实现与舞台的交叠顶入。
- **e2e 同步**：`test_m2_layout_spacing_adversarial.mjs` MODULE1 与 `test_scrollytelling_deep_adversarial.mjs` 的 `h-[150vh]` 断言更新为 `h-[280vh]`；保持 15 个几何体 dispose、`useEffect` 依赖 `[resolvedTheme]` 纯净、`pointer-events-none`、`sticky top-16 h-[calc(100vh-4rem)]` 全部对抗性断言不破。

### 2. Hero 视频功能修复
- **MediaPickerModal**（新建 `components/admin/MediaPickerModal.tsx`）：调用 `api.getMedia({ page, pageSize, keyword })`（已核实存在），按 `video/mp4|webm` 过滤，网格预览 + 搜索 + 一键回填 `heroVideoUrl`；在 settings Hero 区视频 URL 输入框旁加「从媒体库选择」按钮。
- **静默回退显性化**：前台 `HeroCinematicStage` 保持「video 模式须有 URL」逻辑；后台 settings 页当 `heroBgType==='video' && !heroVideoUrl` 时显示琥珀色警告条「已选视频模式但未配置视频，前台将自动使用粒子引擎」；HeroLivePreview 已有同类提示，样式统一。
- **保存校验**：保存成功后 toast 明示「视频模式 + 已配置视频 URL / 粒子模式」当前生效状态。

### 3. 后台工作台化重构
- **Dashboard 聚合**（`app/admin/dashboard/page.tsx` 重构）：顶部四格统计保留 → 新增「待办中心」卡（待审友链数 api.getFriends 过滤 PENDING、待审评论数、草稿文章数，点击直达对应管理页）+「最近动态流」（api.getAuditLogs 时间线）+ AI 状态卡与 ActivityHeatmap 收拢至第二屏；QuickActionIsland 保留并统一视觉。
- **侧栏分组**（`components/admin/AdminSidebar.tsx`）：ADMIN_MATRICES 按「内容创作（博文/项目/旅程/随记/时间线）/ 资产与互动（媒体/友链/评论/用户）/ 系统（分类/标签/Now/设置）」三组分组标题渲染，当前组高亮；保留 280px 宽度契约（e2e F14）。
- **视觉统一**：管理页卡片统一 `rounded-3xl + 玻璃拟态 + 极光发线`（与前台三层级景深一致），接入 motion-primitives 入场。
- 待办计数若现有接口不足，在 DashboardStats 后端聚合少量字段（controller/service 小改）。

### 4. 星际远航 IP 体系（A 主 + B 点缀）
- **星历编号**：`lib/stardate.ts` 工具（由日期生成 `LOG №` 序号与 `STARDATE` 字符串）；博文卡（首页 Latest Thoughts、blog 列表、博文详情头部）与旅程卡渲染星历徽标（等宽字体 + 极光描边小胶囊）。
- **签证印章**：`components/journey/VisaStamp.tsx` 圆形做旧 SVG 印章（城市名环形排布 + 年份 + 罗盘纹理，双主题适配），应用于 journey 列表卡与详情页头图角标。
- **发射台叙事**：HeroCinematicStage 徽章区增加 `LAUNCH PAD // MISSION 2026` 微标（i18n 注册）；BentoGrid 标题区徽标文案改为任务看板语境（复用现有 bento.badge key 改文案）。
- **星轨粒子**：globals.css 新增 `starfield` 工具类（多层径向渐变星点背景，纯 CSS 零 JS 开销），应用于旅程页与 404 页背景。
- 全程保留翡翠极光主色系与白瓷/曜石黑双主题铁律。

### 5. AI 外脑对话面板（AiAssistantModal 重构）
- **流式输出**：后端 AiService 核实是否支持 SSE 流式；若不支持，前端实现「逐 token 打字机」渲染（对完整响应按 15~30ms/字切片 + 光标闪烁），体验等效流式。
- **引用溯源卡**：解析 AI 响应中的文章引用（或后端增强返回 `sources: [{postId,title,slug}]`，优先后端契约增强；不可行时前端基于对话上下文调 `api.getPosts({keyword})` 生成「相关阅读」卡），卡片点击直达 `/blog/{slug}`。
- **对话式导航**：前端指令解析层——识别「带我去/打开/最新 X」意图，匹配站点路由表（blog/journey/projects/now/memos/links/about），回复中内嵌可点击导航按钮，点击 router.push。
- **划词即问整合**：保留 InlineAiSpark，唤起时统一注入新面板并携带选中文本上下文。
- **视觉**：面板升级为「外脑控制台」——深空磨砂底、极光发线、消息气泡 HUD 化、输入框聚焦光晕。

### 6. 验证
- `pnpm build`（0 错误）+ `mvn test`（106 绿灯）+ `node e2e/run-all.mjs --mock-oracle`（169/169）+ 受影响对抗脚本（test_m2/test_scrollytelling_deep/test_3d/test_m1 系列）单跑 + Edge 无头双主题截图验收首页罗盘完整展开与咬合效果、后台 Dashboard、AI 面板。

## 目录结构（关键变更）
```
frontend/
├── app/page.tsx                                    # [MODIFY] Bento 负 margin 咬合 + 星历徽标接入
├── app/admin/settings/page.tsx                     # [MODIFY] 嵌入媒体库选择入口 + 视频模式警告条
├── app/admin/dashboard/page.tsx                    # [MODIFY] 工作台化重构（待办/动态流/聚合卡）
├── app/blog/page.tsx + app/blog/[slug]/page.tsx    # [MODIFY] 星历编号徽标
├── app/journey/page.tsx + app/journey/[slug]/page.tsx # [MODIFY] 签证印章 + 星轨背景
├── components/home/HeroPinnedScrollytelling.tsx    # [MODIFY] 280vh 轨道 + alpha 0.4 + 退场编排
├── components/home/HeroCinematicStage.tsx          # [MODIFY] 发射台叙事徽标
├── components/admin/MediaPickerModal.tsx           # [NEW] 媒体库视频选择器（getMedia 过滤+搜索+回填）
├── components/admin/AdminSidebar.tsx               # [MODIFY] 三组分组导航 + 视觉统一
├── components/ai/AiAssistantModal.tsx              # [MODIFY] 外脑面板重构（流式/溯源/导航）
├── components/journey/VisaStamp.tsx                # [NEW] 签证印章 SVG 组件
├── components/ui/motion-primitives.tsx             # [REUSE] 既有动效原语复用
├── lib/stardate.ts                                 # [NEW] 星历编号生成工具
├── app/globals.css                                 # [MODIFY] starfield 星轨工具类
├── lib/i18n-shared.ts                              # [MODIFY] 发射台/任务看板/外脑面板文案注册
backend/
└── ai/service/AiService.java                       # [MODIFY-可选] 响应增强 sources 溯源字段
e2e/
├── test_m2_layout_spacing_adversarial.mjs          # [MODIFY] 150vh→280vh 断言
└── test_scrollytelling_deep_adversarial.mjs        # [MODIFY] 150vh→280vh 断言
```

## 实施注意
- **e2e 红线**：`260vh` 字符串禁止出现；15 个几何体 dispose、`[resolvedTheme]` 纯净依赖、`GeometricCompass3D` 导出别名、`sticky top-16 h-[calc(100vh-4rem)]`、`min-h-[540px]/[580px]` 断言全部保持；改动后必须先单跑 test_3d/test_m2/test_scrollytelling_deep 再跑全量。
- **性能**：星轨背景用纯 CSS 渐变（零 JS）；打字机渲染用 requestAnimationFrame 节流避免高频 setState；MediaPicker 分页加载（pageSize 24）避免一次拉全量。
- **兼容性**：alpha 变更不破坏 test_3d 的 Lerp 数学仿真用例（用例内 alpha 为硬编码仿真值，不读源码）；若实施中发现源码断言再同步适配。
- **后端最小侵入**：AI sources 字段与待办聚合计数为增强项，若涉及较大改动则降级为前端组合现有接口实现，保证 mvn test 106 全绿。


## 星际远航 · Interstellar Voyager（A 主骨架 + B 地理杂志点缀）

**统一叙事骨架**：发射台（Hero）→ 导航仪（3D 罗盘）→ 任务看板（Bento）→ 航线图（3D 地球仪）→ 探索日志（博文/游记）。每个模块在视觉语言上互文，形成只属于 Hayden Xue 的"探索者"IP。

**视觉记忆点（三大锚点）**：
1. **星历编号系统**：所有内容卡携带 `LOG №001 / STARDATE 2026.09.09` 等宽字体徽标，极光描边小胶囊，如同任务档案编号；
2. **签证印章**：旅程页每段足迹配一枚做旧圆形 SVG 印章（城市名环形排布 + 年份 + 罗盘纹理），浅色如盖在护照页、深色如荧光印泥；
3. **深空星轨**：纯 CSS 多层径向渐变星点背景，应用于旅程页与 404 页，配合翡翠极光形成"仰望星野"的氛围。

**保留基因**：翡翠极光三色系、白瓷/曜石黑双主题三层级景深、HUD 徽章与探活呼吸灯、玻璃拟态磨砂卡——它们是天然的 Mission Control 组件，零推翻成本。

**后台工作台**：与前台同一套三层级景深语言；Dashboard 首屏 = 任务指挥中心（待办中心 + 快捷操作岛 + 动态流），侧栏三组分区间以极光发线分隔。

**AI 外脑面板**：深空磨砂底 + 极光发线标题栏 + HUD 消息气泡 + 引用溯源卡片（文章直达），输入框聚焦时呈现极光光晕，定位为"船载智能副驾"。

## Agent Extensions
### Skill
- **ui-ux-pro-max**
  - Purpose: 星际远航视觉体系落地前检索 mission-control HUD、印章做旧质感、星轨背景的设计规范与反模式
  - Expected outcome: 星历徽标/签证印章/工作台的具体样式决策有据可依，双主题对比度全部达标
- **lucide-icons**
  - Purpose: 为后台工作台待办中心、AI 外脑面板、媒体选择器等新 UI 检索并下载一致风格的 SVG 图标
  - Expected outcome: 全部新界面元素使用统一 Lucide 图标集，零 emoji
- **agent-browser**
  - Purpose: 实施完成后对首页（验证罗盘完整展开与 Bento 咬合）、后台 Dashboard、AI 面板进行双主题截图验收
  - Expected outcome: 桌面/移动视口截图确认全部视觉问题修复（Chromium 下载受限时回退 Edge 无头方案）
- **playwright-cli**
  - Purpose: 验证罗盘滚动叙事全程（模拟分段滚动截取各阶段），以及设置页视频选择交互流的端到端操作验证
  - Expected outcome: 罗盘 0%/35%/70%/100% 四阶段截图 + 媒体选择回填视频 URL 的操作闭环验证通过
### SubAgent
- **code-explorer**
  - Purpose: 实施前深度核实 AI 后端流式能力与 RAG 响应契约、后台待办计数所需接口（friends/comments/posts 状态过滤、AuditLog 列表）、Media 实体字段结构
  - Expected outcome: 产出 AI 溯源与待办聚合的可行性结论与精确接口清单，避免实施期返工
