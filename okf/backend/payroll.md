---
type: Module
title: Payroll Engine
description: Full payroll — processing, TDS, PF/ESI/PT, salary structure, compliance
tags: [payroll, tds, pf, esi, compliance]
timestamp: 2026-07-08T20:00:00Z
---

# Payroll Engine

*(See also: `okf/backend/payroll.md` — core payroll processing flow)*

## Extended Capabilities

### Salary Structure
- **Components**: Earning (Basic, HRA, Conveyance, Special Allowance, etc.) and Deduction (PF, ESI, PT, TDS, etc.)
- **Calculation Types**: `flat` (fixed amount), `percentage` (% of CTC), `formula` (expression with variables: `CTC`, `BASIC`)
- **Templates**: Reusable salary templates for bulk assignment
  - `SalaryTemplate` → `SalaryTemplateComponent[]`
  - `EmployeeSalaryStructure` references template + per-employee overrides
- **Bulk Assign**: Assign template to multiple employees at once

### Payroll Processing Flow
1. **processPayroll** — For each employee:
   - Compute attendance stats (present/LOP/holidays/approved leaves)
   - Build earnings from salary structure components
   - Calculate statutory deductions (PF, ESI, PT, TDS)
   - Compute net salary
   - Save Payroll record (status: `processed`)
2. **approvePayroll** — Status check → create journal entry → set `paid`
3. **postPayrollToAccounting** — Batch post to double-entry (duplicate guard via `PAYROLL-YYYY-MM`)

### Statutory Deductions
| Component | Calculation | Ceiling |
|-----------|-------------|---------|
| PF (Employee) | 12% of PF wages (Basic ≤ 15K) | 15K/mo |
| PF (Employer) | 3.67% EPF + 8.33% EPS | 15K/mo |
| ESI | 0.75% (employee) of gross | 21K/mo |
| PT | State-wise slabs | Varies |
| TDS | Income tax (new/old regime) | YTD-based |

### TDS Calculation (FY 2025-26)
- **New Regime**: 0-4L: Nil, 4-8L: 5%, 8-12L: 10%, 12-16L: 15%, 16-20L: 20%, 20-24L: 25%, 24L+: 30%
  - 87A Rebate: ₹25,000 if taxable income ≤ ₹7L
  - Cess: 4% on total tax
- **Old Regime**: 0-3L: Nil, 3-6L: 5%, 6-9L: 10%, 9-12L: 15%, 12-15L: 20%, 15L+: 30%
  - Rebate: ₹12,500 if income ≤ ₹5L
- **YTD Tracking**: `monthlyTDS = (annualTax - alreadyDeductedYTD) / remainingMonths`

### Tax Declarations
- Per-employee per financial year (unique)
- Investment sections: 80C, 80D, 80G, 24B, others
- Investment approval workflow (admin review with proof documents)
- Supports new/old regime selection

### Compliance Exports
- **EPFO ECR**: UAN-based monthly return with PF wages, contributions, NCP days
- **ESIC Return**: IP number-based with days worked and gross wages

### Approval Journal Entry
```
Dr. Salary Expense (5000)         Gross Salary
   Cr. Salary Payable (2100)         Net Salary
   Cr. PF Payable (2205)            PF Amount
   Cr. PT Payable (2210)            PT Amount
   Cr. TDS Payable (2220)           TDS Amount
```

### Payslip Features
- PDF generation with YTD totals
- Email delivery (single or bulk)
- Employee self-service view
- Downloadable with authorized access
