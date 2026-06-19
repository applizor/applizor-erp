# Project Details: Applizor Softech ERP

## Introduction
Applizor Softech ERP is a comprehensive Enterprise Resource Planning system designed to manage all aspects of a business, from HR and Payroll to CRM, Project Management, LMS, and AI-driven automation. It is built as a multi-tenant system where each company has its own isolated data and configuration.

## Tech Stack
- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local/Cloud storage (via upload utils)
- **AI Integration**: Gemini/LLM based AI agents for automation and memory

## Architecture Overview
The project follows a modular controller-route-service architecture:
- **Routes**: Define API endpoints and associate them with controllers.
- **Controllers**: Handle request validation, business logic orchestration, and response formatting.
- **Prisma**: Used as the data access layer to interact with the PostgreSQL database.
- **Middleware**: Handles cross-cutting concerns like authentication (`authenticate`) and role-based access control.

## Module Breakdown

### 1. Core & Organization
Manages the fundamental structure of the organization.
- **Company**: Central entity managing global settings, branding (logo, letterhead), and module enablement.
- **Branch**: Manages multiple physical or logical locations of the company.
- **Department**: Organizational units for grouping employees.
- **Position**: Job roles and designations within departments.

### 2. User & Access Management
Handles identity and security.
- **Authentication**: User registration, login, and password recovery.
- **Roles & Permissions**: Granular role-based access control (RBAC) allowing definition of read/create/update/delete levels per module.

### 3. Employee HR
Complete employee lifecycle management.
- **Employee Profile**: Personal details, bank info, and employment status.
- **Attendance**: Check-in/out tracking with IP and location validation.
- **Leave Management**: Leave types, accruals, balances, and request workflows.
- **Holiday Management**: National and company-specific holiday calendars.
- **Shift Management**: Shift definitions and rosters.
- **Asset Management**: Tracking company assets assigned to employees.

### 4. Payroll & Finance
Automated payroll processing and accounting.
- **Salary Components**: Definition of earnings and deductions (flat, percentage, or formula).
- **Salary Structures**: Individual employee salary configurations based on templates.
- **Payroll Processing**: Monthly salary generation with statutory deductions (PF, ESI, PT).
- **Tax Management**: Employee tax declarations and investment proofs.
- **Accounting**: General ledger, journal entries, and transaction tracking.

### 5. CRM & Sales
Pipeline and customer relationship management.
- **Lead Management**: Lead tracking, activity logs, and conversion to clients.
- **Client Management**: Client database with categorization and portal access.
- **Quotations**: Professional quotation generation with templates, public links, and digital signatures.
- **Sales Targets**: Tracking sales performance against set targets.

### 6. Project & Task Management
End-to-end project delivery and tracking.
- **Projects**: Project planning, budgeting, and member assignment.
- **Tasks**: Task breakdown with Epics, Sprints, milestones, and Kanban views.
- **Time Tracking**: Timesheets and active timers for billable hours.
- **Automation**: Rule-based triggers for project updates.

### 7. Contracts & Legal
Management of legal agreements and company policies.
- **Contracts**: Contract generation from templates with digital signatures and tracking.
- **Policies**: Company policy documentation and distribution.

### 8. Recruitment (HRM)
Talent acquisition pipeline.
- **Job Openings**: Managing open positions and public job postings.
- **Candidates**: Candidate tracking, resume parsing, and rating.
- **Interviews**: Scheduling rounds, scoring, and feedback.
- **Offer Letters**: Generating and sending offer letters.

### 9. LMS (Academy)
Employee/Student training and certification.
- **Courses**: Curriculum design, syllabus, and fee management.
- **Enrollments**: Student enrollment and progress tracking.
- **Content**: Online classes and lecture management.
- **Assessment**: Exams, question banks, and automated scoring.
- **Certification**: Automated certificate generation upon course completion.

### 10. AI Center & Memory Engine
Advanced AI capabilities integrated into the ERP.
- **AI Agents**: specialized agents (e.g., SalesAgent) with custom prompts and permissions.
- **Memory Engine**: Long-term memory for projects, decisions, and conversations to provide context to AI.
- **AI Approvals**: AI-driven proposal/quotation review and approval workflow.
- **Knowledge Graph**: Semantic mapping of business entities and relationships.

### 11. Document & Template Management
Centralized document handling.
- **Document Vault**: Categorized storage for invoices, contracts, and employee docs.
- **Templates**: Dynamic templates for emails, documents, and certificates.

### 12. Support & Ticketing
Customer and internal support.
- **Tickets**: Issue tracking with priorities, categories, and internal/external communication.

### 13. Billing & Subscriptions
Revenue management.
- **Invoices**: Automated invoice generation from quotations or projects.
- **Payments**: Tracking payments and gateway integration.
- **Subscriptions**: Plan-based billing for recurring services.
