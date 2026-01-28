#!/bin/bash
# Restore database from projectstartbackup.sql

echo "⏳ Restoring database from backend/backups/projectstartbackup.sql..."

# Check if file exists
if [ ! -f "backend/backups/projectstartbackup.sql" ]; then
    echo "❌ Error: backend/backups/projectstartbackup.sql not found!"
    exit 1
fi

# Determine if we are in Docker or Host
if [ -f /.dockerenv ]; then
    echo "Detected Docker environment. Restoration should be run from the HOST for psql access."
    echo "Please run: ./restore_db.sh on your machine."
    exit 1
fi

# Run restoration using docker exec and psql
docker exec -i applizor-postgres psql -U applizor -d applizor_erp < backend/backups/projectstartbackup.sql

echo "✅ Database restoration complete!"
