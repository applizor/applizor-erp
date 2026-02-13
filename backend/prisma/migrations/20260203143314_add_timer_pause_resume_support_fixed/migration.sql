-- DropIndex
DROP INDEX "active_timers_employeeId_key";

-- AlterTable
ALTER TABLE "active_timers" ADD COLUMN     "accumulatedTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false;
