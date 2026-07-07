-- Create Chart of Accounts Templates
CREATE TABLE "coa_templates" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "coa_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coa_templates_countryId_version_key" ON "coa_templates"("countryId", "version");

ALTER TABLE "coa_templates" ADD CONSTRAINT "coa_templates_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "coa_template_entries" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentCode" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "coa_template_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coa_template_entries_templateId_code_key" ON "coa_template_entries"("templateId", "code");
CREATE INDEX "coa_template_entries_templateId_idx" ON "coa_template_entries"("templateId");

ALTER TABLE "coa_template_entries" ADD CONSTRAINT "coa_template_entries_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "coa_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
