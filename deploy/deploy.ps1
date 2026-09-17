# ==========================================
# Hayden Blog - 腾讯云极速直连部署脚本
# ==========================================
$ErrorActionPreference = "Stop"

$HOST_IP = "49.233.166.212"
$USER = "ubuntu"
$KEY = "deploy\keys\id_rsa"
$TARGET_DIR = "/opt/hayden-blog"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 开始直连腾讯云服务器极速部署 ($HOST_IP)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. 验证 SSH 密钥存在
if (!(Test-Path $KEY)) {
    Write-Error "未找到部署私钥文件: $KEY"
}

# 2. 精炼打包纯源码与配置
$tarFile = "$env:TEMP\hayden-update-$((Get-Date).Ticks).tar.gz"
Write-Host "📦 1/3 正在归档精炼代码包..." -ForegroundColor Yellow

& git archive -o $tarFile HEAD backend frontend docker-compose.yml deploy docs

$tarSize = [math]::round(((Get-Item $tarFile).Length / 1MB), 2)
Write-Host "✅ 打包完成，代码包体积仅: $tarSize MB" -ForegroundColor Green

# 3. 国内极速直传至服务器
Write-Host "⚡ 2/3 正在通过国内高速宽带直传腾讯云服务器..." -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
& scp -O -i $KEY -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -P 22 $tarFile ${USER}@${HOST_IP}:/tmp/hayden-update.tar.gz
$sw.Stop()
Write-Host "✅ 直传完成！耗时仅 $([math]::round($sw.Elapsed.TotalSeconds, 1)) 秒！" -ForegroundColor Green

Remove-Item $tarFile -Force -ErrorAction SilentlyContinue

# 4. 在服务器上解压并执行增量构建
Write-Host "🔨 3/3 服务器解压并调用 Docker 本地缓存增量构建..." -ForegroundColor Yellow
$remoteCmd = "mkdir -p $TARGET_DIR && tar -xzf /tmp/hayden-update.tar.gz -C $TARGET_DIR/ && rm -f /tmp/hayden-update.tar.gz && cd $TARGET_DIR && docker compose build backend frontend && docker compose up -d backend frontend && docker image prune -f && docker compose ps && sleep 3 && curl -sI http://localhost:3000/ | head -n 5"

& ssh -i $KEY -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -p 22 ${USER}@${HOST_IP} $remoteCmd

Write-Host "==========================================" -ForegroundColor Green
Write-Host "🎉 恭喜！全栈极速部署完成，服务已在线正常运行！" -ForegroundColor Green
Write-Host "🌐 网站访问地址: http://$HOST_IP/" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green
