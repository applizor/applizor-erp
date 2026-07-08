---
type: Documentation
title: Leave Management
description: Leave types, application, approval, balance, accrual, carry-forward
tags: [leaves, approval, balance, accrual]
timestamp: 2026-07-08T20:00:00Z
---

# Leave Management

## Leave Types (Configurable)
- Name, description, days allowed
- Paid/unpaid, encashable, accruable
- Accrual rate, max accrual
- Department/position restrictions
- Gender restriction, minimum service days
- Requires attachment flag

## Duration Types
- `full-day`: Entire day off
- `half-day`: Half-day absence (consumes 0.5 day from balance)

## Status Flow
```
pending → approved / rejected
```
- Rejection requires reason

## Leave Balance
- Tracked per employee per leave type per year
- Unique: `[employeeId, leaveTypeId, year]`
- Auto-updated on approval
- Carry-forward processing via dedicated endpoint

## Leave Accrual
- Monthly automated accrual via `LeaveAccrualService`
- Runs via scheduler (1st of every month)
- Configurable accrual rate per leave type
- Filters by department/position
- Probation confirmation processing (employees on probation may not accrue)

## Integration with Attendance
- Approved leaves automatically counted as `present` in payroll attendance metrics
- Deduplication: Employee on approved leave who marks attendance → `onLeaveButPresent` status
- Leave detail modal in approvals page with full info

## Half-Day Leave
- Applies to both attendance and leaves
- Consumes 0.5 day from leave balance
- Displayed as "HD" in roster views
- Morning/afternoon distinction supported

## Carry Forward
- Processed via `POST /attendance-leave/leaves/process-carry-forward`
- Moves unused encashable leave balance to next year
