# Hayden Blog - Gitee 自动化部署 CI/CD 完全配置指南

本文档提供两种在 Gitee 上的自动化部署方案：
* **方案 A（首选推荐）**：**Gitee Webhook 极速自动拉取** —— 永久免费、零额度限制、秒级触发、极度省心；
* **方案 B**：**Gitee Go 官方流水线** —— 类似 GitHub Actions，在 Gitee 云端容器中通过 SSH 直连执行部署。

---

## 方案 A：Gitee Webhook 极速自动部署（推荐，终身免费无限制）

### 1. 原理
在您的腾讯云服务器上后台运行一个轻量级的 Python 监听服务（端口 `9988`）。当您往 Gitee 仓库的 `main` 分支 push 代码时，Gitee 会向服务器发送一个 Webhook 请求，服务器收到后自动执行 `git pull` 并运行 Docker 增量构建，全过程在 15~30 秒内自动完成！

### 2. 在腾讯云服务器上启动 Webhook 守护服务
SSH 连接登录您的腾讯云服务器：
```bash
ssh ubuntu@49.233.166.212
```
进入项目目录并后台启动监听器（设置一个专属于您的 Webhook 密码，例如 `hayden2026`）：
```bash
# 1. 确保服务器上的代码已关联 Gitee 仓库
cd /opt/hayden-blog

# 2. 后台启动 webhook 服务（指定端口 9988 和通信密钥）
nohup python3 /opt/hayden-blog/deploy/gitee-webhook/webhook_server.py --port 9988 --secret hayden2026 > /var/log/hayden_deploy.log 2>&1 &

# 3. 检查服务是否已正常启动
ps aux | grep webhook_server.py
```
*(提示：请在腾讯云安全组放行 `9988` 端口，或者在 Nginx 中将 `/webhook` 路径反向代理到 `http://127.0.0.1:9988/webhook`)*

### 3. 在 Gitee 仓库后台配置 Webhook
1. 打开您的 Gitee 仓库页面，点击右上角的 **【管理】**；
2. 在左侧菜单找到 **【WebHooks】**，点击 **【添加 WebHook】**；
3. 填入参数：
   - **URL**：`http://49.233.166.212:9988/webhook`
   - **WebHook 密码/密钥**：填写上面启动时设置的密钥（例如 `hayden2026`）
   - **触发事件**：勾选 **`Push`**（推送代码）
4. 点击 **【添加】**。添加完成后点击【测试】，若返回 `{"success": true, ...}` 即表示对接 100% 成功！
5. 之后您每次在本地推代码，服务器就会自动拉取更新并重新打包上线！

---

## 方案 B：Gitee Go 官方流水线

项目中已为您内置了 Gitee Go 流水线配置文件：[`.workflow/deploy.yml`](file:///e:/work2026/mon9/Haydan_blog/.workflow/deploy.yml)。

### 1. 开启 Gitee Go
1. 打开 Gitee 仓库，点击顶部导航栏的 **【流水线】**（或【Gitee Go】）；
2. 点击 **【开通服务】**（若首次使用需按提示免费授权）；

### 2. 配置服务器 SSH 凭据
1. 在仓库的 **【管理 -> 凭据管理】** 中，点击 **【添加凭据】**：
   - **凭据类型**：选择 `SSH 私钥`
   - **凭据名称**：填写 `SERVER_SSH_KEY`
   - **私钥内容**：将您腾讯云服务器的私钥（本地 `deploy/keys/id_rsa` 的完整文本）粘贴进去，点击确定；
2. 在流水线设置的环境变量中添加：
   - `SERVER_HOST`：`49.233.166.212`
   - `SERVER_USER`：`ubuntu`

### 3. 运行部署
以后只要向 `main` 分支提交代码，Gitee Go 将自动接管并运行流水线，直连服务器更新 Docker 容器！
