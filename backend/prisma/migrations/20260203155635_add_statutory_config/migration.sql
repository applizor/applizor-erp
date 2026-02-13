-- CreateTable
CREATE TABLE "StatutoryConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pfEmployeeRate" DECIMAL(5,2) NOT NULL DEFAULT 12.0,
    "pfEmployerRate" DECIMAL(5,2) NOT NULL DEFAULT 12.0,
    "pfBasicLimit" DECIMAL(12,2) NOT NULL DEFAULT 15000.0,
    "esiEmployeeRate" DECIMAL(5,3) NOT NULL DEFAULT 0.75,
    "esiEmployerRate" DECIMAL(5,3) NOT NULL DEFAULT 3.25,
    "esiGrossLimit" DECIMAL(12,2) NOT NULL DEFAULT 21000.0,
    "professionalTaxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tdsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatutoryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StatutoryConfig_companyId_key" ON "StatutoryConfig"("companyId");

-- AddForeignKey
ALTER TABLE "StatutoryConfig" ADD CONSTRAINT "StatutoryConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
