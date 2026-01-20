/*
  Warnings:

  - You are about to drop the column `permissionId` on the `RolePermission` table. All the data in the column will be lost.
  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[roleId,module]` on the table `RolePermission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `module` to the `RolePermission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropIndex
DROP INDEX "Attendance_employeeId_date_key";

-- DropIndex
DROP INDEX "RolePermission_permissionId_idx";

-- DropIndex
DROP INDEX "RolePermission_roleId_permissionId_key";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "hourlyRate" DECIMAL(10,2),
ADD COLUMN     "noticePeriodEndDate" TIMESTAMP(3),
ADD COLUMN     "noticePeriodStartDate" TIMESTAMP(3),
ADD COLUMN     "probationEndDate" TIMESTAMP(3),
ADD COLUMN     "skills" JSONB,
ADD COLUMN     "slackMemberId" TEXT;

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "assignedBy" TEXT,
ADD COLUMN     "attachmentPath" TEXT,
ADD COLUMN     "durationType" TEXT NOT NULL DEFAULT 'full',
ALTER COLUMN "days" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "LeaveType" ADD COLUMN     "accrualRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "accrualStartMonth" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "accrualType" TEXT NOT NULL DEFAULT 'yearly',
ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#3B82F6',
ADD COLUMN     "departmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "employmentStatus" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "encashable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxAccrual" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "maxConsecutiveDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minServiceDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "positionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "proofRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sandwichRule" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RolePermission" DROP COLUMN "permissionId",
ADD COLUMN     "createLevel" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "deleteLevel" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "module" TEXT NOT NULL,
ADD COLUMN     "readLevel" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "updateLevel" TEXT NOT NULL DEFAULT 'none';

-- DropTable
DROP TABLE "Permission";

-- CreateTable
CREATE TABLE "LeaveAccrual" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "accruedDays" DOUBLE PRECISION NOT NULL,
    "totalAccrued" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveAccrual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "letterheadMode" TEXT NOT NULL DEFAULT 'NONE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveAccrual_employeeId_year_idx" ON "LeaveAccrual"("employeeId", "year");

-- CreateIndex
CREATE INDEX "LeaveAccrual_leaveTypeId_idx" ON "LeaveAccrual"("leaveTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveAccrual_employeeId_leaveTypeId_year_month_key" ON "LeaveAccrual"("employeeId", "leaveTypeId", "year", "month");

-- CreateIndex
CREATE INDEX "DocumentTemplate_companyId_idx" ON "DocumentTemplate"("companyId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_type_idx" ON "DocumentTemplate"("type");

-- CreateIndex
CREATE INDEX "Attendance_employeeId_date_idx" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_module_key" ON "RolePermission"("roleId", "module");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAccrual" ADD CONSTRAINT "LeaveAccrual_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAccrual" ADD CONSTRAINT "LeaveAccrual_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
