#!/bin/bash
# Fetch database dump from remote docker container over SSH and restore it locally

echo "⏳ Step 1: Downloading pg_dump from remote server (65.1.30.126)..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i backend/applizor.pem ubuntu@65.1.30.126 "sudo docker exec -i postgres pg_dump -U applizor -d applizor_erp" > backend/backups/remote_db_backup.sql

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to fetch remote database dump! Please check if your IP is unblocked or keys are correct."
    exit 1
fi

echo "✅ Backup successfully downloaded to backend/backups/remote_db_backup.sql"

echo "⏳ Step 2: Restoring backup to local database container (applizor-postgres)..."
docker exec -i applizor-postgres psql -U applizor -d applizor_erp < backend/backups/remote_db_backup.sql

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to restore backup into local database container!"
    exit 1
fi

echo "✅ Local database restore completed successfully!"
