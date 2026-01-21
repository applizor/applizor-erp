# Default Data Seeder Backup

This file contains the master data required to reset the database to a functional state.

## Master Data JSON

```json
{
  "company": {
    "name": "Applizor Softech LLP",
    "email": "connect@applizor.com",
    "phone": "9130309480",
    "address": "209, WARD NO 7, VISHWAKARMA MUHALLA, GARROLI, Madhya Pradesh, 471201"
  },
  "roles": [
    { "name": "Admin", "id": "fbd2165d-3336-49b8-9b1f-188fbcd27b25", "isSystem": true },
    { "name": "HR", "id": "2efe4dac-9b40-4436-b299-badda6396405", "isSystem": false },
    { "name": "Employee", "id": "2af33051-91e2-49b0-be8e-e879b80dc41c", "isSystem": false }
  ],
  "admin_credentials": {
    "email": "admin@applizor.com",
    "password": "admin123"
  }
}
```

## Detailed Data (Exported from DB)

The following data can be used to recreate the environment:

### Roles & Permissions
(See seed.ts for exact permission mapping)

### Departments
1. Engineering
2. HR

### Leave Types
1. Sick Leave (4 days, Yearly)
2. Casual Leave (4 days, Yearly)
3. Earned Leaves (18 days, Monthly Accrual - 1.5/month)
