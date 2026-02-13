-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "includeBankDetails" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "includeBankDetails";
