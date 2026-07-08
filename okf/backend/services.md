---
type: Documentation
title: Shared Services
description: Complete catalog of 30 backend services
tags: [services, architecture, backend]
timestamp: 2026-07-08T20:00:00Z
---

# Backend Services — 30 Services

## Accounting & Finance

### `accounting.service.ts`
- **Exports:** `seedAccounts`, `createJournalEntry`, `getTrialBalance`, `ensureAccount`, `getGeneralLedger`, `getGstSummary`, `postInvoiceToLedger`
- **Purpose:** Core double-entry accounting engine. Manages Chart of Accounts (with Indian/GST defaults), creates balanced journal entries, posts to ledger, generates trial balance, general ledger, and GST summary reports. Handles ledger lock dates to prevent edits in closed periods. Supports Prisma transactions for atomicity.

### `payroll-accounting.service.ts`
- **Exports:** `PayrollAccountingService.postPayrollToAccounting`
- **Purpose:** Bridges payroll and accounting. Creates journal entries from processed payrolls, mapping salary components and statutory deductions (PF/ESI/PT/TDS) to respective ledger accounts. Prevents duplicate postings.

### `invoice.service.ts`
- **Exports:** `InvoiceService.createInvoice`, `deleteInvoice`, `processRecurringInvoices`
- **Purpose:** Invoice and quotation creation engine. Handles item-level taxation (multiple tax rates), discounts, currency conversion, auto-numbering (`INV-{year}-{seq}` / `QTN-{year}-{seq}`), recurring invoices, and auto-posting to accounting ledger.

### `payment.service.ts`
- **Exports:** `PaymentService` singleton — `createPaymentLink`, `createOrder`, `verifyPaymentSignature`, `createCashfreeOrder`, `verifyCashfreeSignature`, `createPaypalOrder`, `capturePaypalOrder`, `getPaymentDetails`
- **Purpose:** Unified multi-gateway payment processing: Razorpay (links, orders, signature verification), Cashfree (orders, webhook verification), PayPal (orders, capture).

### `currency.service.ts`
- **Exports:** `CurrencyService.getRate`, `convert`, `syncRatesFromApi`
- **Purpose:** Multi-currency exchange rate management. Fetches rates from `open.er-api.com`, caches in DB, converts amounts. Falls back to cached rates if API unavailable.

### `coa-template.service.ts`
- **Exports:** `CoaTemplateService.listTemplates`, `getTemplate`, `createTemplate`, `addEntry`, `removeEntry`, `deactivateTemplate`, `applyTemplate`
- **Purpose:** Chart of Accounts template management. Creates country-specific COA templates with versioning. `applyTemplate` bulk-creates ledger accounts for a company, skipping existing ones by code.

## Payroll & Compliance

### `payroll.service.ts`
- **Exports:** `PayrollService.calculateStructureFromTemplate`, `getStatutoryConfig`, `saveStatutoryConfig`, `calculateStatutoryDeductions`, `calculateProfessionalTax`, `computeAttendanceStats`, `calculateAttendanceMetrics`, `calculateTDS`, `bulkAssignTemplate`
- **Purpose:** Core payroll computation engine. Calculates salary structures (flat/percentage/formula components), statutory deductions (PF/ESI/PT/TDS) with slab-based rules, attendance-linked pro-rata, Indian income tax (new/old regime, FY 2025-26 slabs, 87A rebate, 4% cess).

### `compliance.service.ts`
- **Exports:** `ComplianceService.generateEPFO_ECR`, `generateESIC_Return`
- **Purpose:** Indian statutory compliance file generation. EPFO ECR text files with UAN-member data, ESIC monthly return files with IP numbers and wage details.

### `statutory-rule.service.ts`
- **Exports:** `StatutoryRuleService.getActiveRules`, `getCountryForCompany`, `evaluateRule`, `calculateAllDeductions`
- **Purpose:** Multi-country statutory deduction rule engine. Fetches active rules by country/company with date-effective ranges. Evaluates PF/ESI/PT/tax rules against wage bases with slab-based calculations. Supports company-specific rule overrides.

## HRMS

### `attendance-security.service.ts`
- **Exports:** `AttendanceSecurityService.getDistanceInMeters`, `checkImpossibleTravel`
- **Purpose:** Geo-location security for attendance check-ins. Uses Haversine formula to detect "impossible travel" (e.g., check-in from 1000km away within minutes). Prevents attendance fraud.

### `leave-accrual.service.ts`
- **Exports:** `LeaveAccrualService.processMonthlyAccruals`, `processProbationConfirmations`
- **Purpose:** Automated leave accrual. Runs monthly to credit leave balances based on leave type config (accrual rate, max accrual, department/position filters). Handles probation confirmation processing.

### `roster-validator.service.ts`
- **Exports:** `RosterValidatorService.getShiftDateRange`, `validateAssignments`
- **Purpose:** Shift roster compliance validation. Validates batch assignments for night-shift crossing, rest period violations, company off-day compliance, and overlapping shifts.

### `performance.service.ts`
- **Exports:** `PerformanceService.updateOKRProgress`, `calculateFnF`
- **Purpose:** Employee performance and separation management. Tracks OKR progress by aggregating key results. Calculates Full & Final settlement (gratuity, leave encashment, notice period recovery).

### `recruitment.service.ts`
- **Exports:** `RecruitmentService.parseResume`, `getMatchScore`, `generatePublicId`
- **Purpose:** AI-assisted recruitment. Mock resume parsing (extracts skills/experience/education), smart matching (scores candidates against job requirements by skill overlap), public URL generation.

## Document Generation

### `pdf.service.ts`
- **Exports:** `PDFService` — generates quotation/invoice PDFs, handles letterhead overlays, PDF manipulation
- **Purpose:** PDF generation using Gotenberg (Chromium-based HTML→PDF) + `pdf-lib` for programmatic manipulation (letterhead overlay, merging). Handles company branding (logo, signature, bank details).

### `document.engine.ts`
- **Exports:** `DocumentEngine.generatePDF`, `generateContractPDF`
- **Purpose:** DOCX-to-PDF generation using `docxtemplater` for template population and Gotenberg (LibreOffice) for PDF conversion. Supports two letterhead modes.

### `document.service.ts`
- **Exports:** `DocumentGenerationService.generateDocx`, `convertToPdf`, `applyLetterhead`, `generateDocument`, `generateLetterheadPdf`, `generateInvoicePdf`, `mergePdfs`
- **Purpose:** Multi-stage document generation pipeline: Stage 1 — populate DOCX templates (handlebars-style), Stage 2 — convert to PDF via Gotenberg, Stage 3 — overlay letterhead (none/first-page/every-page).

## Communication

### `email.service.ts`
- **Exports:** `resolveEmailConfig`, `sendEmailDirect`, `sendEmail`, `processSingleQueuedEmail`, `sendQuotationReminder`, `sendInvoiceEmail`, `notifyTaskAssigned`, `notifyTaskUpdated`, `notifyNewTask`, `notifyMention`, `notifyTaskReminder`
- **Purpose:** Multi-provider email delivery. Supports Microsoft Graph, Google OAuth, AWS SES, SendGrid, Mailgun, and generic SMTP. Uses database-backed outbox queue with BullMQ (inline fallback). Performs OAuth token refresh, resolves per-company/department email configurations.

### `notification.service.ts`
- **Exports:** `NotificationService.createNotification`, `emitProjectUpdate`, `emitCompanyUpdate`, `handleMentions`
- **Purpose:** Real-time notification system using Socket.io. Creates database notifications and emits to user-specific/project/company rooms. Handles `@mention` detection in HTML content for triggering automation rules.

## Contracts

### `contract.service.ts`
- **Exports:** `ContractService.createContract`, `getContracts`, `logActivity`
- **Purpose:** Contract lifecycle management. Creates contracts linked to clients/projects with status tracking, currency detection, activity logging, and PDF generation.

### `contract-template.service.ts`
- **Exports:** `ContractTemplateService.createTemplate`, `getTemplates`, `getTemplateById`, `updateTemplate`, `deleteTemplate`
- **Purpose:** CRUD for reusable contract document templates (HTML content with variables).

## Infrastructure

### `storage.service.ts`
- **Exports:** `StorageService.extractKey`, `uploadFile`, `deleteFile`, `getFileBuffer`, `getFileStream`, `getFileUrl`
- **Purpose:** S3-compatible file storage. Supports per-tenant S3 configurations (different buckets/credentials per company) with global env var fallback. Multipart parallel upload. All files stored with company-prefixed keys.

### `permission.service.ts`
- **Exports:** `PermissionService.hasBasicPermission`, `getPermissionScope`, `getScopedWhereClause`, `checkProjectAccess`, `isProjectManager`
- **Purpose:** RBAC engine. Checks user permissions per module/action (create/read/update/delete) with scope levels (all/owned/added/none). Generates Prisma-compatible WHERE clauses for data scoping. Supports project-level membership checks, client portal access, and super admin bypass.

### `audit.service.ts`
- **Exports:** `logAction`
- **Purpose:** Lightweight audit logging. Records user actions with module, entity type/ID, IP address, user agent, and change details. Silently fails so main request is never disrupted.

### `cron-lock.service.ts`
- **Exports:** `CronLockService.withCronLock`
- **Purpose:** Distributed cron job lock using PostgreSQL advisory locks (`pg_try_advisory_xact_lock`). Prevents duplicate execution of scheduled tasks across multiple server replicas. 60-second transaction timeout.

### `queue.service.ts`
- **Exports:** `QueueService.getQueue`, `enqueueOrExecute`
- **Purpose:** Background job queue using BullMQ with Redis. Provides `enqueueOrExecute` pattern: enqueues via BullMQ if Redis available, runs synchronously as fallback.

### `scheduler.service.ts`
- **Exports:** `SchedulerService.init`
- **Purpose:** Cron-based scheduled task orchestrator. Six recurring jobs: hourly quotation reminders, monthly leave accrual (1st of month), daily probation checks, daily recurring invoice generation, daily task reminders (09:30 AM), daily CRM lead alerts + quotation expiration (00:05 AM). All jobs use `CronLockService` for distributed safety.

### `locale.service.ts`
- **Exports:** `LOCALE_MAP`, locale configs for `en-IN`, `en-US`, `en-GB`, `en-AE`, `en-SG`, etc.
- **Purpose:** Locale/i18n configuration. Provides locale-specific formatting: date/time formats, number separators, currency symbols/format, first day of week, timezone.

## Automation & History

### `automation.service.ts`
- **Exports:** `AutomationService.evaluateRules`, `checkCondition`, `executeAction`
- **Purpose:** Workflow automation engine. Evaluates project-level automation rules triggered by `TASK_STATUS_CHANGE`, `TASK_CREATED`, `TASK_ASSIGNED`, `COMMENT_ADDED`, `MENTION_FOUND`, `TASK_REMINDER`. Executes actions like sending emails or creating notifications. Supports conditional logic and variable interpolation.

### `history.service.ts`
- **Exports:** `HistoryService.recordTaskChanges`
- **Purpose:** Tracks task field-level changes (status, priority, assignee, description) with actor identification (user or client). Creates structured TaskHistory entries.
