-- Add emailConfig and paymentConfig JSON columns to Company
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "emailConfig" JSONB;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "paymentConfig" JSONB;

-- Create PerformanceReviewCycle table
CREATE TABLE IF NOT EXISTS "PerformanceReviewCycle" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReviewCycle_pkey" PRIMARY KEY ("id")
);

-- Add cycleId to PerformanceReview if not already present
ALTER TABLE "PerformanceReview" ADD COLUMN IF NOT EXISTS "cycleId" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "PerformanceReviewCycle_companyId_idx" ON "PerformanceReviewCycle"("companyId");

-- Add reconciledAt to JournalEntryLine for bank reconciliation
ALTER TABLE "JournalEntryLine" ADD COLUMN IF NOT EXISTS "reconciledAt" TIMESTAMP(3);

-- Add foreign keys
ALTER TABLE "PerformanceReviewCycle" ADD CONSTRAINT "PerformanceReviewCycle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PerformanceReviewCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
