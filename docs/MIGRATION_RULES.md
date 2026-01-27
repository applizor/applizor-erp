# Database Migration Rules - MUST FOLLOW

## 🚨 GOLDEN RULE: ALWAYS BACKUP BEFORE MIGRATION

**NEVER run migrations without backup in production or with important data!**
**Update 2026:** You must use `docker exec` to pull backups if running in containers. See specific commands below.

---

## 📋 Safe Migration Checklist

Before ANY database change:

- [ ] Create database backup
- [ ] Verify backup file exists
- [ ] Test backup restoration (optional but recommended)
- [ ] Run migration
- [ ] Verify migration success
- [ ] Test application
- [ ] Keep backup for 7+ days

---

## 1️⃣ Create Database Backup

### PostgreSQL Backup (Docker)

```bash
# Create backup with timestamp
docker exec applizor-postgres pg_dump -U applizor applizor_erp > backup_$(date +%Y%m%d_%H%M%S).sql

# Or with custom name
docker exec applizor-postgres pg_dump -U applizor applizor_erp > backup_before_templates_feature.sql
```

### Verify Backup Created
```bash
ls -lh backup_*.sql
# Should show file size (not 0 bytes)
```

### Backup Location
Store backups in: `/Users/arun/Documents/applizor-softech-erp/backups/`

```bash
# Create backups directory
mkdir -p /Users/arun/Documents/applizor-softech-erp/backups

# Move backup there
mv backup_*.sql /Users/arun/Documents/applizor-softech-erp/backups/
```

---

## 2️⃣ Run Migration

### Development Environment

**Option A: Prisma Migrate (Recommended for schema changes)**
```bash
cd backend
npx prisma migrate dev --name descriptive_migration_name
```

**Option B: Prisma DB Push (For quick prototyping, NO data loss)**
```bash
cd backend
npx prisma db push
```

**When to use what:**
- `migrate dev` - Production-ready migrations, creates migration files
- `db push` - Quick development, no migration history, safer (no reset prompt)

### Production Environment

```bash
# NEVER use migrate dev in production
# Use migrate deploy instead
npx prisma migrate deploy
```

---

## 3️⃣ Handle Migration Drift

If you see "Drift detected" message:

### ❌ WRONG WAY (Data Loss):
```bash
# This will DELETE all data!
npx prisma migrate dev
# > Do you want to continue? All data will be lost. › (y/N)
# > y  ← DON'T DO THIS without backup!
```

### ✅ RIGHT WAY:

**Step 1: Backup First**
```bash
docker exec applizor-postgres pg_dump -U applizor applizor_erp > backup_before_drift_fix.sql
```

**Step 2: Choose Strategy**

**Strategy A: Reset and Restore (if drift is complex)**
```bash
# 1. Reset database
npx prisma migrate reset

# 2. Restore data from backup
docker exec -i applizor-postgres psql -U applizor -d applizor_erp < backup_before_drift_fix.sql

# 3. Run seeder for missing data
npm run seed
```

**Strategy B: Manual SQL Fix (if drift is simple)**
```bash
# 1. Check what's different
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma

# 2. Create manual migration
npx prisma migrate dev --create-only --name fix_drift

# 3. Edit migration file if needed
# 4. Apply migration
npx prisma migrate dev
```

---

## 4️⃣ Restore from Backup

### If Migration Failed or Data Lost

```bash
# 1. Drop and recreate database
docker exec -i applizor-postgres psql -U applizor -c "DROP DATABASE applizor_erp;"
docker exec -i applizor-postgres psql -U applizor -c "CREATE DATABASE applizor_erp;"

# 2. Restore from backup
docker exec -i applizor-postgres psql -U applizor -d applizor_erp < backups/backup_20260121_153000.sql

# 3. Verify data restored
docker exec -i applizor-postgres psql -U applizor -d applizor_erp -c "SELECT COUNT(*) FROM \"User\";"
```

---

## 5️⃣ Migration Best Practices

### DO ✅

1. **Always backup before migrations**
2. **Test migrations in development first**
3. **Use descriptive migration names**
   ```bash
   npx prisma migrate dev --name add_quotation_templates
   ```
4. **Review generated migration SQL**
   - Check `prisma/migrations/[timestamp]_[name]/migration.sql`
5. **Run seeder after reset**
   ```bash
   npm run seed
   ```
6. **Keep backups for at least 7 days**
7. **Document breaking changes**

### DON'T ❌

1. **Never reset database without backup**
2. **Don't use `migrate dev` in production**
3. **Don't ignore drift warnings**
4. **Don't delete migration files**
5. **Don't run migrations during peak hours**
6. **Don't skip testing after migration**

---

## 6️⃣ Common Scenarios

### Scenario 1: Adding New Model

```bash
# 1. Backup
docker exec applizor-postgres pg_dump -U applizor applizor_erp > backup_before_new_model.sql

# 2. Update schema.prisma
# Add new model

# 3. Create migration
npx prisma migrate dev --name add_new_model

# 4. Run seeder if needed
npm run seed
```

### Scenario 2: Modifying Existing Model

```bash
# 1. Backup (CRITICAL!)
docker exec applizor-postgres pg_dump -U applizor applizor_erp > backup_before_model_change.sql

# 2. Update schema.prisma
# Modify existing model

# 3. Create migration
npx prisma migrate dev --name modify_existing_model

# 4. Check if data migration needed
# If yes, write custom SQL in migration file
```

### Scenario 3: Deleting Model/Field

```bash
# 1. Backup (VERY CRITICAL!)
docker exec applizor-postgres pg_dump -U applizor applizor_erp > backup_before_deletion.sql

# 2. Update schema.prisma
# Remove model/field

# 3. Create migration
npx prisma migrate dev --name remove_old_model

# ⚠️ Data will be permanently deleted!
```

---

## 7️⃣ Emergency Rollback

### If Migration Breaks Application

```bash
# 1. Stop application
docker-compose down

# 2. Restore database
docker exec -i applizor-postgres psql -U applizor -d applizor_erp < backups/backup_before_migration.sql

# 3. Revert schema.prisma to previous version
git checkout HEAD~1 -- prisma/schema.prisma

# 4. Regenerate Prisma Client
npx prisma generate

# 5. Restart application
docker-compose up -d
```

---

## 8️⃣ Backup Management

### Automated Backup Script

Create: `/backend/scripts/backup.sh`

```bash
#!/bin/bash
BACKUP_DIR="/Users/arun/Documents/applizor-softech-erp/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup
docker exec applizor-postgres pg_dump -U applizor applizor_erp > "$BACKUP_FILE"

# Verify backup
if [ -s "$BACKUP_FILE" ]; then
    echo "✅ Backup created: $BACKUP_FILE"
    
    # Delete backups older than 7 days
    find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete
    echo "🗑️  Old backups cleaned"
else
    echo "❌ Backup failed!"
    exit 1
fi
```

### Make it executable
```bash
chmod +x backend/scripts/backup.sh
```

### Run before migration
```bash
./backend/scripts/backup.sh
```

---

## 9️⃣ Production Migration Workflow

### Pre-Migration

1. **Announce maintenance window**
2. **Create full backup**
3. **Test migration in staging**
4. **Prepare rollback plan**
5. **Monitor system resources**

### During Migration

1. **Enable maintenance mode**
2. **Stop application**
3. **Create backup**
4. **Run migration**
   ```bash
   npx prisma migrate deploy
   ```
5. **Verify migration**
6. **Start application**
7. **Test critical features**

### Post-Migration

1. **Monitor logs**
2. **Check error rates**
3. **Verify data integrity**
4. **Keep backup for 30 days**
5. **Document changes**

---

## 🔟 Quick Reference Commands

```bash
# Backup
docker exec applizor-postgres pg_dump -U applizor applizor_erp > backup.sql

# Restore
docker exec -i applizor-postgres psql -U applizor -d applizor_erp < backup.sql

# Migrate (Dev)
npx prisma migrate dev --name feature_name

# Migrate (Prod)
npx prisma migrate deploy

# Push (No migration files)
npx prisma db push

# Reset (⚠️ Deletes all data!)
npx prisma migrate reset

# Seed
npm run seed

# Check migration status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate
```

---

## ⚠️ Critical Reminders

1. **BACKUP IS MANDATORY** - No exceptions!
2. **Test in development first** - Always!
3. **Never reset production** - Ever!
4. **Keep backups safe** - Multiple locations if possible
5. **Document everything** - Future you will thank you

---

## 📞 Emergency Contacts

If migration fails catastrophically:

1. **Don't panic**
2. **Don't run more commands**
3. **Restore from backup**
4. **Review what went wrong**
5. **Fix and try again**

---

**Remember: 5 minutes for backup can save 5 hours of recovery!** 🛡️

---

**Last Updated:** 2026-01-21  
**Version:** 1.0  
**Author:** Applizor Development Team
