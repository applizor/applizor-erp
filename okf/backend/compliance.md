---
type: Module
title: Compliance Exports
description: EPFO ECR, ESIC return, statutory rules engine
tags: [compliance, epfo, esic, statutory]
timestamp: 2026-07-08T20:00:00Z
---

# Compliance Exports

## EPFO ECR (`ComplianceService.generateEPFO_ECR`)
Format: `UAN#~#Name#~#Gross#~#PF_Wages#~#EPS_Wages#~#EDLI_Wages#~#PF_Contri#~#EPS_Contri#~#Diff#~#NCP_Days#~#Refunds`

- PF Wage = min(Basic, config.pfBasicLimit) — reads from StatutoryConfig
- PF Contribution = PF Wage × config.pfEmployeeRate%
- EPS Contribution = PF Wage × min(config.pfEmployerRate, 8.33)%
- UAN from `employee.skills.uan`

## ESIC Return (`ComplianceService.generateESIC_Return`)
Format: `IP_Number,Name,daysWorked,wages,reasonCode`

- `daysWorked` = actual attendance count (present=1, half-day=0.5) from Attendance records
- ESI Number from `employee.skills.esiNumber`

## Statutory Rules Engine (`statutory-rule.service.ts`)
- Multi-country rule definitions with date-effective ranges
- Rule types: `percentage`, `slab`, `fixed`
- Categories: `retirement`, `health`, `tax`, `social`
- Supports company-specific rule overrides
- Evaluated against wage bases (basic vs. gross) with slab-based calculations

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/payroll/compliance/export?type=&month=&year=` | EPFO or ESIC export |
| GET/POST | `/platform/rules` | Statutory rules CRUD (super admin) |
| POST | `/platform/rules/company` | Company rule override |
| POST | `/platform/rules/apply/:companyId` | Apply global rules to company |
