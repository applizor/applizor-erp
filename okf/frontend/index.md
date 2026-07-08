---
type: Module
title: Frontend Architecture
description: Next.js 14 App Router — 150+ pages, 96 components, 22 API modules
tags: [frontend, nextjs, react, tailwind]
timestamp: 2026-07-08T20:00:00Z
---

# Frontend Architecture

Next.js 14 with App Router, React 18, TypeScript, Tailwind CSS.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + custom design system (`ent-table`, `ent-card`, `ent-badge` classes)
- **State**: React hooks + context
- **API client**: Axios wrapper with interceptors
- **Editor**: Lexical (rich text with image support)
- **Charts**: Chart.js/Recharts (dashboard)
- **Drag & Drop**: react-beautiful-dash / @hello-pangea/dnd
- **Forms**: react-hook-form + zod validation
- **Signatures**: react-signature-canvas

## Directory Structure
```
app/
├── (main)/                   # Authenticated app routes (~130 pages)
│   ├── accounting/           # Chart of accounts, journal, reports
│   ├── attendance/           # Settings, config, holidays
│   ├── calendar/
│   ├── clients/              # CRUD + detail
│   ├── crm/                  # Contracts + templates
│   ├── dashboard/            # Main dashboard
│   ├── documents/            # Documents + templates
│   ├── emails/               # Email dispatch center
│   ├── helpdesk/             # Tickets
│   ├── hrms/                 # Full HRMS suite
│   ├── invoices/             # CRUD + detail
│   ├── leads/                # CRUD + kanban + list
│   ├── lms/                  # Courses, classes, enrollments, students
│   ├── my-documents/
│   ├── notifications/
│   ├── operations/           # Projects, timesheets
│   ├── payments/
│   ├── payroll/              # Full payroll suite
│   ├── profile/
│   ├── projects/             # Full project management suite
│   ├── quotations/           # CRUD + templates
│   ├── recruitment/          # Jobs, candidates, interviews
│   ├── sales/
│   ├── search/
│   ├── settings/             # Company, roles, users, email, storage, etc.
│   ├── superadmin/           # Dashboard, tenants, plans, COA, rules
│   └── tasks/
├── portal/                   # Client portal (login, dashboard, invoices, etc.)
├── public/                   # Public invoice/quotation by token
├── careers/                  # Public job listings
├── login/                    # Auth
├── register/                 # Registration
└── forgot-password/          # Password reset

components/
├── ui/                       # 30+ reusable UI components
├── invoices/                 # Invoice form, filters, skeletons
├── quotations/               # Product selector, analytics, filters
├── clients/                  # Client skeletons, filters, dialogs
├── leads/                    # Lead filters, skeletons
├── crm/                      # Kanban board, activity timeline, modals
├── projects/                 # Automation rules, sprints, members
├── tasks/                    # Task detail, filters, comments
├── portal/                   # Roadmap, task board, files, modals
├── hrms/                     # Bulk import, document preview, recruitment
├── recruitment/              # Candidate, interview, offer modals
├── settings/                 # Tax, unit configuration
├── skeletons/                # Dashboard, profile, kanban skeletons
└── dashboard/                # Student dashboard

hooks/                        # usePermission, useProjectPermissions, useCurrency, useToast, useConfirm
context/                      # ConfirmationContext, CurrencyContext, AlertContext
lib/
├── api/                      # 22 API client modules
├── auth.ts                   # Auth service + useAuth hook
├── locale.ts                 # i18n formatting
└── utils/                    # URL, clipboard utilities
```

## Key Conventions
- Pages use `'use client'` directive for interactivity
- API calls go through `lib/api/*.ts` modules
- Toast notifications via `useToast` hook
- Currency formatting via `CurrencyContext`
- Permission gating via `PermissionGuard` component or `usePermission` hook
- Project-level permissions via `useProjectPermissions` hook
- Loading states use `LoadingSpinner` / `Skeleton` components
- Confirmation dialogs via `useConfirm` (returns Promise)
- Rich text via `RichTextEditor` (Lexical-based, outputs HTML)
- Paged documents via `PagedRichTextEditor` (A4 view with page breaks)
