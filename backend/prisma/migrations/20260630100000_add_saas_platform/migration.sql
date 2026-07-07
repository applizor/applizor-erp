-- Create SaaS Platform Tables
-- Country master data
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "code3" TEXT,
    "numeric" TEXT,
    "phoneCode" TEXT,
    "currencyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");
CREATE INDEX "countries_code_idx" ON "countries"("code");

-- State/Province master data
CREATE TABLE "states" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "states_countryId_code_key" ON "states"("countryId", "code");
CREATE INDEX "states_countryId_idx" ON "states"("countryId");
ALTER TABLE "states" ADD CONSTRAINT "states_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Currency master data
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");
CREATE INDEX "currencies_code_idx" ON "currencies"("code");

ALTER TABLE "countries" ADD CONSTRAINT "countries_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"(id);

-- Tenant Plans (SaaS plans like Starter, Growth, Enterprise)
CREATE TABLE "tenant_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingInterval" TEXT NOT NULL DEFAULT 'monthly',
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxStorageGb" INTEGER NOT NULL DEFAULT 1,
    "maxCompanies" INTEGER NOT NULL DEFAULT 1,
    "enabledModules" JSONB,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenant_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_plans_code_key" ON "tenant_plans"("code");
CREATE INDEX "tenant_plans_isActive_idx" ON "tenant_plans"("isActive");

-- Tenant Subscriptions (which plan a company is on)
CREATE TABLE "tenant_subscriptions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "paymentMethod" TEXT,
    "paymentGatewayId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_subscriptions_companyId_key" ON "tenant_subscriptions"("companyId");
CREATE INDEX "tenant_subscriptions_planId_idx" ON "tenant_subscriptions"("planId");
CREATE INDEX "tenant_subscriptions_status_idx" ON "tenant_subscriptions"("status");
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "tenant_plans"(id);

-- Add new fields to Company
ALTER TABLE "Company" ADD COLUMN "countryId" TEXT;
ALTER TABLE "Company" ADD COLUMN "stateId" TEXT;
ALTER TABLE "Company" ADD COLUMN "timezone" TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE "Company" ADD COLUMN "locale" TEXT DEFAULT 'en-IN';

ALTER TABLE "Company" ADD CONSTRAINT "Company_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"(id);
ALTER TABLE "Company" ADD CONSTRAINT "Company_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"(id);
CREATE INDEX "Company_countryId_idx" ON "Company"("countryId");
CREATE INDEX "Company_stateId_idx" ON "Company"("stateId");
