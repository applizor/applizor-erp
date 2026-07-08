---
type: Documentation
title: API Client Patterns
description: Complete guide to 22 API modules, auth, locale, and utilities
tags: [api, axios, frontend, patterns]
timestamp: 2026-07-08T20:00:00Z
---

# API Client Patterns

## Axios Instance (`lib/api.ts`)
- Base URL: auto-resolved from `NEXT_PUBLIC_API_URL` or browser origin
- Auto-attaches JWT token from localStorage
- Error interceptor: 401 → redirect to login (portal vs internal routing)
- FormData content-type auto-detection
- Returns typed responses

## Module Pattern
Each backend module has a corresponding API file in `lib/api/`:

| API Module | File | Key Functions |
|-----------|------|---------------|
| **Accounting** | `accounting.ts` | `getAccounts`, `createJournalEntry`, `getTrialBalance`, `getGeneralLedger`, `getBalanceSheet`, `getProfitAndLoss`, `getGstSummary`, `reconcileLedger`, `exportReport` |
| **Attendance & Leave** | `attendance.ts` | `checkIn`, `checkOut`, `getMyAttendance`, `getAll`, `manualMark`, leave CRUD, balance, holiday CRUD, roster |
| **Certificates** | `certificate.ts` | Template CRUD, certificate CRUD, `issue`, `revoke`, `generatePdf`, `sendEmail`, `downloadPdf` |
| **Clients** | `clients.ts` | CRUD, categories, sub-categories, logo/profile upload |
| **CMS** | `cms.ts` | Portal config, posts, pages, menus, newsletter, AI headline/SEO |
| **Documents** | `documents.ts` | Template CRUD, upload with letterhead mode |
| **Document Templates** | `document-templates.ts` | Template CRUD |
| **Employee Docs** | `employee-documents.ts` | `getMine`, `upload`, `delete` |
| **Employees/HRMS** | `employees.ts` / `hrms.ts` (dupe) | Dept/position/employee/shift CRUD, document workflow |
| **Invoices** | `invoices.ts` | CRUD, `generatePDF`, `sendEmail`, `recordPayment`, `batchStatus`, `batchSend`, `publicLink`, activity log |
| **Leads** | `leads.ts` | CRUD, `convertToClient` |
| **LMS** | `lms.ts` | Student, course, enrollment, class, lecture, exam CRUD |
| **Payments** | `payments.ts` | `createPaymentLink`, `verifyPayment`, `getAll` |
| **Payroll** | `payroll.ts` | List, templates, components, structure, process, approve, downloadPayslip, postToAccounting |
| **Performance** | `performance.ts` | OKRs, reviews, exit/FnF |
| **Policies** | `policies.ts` | CRUD |
| **Quotations** | `quotations.ts` | CRUD, `convertToInvoice`, `generatePDF`, `duplicate` |
| **Recruitment** | `recruitment.ts` | Jobs, candidates, interviews, offers, resume parse, match score |
| **Sales** | `sales.ts` | Targets, progress |
| **Subscriptions** | `subscriptions.ts` | CRUD |
| **Tickets** | `tickets.ts` | CRUD, comments |

## Shared Services

### Auth (`lib/auth.ts`)
- `auth.register()`, `auth.login()`, `auth.logout()`
- `auth.getToken()`, `auth.getUser()`, `auth.isAuthenticated()`
- `useAuth()` hook: returns `{ user, loading, isAuthenticated, refresh }`

### Locale (`lib/locale.ts`)
- `fetchLocales()`, `fetchLocaleConfig(code)`
- `formatDate()`, `formatDateTime()`, `formatCurrency()`, `formatNumber()`
- Supports en-IN, en-US, en-GB, en-AE, en-SG

### Utilities (`lib/utils/`)
- `url.ts`: `getBaseUrl()`, `resolveUrl()`
- `clipboard.ts`: `copyToClipboard(text)`

## Typing Convention
```typescript
// API functions return typed Promise
export const payrollApi = {
  getList: async (month: number, year: number): Promise<Payroll[]> => {
    const response = await api.get<Payroll[]>(`/payroll/list?month=${month}&year=${year}`);
    return response.data;
  },
  approve: async (id: string) => {
    await api.post(`/payroll/${id}/approve`);
  },
};
```

## Hooks
| Hook | File | Description |
|------|------|-------------|
| `usePermission` | `hooks/usePermission.ts` | `can(module, action)` — checks against 45+ modules |
| `useProjectPermissions` | `hooks/useProjectPermissions.ts` | Project-scoped RBAC |
| `useCurrency` | `hooks/useCurrency.ts` | `formatCurrency(amount, currency)` |
| `useToast` | `hooks/useToast.ts` | `success()`, `error()`, `warning()`, `info()` |
| `useConfirm` | `hooks/useConfirm.ts` | `confirm(options)` → Promise<boolean> |

## Contexts
| Context | File | Description |
|---------|------|-------------|
| `CurrencyProvider` | `context/CurrencyContext.tsx` | Company currency + formatting |
| `ConfirmationProvider` | `context/ConfirmationContext.tsx` | Confirm dialog as promise |
| `AlertProvider` | `context/AlertContext.tsx` | Toast notifications |

## UI Component Library (`components/ui/`)

| Component | Description |
|-----------|-------------|
| `Button` | Variants: primary/secondary/danger/ghost/outline; sizes: sm/md/lg/icon; loading state |
| `Input`, `Textarea`, `Select` | Form inputs with consistent styling |
| `MultiSelect`, `CustomSelect`, `CurrencySelect` | Searchable dropdowns with portal |
| `Dialog`, `AlertDialog`, `ConfirmDialog` | Modal system |
| `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` | Composable card |
| `Badge` | Variants: default/secondary/outline/destructive/success |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | Composable table |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Tab switching |
| `Switch`, `Label` | Toggle + label |
| `LoadingSpinner`, `Skeleton`, `TableRowSkeleton`, `CardSkeleton` | Loading states |
| `Toast`, `ToastContainer` | Notification toasts |
| `Drawer` | Right-side slide panel |
| `DropdownMenu` | Context menu |
| `PageHeader` | Page header with icon, title, actions |
| `RichTextEditor` | Lexical-based rich editor (HTML output) |
| `PagedRichTextEditor` | A4 page-split rich editor |
| `SlabBracketEditor` | Dynamic tax/salary slab editor |
| `QuickAddModal` | Quick entity creation modal |
| `SignaturePad` | Canvas-based signature capture |

## File Downloads
```typescript
// Payslip PDF
const response = await api.get('/payroll/:id/payslip', { responseType: 'blob' });
// Creates blob URL, triggers download via hidden <a> element
```
