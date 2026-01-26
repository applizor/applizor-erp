-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "contractType" TEXT,
ADD COLUMN     "contractValue" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR';
