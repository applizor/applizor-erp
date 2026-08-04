-- AlterTable
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "isPlatform" BOOLEAN NOT NULL DEFAULT false;

-- Index for quick lookup of the platform books company
CREATE INDEX IF NOT EXISTS "Company_isPlatform_idx" ON "Company"("isPlatform");
