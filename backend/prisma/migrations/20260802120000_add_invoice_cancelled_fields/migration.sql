-- Add missing fields to Invoice table that exist in schema but not in production DB
-- Safe: uses IF NOT EXISTS pattern via DO block

DO $$
BEGIN
    -- Add cancelledAt column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Invoice' AND column_name = 'cancelledAt'
    ) THEN
        ALTER TABLE "Invoice" ADD COLUMN "cancelledAt" TIMESTAMP(3);
    END IF;

    -- Add cancelledReason column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Invoice' AND column_name = 'cancelledReason'
    ) THEN
        ALTER TABLE "Invoice" ADD COLUMN "cancelledReason" TEXT;
    END IF;

    -- Add customPaymentUrl column if not exists (from earlier migration - may already exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Invoice' AND column_name = 'customPaymentUrl'
    ) THEN
        ALTER TABLE "Invoice" ADD COLUMN "customPaymentUrl" TEXT;
    END IF;

    -- Add Role companyId column if not exists (from today's migration)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Role' AND column_name = 'companyId'
    ) THEN
        ALTER TABLE "Role" ADD COLUMN "companyId" TEXT;
        ALTER TABLE "Role" ADD CONSTRAINT "Role_companyId_fkey" 
            FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Drop old unique index on Role.name if exists
    IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'Role' AND indexname = 'Role_name_key'
    ) THEN
        DROP INDEX "Role_name_key";
    END IF;

    -- Add new compound unique index on Role(companyId, name) if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'Role' AND indexname = 'Role_companyId_name_key'
    ) THEN
        CREATE UNIQUE INDEX "Role_companyId_name_key" ON "Role"("companyId", "name");
    END IF;

    -- Add companyId index on Role if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'Role' AND indexname = 'Role_companyId_idx'
    ) THEN
        CREATE INDEX "Role_companyId_idx" ON "Role"("companyId");
    END IF;

END $$;
