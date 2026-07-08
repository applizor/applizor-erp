---
type: Index
title: Applizor ERP — Knowledge Bundle
description: Complete OKF bundle — 119 DB models, 80+ controllers, 30 services, 150+ frontend pages, 96 components
tags: [erp, hrms, payroll, accounting, crm, lms, projects, recruitment]
timestamp: 2026-07-08T20:00:00Z
---

# Applizor ERP Knowledge Bundle

Full-stack multi-tenant ERP with HRMS, Payroll, Accounting, CRM, Projects, LMS, Recruitment, Helpdesk, and Operations modules.

## Architecture

| Layer | Stack | Details |
|-------|-------|---------|
| Backend | Express.js + Prisma + PostgreSQL | REST API on port 5000 — 119 models, 80+ controllers, 30 services |
| Frontend | Next.js 14 (App Router) | React SPA on port 3000 — 150+ pages, 96 components |
| PDF | Gotenberg + docxtemplater | Document generation on port 8000 |
| Auth | JWT + bcrypt + RBAC | Middleware-based with 45+ permission modules |
| Payments | Razorpay / Cashfree / PayPal | Multi-gateway unified interface |
| Queue | BullMQ (Redis) | Background jobs with inline fallback |
| Realtime | Socket.io | Notifications, project updates |

## Bundle Structure

```
okf/
├── index.md                    ← You are here
├── backend/
│   ├── index.md                ← Backend architecture (updated)
│   ├── schema.md               ← 119 Prisma models (updated)
│   ├── routes.md               ← 60+ route files (updated)
│   ├── auth.md                 ← JWT, RBAC, SSO (updated)
│   ├── payroll.md              ← Payroll engine
│   ├── accounting.md           ← Accounting service
│   ├── compliance.md           ← Compliance exports
│   └── services.md             ← 30 services (updated)
├── frontend/
│   ├── index.md                ← Frontend architecture (updated)
│   ├── pages.md                ← 150+ pages (updated)
│   └── api.md                  ← 22 API modules + components (updated)
├── hrms/
│   ├── index.md                ← HRMS module (updated)
│   ├── attendance.md           ← Attendance & roster (updated)
│   ├── leaves.md               ← Leave management (updated)
│   └── employees.md            ← Employee management (updated)
└── crm/
    └── index.md                ← CRM module (updated)
```

## Quick Reference

| Area | Key Info |
|------|----------|
| **DB** | PostgreSQL via Prisma ORM (119 models, 20 domains) |
| **Auth** | JWT tokens, role-based RBAC with 45+ permission modules, SSO (Google/SAML) |
| **Payroll** | Process → Approve → Post to accounting; TDS new/old regime; PF/ESI/PT |
| **Storage** | S3-compatible with per-tenant config or local filesystem |
| **Email** | Multi-provider (SMTP/Graph/SES/SendGrid/Mailgun) with DB outbox queue |
| **Payments** | Razorpay / Cashfree / PayPal integration |
| **SaaS** | Multi-tenant with subscription plans, plan limits, tenant management |

## Business Domains

| Module | Models | Routes | Pages |
|--------|--------|--------|-------|
| **HRMS** | 17 | 50+ | 25+ |
| **Payroll** | 11 | 30+ | 15+ |
| **Accounting** | 7 | 15+ | 8 |
| **CRM** | 17 | 60+ | 20+ |
| **Projects** | 14 | 30+ | 16 |
| **Recruitment** | 8 | 30+ | 6 |
| **LMS** | 10 | 20+ | 5 |
| **Settings** | 8 | 25+ | 15+ |
| **Platform** | 5 | 25+ | 5 |
