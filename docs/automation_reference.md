# Automation & Cron Jobs Reference

This document provides a summary of all scheduled tasks (Cron Jobs) in the system and instructions on how to trigger them manually for testing.

## Scheduled Tasks (Cron Jobs)

| Task Name | Schedule | Description |
|-----------|----------|-------------|
| **Monthly Leave Accrual** | 1st of every month (00:00) | Automatically adds monthly leave quota (e.g., 1.5 days) to all active employees. |
| **Probation Confirmation** | Daily (00:01) | Checks for employees whose probation has ended and adds confirmation bonus leaves. |
| **Quotation Reminders** | Hourly (at minute 0) | Checks for sent quotations that are due for follow-up reminders. |

## Manual Trigger Endpoints (URLs)

In certain cases, you may want to run these tasks immediately without waiting for the scheduled time. You can do this by visiting the following URLs in your browser or using `curl`:

> [!IMPORTANT]
> These endpoints trigger server-side logic immediately. Use them only when necessary for testing or manual overrides.

### 1. Monthly Leave Accrual
Triggers the logic to calculate and add monthly leave days for the current month.
- **URL**: `http://localhost:5000/api/automation/monthly-accrual`
- **Action**: Iterates all active employees and adds defined `accrualRate` to their balances.

### 2. Probation Confirmation Bonus
Triggers the logic to check for newly confirmed employees.
- **URL**: `http://localhost:5000/api/automation/probation-confirmation`
- **Action**: Finds employees whose `probationEndDate` is today or earlier and adds `confirmationBonus` leaves.

### 3. Quotation Reminders
Triggers the follow-up email process for quotations.
- **URL**: `http://localhost:5000/api/automation/quotation-reminders`
- **Action**: Finds active/public quotations with `nextReminderAt <= now` and sends emails.

## Technical Details

- **Scheduler Service**: `backend/src/services/scheduler.service.ts`
- **Accrual Service**: `backend/src/services/leave-accrual.service.ts`
- **Routes**: `backend/src/routes/automation.routes.ts`
