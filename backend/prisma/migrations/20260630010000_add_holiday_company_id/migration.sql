-- Add companyId to Holiday model for multi-tenant filtering
ALTER TABLE "Holiday" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;
CREATE INDEX "Holiday_companyId_idx" ON "Holiday"("companyId");
