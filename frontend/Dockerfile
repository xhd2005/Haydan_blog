# ==========================================
# 阶段 1: 依赖安装 (Dependencies)
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装 pnpm 9 并配置国内极速镜像加速源
RUN npm install -g pnpm@9 --registry=https://registry.npmmirror.com && \
    pnpm config set registry https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ==========================================
# 阶段 2: 构建打包 (Builder)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9 --registry=https://registry.npmmirror.com && \
    pnpm config set registry https://registry.npmmirror.com

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用 Next.js 遥测数据收集
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 传递构建期变量
ARG NEXT_PUBLIC_API_BASE=""
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

RUN pnpm build

# ==========================================
# 阶段 3: 生产轻量运行 (Runner)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 创建运行专属安全系统账号
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 拷贝构建产物
COPY --from=builder /app/public ./public

# 拷贝 standalone 输出与静态资源
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
