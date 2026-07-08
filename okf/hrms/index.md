---
type: Module
title: HRMS Module
description: Complete HRMS — employees, attendance, leaves, shifts, roster, timesheets, assets, certificates, policies, performance, exit/FnF
tags: [hrms, attendance, leaves, employees, shifts, timesheets]
timestamp: 2026-07-08T20:00:00Z
---

# HRMS Module

## Models (19)
- **Employee**: Profile, org structure (dept/position/manager), statutory IDs (PAN/UAN/PF/ESI/bank), salary CTC, employment type
- **Department**: Name, head, email — unique per company
- **Position**: Title, salary range — unique per department
- **Shift**: Start/end time, grace period, night shift flag, working days
- **ShiftRoster**: Daily shift assignment per employee
- **Attendance**: Daily check-in/out with geo-location, status (present/absent/half-day/onLeaveButPresent/week-off/holiday), overtime
- **LeaveType**: Configurable (paid/unpaid, encashable, accruable, gender-restricted, min service days)
- **LeaveRequest**: Full/half-day, attachment support, approval workflow
- **EmployeeLeaveBalance**: Yearly balance per leave type (unique: employee + leaveType + year)
- **LeaveAccrual**: Monthly accrual tracking
- **Holiday**: National/regional/optional, scoped by company
- **Timesheet**: Date, project, task, duration, approval workflow
- **ActiveTimer**: Real-time time tracking per employee/project/task
- **Asset**: Laptop/phone/vehicle etc., assigned to employee, full lifecycle
- **Certificate**: Course/internship/experience, template-based, PDF generation, email delivery
- **CertificateTemplate**: HTML design with variables
- **Policy**: HTML content with version tracking
- **PerformanceReviewCycle**: Quarterly/half-yearly/annual review cycles
- **PerformanceReview**: Self + manager rating, goals, feedback
- **OKR/KeyResult**: Objectives with measurable key results
- **ExitDetail**: FnF (gratuity, leave encashment, notice recovery)

## Key Features
- **Attendance**: Geo-tagged check-in/out, manual marking, bulk import CSV, muster roll
- **Leave**: Configurable types, balance tracking, accrual engine, carry-forward, approval workflow
- **Shifts**: Flexible shift definitions, roster assignment, CSV upload, conflict validation
- **Timesheets**: Timer start/stop/pause/resume, bulk log, approval workflow
- **Assets**: Full lifecycle tracking (assign, return, repair, retire)
- **Certificates**: Template-based generation, PDF download, email delivery, issue/revoke
- **Performance**: OKR tracking, review cycles, self + manager assessment
- **Exit**: FnF calculation (gratuity, leave encashment, notice recovery), NOC, experience letter
- **Policies**: Company policy documents with version control
- **Bulk Import**: CSV import for employees, attendance, shift roster

## Services
| Service | Purpose |
|---------|---------|
| `attendance-security.service.ts` | Geo-fraud detection (impossible travel) |
| `leave-accrual.service.ts` | Monthly auto-accrual + probation confirmations |
| `roster-validator.service.ts` | Night shift, rest period, conflict validation |
| `performance.service.ts` | OKR progress, FnF calculation |

## Frontend Pages
`/hrms/employees`, `/hrms/employees/new`, `/hrms/employees/[id]`,
`/hrms/departments`, `/hrms/positions`, `/hrms/attendance`,
`/hrms/attendance/register`, `/hrms/my-attendance`, `/hrms/leaves`,
`/hrms/leaves/approvals`, `/hrms/leaves/balances`, `/hrms/leaves/types`,
`/hrms/holidays`, `/hrms/shifts`, `/hrms/roster`, `/hrms/timesheets`,
`/hrms/admin`, `/hrms/exit`, `/hrms/assets`, `/hrms/certificates`,
`/hrms/policies`, `/hrms/performance/okrs`
