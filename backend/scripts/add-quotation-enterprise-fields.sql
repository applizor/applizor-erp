-- Add enterprise quotation features
-- Public sharing, client acceptance, PDF generation

-- Add new columns to Quotation table
ALTER TABLE "Quotation" 
ADD COLUMN IF NOT EXISTS "publicToken" TEXT,
ADD COLUMN IF NOT EXISTS "publicExpiresAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "isPublicEnabled" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "clientViewedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "clientAcceptedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "clientRejectedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "clientSignature" TEXT,
ADD COLUMN IF NOT EXISTS "clientEmail" TEXT,
ADD COLUMN IF NOT EXISTS "clientName" TEXT,
ADD COLUMN IF NOT EXISTS "clientComments" TEXT,
ADD COLUMN IF NOT EXISTS "pdfPath" TEXT,
ADD COLUMN IF NOT EXISTS "signedPdfPath" TEXT;

-- Add unique constraint on publicToken
CREATE UNIQUE INDEX IF NOT EXISTS "Quotation_publicToken_key" ON "Quotation"("publicToken");

-- Update status column to support new statuses
-- Note: Existing 'draft', 'sent', 'accepted' remain
-- New: 'viewed', 'rejected', 'expired'

-- Verify changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Quotation' 
  AND column_name IN ('publicToken', 'publicExpiresAt', 'isPublicEnabled', 'clientSignature', 'pdfPath')
ORDER BY column_name;
