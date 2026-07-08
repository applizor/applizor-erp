---
type: Schema
title: Prisma Data Model
description: Complete database schema with 119 models
tags: [database, prisma, schema, erp]
timestamp: 2026-07-08T20:00:00Z
---

# Prisma Data Model (119 Models)

## Generator & Datasource
- **Generator**: `prisma-client-js`
- **Database**: `postgresql`
- **Connection**: `env("DATABASE_URL")`

## Complete Model List

### Auth & Identity (6)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **User** | `id`, `email`, `password` (hashed), `companyId` | → Company, → Employee (1:1?), → Student (1:1?), M:M Role via UserRole |
| **Role** | `id`, `name`, `companyId` | 1:M → RolePermission, 1:M → UserRole |
| **UserRole** | `userId`, `roleId` | M:1 → User, M:1 → Role. Unique: `[userId, roleId]` |
| **RolePermission** | `roleId`, `module`, `createLevel/readLevel/updateLevel/deleteLevel` (none/own/department/all) | M:1 → Role. Unique: `[roleId, module]` |
| **SamlConfig** | `companyId`, `entryPoint`, `certificate`, `issuer` | 1:1 → Company |
| **AuditLog** | `companyId`, `userId`, `module`, `action`, `entityType`, `entityId`, `changes` (JSON), `ipAddress`, `userAgent` | M:1 → Company, M:1 → User. Indexed on multiple fields |

### Multi-tenant Core (8)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Company** | `id`, `name`, `gstin`, `pan`, `email`, `phone`, `address`, `logo`, `digitalSignature`, `letterhead`, `continuationSheet`, `emailConfig` (JSON), `paymentConfig` (JSON), `storageConfig` (JSON), `ssoConfig` (JSON), `enabledModules` (String[]), `currency`, `offDays`, bank details, `countryId`, `stateId` | Central hub → 40+ related models |
| **Branch** | `id`, `companyId`, `name`, `code`, `address`, `phone`, `email` | M:1 → Company. Unique: `[companyId, code]` |
| **Country** | `id`, `name`, `code` (ISO), `currencyId`, `phoneCode` | 1:M → State, Company, StatutoryRule, CoaTemplate. M:1 → Currency |
| **State** | `id`, `countryId`, `name`, `code` | M:1 → Country. Unique: `[countryId, code]` |
| **Currency** | `id`, `code` (ISO 4217), `name`, `symbol`, `decimalPlaces` | 1:M → Country, ExchangeRate |
| **ExchangeRate** | `id`, `baseCurrency`, `targetCurrency`, `rate`, `date` | Unique: `[baseCurrency, targetCurrency, date]` |
| **TenantPlan** | `id`, `code`, `name`, `price`, `maxUsers`, `maxStorageGb`, `features` (JSON), `isActive` | 1:M → TenantSubscription. Unique: `code` |
| **TenantSubscription** | `id`, `companyId`, `planId`, `status` (active/paused/cancelled/expired/trial), `startDate`, `endDate`, `features` (JSON) | M:1 → TenantPlan. 1:1 → Company |

### CRM - Leads & Clients (7)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Lead** | `id`, `companyId`, `name`, `email`, `phone`, `company`, `status` (new/contacted/qualified/lost/won), `stage` (lead/proposal/negotiation/closed), `priority`, `source`, `value`, `assignedTo`, `createdBy`, `nextFollowUpAt`, `tags` (String[]) | M:1 → Company, User (assignee), User (creator). 1:M → LeadActivity, Quotation |
| **LeadActivity** | `id`, `leadId`, `type` (call/email/meeting/note/task), `description`, `scheduledAt`, `status`, `assignedTo`, `dueDate` | M:1 → Lead |
| **Client** | `id`, `companyId`, `name`, `email`, `phone`, `address`, `gstin`, `pan`, `tan`, `portalAccess`, `password?`, `type`, `status`, `categoryId`, `subCategoryId`, `createdById`, `creditLimit`, `paymentTerms` | M:1 → Company, User (creator), ClientCategory, ClientSubCategory. 1:M → Contract, Document, Invoice, Project, Quotation, Subscription, Task (as client creator), TaskComment, TaskHistory |
| **ClientCategory** | `id`, `companyId`, `name`, `description` | M:1 → Company. 1:M → Client, ClientSubCategory |
| **ClientSubCategory** | `id`, `categoryId`, `name`, `description` | M:1 → ClientCategory. 1:M → Client |
| **Quotation** | `id`, `companyId`, `quotationNumber` (auto: QTN-{year}-{seq}), `clientId`, `leadId`, `title`, `description`, `items` (JSON), `subtotal`, `tax`, `total`, `status` (draft/sent/accepted/declined), `validUntil`, `publicToken`, `assignedTo`, `createdBy`, `currency`, `notes`, `terms` | M:1 → Company, Client, Lead, User. 1:M → QuotationItem, QuotationActivity. Unique: `[companyId, quotationNumber]`, `publicToken` |
| **QuotationItem** | `id`, `quotationId`, `description`, `hsn`, `quantity`, `rate`, `discountPercent`, `taxRateId`, `amount` | M:1 → Quotation, TaxRate. 1:M → QuotationItemTax |
| **QuotationActivity** | `id`, `quotationId`, `type` (viewed/email/signed/declined), `details` (JSON), `ipAddress`, `userAgent` | M:1 → Quotation |
| **QuotationTemplate** | `id`, `companyId`, `name`, `category`, `content` (JSON), `usageCount` | M:1 → Company |
| **Estimate** | `id`, `companyId`, `leadId`, `title`, `items` (JSON), `subtotal`, `tax`, `total`, `notes` | M:1 → Company, Lead |

### Invoicing & Billing (7)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Invoice** | `id`, `companyId`, `invoiceNumber` (auto: INV-{year}-{seq}), `clientId`, `projectId`, `type` (invoice/proforma/credit_note/debit_note), `items` (JSON), `subtotal`, `tax`, `total`, `status` (draft/sent/paid/overdue/cancelled/refunded), `dueDate`, `invoiceDate`, `publicToken`, `bankDetails` (JSON), `includeBankDetails`, `currency`, `notes`, `terms`, `recurringStatus` (active/inactive), `recurringFrequency`, `recurringNextDate`, `recurringCount` | M:1 → Company, Client, Project. 1:M → InvoiceItem, InvoiceActivity, Payment, Document. Unique: `[companyId, invoiceNumber]`, `publicToken` |
| **InvoiceItem** | `id`, `invoiceId`, `description`, `hsn`, `quantity`, `rate`, `discountPercent`, `taxRateId`, `amount` | M:1 → Invoice, TaxRate. 1:M → InvoiceItemTax |
| **InvoiceActivity** | `id`, `invoiceId`, `type` (viewed/email/paid/overdue), `details` (JSON), `ipAddress`, `userAgent` | M:1 → Invoice |
| **Payment** | `id`, `invoiceId`, `amount`, `method`, `transactionId`, `status`, `paymentDate`, `reference`, `notes` | M:1 → Invoice. Unique: `transactionId` |
| **TaxRate** | `id`, `companyId`, `name`, `rate`, `description`, `isActive`, `type` (CGST/SGST/IGST/ GST/cess/nil) | M:1 → Company. 1:M → InvoiceItem, InvoiceItemTax, QuotationItem, QuotationItemTax |
| **InvoiceItemTax** | `id`, `invoiceItemId`, `taxRateId`, `amount` | M:1 → InvoiceItem, TaxRate |
| **QuotationItemTax** | `id`, `quotationItemId`, `taxRateId`, `amount` | M:1 → QuotationItem, TaxRate |

### Subscription & Services (4)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Subscription** | `id`, `companyId`, `clientId`, `planId`, `status`, `startDate`, `nextBillingDate`, `amount`, `currency`, `billingCycle` (monthly/quarterly/yearly) | M:1 → Company, Client, SubscriptionPlan |
| **SubscriptionPlan** | `id`, `companyId`, `code`, `name`, `description`, `price`, `billingCycle`, `serviceId`, `features` (JSON), `isActive` | M:1 → Company, Service. 1:M → Subscription. Unique: `[companyId, code]` |
| **Service** | `id`, `companyId`, `code`, `name`, `description`, `category`, `defaultPrice`, `unit` | M:1 → Company. 1:M → SubscriptionPlan |
| **SalesTarget** | `id`, `companyId`, `employeeId`, `period`, `targetAmount`, `achievedAmount`, `commissionRate` | M:1 → Company, Employee |

### Accounting (7)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Account** (legacy) | `id`, `code`, `name`, `type`, `parentId`, `openingBalance`, `isActive` | 1:M → Transaction |
| **Transaction** (legacy) | `id`, `accountId`, `type` (debit/credit), `amount`, `description`, `reference`, `date` | M:1 → Account |
| **LedgerAccount** | `id`, `companyId`, `code`, `name`, `type` (asset/liability/expense/income/equity), `parentId`, `openingBalance`, `isActive`, `isLocked` | M:1 → Company. 1:M → JournalEntryLine, SalaryComponent. Unique: `[companyId, code]` |
| **JournalEntry** | `id`, `companyId`, `date`, `description`, `reference`, `status` (draft/posted), `createdById` | M:1 → Company. 1:M → JournalEntryLine |
| **JournalEntryLine** | `id`, `journalEntryId`, `accountId`, `debit`, `credit`, `description`, `reconciledAt` | M:1 → JournalEntry, LedgerAccount |
| **CoaTemplate** | `id`, `countryId`, `name`, `version`, `isActive` | M:1 → Country. 1:M → CoaTemplateEntry. Unique: `[countryId, version]` |
| **CoaTemplateEntry** | `id`, `templateId`, `code`, `name`, `type`, `parentCode`, `isActive` | M:1 → CoaTemplate. Unique: `[templateId, code]` |

### Contract Management (4)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Contract** | `id`, `companyId`, `clientId`, `projectId`, `title`, `content` (HTML), `value`, `currency`, `startDate`, `endDate`, `status` (draft/sent/signed/expired/terminated), `signedByClientAt`, `signedByCompanyAt`, `clientIp`, `templateId`, `creatorId`, `variables` (JSON) | M:1 → Company, Client, Project, User (creator), ContractTemplate. 1:M → ContractActivity |
| **ContractActivity** | `id`, `contractId`, `type` (viewed/mailed/signed/expired), `details` (JSON), `ipAddress`, `userAgent` | M:1 → Contract |
| **ContractTemplate** | `id`, `companyId`, `name`, `content` (HTML), `variables` (JSON), `isDefault` | M:1 → Company. 1:M → Contract |
| **DocumentTemplate** | `id`, `companyId`, `name`, `type`, `content`, `filePath`, `variables` (JSON), `header`, `footer`, `margins`, `letterheadMode` (none/first-page/every-page) | M:1 → Company |

### Project Management (14)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Project** | `id`, `companyId`, `clientId`, `name`, `description`, `status` (planning/active/on-hold/completed/cancelled), `priority`, `startDate`, `endDate`, `budget`, `currency`, `gitRepo`, `tags` (String[]) | M:1 → Company, Client. 1:M → Task, Sprint, Epic, Milestone, ProjectMember, ProjectNote, ActiveTimer, Timesheet, Contract, Invoice, Document, AutomationRule |
| **Task** | `id`, `projectId`, `parentId`, `title`, `description`, `type` (task/bug/feature/improvement), `status` (todo/in-progress/done/blocked), `priority`, `estimatedHours`, `actualHours`, `startDate`, `dueDate`, `sortOrder`, `epicId`, `sprintId`, `milestoneId`, `assignedToId`, `createdById`, `createdClientId`, `tags` (String[]) | M:1 → Project, Task (parent), Epic, Sprint, Milestone, User (assignee/creator), Client. Self-referencing via `parentId` ("SubTasks"). 1:M → TaskComment, TaskHistory, TaskWatcher, TaskAssignee, Timesheet, ActiveTimer, Document, TaskLink |
| **TaskComment** | `id`, `taskId`, `userId`, `clientId`, `content`, `parentId` | M:1 → Task, User, Client, TaskComment (parent). Self-referencing via `parentId` ("CommentReplies") |
| **TaskHistory** | `id`, `taskId`, `userId`, `clientId`, `field`, `oldValue`, `newValue`, `createdAt` | M:1 → Task, User, Client |
| **TaskWatcher** | `id`, `taskId`, `userId` | Unique: `[taskId, userId]` |
| **TaskAssignee** | `id`, `taskId`, `userId` | Unique: `[taskId, userId]` |
| **TaskLink** | `id`, `sourceId`, `targetId`, `type` (relates_to/duplicates/blocks/is_blocked_by) | M:1 → Task (source), Task (target) |
| **Sprint** | `id`, `projectId`, `name`, `goal`, `startDate`, `endDate`, `status` (future/active/completed) | M:1 → Project. 1:M → Task |
| **Epic** | `id`, `projectId`, `name`, `description`, `status` (todo/in-progress/done) | M:1 → Project. 1:M → Task |
| **Milestone** | `id`, `projectId`, `name`, `description`, `dueDate`, `status`, `clientReviewStatus` | M:1 → Project. 1:M → Task |
| **ProjectMember** | `id`, `projectId`, `employeeId`, `role` (manager/lead/member/viewer), `hourlyRate` | Unique: `[projectId, employeeId]` |
| **ProjectNote** | `id`, `projectId`, `title`, `content`, `createdBy` | M:1 → Project, User |
| **AutomationRule** | `id`, `projectId`, `name`, `trigger` (TASK_STATUS_CHANGE/TASK_CREATED/TASK_ASSIGNED/COMMENT_ADDED/MENTION_FOUND/TASK_REMINDER), `conditions` (JSON), `action` (send_email/notify), `actionConfig` (JSON), `isActive` | M:1 → Project. 1:M → AutomationLog |
| **AutomationLog** | `id`, `ruleId`, `eventType`, `status` (success/failed), `details` (JSON) | M:1 → AutomationRule |

### HRMS - Organization (6)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Employee** | `id`, `userId?`, `companyId`, `employeeId` (unique per company), `firstName`, `lastName`, `email`, `phone`, `dateOfBirth`, `dateOfJoining`, `gender`, `status` (active/inactive/terminated/resigned), `employmentType` (permanent/contract/trainee/intern), `departmentId`, `positionId`, `shiftId`, `panNumber`, `accountNumber`, `ifscCode`, `ptState`, `uan`, `pfNumber`, `esiNumber` (last 3 in `skills` JSON), `salary` (CTC), `createdById` | M:1 → Company, User (creator), Department, Position, Shift. 1:1 → User?, EmployeeSalaryStructure, ExitDetail. 1:M → Attendance, LeaveRequest, EmployeeLeaveBalance, LeaveAccrual, Payroll, TaxDeclaration, ProjectMember, SalesTarget, ShiftRoster, Timesheet, ActiveTimer, PerformanceReview, OKR, Asset, Document, Certificate, Expense, ExpenseApproval |
| **Department** | `id`, `companyId`, `name`, `description`, `headEmployeeId`, `email` | M:1 → Company. 1:M → Employee, Position. Unique: `[companyId, name]` |
| **Position** | `id`, `departmentId`, `title`, `description`, `minSalary`, `maxSalary` | M:1 → Department. 1:M → Employee. Unique: `[departmentId, title]` |
| **Shift** | `id`, `companyId`, `name`, `startTime`, `endTime`, `graceMinutes`, `lateThreshold`, `isNightShift`, `workingDays` (String[]) | M:1 → Company. 1:M → Employee, ShiftRoster |
| **ShiftRoster** | `id`, `employeeId`, `date`, `shiftId` | M:1 → Employee, Shift. Unique: `[employeeId, date]` |
| **Holiday** | `id`, `companyId`, `name`, `date`, `type` (national/regional/optional), `isActive` | M:1 → Company |

### HRMS - Attendance & Leave (6)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Attendance** | `id`, `employeeId`, `date`, `status` (present/absent/half-day/onLeaveButPresent/week-off/holiday), `checkIn`, `checkOut`, `checkInLocation`, `checkOutLocation`, `checkInIp`, `overtimeMinutes`, `notes` | M:1 → Employee. Unique: `[employeeId, date]` |
| **LeaveType** | `id`, `name`, `description`, `daysAllowed`, `isPaid`, `encashable`, `accruable`, `accrualRate`, `maxAccrual`, `requiresAttachment`, `departmentIds` (String[]), `positionIds` (String[]), `genderRestriction`, `minServiceDays` | 1:M → EmployeeLeaveBalance, LeaveAccrual, LeaveRequest |
| **LeaveRequest** | `id`, `employeeId`, `leaveTypeId`, `startDate`, `endDate`, `durationType` (full/half-day), `reason`, `status` (pending/approved/rejected/cancelled), `rejectionReason`, `appliedAt`, `attachmentUrl`, `lopDays` | M:1 → Employee, LeaveType |
| **EmployeeLeaveBalance** | `id`, `employeeId`, `leaveTypeId`, `year`, `totalDays`, `usedDays`, `pendingDays`, `remainingDays` | M:1 → Employee, LeaveType. Unique: `[employeeId, leaveTypeId, year]` |
| **LeaveAccrual** | `id`, `employeeId`, `leaveTypeId`, `year`, `month`, `accruedDays`, `processedAt` | M:1 → Employee, LeaveType. Unique: `[employeeId, leaveTypeId, year, month]` |
| **ActiveTimer** | `id`, `employeeId`, `projectId`, `taskId`, `startTime`, `pausedAt`, `totalPausedDuration`, `description`, `isRunning` | M:1 → Employee, Project, Task |

### Payroll (11)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Payroll** | `id`, `employeeId`, `month`, `year`, `basicSalary`, `allowances`, `deductions`, `earningsBreakdown` (JSON), `deductionsBreakdown` (JSON), `grossSalary`, `netSalary`, `status` (draft/processed/paid), `processedAt`, `paymentDate`, `notes` | M:1 → Employee |
| **SalaryComponent** | `id`, `companyId`, `name`, `type` (earning/deduction), `calculationType` (flat/percentage/formula), `defaultValue`, `ledgerAccountId`, `isActive`, `formula`, `sortOrder` | M:1 → Company, LedgerAccount. 1:M → EmployeeSalaryComponent, SalaryTemplateComponent |
| **SalaryTemplate** | `id`, `companyId`, `name`, `description`, `totalCtc`, `isActive` | M:1 → Company. 1:M → SalaryTemplateComponent, EmployeeSalaryStructure. Unique: `[companyId, name]` |
| **SalaryTemplateComponent** | `id`, `templateId`, `componentId`, `value`, `isActive` | M:1 → SalaryTemplate, SalaryComponent. Unique: `[templateId, componentId]` |
| **StatutoryConfig** | `id`, `companyId` (unique), `pfEmployerContribution%`, `pfEmployeeContribution%`, `pfWageCeiling`, `esiEmployerContribution%`, `esiEmployeeContribution%`, `esiWageCeiling`, `ptSlabs` (JSON), `professionalTaxEnabled`, `salaryPayableAccountId`, `pfPayableAccountId`, `esiPayableAccountId`, `ptPayableAccountId`, `tdsPayableAccountId` | 1:1 → Company |
| **TaxDeclaration** | `id`, `employeeId`, `financialYear`, `regime` (new/old), `status` (draft/submitted/approved), `totalAmount`, `submittedAt` | M:1 → Employee. 1:M → TaxInvestment. Unique: `[employeeId, financialYear]` |
| **TaxInvestment** | `id`, `declarationId`, `section` (80C/80D/80G/24B/other), `componentName`, `declaredAmount`, `approvedAmount`, `status` (pending/approved/rejected), `proofUrl`, `rejectionReason` | M:1 → TaxDeclaration |
| **EmployeeSalaryStructure** | `id`, `employeeId` (1:1 unique), `templateId`, `effectiveFrom`, `totalCtc` | 1:1 → Employee. M:1 → SalaryTemplate. 1:M → EmployeeSalaryComponent |
| **EmployeeSalaryComponent** | `id`, `structureId`, `componentId`, `value`, `isActive` | M:1 → EmployeeSalaryStructure, SalaryComponent. Unique: `[structureId, componentId]` |
| **StatutoryRule** | `id`, `countryId`, `companyId`, `name`, `code`, `category` (retirement/health/tax/social), `ruleType` (percentage/slab/fixed), `effectiveFrom`, `effectiveTo`, `conditions` (JSON = wage types, min/max), `rate`, `slabs` (JSON), `employerRate`, `employeeRate`, `description` | M:1 → Country, Company |
| **UnitType** | `id`, `companyId`, `name`, `symbol`, `isActive` | M:1 → Company |

### Recruitment (8)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **JobOpening** | `id`, `companyId`, `title`, `description`, `department`, `position`, `location`, `employmentType`, `minSalary`, `maxSalary`, `skills` (String[]), `status` (open/closed/draft), `publicId`, `postedAt`, `closingDate` | M:1 → Company. 1:M → Candidate. Unique: `publicId` |
| **Candidate** | `id`, `companyId`, `jobOpeningId`, `firstName`, `lastName`, `email`, `phone`, `resumeUrl`, `status` (applied/screened/interviewed/offered/hired/rejected), `stage`, `skills` (String[]), `experience`, `education`, `currentCompany`, `currentCtc`, `expectedCtc`, `noticePeriod`, `notes`, `source`, `appliedAt` | M:1 → Company, JobOpening. 1:M → Interview. 1:1 → OfferLetter, BackgroundVerification, OnboardingChecklist |
| **Interview** | `id`, `candidateId`, `round`, `type` (in-person/video/telephonic), `scheduledAt`, `duration`, `interviewerId`, `meetingLink`, `feedback`, `rating`, `status` (scheduled/completed/cancelled/rescheduled) | M:1 → Candidate. 1:1 → InterviewScorecard |
| **InterviewScorecard** | `id`, `interviewId` (1:1 unique), `scores` (JSON), `overallRating`, `recommendation` (strong-hire/hire/ maybe/no), `remarks` | 1:1 → Interview |
| **OfferLetter** | `id`, `candidateId` (1:1 unique), `position`, `department`, `salary`, `startDate`, `status` (draft/sent/accepted/declined), `content` (HTML), `sentAt`, `respondedAt` | 1:1 → Candidate |
| **EmailTemplate** (Recruitment) | `id`, `companyId`, `name`, `type`, `subject`, `body` (HTML), `variables` (JSON) | M:1 → Company |
| **BackgroundVerification** | `id`, `candidateId` (1:1 unique), `status`, `vendor`, `reportUrl`, `verifiedAt`, `remarks` | 1:1 → Candidate |
| **OnboardingChecklist** | `id`, `candidateId` (1:1 unique), `tasks` (JSON), `status` (pending/in-progress/completed) | 1:1 → Candidate |

### LMS / Academy (10)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Student** | `id`, `companyId`, `userId?`, `studentId` (unique per company), `firstName`, `lastName`, `email`, `phone`, `dateOfBirth`, `status` (active/inactive/suspended), `enrolledAt` | M:1 → Company. 1:1 → User?. 1:M → CourseEnrollment, Certificate, LectureProgress, ExamSubmission. Unique: `[companyId, studentId]` |
| **Course** | `id`, `companyId`, `courseCode` (unique per company), `title`, `description`, `duration`, `price`, `thumbnail`, `status` (draft/published/archived), `instructor`, `maxStudents`, `startDate`, `endDate`, `syllabus` (JSON) | M:1 → Company. 1:M → CourseEnrollment, OnlineClass, Lecture, Exam. Unique: `[companyId, courseCode]` |
| **CourseEnrollment** | `id`, `companyId`, `studentId`, `courseId`, `status` (active/completed/dropped), `enrolledAt`, `completedAt`, `grade`, `progressPercent` | M:1 → Company, Student, Course. Unique: `[studentId, courseId]` |
| **OnlineClass** | `id`, `companyId`, `courseId`, `title`, `description`, `schedule`, `duration`, `meetingLink`, `instructor`, `recordingUrl` | M:1 → Company, Course |
| **Lecture** | `id`, `companyId`, `courseId`, `title`, `description`, `videoUrl`, `duration`, `orderIndex`, `content` (HTML), `isFree` | M:1 → Company, Course. 1:M → LectureProgress |
| **LectureProgress** | `id`, `studentId`, `lectureId`, `completed`, `completedAt`, `watchedDuration` | M:1 → Student, Lecture. Unique: `[studentId, lectureId]` |
| **Exam** | `id`, `companyId`, `courseId`, `title`, `description`, `duration`, `passingScore`, `maxScore`, `status` (draft/published/closed) | M:1 → Company, Course. 1:M → ExamQuestion, ExamSubmission |
| **ExamQuestion** | `id`, `examId`, `question`, `options` (JSON), `correctAnswer`, `points`, `orderIndex`, `type` (mcq/true-false/descriptive) | M:1 → Exam |
| **ExamSubmission** | `id`, `studentId`, `examId`, `answers` (JSON), `score`, `status` (in-progress/submitted/graded), `submittedAt`, `gradedBy`, `remarks` | M:1 → Student, Exam |
| **Certificate** | `id`, `companyId`, `type` (course/internship/experience/completion), `certificateNo` (unique), `employeeId`, `studentId`, `candidateId`, `templateId`, `title`, `description`, `status` (draft/issued/revoked), `issuedDate`, `revokedDate`, `revocationReason`, `metadata` (JSON) | M:1 → Company, Employee?, Student?, CertificateTemplate |
| **CertificateTemplate** | `id`, `companyId`, `name`, `type`, `content` (HTML with variables), `variables` (JSON), `orientation`, `backgroundImage`, `isDefault` | M:1 → Company. 1:M → Certificate |

### Performance & OKR (4)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **PerformanceReviewCycle** | `id`, `companyId`, `name`, `period` (quarterly/half_yearly/annual), `startDate`, `endDate`, `status` (active/closed) | M:1 → Company. 1:M → PerformanceReview |
| **PerformanceReview** | `id`, `companyId`, `employeeId`, `cycleId`, `reviewerId`, `selfRating`, `managerRating`, `overallRating`, `goals` (JSON), `feedback`, `status` (draft/submitted/completed), `submittedAt`, `completedAt` | M:1 → Company, Employee, PerformanceReviewCycle |
| **OKR** | `id`, `companyId`, `employeeId`, `title`, `description`, `periodType` (quarterly/half_yearly/annual), `periodStart`, `periodEnd`, `status` (active/completed/cancelled), `weightage` | M:1 → Company, Employee. 1:M → KeyResult |
| **KeyResult** | `id`, `okrId`, `title`, `description`, `startValue`, `currentValue`, `targetValue`, `unit`, `weightage` | M:1 → OKR |

### Support & Expenses (6)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Ticket** | `id`, `companyId`, `subject`, `description`, `status` (open/in-progress/resolved/closed), `priority` (low/medium/high/urgent), `type`, `assignedToId`, `createdById`, `source` (portal/email/internal) | M:1 → Company, User (assignee), User (creator). 1:M → TicketComment, TicketMessage |
| **TicketComment** | `id`, `ticketId`, `userId`, `content` | M:1 → Ticket, User |
| **TicketMessage** | `id`, `ticketId`, `senderId`, `content`, `isInternal`, `attachments` (JSON) | M:1 → Ticket, User |
| **Expense** | `id`, `companyId`, `employeeId`, `category`, `amount`, `description`, `date`, `status` (pending/under_review/approved/rejected/paid), `receiptUrl`, `notes`, `billable` | M:1 → Company, Employee. 1:M → ExpenseApproval |
| **ExpenseApproval** | `id`, `expenseId`, `approverId`, `level`, `status` (pending/approved/rejected), `comment`, `actionAt` | M:1 → Expense, Employee (approver). Unique: `[expenseId, level]` |
| **ExpenseApprovalConfig** | `id`, `companyId`, `level`, `minAmount`, `maxAmount`, `approverDesignation` | M:1 → Company. Unique: `[companyId, level]` |

### Documents & Assets (4)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Document** | `id`, `companyId`, `clientId`, `employeeId`, `invoiceId`, `projectId`, `taskId`, `type`, `category`, `name`, `filePath`, `fileSize`, `mimeType`, `status` (draft/pending/approved/rejected), `notes`, `uploadedById` | M:1 → Company, Client, Employee, Invoice, Project, Task, User |
| **Asset** | `id`, `companyId`, `name`, `type` (laptop/phone/accessory/vehicle/other), `serialNumber`, `model`, `purchaseDate`, `purchasePrice`, `status` (assigned/available/under-repair/retired), `employeeId`, `assignedAt`, `returnedAt`, `condition` | M:1 → Company, Employee. Unique: `[companyId, serialNumber]` |
| **Policy** | `id`, `companyId`, `title`, `content` (HTML), `category`, `fileUrl`, `effectiveDate`, `version`, `createdBy` | M:1 → Company, User |
| **Expense** | (see Support & Expenses above) |

### Communication (4)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **EmailLog** | `id`, `companyId`, `from`, `to`, `cc`, `bcc`, `subject`, `body`, `status` (sent/failed/queued), `provider`, `sentAt`, `errorMessage`, `metadata` (JSON) | M:1 → Company |
| **EmailTemplate** | `id`, `companyId`, `name`, `type`, `subject`, `body` (HTML), `variables` (JSON) | M:1 → Company |
| **Notification** | `id`, `userId`, `companyId`, `type`, `title`, `message`, `link`, `isRead`, `metadata` (JSON) | M:1 → User |
| **Timesheet** | `id`, `employeeId`, `projectId`, `taskId`, `date`, `startTime`, `endTime`, `duration`, `description`, `status` (draft/submitted/approved/rejected), `approvedById`, `approvedAt` | M:1 → Employee, Project, Task |

## Key Indexes & Constraints
- **119 total models**, all use `String` UUIDs with `@default(uuid())`
- **All monetary fields** use `@db.Decimal(precision, scale)` (precision 12-15, scale 2-8)
- **JSON fields** used extensively for flexible/schema-less data
- **String[] arrays** for PostgreSQL native array support (tags, enabledModules, etc.)
- **Cascade deletes** on most parent-child relationships
- **No Prisma enums** — all enum-like fields are `String` with application-layer validation
