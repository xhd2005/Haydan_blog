# Hayden Xue 博客与数字花园开发与设计工程准则 (Project Guidelines)

## 1. 站长姓名与身份纯正性准则 (Identity Invariant)
- **铁律**：站长姓名必须严格且唯一使用 **Hayden Xue**。严禁出现任何历史遗留名称（如 Howard 等）。版权信息、签名、关于介绍必须 100% 保持 Hayden Xue。

## 2. 真实数据驱动与后台完全可管理原则 (Dynamic CMS Completeness)
- **铁律**：全站所有展示性内容（包括但不限于足迹地标、心跳状态、Now 动态、技术栈、轮播公告、背景视频与友链）必须 100% 支持在 CMS 后台可视化编辑并持久化到数据库。
- **足迹与 3D 地球仪**：点标必须严格且唯一与数据库中已发布的真实旅行记录（`journeys`）或游记博文关联，严禁在前端硬编码展示任何未曾到访的虚构地点；点击点标必须直达对应的游记详情页。

## 3. 双主题深度层级美学原则 (Theme Hierarchy & Depth)
- **铁律**：严禁简单的非黑即白粗暴反色。浅色与深色模式均须具备明确的三维视觉景深：
  - **浅色模式**：背景采用雪白/瓷白（`bg-[#fbfbfd]`）、卡片采用微磨砂白瓷（`bg-white/80`）、边框采用微冷灰（`border-slate-200/80`），辅以细腻的多级阴影（`shadow-sm` 到 `shadow-xl`）；
  - **深色模式**：背景采用深邃曜石黑（`bg-[#090a0f]`）、卡片采用深黑磨砂（`bg-neutral-900/60`）、边框采用 1px 极细微光边界（`border-white/[0.08]`）与环境光晕（Ambient Glow）；
  - 形成【底色层 -> 内容卡片层 -> 悬浮交互层】的清晰层次对比。

## 4. 全站微动效与丰富交互设计 (Motion & Micro-interactions)
- **铁律**：所有核心卡片、按钮、标语均需集成高质量现代动效（字符级逐字显现、流光渐变、3D 鼠标视差 Tilt、平滑滚动解构、微悬浮状态反馈），拒绝平铺直叙的静态死板感。

## 5. 云端对象存储优先原则 (Cloud-Native Storage Architecture)
- **铁律**：多媒体资源（图片、视频）必须解耦本地单一路径，深度支持 MinIO / S3 兼容的分布式云端对象存储，支持后台可视化配置 Endpoint、Bucket 与密钥并即时生效。

## 6. 后台数据流完整性与破坏性操作防误触准则 (Admin Data Integrity & Guardrails)
- **正文数据水合铁律 (Content Hydration Invariant)**：
  - 后端列表视图接口（如 `PostListVO`）默认精简排除大文本字段（`content`）。前端凡涉及正文分析、死链检测、图片扫描等全量质检逻辑，严禁直接依赖列表对象中的 `content`；必须通过并发按需水合（如 `api.getPostById`）或专用批量质检接口获取真实完整文本，杜绝规则静默绕过。
- **破坏性批处理防误触红线 (Destructive Action Guardrail)**：
  - 全站任何具有物理删除或不可逆破坏性质的操作（包括但不限于：文章批量删除、孤岛标签一键清理、空分类一键删除），前端必须强制接入二次确认拦截弹窗（`confirmModal`，设置 `variant: 'danger'`），严禁裸调接口直接物理删除。
- **Markdown 资产导出兼容性规范 (Frontmatter Interoperability)**：
  - 所有面向 Obsidian / Hugo / Hexo 等第三方工具导出的 Markdown 文件，必须携带标准合规的 YAML Frontmatter；当博文缺失分类、标签或发布日期时，必须规范输出 `categories: []`、`tags: []` 及 `date: ""` 等有效默认值，禁止直接缺失键名导致下游解析器异常。
