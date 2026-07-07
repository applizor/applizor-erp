---
type: Index
title: Applizor ERP — Knowledge Bundle
description: Complete OKF bundle for the Applizor Softech ERP project
tags: [erp, hrms, payroll, accounting, crm]
timestamp: 2026-06-29T23:00:00Z
---

# Applizor ERP Knowledge Bundle

This bundle documents the [Applizor Softech ERP](/) — a full-stack ERP with HRMS, Payroll, Accounting, CRM, Projects, and Operations modules.

## Architecture

| Layer | Stack | Details |
|-------|-------|---------|
| Backend | Express.js + Prisma + PostgreSQL | REST API on port 5000 |
| Frontend | Next.js 14 (App Router) | React SPA on port 3000 |
| PDF | Gotenberg | Document generation service on port 8000 |
| Auth | JWT + bcrypt | Middleware-based auth with permission system |

## Bundle Structure

```
okf/
├── index.md                    ← You are here
├── backend/
│   ├── index.md                ← Backend architecture overview
│   ├── schema.md               ← Prisma data model
│   ├── routes.md               ← All API routes
│   ├── auth.md                 ← Auth middleware & permissions
│   ├── payroll.md              ← Payroll processing engine
│   ├── accounting.md           ← Accounting service
│   ├── compliance.md           ← Compliance exports (EPFO/ESIC)
│   └── services.md             ← Shared services (email, storage, PDF)
├── frontend/
│   ├── index.md                ← Frontend architecture
│   ├── pages.md                ← Page routing structure
│   ├── components.md           ← UI component library
│   └── api.md                  ← API client patterns
├── hrms/
│   ├── index.md                ← HRMS module overview
│   ├── attendance.md           ← Attendance & shift roster
│   ├── leaves.md               ← Leave management
│   └── employees.md            ← Employee management
└── crm/
    ├── index.md                ← CRM module overview
    ├── clients.md              ← Client management
    ├── quotations.md           ← Quotations
    ├── invoices.md             ← Invoicing
    └── contracts.md            ← Contracts
```

## Quick Reference

- **DB**: PostgreSQL via Prisma ORM
- **Payroll**: Process → Approve → Post to accounting flow
- **Auth**: JWT tokens, role-based permissions via `PermissionService`
- **Storage**: Local filesystem (dev) or S3 (prod) via `StorageService`
- **Payments**: Razorpay / Cashfree / PayPal integration
