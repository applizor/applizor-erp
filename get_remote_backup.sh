#!/bin/bash
# Fetch database dump from remote docker container over SSH and restore it locally

mkdir -p backend/backups

KEY_PATH="/Users/arun/Documents/applizor/applizor.pem"
if [ ! -f "$KEY_PATH" ]; then
    KEY_PATH="backend/applizor.pem"
fi

echo "⏳ Step 1: Downloading pg_dump from remote database (172.31.8.14 via 65.1.30.126)..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i "$KEY_PATH" ubuntu@65.1.30.126 "PGPASSWORD=applizor123 pg_dump -h 172.31.8.14 -U applizor -d applizor_erp" > backend/backups/remote_db_backup.sql

if [ $? -ne 0 ] || [ ! -s backend/backups/remote_db_backup.sql ]; then
    echo "❌ Error: Failed to fetch remote database dump! Please check if your IP is unblocked or keys are correct."
    exit 1
fi

echo "✅ Backup successfully downloaded to backend/backups/remote_db_backup.sql"

echo "⏳ Step 2: Recreating database and restoring backup to local container..."
docker exec -i applizor-postgres psql -U applizor -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'applizor_erp' AND pid <> pg_backend_pid();"
docker exec -i applizor-postgres psql -U applizor -d postgres -c "DROP DATABASE IF EXISTS applizor_erp;"
docker exec -i applizor-postgres psql -U applizor -d postgres -c "CREATE DATABASE applizor_erp;"
docker exec -i applizor-postgres psql -U applizor -d applizor_erp < backend/backups/remote_db_backup.sql

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to restore backup into local database container!"
    exit 1
fi

echo "✅ Local database restore completed successfully!"
