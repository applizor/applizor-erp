#!/bin/bash
set -e

# Target directories as requested
API_DIR="/home/admin/web/api.iam.applizor.com/public_html"
FRONTEND_DIR="/home/admin/web/iam.applizor.com/public_html"

echo "Setting up directories..."
sudo mkdir -p $API_DIR $FRONTEND_DIR
sudo chown -R $USER:$USER $API_DIR $FRONTEND_DIR

# ----------------------------------------------------
# 1. SETUP API / BACKEND
# ----------------------------------------------------
echo "Deploying Backend to $API_DIR..."
cd $API_DIR

# Clone/pull repo just for the backend
if [ ! -d ".git" ]; then
  git init
  git remote add origin https://github.com/applizor/applizor-erp.git
fi
git fetch origin main
git reset --hard origin/main

# Clean up redundant frontend code from backend dir
echo "Cleaning up frontend code from API directory..."
rm -rf frontend

# Ensure env files exist
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env || touch backend/.env
fi

# We only want to run the Postgres, backend, and gotenberg containers here.
# Let's create a customized docker-compose for just the backend part
cat << 'DOCKER_EOF' > docker-compose.backend.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: applizor-postgres
    restart: always
    environment:
      POSTGRES_USER: applizor
      POSTGRES_PASSWORD: applizor123
      POSTGRES_DB: applizor_erp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U applizor -d applizor_erp"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - applizor-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: applizor-backend-prod
    restart: always
    env_file:
      - ./backend/.env
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://applizor:applizor123@postgres:5432/applizor_erp?schema=public
      PORT: 5000
    ports:
      - "5000:5000"
    volumes:
      - ./backend/uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - applizor-network

  gotenberg:
    image: gotenberg/gotenberg:8
    container_name: applizor-gotenberg
    restart: always
    ports:
      - "8000:3000"
    networks:
      - applizor-network

volumes:
  postgres_data:

networks:
  applizor-network:
    name: applizor_shared_network
    driver: bridge
DOCKER_EOF

sudo docker compose -f docker-compose.backend.yml up -d --build

# Wait for DB
sleep 5

# Restore DB if needed
TABLE_COUNT=$(sudo docker compose -f docker-compose.backend.yml exec -T postgres psql -U applizor -d applizor_erp -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
if [ "$TABLE_COUNT" -eq 0 ]; then
  sudo docker compose -f docker-compose.backend.yml cp backups/init_prod_backup.sql applizor-postgres:/tmp/init_prod_backup.sql
  sudo docker compose -f docker-compose.backend.yml exec -T postgres psql -U applizor -d applizor_erp -f /tmp/init_prod_backup.sql
fi

# Migrate
sudo docker compose -f docker-compose.backend.yml exec -T backend npx prisma migrate deploy

# ----------------------------------------------------
# 2. SETUP FRONTEND
# ----------------------------------------------------
echo "Deploying Frontend to $FRONTEND_DIR..."
cd $FRONTEND_DIR

if [ ! -d ".git" ]; then
  git init
  git remote add origin https://github.com/applizor/applizor-erp.git
fi
git fetch origin main
git reset --hard origin/main

# Clean up redundant backend code from frontend dir
echo "Cleaning up backend code from Frontend directory..."
rm -rf backend backups docs docker-compose* deploy* scripts || true

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env || touch frontend/.env
fi

cat << 'DOCKER_EOF' > docker-compose.frontend.yml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: applizor-frontend-prod
    restart: always
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.iam.applizor.com/api
    ports:
      - "3000:3000"
    networks:
      - applizor-network

networks:
  applizor-network:
    external: true
    name: applizor_shared_network
DOCKER_EOF

sudo docker compose -f docker-compose.frontend.yml up -d --build

sudo docker system prune -f
echo "✅ Split Deployment successful!"
