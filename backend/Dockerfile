# ==========================================
# 阶段 1: 源码打包编译 (Builder)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# 配置国内阿里云 Maven 极速镜像加速源
RUN mkdir -p /root/.m2 && echo '<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" \
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd"> \
  <mirrors> \
    <mirror> \
      <id>aliyunmaven</id> \
      <mirrorOf>central</mirrorOf> \
      <name>阿里云公共仓库</name> \
      <url>https://maven.aliyun.com/repository/public</url> \
    </mirror> \
  </mirrors> \
</settings>' > /root/.m2/settings.xml

# 拷贝 pom.xml 预先解析依赖缓存
COPY pom.xml ./
RUN mvn dependency:go-offline -B || true

# 拷贝全量源码并编译打包 (跳过单元测试加快打包速度)
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# 阶段 2: 生产 JDK 25 运行 (Runner)
# ==========================================
FROM openjdk:25-ea-slim AS runner
WORKDIR /app

# 设置时区为东八区上海时间
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建安全系统账号运行并设置权限
RUN groupadd -r appgroup && useradd -r -g appgroup appuser && \
    mkdir -p /tmp && chmod 777 /tmp

# 从构建阶段提取打包生成的 jar
COPY --from=builder /build/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser

# 优化生产级 JVM 参数 (基于 JDK 25，限制堆内存 512M-768M 契合 4G 云主机，启用 G1GC 与虚拟线程)
ENV JAVA_OPTS="-server \
    -Xms256m \
    -Xmx512m \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=150 \
    -XX:+ExitOnOutOfMemoryError \
    -Dfile.encoding=UTF-8 \
    -Duser.timezone=Asia/Shanghai"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
