/*
  Warnings:

  - You are about to drop the column `hsnCode` on the `InvoiceItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publicToken]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "emailOpens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPublicEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastEmailOpenedAt" TIMESTAMP(3),
ADD COLUMN     "lastViewedAt" TIMESTAMP(3),
ADD COLUMN     "publicExpiresAt" TIMESTAMP(3),
ADD COLUMN     "publicToken" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "hsnCode",
ADD COLUMN     "hsnSacCode" TEXT;

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'none';

-- AlterTable
ALTER TABLE "QuotationItem" ADD COLUMN     "hsnSacCode" TEXT;

-- CreateTable
CREATE TABLE "InvoiceActivity" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceActivity_invoiceId_idx" ON "InvoiceActivity"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceActivity_type_idx" ON "InvoiceActivity"("type");

-- CreateIndex
CREATE INDEX "InvoiceActivity_createdAt_idx" ON "InvoiceActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_publicToken_key" ON "Invoice"("publicToken");

-- AddForeignKey
ALTER TABLE "InvoiceActivity" ADD CONSTRAINT "InvoiceActivity_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
