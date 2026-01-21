#!/bin/bash

# Database Backup Script for Applizor ERP
# Usage: ./backup.sh

BACKUP_DIR="/Users/arun/Documents/applizor-softech-erp/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Creating database backup..."

# Create backup
docker exec applizor-postgres pg_dump -U applizor applizor_erp > "$BACKUP_FILE"

# Verify backup was created and has content
if [ -s "$BACKUP_FILE" ]; then
    FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "✅ Backup created successfully: $BACKUP_FILE"
    echo "📦 Size: $FILE_SIZE"
    
    # Delete backups older than 7 days
    echo "🗑️  Cleaning old backups (older than 7 days)..."
    find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete
    
    echo "✅ Backup process completed!"
    echo ""
    echo "To restore this backup:"
    echo "docker exec -i applizor-postgres psql -U applizor -d applizor_erp < $BACKUP_FILE"
else
    echo "❌ Backup failed! File is empty or was not created."
    exit 1
fi
