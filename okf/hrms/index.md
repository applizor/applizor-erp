---
type: Module
title: HRMS Module
description: Human Resource Management — attendance, leaves, employees
tags: [hrms, attendance, leaves, employees]
timestamp: 2026-06-29T23:00:00Z
---

# HRMS Module

## Core Models
- **Employee**: Profile, department, position, salary, statutory IDs
- **Attendance**: Daily check-in/out with status (present/absent/half-day/onLeaveButPresent)
- **LeaveRequest**: Leave applications with duration type, approval workflow
- **Department/Position**: Organizational hierarchy
- **ShiftRoster**: Virtual attendance entries generated from roster patterns

## Key Features
- Attendance marking with bulk operations
- Leave management with balance tracking (sick/casual/earned)
- Half-day support for both attendance and leaves
- `onLeaveButPresent` status for attendance-on-leave-day scenarios
- Leave approval workflow with rejection reason
- FnF (Full & Final) settlement calculation on exit
