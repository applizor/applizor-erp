# API Documentation: Applizor Softech ERP

## Base URL
`/api/v1`

## Authentication
Most endpoints require a Bearer Token in the Authorization header.
`Authorization: Bearer <token>`

---

## 1. Authentication & Profile
Endpoints for user identity and session management.

### Register
- **Endpoint**: `POST /auth/register`
- **Description**: Registers a new user in the system.
- **Request Body**: `{ email, password, firstName, lastName, phone }`
- **Response**: User object and JWT token.

### Login
- **Endpoint**: `POST /auth/login`
- **Description**: Authenticates a user and returns a JWT token.
- **Request Body**: `{ email, password }`
- **Response**: `{ token, user }`

### Get Profile
- **Endpoint**: `GET /auth/profile`
- **Auth**: Required
- **Description**: Retrieves the profile of the currently authenticated user.

### Forgot Password
- **Endpoint**: `POST /auth/forgot-password`
- **Description**: Initiates password reset process.
- **Request Body**: `{ email }`

### Reset Password
- **Endpoint**: `POST /auth/reset-password`
- **Description**: Sets a new password using a reset token.
- **Request Body**: `{ token, newPassword }`

---

## 2. User Roles & Permissions
Management of access control levels.

### Get All Roles
- **Endpoint**: `GET /roles`
- **Auth**: Required
- **Description**: Lists all defined roles in the system.

### Create Role
- **Endpoint**: `POST /roles`
- **Auth**: Required
- **Description**: Creates a new role with specified permissions.
- **Request Body**: `{ name, description, permissions: [{ module, readLevel, createLevel, updateLevel, deleteLevel }] }`

### Get Role Details
- **Endpoint**: `GET /roles/:id`
- **Auth**: Required
- **Description**: Gets detailed information about a specific role.

### Update Role
- **Endpoint**: `PUT /roles/:id`
- **Auth**: Required
- **Description**: Updates role name or permissions.

### Get Permissions
- **Endpoint**: `GET /roles/permissions`
- **Auth**: Required
- **Description**: Lists all available permissions across all modules.

---

## 3. Company & Organization
Management of the corporate structure.

### Get Company Details
- **Endpoint**: `GET /company`
- **Auth**: Required
- **Description**: Retrieves the details of the current company.

### Update Company
- **Endpoint**: `PUT /company`
- **Auth**: Required
- **Description**: Updates company profile and settings.

### Upload Letterhead
- **Endpoint**: `POST /company/letterhead`
- **Auth**: Required
- **Description**: Uploads the company letterhead document.

### Update Logo
- **Endpoint**: `PUT /company/logo`
- **Auth**: Required
- **Description**: Updates the company logo.

### Update Signature
- **Endpoint**: `PUT /company/signature`
- **Auth**: Required
- **Description**: Updates the company digital signature.

---

## 4. Branches
Management of company branches.

### Get All Branches
- **Endpoint**: `GET /branches`
- **Auth**: Required
- **Description**: Lists all branches of the company.

### Create Branch
- **Endpoint**: `POST /branches`
- **Auth**: Required
- **Description**: Creates a new branch.

### Update Branch
- **Endpoint**: `PUT /branches/:id`
- **Auth**: Required
- **Description**: Updates branch details.

---

## 5. Departments
Management of organizational departments.

### Get All Departments
- **Endpoint**: `GET /departments`
- **Auth**: Required
- **Description**: Lists all departments.

### Create Department
- **Endpoint**: `POST /departments`
- **Auth**: Required
- **Description**: Creates a new department.

---

## 6. Employee Management
Handling employee records and profiles.

### Get All Employees
- **Endpoint**: `GET /employees`
- **Auth**: Required
- **Description**: Lists all employees.

### Create Employee
- **Endpoint**: `POST /employees`
- **Auth**: Required
- **Description**: Adds a new employee to the system.

### Get Employee by ID
- **Endpoint**: `GET /employees/:id`
- **Auth**: Required
- **Description**: Retrieves detailed profile of a specific employee.

### Update Employee
- **Endpoint**: `PUT /employees/:id`
- **Auth**: Required
- **Description**: Updates employee information.

### Upload Employee Document
- **Endpoint**: `POST /employees/:id/documents`
- **Auth**: Required
- **Description**: Uploads a document for an employee.

---

## 7. Attendance & Time Tracking
Monitoring employee work hours and presence.

### Check-In/Out
- **Check-In**: `POST /attendance/check-in`
- **Check-Out**: `POST /attendance/check-out`
- **Today Status**: `GET /attendance/today-status`

### Attendance Lists
- **My Attendance**: `GET /attendance/my-attendance`
- **All Attendance**: `GET /attendance/all-attendance`

### Manual Adjustment
- **Mark Manual**: `POST /attendance/attendance/manual`
- **Delete Record**: `DELETE /attendance/attendance`

---

## 8. Leave Management
Handling leave requests, balances, and types.

### Leave Types
- **List**: `GET /attendance-leave/leave-types`
- **Create**: `POST /attendance-leave/leave-types`

### Requests
- **Request Leave**: `POST /attendance-leave/leaves`
- **My Requests**: `GET /attendance-leave/my-leaves`
- **All Requests**: `GET /attendance-leave/all-leaves`
- **Update Status**: `PUT /attendance-leave/leaves/:id/status`

### Balances
- **My Balances**: `GET /attendance-leave/my-balances`

---

## 9. Holidays & Shifts
Calendar and shift scheduling.

### Holidays
- **List**: `GET /attendance-leave/holidays`
- **Create**: `POST /attendance-leave/holidays`

### Shifts
- **List**: `GET /shift`
- **Create**: `POST /shift`
- **Assign**: `POST /shift/assign`

---

## 10. Asset Management
Tracking company property.

### Assets
- **List**: `GET /asset`
- **Create**: `POST /asset`
- **Update**: `PUT /asset/:id`
- **Delete**: `DELETE /asset/:id`

---

## 11. Payroll & Salary Management
End-to-end payroll processing and tax.

### Payroll Processing
- **Process**: `POST /payroll/process`
- **Approve**: `POST /payroll/approve/:id`
- **List Runs**: `GET /payroll/list`

### Salary Components & Templates
- **Components**: `GET /payroll/components`, `POST /payroll/components`
- **Templates**: `GET /payroll/templates`, `POST /payroll/templates`

### Employee Salary Structure
- **Get Structure**: `GET /payroll/structure/:employeeId`
- **Update Structure**: `POST /payroll/structure/:employeeId`
- **Bulk Assign**: `POST /payroll/structure/bulk-assign`

### Tax & Compliance
- **Statutory Config**: `GET /payroll/statutory-config`, `POST /payroll/statutory-config`
- **Declarations**: `GET /payroll/declarations/:employeeId`, `POST /payroll/declarations/submit`
- **Investment Review**: `POST /payroll/declarations/investments/:id/review`

### Payslips & Accounting
- **Download**: `GET /payroll/:id/payslip`
- **Post to Accounting**: `POST /payroll/run/post-to-accounting`

---

## 12. Accounting & Finance
General ledger and financial reporting.

### Chart of Accounts
- **List**: `GET /accounting/accounts`
- **Create**: `POST /accounting/accounts`

### Journal Entries
- **Manual Entry**: `POST /accounting/entries`
- **List Entries**: `GET /accounting/journal`

### Financial Reports
- **General Ledger**: `GET /accounting/reports/general-ledger/:accountId`
- **Balance Sheet**: `GET /accounting/reports/balance-sheet`
- **Profit & Loss**: `GET /accounting/reports/profit-loss`
- **GST Summary**: `GET /accounting/reports/gst-summary`

---

## 13. Payments
Payment links and gateway integration.

### Transactions
- **Create Link**: `POST /payment/link`
- **Verify**: `POST /payment/verify`
- **List Payments**: `GET /payment`
- **Delete**: `DELETE /payment/:id`
- **Webhook**: `POST /payment/webhook`

---

## 14. Lead Management (CRM)
Tracking and converting potential business opportunities.

### Lead Lifecycle
- **Create**: `POST /lead`
- **List**: `GET /lead`
- **Details**: `GET /lead/:id`
- **Update**: `PUT /lead/:id`
- **Convert to Client**: `POST /lead/:id/convert-to-client`

### Lead Activities
- **Manage**: `GET /lead/:id/activities`, `POST /lead/:id/activities`

---

## 15. Client Management
Management of active business clients.

### Clients
- **Create**: `POST /client`
- **List**: `GET /client`
- **Details**: `GET /client/:id`
- **Update**: `PUT /client/:id`

---

## 16. Quotations & Estimates
Generating professional offers and pricing.

### Quotation Lifecycle
- **Create**: `POST /quotation`
- **List**: `GET /quotation`
- **Convert to Invoice**: `POST /quotation/:id/convert-to-invoice`

### Public Access
- **Generate Link**: `POST /quotation/:id/generate-link`
- **Public View**: `GET /quotation/public/:token`
- **Public Accept**: `POST /quotation/public/:token/accept`

---

## 17. Sales Targets
Tracking sales performance.

### Targets
- **Create**: `POST /sales/targets`
- **List**: `GET /sales/targets`
- **Update Progress**: `POST /sales/targets/update-progress`

---

## 18. Project Management
End-to-end project planning and tracking.

### Projects
- **CRUD**: `GET /project`, `POST /project`, `GET /project/:id`, `PUT /project/:id`, `DELETE /project/:id`
- **SOW**: `GET /project/:id/sow`
- **Members**: `POST /project/:id/members`, `DELETE /project/:id/members/:memberId`

### Agile Planning
- **Sprints**: `GET /project/:id/sprints`, `POST /project/:id/sprints`
- **Epics**: `GET /project/:id/epics`, `POST /project/:id/epics`

---

## 19. Task Management
Granular task tracking and collaboration.

### Tasks
- **CRUD**: `GET /task`, `POST /task`, `GET /task/:id`, `PUT /task/:id`, `DELETE /task/:id`
- **Comments**: `GET /task/:id/comments`, `POST /task/:id/comments`

---

## 20. Timesheets & Time Tracking
Logging billable hours.

### Time Entry
- **Log**: `POST /timesheet`
- **List**: `GET /timesheet`
- **Active Timer**: `POST /timesheet/timer/start`, `POST /timesheet/timer/stop/:id`

---

## 21. Contracts & Legal
Management of legal agreements.

### Contracts
- **CRUD**: `GET /contracts`, `POST /contracts`, `GET /contracts/:id`, `PUT /contracts/:id`, `DELETE /contracts/:id`
- **Signature**: `POST /contracts/:id/sign-company`

---

## 22. Recruitment & Talent Acquisition
Managing the hiring pipeline.

### Jobs & Candidates
- **Jobs**: `GET /recruitment/jobs`, `POST /recruitment/jobs`
- **Candidates**: `GET /recruitment/candidates`, `POST /recruitment/candidates`
- **Interviews**: `GET /recruitment/interviews`, `POST /recruitment/interviews`
- **Offers**: `POST /recruitment/offers`

---

## 23. LMS (Academy)
Employee training and certification.

### Learning
- **Courses**: `GET /course`, `POST /course`
- **Enrollment**: `POST /enrollment`
- **Lectures**: `GET /lecture`, `POST /lecture`
- **Exams**: `GET /exam`, `POST /exam`

---

## 24. Support & Ticketing
Issue tracking.

### Tickets
- **CRUD**: `GET /ticket`, `POST /ticket`, `GET /ticket/:id`, `PUT /ticket/:id`
- **Replies**: `POST /ticket/:id/reply`

---

## 25. Document & Template Management
Centralized storage and dynamic templates.

### Docs & Templates
- **Documents**: `GET /document`, `POST /document`
- **Doc Templates**: `GET /document-template`, `POST /document-template`
- **Email Templates**: `GET /email-template`, `POST /email-template`

---

## 26. Portal (External/Client Access)
Secure portal for clients and employees.

### Portal Access
- **Auth**: `POST /portal/auth/login`
- **Client View**: `GET /portal/contracts`, `GET /quotation/public/:token`
- **Employee View**: `GET /portal/employee/attendance`, `GET /portal/employee/payslips`
