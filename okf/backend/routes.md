---
type: API
title: API Routes
description: Complete API route map for all modules
tags: [api, routes, endpoints]
timestamp: 2026-06-29T23:00:00Z
---

# API Routes

All routes prefixed with `/api`. All routes require `authenticate` middleware unless noted.

## Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | /register | Create account |
| POST | /login | Login |
| GET | /profile | Current user profile |
| POST | /forgot-password | Request password reset |
| POST | /reset-password | Reset password |
| GET | / | List all users (admin) |
| PUT | /:id | Update user (role/active status) |
| POST | /invite | Invite new user with temp password |

## Payroll (`/api/payroll`)
| Method | Path | Description |
|--------|------|-------------|
| POST | /process | Run payroll for month/year |
| GET | /mine | Current user's payslips |
| POST | /:id/approve | Approve → posts to accounting |
| GET | /list?month=&year=&page=&limit= | List payrolls (paginated) |
| GET | /components | Salary components list |
| POST | /components | Create component |
| PUT | /components/:id | Update component (name, type, calcType, default, isActive) |
| DELETE | /components/:id | Delete component |
| GET | /templates | Salary templates |
| POST | /templates/preview | Preview template calculation |
| GET | /statutory-config | Get PF/ESI/PT config |
| POST | /statutory-config | Update config |
| GET | /structure/:employeeId | Get salary structure |
| POST | /structure/:employeeId | Save structure |
| POST | /structure/bulk-assign | Bulk assign template |
| GET | /declarations/:employeeId | Tax declarations |
| POST | /declarations/submit | Submit declaration |
| POST | /declarations/investments/:id/review | Review investment |
| GET | /declarations/pending | Pending reviews (admin) |
| GET | /compliance/export?type=&month=&year= | EPFO/ESIC export |
| POST | /run/post-to-accounting | Batch post to accounting |
| GET | /:id/payslip | Download payslip PDF |
| POST | /:id/email-payslip | Email payslip |
| POST | /bulk/email-payslips | Bulk email payslips for month/year |

## Settings (`/api/settings`)
| Method | Path | Description |
|--------|------|-------------|
| GET | /taxes | List tax rates |
| POST | /taxes | Create tax rate |
| PUT | /taxes/:id | Update tax rate |
| DELETE | /taxes/:id | Delete tax rate |
| GET | /units | List unit types |
| POST | /units | Create unit type |
| PUT | /units/:id | Update unit type |
| DELETE | /units/:id | Delete unit type |
| GET | /email | Get email config (SMTP/Graph settings) |
| POST | /email | Save email config |
| POST | /email/test | Send test email |
| GET | /payments | Get payment gateway config |
| POST | /payments | Save payment gateway config |

## Notifications (`/api/notifications`)
| Method | Path | Description |
|--------|------|-------------|
| GET | / | List notifications (last 50, with unreadCount) |
| PUT | /:id | Mark single notification as read |
| PUT | /:id/read | Mark single notification as read (alt) |
| PUT | /read-all | Mark all as read |
| POST | /mark-all-read | Mark all as read (frontend compat) |
| DELETE | /clear-all | Clear all notifications |

## Search (`/api/search`)
| Method | Path | Description |
|--------|------|-------------|
| GET | /?q= | Global search across employees, clients, invoices, documents, leads |

## Holidays (`/api/attendance-leave/holidays`)
| Method | Path | Description |
|--------|------|-------------|
| GET | / | List holidays (company + global) |
| POST | / | Create holiday (scoped to company) |
| PUT | /:id | Update holiday (scoped to company) |
| DELETE | /:id | Delete holiday (scoped to company) |

## Attendance (`/api/attendance`)
| Method | Path | Description |
|--------|------|-------------|
| GET | /:employeeId | Get attendance |
| POST | /bulk | Bulk mark attendance |
| PUT | /:id | Update record |
| DELETE | /:id | Delete record |

## Leaves (`/api/leaves`)
| Method | Path | Description |
|--------|------|-------------|
| GET | / | List leaves |
| POST | /apply | Apply leave |
| GET | /approvals | Pending approvals |
| POST | /:id/approve | Approve/reject |
| GET | /balance/:employeeId | Leave balance |

## Company (`/api/company`)
| Method | Path | Description |
|--------|------|-------------|
| GET | / | Get company profile |
| PUT | / | Update company |
| POST | /letterhead | Upload letterhead |
| PUT | /logo | Update logo |
| PUT | /signature | Update digital signature |

## CRM
### Clients (`/api/clients`)
| Method | Path | Description |
|--------|------|-------------|
| GET | / | List clients |
| POST | / | Create client |
| GET | /:id | Get client |
| PUT | /:id | Update client |
| DELETE | /:id | Delete client |

### Quotations (`/api/quotations`), Invoices (`/api/invoices`), Contracts (`/api/contracts`)
Standard CRUD + email/sign/status operations.

## HRMS
### Employees (`/api/employees`)
| Method | Path | Description |
|--------|------|-------------|
| GET | / | List (searchable) |
| POST | / | Create |
| GET | /:id | Get with details |
| PUT | /:id | Update |
| DELETE | /:id | Delete |
| GET | /:employeeId/experience-letter | Download experience letter PDF |

### Departments, Positions — Standard CRUD

## Other Modules
- **Projects / Tasks**: `/api/projects`, `/api/tasks` — Full CRUD with milestones, timers, comments
- **Helpdesk**: `/api/tickets` — Ticket lifecycle with assignments
- **Recruitment**: `/api/jobs`, `/api/candidates`, `/api/offers` — ATS pipeline
- **Accounting**: `/api/accounting` — Chart of accounts, journal, trial balance, P&L, balance sheet, GST summary, aging reports, reconciliation
- **Documents**: `/api/documents` — Document workflow with approval chain
- **Reconciliation**: `/api/accounting/reconciliation` — Bank reconciliation (get report, mark-reconciled)
- **Aging Reports**: `/api/accounting/reports/aging` — AR/AP aging buckets (0-30, 31-60, 61-90, 90+ days)
- **Search**: `/api/search?q=` — Global search across employees, clients, invoices, documents, leads
- **Email Settings**: `/api/settings/email` — GET/POST email SMTP/Graph config, POST /test
- **Payment Settings**: `/api/settings/payments` — GET/POST payment gateway config (Razorpay/Cashfree/PayPal)
