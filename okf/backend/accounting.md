---
type: Module
title: Accounting Service
description: Double-entry accounting, journal, ledger, reports, reconciliation, COA templates
tags: [accounting, journal, ledger, reconciliation, coa]
timestamp: 2026-08-05T00:30:00Z
---

# Accounting Service

## Core Functions (`accounting.service.ts`)

| Function | Description |
|----------|-------------|
| `ensureAccount(companyId, code, name, type)` | Creates ledger account if not exists; returns existing |
| `updateAccount(companyId, id, data, userId)` | Update code/name/type/active; blocks type change if journal lines exist |
| `deleteAccount(companyId, id, userId)` | Delete with dependency guards (journal lines, salary links, non-zero balance) |
| `createJournalEntry(companyId, date, description, reference, lines, autoPost, userId)` | Multi-line journal entry; if `autoPost=true`, status=`posted` |
| `updateJournalEntry(id, companyId, data, userId)` | Edit entry; reverts then re-applies balances; blocks system-linked + reconciled |
| `deleteJournalEntry(id, userId, companyId)` | Delete with balance revert; blocks system-linked refs (INV-/PAY-/PAYROLL-) and reconciled lines |
| `getTrialBalance(companyId, fromDate, toDate)` | Account-wise debit/credit totals |
| `getGeneralLedger(accountId, startDate, endDate)` | Returns `{ account, lines }` with opening balance |
| `getGstSummary(startDate, endDate)` | GST summary with rate breakdown |
| `getAgingReportData(companyId, type)` | AR/AP aging buckets |
| `generateReportPDF(type, dates)` | PDF for TB / P&L / BS / GST |
| `generateReportCSV(type, dates)` | CSV/Excel-friendly export for TB / P&L / BS / GST / COA / Journal / Aging |
| `postInvoiceToLedger(invoiceId)` | Post invoice to accounts receivable |
| `seedAccounts(companyId)` | Create default COA for new company |

## Reports
| Report | Description |
|--------|-------------|
| **Trial Balance** | Account-wise totals with date range + PDF/CSV export |
| **General Ledger** | Per-account detail with running balance + CSV export |
| **Profit & Loss** | Revenue, COGS, expenses categorized + PDF/CSV export |
| **Balance Sheet** | Assets, liabilities, equity + PDF/CSV export |
| **GST Summary** | B2B/B2C split, tax rate breakdown + PDF/CSV export |
| **Aging Report** | AR/AP aging (0-30, 31-60, 61-90, 90+ days) + CSV export |
| **Chart of Accounts / Journal** | CSV export from list pages |

## Chart of Accounts
- 5 account types: `asset`, `liability`, `expense`, `income`, `equity`
- Hierarchical via `parentId` (self-referential on LedgerAccount)
- Unique code per company
- Edit via `PUT /accounts/:id`; Delete blocked when account has journal lines / salary component links / non-zero balance
- COA Templates (`CoaTemplate`): Country-specific templates with versioning
- `applyTemplate`: Bulk-create accounts for a company, skip existing by code

## Journal Entries
- Multi-line with debit/credit balancing enforced
- Status: `draft` or `posted`
- Reference field for linking to source documents (payroll, invoices)
- Lock date: prevents edits in closed accounting periods
- Edit via `PUT /journal/:id` (manual entries only)
- Delete/edit blocked for system-linked references (`INV-`, `PAY-`, `PAYROLL-`, etc.) and reconciled lines
- Auto-posting option for integrated transactions
- After manual mutations, UI calls `POST /reconcile` to keep balances in sync

## Reconciliation
- Get report: account balance + unreconciled entries as of a date
- Mark reconciled: batch mark journal lines
- Aging report: AR/AP by age buckets
- `POST /reconcile`: reset balances from posted journal lines + backfill missing invoice postings

## Payroll Integration (`payroll-accounting.service.ts`)
- Posts all processed payrolls for a period
- Creates per-employee journal entries with dynamic account mappings
- Duplicate guard: checks for existing `PAYROLL-YYYY-MM` entry
- Debit salary expense, credit net/PF/ESI/PT/TDS payable accounts

## Invoice Integration
- Auto-posts invoices to accounts receivable on creation
- Record payment against invoice updates ledger
- Supports credit notes and debit notes

## Platform Accounting vs Tenant Accounting

| Layer | Scope | UI | Who |
|-------|-------|----|-----|
| **Tenant accounting** | Each company's `LedgerAccount` / `JournalEntry` filtered by `companyId` | `/accounting/*` | Tenant Admin (plan module `accounting`) |
| **Platform accounting** | Dedicated Company with `isPlatform=true` ("Applizor Platform") | `/superadmin/accounting` | Super Admin / Platform Admin only |
| **COA Templates** | Country templates applied *to tenants* | `/superadmin/coa` | Super Admin — **not** live platform books |

### Rules
- Tenant users never see platform journals (tenant isolation + platform company has no tenant users).
- Super Admin's own company (e.g. Applizor Softech LLP) may still have **tenant-style** accounting under `/accounting/*` for operating that company — that is **not** SaaS subscription revenue.
- When a tenant pays a SaaS plan (`POST /platform/subscribe/verify` or webhook), revenue posts to **platform** books only: Dr Bank / Cr SaaS Subscription Revenue, reference `SUB-{orderId}`. Never into the paying tenant's COA.
- Service: `platform-accounting.service.ts` — uses `runWithoutCompanyContext` so ALS tenant injection cannot rewrite platform `companyId`.
- API (Super Admin): `POST /platform/accounting/ensure`, `GET /platform/accounting/accounts|journal|profit-loss|payments`.

### Platform COA (seeded)
| Code | Name | Type |
|------|------|------|
| 1000 | Platform Bank / Settlement | asset |
| 1100 | Payment Gateway Clearing | asset |
| 3000 | Platform Capital | equity |
| 4000 | SaaS Subscription Revenue | income |
| 4100 | Other Platform Income | income |
| 5400 | Payment Gateway Fees | expense |
| 5200 | Platform Operating Expense | expense |

## Account Types Reference
| Code | Name | Type |
|------|------|------|
| 1000-1999 | Assets | asset |
| 2000-2999 | Liabilities | liability |
| 3000-3999 | Equity | equity |
| 4000-4999 | Income | income |
| 5000-5999 | Expenses | expense |


## Platform Accounting (`platform-accounting.service.ts`)

Separated from tenant accounting:

| Concern | Tenant books | Platform books |
|---------|--------------|----------------|
| Company | Each customer `companyId` | Single `Company` with `isPlatform=true` |
| Revenue | Client invoices / ops | SaaS subscription payments |
| Posting | `postInvoiceToLedger` etc. | `postSubscriptionRevenueToPlatform` |
| UI | `/accounting/*` | `/superadmin/accounting` |

Platform COA (local codes): Bank/Settlement `1000`, Gateway Clearing `1100`, Capital `3000`, SaaS Subscription Revenue `4000`, Other Income `4100`, Gateway Fees `5400`, OpEx `5200`.
