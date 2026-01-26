/*
  Warnings:

  - You are about to drop the column `logo` on the `Client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "logo",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "companyLogo" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "language" TEXT DEFAULT 'English',
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "receiveNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "salutation" TEXT,
ADD COLUMN     "subCategoryId" TEXT;

-- CreateTable
CREATE TABLE "ClientCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSubCategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientCategory_companyId_idx" ON "ClientCategory"("companyId");

-- CreateIndex
CREATE INDEX "ClientSubCategory_categoryId_idx" ON "ClientSubCategory"("categoryId");

-- CreateIndex
CREATE INDEX "Client_categoryId_idx" ON "Client"("categoryId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ClientCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "ClientSubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCategory" ADD CONSTRAINT "ClientCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSubCategory" ADD CONSTRAINT "ClientSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ClientCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
