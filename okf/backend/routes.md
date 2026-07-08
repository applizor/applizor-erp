---
type: API
title: API Routes
description: Complete API route map — 60+ route files
tags: [api, routes, endpoints, rest]
timestamp: 2026-07-08T20:00:00Z
---

# API Routes — Complete Reference

All routes prefixed with `/api`. All routes require `authenticate` middleware unless noted.

---

## Core Routes

### Auth (`/api/auth`)
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login |
| GET | `/profile` | Auth | Current user profile |
| POST | `/forgot-password` | Public | Request reset |
| POST | `/reset-password` | Public | Reset password |
| GET | `/` | Auth | List all users |
| PUT | `/:id` | Auth | Update user (role/active) |
| POST | `/invite` | Auth | Invite user with temp password |

### SSO (`/api/auth/sso`)
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/google` | Public | Google OAuth login |
| GET | `/google/callback` | Public | Google OAuth callback |
| POST | `/saml/config` | Auth | Save SAML config |
| GET | `/saml/config` | Auth | Get SAML config |
| GET | `/saml/login` | Public | Initiate SAML login |
| POST | `/saml/callback` | Public | SAML ACS callback |

### Roles (`/api/roles`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create roles |
| GET | `/permissions` | List all permissions |
| POST | `/sync-permissions` | Sync permission definitions |
| GET/PUT/DELETE | `/:id` | Get / Update / Delete role |

### Company (`/api/company`)
| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/` | Get / Update company profile |
| POST | `/letterhead` | Upload letterhead |
| PUT | `/logo` | Update logo |
| PUT | `/signature` | Update digital signature |
| PUT | `/letterhead-asset` | Upload letterhead asset |
| PUT | `/continuation-sheet-asset` | Upload continuation sheet |

---

## HRMS Routes

### Employees (`/api/employees`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List employees (searchable) |
| POST | `/` | Create employee |
| GET | `/:id` | Get employee details |
| PUT | `/:id` | Update employee |
| DELETE | `/:id` | Delete employee |
| POST | `/:id/documents` | Upload employee document |
| GET | `/:employeeId/experience-letter` | Download experience letter PDF |

### Departments (`/api/departments`)
CRUD: `GET/POST` `/`, `PUT/DELETE` `/:id`

### Positions (`/api/positions`)
CRUD: `GET/POST` `/`, `PUT/DELETE` `/:id`

### Branches (`/api/branches`)
CRUD: `GET/POST` `/`, `PUT/DELETE` `/:id`

### Attendance & Leave (`/api/attendance-leave`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/check-in` | Geo-tagged check-in |
| POST | `/check-out` | Check-out |
| GET | `/my-attendance` | My attendance records |
| GET | `/all-attendance` | All attendance (admin) |
| GET | `/today-status` | Today's attendance status |
| POST | `/attendance/manual` | Manual mark attendance |
| DELETE | `/attendance` | Delete attendance record |
| GET/POST | `/leave-types` | List / Create leave types |
| PUT/DELETE | `/leave-types/:id` | Update / Delete leave type |
| POST | `/leaves` | Apply leave |
| POST | `/leaves/calculate` | Calculate leave days |
| POST | `/leaves/upload` | Upload leave attachment |
| GET | `/my-leaves` | My leave requests |
| GET | `/all-leaves` | All leave requests |
| PUT | `/leaves/:id/status` | Approve / Reject leave |
| DELETE | `/leaves/:id` | Delete leave request |
| GET | `/my-balances` | My leave balances |
| GET | `/all-balances` | All leave balances |
| POST | `/leaves/process-carry-forward` | Process carry forward |
| GET/POST | `/holidays` | List / Create holidays |
| PUT/DELETE | `/holidays/:id` | Update / Delete holiday |

### Shifts (`/api/shifts`)
CRUD + `/assign` (bulk assign to employees)

### Shift Rosters (`/api/shift-rosters`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get roster |
| POST | `/batch` | Batch update roster |
| POST | `/sync-prev` | Sync previous week |
| POST | `/upload` | CSV upload roster |

### Timesheets (`/api/timesheets`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create time entry |
| POST | `/bulk` | Bulk create entries |
| POST | `/timer/start` | Start timer |
| POST | `/timer/stop/:id` | Stop timer |
| POST | `/timer/pause/:id` | Pause timer |
| POST | `/timer/resume/:id` | Resume timer |
| GET | `/timer/active` | Get active timer |
| GET | `/timer/task/:taskId` | Get task timers |
| GET | `/` | List timesheets |
| PATCH | `/:id` | Update entry |
| DELETE | `/:id` | Delete entry |
| POST | `/submit` | Submit for approval |
| POST | `/approve` | Approve timesheets |
| POST | `/reject` | Reject timesheets |

---

## Payroll Routes (`/api/payroll`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/process` | Run payroll for month/year |
| GET | `/list` | List payrolls (paginated) |
| GET | `/mine` | My payslips |
| POST | `/:id/approve` | Approve → posts to accounting |
| GET | `/:id/payslip` | Download payslip PDF |
| POST | `/:id/email-payslip` | Email single payslip |
| POST | `/bulk/email-payslips` | Bulk email payslips |
| GET | `/components` | List salary components |
| POST | `/components` | Create component |
| PUT/DELETE | `/components/:id` | Update / Delete |
| GET | `/templates` | List salary templates |
| POST | `/templates` | Create template |
| POST | `/templates/preview` | Preview template |
| GET/PUT/DELETE | `/templates/:id` | Get / Update / Delete |
| GET | `/statutory-config` | Get PF/ESI/PT config |
| POST | `/statutory-config` | Update config |
| GET | `/structure/:employeeId` | Get salary structure |
| POST | `/structure/:employeeId` | Save structure |
| POST | `/structure/bulk-assign` | Bulk assign template |
| GET | `/declarations/:employeeId` | Tax declarations |
| POST | `/declarations/submit` | Submit declaration |
| POST | `/declarations/investments/:id/review` | Review investment |
| GET | `/declarations/pending` | Pending reviews |
| GET | `/compliance/export?type=&month=&year=` | EPFO/ESIC export |
| POST | `/run/post-to-accounting` | Batch post to accounting |

### Tax Declarations (`/api/tax-declarations`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/:employeeId` | Get declarations |
| POST | `/submit` | Submit declaration |
| POST | `/investments/:id/review` | Review investment |

### Salary Components (`/api/payroll/components`)
CRUD: `GET/POST` `/`, `PUT/DELETE` `/:id`

### Salary Structure (`/api/payroll/structure`)
| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/:employeeId` | Get / Update salary structure |

---

## CRM Routes

### Clients (`/api/clients`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List clients |
| POST | `/` | Create client |
| GET | `/:id` | Get client |
| PUT | `/:id` | Update client |
| DELETE | `/:id` | Delete client |
| GET | `/:id/documents` | Client documents |
| POST | `/upload` | Upload logo |
| POST | `/upload-profile` | Upload profile pic |

### Client Categories (`/api/client-categories`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create categories |
| POST | `/sub` | Create sub-category |
| GET | `/:categoryId/sub` | List sub-categories |

### Leads (`/api/leads`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create leads |
| GET | `/kanban/board` | Kanban board data |
| GET/PUT/DELETE | `/:id` | Get / Update / Delete |
| PUT | `/:id/stage` | Update stage |
| POST | `/:id/convert-to-client` | Convert to client |
| GET/POST | `/:id/activities` | Lead activities CRUD |
| PUT/DELETE | `/:id/activities/:activityId` | Manage activity |
| POST | `/:id/schedule-follow-up` | Schedule follow-up |
| POST | `/:id/reengage` | Re-engage lead |

### Quotations (`/api/quotations`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create |
| GET/PUT/DELETE | `/:id` | Get / Update / Delete |
| POST | `/:id/convert-to-invoice` | Convert to invoice |
| POST | `/:id/duplicate` | Duplicate |
| POST | `/:id/generate-link` | Generate public link |
| POST | `/:id/revoke-link` | Revoke link |
| GET | `/:id/pdf` | Download PDF |
| GET | `/:id/signed-pdf` | Signed PDF |
| POST | `/:id/send-email` | Send via email |
| GET | `/:id/analytics` | Analytics |
| GET | `/public/:token` | Public view |
| POST | `/public/:token/accept` | Public accept |
| POST | `/public/:token/reject` | Public reject |
| GET | `/public/:token/pdf` | Public PDF |

### Quotation Templates (`/api/quotation-templates`)
CRUD: `GET/POST` `/`, `GET/PUT/DELETE` `/:id`, POST `/:id/apply`

### Invoices (`/api/invoices`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create |
| GET/PUT/DELETE | `/:id` | Get / Update / Delete |
| POST | `/:id/generate-pdf` | Generate PDF |
| POST | `/:id/send` | Send via email |
| POST | `/:id/payments` | Record payment |
| PUT | `/:id/status` | Update status |
| POST | `/:id/duplicate` | Duplicate |
| POST | `/:id/generate-link` | Public link |
| POST | `/:id/revoke-link` | Revoke link |
| POST | `/batch/status` | Batch status update |
| POST | `/batch/send` | Batch send |
| GET | `/stats/summary` | Invoice statistics |
| GET | `/:id/activities` | Activity log |
| GET | `/public/:token` | Public view |
| GET | `/public/:token/download` | Public PDF |

### Contracts (`/api/contracts`) — Admin
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create |
| GET/PUT/DELETE | `/:id` | Get / Update / Delete |
| POST | `/:id/send` | Send to client |
| POST | `/:id/sign-company` | Company sign |
| GET | `/:id/pdf` | Download PDF |

### Contract Templates (`/api/contract-templates`)
CRUD: `GET/POST` `/`, `GET/PUT/DELETE` `/:id`

### Sales Targets (`/api/sales`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/targets` | Create target |
| GET | `/targets` | List targets |
| POST | `/targets/update-progress` | Update progress |

---

## Accounting Routes (`/api/accounting`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/accounts` | Chart of accounts |
| POST | `/accounts` | Create account |
| POST | `/entries` | Create journal entry |
| GET | `/journal` | List journal entries |
| DELETE | `/journal/:id` | Delete journal entry |
| GET | `/reports/general-ledger/:accountId` | General ledger |
| GET | `/reports/balance-sheet` | Balance sheet |
| GET | `/reports/profit-loss` | Profit & loss |
| GET | `/reports/gst-summary` | GST summary |
| GET | `/reports/aging` | AR/AP aging report |
| GET | `/reports/export` | Export report |
| GET | `/reconciliation` | Reconciliation report |
| POST | `/reconciliation/mark` | Mark reconciled |
| POST | `/reconcile` | Reconcile ledger |

---

## Project Management Routes (`/api/projects`)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create projects |
| GET/PUT/DELETE | `/:id` | Get / Update / Delete |
| GET | `/:id/sow` | Generate SOW |
| POST | `/:id/members` | Add member |
| DELETE | `/:id/members/:memberId` | Remove member |
| POST | `/:id/milestones` | Create milestone |
| GET/POST | `/:id/notes` | Project notes CRUD |
| GET/POST | `/:id/documents` | Documents CRUD |
| GET/POST | `/:id/sprints` | Sprint CRUD |
| GET/POST | `/:id/epics` | Epic CRUD |
| GET/POST | `/:projectId/automation` | Automation rules CRUD |

### Tasks (`/api/tasks`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create tasks |
| GET/PUT/DELETE | `/:id` | Get / Update / Delete |
| PUT | `/bulk-update` | Bulk update |
| POST | `/:id/documents` | Upload task files |
| GET/POST | `/:id/comments` | Task comments |
| DELETE | `/:id/comments/:commentId` | Delete comment |
| GET | `/:id/history` | Task history |
| GET | `/analysis/me` | My task analysis |

---

## Recruitment Routes (`/api/recruitment`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/jobs` | Create job opening |
| GET | `/jobs` | List job openings |
| GET/PUT/DELETE | `/jobs/:id` | Get / Update / Delete |
| GET | `/public/jobs/:companyId` | Public job listings |
| GET | `/kanban` | Kanban board |
| POST | `/candidates` | Create candidate |
| POST | `/public/candidates` | Public apply |
| GET | `/candidates` | List candidates |
| GET/PUT/DELETE | `/candidates/:id` | Get / Update / Delete |
| PUT | `/candidates/:id/status` | Update status |
| PUT | `/candidates/:id/stage` | Update stage |
| POST | `/candidates/:id/parse` | Parse resume |
| GET | `/candidates/:id/match` | Match score |
| POST | `/interviews` | Schedule interview |
| GET | `/interviews` | List interviews |
| PUT/DELETE | `/interviews/:id` | Update / Cancel |
| PUT | `/interviews/:id/feedback` | Update feedback |
| POST | `/interviews/:id/scorecard` | Save scorecard |
| GET | `/candidates/:candidateId/interviews` | Candidate interviews |
| POST | `/offers` | Create offer letter |
| GET | `/candidates/:candidateId/offer` | Get offer |
| GET | `/candidates/:candidateId/offer/download` | Download PDF |
| PUT | `/offers/:id/status` | Update offer status |
| POST | `/email/send` | Send email template |
| POST | `/templates` | Email template CRUD |

---

## LMS Routes

### Students (`/api/lms/students`)
CRUD: `GET/POST` `/`, `GET/PUT/DELETE` `/:id`

### Courses (`/api/lms/courses`)
CRUD: `GET/POST` `/`, `GET/PUT/DELETE` `/:id`

### Enrollments (`/api/lms/enrollments`)
CRUD: `GET/POST` `/`, `GET/PUT/DELETE` `/:id`

### Classes (`/api/lms/classes`)
CRUD: `GET/POST` `/`, `GET/PUT/DELETE` `/:id`

### Lectures (`/api/lms/lectures`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/:courseId` | List by course |
| POST | `/` | Create lecture |
| PUT/DELETE | `/:id` | Update / Delete |
| POST | `/:id/complete` | Mark complete |

### Exams (`/api/lms/exams`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/course/:courseId` | List by course |
| POST | `/` | Create exam |
| GET/PUT/DELETE | `/:id` | Get / Update / Delete |
| POST | `/:id/submit` | Submit exam |

---

## Client Portal Routes (`/api/portal`)

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Client portal login |

### Dashboard & Data
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Dashboard summary |
| GET | `/quotations` | My quotations |
| GET | `/quotations/:id/pdf` | Download PDF |
| POST | `/quotations/:id/accept` | Accept quotation |
| POST | `/quotations/:id/reject` | Reject quotation |
| GET | `/invoices` | My invoices |
| GET | `/invoices/export` | Export |
| GET | `/invoices/:id/pdf` | Download PDF |
| GET | `/contracts` | My contracts |
| GET | `/contracts/:id/pdf` | Download PDF |
| POST | `/contracts/:id/sign` | Sign contract |
| POST | `/contracts/:id/view` | Log view |
| GET | `/projects` | My projects |
| GET | `/projects/:id/milestones` | Project milestones |
| POST | `/milestones/:id/review` | Review milestone |
| GET | `/projects/:id/documents` | Project documents |
| GET/POST | `/tasks` | List / Create tasks |
| GET/PUT | `/tasks/:id` | Get / Update task |
| PUT | `/tasks/:id/status` | Update status |
| GET/POST | `/tasks/:id/comments` | Task comments |
| GET | `/tasks/:id/history` | Task history |
| GET | `/documents` | My documents |
| POST | `/documents` | Upload document |
| DELETE | `/documents/:id` | Delete document |

---

## Support & Helpdesk (`/api/tickets`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create tickets |
| GET/PUT | `/:id` | Get / Update |
| POST | `/:id/reply` | Add reply |

---

## Performance Routes (`/api/performance`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/okrs` | Create OKR |
| GET | `/okrs` | List OKRs |
| POST | `/reviews` | Create performance review |
| POST | `/cycles` | Create review cycle |
| GET | `/cycles` | List cycles |
| POST | `/cycles/:id/close` | Close cycle |
| POST | `/exit` | Initiate exit |
| GET | `/exit/:employeeId/fnf` | FnF statement |

---

## Documents (`/api/documents`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/generate` | Generate document |
| POST | `/generate-from-template` | Generate from template |
| POST | `/preview` | Preview document |
| POST | `/publish` | Publish document |
| POST | `/:id/sign` | Upload signed document |
| POST | `/:id/review` | Review document |
| DELETE | `/:id` | Delete document |
| POST | `/upload` | Upload document |
| POST | `/generate-instant` | Instant generation |

### Document Templates (`/api/document-templates`)
CRUD: `GET/POST` `/`, `GET/PUT/DELETE` `/:id`, GET `/type/:type`

### Employee Documents (`/api/employee-documents`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/mine` | My documents |
| POST | `/upload` | Upload |
| DELETE | `/:id` | Delete |

---

## Certificates (`/api/certificates`)

### Certificate Templates
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/templates` | List / Create |
| GET/PUT/DELETE | `/templates/:id` | Get / Update / Delete |

### Certificates
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create |
| GET/PUT/DELETE | `/:id` | Get / Update / Delete |
| POST | `/:id/issue` | Issue certificate |
| POST | `/:id/revoke` | Revoke |
| POST | `/:id/generate-pdf` | Generate PDF |
| GET | `/:id/download` | Download PDF |
| POST | `/:id/send-email` | Send via email |

---

## Expenses (`/api/expenses`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / Create |
| GET | `/configs` | Get approval config |
| POST | `/configs` | Update config |
| GET | `/pending-approvals` | Pending approvals |
| GET/PUT/DELETE | `/:id` | Get / Update / Delete |
| POST | `/:id/action` | Approval action |

---

## Exit & Onboarding

### Exit (`/api/exit`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/resign` | Submit resignation |
| GET | `/` | Exit details |
| POST | `/:id/clear` | Clear department NOC |
| GET | `/:id/noc` | NOC confirmation |

### Onboarding (`/api/onboarding`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/bgv/trigger` | Trigger BGV |
| PUT | `/bgv/:id` | Update BGV status |
| POST | `/checklist` | Init checklist |
| PUT | `/checklist/:candidateId/task` | Update task |
| GET | `/status/:candidateId` | Get status |

---

## Settings (`/api/settings`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/taxes` | Tax rates CRUD |
| PUT/DELETE | `/taxes/:id` | Update / Delete |
| GET/POST | `/units` | Unit types CRUD |
| PUT/DELETE | `/units/:id` | Update / Delete |
| GET/POST | `/email` | Email config |
| POST | `/email/test` | Test email |
| GET | `/email/logs` | Email logs |
| POST | `/email/logs/:id/retry` | Retry email |
| GET/POST | `/payments` | Payment gateway config |
| GET/POST | `/storage` | Storage config |
| POST | `/storage/test` | Test storage |

---

## Platform / Super Admin (`/api/platform`)
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/countries` | Auth | List countries |
| GET | `/states` | Auth | List states |
| GET | `/currencies` | Auth | List currencies |
| GET | `/plans` | Public | List plans |
| GET | `/locales` | Auth | List locales |
| GET | `/locale/:code` | Auth | Get locale config |
| GET | `/timezones` | Auth | List timezones |
| GET/POST | `/rules` | SuperAdmin | Statutory rules CRUD |
| POST | `/rules/company` | Auth | Company rule override |
| GET/POST | `/tenants` | SuperAdmin | Tenant management |
| POST | `/subscribe/checkout` | Auth | Subscription checkout |
| POST | `/subscribe/verify` | Auth | Verify payment |
| POST | `/subscribe/webhook` | Public | Webhook |
| GET | `/stats` | SuperAdmin | Platform stats |

### COA Templates (`/api/platform/coa`)
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/templates` | Auth | List templates |
| POST | `/templates` | SuperAdmin | Create template |
| POST | `/templates/:id/entries` | SuperAdmin | Add entry |
| POST | `/apply` | Auth | Apply to company |

---

## Additional Routes

### Payments (`/api/payments`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhook` | Payment webhook (public) |
| POST | `/link` | Create payment link |
| POST | `/verify` | Verify payment |
| GET | `/` | List payments |
| DELETE | `/:id` | Delete payment |

### Notifications (`/api/notifications`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (last 50) |
| PUT | `/:id` or `/:id/read` | Mark read |
| PUT | `/read-all` | Mark all read |
| POST | `/mark-all-read` | Mark all read (alt) |
| DELETE | `/clear-all` | Clear all |

### Search (`/api/search`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/?q=` | Global search |

### Subscriptions (`/api/subscriptions`)
CRUD: `GET/POST` `/`, `PUT/DELETE` `/:id`

### Subscription Plans (`/api/subscription-plans`)
CRUD: `GET/POST` `/`, `PUT/DELETE` `/:id`

### Services (`/api/services`)
CRUD: `GET/POST` `/`, `PUT/DELETE` `/:id`

### Assets (`/api/assets`)
CRUD: `GET/POST` `/`, `PUT/DELETE` `/:id`

### Policies (`/api/policies`)
CRUD: `GET/POST` `/`, `PUT/DELETE` `/:id`

### Bulk Import (`/api/bulk-import`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/templates/employees` | CSV template |
| GET | `/templates/attendance` | CSV template |
| GET | `/templates/shift-roster` | CSV template |
| POST | `/employees` | Import employees |
| POST | `/attendance` | Import attendance |
| POST | `/shift-roster` | Import roster |

### Currencies (`/api/currencies`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List currencies |
| GET | `/rates` | Exchange rates |
| POST | `/convert` | Convert amount |
| POST | `/sync` | Sync rates |

### Automation (`/api/automation`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/monthly-accrual` | Trigger accrual |
| GET | `/probation-confirmation` | Trigger probation |
| GET | `/quotation-reminders` | Trigger reminders |
| GET | `/microsoft/auth-url` | MS Graph auth URL |
| GET | `/microsoft/callback` | MS Graph callback |
