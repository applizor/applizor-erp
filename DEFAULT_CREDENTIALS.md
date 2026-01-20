# Default Administrator Credentials

## 🔐 Default Login Credentials

**Email:** `admin@applizor.com`  
**Password:** `admin123`

## ⚠️ Important Security Notice

**Please change the password immediately after first login!**

## 📋 What Was Created

The seed script has created:

1. **Default Company:** Applizor Softech LLP
2. **Admin User:** admin@applizor.com
3. **Admin Role:** Administrator (with all permissions)
4. **Default Departments:**
   - Engineering
   - Sales
   - HR
   - Accounts
   - Management
5. **Default Leave Types:**
   - Casual Leave (12 days)
   - Sick Leave (12 days)
   - Earned Leave (15 days)
   - Unpaid Leave

## 🚀 How to Login

1. Go to: http://localhost:3000/login
2. Enter email: `admin@applizor.com`
3. Enter password: `admin123`
4. Click "Sign in"

## 🔄 Re-seed Database

If you need to reset the database and re-run the seed:

```bash
docker-compose exec backend npm run seed
```

Or to reset everything:

```bash
docker-compose down -v  # This will delete all data
docker-compose up -d
docker-compose exec backend npm run prisma:generate
docker-compose exec backend npx prisma db push
docker-compose exec backend npm run seed
```
