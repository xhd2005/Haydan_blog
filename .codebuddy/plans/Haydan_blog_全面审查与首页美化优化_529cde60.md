---
name: Haydan_blog 全面审查与首页美化优化
overview: 对 Hayden Xue 博客项目进行全面设计审查：清理约 115KB 死代码与硬编码违规、统一 Howard 遗留标识、为各页面补充特色动效，并重点重塑首页中段视觉层次（复活/整合 Bento 看板、入场动效、HUD 质感），最终产出双端构建绿灯的高质量站点。
design:
  architecture:
    framework: react
  styleKeywords:
    - 翡翠极光 Aurora
    - 玻璃拟态 Glassmorphism
    - Bento 看板
    - 双主题三层级景深
    - 微动效与光斑交互
    - 滚动叙事 Scrollytelling
  fontSystem:
    fontFamily: Noto Sans SC / PingFang SC + JetBrains Mono 点缀
    heading:
      size: 36-64px
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
  - id: review-report
    content: 撰写三部分审查报告 docs/REVIEW_2026-09.md，含删减清单与首页美化方案供确认
    status: completed
  - id: dead-code-cleanup
    content: 删除 bento/ 9 个死组件及 NomadHudPulse、VinylRecordPlayer，同步修正 PROJECT.md
    status: completed
    dependencies:
      - review-report
  - id: cms-compliance
    content: 治理硬编码：统一头像兜底、默认视频入配置、VoyageGlobe 纯 journeys 驱动、迁移 howard_* 键
    status: completed
    dependencies:
      - review-report
  - id: homepage-bento
    content: 用 [skill:ui-ux-pro-max] 指导重构首页中段为 Bento 看板并新建动效原语
    status: completed
    dependencies:
      - dead-code-cleanup
  - id: hero-enhance
    content: Hero 全屏化升级并与罗盘吸附无缝衔接，Now/About 区块质感跃升
    status: completed
    dependencies:
      - homepage-bento
  - id: site-polish
    content: 全站页面动效增强：blog/journey/search/links 入场动效与空态巧思
    status: completed
    dependencies:
      - homepage-bento
  - id: verify-build
    content: pnpm build 与 mvn test 全量回归，e2e 适配，用 [skill:agent-browser] 截图验收首页
    status: completed
    dependencies:
      - hero-enhance
      - site-polish
---

## 用户需求
对当前 Hayden Xue 博客与数字花园项目（Next.js 14 前端 + Spring Boot 3.3 后端）进行全面审查与优化，分三部分：

1. **设计审查**：指出设计不合理之处、需要完善的功能、建议删减的内容。
2. **页面增强**：针对现有各页面（blog、journey、memos、now、about、projects、links、search 等），提出增加特色、动效与巧思的具体改进方向。
3. **首页美化（重点）**：诊断当前首页在视觉、布局、交互上的问题，并给出整体美化方案。

## 审查发现摘要（已探明）
- **需删减**：`components/bento/` 下 9 个组件（约 115KB，含两处 three.js 打包）与 `NomadHudPulse`、`VinylRecordPlayer` 均为零引用死代码；PROJECT.md 与实现严重不符（BentoGrid 声称挂载首页实则未用）。
- **需治理**：Unsplash 默认头像硬编码 10+ 处、mixkit 默认视频、前端写死技术栈/足迹坐标/假成长里程碑（违反 AGENTS.md 的 CMS 可管理与足迹铁律）、`howard_*` localStorage 遗留键。
- **首页问题**：Hero 后中段 6 个区块结构同质平铺（小标签+大标题+网格卡片），无 whileInView 入场动效、无 Spotlight/Tilt 交互，无视觉节奏与层级对比；Hero 高度未全屏；Now 区块无 HUD 质感。
- **保留优点**：Hero 双徽章探活灯、字符级 Split-text Reveal、极光哲学宣言、罗盘三阶段滚动解构、双语自适应、CommandPalette、AmbientGlow 等全局体验。

## 交付物
- 三部分审查报告文档（供用户确认后再实施）
- 死代码清理 + 硬编码治理 + 首页 Bento 化重构 + 全站动效增强 + 双端构建/e2e 验证

## 技术栈
- 前端：Next.js 14.2.15 (App Router) + React 18 + TypeScript + Tailwind CSS + framer-motion 11 + three.js（保留，仅活代码使用）
- 后端：Spring Boot 3.3（涉及 SiteSetting/Journey 数据契约时少量调整）
- 测试：e2e 对抗性脚本（Node .mjs）+ `pnpm build` / `mvn test` 全量回归

## 实施策略
### 1. 审查报告（先行交付物）
新建 `docs/REVIEW_2026-09.md`，按用户三问组织：设计不合理清单（含证据文件:行号）、需完善功能、建议删减清单、各页面动效增强方向、首页美化专项方案。用户确认后进入实施。

### 2. 死代码清理（删减项）
- 删除 `frontend/components/bento/` 全部 9 个组件（BentoGrid、TechMatrixCard、TechOrbitRadar、TechRadarCard、CosmosGraph、LifePulseCard、GardenMindFlowCard、SpotlightCard、TiltCard）及 `now/components/NomadHudPulse.tsx`、`VinylRecordPlayer.tsx`。
- 同步修正 `PROJECT.md`、`TEST_READY.md` 等文档与实现对齐；确认 three.js 仅剩 VoyageGlobe 与 HeroPinnedScrollytelling 两个消费者。
- 风险控制：删除前 grep 复核引用；现有 e2e 断言若引用 BentoGrid 需同步更新。

### 3. 硬编码治理（CMS 合规）
- **默认头像**：抽公共常量/工具（`lib/media-defaults.ts`），统一兜底链 `user.avatar → settings.avatar → 本地 SVG 占位图`，替换 10+ 处 Unsplash 硬编码；`SafeImage.tsx` fallbackSrc 改本地资源。
- **默认 Hero 视频**：`HeroCinematicStage` 与 `admin/HeroLivePreview` 的 mixkit 外链移入 `SiteSetting` 配置项（后台已有 Hero 配置通道，仅需补默认值入库与后台预置）。
- **足迹坐标**：`VoyageGlobe.tsx` 移除写死 9 城坐标，点标数据 100% 来自已发布 journeys（符合铁律）；`GrowthChronicleTimeline` 的假 EXIF/假里程碑改为读取真实 journeys/about 数据或改为纯文案排版。
- **Howard 遗留**：localStorage 键 `howard_token/howard_user/howard_locale` 统一迁移为 `hayden_*`（读取时兼容旧键一次性迁移写入），删除 `Footer.tsx` 正则替换 hack。

### 4. 首页 Bento 化重构（重点）
- 在 `app/page.tsx` 中段以「多维 Bento 看板」替代 6 个同质区块的线性平铺：
  - 精选博文主卡（大跨度）+ 次要博文小卡组合；
  - Now 状态 HUD（复用极光引言边线风格，呼吸探活灯升级）；
  - 足迹预览卡（真实 journeys 数据驱动的迷你地图/城市点标）；
  - 随记流小卡、精选项目卡；
  - About 图文卡（头像走 settings，加入 Spotlight Hover）。
- 新建 `components/home/` 下轻量组件：`HomeBentoSection.tsx`、`BentoCardShell.tsx`（磨砂白瓷/曜石黑三层景深、 Spotlight 光斑 + 3D Tilt + 流光边框），并抽公共动效原语 `components/ui/motion-primitives.tsx`（whileInView stagger 入场、hover 微反馈），供首页与其他页面复用（替代被删的死代码能力，DRY）。
- Hero 区：升级为真全屏（`min-h-[calc(100svh-4rem)]`），强化与罗盘吸附的叙事衔接；底部滚动引导保留。
- 性能：全部动效用 framer-motion `whileInView` + `viewport={{ once: true }}`，避免重复触发重渲染；Three.js 粒子场维持现状（已有 dispose 清理）。

### 5. 全站页面动效与巧思增强
- blog：卡片入场 stagger、hover 时封面 Ken Burns 微缩放、标签筛选过渡动画；
- journey：地球仪加载骨架、卡片 hover 视差微光；memos：拍立得墙保留并补入场散落动效；
- search：空态插画化 + 结果高亮动效；links：友邻雷达微调；
- ReadingProgress 扩展至 journey/about 长文页。

### 6. 验证
- `pnpm build`（34 路由 0 报错）+ `mvn test`（106 测试绿灯）+ e2e 关键脚本回归（重点 `test_m2_layout_spacing_adversarial.mjs`），并用 agent-browser 截图验收首页双主题效果。

## 目录结构（关键变更）
```
frontend/
├── app/page.tsx                        # [MODIFY] 中段重构为 Bento 看板布局，Hero 全屏化
├── docs/REVIEW_2026-09.md              # [NEW] 三部分审查报告（仓库根 docs/）
├── components/home/
│   ├── HeroCinematicStage.tsx          # [MODIFY] 全屏高度、默认视频改配置驱动
│   ├── HomeBentoSection.tsx            # [NEW] 首页中段 Bento 看板容器
│   └── BentoCardShell.tsx              # [NEW] 通用磨砂景深卡壳（Spotlight+Tilt）
├── components/ui/motion-primitives.tsx # [NEW] whileInView stagger/hover 微反馈动效原语
├── components/bento/                   # [DELETE] 9 个死代码组件整体移除
├── components/now/NomadHudPulse.tsx    # [DELETE] 零引用死代码
├── lib/media-defaults.ts               # [NEW] 统一默认头像/媒体兜底工具
├── components/SafeImage.tsx            # [MODIFY] fallback 改本地资源
├── components/journey/VoyageGlobe.tsx  # [MODIFY] 移除硬编码坐标，纯 journeys 驱动
├── components/about/GrowthChronicleTimeline.tsx # [MODIFY] 移除假里程碑/假 EXIF
├── components/Footer.tsx               # [MODIFY] 删除 Howard 正则 hack
├── lib/i18n.tsx / revalidate.ts 等     # [MODIFY] howard_* → hayden_* 键迁移（兼容读取）
└── PROJECT.md                           # [MODIFY] 文档与实现对齐
backend/（如需 SiteSetting 补默认视频配置项）# [MODIFY] 少量
```

## 设计方向：翡翠极光 · 玻璃拟态数字花园
延续并深化现有「白瓷/曜石黑双主题 + 翡翠极光色系」基因，按 AGENTS.md 三层级景深铁律执行：

**首页美化方案**
- **视觉**：Hero 升级真全屏全息 HUD；中段以非对称 Bento 看板打破同质平铺——大跨度博文主卡 + Now 呼吸 HUD + 足迹迷你点标卡 + 随记流小卡，形成大小、密度、色彩的节奏对比；Now 区块从灰底平铺升级为极光渐变引言边线 + 探活呼吸灯的 HUD 卡组。
- **布局**：维持 max-w-6xl 栅格，Bento 内部用 12 列非对称跨度（col-span-7/5/4/8 等），区块间距由固定 space-y 改为节奏化留白；罗盘解构 100% 后与首个 Bento 卡无缝衔接。
- **交互**：所有卡片统一集成 Spotlight 光斑跟随 + 3D 鼠标微视差 Tilt + 流光边框；入场采用 whileInView 字符级/卡片级 stagger 升起；标题保留极光渐变与逐字揭示；按钮保留现有三键集群动效并统一到 motion-primitives。

**全站巧思**
- blog 卡片 hover 封面 Ken Burns 微缩放与标签流光；search 空态极光插画化；journey 卡片城市点标微光脉动；ReadingProgress 全站长文覆盖；深浅双主题均验证发光/阴影层级（浅色用多级 shadow，深色用 border-white/[0.08] + Ambient Glow）。

## Agent Extensions
### Skill
- **ui-ux-pro-max**
  - Purpose: 首页 Bento 重构与全站动效增强前，检索 Bento 布局、玻璃拟态、动效节奏的成熟设计规范，指导配色与层级决策
  - Expected outcome: 产出与翡翠极光双主题一致的设计系统建议，确保美化方案有据可依
- **agent-browser**
  - Purpose: 实施完成后对首页进行双主题截图验收，核查 Bento 布局、动效与层级效果
  - Expected outcome: 桌面/移动视口截图，确认视觉问题全部修复
