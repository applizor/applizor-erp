-- Add currency column to Quotation table
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) DEFAULT 'INR';

-- Update existing quotations to use company's current currency
UPDATE "Quotation" q
SET "currency" = COALESCE(c."currency", 'INR')
FROM "Company" c
WHERE q."companyId" = c."id"
AND q."currency" IS NULL;
