---
type: Module
title: Backend Architecture
description: Express.js + Prisma + PostgreSQL REST API — 80+ controllers, 60+ route files, 30 services, 119 models
tags: [backend, architecture, express, prisma]
timestamp: 2026-07-08T20:00:00Z
---

# Backend Architecture

Express.js REST API with Prisma ORM on PostgreSQL. Multi-tenant ERP backend.

## Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Prisma (119 models)
- **DB**: PostgreSQL 15
- **Auth**: JWT + bcryptjs
- **PDF**: Gotenberg (Chromium-based HTML→PDF) + docxtemplater
- **Email**: Nodemailer (SMTP, Microsoft Graph, Google OAuth, SES, SendGrid, Mailgun)
- **Payments**: Razorpay, Cashfree, PayPal
- **Queue**: BullMQ (Redis) with inline fallback
- **Storage**: S3-compatible (per-tenant config) + local filesystem
- **Realtime**: Socket.io (notifications, project updates)
- **Validation**: Zod

## Structure
```
src/
├── server.ts              # Entry point (app.use mounts for all route modules)
├── routes/                # 60+ route definition files
├── controllers/           # 80+ request handler files
├── services/              # 30 business logic service files
├── middleware/            # auth, client.auth, validate, upload, rateLimiter, errorHandler, superadmin, enforcePlanLimit
├── prisma/
│   ├── schema.prisma      # 119 models
│   └── client.ts          # Prisma client singleton
├── config/                # Environment config
├── types/                 # TypeScript type definitions
├── utils/                 # Helpers (jwt, upload)
└── scripts/               # Utility scripts
```

## Key Patterns
- Controllers handle HTTP req/res, delegate logic to Services
- Services contain business logic, use Prisma directly
- Auth middleware attaches `req.userId`, `req.user` with permissions
- All routes protected by `authenticate` middleware by default
- Permission checking via `PermissionService.hasBasicPermission(user, module, action)`
- Zod validation via `validate()` middleware

## Enterprise Infrastructure
- **Error Handling**: Global error handler middleware, `AppError` class for operational errors, `asyncHandler` wrapper
- **Validation**: Zod schema validation middleware for request bodies
- **Security**: Helmet.js headers, CORS with strict origin whitelist, rate limiting (100 req/15min API, 10 req/15min auth)
- **Environment**: Config module validates required env vars on startup
- **Graceful Shutdown**: SIGTERM/SIGINT handlers close HTTP server, disconnect Prisma, force-exit after 10s timeout
- **Health Check**: `GET /health` endpoint

## Module Map

| Domain | Controllers | Services | Routes |
|--------|------------|----------|--------|
| **Auth & Users** | auth, client.auth, sso, microsoft-auth | — | auth, sso |
| **Company & Tenants** | company, platform | — | company, platform |
| **Roles & Permissions** | role | permission | roles |
| **HRMS** | employee, department, position, branch, attendance, leave, leave-carry-forward, holiday, shift, shift-roster, timesheet, exit, onboarding | attendance-security, leave-accrual, roster-validator, performance | employee, department, position, branch, attendance-leave, shift, shift-roster, timesheet, exit, onboarding |
| **Payroll** | payroll, salary-component, salary-structure, tax-declaration | payroll, payroll-accounting, statutory-rule | payroll, salary-component, salary-structure, tax-declaration |
| **Accounting** | accounting, coa-template, reconciliation, currency | accounting, coa-template | accounting, reconciliation |
| **CRM** | client, clientCategory, lead, kanban, crm/lead, crm/sales | — | client, clientCategory, lead |
| **Sales** | sales, quotation, quotation-template, quotation-public, invoice, invoice-public | invoice | quotation, quotation-template, invoice, sales |
| **Contracts** | contract, contract-template | contract, contract-template | contract, contract-template |
| **Projects** | project, task, portal.task | automation, history | project, task |
| **Recruitment** | candidate, job-opening, interview, offer | recruitment | recruitment |
| **LMS** | student, course, enrollment, class, lecture, exam | — | lms/students, lms/courses, lms/enrollments, lms/classes, lms/lectures, lms/exams |
| **Support** | ticket | — | ticket |
| **Documents** | document, document-template, employee-document, certificate | document-engine, document, pdf | document, document-template, employee-document, certificate |
| **Communication** | email, email-template, notification | email, notification | email, notification |
| **Assets** | asset | — | asset |
| **Expenses** | expense | — | expense |
| **Performance** | performance | performance | performance |
| **Settings** | settings | locale | settings |
| **Platform** | platform, subscription, subscription-plan, service, currency, coa-template | currency, coa-template, queue, cron-lock, scheduler | platform, subscription, subscription-plan, service, currency |
| **Other** | audit, automation, bulk-import, search, upload, portal, policy | audit, scheduler, storage, queue, cron-lock | audit, automation, bulk-import, search, upload, portal, policy |

## Middleware
| Middleware | File | Purpose |
|-----------|------|---------|
| `authenticate` | auth.ts | JWT verification, attaches `req.user` |
| `authenticateClient` | client.auth.ts | Client portal JWT verification |
| `validate(schema)` | validate.ts | Zod body validation |
| `checkPermission(module, action)` | auth.ts | Role/permission check |
| `requireModule(moduleName)` | auth.ts | Module access gate |
| `requireSuperAdmin` | superadmin.ts | Super admin only |
| `enforcePlanLimit(limit)` | enforcePlanLimit.ts | SaaS plan limit enforcement |
| `errorHandler` | errorHandler.ts | Global error handler |
| `rateLimiter` | rateLimiter.ts | Rate limiting |
| `upload` | upload.ts | Multer file upload config |

## API Base Paths (all mounted routes)
```
/api/auth, /api/roles, /api/branches, /api/audit-logs, /api/portal,
/api/company, /api/invoices, /api/clients, /api/client-categories,
/api/leads, /api/payments, /api/quotations, /api/quotation-templates,
/api/departments, /api/positions, /api/employees, /api/recruitment,
/api/performance, /api/attendance-leave, /api/shift-rosters, /api/shifts,
/api/tickets, /api/assets, /api/documents, /api/document-templates,
/api/payroll, /api/tax-declarations, /api/sales, /api/accounting,
/api/automation, /api/upload, /api/policies, /api/employee-documents,
/api/contracts, /api/contract-templates, /api/projects, /api/tasks,
/api/timesheets, /api/expenses, /api/exit, /api/onboarding,
/api/settings, /api/notifications, /api/search, /api/emails,
/api/subscription-plans, /api/subscriptions, /api/services,
/api/certificates, /api/lms/students, /api/lms/courses,
/api/lms/enrollments, /api/lms/classes, /api/lms/lectures,
/api/lms/exams, /api/platform/coa, /api/platform,
/api/currencies, /api/bulk-import, /health
```
