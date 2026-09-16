# Project: Hayden Xue 博客与数字花园用户中心、统一点赞、沉浸式评论与站内通知全栈重构 (2026-09-15)

## Architecture
- **全栈数据一致性与实体模型架构**：
  - **用户体系底座 (User Model)**：`users` 表与 `User.java` 增加 `bio`, `github`, `website` 字段，支持普通用户头像上传（`StorageFactory` 联动 MinIO/本地存储，白名单魔数校验），提供脱敏公开资料 `GET /api/users/{username}/public` 与当前用户资料管理 `GET/PUT /api/user/profile`。
  - **统一多实体点赞引擎 (Unified Likes Engine)**：基于 `user_likes` 表建立统一点赞机制，支持 `POST`, `MEMO`, `COMMENT`, `JOURNEY`, `PROJECT` 五大实体。登录用户执行 Toggle 持久化（原子写入/删除 `user_likes` 并同步更新业务表 `like_count`），未登录游客经 Redis+Caffeine 滑动窗口限频后执行轻量点赞；提供批量已赞状态查询 `POST /api/likes/batch-status`。
  - **电影级高互动评论社区 (Interactive Comment Ecosystem)**：`comments` 表扩展 `like_count` 字段，评论树获取接口支持当前登录读者可见自己的 `PENDING` 待审评论（公开匿名严格仅查 `APPROVED`，满足安全隔离）；站长回复绑定 Hayden Xue 专属极光微光徽章；前端 `CommentSection.tsx` 支持未登录一键登录、Emoji 面板、Markdown 渲染、评论撤回删除与 DOM 锚点平滑滚动。
  - **站内通知中心 (Notification Center)**：新增 `notifications` 表与轻量异步事件服务，在收到点赞、评论被回复、评论审核通过时生成站内通知；顶部导航栏提供未读红点与玻璃拟态抽屉，支持一键全部已读与点击直达上下文锚点。

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | `user_likes` 联合唯一索引与业务表 `like_count` 补齐 | 数据库在 `comments`, `journeys`, `projects` 补齐 `like_count` 字段，`user_likes` 确保 `(user_id, target_type, target_id)` 联合唯一索引 | M1 | R2, Survey 2 |
| F2 | 统一多实体点赞后端 Service 与 Toggle 控制器 | 实现 `LikeService` 与 `LikeController`，支持五大实体 Toggle 增删 `user_likes` 与原子更新目标表计数 | M1 | R2, Survey 2 |
| F3 | 批量点赞状态查询接口与游客限流服务 | 提供 `POST /api/likes/batch-status` 批量查询用户对一组实体的已赞状态；基于 IP 的滑动窗口防刷限流 | M1 | R2, Survey 2 |
| F4 | 前端 `UnifiedLikeButton` 封装与全站落地 | 封装通用点赞组件，支持双主题微光景深、Framer Motion 弹性回弹动效、浮空心形、真乐观更新与回滚；覆盖博文、随记、游记、项目 | M1 | R2, Survey 2 |
| F5 | 用户表扩展与普通用户头像上传通道 | `users` 表扩充 `bio`, `github`, `website`；提供普通用户专用的 `POST /api/user/avatar` 头像上传接口，对接 MinIO/本地存储 | M2 | R1, Survey 1 |
| F6 | 现代用户中心 `/profile` 资料维护与星历勋章 | 集成头像上传、预设数字花园头像库一键选用、Bio 简介、社交外链、密码修改、读者加入星历时间戳与荣誉勋章 | M2 | R1, Survey 1 |
| F7 | 用户中心足迹看板打通与撤回操作 | 打通「我的点赞」（支持分类切换与取消点赞）、「我的评论」（带原文真实标题、时间、锚点跳转与快捷撤回删除）与「我的收藏」 | M2 | R1, Survey 1 |
| F8 | 公开主页 `/u/[username]` 名片与足迹重塑 | 极光描边头像、加入星历、Bio 与社交链接渲染、公开足迹时间轴、点赞与评论统计 | M2 | R1, Survey 1 |
| F9 | 评论实体 `like_count` 支持与待审友好展示 | `comments` 表与实体接入点赞计数；`getCommentTree` 升级支持读者本人查看自己的 `PENDING` 评论（带友好提示），未登录及他人严格仅查 `APPROVED` | M3 | R3, Survey 3 |
| F10 | Hayden Xue 极光徽章与电影级 `CommentSection` | 站长回复绑定 Hayden Xue 专属极光微光徽章；未登录唤起登录弹窗；评论点赞；Emoji 快捷面板；Markdown 格式支持 | M3 | R3, Survey 3 |
| F11 | 评论撤回删除、嵌套回复与 DOM 锚点定位 | 读者可快捷撤回自身评论；二级嵌套回复；每条评论挂载 DOM 锚点 ID 并支持从通知或个人中心平滑定位高亮 | M3 | R3, Survey 3 |
| F12 | 站内通知数据表、后端实体与 Service | 创建 `notifications` 表，提供分页获取、未读计数、标记已读、一键全部已读接口 | M4 | R4, Survey 3 |
| F13 | 互动事件触发站内通知 | 评论被回复、评论收到点赞、评论审核通过时自动触发生成站内通知 | M4 | R4, Survey 3 |
| F14 | 导航栏通知抽屉与个人中心通知联动 | 顶部导航栏未读小红点铃铛按钮、沉浸式玻璃拟态通知抽屉、点击一键定位上下文锚点 | M4 | R4, Survey 3 |
| F15 | 双端编译构建绿灯保障 | 前端 `cd frontend && pnpm build` 100% 成功零错误；后端 `cd backend && mvn test` 全绿灯通过 | M5 | Criteria |
| F16 | E2E 自动化回归验证与 Forensic 质量审计 | 编写/执行完整回归用例（登录、修改资料、点赞 Toggle、评论发表与待审回显、撤回、通知已读跳转）；Forensic Auditor 深度核验无作弊与准则遵从性 | M5 | Criteria, AGENTS.md |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 统一多实体点赞持久化引擎与数据底座 | F1, F2, F3, F4 | none | **IN_PROGRESS** |
| M2 | 全功能现代用户中心与公开名片重塑 | F5, F6, F7, F8 | M1 | PLANNED |
| M3 | 电影级高互动评论系统 | F9, F10, F11 | M1 | PLANNED |
| M4 | 站内通知与互动提醒中心 | F12, F13, F14 | M1, M2, M3 | PLANNED |
| M5 | 双端全量构建与 E2E 质量验收 + 独立审计 | F15, F16 | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### 统一点赞接口 (`LikeController`)
- `POST /api/likes/toggle`: 请求体 `{"targetType": "POST"|"MEMO"|"COMMENT"|"JOURNEY"|"PROJECT", "targetId": Long}`
  - 响应: `{"liked": boolean, "likeCount": int}`
- `POST /api/likes/batch-status`: 请求体 `{"targetType": "...", "targetIds": [Long]}`
  - 响应: `{"statusMap": { "id": boolean }}`
- 历史兼容端点: `POST /api/posts/{id}/like` 与 `POST /api/memos/{id}/like` 保留并桥接至 `LikeService`。

### 用户管理接口 (`UserController` & `PublicUserController`)
- `GET /api/user/profile`: 获取当前登录用户信息（含 `bio`, `github`, `website`, `createdAt`, `role`）。
- `PUT /api/user/profile`: 更新昵称、头像、Bio、GitHub、Website。
- `POST /api/user/avatar`: 普通登录用户上传个人头像，返回头像 URL。
- `PUT /api/user/password`: 校验原密码并修改新密码。
- `GET /api/user/my-comments`: 分页获取我发表的评论列表，包含目标实体类型、目标 ID、目标真实标题、评论内容、审核状态、创建时间。
- `GET /api/user/my-likes`: 支持按 `targetType` 获取已赞列表，返回实体简要信息及点赞时间。
- `GET /api/users/{username}/public`: 公开用户信息，脱敏返回昵称、用户名、头像、星历时间戳、Bio、社交外链、公开足迹统计。

### 评论接口 (`CommentController`)
- `GET /api/comments/tree?targetType=...&targetId=...`:
  - 登录用户请求时携带 Token，返回该目标下的评论树，包含审核通过评论以及**当前读者本人提交的待审核评论**（`status="PENDING"`）。
  - 匿名或未登录请求仅返回 `status="APPROVED"` 评论。
- `POST /api/comments`: 发表评论或二级回复。
- `DELETE /api/comments/{id}`: 读者本人或管理员撤回/删除评论。

### 站内通知接口 (`NotificationController`)
- `GET /api/notifications`: 分页获取当前用户收到的站内通知。
- `GET /api/notifications/unread-count`: 获取未读通知数。
- `PUT /api/notifications/{id}/read`: 标记指定通知已读。
- `PUT /api/notifications/read-all`: 一键标记全部已读。

## Code Layout
- `backend/src/main/java/com/howard/blog/controller/LikeController.java`: 统一点赞控制器
- `backend/src/main/java/com/howard/blog/service/LikeService.java` & `impl/LikeServiceImpl.java`: 统一点赞业务逻辑
- `backend/src/main/java/com/howard/blog/enums/LikeTargetType.java`: 点赞实体枚举
- `backend/src/main/java/com/howard/blog/service/LikeRateLimiterService.java`: 游客点赞防刷限频服务
- `backend/src/main/java/com/howard/blog/controller/NotificationController.java`: 站内通知控制器
- `backend/src/main/java/com/howard/blog/service/NotificationService.java` & `impl/NotificationServiceImpl.java`: 站内通知业务
- `backend/src/main/java/com/howard/blog/entity/Notification.java`: 通知实体
- `frontend/components/ui/UnifiedLikeButton.tsx`: 全站统一点赞按钮组件
- `frontend/app/profile/page.tsx`: 全功能个人中心页面
- `frontend/app/u/[username]/page.tsx`: 公开名片与主页
- `frontend/components/CommentSection.tsx`: 沉浸式评论组件
- `frontend/components/notifications/NotificationDrawer.tsx`: 顶部导航通知抽屉
- `frontend/lib/api.ts`: 统一 API 客户端接口
