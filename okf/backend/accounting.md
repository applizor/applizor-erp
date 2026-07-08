---
type: Module
title: Accounting Service
description: Double-entry accounting, journal, ledger, reports, reconciliation, COA templates
tags: [accounting, journal, ledger, reconciliation, coa]
timestamp: 2026-07-08T20:00:00Z
---

# Accounting Service

## Core Functions (`accounting.service.ts`)

| Function | Description |
|----------|-------------|
| `ensureAccount(companyId, code, name, type)` | Creates ledger account if not exists; returns existing |
| `createJournalEntry(companyId, date, description, reference, lines, autoPost, userId)` | Multi-line journal entry; if `autoPost=true`, status=`posted` |
| `getTrialBalance(companyId, fromDate, toDate)` | Account-wise debit/credit totals |
| `getGeneralLedger(accountId, startDate, endDate)` | Full ledger with running balance |
| `getGstSummary(startDate, endDate)` | GST summary with rate breakdown |
| `postInvoiceToLedger(invoiceId)` | Post invoice to accounts receivable |
| `seedAccounts(companyId)` | Create default COA for new company |

## Reports
| Report | Description |
|--------|-------------|
| **Trial Balance** | Account-wise totals with date range |
| **General Ledger** | Per-account detail with running balance |
| **Profit & Loss** | Revenue, COGS, expenses categorized + PDF export |
| **Balance Sheet** | Assets, liabilities, equity + PDF export |
| **GST Summary** | B2B/B2C split, tax rate breakdown + PDF export |
| **Aging Report** | AR/AP aging (0-30, 31-60, 61-90, 90+ days) |

## Chart of Accounts
- 5 account types: `asset`, `liability`, `expense`, `income`, `equity`
- Hierarchical via `parentId` (self-referential on LedgerAccount)
- Unique code per company
- COA Templates (`CoaTemplate`): Country-specific templates with versioning
- `applyTemplate`: Bulk-create accounts for a company, skip existing by code

## Journal Entries
- Multi-line with debit/credit balancing enforced
- Status: `draft` or `posted`
- Reference field for linking to source documents (payroll, invoices)
- Lock date: prevents edits in closed accounting periods
- Auto-posting option for integrated transactions

## Reconciliation
- Get report: account balance + unreconciled entries as of a date
- Mark reconciled: batch mark journal lines
- Aging report: AR/AP by age buckets

## Payroll Integration (`payroll-accounting.service.ts`)
- Posts all processed payrolls for a period
- Creates per-employee journal entries with dynamic account mappings
- Duplicate guard: checks for existing `PAYROLL-YYYY-MM` entry
- Debit salary expense, credit net/PF/ESI/PT/TDS payable accounts

## Invoice Integration
- Auto-posts invoices to accounts receivable on creation
- Record payment against invoice updates ledger
- Supports credit notes and debit notes

## Account Types Reference
| Code | Name | Type |
|------|------|------|
| 1000-1999 | Assets | asset |
| 2000-2999 | Liabilities | liability |
| 3000-3999 | Equity | equity |
| 4000-4999 | Income | income |
| 5000-5999 | Expenses | expense |
