---
type: Documentation
title: Employee Management
description: Employee lifecycle, salary structure, exit/FnF, onboarding
tags: [employees, profiles, salary, exit, onboarding]
timestamp: 2026-07-08T20:00:00Z
---

# Employee Management

## Employee Record
- **Basic**: Name, ID, DOB, gender, contact, email
- **Organization**: Department, position, shift, reporting manager
- **Employment**: Type (permanent/contract/trainee/intern), status (active/inactive/terminated/resigned), DOJ
- **Statutory**: PAN, bank account/IFSC, UAN, PF Number, ESI Number, PT state
- **Salary**: CTC, salary structure with component breakdown

## Salary Structure (`EmployeeSalaryStructure`)
- One structure per employee (1:1 relationship)
- Contains `EmployeeSalaryComponent` items with component reference and value
- Supports template-based bulk assignment
- Component types: earning/deduction
- Calculation types: flat (fixed amount), percentage (% of CTC), formula (expression)

## Exit Management (Full & Final)
- **Initiation**: Employee status → 'resigned', email notification sent
- **FnF Calculation**:
  - **Gratuity**: (Last drawn salary × 15/26 × years of service), eligible after 5 years
  - **Leave Encashment**: Unused encashable balance × daily wage, capped at 30 days
  - **Notice Period Recovery**: Based on company policy (default 30 days)
- **NOC**: Department-wise clearance via `/api/exit/:id/clear`
- **Experience Letter**: PDF generated via PDFService
- **Final Settlement**: Processed in next payroll cycle

## Onboarding
- Background verification (BGV) trigger and status tracking
- Onboarding checklist with task-level tracking
- Linked to recruitment module (candidate → employee conversion)

## Employee Documents
- Self-service document upload via `/api/employee-documents`
- Admin document upload via `/api/employees/:id/documents`
- Document review workflow (approve/reject with remarks)
