#!/bin/bash
# Master script to backup remote DB, restore locally, isolate company data, run migrations, and launch local environment.

echo "🚀 Starting Applizor Local Migration & Launch Process..."
echo "--------------------------------------------------------"

# 1. Fetch Remote backup
./get_remote_backup.sh
if [ $? -ne 0 ]; then
    echo "⚠️ Remote backup failed (possibly due to SSH temporary block). Proceeding with existing local database..."
else
    echo "✅ Remote backup & restore complete."
fi

# 2. Start full Docker environment
echo "⏳ Starting full docker-compose services (backend, frontend, gotenberg)..."
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for backend container to be ready
echo "⏳ Waiting for backend container to boot..."
sleep 10

# 3. Run Prisma Migrations to apply our payment-gateway code database changes (if any)
echo "⏳ Running Prisma migrations in backend..."
docker-compose -f docker-compose.dev.yml exec -T backend npx prisma migrate deploy

# 4. Run Isolation Script to keep only "Applizor Softech LLP"
echo "⏳ Isolating Applizor Softech LLP data..."
docker-compose -f docker-compose.dev.yml exec -T backend npx ts-node src/scripts/isolateCompany.ts

echo "--------------------------------------------------------"
echo "🎉 Local Environment is ready and running!"
echo "👉 Frontend URL: http://localhost:3000"
echo "👉 Backend API URL: http://localhost:5000"
echo "--------------------------------------------------------"
echo "To view logs, run: docker-compose -f docker-compose.dev.yml logs -f"
