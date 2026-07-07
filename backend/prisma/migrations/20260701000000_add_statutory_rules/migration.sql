-- Create Statutory Rules Engine Table
CREATE TABLE "statutory_rules" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "employeeRate" DECIMAL(5,2),
    "employerRate" DECIMAL(5,2),
    "wageCeiling" DECIMAL(12,2),
    "slabData" JSONB,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "statutory_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "statutory_rules_countryId_code_effectiveFrom_key" ON "statutory_rules"("countryId", "code", "effectiveFrom");
CREATE INDEX "statutory_rules_countryId_idx" ON "statutory_rules"("countryId");

ALTER TABLE "statutory_rules" ADD CONSTRAINT "statutory_rules_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
