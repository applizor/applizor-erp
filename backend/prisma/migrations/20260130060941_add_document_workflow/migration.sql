/*
  Warnings:

  - You are about to drop the column `description` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `letterheadMode` on the `DocumentTemplate` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "DocumentTemplate_type_idx";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "signedFilePath" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN     "workflowType" TEXT DEFAULT 'standard';

-- AlterTable
ALTER TABLE "DocumentTemplate" DROP COLUMN "description",
DROP COLUMN "letterheadMode",
ADD COLUMN     "content" TEXT,
ADD COLUMN     "variables" TEXT[],
ALTER COLUMN "filePath" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SalaryComponent" ADD COLUMN     "isTaxable" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "fileUrl" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Policy_companyId_idx" ON "Policy"("companyId");

-- CreateIndex
CREATE INDEX "Ticket_companyId_idx" ON "Ticket"("companyId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_assignedTo_idx" ON "Ticket"("assignedTo");

-- CreateIndex
CREATE INDEX "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
