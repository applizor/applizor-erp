-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_countryId_fkey";

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_stateId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

-- DropForeignKey
ALTER TABLE "countries" DROP CONSTRAINT "countries_currencyId_fkey";

-- DropForeignKey
ALTER TABLE "email_logs" DROP CONSTRAINT "email_logs_companyId_fkey";

-- DropForeignKey
ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT "tenant_subscriptions_planId_fkey";

-- DropIndex
DROP INDEX "Company_countryId_idx";

-- DropIndex
DROP INDEX "Company_name_idx";

-- DropIndex
DROP INDEX "Company_stateId_idx";

-- DropIndex
DROP INDEX "statutory_rules_countryId_code_effectiveFrom_key";

-- DropIndex
DROP INDEX "statutory_rules_countryId_idx";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "ssoConfig" JSONB;

-- AlterTable
ALTER TABLE "DocumentTemplate" ADD COLUMN     "pdfContinuationTop" INTEGER,
ADD COLUMN     "pdfMarginBottom" INTEGER,
ADD COLUMN     "pdfMarginLeft" INTEGER,
ADD COLUMN     "pdfMarginRight" INTEGER,
ADD COLUMN     "pdfMarginTop" INTEGER;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "baseCurrencyAmount" DECIMAL(12,2),
ADD COLUMN     "customPaymentUrl" TEXT,
ADD COLUMN     "exchangeRate" DECIMAL(18,8);

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "baseCurrencyAmount" DECIMAL(12,2),
ADD COLUMN     "exchangeRate" DECIMAL(18,8);

-- AlterTable
ALTER TABLE "email_logs" ALTER COLUMN "sender" DROP DEFAULT,
ALTER COLUMN "department" DROP DEFAULT,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "statutory_rules" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "date" DATE NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'api',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "receiptUrl" TEXT,
    "expenseDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "totalLevels" INTEGER NOT NULL DEFAULT 1,
    "rejectionReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseApproval" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "actionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseApprovalConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,
    "maxAmount" DECIMAL(12,2),
    "minAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseApprovalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundVerification" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "agencyName" TEXT,
    "reportUrl" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingChecklist" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saml_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entryPoint" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "cert" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saml_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomationLog_ruleId_idx" ON "AutomationLog"("ruleId");

-- CreateIndex
CREATE INDEX "exchange_rates_baseCurrency_targetCurrency_date_idx" ON "exchange_rates"("baseCurrency", "targetCurrency", "date");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_baseCurrency_targetCurrency_date_key" ON "exchange_rates"("baseCurrency", "targetCurrency", "date");

-- CreateIndex
CREATE INDEX "Expense_companyId_idx" ON "Expense"("companyId");

-- CreateIndex
CREATE INDEX "Expense_employeeId_idx" ON "Expense"("employeeId");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_companyId_status_idx" ON "Expense"("companyId", "status");

-- CreateIndex
CREATE INDEX "ExpenseApproval_expenseId_idx" ON "ExpenseApproval"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseApproval_approverId_idx" ON "ExpenseApproval"("approverId");

-- CreateIndex
CREATE INDEX "ExpenseApproval_approverId_status_idx" ON "ExpenseApproval"("approverId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseApproval_expenseId_level_key" ON "ExpenseApproval"("expenseId", "level");

-- CreateIndex
CREATE INDEX "ExpenseApprovalConfig_companyId_idx" ON "ExpenseApprovalConfig"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseApprovalConfig_companyId_level_key" ON "ExpenseApprovalConfig"("companyId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundVerification_candidateId_key" ON "BackgroundVerification"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingChecklist_candidateId_key" ON "OnboardingChecklist"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "saml_configs_companyId_key" ON "saml_configs"("companyId");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_status_idx" ON "LeaveRequest"("employeeId", "status");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_endDate_idx" ON "LeaveRequest"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "PerformanceReview_cycleId_idx" ON "PerformanceReview"("cycleId");

-- CreateIndex
CREATE INDEX "Timesheet_employeeId_status_idx" ON "Timesheet"("employeeId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "statutory_rules_countryId_code_effectiveFrom_idx" ON "statutory_rules"("countryId", "code", "effectiveFrom");

-- CreateIndex
CREATE INDEX "statutory_rules_companyId_idx" ON "statutory_rules"("companyId");

-- CreateIndex
CREATE INDEX "tenant_plans_code_idx" ON "tenant_plans"("code");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_companyId_idx" ON "tenant_subscriptions"("companyId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "countries" ADD CONSTRAINT "countries_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "tenant_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statutory_rules" ADD CONSTRAINT "statutory_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseApprovalConfig" ADD CONSTRAINT "ExpenseApprovalConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundVerification" ADD CONSTRAINT "BackgroundVerification_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saml_configs" ADD CONSTRAINT "saml_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
