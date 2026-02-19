/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "ptState" TEXT,
ADD COLUMN     "workLocation" TEXT DEFAULT 'Head Office';

-- AlterTable
ALTER TABLE "SalaryComponent" ADD COLUMN     "ledgerAccountId" TEXT;

-- AlterTable
ALTER TABLE "StatutoryConfig" ADD COLUMN     "pfPayableAccountId" TEXT,
ADD COLUMN     "ptPayableAccountId" TEXT,
ADD COLUMN     "salaryPayableAccountId" TEXT,
ADD COLUMN     "tdsPayableAccountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE INDEX "SalaryComponent_ledgerAccountId_idx" ON "SalaryComponent"("ledgerAccountId");

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
