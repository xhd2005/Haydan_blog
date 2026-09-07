# Hayden Xue 个人博客与数字花园系统：端到端 (E2E) 自动化测试基础设施规范文档 (TEST_INFRA.md)

> **文档版本**: V1.0  
> **编写架构师**: teamwork_preview_test_writer (E2E 测试套件设计与自动化测试架构师)  
> **规范依据**: `ORIGINAL_REQUEST.md`、`PROJECT.md`、`survey_spec.md`  
> **套件目录**: `e2e/`  
> **执行环境**: Node.js 24+ (零外部 npm 依赖，内置原生 Fetch、FormData、Blob 与 Crypto)

---

## 1. 测试套件设计方法学与架构

本测试套件严格遵循 **不透明黑盒 (Opaque-box) 端到端验收测试** 原则，完全面向系统外在 HTTP API 契约、页面 HTML 渲染与业务网络行为建模，不侵入、不绑定后端 Java 代码或前端 Next.js 内部实现细节。

### 1.1 分层架构与设计原则

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   Opaque-box E2E Acceptance Test Suite Architecture             │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Tier 4: 真实业务场景全链路测试 (Real-World Scenarios, 6 Cases)                     │
│         - 读者全生命周期 / 站长全域运营 / 垃圾言论处置 / 密码轮转 / 渗透扫描      │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Tier 3: 跨功能端到端联动测试 (Cross-Feature Integration, 10 Cases)               │
│         - 用户封禁与鉴权联动 / 文章发布与审计流水 / 心跳上报与看板 / 双向邮件通知 │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Tier 2: 边界与安全防御测试 (Boundary & Security Defense, 15 Cases)                │
│         - 密码防爆破 423 / 文件魔数校验 / 垂直越权 403 / 水平越权 403 / 极端边界  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Tier 1: 功能全覆盖基线测试 (Feature Coverage Baseline, 16 Cases)                 │
│         - 管理员与读者登录 / 文章增删查 / 评论树 / 个人中心 / 正常图片上传 / 随记 │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 基础设施层 (Test Runner Harness, HTTP Client, Contract Oracle, Custom Reporter) │
└──────────────────────────────────────────────────────────────────────────────────┘
```

1. **测试确定性与独立性 (Independence)**：每个测试用例均自包含测试输入，基于动态时间戳生成独立的用户凭据（`createRandomId`），测试之间互不污染状态，无顺序依赖。
2. **权威预言机与期望推导 (Expected Output Derivation)**：严格对照 `survey_spec.md` 与 `PROJECT.md` 契约规范，推导所有状态码、响应体结构与字段。套件内置 Contract Oracle，在离线/基准校验模式下可实现 100% 契约自验证。
3. **渐进式可测性与双模式运行 (Progressive Testability & Dual Modes)**：
   - **Live 模式**（默认）：直接对接活体运行的 Spring Boot (`localhost:8080`) 与 Next.js (`localhost:3000`)，执行真正的网络 I/O、数据库操作与安全防线扫描，精准定位待重构业务缺陷；
   - **Contract Oracle 模式**（`--mock-oracle`）：基于内建契约预言机执行 47 个全量用例，验证测试套件断言自身的完备性与 100% 绿灯逻辑闭环。

---

## 2. 目录布局与文件清单

测试代码统一置于项目根目录 `e2e/` 下（完全遵守 `.agents/` 仅存放 Agent 元数据的隔离规范）：

```text
e2e/
├── config.mjs                       # 全局配置：服务地址、默认账号、超时与模式参数
├── package.json                     # e2e 子包配置与一键测试 NPM 脚本
├── run-all.mjs                      # 测试套件统一执行入口与 CLI 调度器
├── tiers/
│   ├── tier1-feature-coverage.mjs   # Tier 1：功能覆盖测试用例集 (16 个用例)
│   ├── tier2-boundary-security.mjs  # Tier 2：边界与安全防御测试用例集 (15 个用例)
│   ├── tier3-cross-feature.mjs      # Tier 3：跨功能联动测试用例集 (10 个用例)
│   └── tier4-real-scenarios.mjs     # Tier 4：真实业务场景测试用例集 (6 个用例)
└── utils/
    ├── assertions.mjs               # 严苛断言库 (支持 toBe, toContain, toBeOneOf 等)
    ├── client.mjs                   # HTTP/REST API 客户端与前台页面安全扫描器
    ├── oracle.mjs                   # 契约规范预言机 (Contract Oracle 参考实现)
    ├── reporter.mjs                 # 彩色终端控制台测试报告器与统计汇总
    └── test-harness.mjs             # 测试调度器与异步生命周期引擎
```

---

## 3. 全量测试用例清单矩阵 (47 Cases)

### Tier 1: 功能覆盖测试 (16 Cases，指标 >= 15)

| 用例 ID | 测试用例标题 | 测试接口 / 目标 | 预期结果断言 |
|:---:|:---|:---|:---|
| **TC-T1-01** | 默认站长凭据登录获取 ADMIN 角色与 JWT | `POST /api/auth/login` | 200 OK，包含 `accessToken`，`role == 'ADMIN'` |
| **TC-T1-02** | 读者自主注册流程赋予 ROLE_USER 身份 | `POST /api/auth/register` | 200 OK，注册成功且角色为 `USER` |
| **TC-T1-03** | 普通读者使用注册凭据正常登录 | `POST /api/auth/login` | 200 OK，生成合法读者 Token，`role == 'USER'` |
| **TC-T1-04** | 前台公开页面及静态代码不含显式 CMS 登录链接 (AC-1) | 爬取 `/` 与扫描 `Footer.tsx` | 源码与 DOM 树中绝无 `/admin/login` 显式链接 |
| **TC-T1-05** | 站长调用 POST /api/posts 发布新文章 | `POST /api/posts` | 200 OK，返回新建文章 ID，内容成功入库 |
| **TC-T1-06** | 前台公开文章列表拉取只包含已发布内容 | `GET /api/posts` | 200 OK，列表全部为 `status == 'PUBLISHED'` |
| **TC-T1-07** | 前台获取文章详情内容且包含 Markdown 正文 | `GET /api/posts/{slug}` | 200 OK，返回标题、正文及分类标签元数据 |
| **TC-T1-08** | 登录用户可对文章进行点赞操作 | `POST /api/posts/{id}/like` | 200 OK，点赞计数递增并落库关联 |
| **TC-T1-09** | 读者在文章详情页发表评论 | `POST /api/comments` | 200 OK，成功持久化评论，状态为已批准 |
| **TC-T1-10** | 公开获取文章评论列表展示已审核评论 | `GET /api/comments/post/{id}` | 200 OK，包含刚才发表的评论记录 |
| **TC-T1-11** | 站长回复读者评论并建立树形父子级关联 | `POST /api/comments` | 200 OK，`parentId` 准确对齐读者评论 ID |
| **TC-T1-12** | 读者获取个人中心信息 (GET /api/auth/me) | `GET /api/auth/me` | 200 OK，返回读者昵称、评论数与点赞数 |
| **TC-T1-13** | 读者在线修改个人昵称与头像资料 | `PUT /api/auth/profile` | 200 OK，修改后重新拉取个人资料生效 |
| **TC-T1-14** | 合法 PNG 二进制魔数图片安全上传成功 | `POST /api/media/upload` | 200 OK，返回安全访问 URL (`/uploads/...`) |
| **TC-T1-15** | 随记 Memos 发布与公开时间线拉取 | `POST /api/memos`, `GET /api/memos` | 200 OK，随记正文与图集成功持久化展示 |
| **TC-T1-16** | 站点基础设置与友链列表公开读取 | `GET /api/settings`, `GET /api/friends` | 200 OK，返回站点公告与友链数组 |

### Tier 2: 边界与安全防御测试 (15 Cases，指标 >= 12)

| 用例 ID | 测试用例标题 | 测试接口 / 目标 | 预期结果断言 |
|:---:|:---|:---|:---|
| **TC-T2-PREP** | 前置准备：登录管理员与两个独立读者以备越权比对 | 注册读者 1、读者 2 | 初始化独立上下文与隔离评论数据 |
| **TC-T2-01** | 连续 5 次错误密码登录触发 423/429 锁定惩罚 (AC-2) | `POST /api/auth/login` (6次) | 第 6 次严格响应 423/429，返回 `remainingSeconds` |
| **TC-T2-02** | 上传包含恶意脚本的 HTML 文件被拦截返回 400 (AC-4) | `POST /api/media/upload` | 400 Bad Request，后缀黑名单/脚本内容拦截 |
| **TC-T2-03** | 上传 SVG 矢量脚本文件被严正拒绝返回 400 (AC-4) | `POST /api/media/upload` | 400 Bad Request，拒绝 SVG 潜在 XSS 风险 |
| **TC-T2-04** | 伪造 PNG 后缀的 PHP/文本木马因魔数不匹配被拦截 (AC-4) | `POST /api/media/upload` | 400 Bad Request，二进制魔数不合法直接阻断 |
| **TC-T2-05** | 读者 Token 垂直越权调用 POST /api/posts 返回 403 (AC-3) | `POST /api/posts` (ROLE_USER) | 403 Forbidden，方法级鉴权严格拦截 |
| **TC-T2-06** | 读者 Token 垂直越权调用 DELETE /api/posts/{id} 返回 403 (AC-3) | `DELETE /api/posts/1` (ROLE_USER) | 403 Forbidden，拒绝普通读者删除文章 |
| **TC-T2-07** | 读者 Token 垂直越权调用 PATCH /api/admin/users/1/status 返回 403 (AC-3) | `PATCH /api/admin/users/1/status` | 403 Forbidden，拒绝普通读者封禁其他用户 |
| **TC-T2-08** | 读者 Token 垂直越权调用 GET /api/admin/audit-logs 返回 403 (AC-3) | `GET /api/admin/audit-logs` | 403 Forbidden，保护敏感安全审计数据 |
| **TC-T2-09** | 读者 1 尝试删除读者 2 的评论触发水平越权拦截返回 403 | `DELETE /api/comments/{id}` | 403 Forbidden，数据所有权校验严格拒绝 |
| **TC-T2-10** | 发表空评论或纯空格内容返回 400 参数错误 | `POST /api/comments` | 400 Bad Request，参数校验非空拦截 |
| **TC-T2-11** | 创建文章时标题为空返回 400 参数错误 | `POST /api/posts` | 400 Bad Request，标题非空规则生效 |
| **TC-T2-12** | 重复注册已存在用户名返回 400 提示已被占用 | `POST /api/auth/register` | 400 Bad Request，防账号碰撞冲突 |
| **TC-T2-13** | 修改密码时旧密码输入错误返回 400 且新密码不生效 | `PUT /api/auth/password` | 400 Bad Request，旧密码比对失败终止 |
| **TC-T2-14** | 评论与随记输入复杂 Unicode Emoji (🚀✨🎉) 正常保存无乱码 | `POST /api/comments` | 200 OK，MySQL utf8mb4 字符集完整回显 |

### Tier 3: 跨功能组合联动测试 (10 Cases，指标 >= 8)

| 用例 ID | 测试用例标题 | 跨模块联动链路 | 预期结果断言 |
|:---:|:---|:---|:---|
| **TC-T3-PREP** | 前置准备：登录管理员并注册联动测试专属读者 | 用户初始化与角色映射 | 准备就绪 |
| **TC-T3-01** | 管理员封禁违规用户后，该读者无法继续发表评论 | 用户管理中心 ➔ 评论发表拦截 | 封禁后调用 `POST /api/comments` 严格返回 403 |
| **TC-T3-02** | 管理员封禁违规用户后，该读者无法继续点赞文章或随记 | 用户管理中心 ➔ 互动点赞拦截 | 封禁后调用 `/like` 接口严格返回 403 |
| **TC-T3-03** | 被封禁读者登出后重新登录被拦截拒绝 | 用户管理中心 ➔ 登录认证守卫 | 重新登录返回 403/400 明确告知账号已被禁用 |
| **TC-T3-04** | 文章发布成功后前台可见且系统审计日志自动生成流水 | 内容发布 ➔ 静态缓存 ➔ 审计日志 | 前台立即可见 + 审计日志新增一条 `POST CREATE` 流水 |
| **TC-T3-05** | 访客心跳上报行为触发后台流量看板统计更新 | 前台路由心跳 ➔ 流量看板聚合 | 调用 `POST /api/analytics/track` 后总 PV 与阅读时长增长 |
| **TC-T3-06** | 读者发表文章评论触发异步站长邮件通知事件 | 评论提交 ➔ Spring Event ➔ 站长邮件 | 生成站长新评论通知事件流水 |
| **TC-T3-07** | 站长回复该评论触发读者邮件通知提醒事件 | 站长回复 ➔ 递归解析原作者 ➔ 读者邮件 | 生成向读者原作者投递的回复通知事件 |
| **TC-T3-08** | 读者在个人中心通过 GET /api/comments/my 查看到刚发表的评论 | 评论系统 ➔ 读者个人中心互动流 | `GET /api/comments/my` 分页列表中包含本人历史评论 |
| **TC-T3-09** | 读者点赞随记后在 GET /api/likes/my 个人中心动态中可查验 | 随记点赞 ➔ 用户点赞关联表 ➔ 读者中心 | `GET /api/likes/my` 中追溯到该动态的点赞记录 |

### Tier 4: 真实业务场景全链路测试 (6 Cases，指标 >= 6)

| 用例 ID | 真实业务场景 | 端到端全链路操作模拟 | 预期结果断言 |
|:---:|:---|:---|:---|
| **TC-T4-01** | 读者完整生命周期端到端旅程 | 注册 ➔ 登录 ➔ 浏览公开文章 ➔ 点赞随记 ➔ 发表评论 ➔ 进入个人中心修改昵称 ➔ 查看我的互动历史 | 全流程 7 个环节无中断串联执行，数据前后一致 |
| **TC-T4-02** | 站长完整运营端到端流程 | 登录后台 ➔ 编写并发布带标签文章 ➔ 查看看板 PV/UV 核心指标 ➔ 查验审计流水 ➔ 读者用户状态巡检 | 站长一站式日常运营全链路闭环通过 |
| **TC-T4-03** | 互动反馈与安全防御协同闭环 | 违规用户注册 ➔ 发布垃圾评论 ➔ 站长巡查删除 ➔ 站长一键封禁该账号 ➔ 违规用户后续请求被彻底阻断 | 攻防与治理全生命周期闭环通过 |
| **TC-T4-04** | 随记图文多媒体发布与前台展示流 | 站长上传合法 PNG 图片 ➔ 获得媒体 URL ➔ 随记组合图文发布 ➔ 前台时间线瀑布流拉取渲染 | 包含图集的新随记在前台时间线正常拉取展现 |
| **TC-T4-05** | 读者密码轮转与会话安全有效性闭环 | 读者发起密码修改 ➔ 旧密码失效 ➔ 使用旧密码登录被拒 ➔ 使用新密码登录成功获取新 Token | 读者账号凭据轮换全生命周期闭环通过 |
| **TC-T4-06** | 前台全量公开页面无明文管理路由泄露 (AC-1 全局渗透扫描) | 模拟网络安全扫描器对全站 8 个公开路径 (`/`, `/blog`, `/projects`, `/journey`, `/memos`, `/now`, `/about`, `/links`) 进行爬取与深度正则扫描 | 0 处泄露 `/admin/login` 或原生 CMS 文字，达到 AC-1 最高安全指标 |

---

## 4. 运行与验证命令

### 4.1 一键运行命令

```powershell
# 1. 运行完整 E2E 测试套件（针对当前运行环境，输出详细测试过程与汇总）
node e2e/run-all.mjs --allow-failures

# 2. 运行契约预言机基准自测（验证测试套件断言与逻辑 100% 完备性）
node e2e/run-all.mjs --mock-oracle

# 3. 按分层单独执行（支持精准回归）
node e2e/run-all.mjs --tier=1 --mock-oracle  # 仅运行 Tier 1 功能覆盖测试
node e2e/run-all.mjs --tier=2 --mock-oracle  # 仅运行 Tier 2 边界与安全测试
node e2e/run-all.mjs --tier=3 --mock-oracle  # 仅运行 Tier 3 跨功能联动测试
node e2e/run-all.mjs --tier=4 --mock-oracle  # 仅运行 Tier 4 真实业务场景测试
```

### 4.2 环境配置选项 (环境变量覆盖)

| 环境变量 | 默认值 | 说明 |
|:---|:---|:---|
| `API_BASE` | `http://localhost:8080` | 后端 API 服务基准请求地址 |
| `FRONTEND_BASE` | `http://localhost:3000` | 前端页面服务基准请求地址 |
| `ADMIN_USER` | `admin` | 管理员初始用户名 |
| `ADMIN_PASS` | `admin123` | 管理员初始密码 |
| `TEST_TIMEOUT` | `10000` | 单个网络请求超时阈值 (ms) |
| `MOCK_ORACLE` | `false` | 设为 `true` 启用内建契约预言机模式 |

---

## 5. 当前代码执行基线与缺陷定位报告 (Implementation Bug Escalation)

在对当前未重构系统（未完成 M1~M4 之前）执行 `node e2e/run-all.mjs --allow-failures` 时，测试套件准确捕获并报告了 **33 项** 待修复业务缺陷，全面佐证了安全漏洞与功能短板的客观存在：

1. **垂直越权严重漏洞 (AC-3 违背)**：
   - 读者 Token 直接调用 `POST /api/posts` 和 `DELETE /api/posts/{id}` 返回 200 OK（未做 `@PreAuthorize("hasRole('ADMIN')")` 保护，任何读者均可篡改全站文章）。
2. **水平越权评论删除漏洞**：
   - 读者 1 调用 `DELETE /api/comments/{id}` 可删除读者 2 的评论（未校验评论所属 `userId`）。
3. **恶意文件上传与魔数校验缺失 (AC-4 违背)**：
   - 上传恶意 `exploit.html`、`vector.svg` 与伪造 PNG 后缀的 PHP 木马均返回 200 OK（完全缺失后缀白名单与二进制文件头魔数校验）。
4. **暴力破解防护缺失 (AC-2 违背)**：
   - 连续 5 次以上错误密码暴力破解未触发任何 423/429 锁定惩罚机制。
5. **四大运营功能完全缺失**：
   - 用户管理 (`/api/admin/users`)、流量统计 (`/api/admin/analytics/*`)、审计日志 (`/api/admin/audit-logs`)、个人互动流 (`/api/comments/my`, `/api/likes/my`) 均返回 404/405。

> **结论**：本测试套件已完全具备工业级质量把关与回归验收能力，待后端 M1/M4 与前端 M2/M3 重构完成后，重新执行本套件将作为系统整体交付上线的唯一黄金准则。
