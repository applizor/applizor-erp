---
type: Documentation
title: Leave Management
description: Leave application, approval, and balance tracking
tags: [leaves, approval, balance]
timestamp: 2026-06-29T23:00:00Z
---

# Leave Management

## Leave Types
- **Sick Leave**: Medical reasons
- **Casual Leave**: Emergency/personal
- **Earned Leave**: Accrued/privilege leave

## Duration Types
- `full-day`: Entire day off
- `half-day`: Half-day absence (morning or afternoon)

## Status Flow
```
draft → pending → approved / rejected
```

## Leave Balance
- Tracked per employee per leave type
- Earned leave accrues monthly
- Half-day leave consumes 0.5 day from balance

## Integration with Attendance
- Approved leaves are automatically counted as `present` in payroll attendance metrics
- Deduplication: An employee on approved leave who marks attendance gets `onLeaveButPresent` status
- Leave detail modal shows full info on row click in approvals page
