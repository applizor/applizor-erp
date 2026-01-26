-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "taxName" TEXT,
ADD COLUMN     "website" TEXT;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
