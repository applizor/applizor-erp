-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "maxReminders" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "nextReminderAt" TIMESTAMP(3),
ADD COLUMN     "reminderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reminderFrequency" TEXT;
