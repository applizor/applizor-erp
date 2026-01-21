-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "emailOpens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastEmailOpenedAt" TIMESTAMP(3),
ADD COLUMN     "lastViewedAt" TIMESTAMP(3),
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "QuotationActivity" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuotationActivity_quotationId_idx" ON "QuotationActivity"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationActivity_type_idx" ON "QuotationActivity"("type");

-- CreateIndex
CREATE INDEX "QuotationActivity_createdAt_idx" ON "QuotationActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "QuotationActivity" ADD CONSTRAINT "QuotationActivity_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
