---
type: Module
title: Payroll Engine
description: Payroll processing, TDS calculation, PF/ESI/PT, approval flow
tags: [payroll, tds, pf, esi, compliance]
timestamp: 2026-06-29T23:00:00Z
---

# Payroll Engine

## Processing Flow
```
1. processPayroll (controller)
   └─ For each employee:
      ├─ Calculate attendance stats (present/LOP/holidays/approved leaves)
      ├─ Build earnings from salary structure components
      ├─ Calculate statutory deductions (PF, ESI, PT, TDS)
      ├─ Compute net salary
      └─ Save Payroll record (status: processed)
   
2. approvePayroll (controller)
   ├─ Status check: must be 'processed'
   ├─ Create journal entry with dynamic account codes
   └─ Set status → 'paid'
   
3. postPayrollToAccounting (controller)
   └─ Batch post to double-entry accounting (with duplicate guard)
```

## Salary Components
Each employee has a salary structure with components:
- **Earning**: Basic, HRA, Conveyance, Special Allowance, etc.
- **Deduction**: PF, ESI, PT, TDS, etc.
- **Types**: `flat` (fixed amount), `percentage` (% of CTC), `formula` (expression)
- Formulas support variables: `CTC`, `BASIC`, evaluated via `FormulaEvaluator`

## Attendance Impact (LOP)
```
lopAmount = (monthlyAmount / totalDays) * absentDays
absentDays = missing records on working days NOT covered by:
  - Approved leave (paid leave)
  - Holiday
  - Week off
```

## FnF (Full & Final) Settlement
- **Gratuity**: (Last drawn salary × 15/26 × years of service), eligible after 5 years
- **Leave Encashment**: Unused encashable leave balance (where `LeaveType.encashable = true`) × daily wage (monthly/30), capped at 30 days
- **Notice Period Recovery**: Based on company policy (default 30 days)
- **Experience Letter**: PDF generated via PDFService with employee details, tenure, position

## Separation Workflow
1. Initiate exit → Employee status set to 'resigned', email notification sent
2. FnF calculation → Gratuity, leave encashment, notice recovery
3. Asset clearance → Tracked separately
4. Experience letter → Downloadable PDF
5. Final settlement → Processed in next payroll cycle

## TDS Calculation (FY 2025-26)

### New Regime Slabs
| Income | Tax |
|--------|-----|
| 0 - 4L | Nil |
| 4L - 8L | 5% |
| 8L - 12L | 10% |
| 12L - 16L | 15% |
| 16L - 20L | 20% |
| 20L - 24L | 25% |
| 24L+ | 30% |

**87A Rebate**: ₹25,000 if taxable income ≤ ₹7L (new regime)
**Cess**: 4% Health & Education on total tax

### Old Regime Slabs
| Income | Tax |
|--------|-----|
| 0 - 3L | Nil |
| 3L - 6L | 5% |
| 6L - 9L | 10% |
| 9L - 12L | 15% |
| 12L - 15L | 20% |
| 15L+ | 30% |

**Rebate**: ₹12,500 if income ≤ ₹5L

### YTD Tracking
```
monthlyTDS = (annualTax - alreadyDeductedYTD) / remainingMonths
```

## Statutory Deductions
| Component | Calculation | Ceiling |
|-----------|-----------|---------|
| PF (Employee) | 12% of PF wages (Basic ≤ 15K) | 15K/mo |
| PF (Employer) | 3.67% EPF + 8.33% EPS | 15K/mo |
| ESI | 0.75% (employee) of gross | 21K/mo |
| PT | State-wise slabs (stored in StatutoryConfig) | Varies |
| TDS | Income tax as above | YTD-based |

## Approval Journal Entry
```
Dr. Salary Expense (5000)         Gross Salary
   Cr. Salary Payable (2100)         Net Salary
   Cr. PF Payable (2205)            PF Amount
   Cr. PT Payable (2210)            PT Amount
   Cr. TDS Payable (2220)           TDS Amount
```
Account codes from `StatutoryConfig` with fallback to hardcoded defaults via `ensureAccount`.
