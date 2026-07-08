---
type: Documentation
title: Page Structure
description: Complete page inventory — 150+ pages across all modules
tags: [pages, frontend, routing]
timestamp: 2026-07-08T20:00:00Z
---

# Page Structure — Complete Map

## Auth & Public Pages
| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing/redirect |
| `/login` | `app/login/page.tsx` | Login |
| `/register` | `app/register/page.tsx` | Registration |
| `/forgot-password` | `app/forgot-password/page.tsx` | Password reset request |
| `/reset-password` | `app/reset-password/page.tsx` | Reset password |
| `/sso-callback` | `app/sso-callback/page.tsx` | SSO callback handler |
| `/careers/[companyId]` | `app/careers/[companyId]/page.tsx` | Public job listings |

## Dashboard & Core
| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `app/(main)/dashboard/page.tsx` | Main dashboard |
| `/calendar` | `app/(main)/calendar/page.tsx` | Calendar view |
| `/notifications` | `app/(main)/notifications/page.tsx` | Notification center |
| `/search` | `app/(main)/search/page.tsx` | Global search |
| `/profile` | `app/(main)/profile/page.tsx` | User profile |
| `/tasks` | `app/(main)/tasks/page.tsx` | Global task view |

## Payroll Suite
| Route | File | Description |
|-------|------|-------------|
| `/payroll` | layout | Payroll layout |
| `/payroll/payslips` | `app/(main)/payroll/payslips/page.tsx` | Payroll list (admin) |
| `/payroll/my-payslips` | `app/(main)/payroll/my-payslips/page.tsx` | Employee payslips |
| `/payroll/run` | `app/(main)/payroll/run/page.tsx` | Payroll processing |
| `/payroll/components` | `app/(main)/payroll/components/page.tsx` | Salary components |
| `/payroll/structure` | `app/(main)/payroll/structure/page.tsx` | Salary structures |
| `/payroll/structure/[employeeId]` | Detail | Per-employee structure |
| `/payroll/structure/bulk` | `app/(main)/payroll/structure/bulk/page.tsx` | Bulk assign templates |
| `/payroll/templates` | `app/(main)/payroll/templates/page.tsx` | Salary templates |
| `/payroll/templates/create` | `app/(main)/payroll/templates/create/page.tsx` | Create template |
| `/payroll/templates/[id]` | Detail | Template detail |
| `/payroll/config` | `app/(main)/payroll/config/page.tsx` | Payroll config |
| `/payroll/rules` | `app/(main)/payroll/rules/page.tsx` | Statutory rules |
| `/payroll/tax-declaration` | `app/(main)/payroll/tax-declaration/page.tsx` | Tax declarations |
| `/payroll/tax-review` | `app/(main)/payroll/tax-review/page.tsx` | Tax review (admin) |

## HRMS Suite
| Route | File | Description |
|-------|------|-------------|
| `/hrms` | layout | HRMS layout |
| `/hrms/employees` | `app/(main)/hrms/employees/page.tsx` | Employee list |
| `/hrms/employees/new` | `app/(main)/hrms/employees/new/page.tsx` | Create employee |
| `/hrms/employees/[id]` | `app/(main)/hrms/employees/[id]/page.tsx` | Employee detail |
| `/hrms/departments` | `app/(main)/hrms/departments/page.tsx` | Departments |
| `/hrms/positions` | `app/(main)/hrms/positions/page.tsx` | Positions |
| `/hrms/attendance` | `app/(main)/hrms/attendance/page.tsx` | Attendance view |
| `/hrms/attendance/register` | `app/(main)/hrms/attendance/register/page.tsx` | Attendance register |
| `/hrms/my-attendance` | `app/(main)/hrms/my-attendance/page.tsx` | My attendance |
| `/hrms/leaves` | `app/(main)/hrms/leaves/page.tsx` | Leave list |
| `/hrms/leaves/approvals` | `app/(main)/hrms/leaves/approvals/page.tsx` | Leave approvals |
| `/hrms/leaves/balances` | `app/(main)/hrms/leaves/balances/page.tsx` | Leave balances |
| `/hrms/leaves/types` | `app/(main)/hrms/leaves/types/page.tsx` | Leave types |
| `/hrms/holidays` | `app/(main)/hrms/holidays/page.tsx` | Holiday calendar |
| `/hrms/shifts` | `app/(main)/hrms/shifts/page.tsx` | Shift definitions |
| `/hrms/roster` | `app/(main)/hrms/roster/page.tsx` | Shift roster |
| `/hrms/timesheets` | `app/(main)/hrms/timesheets/page.tsx` | Timesheets |
| `/hrms/admin` | `app/(main)/hrms/admin/page.tsx` | Attendance admin |
| `/hrms/exit` | `app/(main)/hrms/exit/page.tsx` | Exit/FnF management |
| `/hrms/assets` | `app/(main)/hrms/assets/page.tsx` | Asset management |
| `/hrms/certificates` | `app/(main)/hrms/certificates/page.tsx` | Certificates list |
| `/hrms/certificates/new` | Create | New certificate |
| `/hrms/certificates/[id]` | Detail | Certificate detail |
| `/hrms/policies` | `app/(main)/hrms/policies/page.tsx` | Company policies |
| `/hrms/performance/okrs` | `app/(main)/hrms/performance/okrs/page.tsx` | OKRs |

## Accounting Suite
| Route | File | Description |
|-------|------|-------------|
| `/accounting` | layout | Accounting layout |
| `/accounting/chart-of-accounts` | `app/(main)/accounting/chart-of-accounts/page.tsx` | Chart of accounts |
| `/accounting/journal` | `app/(main)/accounting/journal/page.tsx` | Journal entries |
| `/accounting/reports/ledger/[accountId]` | Detail | General ledger |
| `/accounting/reports/trial-balance` | `app/(main)/accounting/reports/trial-balance/page.tsx` | Trial balance |
| `/accounting/reports/profit-loss` | `app/(main)/accounting/reports/profit-loss/page.tsx` | P&L statement |
| `/accounting/reports/balance-sheet` | `app/(main)/accounting/reports/balance-sheet/page.tsx` | Balance sheet |
| `/accounting/reports/gst-summary` | `app/(main)/accounting/reports/gst-summary/page.tsx` | GST summary |

## CRM Suite
| Route | File | Description |
|-------|------|-------------|
| `/clients` | `app/(main)/clients/page.tsx` | Client list |
| `/clients/create` | `app/(main)/clients/create/page.tsx` | Create client |
| `/clients/[id]` | `app/(main)/clients/[id]/page.tsx` | Client detail |
| `/clients/[id]/edit` | `app/(main)/clients/[id]/edit/page.tsx` | Edit client |
| `/leads` | `app/(main)/leads/page.tsx` | Lead board |
| `/leads/list` | `app/(main)/leads/list/page.tsx` | Lead list |
| `/leads/kanban` | `app/(main)/leads/kanban/page.tsx` | Lead kanban |
| `/leads/create` | `app/(main)/leads/create/page.tsx` | Create lead |
| `/leads/[id]` | Detail | Lead detail |
| `/leads/[id]/edit` | Edit | Edit lead |
| `/crm` | `app/(main)/crm/page.tsx` | CRM overview |
| `/crm/contracts` | `app/(main)/crm/contracts/page.tsx` | Contracts |
| `/crm/contracts/create` | Create | Create contract |
| `/crm/contracts/templates` | Templates | Contract templates |

## Sales / Invoicing
| Route | File | Description |
|-------|------|-------------|
| `/invoices` | `app/(main)/invoices/page.tsx` | Invoice list |
| `/invoices/create` | `app/(main)/invoices/create/page.tsx` | Create invoice |
| `/invoices/[id]` | Detail | Invoice detail |
| `/invoices/[id]/edit` | Edit | Edit invoice |
| `/quotations` | `app/(main)/quotations/page.tsx` | Quotation list |
| `/quotations/create` | Create | Create quotation |
| `/quotations/templates` | Templates | Quotation templates |
| `/payments` | `app/(main)/payments/page.tsx` | Payment tracking |

## Recruitment
| Route | File | Description |
|-------|------|-------------|
| `/recruitment` | layout | Recruitment layout |
| `/recruitment/jobs` | `app/(main)/recruitment/jobs/page.tsx` | Job openings |
| `/recruitment/candidates` | `app/(main)/recruitment/candidates/page.tsx` | Candidates |
| `/recruitment/candidates/[id]` | Detail | Candidate detail |
| `/recruitment/interviews` | `app/(main)/recruitment/interviews/page.tsx` | Interviews |
| `/recruitment/board` | `app/(main)/recruitment/board/page.tsx` | Kanban board |
| `/recruitment/templates` | `app/(main)/recruitment/templates/page.tsx` | Email templates |

## Projects / Operations
| Route | File | Description |
|-------|------|-------------|
| `/projects` | `app/(main)/projects/page.tsx` | Project list |
| `/projects/new` | `app/(main)/projects/new/page.tsx` | Create project |
| `/projects/[id]` | Detail + layout | Project detail |
| `/projects/[id]/tasks` | Tasks | Project tasks |
| `/projects/[id]/backlog` | Backlog | Backlog view |
| `/projects/[id]/milestones` | Milestones | Milestones |
| `/projects/[id]/roadmap` | Roadmap | Roadmap |
| `/projects/[id]/timesheets` | Timesheets | Time tracking |
| `/projects/[id]/members` | Members | Team members |
| `/projects/[id]/files` | Files | Project files |
| `/projects/[id]/financials` | Financials | Budget/financials |
| `/projects/[id]/wiki` | Wiki | Project wiki |
| `/projects/[id]/automation` | Automation | Automation rules |
| `/projects/[id]/settings` | Settings | Project settings |
| `/operations/projects` | `app/(main)/operations/projects/page.tsx` | Operations |
| `/operations/timesheets/approvals` | `app/(main)/operations/timesheets/approvals/page.tsx` | Timesheet approval |

## LMS
| Route | File | Description |
|-------|------|-------------|
| `/lms/courses` | `app/(main)/lms/courses/page.tsx` | Courses |
| `/lms/courses/[id]` | Detail | Course detail |
| `/lms/courses/[id]/classroom` | `app/(main)/lms/courses/[id]/classroom/page.tsx` | Classroom |
| `/lms/classes` | `app/(main)/lms/classes/page.tsx` | Online classes |
| `/lms/enrollments` | `app/(main)/lms/enrollments/page.tsx` | Enrollments |
| `/lms/students` | `app/(main)/lms/students/page.tsx` | Students |

## Helpdesk / Documents
| Route | File | Description |
|-------|------|-------------|
| `/helpdesk` | `app/(main)/helpdesk/page.tsx` | Ticket list |
| `/helpdesk/[id]` | Detail | Ticket detail |
| `/documents` | `app/(main)/documents/page.tsx` | Documents |
| `/documents/templates` | `app/(main)/documents/templates/page.tsx` | Document templates |
| `/my-documents` | `app/(main)/my-documents/page.tsx` | My documents |
| `/emails` | `app/(main)/emails/page.tsx` | Email dispatch |

## Settings
| Route | File | Description |
|-------|------|-------------|
| `/settings` | `app/(main)/settings/page.tsx` | Settings dashboard |
| `/settings/company` | Company | Company profile |
| `/settings/roles` | Roles | Role list |
| `/settings/roles/create` | Create | Create role |
| `/settings/roles/[id]` | Detail | Role permissions |
| `/settings/users` | Users | User management |
| `/settings/locations` | Locations | Location list |
| `/settings/locations/create` | Create | Add location |
| `/settings/email` | Email | Email config |
| `/settings/payments` | Payments | Payment gateway config |
| `/settings/storage` | Storage | Storage config |
| `/settings/billing` | Billing | Billing settings |
| `/settings/services` | Services | Service catalog |
| `/settings/memberships` | Memberships | Memberships |
| `/settings/leave-types` | Leave types | Leave type settings |
| `/settings/subscription-plans` | Plans | Subscription plans |
| `/settings/certificate-templates` | Certificate templates | Certificate templates |
| `/settings/audit-logs` | Audit logs | Audit trail |
| `/settings/taxes` | (via settings) | Tax rates |
| `/settings/units` | (via settings) | Unit types |

## Super Admin
| Route | File | Description |
|-------|------|-------------|
| `/superadmin/dashboard` | `app/(main)/superadmin/dashboard/page.tsx` | Platform dashboard |
| `/superadmin/tenants` | `app/(main)/superadmin/tenants/page.tsx` | Tenant management |
| `/superadmin/plans` | `app/(main)/superadmin/plans/page.tsx` | Platform plans |
| `/superadmin/coa` | `app/(main)/superadmin/coa/page.tsx` | COA templates |
| `/superadmin/rules` | `app/(main)/superadmin/rules/page.tsx` | Statutory rules |

## Client Portal (`/portal`)
| Route | File | Description |
|-------|------|-------------|
| `/portal/login` | `app/portal/login/page.tsx` | Portal login |
| `/portal/dashboard` | `app/portal/dashboard/page.tsx` | Portal dashboard |
| `/portal/invoices` | `app/portal/invoices/page.tsx` | My invoices |
| `/portal/quotations` | `app/portal/quotations/page.tsx` | My quotations |
| `/portal/contracts` | `app/portal/contracts/page.tsx` | My contracts |
| `/portal/projects` | `app/portal/projects/page.tsx` | My projects |
| `/portal/documents` | `app/portal/documents/page.tsx` | My documents |

## Public Pages
| Route | File | Description |
|-------|------|-------------|
| `/public/invoices/[token]` | `app/public/invoices/[token]/page.tsx` | Public invoice |
| `/public/quotations/[token]` | `app/public/quotations/[token]/page.tsx` | Public quotation |
