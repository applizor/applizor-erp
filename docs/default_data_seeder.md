# Default Data Seeder Backup (Fresh)

This file contains the final master data frozen from the database after all recent fixes.

## Master Data JSON

```json
{
  "company": {
    "name": "Applizor Softech LLP",
    "email": "connect@applizor.com",
    "city": "Chhatarpur",
    "state": "Madhya Pradesh",
    "address": "209, WARD NO 7, VISHWAKARMA MUHALLA, GARROLI",
    "pincode": "471201"
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

## Detailed Data

### Leave Types (Final Config)
1. **Earned Leaves**: 18 days (Monthly, 1.5/mo), maxAccrual: 0 (Unlimited)
2. **Sick Leave**: 4 days (Yearly), quarterlyLimit: 1
3. **Casual Leave**: 4 days (Yearly), quarterlyLimit: 1
