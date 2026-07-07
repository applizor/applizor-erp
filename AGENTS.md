---
type: Configuration
title: AGENTS.md — AI Context Loader
description: Instructions for AI agents on how to load and use this project's OKF knowledge bundle
tags: [agents, okf, context, configuration]
timestamp: 2026-06-29T23:00:00Z
---

# Applizor ERP — AI Agent Instructions

This project uses the **Open Knowledge Format (OKF)** bundle in `okf/` to provide structured, token-efficient context to AI agents.

## Before ANY code generation or analysis, load the OKF bundle

Read the following files in order to understand this project:

1. `okf/index.md` — Project overview and bundle structure
2. `okf/backend/index.md` — Backend architecture
3. `okf/backend/schema.md` — Database model
4. `okf/backend/routes.md` — Complete API route map
5. `okf/backend/auth.md` — Auth and permissions
6. `okf/backend/payroll.md` — Payroll engine
7. `okf/backend/accounting.md` — Accounting service
8. `okf/backend/compliance.md` — Compliance exports
9. `okf/backend/services.md` — Shared services
10. `okf/frontend/index.md` — Frontend architecture
11. `okf/frontend/pages.md` — Page structure
12. `okf/frontend/api.md` — API client patterns
13. `okf/hrms/index.md` — HRMS module
14. `okf/hrms/attendance.md` — Attendance management
15. `okf/hrms/leaves.md` — Leave management
16. `okf/hrms/employees.md` — Employee management
17. `okf/crm/index.md` — CRM module

## When loading context for a specific task

Instead of reading raw source files, reference the relevant OKF file(s):

| Task | Read This OKF File |
|------|-------------------|
| Fix payroll calculation | `okf/backend/payroll.md` |
| Add API endpoint | `okf/backend/routes.md` |
| Change DB model | `okf/backend/schema.md` |
| Fix attendance | `okf/hrms/attendance.md` |
| Change frontend page | `okf/frontend/pages.md` |
| Fix auth/permissions | `okf/backend/auth.md` |

Only read raw source files when the OKF summary is insufficient for the specific implementation detail needed.

## OKF Maintenance

When you make significant changes to the codebase, update the relevant OKF file(s) to keep them in sync. This ensures future AI interactions have accurate context.
