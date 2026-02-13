-- AlterTable
ALTER TABLE "EmployeeSalaryStructure" ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "SalaryComponent" ALTER COLUMN "calculationType" SET DEFAULT 'flat';

-- CreateTable
CREATE TABLE "SalaryTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryTemplateComponent" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL DEFAULT 'flat',
    "value" DECIMAL(12,2) NOT NULL,
    "formula" TEXT,

    CONSTRAINT "SalaryTemplateComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaryTemplate_companyId_name_key" ON "SalaryTemplate"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryTemplateComponent_templateId_componentId_key" ON "SalaryTemplateComponent"("templateId", "componentId");

-- AddForeignKey
ALTER TABLE "SalaryTemplate" ADD CONSTRAINT "SalaryTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryTemplateComponent" ADD CONSTRAINT "SalaryTemplateComponent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SalaryTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryTemplateComponent" ADD CONSTRAINT "SalaryTemplateComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryStructure" ADD CONSTRAINT "EmployeeSalaryStructure_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SalaryTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
