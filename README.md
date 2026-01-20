# Applizor ERP - Complete Custom ERP/CRM/HRMS/Accounting Software

A comprehensive enterprise resource planning system built with Next.js, Node.js, PostgreSQL, and Docker.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running
- Git (optional)

### Setup Instructions

1. **Clone/Navigate to the project directory**
   ```bash
   cd applizor-softech-erp
   ```

2. **Create environment files**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Start all services with Docker Compose**
   ```bash
   docker-compose up --build
   ```

   This will start:
   - PostgreSQL database on port `5432`
   - Backend API on port `5000`
   - Frontend Next.js app on port `3000`

4. **Initialize Database Schema**
   
   In a new terminal, run Prisma migrations:
   ```bash
   docker-compose exec backend npm run prisma:generate
   docker-compose exec backend npx prisma db push
   ```

5. **Seed Default Data (Admin User & Company)**
   ```bash
   docker-compose exec backend npm run seed
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health
   - Prisma Studio: `docker-compose exec backend npm run prisma:studio` (then open http://localhost:5555)

### 🔐 Default Login Credentials

**Email:** `admin@applizor.com`  
**Password:** `admin123`

⚠️ **Please change the password after first login!**

See [DEFAULT_CREDENTIALS.md](./DEFAULT_CREDENTIALS.md) for more details.

## 📁 Project Structure

```
applizor-softech-erp/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   └── server.ts    # Main server file
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── Dockerfile
│   └── package.json
├── frontend/            # Next.js frontend
│   ├── app/             # Next.js app directory
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml   # Docker orchestration
└── README.md
```

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL 15
- **ORM:** Prisma
- **Authentication:** JWT / RBAC
- **Containerization:** Docker & Docker Compose

## 📋 Modules (15 Total)

1. ✅ CRM & Sales Management
2. ✅ Client Portal
3. ✅ Projects & Task Management
4. ✅ Timesheets & Utilization Tracking
5. ✅ Recruitment / ATS
6. ✅ HRMS (Departments, Positions, Roles)
7. ✅ Attendance & Leave Management
8. ✅ Payroll
9. ✅ Accounting & Finance
10. ✅ Invoicing, Recurring Billing & Subscriptions
11. ✅ Centralized Document Management System (DMS)
12. ✅ Advanced Analytics / BI Dashboards
13. ✅ Payments & Integrations
14. ✅ Roles, Permissions & Module Customization
15. ✅ Document Engine (DOCX → PDF)

## 🔧 Development Commands

### Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up --build

# Execute commands in containers
docker-compose exec backend npm run <command>
docker-compose exec frontend npm run <command>
```

### Backend Commands

```bash
# Run development server
docker-compose exec backend npm run dev

# Generate Prisma client
docker-compose exec backend npm run prisma:generate

# Run migrations
docker-compose exec backend npm run prisma:migrate

# Open Prisma Studio
docker-compose exec backend npm run prisma:studio
```

### Frontend Commands

```bash
# Run development server
docker-compose exec frontend npm run dev

# Build for production
docker-compose exec frontend npm run build

# Run production server
docker-compose exec frontend npm run start
```

## 📊 Database Schema

The complete database schema is defined in `backend/prisma/schema.prisma` with models for:

- Authentication & Authorization (User, Role, Permission)
- Company & Organization
- CRM & Sales (Client, Lead)
- Projects & Tasks
- Timesheets & Utilization
- HRMS (Employee, Department, Position)
- Attendance & Leave
- Payroll
- Accounting & Finance
- Invoicing & Subscriptions
- Payments
- Document Management
- Recruitment / ATS
- Audit Logging

## 🚧 Development Phases

- **Phase 0:** ✅ Architecture, repo setup, DB schema
- **Phase 1:** Auth, Company setup, Document Engine, Invoicing
- **Phase 2:** Payments, Webhooks, CRM, Client Portal
- **Phase 3:** Recruitment, HRMS, Attendance
- **Phase 4:** Payroll, Accounting reports
- **Phase 5:** Projects, Timesheets, Subscriptions
- **Phase 6:** Analytics, dashboards, optimization

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://applizor:applizor123@postgres:5432/applizor_erp?schema=public
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📝 Notes

- Database data persists in Docker volume `postgres_data`
- All services run in development mode with hot-reload
- Prisma migrations are required after schema changes
- Document Engine will use DOCX → PDF (no HTML to PDF)

## 🤝 Contributing

This is a private project for Applizor Softech LLP.

## 📄 License

Proprietary - Applizor Softech LLP
