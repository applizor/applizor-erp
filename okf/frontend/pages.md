---
type: Documentation
title: Page Structure
description: Key pages, their purpose, and data flow
tags: [pages, frontend, routing]
timestamp: 2026-06-29T23:00:00Z
---

# Page Structure

## Payroll Pages

### Payslips (`/payroll/payslips`)
- **File**: `app/(main)/payroll/payslips/page.tsx`
- **Data**: `payrollApi.getList(month, year)` → `Payroll[]`
- **Actions**: Approve (status→paid), Download PDF, Email
- **Status badges**: draft→default, processed→warning(yellow), paid→success(green)
- **Search**: Filters by name/employeeId

### My Payslips (`/payroll/my-payslips`)
- **File**: `app/(main)/payroll/my-payslips/page.tsx`
- **Data**: `payrollApi.getMine()` → `Payroll[]`
- **Card layout** with month, net pay, download button

### Tax Review (`/payroll/tax-review`)
- **File**: `app/(main)/payroll/tax-review/page.tsx`
- **Data**: `GET /payroll/declarations/pending`
- **Actions**: Approve/reject investment declarations
- **Features**: Search, view proof links, loading indicators per row

## HRMS Pages

### Attendance Admin (`/hrms/admin`)
- Leave overlay with half-day (HD) indicator
- Violet indicator for `onLeaveButPresent`
- Modal pre-filled from real attendance data

### Roster (`/hrms/roster`)
- Half-day (HD) display with durationType storage
- Color-coded legend

### Leave Approvals (`/hrms/leaves/approvals`)
- Detail modal on row click
- Full leave detail with rejection reason

## Accounting Pages

### Journal (`/accounting/journal`)
- Lists journal entries with filters
- Expandable lines view

## Exit Page (`/hrms/exit`)
- Employee search → select → show FnF calculation
- Fetches employee data + payroll data via API
