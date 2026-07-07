---
type: Documentation
title: Employee Management
description: Employee profiles, statutory IDs, and salary structure
tags: [employees, profiles, statutory]
timestamp: 2026-06-29T23:00:00Z
---

# Employee Management

## Employee Record
- Basic info: name, ID, DOB, gender, contact
- Organization: department, position, reporting manager
- Employment: type (permanent/contract/trainee), status (active/inactive/terminated), DOJ
- Statutory: PAN, bank account, UAN, PF Number, ESI Number (stored in `skills` JSON)
- Salary: CTC, salary structure with component breakdown

## Salary Structure (`EmployeeSalaryStructure`)
- One structure per employee
- Contains `SalaryStructureLine` items with component reference and value
- Supports template-based bulk assignment
- Component types: earning/deduction with calculation types (flat/percentage/formula)

## Exit Management
- FnF (Full & Final) calculation
- Loads employee data + payroll history
- Provides settlement preview
