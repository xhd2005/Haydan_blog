#!/bin/bash
# ==============================================================================
# Hayden Xue 个人博客 - 腾讯云服务器一键环境初始化脚本 (server-init.sh)
# 支持系统：Ubuntu 20.04/22.04/24.04, Debian 11/12, CentOS 7/8/9, TencentOS
# ==============================================================================

set -e

echo "=========================================================="
echo "🚀 开始初始化 Hayden Xue 博客云服务器环境 (4核4G专属优化)..."
echo "=========================================================="

# 1. 确保以 root 权限执行
if [ "$EUID" -ne 0 ]; then
  echo "❌ 错误: 请使用 sudo 或 root 账号运行此脚本！"
  exit 1
fi

# 2. 配置 2GB Swap 交换分区 (极其关键：防止突发内存浪涌导致 OOM)
SWAP_FILE="/swapfile"
if [ ! -f "$SWAP_FILE" ]; then
    echo "📦 正在创建 2GB Swap 交换空间..."
    fallocate -l 2G $SWAP_FILE || dd if=/dev/zero of=$SWAP_FILE bs=1M count=2048
    chmod 600 $SWAP_FILE
    mkswap $SWAP_FILE
    swapon $SWAP_FILE
    if ! grep -q "$SWAP_FILE" /etc/fstab; then
        echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
    fi
    sysctl vm.swappiness=20
    echo "vm.swappiness=20" >> /etc/sysctl.conf
    echo "✅ 2GB Swap 交换分区创建并激活成功！"
else
    echo "ℹ️ Swap 分区已存在，跳过创建。"
fi

# 3. 安装 Docker 与 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "🐳 正在安装 Docker 最新版引擎..."
    if [ -f /etc/debian_version ]; then
        apt-get update -y
        apt-get install -y ca-certificates curl gnupg lsb-release
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://mirrors.tencent.com/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg || \
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.tencent.com/docker-ce/linux/ubuntu \
          $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    elif [ -f /etc/redhat-release ]; then
        yum install -y yum-utils
        yum-config-manager --add-repo https://mirrors.tencent.com/docker-ce/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        systemctl enable docker
        systemctl start docker
    fi
    echo "✅ Docker 及 Compose 插件安装完成！"
else
    echo "ℹ️ Docker 已安装，版本为: $(docker --version)"
fi

# 4. 配置腾讯云/国内基础镜像加速源
echo "⚡ 配置 Docker 守护进程加速器与日志轮转..."
mkdir -p /etc/docker
cat <<EOF > /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.m.daocloud.io"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
EOF
systemctl daemon-reload
systemctl restart docker

# 5. 创建项目持久化目录结构
echo "📁 初始化项目数据存储目录..."
mkdir -p ./data/mysql
mkdir -p ./data/redis
mkdir -p ./data/minio
mkdir -p ./uploads
mkdir -p ./deploy/nginx/ssl

# 6. 如果不存在 .env，则从模板复制
if [ ! -f ".env" ]; then
    if [ -f "deploy/env.example" ]; then
        cp deploy/env.example .env
        echo "📝 已由 deploy/env.example 自动生成 .env 配置文件，请根据需要修改其中的密码和公网 IP！"
    fi
fi

echo "=========================================================="
echo "🎉 腾讯云服务器环境已初始化完毕！"
echo "👉 下一步："
echo "   1. 检查或编辑 .env 文件配置"
echo "   2. 部署启动：docker compose up -d"
echo "=========================================================="
