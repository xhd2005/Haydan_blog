#!/bin/bash
# ==============================================================================
# Hayden Xue 博客运维管理脚本 (manage.sh)
# 用法: ./deploy/manage.sh [start|stop|restart|logs|ps|backup]
# ==============================================================================

ACTION=$1

case "$ACTION" in
  start)
    echo "🚀 正在启动全栈服务..."
    docker compose up -d
    ;;
  stop)
    echo "🛑 正在停止全栈服务..."
    docker compose down
    ;;
  restart)
    echo "🔄 正在重启全栈服务..."
    docker compose restart
    ;;
  logs)
    docker compose logs -f --tail=100
    ;;
  ps)
    docker compose ps
    ;;
  backup)
    BACKUP_DIR="./data/backups"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    echo "💾 正在备份 MySQL 数据库到 $FILE ..."
    docker compose exec -T mysql mysqldump -u root -p"${MYSQL_ROOT_PASSWORD:-HaydenRoot_2026!Sec}" --all-databases > "$FILE"
    echo "✅ 备份完成！备份文件: $FILE"
    ;;
  *)
    echo "💡 用法: $0 {start|stop|restart|logs|ps|backup}"
    exit 1
    ;;
esac
