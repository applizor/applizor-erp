# MASTER_INTEGRATION_DOC - Applizor ERP (Universal AI OS Blueprint)

## 1. System Properties & Environment Config
- **Production API URL**: `https://api.iam.applizor.com/api`
- **Authentication**: JWT Bearer Token

### ⚠️ Mandatory Headers for ALL Requests (AI Agent must force-inject these):
```json
{
  "Host": "api.iam.applizor.com",
  "Origin": "https://iam.applizor.com",
  "Referer": "https://iam.applizor.com/",
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
}
```
*Note: Without the exact Origin and Referer headers, the production Nginx proxy will return standard socket/connection drop errors (Exit Code 1).*

---

## 2. AI OS Integration Instructions (System Prompts)
When feeding this document to your AI Agents, configure them with the following runtime policies:
1. **Auth Handshake Routine**: 
   - Before executing any other call, verify if a JWT is active.
   - If no token exists, call `POST /auth/login` using the company credentials. Store the resulting `token`.
   - Append `Authorization: Bearer <TOKEN>` to all subsequent request headers.
2. **Auto-Retry & Fallback**:
   - If any API returns `401 Unauthorized`, delete the cached token, run the **Auth Handshake Routine** again, and retry the original transaction once.
3. **Param Validation Guard**:
   - For all parameterized URLs (e.g., `/projects/:id`), ensure that the `:id` parameter is parsed and replaced dynamically before dispatching the request.

---

## 3. MASTER ROUTE REGISTER (Exhaustive Actions)

This section maps all active endpoint endpoints on `https://api.iam.applizor.com/api` based on actual Route Definitions:

### MODULE 1: AUTHENTICATION & ACCESS CONTROL (`/auth`, `/roles`)
- **POST `/auth/register`** | Register a new user
- **POST `/auth/login`** | Authenticate user. Payload: `{ "email": "...", "password": "..." }`. Returns: `{ "token": "...", "user": {...} }`
- **GET `/auth/profile`** | Retrieve authenticated user profile info
- **POST `/auth/forgot-password`** | Request password reset email
- **POST `/auth/reset-password`** | Set new password with reset token
- **GET `/roles`** | Fetch all RBAC roles
- **POST `/roles`** | Create new custom role
- **GET `/roles/:id`** | Get details of a specific role
- **PUT `/roles/:id`** | Update role permissions matrix
- **DELETE `/roles/:id`** | Delete custom role

### MODULE 2: CRM & PIPELINE (`/leads`, `/clients`, `/client-categories`)
- **GET `/leads`** | List all leads
- **POST `/leads`** | Create a lead. Payload: `{ "name": "string", "email": "string", "phone": "string" }`
- **GET `/leads/kanban/board`** | Get kanban board structures
- **GET `/leads/:id`** | Fetch single lead profile
- **PUT `/leads/:id`** | Update lead info
- **DELETE `/leads/:id`** | Delete lead
- **PUT `/leads/:id/stage`** | Move lead stage
- **POST `/leads/:id/convert-to-client`** | Convert lead to premium client status
- **GET `/leads/:id/activities`** | Get activity log for a lead
- **POST `/leads/:id/activities`** | Create/Log activity
- **PUT `/leads/:id/activities/:activityId`** | Edit activity
- **DELETE `/leads/:id/activities/:activityId`** | Delete logged activity
- **POST `/leads/:id/activities/:activityId/complete`** | Mark activity as complete
- **POST `/leads/:id/schedule-follow-up`** | Schedule automated follow-up
- **GET `/clients`** | List active company clients
- **GET `/client-categories`** | Get client segmentation categories

### MODULE 3: WORK MANAGEMENT & BILLING (`/projects`, `/tasks`, `/timesheets`, `/invoices`, `/quotations`)
- **GET `/projects`** | List all active projects
- **POST `/projects`** | Create a project. Payload: `{ "name": "string", "startDate": "ISO-Date", "endDate": "ISO-Date" }`
- **GET `/projects/:id`** | Get project details, team members, and notes
- **PUT `/projects/:id`** | Update project configurations
- **DELETE `/projects/:id`** | Delete project
- **GET `/projects/:id/sow`** | Generate Statement of Work (SOW)
- **POST `/projects/:id/members`** | Add project team member
- **DELETE `/projects/:id/members/:memberId`** | Remove member from project
- **POST `/projects/:id/milestones`** | Define milestones
- **GET `/projects/:id/notes`** | Get Project Wiki documents
- **POST `/projects/:id/notes`** | Add a new Wiki page
- **PUT `/projects/notes/:noteId`** | Edit Wiki document
- **DELETE `/projects/notes/:noteId`** | Delete Wiki page
- **GET `/projects/:id/documents`** | List project attachments
- **POST `/projects/:id/documents`** | Upload project file (Multipart)
- **DELETE `/projects/documents/:docId`** | Delete project document
- **GET `/projects/:id/sprints`** | List agile sprints
- **POST `/projects/:id/sprints`** | Create project sprint
- **GET `/projects/:id/epics`** | List epics
- **POST `/projects/:id/epics`** | Create project epic
- **GET `/tasks`** | List all tasks in workspace
- **POST `/tasks`** | Create task. Payload: `{ "projectId": "string", "title": "string" }`
- **GET `/tasks/:id`** | Detailed task overview
- **PUT `/tasks/:id`** | Edit task properties
- **DELETE `/tasks/:id`** | Remove task
- **POST `/timesheets`** | Create time entry logs
- **GET `/timesheets`** | List logged billable hours
- **GET `/invoices`** | List financial invoices
- **POST `/invoices`** | Generate Invoice
- **GET `/quotations`** | List client quotations
- **POST `/quotations`** | Create a quotation template

### MODULE 4: HRMS, LEAVES & ATTENDANCE (`/employees`, `/attendance-leave`, `/shifts`)
- **GET `/employees`** | List all directory profiles
- **POST `/employees`** | Register employee on payroll
- **GET `/employees/:id`** | Employee file overview
- **PUT `/employees/:id`** | Update profile info
- **POST `/employees/:id/documents`** | Upload employee file (Multipart)
- **POST `/attendance/check-in`** | Mark presence check-in. Payload: `{ "latitude": number, "longitude": number, "deviceId": "string" }`
- **POST `/attendance/check-out`** | Mark presence check-out
- **GET `/attendance/today-status`** | Get real-time status of current day login
- **GET `/attendance-leave/leaves`** | Get all leave records
- **POST `/attendance-leave/leaves`** | Submit leave request
- **GET `/shifts`** | List shifts rosters
- **POST `/shifts`** | Designate shifts roster

### MODULE 5: ACCOUNTING, FINANCE & PAYROLL (`/accounting`, `/payroll`)
- **GET `/accounting/accounts`** | List Chart of Accounts
- **POST `/accounting/accounts`** | Setup new ledger account
- **POST `/accounting/entries`** | Generate manual Journal Entry
- **GET `/accounting/reports/balance-sheet`** | Export real-time Balance Sheet data
- **GET `/accounting/reports/profit-loss`** | Export Profit & Loss report
- **GET `/payroll`** | List current payroll status
- **POST `/payroll/process`** | Process monthly payroll batch

### MODULE 6: LMS & ACADEMY (`/course`, `/student`, `/enrollment`, `/class`, `/lecture`)
- **GET `/course`** | List curriculum courses
- **POST `/course`** | Create courses
- **GET `/student`** | List active students
- **POST `/enrollment`** | Enroll student to class
- **GET `/class`** | List online class timetables
- **GET `/lecture`** | Fetch lectures list

---
*Created for the Applizor AI OS. Ensure your Agent logic honors SSL transport parameters and security handshakes.*
