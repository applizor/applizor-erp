---
type: Module
title: Accounting Service
description: Double-entry accounting, journal entries, ledger accounts, reconciliation
tags: [accounting, journal, ledger, reconciliation, aging]
timestamp: 2026-06-29T23:00:00Z
---

# Accounting Service

## Core Functions (`services/accounting.service.ts`)

### `ensureAccount(companyId, code, name, type)`
Creates ledger account if it doesn't exist, returns existing. Used for dynamic account creation.

### `createJournalEntry(companyId, date, description, reference, lines, autoPost, userId)`
Creates multi-line journal entry. Lines are `{ accountId, debit, credit }`. If `autoPost=true`, status is set to 'posted'.

### `getTrialBalance(companyId, fromDate, toDate)`
Returns account-wise debit/credit totals.

### Reports
- **Profit & Loss**: Categorized revenue, COGS, expenses with date range filtering + PDF export
- **Balance Sheet**: Assets, liabilities, equity with running balances + PDF export
- **GST Summary**: B2B/B2C split with tax rate breakdown + PDF export

## Reconciliation (`controllers/reconciliation.controller.ts`)
- **getReconciliationReport**: Account balance + unreconciled entries as of a date
- **markReconciled**: Batch mark journal lines as reconciled
- **getAgingReport**: AR/AP aging buckets (0-30, 31-60, 61-90, 90+ days)
- Note: Bank statement import not yet available (planned)

## Payroll Integration (`services/payroll-accounting.service.ts`)
- `postPayrollToAccounting(companyId, month, year)` — Batch posts all payrolls for a period
- **Duplicate guard**: Checks for existing `PAYROLL-YYYY-MM` journal entry before posting
- Creates per-employee journal entries with dynamic account mappings from StatutoryConfig
- Tracks ESI as separate liability with `esiPayableAccountId` in StatutoryConfig
- Batches all processed payrolls into single journal entry (debit salary expense, credit net/PF/ESI/PT/TDS)

## Account Types
- `asset`, `liability`, `expense`, `income`, `equity`
- Hierarchical via `parentId` (self-referential)
