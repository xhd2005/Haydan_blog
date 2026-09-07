# Hayden Xue Personal Blog

> **“From the East, toward the unknown.”**
> 
> 一个面向个人长期使用的现代化个人空间与数字花园系统（V1.0 MVP）。

---

## 🛠️ 技术栈选型

- **后端架构**：
  - **语言与框架**：Java 21 LTS + Spring Boot 3.3.4
  - **持久层**：MyBatis-Plus 3.5.7 + MySQL 8/9 (内置兼容易用的 H2 极速演练模式)
  - **安全认证**：Spring Security 6 + JJWT 0.12.6 + BCrypt
  - **静态资源/媒体**：本地静态映射存储（预留 MinIO 适配器架构）
  - **性能缓存**：Caffeine 本地高性能缓存

- **前端架构**：
  - **语言与框架**：Next.js 14 (App Router) + React 18 + TypeScript 5
  - **样式与排版**：Tailwind CSS + Lucide React 图标
  - **主题系统**：next-themes (深色 / 浅色 / 跟随系统无闪烁切换)
  - **内容渲染**：React Markdown + Remark GFM 扩展

---

## 📁 目录结构

```text
Haydan_blog/
├── backend/                       # Spring Boot 3.3.x 后端项目
│   ├── src/main/java/com/howard/blog/
│   │   ├── common/                # 统一返回结构 Result<T>、PageResult<T>、实体基类
│   │   ├── config/                # 跨域 CORS、静态资源映射、MyBatis-Plus 分页插件
│   │   ├── controller/            # REST API 控制器 (Auth/Posts/Projects/Journey/Now/etc.)
│   │   ├── dto/                   # 入参传输对象
│   │   ├── entity/                # 核心数据库实体
│   │   ├── exception/             # 业务异常与全局异常处理器
│   │   ├── mapper/                # MyBatis-Plus 数据访问接口
│   │   ├── security/              # JWT 过滤器、Token 生成器、安全配置
│   │   ├── service/               # 业务逻辑接口与实现
│   │   └── vo/                    # 视图响应对象
│   ├── src/main/resources/
│   │   ├── application.yml        # 主配置文件 (MySQL 连接配置与环境变量覆盖)
│   │   ├── schema-h2.sql          # 内存测试表结构
│   │   └── data-h2.sql            # 内存测试种子数据
│   └── pom.xml
├── frontend/                      # Next.js 14 前端工程
│   ├── app/
│   │   ├── (public)/              # 前台公开展示路由
│   │   │   ├── page.tsx           # 首页 (Hero, Latest Thoughts, Projects, Journey, Now, About)
│   │   │   ├── about/             # 关于页与动态成长时间线
│   │   │   ├── blog/              # 博客列表与文章详情 [slug]
│   │   │   ├── projects/          # 项目作品集与详情 [slug]
│   │   │   ├── journey/           # 旅行足迹与游记图集 [slug]
│   │   │   ├── now/               # 此时此刻 (Now 状态实时呈现)
│   │   │   └── search/            # 站内全文关键词搜索
│   │   └── admin/                 # CMS 管理后台路由
│   │       ├── login/             # 管理员登录鉴权
│   │       ├── dashboard/         # 核心统计仪表盘
│   │       ├── posts/             # 文章管理与 Markdown 实时预览编辑器
│   │       ├── categories/        # 分类维护
│   │       ├── tags/              # 标签维护
│   │       ├── projects/          # 项目维护
│   │       ├── journey/           # 旅行足迹维护
│   │       ├── now/               # Now 状态即时发布
│   │       ├── timeline/          # 成长时间线维护
│   │       └── settings/          # 站点信息与密码管理
│   ├── components/                # 导航栏、页脚、Markdown 渲染、主题提供器
│   ├── lib/                       # API 统一调用封装与 TypeScript 契约模型
│   └── package.json
└── docs/
    └── sql/
        ├── schema.sql             # MySQL 8+ 完整 DDL 建表脚本
        └── data.sql               # 初始化演示种子数据
```

---

## 🚀 快速启动指南

### 1. 数据库准备（两种方式任选其一）

#### 方式 A：使用本地 MySQL 数据库（推荐）
1. 执行 `docs/sql/schema.sql` 创建 `howard_blog` 数据库与表结构。
2. 执行 `docs/sql/data.sql` 写入初始种子数据。
3. 在 `backend/src/main/resources/application.yml` 中或通过环境变量配置你的 MySQL 用户名和密码：
   - 环境变量支持：`DB_USER`、`DB_PASS`、`DB_HOST`、`DB_PORT`。

#### 方式 B：内置 H2 极速演练模式（无需额外安装或配置数据库）
- 启动后端时指定激活 `h2` Profile 即可，应用会自动在内存中建表并灌入演示数据：
  ```bash
  mvn spring-boot:run -Dspring-boot.run.profiles=h2
  ```

---

### 2. 启动后端 API 服务

进入 `backend` 目录并运行：
```bash
cd backend
mvn spring-boot:run
```
后端服务默认监听在 `http://localhost:8080`。

---

### 3. 启动前端服务

进入 `frontend` 目录并运行：
```bash
cd frontend
pnpm install
pnpm dev
```
前端服务启动于 `http://localhost:3000`。

---

## 🔑 后台管理员登录凭据

- **登录地址**：`http://localhost:3000/admin/login`
- **默认用户名**：`admin`
- **默认初始密码**：`admin123`
- 登录后可在后台“系统设置”页面修改密码。
