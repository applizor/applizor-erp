-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "offDays" TEXT DEFAULT 'Saturday, Sunday',
ALTER COLUMN "accountingLockDate" SET DATA TYPE TIMESTAMP(3);
