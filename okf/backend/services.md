---
type: Documentation
title: Shared Services
description: Email, storage, PDF, and scheduler services
tags: [services, email, storage, pdf, scheduler]
timestamp: 2026-06-29T23:00:00Z
---

# Shared Services

## Storage Service (`services/storage.service.ts`)
- `STORAGE_TYPE` env: `local` (default) or `s3`
- `uploadFile(buffer, fileName, mimeType)` → file path
- `getFileUrl(filePath)` → full URL
- `getFileBuffer(filePath)` → Buffer
- Local files stored in `uploads/` directory
- S3 via AWS SDK with configurable region/endpoint

## Email Service (`services/email.service.ts`)
- SMTP (Gmail) or Microsoft Graph API
- Config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (also configurable per-company via `/api/settings/email`)
- Microsoft: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REFRESH_TOKEN`
- Functions: `sendEmail(to, subject, content, attachments?, fromOverride?, cc?, bcc?, isHtml?)`

## PDF Service (`services/pdf.service.ts`)
- Uses Gotenberg (Chromium-based HTML→PDF conversion)
- `generateQuotationPDF`, `generateInvoicePDF`, `generateContractPDF`
- `generatePayslip` — Computes YTD totals, extracts UAN/PF/ESI from employee skills
- `generateGenericPDF` — Template-based PDF with variable substitution
- Supports letterhead overlay via pdf-lib

## Audit Logging (`services/audit.service.ts`)
- `logAction(userId, companyId, action, resource, resourceId, details)`
- Tracks all significant operations with timestamp and user context
- Viewable via `/api/audit-logs`

## Scheduler (`services/scheduler.service.ts`)
- Daily checks for: quotation expiry reminders, contract renewals, leave accrual, probation confirmations
- Uses `node-cron`
