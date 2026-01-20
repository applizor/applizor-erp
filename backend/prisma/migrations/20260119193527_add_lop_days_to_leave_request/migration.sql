-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "category" TEXT,
ADD COLUMN     "lopDays" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LeaveType" ADD COLUMN     "policySettings" JSONB;
