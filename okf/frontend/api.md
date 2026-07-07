---
type: Documentation
title: API Client Patterns
description: How frontend communicates with backend
tags: [api, axios, frontend]
timestamp: 2026-06-29T23:00:00Z
---

# API Client Patterns

## Axios Instance (`lib/api/index.ts`)
- Base URL: `/api` (proxied to backend)
- Auto-attaches JWT token from localStorage
- Error interceptor: 401 → redirect to login
- Returns typed responses

## Module Pattern
Each backend module has a corresponding API file:
```
lib/api/
├── index.ts        # Axios instance
├── payroll.ts      # Payroll endpoints
├── attendance.ts   # Attendance endpoints
├── leaves.ts       # Leave endpoints
...
```

## Typing Convention
```typescript
// API functions return typed Promise
export const payrollApi = {
  getList: async (month: number, year: number): Promise<Payroll[]> => {
    const response = await api.get<Payroll[]>(`/payroll/list?month=${month}&year=${year}`);
    return response.data;
  },
  approve: async (id: string) => {
    await api.post(`/payroll/${id}/approve`);
  },
};
```

## Payload Types
```typescript
interface Payroll {
  id: string;
  employee: { firstName, lastName, employeeId, department? };
  month, year: number;
  grossSalary, deductions, netSalary: number;
  status: 'draft' | 'processed' | 'paid';
  earningsBreakdown?: Record<string, number>;
  deductionsBreakdown?: Record<string, number>;
}
```

## File Downloads
- Payslip PDF: `api.get('/payroll/:id/payslip', { responseType: 'blob' })`
- Creates blob URL, triggers download via hidden `<a>` element
