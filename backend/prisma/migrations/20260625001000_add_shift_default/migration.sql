-- AlterTable: Add isDefault to Shift
ALTER TABLE "Shift" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;
