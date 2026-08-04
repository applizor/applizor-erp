---
type: Architecture
title: SaaS Platform Architecture
description: Multi-tenant platform layer, country/state/currency master data, tenant plans, and platform admin API
tags: [saas, multi-tenant, platform, admin, plans]
timestamp: 2026-06-30T13:00:00Z
---

# SaaS Platform Architecture

## Overview

The platform layer enables running this ERP as a **multi-tenant SaaS**. It adds:
- Country/State/Currency master data for global support
- Tenant plans (Starter/Growth/Enterprise) with feature gating
- Tenant subscription tracking per company
- Super Admin role for platform-wide management
- Company onboarding, suspension, and listing APIs

## New Models

### Country (`countries` table)
- `id`, `name` (unique), `code` (ISO 3166-1 alpha-2, unique), `code3?`, `numeric?`
- `phoneCode?` (+91, +1, etc.), `currencyId?` → Currency
- `isActive`, `createdAt`, `updatedAt`
- Relations: `states[]`, `companies[]`

### State (`states` table)
- `id`, `countryId` → Country, `name`, `code` (ISO 3166-2)
- `isActive`, `createdAt`, `updatedAt`
- Unique: `[countryId, code]`
- Relations: `companies[]`

### Currency (`currencies` table)
- `id`, `code` (ISO 4217, unique), `name`, `symbol` (₹, $, £, etc.)
- `decimalPlaces` (default 2), `isActive`
- Relations: `countries[]`

### TenantPlan (`tenant_plans` table)
- `id`, `name`, `code` (unique, e.g. `starter_monthly`)
- `description?`, `price` (Decimal), `currency` (default USD)
- `billingInterval` (monthly/quarterly/yearly)
- `maxUsers`, `maxStorageGb`, `maxCompanies` (usage limits)
- `enabledModules?` (JSON — which modules are available), `features?` (JSON — feature flags)
- `isActive`, `isPublic`, `sortOrder`
- Relations: `subscriptions[]`

### TenantSubscription (`tenant_subscriptions` table)
- `id`, `companyId` (unique) → Company, `planId` → TenantPlan
- `status` (active/paused/cancelled/expired/trial)
- `trialEndsAt?`, `currentPeriodStart?`, `currentPeriodEnd?`, `cancelledAt?`
- `autoRenew` (default true), `paymentMethod?`, `paymentGatewayId?`, `notes?`

## Company Model Additions

- `countryId?` → Country, `stateId?` → State
- `timezone?` (default "Asia/Kolkata"), `locale?` (default "en-IN")
- `tenantSubscription?` → TenantSubscription (one-to-one)

## Platform Admin API (`/api/platform`)

### Public (with auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | /countries | List all active countries with currencies |
| GET | /states?countryId=&countryCode= | List states by country |
| GET | /currencies | List all active currencies |

### Public (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | /plans | List active tenant plans (for signup page) |

### Super Admin only
| Method | Path | Description |
|--------|------|-------------|
| GET | /tenants | List all tenants with pagination, search, filter |
| GET | /tenants/:id | Get tenant details with stats (also allowed for own company) |
| POST | /tenants | Onboard company + create Admin user + assign plan (returns temp credentials) |
| PUT | /tenants/:id | Update tenant company profile |
| PUT | /tenants/:id/suspend | Suspend tenant (pauses subscription) |
| PUT | /tenants/:id/activate | Activate tenant (reactivates paused subscription) |
| POST | /tenants/:id/provision-admin | Create Admin login for orphan tenants (0 users) |
| DELETE | /tenants/:id | Delete tenant |
| PUT | /tenants/:id/subscription | Assign/update plan, status, period, notes |
| GET | /plans/all | List all plans including inactive |
| POST | /plans | Create a new plan |
| PUT | /plans/:id | Update plan |
| DELETE | /plans/:id | Deactivate plan |
| GET | /stats | Platform dashboard statistics |
| POST | /subscribe/checkout | Tenant self-serve plan checkout (Cashfree/PayPal) |
| POST | /subscribe/verify | Verify payment and activate subscription |
| POST | /subscribe/webhook | Payment webhook |

## Tenant Onboarding Flow (Launch)

1. Super Admin opens `/superadmin/tenants` → **Onboard Company**
2. Fills company details + optional plan + admin email/name/password
3. `POST /api/platform/tenants` creates **atomically** in one Prisma transaction:
   - `Company` (+ `enabledModules` from plan)
   - `TenantSubscription` (always — selected plan, or `starter_monthly` trial if blank)
   - `User` with system `Admin` role + hashed password
4. Response **201** includes `credentials.temporaryPassword` (shown once in UI) + subscription/plan
5. Welcome email / COA defaults are **best-effort** after commit — email failure does **not** fail onboard
6. Errors return `{ error, details, code?, meta? }` (not a bare generic message)
7. Client admin logs in at `/login`

**Prisma tenant isolation note:** Super Admin requests run with the admin’s `companyId` in ALS. Create/upsert must **not** overwrite an explicit `companyId` (fixed in `prisma/client.ts`); otherwise subscription create targeted the admin’s company and hit unique `companyId`, leaving orphans with no plan.

**Repair orphans:** companies created before this fix show "0 Users — orphan"; use the **Provision Admin** action (`POST /tenants/:id/provision-admin`). Assign/change plan via **Edit Subscription** (`PUT /tenants/:id/subscription`).

## Manual Subscription Assignment

`PUT /api/platform/tenants/:id/subscription` with `{ planId, status, autoRenew, notes, extendDays? }`:
- Sets billing period dates from plan interval
- Syncs `Company.enabledModules` from the plan
- Supports cancel (`cancelledAt`) and extend (`extendDays`)

## Plan Limit Enforcement

`middleware/enforcePlanLimit.ts`:
- `enforcePlanLimit('maxUsers')` — seats = max(users, employees)
- `enforcePlanLimit('maxStorageGb')` — document file size sum
- `requireModule(name)` — supports aliases (`crm`↔`clients`, `hrms`↔`employees`)
- `requireFeature(name)` — feature flags from plan JSON

Suspended companies / inactive users are blocked at login and by `authenticate` middleware (platform Super Admin exempt).

## Super Admin Middleware

`middleware/superadmin.ts` — checks `req.user.roles` for 'Super Admin' or 'Platform Admin' role name.

## StatutoryRule Model (`statutory_rules` table)

Added as part of the **Statutory Rule Engine** for country-specific payroll deductions.

```
id              String    @id
countryId       String    → Country
code            String    // 'pf', 'esi', 'social_security', 'medicare', 'paye', 'nic', 'cpf'
name            String
category        String    // 'retirement', 'health', 'tax', 'social'
ruleType        String    // 'percentage', 'slab', 'fixed'
employeeRate    Decimal?  @db.Decimal(5, 2)
employerRate    Decimal?  @db.Decimal(5, 2)
wageCeiling     Decimal?  @db.Decimal(12, 2)
slabData        Json?     // Array of { min, max, amount } or { min, max, rate }
effectiveFrom   DateTime
effectiveTo     DateTime?
isActive        Boolean   @default(true)
```

Unique: `[countryId, code, effectiveFrom]`

### StatutoryRuleService (`services/statutory-rule.service.ts`)

- `getActiveRules(countryId)` — fetch active rules for a country
- `getCountryForCompany(companyId)` — determine company's country
- `evaluateRule(rule, gross, basic, context)` — evaluate a single deduction rule
- `calculateAllDeductions(companyId, employee, month?, year?)` — compute all applicable deductions
- Supports 3 rule types: `percentage` (employee/employer % of wage), `slab` (bracket-based), `fixed` (flat amount)

### Payroll Integration

`payroll.service.ts` `calculateStatutoryDeductions()` now:
1. Checks if company has a `countryId`
2. If yes → uses `StatutoryRuleService.calculateAllDeductions()`
3. If no country (legacy) → falls back to old India-specific `StatutoryConfig` logic

### API Routes (Super Admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | /platform/rules?countryId=&countryCode=&code= | List active rules |
| POST | /platform/rules | Create rule |
| PUT | /platform/rules/:id | Update rule |
| DELETE | /platform/rules/:id | Deactivate rule |

### Seeded Statutory Rules

| Country | Rules |
|---------|-------|
| India (IN) | PF (12%/12%, ceiling ₹15K), ESI (0.75%/3.25%, ceiling ₹21K), PT (state-wise slabs for Maharashtra, Karnataka, Tamil Nadu, Delhi) |
| US | Social Security (6.2%/6.2%, ceiling $168,600), Medicare (1.45%/1.45%), Federal Tax (progressive brackets) |
| UK | NIC (8%/13.8%), PAYE (income tax brackets) |
| UAE | Social Security (5%/12.5% for UAE nationals) |
| Singapore | CPF (20%/17%, ceiling $6,000) |

## Seeded Data

### Currencies
INR (₹), USD ($), GBP (£), EUR (€), AED (د.إ), SGD (S$), AUD (A$), CAD (C$), SAR (﷼), QAR (ر.ق), MYR (RM), LKR, BDT, NPR

### Countries
India, US, UK, UAE, Singapore, Australia, Canada, Saudi Arabia, Qatar, Malaysia, Germany, France, Netherlands

### Indian States
All 28 states + 8 UTs with ISO codes (IN-AP through IN-PY)

### Tenant Plans
| Plan | Price | Users | Storage | Modules |
|------|-------|-------|---------|---------|
| Starter | $29/mo | 5 | 1GB | hrms, payroll, clients/crm, invoices |
| Growth | $99/mo | 20 | 10GB | + projects, accounting |
| Enterprise | $299/mo | 100 | 100GB | + recruitment, lms |



## Platform Accounting (Applizor SaaS books)

Tenant company COA / journal / P&L stay on each tenant `companyId`. **Subscription revenue never posts into the paying tenant’s books.**

Instead, platform SaaS revenue posts into a dedicated company:

- `Company.isPlatform = true` (name: **Applizor Platform**)
- Own COA via `platform-accounting.service.ts` (`1000` bank, `4000` SaaS Subscription Revenue, gateway fees, etc.)
- Idempotent journals with reference `SUB-{orderId}`
- Triggered on `POST /subscribe/verify` and Cashfree webhook after successful payment
- Super Admin UI: `/superadmin/accounting`
- API (Super Admin):
  - `POST /platform/accounting/ensure` — create platform company + COA
  - `GET /platform/accounting/accounts` — trial balance
  - `GET /platform/accounting/journal`
  - `GET /platform/accounting/profit-loss`
  - `GET /platform/accounting/payments` — paid subscriptions vs posted journals
- Platform company is excluded from tenant lists and platform stats

Migration: `20260805000000_add_company_is_platform`

## Chart of Accounts Templates (COA)

### Models

**CoaTemplate** (`coa_templates` table)
- `id`, `countryId` → Country, `name`, `version`
- Unique: `[countryId, version]`
- Relations: `entries[]`

**CoaTemplateEntry** (`coa_template_entries` table)
- `id`, `templateId` → CoaTemplate, `code`, `name`, `type` (asset/liability/income/expense/equity)
- `parentCode?`, `description?`
- Unique: `[templateId, code]`

### COA Template Service (`services/coa-template.service.ts`)

- `listTemplates(countryId?)` — list all templates
- `getTemplate(id)` — template with entries
- `createTemplate(data)` — create template with optional entries
- `addEntry(templateId, data)` / `removeEntry(id)` — manage entries
- `applyTemplate(templateId, companyId)` — bulk-create LedgerAccount records from template

### API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /platform/coa/templates | Authenticated | List templates |
| GET | /platform/coa/templates/:id | Authenticated | Get template with entries |
| POST | /platform/coa/templates | Super Admin | Create template |
| POST | /platform/coa/templates/:id/entries | Super Admin | Add entry |
| DELETE | /platform/coa/entries/:id | Super Admin | Remove entry |
| DELETE | /platform/coa/templates/:id | Super Admin | Deactivate template |
| POST | /platform/coa/apply/:companyId | Super Admin | Apply template to company |

### Seeded Templates

| Country | Standard | Accounts |
|---------|----------|---------|
| India | Indian GAAP (Schedule III) | 30 accounts (GST, TDS, PF/ESI, etc.) |
| US | US GAAP | 22 accounts (FICA, Sales Tax, etc.) |
| UK | UK GAAP (FRS 102) | 21 accounts (VAT, PAYE, NIC) |
| UAE | UAE IFRS | 18 accounts (VAT, Social Security) |
| Singapore | Singapore SFRS | 19 accounts (GST, CPF) |

## Usage Enforcement Middleware

File: `middleware/enforcePlanLimit.ts`

### Functions

- `checkLimit(companyId, 'maxUsers')` — checks active employee count vs `plan.maxUsers`
- `checkLimit(companyId, 'maxStorageGb')` — checks total document fileSize vs `plan.maxStorageGb`
- `enforcePlanLimit(type)` — Express middleware factory (returns 403 if limit exceeded)
- `requireModule(moduleName)` — Express middleware that checks if module is in `plan.enabledModules`

### Where Applied

| Middleware | Routes |
|------------|--------|
| `enforcePlanLimit('maxUsers')` | POST `/employees/` (create employee) |
| `enforcePlanLimit('maxStorageGb')` | POST `/documents/generate`, `/documents/:id/sign`, `/documents/upload` |
| `requireModule('payroll')` | All `/api/payroll/*` routes |
| `requireModule('crm')` | All `/api/clients/*` and `/api/leads/*` routes |
| `requireModule('accounting')` | All `/api/accounting/*` routes |
| `requireModule('projects')` | All `/api/projects/*` routes |

## Localization

### Backend Service (`services/locale.service.ts`)

Locale-aware formatting using Node.js `Intl`:
- `getLocaleConfig(locale)` — full config
- `formatDate(date, locale)` / `formatCurrency(amount, locale)` / `formatNumber(amount, locale)`
- `SUPPORTED_LOCALES` — `['en-IN', 'en-US', 'en-GB', 'en-AE', 'en-SG', 'hi-IN']`
- `TIMEZONES` — common timezone list

### Frontend Service (`lib/locale.ts`)

React-friendly hooks using `date-fns`:
- `initLocale()` / `setLocale(code)` / `getLocale()`
- `formatDate(date)` / `formatDateTime(date)` / `formatCurrency(amount)` / `formatNumber(amount)`
- Caches locale config; API calls via `fetchLocales()` / `fetchLocaleConfig(code)`

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | /platform/locales | List supported locales |
| GET | /platform/locale/:code | Get full locale config |
| GET | /platform/timezones | List timezone strings |

### Supported Locales

| Code | Label | Date Format | Currency |
|------|-------|-------------|----------|
| en-IN | English (India) | dd/MM/yyyy | ₹ INR |
| en-US | English (US) | MM/dd/yyyy | $ USD |
| en-GB | English (UK) | dd/MM/yyyy | £ GBP |
| en-AE | English (UAE) | dd/MM/yyyy | د.إ AED |
| en-SG | English (Singapore) | dd/MM/yyyy | S$ SGD |
| hi-IN | हिन्दी (India) | dd/MM/yyyy | ₹ INR |
