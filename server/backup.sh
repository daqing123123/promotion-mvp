#!/bin/bash
# 巨浪 Julang — 每周自动备份脚本
# 建议 crontab: 0 3 * * 0 /opt/promotion-mvp/server/backup.sh

set -e

BACKUP_DIR="/opt/backups/julang"
RDS_HOST="rm-bp187s9336367ufd1vo.mysql.rds.aliyuncs.com"
RDS_PORT="3306"
RDS_USER="daqing1001"
RDS_PASS="Qq1478535213"
RDS_DB="julang"
DATE_TAG=$(date +%Y%m%d_%H%M)
WEEK_TAG=$(date +%Y-W%W)
KEEP_WEEKS=4

mkdir -p "$BACKUP_DIR"

echo "[$(date)] 开始备份 week=$WEEK_TAG..."

# 1. 数据库完整备份（含建表+数据）
mysqldump -h "$RDS_HOST" -P "$RDS_PORT" -u "$RDS_USER" -p"$RDS_PASS" \
  --single-transaction --routines --triggers --events \
  "$RDS_DB" | gzip > "$BACKUP_DIR/julang_db_${DATE_TAG}.sql.gz"
echo "  -> 数据库备份完成: julang_db_${DATE_TAG}.sql.gz"

# 2. 只备份表结构（无数据，用于快速重建）
mysqldump -h "$RDS_HOST" -P "$RDS_PORT" -u "$RDS_USER" -p"$RDS_PASS" \
  --no-data --routines --triggers \
  "$RDS_DB" > "$BACKUP_DIR/julang_schema_${DATE_TAG}.sql"

# 3. 代码备份（排除 node_modules，用 git 兜底所以只备份配置）
tar -czf "$BACKUP_DIR/julang_code_${DATE_TAG}.tar.gz" \
  -C /opt/promotion-mvp \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='backups' \
  server.js package.json package-lock.json .env 2>/dev/null || true

# 4. 清理超过 KEEP_WEEKS 周的旧备份
find "$BACKUP_DIR" -name "julang_db_*.sql.gz" -mtime +$((KEEP_WEEKS * 7)) -delete
find "$BACKUP_DIR" -name "julang_code_*.tar.gz" -mtime +$((KEEP_WEEKS * 7)) -delete
find "$BACKUP_DIR" -name "julang_schema_*.sql" -mtime +$((KEEP_WEEKS * 7)) -delete

# 5. 统计
SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
COUNT=$(ls "$BACKUP_DIR"/julang_db_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] 备份完成 size=${SIZE} count=${COUNT}"

# 6. 可选：推送到微云（需微云MCP，先注释）
# TODO: upload backup file to cloud storage
