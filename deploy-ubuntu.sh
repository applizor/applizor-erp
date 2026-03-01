#!/bin/bash

# Applizor ERP - Ubuntu Deployment Script
# This script automates the deployment of Applizor ERP on a fresh Ubuntu server.

set -e

echo "🚀 Starting Applizor ERP Deployment on Ubuntu..."

# 1. Update and Install Dependencies
echo "Update system and install dependencies..."
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git

# 2. Install Docker (if not installed)
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "✅ Docker installed"
else
    echo "ℹ️  Docker is already installed"
fi

# 3. Ensure Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose installed"
else
    echo "ℹ️  Docker Compose is already available"
fi

# 4. Setup Environment Files
echo "Setting up environment files..."
if [ ! -f backend/.env ]; then
    if [ -f backend/.env.example ]; then
        cp backend/.env.example backend/.env
        echo "✅ Backend .env copied from .env.example"
    else
        cat > backend/.env << 'EOF'
DATABASE_URL="postgresql://applizor:applizor123@postgres:5432/applizor_erp?schema=public"
PORT=5000
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
EOF
        echo "✅ Backend .env initialized with defaults"
    fi
fi

if [ ! -f frontend/.env ]; then
    if [ -f frontend/.env.example ]; then
        cp frontend/.env.example frontend/.env
        echo "✅ Frontend .env copied from .env.example"
    else
        cat > frontend/.env << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF
        echo "✅ Frontend .env initialized with defaults"
    fi
fi

# 5. Build and Start Production Containers
echo "Building and starting production containers..."
docker compose -f docker-compose.prod.yml up -d --build

# 6. Verify and Run Database Migrations
echo "Checking database connectivity..."
# Wait for postgres to be healthy
MAX_RETRIES=30
COUNT=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' applizor-postgres)" == "healthy" ]; do
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Database failed to become healthy in time."
        docker compose -f docker-compose.prod.yml logs postgres
        exit 1
    fi
    echo "Waiting for database to be healthy... ($COUNT/$MAX_RETRIES)"
    sleep 2
    COUNT=$((COUNT+1))
done

echo "Running Prisma operations..."
docker compose -f docker-compose.prod.yml exec backend npx prisma generate
docker compose -f docker-compose.prod.yml exec backend npx prisma db push --accept-data-loss # Only for initial deployment
docker compose -f docker-compose.prod.yml exec backend npm run seed

echo ""
echo "🎉 Applizor ERP has been deployed successfully!"
echo "-----------------------------------------------"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "-----------------------------------------------"
echo ""
echo "⚠️  IMPORTANT: Please update backend/.env and frontend/.env with secure secrets and proper URLs"
echo "and restart the containers: docker compose -f docker-compose.prod.yml restart"
