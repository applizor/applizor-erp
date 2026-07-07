---
type: Schema
title: Prisma Data Model
description: Core database models and relationships
tags: [database, prisma, schema]
timestamp: 2026-06-30T12:00:00Z
---

# Prisma Data Model

## Core Models

### Company
- `id`, `name`, `gstin`, `pan`, `email`, `phone`, `address`
- `logo`, `digitalSignature`, `letterhead`, `continuationSheet` (file URLs)
- `offDays` (string, comma-separated day names)
- `currency` (default INR)
- `emailConfig` (JSON — SMTP/Graph settings), `paymentConfig` (JSON — gateway keys)
- Bank details: `bankName`, `bankAccountName`, `bankAccountNumber`, `bankIfscCode`, `bankBranch`
- Relations: `users`, `employees`, `clients`, `payrolls`, `ledgerAccounts`, `statutoryConfig`, `performanceReviewCycles`, `holidays`

### User
- `id`, `email`, `password` (hashed), `role`
- `companyId` → Company
- Permissions via `PermissionService.hasBasicPermission(user, module, action)`

### Employee
- `id`, `userId?`, `companyId`, `employeeId`, `firstName`, `lastName`
- `departmentId?` → Department, `positionId?` → Position
- `panNumber`, `accountNumber`, `ptState`, `salary`, `skills` (JSON — stores UAN, PF Number, ESI Number)
- `dateOfJoining`, `dateOfBirth`, `gender`, `status`, `employmentType`
- Relations: `attendances`, `leaveRequests`, `payrolls`, `salaryStructureDetails`, `taxDeclarations`

### Payroll
- `id`, `employeeId`, `month`, `year`
- `basicSalary` (Decimal), `allowances` (Decimal), `deductions` (Decimal)
- `earningsBreakdown` (JSON), `deductionsBreakdown` (JSON)
- `grossSalary`, `netSalary`
- `status`: `draft` → `processed` → `paid`
- Indexes: `[year, month]`, `[employeeId]`

### TaxDeclaration
- `id`, `employeeId`, `financialYear`, `regime` (new/old), `status`, `totalAmount`
- Relations: `investments` (TaxInvestment[])
- Unique: `employeeId_financialYear`

### TaxInvestment
- `id`, `declarationId`, `section` (80C, 80D, etc.), `componentName`, `declaredAmount`, `approvedAmount?`
- `status` (pending/approved/rejected), `proofUrl?`, `rejectionReason?`

### StatutoryConfig
- `id`, `companyId` (unique)
- `pfEmployerContribution%`, `pfEmployeeContribution%`, `pfWageCeiling`
- `esiEmployerContribution%`, `esiEmployeeContribution%`, `esiWageCeiling`
- `ptSlabs` (JSON), `professionalTaxEnabled`
- `salaryPayableAccountId?`, `pfPayableAccountId?`, `esiPayableAccountId?`, `ptPayableAccountId?`, `tdsPayableAccountId?`

### Holiday
- `id`, `companyId?` (nullable for global holidays), `name`, `date`, `type` (national/regional), `isActive`
- Relations: `company` → Company
- Indexes: `[date]`, `[companyId]`

### Attendance
- `id`, `employeeId`, `date`, `status` (present/absent/half-day/onLeaveButPresent), `checkIn?`, `checkOut?`

### LeaveRequest
- `id`, `employeeId`, `startDate`, `endDate`, `durationType` (full-day/half-day)
- `type` (sick/casual/earned/other), `status` (pending/approved/rejected)
- `lopDays` (number of loss-of-pay days)

### LedgerAccount
- `id`, `companyId`, `code`, `name`, `type` (asset/liability/expense/income/equity)
- `parentId?` (self-referential hierarchy)

### JournalEntry
- `id`, `companyId`, `date`, `description`, `reference`, `status` (draft/posted)
- `lines` (JournalEntryLine[])

### JournalEntryLine
- `id`, `journalEntryId`, `accountId`, `debit`, `credit`, `description?`, `reconciledAt?`

### PerformanceReviewCycle
- `id`, `companyId`, `name`, `period` (quarterly/half_yearly/annual), `startDate`, `endDate`, `status` (active/closed)
- Relations: `reviews` (PerformanceReview[])

### Client
- `id`, `companyId`, `name`, `email`, `phone`, `address`
- `gstin`, `pan`, `tan`, `portalAccess`, `password?`
- Relations: `quotations`, `invoices`, `contracts`

### Quotation / Invoice
- Share common fields: `number`, `clientId`, `companyId`, `items`, `subtotal`, `tax`, `total`, `status`, `validUntil`/`dueDate`
- Quotation has optional `title`, `description` for scope
- Invoice has `bankDetails`, `includeBankDetails`
- Both support multi-tax breakdown, item-level discounts, letterhead overlay

## Key Relationships
```
Company 1──N User
Company 1──N Employee
Company 1──1 StatutoryConfig
Company 1──N LedgerAccount
Company 1──N Client
Employee 1──N Payroll
Employee 1──N Attendance
Employee 1──N LeaveRequest
Employee 1──N TaxDeclaration
Company 1──N Holiday
Client 1──N Quotation
Client 1──N Invoice
Country 1──N StatutoryRule
Country 1──N CoaTemplate
CoaTemplate 1──N CoaTemplateEntry
```
