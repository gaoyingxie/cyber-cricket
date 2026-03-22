#!/bin/bash
# 云养虾每日备份脚本 - 备份AI记忆到GitHub
# 北京时间凌晨2点 = UTC前一天18:00

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/home/node/.openclaw/workspace/backup"
REPO_DIR="/home/node/.openclaw/workspace/backup-repo"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 需要备份的关键文件（排除含敏感信息的TOOLS.md）
FILES=(
    "MEMORY.md"
    "SOUL.md"
    "USER.md"
    "IDENTITY.md"
    "HEARTBEAT.md"
    "AGENTS.md"
)

# 复制文件到备份目录
for file in "${FILES[@]}"; do
    if [ -f "/home/node/.openclaw/workspace/$file" ]; then
        cp "/home/node/.openclaw/workspace/$file" "$BACKUP_DIR/"
    fi
done

# 复制 memory 目录
cp -r /home/node/.openclaw/workspace/memory "$BACKUP_DIR/" 2>/dev/null || true

# 生成备份信息
cat > "$BACKUP_DIR/backup_info.txt" << EOF
备份时间: $(date)
北京时间: $(TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M:%S')
主机: $(hostname)
EOF

# 提交到 git
cd "$REPO_DIR" || exit 1

git config user.email "backup@openclaw" 2>/dev/null
git config user.name "OpenClaw Backup" 2>/dev/null

# 检查是否有变化 - 比较备份目录和仓库中的备份目录
if diff -rq "$BACKUP_DIR" "$REPO_DIR/memory-backup" 2>/dev/null | grep -q "^Files"; then
    echo "没有变化，跳过提交"
    exit 0
fi

# 移动备份到git目录的 memory-backup 文件夹
mkdir -p "$REPO_DIR/memory-backup"
cp -r "$BACKUP_DIR"/* "$REPO_DIR/memory-backup/" 2>/dev/null || true
# 删除备份中的敏感文件
rm -f "$REPO_DIR/memory-backup/TOOLS.md"

git add -A
git commit -m "🗂️ 记忆备份 $(TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M')" 2>/dev/null
git push 2>/dev/null

echo "备份完成: $(date)"
