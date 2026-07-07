---
type: Documentation
title: Attendance Management
description: Attendance tracking, shift roster, and status types
tags: [attendance, roster, shifts]
timestamp: 2026-06-29T23:00:00Z
---

# Attendance Management

## Attendance Statuses
| Status | Meaning | Payroll Impact |
|--------|---------|----------------|
| present | Employee marked present | Full pay |
| absent | Marked absent (no leave) | LOP |
| half-day | Half-day attendance | 0.5 day pay |
| onLeaveButPresent | On approved leave but came to work | Full pay (counts as present) |

## Half-Day Logic
- Applied via `durationType: 'half-day'` on attendance record
- Displayed as "HD" badge in roster/attendance views
- LOP calculation: counts as 0.5 present day

## LOP Calculation
```
absentDays = working days with no record AND not:
  - Week off
  - Holiday
  - Approved leave date
lopAmount = (componentAmount / totalDays) * absentDays
```

## Shift Roster
- Virtual attendance entries via `createRosterAttendance`
- Supports half-day roster patterns with `durationType`
- Auto-generates attendance records from shift assignments
