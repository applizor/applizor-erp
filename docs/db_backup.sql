--
-- PostgreSQL database dump
--

\restrict hnbYQhCsz94SKrR5TPr9EnqvqMIr99eJSXU1jSlallMJXNGG00WZoyhk54rhhxI

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: applizor
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO applizor;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: applizor
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "parentId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Account" OWNER TO applizor;

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "serialNumber" text,
    status text DEFAULT 'Available'::text NOT NULL,
    "purchaseDate" timestamp(3) without time zone,
    price double precision,
    "employeeId" text,
    "assignedDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Asset" OWNER TO applizor;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    "checkIn" timestamp(3) without time zone,
    "checkOut" timestamp(3) without time zone,
    status text DEFAULT 'present'::text NOT NULL,
    "ipAddress" text,
    location text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Attendance" OWNER TO applizor;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "companyId" text,
    "userId" text,
    action text NOT NULL,
    module text NOT NULL,
    "entityType" text,
    "entityId" text,
    details text,
    changes jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO applizor;

--
-- Name: Branch; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Branch" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    code text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India'::text NOT NULL,
    pincode text,
    phone text,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Branch" OWNER TO applizor;

--
-- Name: Candidate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Candidate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "jobOpeningId" text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    phone text,
    "resumePath" text,
    status text DEFAULT 'applied'::text NOT NULL,
    "currentStage" text,
    notes text,
    rating double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Candidate" OWNER TO applizor;

--
-- Name: Client; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Client" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India'::text NOT NULL,
    pincode text,
    gstin text,
    pan text,
    status text DEFAULT 'active'::text NOT NULL,
    "clientType" text DEFAULT 'customer'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    password text,
    "portalAccess" boolean DEFAULT false NOT NULL,
    "lastLogin" timestamp(3) without time zone
);


ALTER TABLE public."Client" OWNER TO applizor;

--
-- Name: Company; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    name text NOT NULL,
    "legalName" text,
    email text,
    phone text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India'::text NOT NULL,
    pincode text,
    gstin text,
    pan text,
    logo text,
    "letterheadDoc" text,
    "allowedIPs" text,
    latitude double precision,
    longitude double precision,
    radius integer DEFAULT 100 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "enabledModules" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    tan text
);


ALTER TABLE public."Company" OWNER TO applizor;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Department" OWNER TO applizor;

--
-- Name: Document; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    "companyId" text,
    "clientId" text,
    "invoiceId" text,
    "employeeId" text,
    "projectId" text,
    name text NOT NULL,
    type text NOT NULL,
    category text,
    "filePath" text NOT NULL,
    "fileSize" integer,
    "mimeType" text,
    version integer DEFAULT 1 NOT NULL,
    "isTemplate" boolean DEFAULT false NOT NULL,
    tags text[],
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Document" OWNER TO applizor;

--
-- Name: DocumentTemplate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."DocumentTemplate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    "filePath" text NOT NULL,
    "letterheadMode" text DEFAULT 'NONE'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DocumentTemplate" OWNER TO applizor;

--
-- Name: EmailTemplate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."EmailTemplate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    type text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmailTemplate" OWNER TO applizor;

--
-- Name: Employee; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" text,
    "employeeId" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    phone text,
    gender text,
    "bloodGroup" text,
    "maritalStatus" text,
    "dateOfBirth" timestamp(3) without time zone,
    "dateOfJoining" timestamp(3) without time zone NOT NULL,
    "currentAddress" text,
    "permanentAddress" text,
    "emergencyContact" jsonb,
    "bankName" text,
    "accountNumber" text,
    "ifscCode" text,
    "panNumber" text,
    "aadhaarNumber" text,
    "departmentId" text,
    "positionId" text,
    "shiftId" text,
    salary numeric(12,2),
    "salaryStructure" jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "employmentType" text,
    "hourlyRate" numeric(10,2),
    "noticePeriodEndDate" timestamp(3) without time zone,
    "noticePeriodStartDate" timestamp(3) without time zone,
    "probationEndDate" timestamp(3) without time zone,
    skills jsonb,
    "slackMemberId" text,
    "probationProcessed" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Employee" OWNER TO applizor;

--
-- Name: EmployeeLeaveBalance; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."EmployeeLeaveBalance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveTypeId" text NOT NULL,
    year integer NOT NULL,
    allocated double precision DEFAULT 0 NOT NULL,
    "carriedOver" double precision DEFAULT 0 NOT NULL,
    used double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmployeeLeaveBalance" OWNER TO applizor;

--
-- Name: EmployeeSalaryComponent; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."EmployeeSalaryComponent" (
    id text NOT NULL,
    "structureId" text NOT NULL,
    "componentId" text NOT NULL,
    "monthlyAmount" numeric(12,2) NOT NULL
);


ALTER TABLE public."EmployeeSalaryComponent" OWNER TO applizor;

--
-- Name: EmployeeSalaryStructure; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."EmployeeSalaryStructure" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "netSalary" numeric(12,2) NOT NULL,
    ctc numeric(12,2) NOT NULL,
    "effectiveDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmployeeSalaryStructure" OWNER TO applizor;

--
-- Name: Estimate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Estimate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "leadId" text,
    title text NOT NULL,
    description text,
    "estimatedValue" numeric(12,2) NOT NULL,
    timeframe text,
    status text DEFAULT 'draft'::text NOT NULL,
    "convertedToQuotationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Estimate" OWNER TO applizor;

--
-- Name: Holiday; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Holiday" (
    id text NOT NULL,
    name text NOT NULL,
    date date NOT NULL,
    type text DEFAULT 'national'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Holiday" OWNER TO applizor;

--
-- Name: Interview; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Interview" (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    round integer NOT NULL,
    type text NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    interviewer text,
    feedback text,
    rating integer,
    status text DEFAULT 'scheduled'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Interview" OWNER TO applizor;

--
-- Name: InterviewScorecard; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."InterviewScorecard" (
    id text NOT NULL,
    "interviewId" text NOT NULL,
    technical integer DEFAULT 0 NOT NULL,
    communication integer DEFAULT 0 NOT NULL,
    "problemSolving" integer DEFAULT 0 NOT NULL,
    "cultureFit" integer DEFAULT 0 NOT NULL,
    comments text,
    "submittedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."InterviewScorecard" OWNER TO applizor;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text NOT NULL,
    "invoiceNumber" text NOT NULL,
    "invoiceDate" date NOT NULL,
    "dueDate" date NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    type text DEFAULT 'invoice'::text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    terms text,
    subtotal numeric(12,2) NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    "paidAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "recurringId" text,
    notes text,
    "pdfPath" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO applizor;

--
-- Name: InvoiceItem; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."InvoiceItem" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    description text NOT NULL,
    "hsnCode" text,
    quantity numeric(10,2) NOT NULL,
    rate numeric(12,2) NOT NULL,
    "taxRate" numeric(5,2) DEFAULT 0 NOT NULL,
    amount numeric(12,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."InvoiceItem" OWNER TO applizor;

--
-- Name: JobOpening; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."JobOpening" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    title text NOT NULL,
    department text,
    "position" text,
    description text,
    requirements text,
    status text DEFAULT 'open'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."JobOpening" OWNER TO applizor;

--
-- Name: JournalEntry; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."JournalEntry" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    date date NOT NULL,
    reference text,
    description text,
    status text DEFAULT 'draft'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."JournalEntry" OWNER TO applizor;

--
-- Name: JournalEntryLine; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."JournalEntryLine" (
    id text NOT NULL,
    "journalEntryId" text NOT NULL,
    "accountId" text NOT NULL,
    debit numeric(15,2) DEFAULT 0 NOT NULL,
    credit numeric(15,2) DEFAULT 0 NOT NULL,
    description text
);


ALTER TABLE public."JournalEntryLine" OWNER TO applizor;

--
-- Name: Lead; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Lead" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    company text,
    source text,
    status text DEFAULT 'new'::text NOT NULL,
    stage text DEFAULT 'lead'::text NOT NULL,
    value numeric(12,2),
    notes text,
    "assignedTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "assignedAt" timestamp(3) without time zone,
    "convertedAt" timestamp(3) without time zone,
    "convertedToClientId" text,
    "createdBy" text,
    industry text,
    "jobTitle" text,
    "lastContactedAt" timestamp(3) without time zone,
    "nextFollowUpAt" timestamp(3) without time zone,
    priority text DEFAULT 'medium'::text NOT NULL,
    probability integer DEFAULT 0 NOT NULL,
    "sourceDetails" text,
    tags text[] DEFAULT ARRAY[]::text[],
    website text
);


ALTER TABLE public."Lead" OWNER TO applizor;

--
-- Name: LeadActivity; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."LeadActivity" (
    id text NOT NULL,
    "leadId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    outcome text,
    "scheduledAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    "reminderSent" boolean DEFAULT false NOT NULL,
    "reminderTime" timestamp(3) without time zone,
    "assignedTo" text,
    "createdBy" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LeadActivity" OWNER TO applizor;

--
-- Name: LeaveAccrual; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."LeaveAccrual" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveTypeId" text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    "accruedDays" double precision NOT NULL,
    "totalAccrued" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LeaveAccrual" OWNER TO applizor;

--
-- Name: LeaveRequest; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."LeaveRequest" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveTypeId" text NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    days double precision NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    "approvedBy" text,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "assignedBy" text,
    "attachmentPath" text,
    "durationType" text DEFAULT 'full'::text NOT NULL,
    category text,
    "lopDays" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."LeaveRequest" OWNER TO applizor;

--
-- Name: LeaveType; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."LeaveType" (
    id text NOT NULL,
    name text NOT NULL,
    days integer DEFAULT 0 NOT NULL,
    "isPaid" boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    frequency text DEFAULT 'yearly'::text NOT NULL,
    "carryForward" boolean DEFAULT true NOT NULL,
    "maxCarryForward" integer DEFAULT 0 NOT NULL,
    "monthlyLimit" integer DEFAULT 0 NOT NULL,
    "accrualRate" double precision DEFAULT 0 NOT NULL,
    "accrualStartMonth" integer DEFAULT 1 NOT NULL,
    "accrualType" text DEFAULT 'yearly'::text NOT NULL,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    "departmentIds" text[] DEFAULT ARRAY[]::text[],
    "employmentStatus" text[] DEFAULT ARRAY[]::text[],
    encashable boolean DEFAULT false NOT NULL,
    "maxAccrual" double precision DEFAULT 0 NOT NULL,
    "maxConsecutiveDays" integer DEFAULT 0 NOT NULL,
    "minServiceDays" integer DEFAULT 0 NOT NULL,
    "positionIds" text[] DEFAULT ARRAY[]::text[],
    "proofRequired" boolean DEFAULT false NOT NULL,
    "sandwichRule" boolean DEFAULT false NOT NULL,
    "policySettings" jsonb,
    "confirmationBonus" double precision DEFAULT 0 NOT NULL,
    "probationQuota" double precision DEFAULT 0 NOT NULL,
    "quarterlyLimit" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."LeaveType" OWNER TO applizor;

--
-- Name: LedgerAccount; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."LedgerAccount" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric(15,2) DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LedgerAccount" OWNER TO applizor;

--
-- Name: OfferLetter; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."OfferLetter" (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    "position" text NOT NULL,
    department text,
    salary numeric(12,2) NOT NULL,
    "startDate" date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "documentPath" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OfferLetter" OWNER TO applizor;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "invoiceId" text,
    amount numeric(12,2) NOT NULL,
    "paymentDate" date NOT NULL,
    "paymentMethod" text NOT NULL,
    gateway text,
    "transactionId" text,
    "gatewayOrderId" text,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO applizor;

--
-- Name: Payroll; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Payroll" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "basicSalary" numeric(12,2) NOT NULL,
    allowances numeric(12,2) DEFAULT 0 NOT NULL,
    deductions numeric(12,2) DEFAULT 0 NOT NULL,
    "earningsBreakdown" jsonb,
    "deductionsBreakdown" jsonb,
    "grossSalary" numeric(12,2) NOT NULL,
    "netSalary" numeric(12,2) NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "processedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payroll" OWNER TO applizor;

--
-- Name: Position; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Position" (
    id text NOT NULL,
    "departmentId" text NOT NULL,
    title text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Position" OWNER TO applizor;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text,
    name text NOT NULL,
    description text,
    status text DEFAULT 'planning'::text NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    budget numeric(12,2),
    "isBillable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Project" OWNER TO applizor;

--
-- Name: Quotation; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Quotation" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "leadId" text,
    "clientId" text,
    "quotationNumber" text NOT NULL,
    title text NOT NULL,
    description text,
    "quotationDate" date NOT NULL,
    "validUntil" date NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "paymentTerms" text,
    "deliveryTerms" text,
    notes text,
    "pdfPath" text,
    "templateId" text,
    "publicToken" text,
    "publicExpiresAt" timestamp(3) without time zone,
    "isPublicEnabled" boolean DEFAULT false NOT NULL,
    "clientViewedAt" timestamp(3) without time zone,
    "clientAcceptedAt" timestamp(3) without time zone,
    "clientRejectedAt" timestamp(3) without time zone,
    "clientSignature" text,
    "clientEmail" text,
    "clientName" text,
    "clientComments" text,
    "signedPdfPath" text,
    "convertedToInvoiceId" text,
    "convertedAt" timestamp(3) without time zone,
    "createdBy" text,
    "assignedTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "emailOpens" integer DEFAULT 0 NOT NULL,
    "lastEmailOpenedAt" timestamp(3) without time zone,
    "lastViewedAt" timestamp(3) without time zone,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "maxReminders" integer DEFAULT 3 NOT NULL,
    "nextReminderAt" timestamp(3) without time zone,
    "reminderCount" integer DEFAULT 0 NOT NULL,
    "reminderFrequency" text
);


ALTER TABLE public."Quotation" OWNER TO applizor;

--
-- Name: QuotationActivity; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."QuotationActivity" (
    id text NOT NULL,
    "quotationId" text NOT NULL,
    type text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    location text,
    "deviceType" text,
    browser text,
    os text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."QuotationActivity" OWNER TO applizor;

--
-- Name: QuotationItem; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."QuotationItem" (
    id text NOT NULL,
    "quotationId" text NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    "unitPrice" numeric(12,2) NOT NULL,
    tax numeric(5,2) DEFAULT 0 NOT NULL,
    discount numeric(5,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL
);


ALTER TABLE public."QuotationItem" OWNER TO applizor;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Role" OWNER TO applizor;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."RolePermission" (
    id text NOT NULL,
    "roleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createLevel" text DEFAULT 'none'::text NOT NULL,
    "deleteLevel" text DEFAULT 'none'::text NOT NULL,
    module text NOT NULL,
    "readLevel" text DEFAULT 'none'::text NOT NULL,
    "updateLevel" text DEFAULT 'none'::text NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO applizor;

--
-- Name: SalaryComponent; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."SalaryComponent" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "calculationType" text NOT NULL,
    "defaultValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SalaryComponent" OWNER TO applizor;

--
-- Name: SalesTarget; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."SalesTarget" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "employeeId" text NOT NULL,
    period text NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    "targetAmount" numeric(12,2) NOT NULL,
    "achievedAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SalesTarget" OWNER TO applizor;

--
-- Name: Shift; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Shift" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "breakDuration" integer DEFAULT 60 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "workDays" jsonb
);


ALTER TABLE public."Shift" OWNER TO applizor;

--
-- Name: ShiftRoster; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."ShiftRoster" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "shiftId" text NOT NULL,
    date date NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ShiftRoster" OWNER TO applizor;

--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text NOT NULL,
    name text NOT NULL,
    plan text NOT NULL,
    amount numeric(12,2) NOT NULL,
    "billingCycle" text DEFAULT 'monthly'::text NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date,
    status text DEFAULT 'active'::text NOT NULL,
    "nextBillingDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Subscription" OWNER TO applizor;

--
-- Name: Task; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'todo'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "createdById" text NOT NULL,
    "assignedToId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Task" OWNER TO applizor;

--
-- Name: Timesheet; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Timesheet" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "projectId" text,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    hours numeric(5,2) NOT NULL,
    "isBillable" boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Timesheet" OWNER TO applizor;

--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    description text,
    reference text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Transaction" OWNER TO applizor;

--
-- Name: User; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "companyId" text
);


ALTER TABLE public."User" OWNER TO applizor;

--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."UserRole" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserRole" OWNER TO applizor;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO applizor;

--
-- Name: quotation_templates; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public.quotation_templates (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    title text NOT NULL,
    "templateDescription" text NOT NULL,
    "paymentTerms" text,
    "deliveryTerms" text,
    notes text,
    items jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.quotation_templates OWNER TO applizor;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Account" (id, code, name, type, "parentId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Asset" (id, "companyId", name, type, "serialNumber", status, "purchaseDate", price, "employeeId", "assignedDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Attendance" (id, "employeeId", date, "checkIn", "checkOut", status, "ipAddress", location, notes, "createdAt", "updatedAt") FROM stdin;
4b1cdb0c-de85-490b-a749-59c942dcfdc9	a179f413-6a5a-4006-be37-3452bae28bf8	2026-01-21	2026-01-21 12:28:38.923	\N	present	::ffff:192.168.65.1	18.604278392825247,73.73216422656192	\N	2026-01-21 12:28:38.924	2026-01-21 12:28:38.924
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."AuditLog" (id, "companyId", "userId", action, module, "entityType", "entityId", details, changes, "ipAddress", "userAgent", "createdAt") FROM stdin;
ac7e6e42-68d9-4432-b319-4b7781161026	\N	\N	LOGIN	AUTH	User	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:54:02.966
79049195-a5b6-49d8-8615-1e6c6c059cdb	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	DELETE	LEAVE	LeaveType	90ccb767-3c5e-4913-8aba-e800e4fcadac	Deleted Leave Type (ID: 90ccb767-3c5e-4913-8aba-e800e4fcadac)	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:55:04.4
dc70b531-18c0-4a4c-8543-a0a152ef84d3	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	UPDATE	LEAVE	LeaveType	0bcddcf5-794b-46d3-a148-b6e84a49f0b1	Updated Leave Type: CL	{"id": "0bcddcf5-794b-46d3-a148-b6e84a49f0b1", "days": 4, "name": "CL", "color": "#3B82F6", "isPaid": true, "createdAt": "2026-01-21T11:53:54.148Z", "frequency": "yearly", "updatedAt": "2026-01-21T11:54:11.591Z", "encashable": false, "maxAccrual": 0, "accrualRate": 0, "accrualType": "yearly", "description": null, "positionIds": [], "carryForward": true, "monthlyLimit": 2, "noticePeriod": 0, "sandwichRule": false, "departmentIds": [], "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 0, "minDaysForProof": 0, "minDaysForNotice": 0, "includeNonWorkingDays": false}, "probationQuota": 0, "quarterlyLimit": 0, "maxCarryForward": 5, "minDaysForProof": 0, "employmentStatus": [], "minDaysForNotice": 0, "accrualStartMonth": 1, "confirmationBonus": 0, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:56:03.147
f2ee3c76-d458-4bae-98d4-4b3259992d44	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	UPDATE	LEAVE	LeaveType	f1ddfe98-0bc3-49fb-b17d-b3dad69fc5cd	Updated Leave Type: SL	{"id": "f1ddfe98-0bc3-49fb-b17d-b3dad69fc5cd", "days": 4, "name": "SL", "color": "#3B82F6", "isPaid": true, "createdAt": "2026-01-21T11:53:54.158Z", "frequency": "yearly", "updatedAt": "2026-01-21T11:54:11.601Z", "encashable": false, "maxAccrual": 0, "accrualRate": 0, "accrualType": "yearly", "description": null, "positionIds": [], "carryForward": true, "monthlyLimit": 2, "noticePeriod": 0, "sandwichRule": false, "departmentIds": [], "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 0, "minDaysForProof": 2, "minDaysForNotice": 0, "includeNonWorkingDays": false}, "probationQuota": 0, "quarterlyLimit": 0, "maxCarryForward": 5, "minDaysForProof": 2, "employmentStatus": [], "minDaysForNotice": 0, "accrualStartMonth": 1, "confirmationBonus": 0, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:56:07.466
0ecd699a-b252-4703-ba54-cf7f083ecc46	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	DELETE	HRMS	Employee	464c0418-410a-41f7-99b3-62e80ab9d861	Deleted employee record	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:56:44.169
c993761f-1b32-46ad-a4c7-153d7f5d8a13	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	CREATE	HRMS	Employee	9338c5e0-3c14-455f-82f1-994177653b6b	Created employee emp1 emp1 (ID: EMP-0001)	{"email": "emp1@test.com", "phone": "", "roleId": "2af33051-91e2-49b0-be8e-e879b80dc41c", "status": "active", "bankName": "", "ifscCode": "", "lastName": "emp1", "password": "emp1", "firstName": "emp1", "panNumber": "", "employeeId": "", "positionId": "020858a5-3766-4388-99cb-39f9af2c2879", "departmentId": "a9e50298-d5db-4b87-8ab6-a8e12194321d", "aadhaarNumber": "", "accountNumber": "", "createAccount": true, "dateOfJoining": "2026-04-01", "currentAddress": "", "employmentType": "Full Time", "permanentAddress": "", "probationEndDate": "2026-06-01"}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:57:28.245
95534946-dae6-445d-b411-9a60f03bd4d1	\N	\N	LOGIN	AUTH	User	c2d77578-f28c-4c7c-91fb-e6d35e100134	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:57:32.104
cc295aa8-f6c0-498c-bc02-a3d71f741d9c	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	DELETE	HRMS	Employee	9338c5e0-3c14-455f-82f1-994177653b6b	Deleted employee record	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:57:59.346
56fdd9f6-efc6-4b2a-bfc8-a4c489c71a9e	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	UPDATE	LEAVE	LeaveType	0bcddcf5-794b-46d3-a148-b6e84a49f0b1	Updated Leave Type: CL	{"id": "0bcddcf5-794b-46d3-a148-b6e84a49f0b1", "days": 4, "name": "CL", "color": "#3B82F6", "isPaid": true, "createdAt": "2026-01-21T11:53:54.148Z", "frequency": "yearly", "updatedAt": "2026-01-21T11:56:03.136Z", "encashable": false, "maxAccrual": 0, "accrualRate": 0, "accrualType": "yearly", "description": null, "positionIds": [], "carryForward": true, "monthlyLimit": 2, "noticePeriod": 0, "sandwichRule": false, "departmentIds": [], "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 0, "minDaysForProof": 2, "minDaysForNotice": 0, "includeNonWorkingDays": false}, "probationQuota": 0, "quarterlyLimit": 0, "maxCarryForward": 5, "minDaysForProof": 2, "employmentStatus": [], "minDaysForNotice": 0, "accrualStartMonth": 1, "confirmationBonus": 0, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:58:22.583
826ae3c3-49bb-485f-bb16-dceb5c4b402f	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	UPDATE	LEAVE	LeaveType	27292491-2bbc-4196-956b-c2848562c1ca	Updated Leave Type: Earned Leave	{"id": "27292491-2bbc-4196-956b-c2848562c1ca", "days": 18, "name": "Earned Leave", "color": "#3B82F6", "isPaid": true, "createdAt": "2026-01-21T11:53:54.154Z", "frequency": "yearly", "updatedAt": "2026-01-21T11:54:11.597Z", "encashable": false, "maxAccrual": 0, "accrualRate": 1.5, "accrualType": "monthly", "description": null, "positionIds": [], "carryForward": true, "monthlyLimit": 2, "noticePeriod": 0, "sandwichRule": false, "departmentIds": [], "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 0, "minDaysForProof": 2, "minDaysForNotice": 0, "includeNonWorkingDays": false}, "probationQuota": 0, "quarterlyLimit": 0, "maxCarryForward": 5, "minDaysForProof": 2, "employmentStatus": [], "minDaysForNotice": 0, "accrualStartMonth": 1, "confirmationBonus": 0, "maxConsecutiveDays": 8, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:58:27.476
3bd86ef8-a977-49eb-a1f0-a8cd6951fd88	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	UPDATE	LEAVE	LeaveType	f1ddfe98-0bc3-49fb-b17d-b3dad69fc5cd	Updated Leave Type: SL	{"id": "f1ddfe98-0bc3-49fb-b17d-b3dad69fc5cd", "days": 4, "name": "SL", "color": "#3B82F6", "isPaid": true, "createdAt": "2026-01-21T11:53:54.158Z", "frequency": "yearly", "updatedAt": "2026-01-21T11:56:07.460Z", "encashable": false, "maxAccrual": 0, "accrualRate": 0, "accrualType": "yearly", "description": null, "positionIds": [], "carryForward": true, "monthlyLimit": 2, "noticePeriod": 0, "sandwichRule": false, "departmentIds": [], "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 0, "minDaysForProof": 2, "minDaysForNotice": 0, "includeNonWorkingDays": false}, "probationQuota": 0, "quarterlyLimit": 0, "maxCarryForward": 5, "minDaysForProof": 2, "employmentStatus": [], "minDaysForNotice": 0, "accrualStartMonth": 1, "confirmationBonus": 0, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 11:58:30.607
b3a1fab3-29e8-4aff-a624-84c14060544b	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	DELETE	LEAVE	LeaveType	0bcddcf5-794b-46d3-a148-b6e84a49f0b1	Deleted Leave Type (ID: 0bcddcf5-794b-46d3-a148-b6e84a49f0b1)	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:02:03.362
3ad91029-af62-4a9c-bf65-9bc5bf3e899a	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	DELETE	LEAVE	LeaveType	27292491-2bbc-4196-956b-c2848562c1ca	Deleted Leave Type (ID: 27292491-2bbc-4196-956b-c2848562c1ca)	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:02:06.304
59ea0184-7e61-468f-aea1-e31dde092ea1	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	DELETE	LEAVE	LeaveType	6308ae6f-721d-4196-913b-7d769cf66331	Deleted Leave Type (ID: 6308ae6f-721d-4196-913b-7d769cf66331)	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:02:08.585
310ad4d0-7d56-4fec-ab1d-9171eb01d826	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	DELETE	LEAVE	LeaveType	f1ddfe98-0bc3-49fb-b17d-b3dad69fc5cd	Deleted Leave Type (ID: f1ddfe98-0bc3-49fb-b17d-b3dad69fc5cd)	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:02:10.589
df1da489-5a61-4f2f-8e0a-e4014e9d91e9	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	DELETE	LEAVE	LeaveType	0b548c4f-7fba-4694-a9d8-5c5a0d65694f	Deleted Leave Type (ID: 0b548c4f-7fba-4694-a9d8-5c5a0d65694f)	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:06:32.037
d9fa1c09-7c98-4c7a-ab94-a0aa7bfe9e6b	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	CREATE	LEAVE	LeaveType	28a1c482-dd07-402b-a662-e65d85220ab0	Created Leave Type: Earned Leaves	{"days": 18, "name": "Earned Leaves", "color": "#3B82F6", "isPaid": true, "frequency": "yearly", "encashable": false, "maxAccrual": 2, "accrualRate": 1.5, "accrualType": "monthly", "description": "", "carryForward": true, "monthlyLimit": 2, "noticePeriod": 14, "sandwichRule": false, "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}, "maxCarryForward": 5, "minDaysForProof": 2, "minDaysForNotice": 4, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:13:40.99
373a468b-22f6-46c6-a585-d8ffda9a791b	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	DELETE	LEAVE	LeaveType	28a1c482-dd07-402b-a662-e65d85220ab0	Deleted Leave Type (ID: 28a1c482-dd07-402b-a662-e65d85220ab0)	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:14:08.778
338a7505-762c-4341-b580-9715d2ac4a6f	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	CREATE	LEAVE	LeaveType	9d6bebad-72ef-43c9-96e1-afa64c1616ef	Created Leave Type: Earned Leaves	{"days": 18, "name": "Earned Leaves", "color": "#3B82F6", "isPaid": true, "frequency": "yearly", "encashable": false, "maxAccrual": 2, "accrualRate": 1.5, "accrualType": "monthly", "description": "", "carryForward": true, "monthlyLimit": 2, "noticePeriod": 14, "sandwichRule": false, "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}, "probationQuota": 1, "quarterlyLimit": 2, "maxCarryForward": 5, "minDaysForProof": 2, "minDaysForNotice": 4, "confirmationBonus": 1.5, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:18:42.111
55c49a81-5851-4b13-b590-87aa33984d38	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	CREATE	LEAVE	LeaveType	6e2652ac-a743-42eb-a56f-561af5f05646	Created Leave Type: Casual Leave	{"days": 4, "name": "Casual Leave", "color": "#3B82F6", "isPaid": true, "frequency": "yearly", "encashable": false, "maxAccrual": 0, "accrualRate": 0, "accrualType": "yearly", "description": "", "carryForward": true, "monthlyLimit": 2, "noticePeriod": 0, "sandwichRule": false, "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 0, "minDaysForProof": 2, "minDaysForNotice": 0, "includeNonWorkingDays": false}, "probationQuota": 1, "quarterlyLimit": 2, "maxCarryForward": 2, "minDaysForProof": 2, "minDaysForNotice": 0, "confirmationBonus": 0, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:19:20.73
ddabecca-fe89-4336-9a4b-84dc0637ec8a	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	CREATE	LEAVE	LeaveType	c01b69ee-83c0-482d-af93-ad1690bc371d	Created Leave Type: Sick Leave	{"days": 4, "name": "Sick Leave", "color": "#3B82F6", "isPaid": true, "frequency": "yearly", "encashable": false, "maxAccrual": 0, "accrualRate": 0, "accrualType": "yearly", "description": "", "carryForward": true, "monthlyLimit": 2, "noticePeriod": 14, "sandwichRule": false, "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}, "probationQuota": 1, "quarterlyLimit": 1, "maxCarryForward": 2, "minDaysForProof": 2, "minDaysForNotice": 4, "confirmationBonus": 0, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:19:50.21
d1e99874-50b2-4631-93ad-81048d870d82	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	UPDATE	LEAVE	LeaveType	6e2652ac-a743-42eb-a56f-561af5f05646	Updated Leave Type: Casual Leave	{"id": "6e2652ac-a743-42eb-a56f-561af5f05646", "days": 4, "name": "Casual Leave", "color": "#3B82F6", "isPaid": true, "createdAt": "2026-01-21T12:19:20.725Z", "frequency": "yearly", "updatedAt": "2026-01-21T12:19:20.725Z", "encashable": false, "maxAccrual": 0, "accrualRate": 0, "accrualType": "yearly", "description": "", "positionIds": [], "carryForward": true, "monthlyLimit": 2, "noticePeriod": 0, "sandwichRule": false, "departmentIds": [], "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 0, "minDaysForProof": 2, "minDaysForNotice": 0, "includeNonWorkingDays": false}, "probationQuota": 1, "quarterlyLimit": 1, "maxCarryForward": 2, "minDaysForProof": 2, "employmentStatus": [], "minDaysForNotice": 0, "accrualStartMonth": 1, "confirmationBonus": 0, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:19:57.218
1b9ad461-dfd0-4fbb-a353-bbe57419683b	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	UPDATE	LEAVE	LeaveType	6e2652ac-a743-42eb-a56f-561af5f05646	Updated Leave Type: Casual Leave	{"id": "6e2652ac-a743-42eb-a56f-561af5f05646", "days": 4, "name": "Casual Leave", "color": "#3B82F6", "isPaid": true, "createdAt": "2026-01-21T12:19:20.725Z", "frequency": "yearly", "updatedAt": "2026-01-21T12:19:57.211Z", "encashable": false, "maxAccrual": 0, "accrualRate": 0, "accrualType": "yearly", "description": "", "positionIds": [], "carryForward": true, "monthlyLimit": 2, "noticePeriod": 14, "sandwichRule": false, "departmentIds": [], "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}, "probationQuota": 1, "quarterlyLimit": 1, "maxCarryForward": 2, "minDaysForProof": 2, "employmentStatus": [], "minDaysForNotice": 4, "accrualStartMonth": 1, "confirmationBonus": 0, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:20:35.534
5729f81e-876f-4d46-b39d-07ca37845d4b	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	UPDATE	LEAVE	LeaveType	9d6bebad-72ef-43c9-96e1-afa64c1616ef	Updated Leave Type: Earned Leaves	{"id": "9d6bebad-72ef-43c9-96e1-afa64c1616ef", "days": 18, "name": "Earned Leaves", "color": "#3B82F6", "isPaid": true, "createdAt": "2026-01-21T12:18:42.103Z", "frequency": "yearly", "updatedAt": "2026-01-21T12:18:42.103Z", "encashable": false, "maxAccrual": 0, "accrualRate": 1.5, "accrualType": "monthly", "description": "", "positionIds": [], "carryForward": true, "monthlyLimit": 2, "noticePeriod": 14, "sandwichRule": false, "departmentIds": [], "proofRequired": false, "minServiceDays": 0, "policySettings": {"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}, "probationQuota": 1, "quarterlyLimit": 2, "maxCarryForward": 5, "minDaysForProof": 2, "employmentStatus": [], "minDaysForNotice": 4, "accrualStartMonth": 1, "confirmationBonus": 1.5, "maxConsecutiveDays": 10, "includeNonWorkingDays": false}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:23:39.051
d2034479-8691-4077-b261-b48237795fe1	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	CREATE	HRMS	Employee	8d1b2a71-1ddb-4aa3-b9bf-f5fe99cd95f1	Created employee emp1 emp1 (ID: EMP-0001)	{"email": "emp1@test.com", "phone": "", "roleId": "2af33051-91e2-49b0-be8e-e879b80dc41c", "status": "active", "bankName": "", "ifscCode": "", "lastName": "emp1", "password": "emp1", "firstName": "emp1", "panNumber": "", "employeeId": "", "positionId": "020858a5-3766-4388-99cb-39f9af2c2879", "departmentId": "a9e50298-d5db-4b87-8ab6-a8e12194321d", "aadhaarNumber": "", "accountNumber": "", "createAccount": true, "dateOfJoining": "2026-04-01", "currentAddress": "", "employmentType": "Full Time", "permanentAddress": "", "probationEndDate": "2026-06-01"}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:25:44.666
64741c45-c2bc-447b-b957-3e9306d11aeb	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	CREATE	HRMS	Employee	a179f413-6a5a-4006-be37-3452bae28bf8	Created employee emp2 emp2 (ID: EMP-0002)	{"email": "emp2@test.com", "phone": "", "roleId": "2af33051-91e2-49b0-be8e-e879b80dc41c", "status": "active", "bankName": "", "ifscCode": "", "lastName": "emp2", "password": "emp2", "firstName": "emp2", "panNumber": "", "employeeId": "", "positionId": "020858a5-3766-4388-99cb-39f9af2c2879", "departmentId": "a9e50298-d5db-4b87-8ab6-a8e12194321d", "aadhaarNumber": "", "accountNumber": "", "createAccount": true, "dateOfJoining": "2026-04-01", "currentAddress": "", "employmentType": "Full Time", "permanentAddress": ""}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:26:32.768
fee22adc-1ef7-4bf5-bf79-16901f36c0eb	\N	\N	LOGIN	AUTH	User	33f2d4ff-5bc5-4713-b161-fabb9791b6c3	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:26:48.381
8b614550-d009-4ba3-9a4b-4dcdd05851be	\N	\N	LOGIN	AUTH	User	16b0979b-b04f-4942-8ec8-33b0de1c121e	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:27:24.374
96fe92a9-7565-4149-98a9-ee3016233beb	\N	\N	LOGIN	AUTH	User	16b0979b-b04f-4942-8ec8-33b0de1c121e	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:28:27.311
350ac058-c732-4b66-81e9-dbc0924be0c1	\N	\N	LOGIN	AUTH	User	33f2d4ff-5bc5-4713-b161-fabb9791b6c3	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:30:41.871
de35fd8f-f9bb-44f7-bb5f-a2348c3b6571	\N	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	DELETE	HRMS	Employee	8d1b2a71-1ddb-4aa3-b9bf-f5fe99cd95f1	Deleted employee record	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-21 12:31:15.918
\.


--
-- Data for Name: Branch; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Branch" (id, "companyId", name, code, address, city, state, country, pincode, phone, email, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Candidate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Candidate" (id, "companyId", "jobOpeningId", "firstName", "lastName", email, phone, "resumePath", status, "currentStage", notes, rating, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Client" (id, "companyId", name, email, phone, address, city, state, country, pincode, gstin, pan, status, "clientType", "createdAt", "updatedAt", password, "portalAccess", "lastLogin") FROM stdin;
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Company" (id, name, "legalName", email, phone, address, city, state, country, pincode, gstin, pan, logo, "letterheadDoc", "allowedIPs", latitude, longitude, radius, "isActive", "enabledModules", "createdAt", "updatedAt", currency, tan) FROM stdin;
b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Applizor Softech LLP	Applizor Softech LLP	connect@applizor.com	+91-9130309480	209, WARD NO 7, VISHWAKARMA MUHALLA, GARROLI	Chhatarpur	Madhya Pradesh	India	471201	27AAAAA0000A1Z5	AAAAA0000A	/uploads/logos/logo-1768997287321-780339866.png	\N	\N	\N	\N	100	t	null	2026-01-21 11:53:53.841	2026-01-21 12:39:48.788	INR	\N
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Department" (id, "companyId", name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
a9e50298-d5db-4b87-8ab6-a8e12194321d	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Engineering	Software Development	t	2026-01-21 11:53:54.067	2026-01-21 11:53:54.067
80f8b173-8253-4dff-be66-3b8229770117	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	HR	Human Resources	t	2026-01-21 11:53:54.086	2026-01-21 11:53:54.086
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Document" (id, "companyId", "clientId", "invoiceId", "employeeId", "projectId", name, type, category, "filePath", "fileSize", "mimeType", version, "isTemplate", tags, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DocumentTemplate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."DocumentTemplate" (id, "companyId", name, description, type, "filePath", "letterheadMode", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EmailTemplate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmailTemplate" (id, "companyId", name, subject, body, type, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Employee" (id, "companyId", "userId", "employeeId", "firstName", "lastName", email, phone, gender, "bloodGroup", "maritalStatus", "dateOfBirth", "dateOfJoining", "currentAddress", "permanentAddress", "emergencyContact", "bankName", "accountNumber", "ifscCode", "panNumber", "aadhaarNumber", "departmentId", "positionId", "shiftId", salary, "salaryStructure", status, "createdAt", "updatedAt", "createdById", "employmentType", "hourlyRate", "noticePeriodEndDate", "noticePeriodStartDate", "probationEndDate", skills, "slackMemberId", "probationProcessed") FROM stdin;
a179f413-6a5a-4006-be37-3452bae28bf8	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	16b0979b-b04f-4942-8ec8-33b0de1c121e	EMP-0002	emp2	emp2	emp2@test.com		\N	\N	\N	\N	2026-04-01 00:00:00			\N						a9e50298-d5db-4b87-8ab6-a8e12194321d	020858a5-3766-4388-99cb-39f9af2c2879	\N	\N	\N	active	2026-01-21 12:26:32.751	2026-01-21 12:26:32.751	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	Full Time	\N	\N	\N	\N	\N	\N	f
\.


--
-- Data for Name: EmployeeLeaveBalance; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmployeeLeaveBalance" (id, "employeeId", "leaveTypeId", year, allocated, "carriedOver", used, "createdAt", "updatedAt") FROM stdin;
b722736e-0be9-49d7-9203-b2560b9b374a	a179f413-6a5a-4006-be37-3452bae28bf8	c01b69ee-83c0-482d-af93-ad1690bc371d	2026	3	0	0	2026-01-21 12:26:32.758	2026-01-21 12:26:32.758
ed86a806-9b1b-4f75-9c48-335361e9204c	a179f413-6a5a-4006-be37-3452bae28bf8	6e2652ac-a743-42eb-a56f-561af5f05646	2026	3	0	0	2026-01-21 12:26:32.758	2026-01-21 12:26:32.758
10707b23-ecf9-4d8e-8b40-b24c1f962e70	a179f413-6a5a-4006-be37-3452bae28bf8	9d6bebad-72ef-43c9-96e1-afa64c1616ef	2026	0	0	0	2026-01-21 12:26:32.758	2026-01-21 12:26:32.758
\.


--
-- Data for Name: EmployeeSalaryComponent; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmployeeSalaryComponent" (id, "structureId", "componentId", "monthlyAmount") FROM stdin;
\.


--
-- Data for Name: EmployeeSalaryStructure; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmployeeSalaryStructure" (id, "employeeId", "netSalary", ctc, "effectiveDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Estimate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Estimate" (id, "companyId", "leadId", title, description, "estimatedValue", timeframe, status, "convertedToQuotationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Holiday; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Holiday" (id, name, date, type, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Interview; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Interview" (id, "candidateId", round, type, "scheduledAt", interviewer, feedback, rating, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: InterviewScorecard; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."InterviewScorecard" (id, "interviewId", technical, communication, "problemSolving", "cultureFit", comments, "submittedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Invoice" (id, "companyId", "clientId", "invoiceNumber", "invoiceDate", "dueDate", status, type, currency, terms, subtotal, tax, discount, total, "paidAmount", "isRecurring", "recurringId", notes, "pdfPath", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."InvoiceItem" (id, "invoiceId", description, "hsnCode", quantity, rate, "taxRate", amount, "createdAt") FROM stdin;
\.


--
-- Data for Name: JobOpening; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."JobOpening" (id, "companyId", title, department, "position", description, requirements, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: JournalEntry; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."JournalEntry" (id, "companyId", date, reference, description, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: JournalEntryLine; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."JournalEntryLine" (id, "journalEntryId", "accountId", debit, credit, description) FROM stdin;
\.


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Lead" (id, "companyId", name, email, phone, company, source, status, stage, value, notes, "assignedTo", "createdAt", "updatedAt", "assignedAt", "convertedAt", "convertedToClientId", "createdBy", industry, "jobTitle", "lastContactedAt", "nextFollowUpAt", priority, probability, "sourceDetails", tags, website) FROM stdin;
\.


--
-- Data for Name: LeadActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LeadActivity" (id, "leadId", type, title, description, outcome, "scheduledAt", "completedAt", "dueDate", "reminderSent", "reminderTime", "assignedTo", "createdBy", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LeaveAccrual; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LeaveAccrual" (id, "employeeId", "leaveTypeId", year, month, "accruedDays", "totalAccrued", "createdAt") FROM stdin;
\.


--
-- Data for Name: LeaveRequest; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LeaveRequest" (id, "employeeId", "leaveTypeId", "startDate", "endDate", days, reason, status, "approvedBy", "approvedAt", "createdAt", "updatedAt", "assignedBy", "attachmentPath", "durationType", category, "lopDays") FROM stdin;
\.


--
-- Data for Name: LeaveType; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LeaveType" (id, name, days, "isPaid", description, "createdAt", "updatedAt", frequency, "carryForward", "maxCarryForward", "monthlyLimit", "accrualRate", "accrualStartMonth", "accrualType", color, "departmentIds", "employmentStatus", encashable, "maxAccrual", "maxConsecutiveDays", "minServiceDays", "positionIds", "proofRequired", "sandwichRule", "policySettings", "confirmationBonus", "probationQuota", "quarterlyLimit") FROM stdin;
c01b69ee-83c0-482d-af93-ad1690bc371d	Sick Leave	4	t		2026-01-21 12:19:50.205	2026-01-21 12:19:50.205	yearly	t	2	2	0	1	yearly	#3B82F6	{}	{}	f	0	10	0	{}	f	f	{"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}	0	1	1
6e2652ac-a743-42eb-a56f-561af5f05646	Casual Leave	4	t		2026-01-21 12:19:20.725	2026-01-21 12:20:35.529	yearly	t	2	2	0	1	yearly	#3B82F6	{}	{}	f	0	10	0	{}	f	f	{"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}	0	1	1
9d6bebad-72ef-43c9-96e1-afa64c1616ef	Earned Leaves	18	t		2026-01-21 12:18:42.103	2026-01-21 12:23:39.045	yearly	t	5	2	1.5	1	monthly	#3B82F6	{}	{}	f	2	10	0	{}	f	f	{"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}	1.5	1	2
\.


--
-- Data for Name: LedgerAccount; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LedgerAccount" (id, "companyId", code, name, type, balance, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OfferLetter; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."OfferLetter" (id, "candidateId", "position", department, salary, "startDate", status, "documentPath", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Payment" (id, "invoiceId", amount, "paymentDate", "paymentMethod", gateway, "transactionId", "gatewayOrderId", status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payroll; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Payroll" (id, "employeeId", month, year, "basicSalary", allowances, deductions, "earningsBreakdown", "deductionsBreakdown", "grossSalary", "netSalary", status, "processedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Position; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Position" (id, "departmentId", title, description, "isActive", "createdAt", "updatedAt") FROM stdin;
020858a5-3766-4388-99cb-39f9af2c2879	a9e50298-d5db-4b87-8ab6-a8e12194321d	Senior Software Engineer	\N	t	2026-01-21 11:53:54.078	2026-01-21 11:53:54.078
72eac940-3040-462e-8736-cf9f43547af2	80f8b173-8253-4dff-be66-3b8229770117	HR Manager	\N	t	2026-01-21 11:53:54.121	2026-01-21 11:53:54.121
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Project" (id, "companyId", "clientId", name, description, status, "startDate", "endDate", budget, "isBillable", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Quotation; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Quotation" (id, "companyId", "leadId", "clientId", "quotationNumber", title, description, "quotationDate", "validUntil", status, subtotal, tax, discount, total, currency, "paymentTerms", "deliveryTerms", notes, "pdfPath", "templateId", "publicToken", "publicExpiresAt", "isPublicEnabled", "clientViewedAt", "clientAcceptedAt", "clientRejectedAt", "clientSignature", "clientEmail", "clientName", "clientComments", "signedPdfPath", "convertedToInvoiceId", "convertedAt", "createdBy", "assignedTo", "createdAt", "updatedAt", "emailOpens", "lastEmailOpenedAt", "lastViewedAt", "viewCount", "maxReminders", "nextReminderAt", "reminderCount", "reminderFrequency") FROM stdin;
\.


--
-- Data for Name: QuotationActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."QuotationActivity" (id, "quotationId", type, "ipAddress", "userAgent", location, "deviceType", browser, os, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: QuotationItem; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."QuotationItem" (id, "quotationId", description, quantity, "unitPrice", tax, discount, total) FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Role" (id, name, description, "isSystem", "createdAt", "updatedAt") FROM stdin;
2efe4dac-9b40-4436-b299-badda6396405	HR	Human Resources Manager	f	2026-01-21 11:53:53.963	2026-01-21 11:54:11.36
fbd2165d-3336-49b8-9b1f-188fbcd27b25	Admin	Full system access	t	2026-01-21 11:53:53.856	2026-01-21 12:02:35.589
2af33051-91e2-49b0-be8e-e879b80dc41c	Employee	Regular Employee	f	2026-01-21 11:53:54.023	2026-01-21 12:29:59.622
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."RolePermission" (id, "roleId", "createdAt", "createLevel", "deleteLevel", module, "readLevel", "updateLevel") FROM stdin;
76e0d6bf-3c0a-4f62-afe8-7a18b0e2e77d	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.866	all	all	Company	all	all
81c997ec-b0c3-469b-a779-dc194e309a57	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.869	all	all	User	all	all
17d9af20-bfb1-4fa7-9acd-291f72832090	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.871	all	all	Role	all	all
3e69169f-c37a-440e-8996-c87a8d47a015	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.873	all	all	Client	all	all
65faf453-00a4-4f02-87fd-21d6c25543c3	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.876	all	all	Lead	all	all
2928edfe-25ff-4837-b15c-ca187d4ddc62	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.878	all	all	LeadActivity	all	all
63642e43-4d34-47ae-87cf-35cafed2c32f	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.88	all	all	Quotation	all	all
c387075a-2cb1-406c-8ed3-8721e5bcac4d	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.959	all	all	QuotationTemplate	all	all
53714b0e-c22e-42cb-befc-8a0d1bdbdef1	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.885	all	all	Payment	all	all
3645385f-7dfe-4778-a7a1-aa5eadf2c3f7	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.887	all	all	Subscription	all	all
33539749-ce91-42dc-b95d-0dd9f060562c	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.888	all	all	Department	all	all
7043b553-d8bc-4568-9aad-31f0ab727aae	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.891	all	all	Position	all	all
8c31b46b-6860-4065-8deb-b0da967d5836	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.893	all	all	Employee	all	all
f14cdd9d-ab73-46c8-9d75-722b67c5a6da	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.896	all	all	Attendance	all	all
e5d64708-4cc0-42e2-828a-57809dbf6a88	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.905	all	all	Leave	all	all
78706d04-71d9-453d-901c-a0a507370e37	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.913	all	all	LeaveType	all	all
e441c904-7bc3-401c-85fa-8a59c270e321	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.918	all	all	LeaveBalance	all	all
ef2fad80-b6a3-4d8a-a1c0-3024f1c31049	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.921	all	all	Shift	all	all
08467ff1-0f76-4751-affa-fbd79dde7f6c	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.924	all	all	ShiftRoster	all	all
29269a65-a712-4ee2-a940-b51b18ed056a	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.927	all	all	Payroll	all	all
5665d7f7-7ad8-4ffa-8181-fd02be7d599c	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.931	all	all	Asset	all	all
bc52c77d-7d9d-4186-9e1b-14cbff138c4e	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.95	all	all	Recruitment	all	all
155d3633-1e88-44ef-91bd-c9fcbf1816bd	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.954	all	all	Document	all	all
ec2f7bb4-13a0-4396-9052-43724b5d017b	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.956	all	all	Holiday	all	all
7d3b67c5-ecaa-45fa-9ed4-c59a0abb5b99	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.137	none	none	User	none	none
c4ec10da-9ab0-44eb-ba54-c515055d1ff5	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.882	all	all	Invoice	all	all
6ce5a472-cc62-4203-b1b2-5ec11783ca9a	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.968	all	all	Employee	all	all
db6735b5-44f7-44fc-a023-dbc75a61b915	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.97	all	all	Department	all	all
2e9b52d2-7a5b-4ee7-b7d7-228b4e6a7848	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.973	all	all	Position	all	all
18ffd12c-9705-4e6c-98a4-96215254fe2b	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.975	all	all	Attendance	all	all
09bed055-c1ab-4ba8-b45f-3feb085c09c4	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.978	all	all	Leave	all	all
fb6a65b4-f2cc-4d12-b8f0-bf3dd7a62ab6	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.98	all	all	LeaveType	all	all
dca6e667-d339-4621-8ce9-ba401c25f898	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.982	all	all	LeaveBalance	all	all
d4357375-2569-4d93-aaac-187b40f0bca4	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.984	all	all	Shift	all	all
7ee76741-68f3-426e-a27f-b114f1b374c8	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.987	all	all	Recruitment	all	all
42daa4c4-bdfd-4543-8acb-d631fef47f83	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.991	all	all	Payroll	all	all
033be0ee-f2f1-41c9-930a-58f3b82782e7	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:53.996	all	all	Asset	all	all
71e082ea-3b9f-46c0-9f5a-b64bd13593b9	2efe4dac-9b40-4436-b299-badda6396405	2026-01-21 11:53:54.02	all	all	Document	all	all
ec8121bf-a74c-48a3-8d09-7c302cc94829	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 11:53:54.038	all	owned	Leave	owned	owned
6076898e-048e-4ee4-8af2-5dde5f14ed58	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 11:53:54.056	none	none	Shift	owned	none
621fc631-4d13-4e88-9876-dccf3f20d03c	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 11:53:54.034	none	none	Dashboard	all	none
2fcf3642-859f-4aa5-8de7-1e1211b90408	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 11:53:54.051	none	none	LeaveType	all	none
bbd558ea-262b-4a99-8367-1f89e7291ae1	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 11:53:54.053	none	none	LeaveBalance	owned	owned
2dd80cc1-a1e2-480a-913d-cf5bf6a79bc8	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 11:53:54.062	none	none	ShiftRoster	owned	none
433dd95a-6498-47ca-9738-b6e8793d2201	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 11:53:54.041	owned	none	Document	owned	owned
efba022e-83f2-42a0-bf56-8574cbb14fc8	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 11:53:54.064	none	none	Holiday	all	none
a9503893-2c23-4599-a8cc-b44b26ec42a0	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.133	none	none	Company	none	none
2bc34f5a-ebf1-4d61-94d7-a2e8716a5892	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:53.861	all	all	Dashboard	all	all
140fc3b3-141a-4ea7-bff1-04b9af02ee75	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 11:53:54.044	none	none	Employee	owned	none
d2c9c103-9541-4ca7-a1ba-1cf26013fa2d	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 11:53:54.048	all	owned	Attendance	owned	owned
0e17ad38-f591-4bdb-9521-57a03f5832bf	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.139	none	none	Role	none	none
ac6eda8e-908e-45b9-a9a6-7fc9f42d2597	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.142	none	none	Client	none	none
b6c0f8dc-eda5-4168-9d79-a424cd11155e	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.144	none	none	Lead	none	none
ab41ae10-7f7c-475a-8a03-288bdebfae8f	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.147	none	none	LeadActivity	none	none
7ee5e7b1-8aed-4720-9a02-ee386b401558	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.149	none	none	Quotation	none	none
d1f6128b-dddb-4b87-b3d0-c417a13c58a4	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.153	none	none	QuotationTemplate	none	none
2bb203cc-4e56-412e-9a26-59ee7f3dac15	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.155	none	none	Invoice	none	none
81e276ec-6f56-457c-b4f4-912d70ce29fb	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.157	none	none	Payment	none	none
32ddf098-b31c-43f4-97db-9d9401ee6b35	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.16	none	none	Subscription	none	none
8a237a55-a214-4f1c-8b97-0e34ea7ddf67	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.163	none	none	Department	all	none
58849033-7e70-4279-9f80-44f260e2afc5	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.165	none	none	Position	all	none
35f53130-b776-482d-a683-2084c2dd9536	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.187	none	none	Payroll	none	none
43ff099f-3d36-434c-afde-42e9c4609f0d	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.189	none	none	Asset	none	none
42aabdbc-84c2-4e20-8313-e824d3f0bdd0	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:28:00.192	none	none	Recruitment	none	none
\.


--
-- Data for Name: SalaryComponent; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."SalaryComponent" (id, "companyId", name, type, "calculationType", "defaultValue", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SalesTarget; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."SalesTarget" (id, "companyId", "employeeId", period, "startDate", "endDate", "targetAmount", "achievedAmount", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Shift; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Shift" (id, "companyId", name, "startTime", "endTime", "breakDuration", "isActive", "createdAt", "updatedAt", "workDays") FROM stdin;
\.


--
-- Data for Name: ShiftRoster; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ShiftRoster" (id, "employeeId", "shiftId", date, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Subscription" (id, "companyId", "clientId", name, plan, amount, "billingCycle", "startDate", "endDate", status, "nextBillingDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Task" (id, "projectId", title, description, status, priority, "dueDate", "createdById", "assignedToId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Timesheet; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Timesheet" (id, "companyId", "projectId", "employeeId", date, hours, "isBillable", description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Transaction" (id, "accountId", date, type, amount, description, reference, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."User" (id, email, password, "firstName", "lastName", phone, "isActive", "lastLogin", "createdAt", "updatedAt", "resetToken", "resetTokenExpiry", "companyId") FROM stdin;
ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	admin@applizor.com	$2a$10$t0lMrLC2WJCOzM3Ar.e89uGF/hfRjhbfTqvZE6gqVJUT5sed0HAT6	Admin	User	\N	t	2026-01-21 11:54:02.954	2026-01-21 11:53:54.297	2026-01-21 11:54:11.9	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
16b0979b-b04f-4942-8ec8-33b0de1c121e	emp2@test.com	$2a$10$jQd6wuQ.Y2tTpNJa9JRdg.ouve4yLFRQzTvaDpetdPGIMHYLncyYe	emp2	emp2		t	2026-01-21 12:28:27.301	2026-01-21 12:26:32.744	2026-01-21 12:28:27.302	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."UserRole" (id, "userId", "roleId", "createdAt") FROM stdin;
de2b509d-2d91-40fc-9fdf-874bbd2cdbf7	ba8edfd1-69cc-4526-98ff-3efcfe8b4cfc	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-21 11:53:54.306
87d72853-bbe6-46b1-ac3b-4e41fd4f7bc7	16b0979b-b04f-4942-8ec8-33b0de1c121e	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-21 12:26:32.747
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
3018bb95-ab8c-4b32-999d-f59fb912211f	628e861940c69e0e690acaccd985ecb6240e75eee971bfd0f24e3e561b09c6dd	2026-01-21 11:53:52.959498+00	20260118190927_add_leave_balances	\N	\N	2026-01-21 11:53:52.294829+00	1
4af44bb9-acfe-4bce-bd54-ae627efa1873	798311312f113476b21e051b6f265b0bdc699e6ac65fdfd3c711c48180ea641d	2026-01-21 11:53:53.060933+00	20260119153533_add_advanced_leave_features	\N	\N	2026-01-21 11:53:52.961873+00	1
ad3e4208-5b16-419d-ac34-d85f819c85ee	ec949b307de76a7cbc7fdc5435e79a0420c70d812e7143e1d587c595357cf0c5	2026-01-21 11:53:53.075191+00	20260119193527_add_lop_days_to_leave_request	\N	\N	2026-01-21 11:53:53.062998+00	1
b21be499-340c-4244-b09a-cfe4b61f7834	c41e222fc7d8504efd0b7d60aeabe1b4c1dcfc9436ec304ea04d2f7f1b96cc39	2026-01-21 11:53:53.08621+00	20260119201239_add_quarterly_probation_fields	\N	\N	2026-01-21 11:53:53.077628+00	1
88d8ac60-ecc6-4449-aad9-6148f3d602e5	c4fe7e18cd757ff12c2add94ecc066b7ea4de13a005919f180df132b875c2dd1	2026-01-21 11:53:53.194763+00	20260121095900_add_quotation_templates	\N	\N	2026-01-21 11:53:53.088619+00	1
52075ce1-12b3-41a7-8be5-7c8483e2df84	9046c3d89ceeda5bd6cdc4cfa82b0fc5e653012c79d3d4e2f5e49ce50e51f003	2026-01-21 11:53:53.223475+00	20260121103803_add_quotation_analytics	\N	\N	2026-01-21 11:53:53.196816+00	1
855dafba-6f07-4377-a03f-b7bbef350baf	84ee5b15cfc0cc62f3b59fe11f79ea83e4994919986eb84ff09f766d6882ea18	2026-01-21 11:53:53.232644+00	20260121104742_add_quotation_reminders	\N	\N	2026-01-21 11:53:53.225074+00	1
61fa7faf-c265-4216-8e70-c18b075346dc	b803ac9df5a0bf416727f5cb03e9fab71aec806bd3e7ca6760cf79fbfef75887	2026-01-21 12:06:59.786285+00	20260121120659_add_probation_processed	\N	\N	2026-01-21 12:06:59.773477+00	1
\.


--
-- Data for Name: quotation_templates; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public.quotation_templates (id, "companyId", name, description, category, title, "templateDescription", "paymentTerms", "deliveryTerms", notes, items, "isActive", "usageCount", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Branch Branch_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_pkey" PRIMARY KEY (id);


--
-- Name: Candidate Candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_pkey" PRIMARY KEY (id);


--
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: DocumentTemplate DocumentTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."DocumentTemplate"
    ADD CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: EmailTemplate EmailTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmailTemplate"
    ADD CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeLeaveBalance EmployeeLeaveBalance_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeLeaveBalance"
    ADD CONSTRAINT "EmployeeLeaveBalance_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeSalaryComponent EmployeeSalaryComponent_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeSalaryComponent"
    ADD CONSTRAINT "EmployeeSalaryComponent_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeSalaryStructure EmployeeSalaryStructure_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeSalaryStructure"
    ADD CONSTRAINT "EmployeeSalaryStructure_pkey" PRIMARY KEY (id);


--
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY (id);


--
-- Name: Estimate Estimate_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Estimate"
    ADD CONSTRAINT "Estimate_pkey" PRIMARY KEY (id);


--
-- Name: Holiday Holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_pkey" PRIMARY KEY (id);


--
-- Name: InterviewScorecard InterviewScorecard_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InterviewScorecard"
    ADD CONSTRAINT "InterviewScorecard_pkey" PRIMARY KEY (id);


--
-- Name: Interview Interview_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Interview"
    ADD CONSTRAINT "Interview_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceItem InvoiceItem_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: JobOpening JobOpening_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JobOpening"
    ADD CONSTRAINT "JobOpening_pkey" PRIMARY KEY (id);


--
-- Name: JournalEntryLine JournalEntryLine_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JournalEntryLine"
    ADD CONSTRAINT "JournalEntryLine_pkey" PRIMARY KEY (id);


--
-- Name: JournalEntry JournalEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_pkey" PRIMARY KEY (id);


--
-- Name: LeadActivity LeadActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeadActivity"
    ADD CONSTRAINT "LeadActivity_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: LeaveAccrual LeaveAccrual_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveAccrual"
    ADD CONSTRAINT "LeaveAccrual_pkey" PRIMARY KEY (id);


--
-- Name: LeaveRequest LeaveRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY (id);


--
-- Name: LeaveType LeaveType_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveType"
    ADD CONSTRAINT "LeaveType_pkey" PRIMARY KEY (id);


--
-- Name: LedgerAccount LedgerAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LedgerAccount"
    ADD CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY (id);


--
-- Name: OfferLetter OfferLetter_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."OfferLetter"
    ADD CONSTRAINT "OfferLetter_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Payroll Payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Payroll"
    ADD CONSTRAINT "Payroll_pkey" PRIMARY KEY (id);


--
-- Name: Position Position_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: QuotationActivity QuotationActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationActivity"
    ADD CONSTRAINT "QuotationActivity_pkey" PRIMARY KEY (id);


--
-- Name: QuotationItem QuotationItem_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_pkey" PRIMARY KEY (id);


--
-- Name: Quotation Quotation_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SalaryComponent SalaryComponent_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."SalaryComponent"
    ADD CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY (id);


--
-- Name: SalesTarget SalesTarget_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."SalesTarget"
    ADD CONSTRAINT "SalesTarget_pkey" PRIMARY KEY (id);


--
-- Name: ShiftRoster ShiftRoster_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ShiftRoster"
    ADD CONSTRAINT "ShiftRoster_pkey" PRIMARY KEY (id);


--
-- Name: Shift Shift_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_pkey" PRIMARY KEY (id);


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: Timesheet Timesheet_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Timesheet"
    ADD CONSTRAINT "Timesheet_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: quotation_templates quotation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT quotation_templates_pkey PRIMARY KEY (id);


--
-- Name: Account_code_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Account_code_idx" ON public."Account" USING btree (code);


--
-- Name: Account_code_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Account_code_key" ON public."Account" USING btree (code);


--
-- Name: Account_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Account_type_idx" ON public."Account" USING btree (type);


--
-- Name: Asset_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Asset_companyId_idx" ON public."Asset" USING btree ("companyId");


--
-- Name: Asset_companyId_serialNumber_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Asset_companyId_serialNumber_key" ON public."Asset" USING btree ("companyId", "serialNumber");


--
-- Name: Asset_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Asset_employeeId_idx" ON public."Asset" USING btree ("employeeId");


--
-- Name: Attendance_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Attendance_date_idx" ON public."Attendance" USING btree (date);


--
-- Name: Attendance_employeeId_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Attendance_employeeId_date_idx" ON public."Attendance" USING btree ("employeeId", date);


--
-- Name: Attendance_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Attendance_employeeId_idx" ON public."Attendance" USING btree ("employeeId");


--
-- Name: AuditLog_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AuditLog_companyId_idx" ON public."AuditLog" USING btree ("companyId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AuditLog_entityType_entityId_idx" ON public."AuditLog" USING btree ("entityType", "entityId");


--
-- Name: AuditLog_module_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AuditLog_module_idx" ON public."AuditLog" USING btree (module);


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: Branch_companyId_code_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Branch_companyId_code_key" ON public."Branch" USING btree ("companyId", code);


--
-- Name: Branch_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Branch_companyId_idx" ON public."Branch" USING btree ("companyId");


--
-- Name: Candidate_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Candidate_companyId_idx" ON public."Candidate" USING btree ("companyId");


--
-- Name: Candidate_email_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Candidate_email_idx" ON public."Candidate" USING btree (email);


--
-- Name: Candidate_jobOpeningId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Candidate_jobOpeningId_idx" ON public."Candidate" USING btree ("jobOpeningId");


--
-- Name: Candidate_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Candidate_status_idx" ON public."Candidate" USING btree (status);


--
-- Name: Client_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Client_companyId_idx" ON public."Client" USING btree ("companyId");


--
-- Name: Client_email_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Client_email_idx" ON public."Client" USING btree (email);


--
-- Name: Client_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Client_status_idx" ON public."Client" USING btree (status);


--
-- Name: Company_name_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Company_name_idx" ON public."Company" USING btree (name);


--
-- Name: Department_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Department_companyId_idx" ON public."Department" USING btree ("companyId");


--
-- Name: Department_companyId_name_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Department_companyId_name_key" ON public."Department" USING btree ("companyId", name);


--
-- Name: DocumentTemplate_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "DocumentTemplate_companyId_idx" ON public."DocumentTemplate" USING btree ("companyId");


--
-- Name: DocumentTemplate_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "DocumentTemplate_type_idx" ON public."DocumentTemplate" USING btree (type);


--
-- Name: Document_category_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_category_idx" ON public."Document" USING btree (category);


--
-- Name: Document_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_clientId_idx" ON public."Document" USING btree ("clientId");


--
-- Name: Document_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_companyId_idx" ON public."Document" USING btree ("companyId");


--
-- Name: Document_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_employeeId_idx" ON public."Document" USING btree ("employeeId");


--
-- Name: Document_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_projectId_idx" ON public."Document" USING btree ("projectId");


--
-- Name: Document_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_type_idx" ON public."Document" USING btree (type);


--
-- Name: EmailTemplate_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "EmailTemplate_companyId_idx" ON public."EmailTemplate" USING btree ("companyId");


--
-- Name: EmailTemplate_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "EmailTemplate_type_idx" ON public."EmailTemplate" USING btree (type);


--
-- Name: EmployeeLeaveBalance_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "EmployeeLeaveBalance_employeeId_idx" ON public."EmployeeLeaveBalance" USING btree ("employeeId");


--
-- Name: EmployeeLeaveBalance_employeeId_leaveTypeId_year_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "EmployeeLeaveBalance_employeeId_leaveTypeId_year_key" ON public."EmployeeLeaveBalance" USING btree ("employeeId", "leaveTypeId", year);


--
-- Name: EmployeeSalaryComponent_structureId_componentId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "EmployeeSalaryComponent_structureId_componentId_key" ON public."EmployeeSalaryComponent" USING btree ("structureId", "componentId");


--
-- Name: EmployeeSalaryStructure_employeeId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "EmployeeSalaryStructure_employeeId_key" ON public."EmployeeSalaryStructure" USING btree ("employeeId");


--
-- Name: Employee_companyId_employeeId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Employee_companyId_employeeId_key" ON public."Employee" USING btree ("companyId", "employeeId");


--
-- Name: Employee_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Employee_companyId_idx" ON public."Employee" USING btree ("companyId");


--
-- Name: Employee_email_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Employee_email_idx" ON public."Employee" USING btree (email);


--
-- Name: Employee_email_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Employee_email_key" ON public."Employee" USING btree (email);


--
-- Name: Employee_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Employee_status_idx" ON public."Employee" USING btree (status);


--
-- Name: Employee_userId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Employee_userId_key" ON public."Employee" USING btree ("userId");


--
-- Name: Estimate_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Estimate_companyId_idx" ON public."Estimate" USING btree ("companyId");


--
-- Name: Estimate_leadId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Estimate_leadId_idx" ON public."Estimate" USING btree ("leadId");


--
-- Name: Holiday_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Holiday_date_idx" ON public."Holiday" USING btree (date);


--
-- Name: Holiday_date_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Holiday_date_key" ON public."Holiday" USING btree (date);


--
-- Name: InterviewScorecard_interviewId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "InterviewScorecard_interviewId_key" ON public."InterviewScorecard" USING btree ("interviewId");


--
-- Name: Interview_candidateId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Interview_candidateId_idx" ON public."Interview" USING btree ("candidateId");


--
-- Name: Interview_scheduledAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Interview_scheduledAt_idx" ON public."Interview" USING btree ("scheduledAt");


--
-- Name: InvoiceItem_invoiceId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "InvoiceItem_invoiceId_idx" ON public."InvoiceItem" USING btree ("invoiceId");


--
-- Name: Invoice_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_clientId_idx" ON public."Invoice" USING btree ("clientId");


--
-- Name: Invoice_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_companyId_idx" ON public."Invoice" USING btree ("companyId");


--
-- Name: Invoice_companyId_invoiceNumber_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Invoice_companyId_invoiceNumber_key" ON public."Invoice" USING btree ("companyId", "invoiceNumber");


--
-- Name: Invoice_invoiceDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_invoiceDate_idx" ON public."Invoice" USING btree ("invoiceDate");


--
-- Name: Invoice_invoiceNumber_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_invoiceNumber_idx" ON public."Invoice" USING btree ("invoiceNumber");


--
-- Name: Invoice_invoiceNumber_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON public."Invoice" USING btree ("invoiceNumber");


--
-- Name: Invoice_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_status_idx" ON public."Invoice" USING btree (status);


--
-- Name: Invoice_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_type_idx" ON public."Invoice" USING btree (type);


--
-- Name: JobOpening_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JobOpening_companyId_idx" ON public."JobOpening" USING btree ("companyId");


--
-- Name: JobOpening_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JobOpening_status_idx" ON public."JobOpening" USING btree (status);


--
-- Name: JournalEntryLine_accountId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JournalEntryLine_accountId_idx" ON public."JournalEntryLine" USING btree ("accountId");


--
-- Name: JournalEntryLine_journalEntryId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JournalEntryLine_journalEntryId_idx" ON public."JournalEntryLine" USING btree ("journalEntryId");


--
-- Name: JournalEntry_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JournalEntry_companyId_idx" ON public."JournalEntry" USING btree ("companyId");


--
-- Name: JournalEntry_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JournalEntry_date_idx" ON public."JournalEntry" USING btree (date);


--
-- Name: LeadActivity_assignedTo_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_assignedTo_idx" ON public."LeadActivity" USING btree ("assignedTo");


--
-- Name: LeadActivity_dueDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_dueDate_idx" ON public."LeadActivity" USING btree ("dueDate");


--
-- Name: LeadActivity_leadId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_leadId_idx" ON public."LeadActivity" USING btree ("leadId");


--
-- Name: LeadActivity_scheduledAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_scheduledAt_idx" ON public."LeadActivity" USING btree ("scheduledAt");


--
-- Name: LeadActivity_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_status_idx" ON public."LeadActivity" USING btree (status);


--
-- Name: LeadActivity_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_type_idx" ON public."LeadActivity" USING btree (type);


--
-- Name: Lead_assignedTo_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_assignedTo_idx" ON public."Lead" USING btree ("assignedTo");


--
-- Name: Lead_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_companyId_idx" ON public."Lead" USING btree ("companyId");


--
-- Name: Lead_createdBy_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_createdBy_idx" ON public."Lead" USING btree ("createdBy");


--
-- Name: Lead_nextFollowUpAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_nextFollowUpAt_idx" ON public."Lead" USING btree ("nextFollowUpAt");


--
-- Name: Lead_stage_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_stage_idx" ON public."Lead" USING btree (stage);


--
-- Name: Lead_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_status_idx" ON public."Lead" USING btree (status);


--
-- Name: LeaveAccrual_employeeId_leaveTypeId_year_month_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "LeaveAccrual_employeeId_leaveTypeId_year_month_key" ON public."LeaveAccrual" USING btree ("employeeId", "leaveTypeId", year, month);


--
-- Name: LeaveAccrual_employeeId_year_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveAccrual_employeeId_year_idx" ON public."LeaveAccrual" USING btree ("employeeId", year);


--
-- Name: LeaveAccrual_leaveTypeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveAccrual_leaveTypeId_idx" ON public."LeaveAccrual" USING btree ("leaveTypeId");


--
-- Name: LeaveRequest_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveRequest_employeeId_idx" ON public."LeaveRequest" USING btree ("employeeId");


--
-- Name: LeaveRequest_startDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveRequest_startDate_idx" ON public."LeaveRequest" USING btree ("startDate");


--
-- Name: LeaveRequest_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveRequest_status_idx" ON public."LeaveRequest" USING btree (status);


--
-- Name: LeaveType_name_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveType_name_idx" ON public."LeaveType" USING btree (name);


--
-- Name: LeaveType_name_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "LeaveType_name_key" ON public."LeaveType" USING btree (name);


--
-- Name: LedgerAccount_companyId_code_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "LedgerAccount_companyId_code_key" ON public."LedgerAccount" USING btree ("companyId", code);


--
-- Name: LedgerAccount_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LedgerAccount_companyId_idx" ON public."LedgerAccount" USING btree ("companyId");


--
-- Name: OfferLetter_candidateId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "OfferLetter_candidateId_idx" ON public."OfferLetter" USING btree ("candidateId");


--
-- Name: OfferLetter_candidateId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "OfferLetter_candidateId_key" ON public."OfferLetter" USING btree ("candidateId");


--
-- Name: OfferLetter_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "OfferLetter_status_idx" ON public."OfferLetter" USING btree (status);


--
-- Name: Payment_invoiceId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Payment_invoiceId_idx" ON public."Payment" USING btree ("invoiceId");


--
-- Name: Payment_paymentDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Payment_paymentDate_idx" ON public."Payment" USING btree ("paymentDate");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: Payment_transactionId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Payment_transactionId_idx" ON public."Payment" USING btree ("transactionId");


--
-- Name: Payment_transactionId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Payment_transactionId_key" ON public."Payment" USING btree ("transactionId");


--
-- Name: Payroll_year_month_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Payroll_year_month_idx" ON public."Payroll" USING btree (year, month);


--
-- Name: Position_departmentId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Position_departmentId_idx" ON public."Position" USING btree ("departmentId");


--
-- Name: Position_departmentId_title_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Position_departmentId_title_key" ON public."Position" USING btree ("departmentId", title);


--
-- Name: Project_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Project_clientId_idx" ON public."Project" USING btree ("clientId");


--
-- Name: Project_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Project_companyId_idx" ON public."Project" USING btree ("companyId");


--
-- Name: Project_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Project_status_idx" ON public."Project" USING btree (status);


--
-- Name: QuotationActivity_createdAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationActivity_createdAt_idx" ON public."QuotationActivity" USING btree ("createdAt");


--
-- Name: QuotationActivity_quotationId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationActivity_quotationId_idx" ON public."QuotationActivity" USING btree ("quotationId");


--
-- Name: QuotationActivity_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationActivity_type_idx" ON public."QuotationActivity" USING btree (type);


--
-- Name: QuotationItem_quotationId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationItem_quotationId_idx" ON public."QuotationItem" USING btree ("quotationId");


--
-- Name: Quotation_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Quotation_clientId_idx" ON public."Quotation" USING btree ("clientId");


--
-- Name: Quotation_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Quotation_companyId_idx" ON public."Quotation" USING btree ("companyId");


--
-- Name: Quotation_companyId_quotationNumber_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Quotation_companyId_quotationNumber_key" ON public."Quotation" USING btree ("companyId", "quotationNumber");


--
-- Name: Quotation_leadId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Quotation_leadId_idx" ON public."Quotation" USING btree ("leadId");


--
-- Name: Quotation_publicToken_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Quotation_publicToken_key" ON public."Quotation" USING btree ("publicToken");


--
-- Name: Quotation_quotationNumber_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON public."Quotation" USING btree ("quotationNumber");


--
-- Name: Quotation_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Quotation_status_idx" ON public."Quotation" USING btree (status);


--
-- Name: RolePermission_roleId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "RolePermission_roleId_idx" ON public."RolePermission" USING btree ("roleId");


--
-- Name: RolePermission_roleId_module_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "RolePermission_roleId_module_key" ON public."RolePermission" USING btree ("roleId", module);


--
-- Name: Role_name_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Role_name_idx" ON public."Role" USING btree (name);


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: SalaryComponent_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "SalaryComponent_companyId_idx" ON public."SalaryComponent" USING btree ("companyId");


--
-- Name: SalesTarget_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "SalesTarget_companyId_idx" ON public."SalesTarget" USING btree ("companyId");


--
-- Name: SalesTarget_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "SalesTarget_employeeId_idx" ON public."SalesTarget" USING btree ("employeeId");


--
-- Name: SalesTarget_period_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "SalesTarget_period_idx" ON public."SalesTarget" USING btree (period);


--
-- Name: ShiftRoster_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ShiftRoster_date_idx" ON public."ShiftRoster" USING btree (date);


--
-- Name: ShiftRoster_employeeId_date_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "ShiftRoster_employeeId_date_key" ON public."ShiftRoster" USING btree ("employeeId", date);


--
-- Name: ShiftRoster_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ShiftRoster_employeeId_idx" ON public."ShiftRoster" USING btree ("employeeId");


--
-- Name: Shift_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Shift_companyId_idx" ON public."Shift" USING btree ("companyId");


--
-- Name: Subscription_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Subscription_clientId_idx" ON public."Subscription" USING btree ("clientId");


--
-- Name: Subscription_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Subscription_companyId_idx" ON public."Subscription" USING btree ("companyId");


--
-- Name: Subscription_nextBillingDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Subscription_nextBillingDate_idx" ON public."Subscription" USING btree ("nextBillingDate");


--
-- Name: Subscription_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Subscription_status_idx" ON public."Subscription" USING btree (status);


--
-- Name: Task_assignedToId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_assignedToId_idx" ON public."Task" USING btree ("assignedToId");


--
-- Name: Task_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_projectId_idx" ON public."Task" USING btree ("projectId");


--
-- Name: Task_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_status_idx" ON public."Task" USING btree (status);


--
-- Name: Timesheet_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Timesheet_companyId_idx" ON public."Timesheet" USING btree ("companyId");


--
-- Name: Timesheet_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Timesheet_date_idx" ON public."Timesheet" USING btree (date);


--
-- Name: Timesheet_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Timesheet_employeeId_idx" ON public."Timesheet" USING btree ("employeeId");


--
-- Name: Timesheet_employeeId_projectId_date_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Timesheet_employeeId_projectId_date_key" ON public."Timesheet" USING btree ("employeeId", "projectId", date);


--
-- Name: Timesheet_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Timesheet_projectId_idx" ON public."Timesheet" USING btree ("projectId");


--
-- Name: Transaction_accountId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Transaction_accountId_idx" ON public."Transaction" USING btree ("accountId");


--
-- Name: Transaction_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Transaction_date_idx" ON public."Transaction" USING btree (date);


--
-- Name: Transaction_reference_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Transaction_reference_idx" ON public."Transaction" USING btree (reference);


--
-- Name: UserRole_roleId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "UserRole_roleId_idx" ON public."UserRole" USING btree ("roleId");


--
-- Name: UserRole_userId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "UserRole_userId_idx" ON public."UserRole" USING btree ("userId");


--
-- Name: UserRole_userId_roleId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON public."UserRole" USING btree ("userId", "roleId");


--
-- Name: User_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "User_companyId_idx" ON public."User" USING btree ("companyId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: quotation_templates_category_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX quotation_templates_category_idx ON public.quotation_templates USING btree (category);


--
-- Name: quotation_templates_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "quotation_templates_companyId_idx" ON public.quotation_templates USING btree ("companyId");


--
-- Name: Asset Asset_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Asset Asset_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Attendance Attendance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Branch Branch_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Candidate Candidate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Candidate Candidate_jobOpeningId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES public."JobOpening"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Client Client_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Department Department_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DocumentTemplate DocumentTemplate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."DocumentTemplate"
    ADD CONSTRAINT "DocumentTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmailTemplate EmailTemplate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmailTemplate"
    ADD CONSTRAINT "EmailTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeLeaveBalance EmployeeLeaveBalance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeLeaveBalance"
    ADD CONSTRAINT "EmployeeLeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeLeaveBalance EmployeeLeaveBalance_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeLeaveBalance"
    ADD CONSTRAINT "EmployeeLeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public."LeaveType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeSalaryComponent EmployeeSalaryComponent_componentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeSalaryComponent"
    ADD CONSTRAINT "EmployeeSalaryComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES public."SalaryComponent"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EmployeeSalaryComponent EmployeeSalaryComponent_structureId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeSalaryComponent"
    ADD CONSTRAINT "EmployeeSalaryComponent_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES public."EmployeeSalaryStructure"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeSalaryStructure EmployeeSalaryStructure_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeSalaryStructure"
    ADD CONSTRAINT "EmployeeSalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Employee Employee_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Employee Employee_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public."Position"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_shiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES public."Shift"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InterviewScorecard InterviewScorecard_interviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InterviewScorecard"
    ADD CONSTRAINT "InterviewScorecard_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES public."Interview"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Interview Interview_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Interview"
    ADD CONSTRAINT "Interview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."Candidate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InvoiceItem InvoiceItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invoice Invoice_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobOpening JobOpening_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JobOpening"
    ADD CONSTRAINT "JobOpening_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JournalEntryLine JournalEntryLine_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JournalEntryLine"
    ADD CONSTRAINT "JournalEntryLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."LedgerAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JournalEntryLine JournalEntryLine_journalEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JournalEntryLine"
    ADD CONSTRAINT "JournalEntryLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES public."JournalEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JournalEntry JournalEntry_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeadActivity LeadActivity_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeadActivity"
    ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Lead Lead_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LeaveAccrual LeaveAccrual_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveAccrual"
    ADD CONSTRAINT "LeaveAccrual_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveAccrual LeaveAccrual_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveAccrual"
    ADD CONSTRAINT "LeaveAccrual_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public."LeaveType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveRequest LeaveRequest_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveRequest LeaveRequest_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public."LeaveType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LedgerAccount LedgerAccount_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LedgerAccount"
    ADD CONSTRAINT "LedgerAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OfferLetter OfferLetter_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."OfferLetter"
    ADD CONSTRAINT "OfferLetter_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."Candidate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payroll Payroll_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Payroll"
    ADD CONSTRAINT "Payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Position Position_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Project Project_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Project Project_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuotationActivity QuotationActivity_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationActivity"
    ADD CONSTRAINT "QuotationActivity_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuotationItem QuotationItem_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quotation Quotation_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quotation Quotation_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quotation Quotation_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quotation Quotation_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalaryComponent SalaryComponent_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."SalaryComponent"
    ADD CONSTRAINT "SalaryComponent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalesTarget SalesTarget_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."SalesTarget"
    ADD CONSTRAINT "SalesTarget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalesTarget SalesTarget_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."SalesTarget"
    ADD CONSTRAINT "SalesTarget_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShiftRoster ShiftRoster_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ShiftRoster"
    ADD CONSTRAINT "ShiftRoster_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShiftRoster ShiftRoster_shiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ShiftRoster"
    ADD CONSTRAINT "ShiftRoster_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES public."Shift"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Shift Shift_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Subscription Subscription_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Task Task_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Timesheet Timesheet_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Timesheet"
    ADD CONSTRAINT "Timesheet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Timesheet Timesheet_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Timesheet"
    ADD CONSTRAINT "Timesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserRole UserRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quotation_templates quotation_templates_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT "quotation_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: applizor
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict hnbYQhCsz94SKrR5TPr9EnqvqMIr99eJSXU1jSlallMJXNGG00WZoyhk54rhhxI

