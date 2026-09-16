# Hayden Xue 个人博客 - 腾讯云上线部署实战手册

本文档专为腾讯云 **4 核 CPU / 4G 内存 / 40GB 系统盘** 规格定制，采用 **Docker Compose 全栈容器化** 与 **GitHub Actions 自动化 CI/CD** 架构。

---

## 目录
- [一、准备工作（腾讯云控制台）](#一准备工作腾讯云控制台)
- [二、服务器一键初始化（5分钟）](#二服务器一键初始化5分钟)
- [三、配置 GitHub Actions 自动部署密钥](#三配置-github-actions-自动部署密钥)
- [四、触发上线与访问验证](#四触发上线与访问验证)
- [五、日常运维管理命令](#五日常运维管理命令)
- [六、后续绑定域名与开通 HTTPS (SSL)](#六后续绑定域名与开通-https-ssl)

---

## 一、准备工作（腾讯云控制台）

1. **登录腾讯云控制台**，找到你的云服务器（CVM / 轻量应用服务器）。
2. **开放安全组端口**：
   - 必须开放：
     - **TCP 22**（SSH 远程管理与 CI/CD 直传）
     - **TCP 80**（HTTP 网站公网访问入口）
   - 可选开放：
     - **TCP 443**（后续配置 HTTPS 时需要）
     - **TCP 9001**（MinIO Web 控制台管理，如需外网访问可开）

---

## 二、服务器一键初始化（5分钟）

登录你的腾讯云服务器（通过 SSH 或腾讯云 Web 终端 OrcaTerm）：

### 1. 创建部署根目录
```bash
sudo mkdir -p /opt/hayden-blog
sudo chown -R $USER:$USER /opt/hayden-blog
cd /opt/hayden-blog
```

### 2. 下载并执行初始化脚本
你可以将本项目的 `deploy/server-init.sh` 复制到服务器上，或者直接在服务器执行：
```bash
# 赋予执行权限并运行
sudo bash deploy/server-init.sh
```
> **该脚本自动为你完成：**
> 1. 安装最新版 Docker 与 Docker Compose Plugin
> 2. 配置腾讯云内网 Docker 基础镜像加速器
> 3. 创建并激活 **2GB Swap 虚拟内存**（防止内存峰值溢出）
> 4. 自动创建持久化目录 `./data/mysql`, `./data/redis`, `./data/minio`, `./uploads`
> 5. 自动从 `deploy/env.example` 复制生成 `.env` 配置文件

### 3. 修改生产环境变量 `.env`
```bash
nano .env
# 或使用 vim .env
```
主要修改以下两处：
- `SERVER_HOST`：填入你的腾讯云公网 IP（例如 `SERVER_HOST=123.45.67.89`）
- `MINIO_PUBLIC_URL`：填入 `http://你的公网IP:9000`
- 生产安全强密码（`DB_PASS`, `REDIS_PASSWORD`, `MINIO_ROOT_PASSWORD` 等建议修改为复杂随机串）

---

## 三、配置 GitHub Actions 自动部署密钥

本项目已包含 `.github/workflows/deploy.yml`。每次你向 GitHub `main` 分支推代码，GitHub 会自动编译镜像，并通过 SSH 隧道直传到你的腾讯云服务器并重启，实现全自动无人值守发布！

### 1. 生成部署专用 SSH 密钥对（在本地电脑或服务器运行）
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/hayden_deploy_key -N ""
```
- 将生成的公钥 `hayden_deploy_key.pub` 内容追加到服务器的授权列表：
  ```bash
  cat ~/.ssh/hayden_deploy_key.pub >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  ```
- 复制私钥 `hayden_deploy_key` 的**全部完整内容**（包含 `-----BEGIN OPENSSH PRIVATE KEY-----`）。

### 2. 在 GitHub 仓库添加 Secrets
打开 GitHub 博客仓库 -> **Settings** -> **Secrets and variables** -> **Actions** -> 点击 **New repository secret**，添加以下 3 个变量：

| Secret 名称 | 填入内容说明 | 示例 |
| :--- | :--- | :--- |
| `SERVER_HOST` | 腾讯云服务器的公网 IP | `123.45.67.89` |
| `SERVER_USER` | 服务器登录账号 | `root` 或 `ubuntu` |
| `SERVER_SSH_KEY` | 上一步复制的私钥全文 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH 端口（可选，默认 22） | `22` |
| `SERVER_DEPLOY_DIR` | 部署目录（可选，默认 `/opt/hayden-blog`） | `/opt/hayden-blog` |

---

## 四、触发上线与访问验证

1. 将包含新部署配置的代码推送到 GitHub 仓库的 `main` 分支：
   ```bash
   git add .
   git commit -m "feat: setup docker-compose and github actions ci/cd for tencent cloud"
   git push origin main
   ```
2. 打开 GitHub 仓库的 **Actions** 标签页，可以看到正在自动运行的 `Build & Deploy to Tencent Cloud` 流水线。
3. 流水线执行完毕（约 3-5 分钟），打开浏览器直接访问：
   - 博客首页：`http://<你的公网IP>`
   - 后台管理系统：`http://<你的公网IP>/admin/login`
     - 初始账号：`admin`
     - 初始密码：`admin123`（登录后请立即在后台系统设置中修改密码）
   - MinIO 控制台（如开放 9001 端口）：`http://<你的公网IP>:9001`
     - 账号：`minioadmin`（或你在 `.env` 中设置的值）

---

## 五、日常运维管理命令

项目提供了轻量运维脚本 `deploy/manage.sh`，在服务器目录 `/opt/hayden-blog` 中执行：

```bash
# 查看全站容器实时运行状态与资源消耗
./deploy/manage.sh ps

# 实时查看系统全量日志（按 Ctrl+C 退出）
./deploy/manage.sh logs

# 重启全站服务
./deploy/manage.sh restart

# 一键全量备份 MySQL 数据库到 ./data/backups/
./deploy/manage.sh backup

# 停止全站
./deploy/manage.sh stop

# 启动全站
./deploy/manage.sh start
```

---

## 六、后续绑定域名与开通 HTTPS (SSL)

当你后续购买并备案/解析好域名（例如 `blog.hayden.com` 指向腾讯云公网 IP）后，只需 2 步即可开通安全 HTTPS：

### 1. 申请免费 SSL 证书（Let's Encrypt / 腾讯云免费证书）
你可以直接在腾讯云 SSL 证书控制台一键申请免费的 1 年期 TrustAsia 证书，下载 Nginx 版本的两个文件：
- `xxx.crt` 或 `xxx.pem`
- `xxx.key`

将它们放到服务器的 `/opt/hayden-blog/deploy/nginx/ssl/` 目录下，并重命名为 `fullchain.pem` 与 `privkey.pem`。

### 2. 启用 Nginx 的 HTTPS 配置
打开 `/opt/hayden-blog/deploy/nginx/nginx.conf`，将其中注释掉的 HTTPS 代码段解除注释，将 `yourdomain.com` 替换为你的真实域名：
```nginx
server {
    listen 80;
    server_name blog.hayden.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blog.hayden.com;
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ...
}
```
保存后执行：
```bash
./deploy/manage.sh restart
```
全站即可拥有绿色小锁的全球安全访问能力！
