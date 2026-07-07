---
type: Module
title: Frontend Architecture
description: Next.js 14 App Router, React, Tailwind SPA
tags: [frontend, nextjs, react, tailwind]
timestamp: 2026-06-29T23:00:00Z
---

# Frontend Architecture

Next.js 14 with App Router, React 18, TypeScript, Tailwind CSS.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + custom component library
- **State**: React hooks + context
- **API client**: Axios wrapper with interceptors
- **Charts**: Chart.js / Recharts (dashboard)

## Directory Structure
```
app/(main)/           # Authenticated routes
├── payroll/
│   ├── payslips/     # Payroll list (admin)
│   ├── my-payslips/  # Employee view
│   ├── tax-review/   # TDS declaration review
│   └── run/          # Payroll processing
├── hrms/
│   ├── admin/        # Attendance dashboard
│   ├── roster/       # Shift roster
│   ├── leaves/       # Leave management
│   └── exit/         # Exit/FnF management
├── accounting/
│   ├── journal/      # Journal entries
│   └── ledger/       # Ledger accounts
├── crm/
│   ├── clients/
│   ├── quotations/
│   ├── invoices/
│   └── contracts/
├── projects/
├── helpdesk/
└── recruitment/
lib/                  # Shared utilities
├── api/              # API client modules
├── hooks/            # Custom React hooks
└── context/          # React contexts
```

## Key Conventions
- Pages use `'use client'` directive for interactivity
- API calls go through `lib/api/*.ts` modules, not direct fetch
- Toast notifications via `useToast` hook
- Currency formatting via `CurrencyContext`
- UI components in `components/ui/`
- Loading states use `LoadingSpinner` component
- Tables use `ent-table`, `ent-card`, `ent-badge` CSS classes (custom design system)
