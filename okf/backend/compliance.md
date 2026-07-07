---
type: Module
title: Compliance Exports
description: EPFO ECR and ESIC return file generation
tags: [compliance, epfo, esic, export]
timestamp: 2026-06-29T23:00:00Z
---

# Compliance Exports

## EPFO ECR (`generateEPFO_ECR`)
Format: `UAN#~#Name#~#Gross#~#PF_Wages#~#EPS_Wages#~#EDLI_Wages#~#PF_Contri#~#EPS_Contri#~#Diff#~#NCP_Days#~#Refunds`

- PF Wage = min(Basic, config.pfBasicLimit) — reads from StatutoryConfig
- PF Contribution = PF Wage × config.pfEmployeeRate%
- EPS Contribution = PF Wage × min(config.pfEmployerRate, 8.33)%
- UAN from `employee.skills.uan`

## ESIC Return (`generateESIC_Return`)
Format: `IP_Number,Name,daysWorked,wages,reasonCode`

- `daysWorked` = actual attendance count (present=1, half-day=0.5) from Attendance records
- ESI Number from `employee.skills.esiNumber`
