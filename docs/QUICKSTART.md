# 🚀 Quick Start Guide

## Step 1: Run Setup Script (Optional)
```bash
./setup.sh
```

This will create `.env` files automatically.

## Step 2: Start Docker Containers
```bash
docker-compose up --build
```

Wait for all services to start (PostgreSQL, Backend, Frontend).

## Step 3: Initialize Database
Open a new terminal and run:

```bash
# Generate Prisma Client
docker-compose exec backend npm run prisma:generate

# Run Database Migrations
docker-compose exec backend npm run prisma:migrate
```

## Step 4: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **Prisma Studio:** 
  ```bash
  docker-compose exec backend npm run prisma:studio
  ```
  Then open: http://localhost:5555

## Troubleshooting

### If containers fail to start:
1. Make sure Docker Desktop is running
2. Check if ports 3000, 5000, 5432 are available
3. View logs: `docker-compose logs -f`

### If database connection fails:
1. Wait for PostgreSQL to be fully ready (healthcheck passes)
2. Check backend logs: `docker-compose logs backend`

### To restart everything:
```bash
docker-compose down
docker-compose up --build
```

## Next Steps

After successful setup, you can start developing:
- Backend API routes in `backend/src/`
- Frontend pages in `frontend/app/`
- Database schema in `backend/prisma/schema.prisma`
