---
type: Documentation
title: Attendance Management
description: Attendance tracking, shift roster, geo-security, bulk import
tags: [attendance, roster, shifts, tracking]
timestamp: 2026-07-08T20:00:00Z
---

# Attendance Management

## Attendance Statuses
| Status | Meaning | Payroll Impact |
|--------|---------|----------------|
| present | Employee marked present | Full pay |
| absent | Marked absent (no leave) | LOP |
| half-day | Half-day attendance | 0.5 day pay |
| onLeaveButPresent | On approved leave but came to work | Full pay (counts as present) |
| week-off | Weekly off day | No impact |
| holiday | Company holiday | Full pay |

## Check-in/Check-out
- Geo-tagged: latitude/longitude captured
- IP address logged
- `AttendanceSecurityService` detects "impossible travel" (Haversine formula) to prevent fraud
- Distance check: compares current GPS against last known location within time window

## Manual Attendance
- Admin can manually mark attendance for any employee/date
- Bulk marking via register page
- CSV bulk import via `/api/bulk-import/attendance`

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
- CSV upload for batch roster assignment
- Batch update via `POST /api/shift-rosters/batch`

## Roster Validation (`RosterValidatorService`)
- Night-shift crossing detection
- Rest period violations (minimum gap between consecutive shifts)
- Company off-day compliance
- Overlapping shift detection
