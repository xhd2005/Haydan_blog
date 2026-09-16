#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hayden Blog - Gitee Webhook 极速自动化部署接收器
特点：轻量级单文件、无第三方依赖 (基于 Python 原生 http.server)、安全签名/密码校验、异步触发构建
使用方法：
  在腾讯云服务器上运行:
  nohup python3 /opt/hayden-blog/deploy/gitee-webhook/webhook_server.py --port 9988 --secret YOUR_WEBHOOK_SECRET > /var/log/hayden_deploy.log 2>&1 &
"""

import os
import sys
import json
import hmac
import hashlib
import argparse
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

TARGET_DIR = "/opt/hayden-blog"
LOG_PREFIX = "[Gitee-Deploy]"

class WebhookHandler(BaseHTTPRequestHandler):
    secret = ""

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()
        self.wfile.write("Hayden Blog Gitee Webhook Server is running.\n".encode('utf-8'))

    def do_POST(self):
        if self.path != '/webhook' and self.path != '/':
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        # 校验 Gitee Webhook 密码 / Token
        gitee_token = self.headers.get('X-Gitee-Token', '')
        gitee_event = self.headers.get('X-Gitee-Event', '')

        if self.secret and gitee_token != self.secret:
            print(f"{LOG_PREFIX} 警告：Webhook 密码鉴权失败，拒绝执行")
            self.send_response(403)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "message": "Invalid token"}).encode('utf-8'))
            return

        # 解析 Payload
        try:
            payload = json.loads(body.decode('utf-8'))
        except Exception:
            payload = {}

        ref = payload.get('ref', '')
        user_name = payload.get('user_name', 'Unknown')
        print(f"{LOG_PREFIX} 收到 Gitee 事件 [{gitee_event}], 分支: [{ref}], 提交者: [{user_name}]")

        # 仅针对 main 或 master 分支触发自动化更新
        if 'master' in ref or 'main' in ref or not ref:
            print(f"{LOG_PREFIX} 命中主分支变更，正在后台启动 Docker 增量构建...")
            threading.Thread(target=self.run_deploy).start()
            message = "Deploy task accepted and running in background"
        else:
            message = f"Ignored branch {ref}"

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "message": message}).encode('utf-8'))

    def run_deploy(self):
        deploy_cmd = f"""
        cd {TARGET_DIR} && \\
        git reset --hard HEAD && \\
        git pull origin main || git pull origin master && \\
        docker compose build backend frontend && \\
        docker compose up -d backend frontend && \\
        docker image prune -f
        """
        try:
            res = subprocess.run(deploy_cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            print(f"{LOG_PREFIX} 部署成功完成:\n{res.stdout[-500:]}")
        except subprocess.CalledProcessError as e:
            print(f"{LOG_PREFIX} 部署过程执行异常:\n{e.output}")

def main():
    parser = argparse.ArgumentParser(description="Hayden Blog Gitee Webhook Server")
    parser.add_argument("--port", type=int, default=9988, help="Listening port")
    parser.add_argument("--secret", type=str, default="", help="Gitee WebHook Secret Token")
    args = parser.parse_args()

    WebhookHandler.secret = args.secret
    server_address = ('0.0.0.0', args.port)
    httpd = HTTPServer(server_address, WebhookHandler)
    print(f"{LOG_PREFIX} Webhook 服务已在 0.0.0.0:{args.port} 启动监听 (Secret: {'已启用' if args.secret else '未设置'})...")
    httpd.serve_forever()

if __name__ == '__main__':
    main()
